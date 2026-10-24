from rest_framework import serializers

from .models import Todo


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = [
            'id', 'title', 'description', 'status', 'priority', 'due_date',
            'created_at', 'updated_at', 'owner',
        ]
        # owner est en lecture seule : une valeur envoyée par le client est ignorée.
        # C'est la vue qui l'impose à partir de l'utilisateur connecté.
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner']
