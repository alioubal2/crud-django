import re
from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import User

PASSWORD = 'motdepasse-solide-42'


class RegisterTests(APITestCase):
    url = '/api/auth/register/'

    def test_register_creates_user_and_logs_in(self):
        response = self.client.post(self.url, {
            'email': 'Alice@Example.com',
            'username': 'alice',
            'password': PASSWORD,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'alice@example.com')
        self.assertNotIn('password', response.data)
        user = User.objects.get(email='alice@example.com')
        self.assertNotEqual(user.password, PASSWORD)
        self.assertTrue(user.check_password(PASSWORD))
        # La session est ouverte : /me/ répond.
        self.assertEqual(self.client.get('/api/auth/me/').status_code, status.HTTP_200_OK)

    def test_register_rejects_duplicate_email_case_insensitive(self):
        User.objects.create_user(email='alice@example.com', username='alice', password=PASSWORD)

        response = self.client.post(self.url, {
            'email': 'ALICE@example.com',
            'username': 'alice2',
            'password': PASSWORD,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_rejects_weak_password(self):
        response = self.client.post(self.url, {
            'email': 'bob@example.com',
            'username': 'bob',
            'password': '1234',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class LoginLogoutTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='alice@example.com', username='alice', password=PASSWORD,
        )

    def test_login_with_valid_credentials(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'alice@example.com', 'password': PASSWORD,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'alice@example.com')
        self.assertIn('sessionid', response.cookies)
        self.assertTrue(response.cookies['sessionid']['httponly'])

    def test_login_with_wrong_password(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'alice@example.com', 'password': 'mauvais',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_requires_authentication(self):
        response = self.client.get('/api/auth/me/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_ends_session(self):
        self.client.force_login(self.user)

        response = self.client.post('/api/auth/logout/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get('/api/auth/me/').status_code, status.HTTP_401_UNAUTHORIZED)


class CsrfTests(APITestCase):
    """Le client de test désactive le CSRF par défaut : on le réactive ici."""

    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        User.objects.create_user(email='alice@example.com', username='alice', password=PASSWORD)

    def test_login_without_csrf_token_is_rejected(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'alice@example.com', 'password': PASSWORD,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_with_csrf_token_succeeds(self):
        self.client.get('/api/auth/csrf/')
        token = self.client.cookies['csrftoken'].value

        response = self.client.post('/api/auth/login/', {
            'email': 'alice@example.com', 'password': PASSWORD,
        }, format='json', HTTP_X_CSRFTOKEN=token)

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PasswordResetTests(APITestCase):
    request_url = '/api/auth/password-reset/'
    confirm_url = '/api/auth/password-reset/confirm/'
    new_password = 'nouveau-mot-de-passe-77'

    def setUp(self):
        # Le compteur de limitation (throttle) vit dans le cache : on repart de zéro.
        cache.clear()
        self.user = User.objects.create_user(
            email='alice@example.com', username='alice', password=PASSWORD,
        )

    def request_reset_link(self):
        """Demande un lien et renvoie les paramètres uid et token de l'e-mail envoyé."""
        self.client.post(self.request_url, {'email': 'ALICE@example.com'}, format='json')
        link = re.search(r'http://\S+', mail.outbox[-1].body).group()
        params = parse_qs(urlparse(link).query)
        return params['uid'][0], params['token'][0]

    def test_request_sends_email_with_link(self):
        response = self.client.post(self.request_url, {'email': 'alice@example.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['alice@example.com'])
        self.assertIn('http://localhost:3000/reset-password?uid=', mail.outbox[0].body)

    def test_request_with_unknown_email_gives_same_response_without_email(self):
        response = self.client.post(self.request_url, {'email': 'inconnu@example.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_changes_password(self):
        uid, token = self.request_reset_link()

        response = self.client.post(self.confirm_url, {
            'uid': uid, 'token': token, 'new_password': self.new_password,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.new_password))
        self.assertFalse(self.user.check_password(PASSWORD))

    def test_link_cannot_be_used_twice(self):
        uid, token = self.request_reset_link()
        payload = {'uid': uid, 'token': token, 'new_password': self.new_password}
        self.client.post(self.confirm_url, payload, format='json')

        response = self.client.post(self.confirm_url, {**payload, 'new_password': 'encore-un-autre-88'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_confirm_rejects_invalid_token(self):
        uid, _ = self.request_reset_link()

        response = self.client.post(self.confirm_url, {
            'uid': uid, 'token': 'faux-jeton', 'new_password': self.new_password,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(self.user.check_password(PASSWORD))

    def test_confirm_rejects_weak_password(self):
        uid, token = self.request_reset_link()

        response = self.client.post(self.confirm_url, {
            'uid': uid, 'token': token, 'new_password': '1234',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

    def test_requests_are_throttled(self):
        for _ in range(5):
            self.client.post(self.request_url, {'email': 'alice@example.com'}, format='json')

        response = self.client.post(self.request_url, {'email': 'alice@example.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
