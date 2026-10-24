from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Todo


class TodoApiTests(APITestCase):
    list_url = '/api/todos/'

    def setUp(self):
        self.alice = User.objects.create_user(
            email='alice@example.com', username='alice', password='motdepasse-solide-42',
        )
        self.bob = User.objects.create_user(
            email='bob@example.com', username='bob', password='motdepasse-solide-42',
        )
        self.client.force_login(self.alice)

    def detail_url(self, todo):
        return f'/api/todos/{todo.id}/'

    def test_health_is_public(self):
        self.client.logout()

        response = self.client.get('/api/health/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'status': 'ok'})

    def test_anonymous_cannot_access_todos(self):
        self.client.logout()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_todo_sets_owner_from_session(self):
        # Le champ owner envoyé par le client doit être ignoré.
        response = self.client.post(self.list_url, {
            'title': 'Acheter du pain', 'owner': self.bob.id,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        todo = Todo.objects.get(id=response.data['id'])
        self.assertEqual(todo.owner, self.alice)
        self.assertFalse(todo.completed)
        self.assertEqual(todo.description, '')

    def test_create_todo_requires_title(self):
        response = self.client.post(self.list_url, {'title': '   '}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)

    def test_list_only_returns_own_todos(self):
        Todo.objects.create(title='Tâche Alice', owner=self.alice)
        Todo.objects.create(title='Tâche Bob', owner=self.bob)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([todo['title'] for todo in response.data], ['Tâche Alice'])

    def test_update_and_toggle_todo(self):
        todo = Todo.objects.create(title='Ancien titre', owner=self.alice)

        response = self.client.patch(self.detail_url(todo), {
            'title': 'Nouveau titre', 'completed': True,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        todo.refresh_from_db()
        self.assertEqual(todo.title, 'Nouveau titre')
        self.assertTrue(todo.completed)

    def test_delete_todo(self):
        todo = Todo.objects.create(title='À supprimer', owner=self.alice)

        response = self.client.delete(self.detail_url(todo))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Todo.objects.filter(id=todo.id).exists())

    def test_cannot_read_update_or_delete_other_users_todo(self):
        bobs_todo = Todo.objects.create(title='Tâche Bob', owner=self.bob)
        url = self.detail_url(bobs_todo)

        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.patch(url, {'completed': True}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)
        bobs_todo.refresh_from_db()
        self.assertFalse(bobs_todo.completed)
