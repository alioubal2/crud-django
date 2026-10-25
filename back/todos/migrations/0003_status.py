from django.db import migrations, models


def completed_to_status(apps, schema_editor):
    """Les tâches déjà terminées vont dans la colonne « terminée »."""
    Todo = apps.get_model('todos', 'Todo')
    Todo.objects.filter(completed=True).update(status='done')


def status_to_completed(apps, schema_editor):
    """Retour arrière : seule la colonne « terminée » compte comme terminée."""
    Todo = apps.get_model('todos', 'Todo')
    Todo.objects.filter(status='done').update(completed=True)


class Migration(migrations.Migration):
    """Remplace le booléen completed par un statut à trois valeurs (colonnes du tableau).

    En trois temps pour ne perdre aucune donnée : ajout du champ, recopie, suppression.
    """

    dependencies = [
        ('todos', '0002_priority_due_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='todo',
            name='status',
            field=models.CharField(
                choices=[('todo', 'à faire'), ('in_progress', 'en cours'), ('done', 'terminée')],
                default='todo',
                max_length=20,
                verbose_name='statut',
            ),
        ),
        migrations.RunPython(completed_to_status, status_to_completed),
        migrations.RemoveField(
            model_name='todo',
            name='completed',
        ),
    ]
