from django.conf import settings
from django.db import models


class Todo(models.Model):
    title = models.CharField('titre', max_length=200)
    description = models.TextField('description', blank=True)
    completed = models.BooleanField('terminée', default=False)
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
