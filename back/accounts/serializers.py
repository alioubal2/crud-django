from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User


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
