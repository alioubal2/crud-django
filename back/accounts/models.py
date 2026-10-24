import secrets
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Utilisateur du projet : il se connecte avec son e-mail.

    On hérite de AbstractUser pour réutiliser tout ce que Django fournit
    (hachage des mots de passe, permissions, admin) et on ne change que
    l'identifiant de connexion.
    """

    # AbstractUser définit déjà un champ email, mais facultatif et non unique.
    # Pour s'en servir comme identifiant, il doit être obligatoire et unique.
    email = models.EmailField('adresse e-mail', unique=True)

    # Champ utilisé par authenticate() et par le formulaire de l'admin.
    USERNAME_FIELD = 'email'
    # Champs demandés en plus par la commande createsuperuser.
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class PasswordResetCode(models.Model):
    """Code à usage unique pour réinitialiser un mot de passe.

    Un seul code actif par utilisateur. Le code lui-même n'est jamais stocké :
    on garde son empreinte (hachée comme un mot de passe), comme ça une fuite
    de la base ne permet pas de l'utiliser.
    """

    VALIDITY = timedelta(minutes=10)
    MAX_ATTEMPTS = 5

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_code',
        verbose_name='utilisateur',
    )
    code_hash = models.CharField('empreinte du code', max_length=128)
    created_at = models.DateTimeField('créé le', default=timezone.now)
    attempts = models.PositiveSmallIntegerField('essais', default=0)

    class Meta:
        verbose_name = 'code de réinitialisation'

    @classmethod
    def issue(cls, user):
        """Crée (ou remplace) le code de l'utilisateur et renvoie le code en clair."""
        # secrets plutôt que random : tirage imprévisible, adapté à la sécurité.
        code = f'{secrets.randbelow(1_000_000):06d}'
        cls.objects.update_or_create(
            user=user,
            defaults={'code_hash': make_password(code), 'created_at': timezone.now(), 'attempts': 0},
        )
        return code

    def is_usable(self):
        return self.attempts < self.MAX_ATTEMPTS and timezone.now() < self.created_at + self.VALIDITY

    def matches(self, code):
        return check_password(code, self.code_hash)
