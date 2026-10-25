import re
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import PasswordResetCode, User

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
    verify_url = '/api/auth/password-reset/verify/'
    confirm_url = '/api/auth/password-reset/confirm/'
    new_password = 'nouveau-mot-de-passe-77'

    def setUp(self):
        # Le compteur de limitation (throttle) vit dans le cache : on repart de zéro.
        cache.clear()
        self.user = User.objects.create_user(
            email='alice@example.com', username='alice', password=PASSWORD,
        )

    def request_code(self):
        """Demande un code et le récupère dans les logs, comme dans le terminal."""
        with self.assertLogs('accounts', level='INFO') as logs:
            self.client.post(self.request_url, {'email': 'ALICE@example.com'}, format='json')
        return re.search(r'\b(\d{6})\b', logs.output[-1]).group(1)

    def verify(self, code, email='alice@example.com'):
        return self.client.post(self.verify_url, {'email': email, 'code': code}, format='json')

    def confirm(self, new_password=None):
        return self.client.post(self.confirm_url, {
            'new_password': new_password or self.new_password,
        }, format='json')

    def wrong_code(self, code):
        return '000000' if code != '000000' else '111111'

    def test_request_logs_code_and_stores_only_its_hash(self):
        code = self.request_code()

        reset_code = PasswordResetCode.objects.get(user=self.user)
        self.assertNotEqual(reset_code.code_hash, code)
        self.assertTrue(reset_code.matches(code))

    def test_request_with_unknown_email_gives_same_response_without_code(self):
        response = self.client.post(self.request_url, {'email': 'inconnu@example.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PasswordResetCode.objects.exists())

    def test_full_flow_changes_password_and_consumes_code(self):
        code = self.request_code()

        self.assertEqual(self.verify(code).status_code, status.HTTP_204_NO_CONTENT)
        response = self.confirm()

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.new_password))
        self.assertFalse(PasswordResetCode.objects.exists())
        # Ni le code ni la vérification ne resservent.
        self.assertEqual(self.confirm('encore-un-autre-88').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.verify(code).status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_without_verification_is_rejected(self):
        self.request_code()

        response = self.confirm()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
        self.assertTrue(self.user.check_password(PASSWORD))

    def test_verification_is_tied_to_the_visitor_session(self):
        code = self.request_code()
        self.verify(code)

        other_visitor = APIClient()
        response = other_visitor.post(self.confirm_url, {'new_password': self.new_password}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_new_code_invalidates_previous_verification(self):
        code = self.request_code()
        self.verify(code)
        self.request_code()

        self.assertEqual(self.confirm().status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_rejects_wrong_code_and_counts_attempt(self):
        code = self.request_code()

        response = self.verify(self.wrong_code(code))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
        self.assertEqual(PasswordResetCode.objects.get(user=self.user).attempts, 1)

    def test_verify_blocks_after_max_attempts(self):
        code = self.request_code()
        for _ in range(PasswordResetCode.MAX_ATTEMPTS):
            self.verify(self.wrong_code(code))

        # Même le bon code est refusé une fois les essais épuisés.
        self.assertEqual(self.verify(code).status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_rejects_code_for_another_email(self):
        code = self.request_code()

        self.assertEqual(self.verify(code, email='bob@example.com').status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_code_is_rejected_at_both_steps(self):
        code = self.request_code()
        self.verify(code)
        PasswordResetCode.objects.filter(user=self.user).update(
            created_at=timezone.now() - PasswordResetCode.VALIDITY - timedelta(seconds=1),
        )

        self.assertEqual(self.confirm().status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.verify(code).status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_rejects_malformed_code(self):
        response = self.verify('12ab')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', response.data)

    def test_weak_password_keeps_verification(self):
        code = self.request_code()
        self.verify(code)

        response = self.confirm('1234')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)
        self.assertEqual(self.confirm().status_code, status.HTTP_204_NO_CONTENT)

    def test_requests_are_throttled(self):
        for _ in range(5):
            self.client.post(self.request_url, {'email': 'inconnu@example.com'}, format='json')

        response = self.client.post(self.request_url, {'email': 'inconnu@example.com'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
