from django.conf import settings
from django.contrib.auth import authenticate, password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers

from .models import User

INVALID_RESET_LINK = 'Ce lien de réinitialisation est invalide ou a expiré.'


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
        # Aucun e-mail si le compte n'existe pas, mais la vue répond pareil dans
        # les deux cas : on ne révèle pas quelles adresses sont inscrites.
        if user is None or not user.has_usable_password():
            return

        # uid : identifiant de l'utilisateur encodé pour tenir dans une URL.
        # token : signature liée au mot de passe actuel et à la dernière connexion,
        # donc inutilisable une fois le mot de passe changé (lien à usage unique).
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f'{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}'
        minutes = settings.PASSWORD_RESET_TIMEOUT // 60

        send_mail(
            subject='Réinitialisation de votre mot de passe',
            message=(
                f'Bonjour {user.username},\n\n'
                f'Pour choisir un nouveau mot de passe, ouvrez ce lien (valable {minutes} minutes) :\n'
                f'{link}\n\n'
                "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : "
                'votre mot de passe actuel reste valable.'
            ),
            from_email=None,
            recipient_list=[user.email],
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=user_id, is_active=True)
        except (ValueError, TypeError, OverflowError, User.DoesNotExist):
            user = None
        if user is None or not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError(INVALID_RESET_LINK)

        try:
            password_validation.validate_password(attrs['new_password'], user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'new_password': list(error.messages)})

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        # set_password hache le mot de passe. Le changer invalide aussi les sessions
        # ouvertes ailleurs, ainsi que le lien qui vient d'être utilisé.
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user
