from django.contrib.auth.models import AbstractUser
from django.db import models


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
