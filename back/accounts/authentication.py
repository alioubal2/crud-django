from rest_framework.authentication import SessionAuthentication


class SessionAuthentication401(SessionAuthentication):
    """Authentification par session qui répond 401 au lieu de 403.

    Sans en-tête WWW-Authenticate, DRF transforme « non connecté » en 403.
    En le fournissant, on distingue clairement :
      - 401 : pas connecté (ou session expirée) -> le front renvoie vers /login
      - 403 : connecté mais action refusée (par exemple jeton CSRF invalide)
    """

    def authenticate_header(self, request):
        return 'Session'
