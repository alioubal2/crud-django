from django.conf import settings
from django.db import models


class Todo(models.Model):
    class Status(models.TextChoices):
        TODO = 'todo', 'à faire'
        IN_PROGRESS = 'in_progress', 'en cours'
        DONE = 'done', 'terminée'

    class Priority(models.TextChoices):
        LOW = 'low', 'basse'
        NORMAL = 'normal', 'normale'
        HIGH = 'high', 'haute'

    title = models.CharField('titre', max_length=200)
    description = models.TextField('description', blank=True)
    # Colonne du tableau dans laquelle se trouve la tâche.
    status = models.CharField('statut', max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField('priorité', max_length=10, choices=Priority.choices, default=Priority.NORMAL)
    due_date = models.DateField('échéance', null=True, blank=True)
    created_at = models.DateTimeField('créée le', auto_now_add=True)
    updated_at = models.DateTimeField('modifiée le', auto_now=True)
    # settings.AUTH_USER_MODEL plutôt qu'un import direct de User :
    # le modèle reste valable quel que soit le modèle utilisateur du projet.
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='todos',
        verbose_name='propriétaire',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'tâche'

    def __str__(self):
        return self.title
