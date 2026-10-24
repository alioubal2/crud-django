from rest_framework import viewsets

from .serializers import TodoSerializer


class TodoViewSet(viewsets.ModelViewSet):
    """CRUD des tâches de l'utilisateur connecté.

    La permission IsAuthenticated vient de REST_FRAMEWORK dans settings.py.
    """

    serializer_class = TodoSerializer

    def get_queryset(self):
        # Toutes les opérations (liste, détail, modification, suppression)
        # partent de ce queryset : la tâche d'un autre utilisateur est
        # introuvable et renvoie donc 404.
        return self.request.user.todos.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
