from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    """Dépose le cookie csrftoken que le front renverra dans l'en-tête X-CSRFToken."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


# DRF ne vérifie le CSRF que pour les utilisateurs déjà connectés. On force la
# vérification sur l'inscription et la connexion pour bloquer le « login CSRF »
# (un site tiers qui connecterait le visiteur à un compte choisi par l'attaquant).
@method_decorator(csrf_protect, name='dispatch')
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Connecte directement le nouvel utilisateur.
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        # Crée la session et envoie le cookie sessionid (HttpOnly).
        login(request, user)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    def post(self, request):
        # Supprime la session côté serveur : le cookie devient inutilisable.
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """Renvoie l'utilisateur connecté, ou 401 si la session est absente ou expirée."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
