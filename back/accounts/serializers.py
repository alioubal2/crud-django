import logging

from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import PasswordResetCode, User

logger = logging.getLogger(__name__)

INVALID_RESET_CODE = 'Code invalide ou expiré. Demandez un nouveau code.'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username']


class RegisterSerializer(serializers.ModelSerializer):
    # write_only : le mot de passe est accepté en entrée mais jamais renvoyé.
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password']

    def validate_email(self, value):
        email = value.lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('Un compte existe déjà avec cette adresse e-mail.')
        return email

    def validate(self, attrs):
        # Applique les règles de AUTH_PASSWORD_VALIDATORS (longueur, mot de passe
        # trop courant, trop proche de l'e-mail...).
        candidate = User(email=attrs['email'], username=attrs['username'])
        try:
            password_validation.validate_password(attrs['password'], user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': list(error.messages)})
        return attrs

    def create(self, validated_data):
        # create_user hache le mot de passe : il n'est jamais stocké en clair.
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get('request'),
            email=attrs['email'].lower(),
            password=attrs['password'],
        )
        if user is None:
            # Message volontairement vague : on ne dit pas si c'est l'e-mail
            # ou le mot de passe qui est faux.
            raise serializers.ValidationError('E-mail ou mot de passe incorrect.')
        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def save(self):
        user = User.objects.filter(email__iexact=self.validated_data['email'], is_active=True).first()
        # Aucun code si le compte n'existe pas, mais la vue répond pareil dans
        # les deux cas : on ne révèle pas quelles adresses sont inscrites.
        if user is None or not user.has_usable_password():
            return

        code = PasswordResetCode.issue(user)
        # Pas d'envoi d'e-mail : le code s'affiche dans le terminal du serveur
        # (voir LOGGING dans settings.py).
        minutes = int(PasswordResetCode.VALIDITY.total_seconds() // 60)
        logger.info('Code de réinitialisation pour %s : %s (valable %s minutes)', user.email, code, minutes)


class PasswordResetVerifySerializer(serializers.Serializer):
    """Vérifie qu'un code est valable pour cet e-mail, sans le consommer."""

    email = serializers.EmailField()
    code = serializers.RegexField(r'^\d{6}$', error_messages={'invalid': 'Le code contient 6 chiffres.'})

    def validate(self, attrs):
        user = User.objects.filter(email__iexact=attrs['email'], is_active=True).first()
        reset_code = PasswordResetCode.objects.filter(user=user).first() if user else None
        if reset_code is None or not reset_code.is_usable():
            raise serializers.ValidationError(INVALID_RESET_CODE)

        if not reset_code.matches(attrs['code']):
            # Chaque erreur compte : après MAX_ATTEMPTS, le code est inutilisable.
            # Sans cette limite, on pourrait essayer le million de combinaisons.
            reset_code.attempts += 1
            reset_code.save(update_fields=['attempts'])
            raise serializers.ValidationError(INVALID_RESET_CODE)

        attrs['user'] = user
        attrs['reset_code'] = reset_code
        return attrs


class PasswordResetConfirmSerializer(PasswordResetVerifySerializer):
    """Revérifie le code (le client ne doit pas pouvoir sauter l'étape de
    vérification) puis enregistre le nouveau mot de passe."""

    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        attrs = super().validate(attrs)
        try:
            password_validation.validate_password(attrs['new_password'], user=attrs['user'])
        except DjangoValidationError as error:
            raise serializers.ValidationError({'new_password': list(error.messages)})
        return attrs

    def save(self):
        user = self.validated_data['user']
        # set_password hache le mot de passe. Le changer invalide aussi les
        # sessions ouvertes ailleurs.
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        # Le code ne sert qu'une fois.
        self.validated_data['reset_code'].delete()
        return user
