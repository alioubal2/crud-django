# crud-django

Todo List avec un backend **Django + Django REST Framework** (PostgreSQL) et un frontend **Next.js** (App Router, TypeScript, Tailwind).

Chaque utilisateur crée un compte, se connecte avec son e-mail et gère uniquement ses propres tâches.

## Structure

```
back/    API Django (uv)
  config/     réglages, routes principales, endpoint /api/health/
  accounts/   modèle User (connexion par e-mail) et API d'authentification
  todos/      modèle Todo et API CRUD
front/   Interface Next.js (npm)
  app/        pages : /login, /register, /forgot-password, /dashboard
  components/ composants React (ui/ = composants shadcn/ui)
  lib/        types et appels à l'API
```

## Prérequis

- Python 3.12 et [uv](https://docs.astral.sh/uv/)
- Node.js 20+ et npm
- PostgreSQL

## Installation

### 1. Base de données

```bash
sudo -u postgres psql
```
```sql
CREATE USER todo_user WITH PASSWORD 'choisir_un_mot_de_passe';
CREATE DATABASE todo_db OWNER todo_user;
ALTER USER todo_user CREATEDB;  -- nécessaire pour les tests
\q
```

### 2. Backend

```bash
cd back
cp .env.example .env   # puis remplir les valeurs
uv run python -c "import secrets; print(secrets.token_urlsafe(50))"  # valeur pour DJANGO_SECRET_KEY
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser   # optionnel, pour /admin/
uv run python manage.py runserver
```

### 3. Frontend

```bash
cd front
cp .env.example .env.local
npm install
npm run dev
```

Ouvrir http://localhost:3000 (utiliser `localhost` et non `127.0.0.1`, sinon les cookies de session ne sont pas partagés).

## API

| Méthode | URL | Rôle | Accès |
|---|---|---|---|
| GET | `/api/health/` | Vérifie que l'API répond | public |
| GET | `/api/auth/csrf/` | Dépose le cookie `csrftoken` | public |
| POST | `/api/auth/register/` | Inscription (ouvre la session) | public + CSRF |
| POST | `/api/auth/login/` | Connexion | public + CSRF |
| POST | `/api/auth/logout/` | Déconnexion | connecté |
| GET | `/api/auth/me/` | Utilisateur connecté | connecté |
| POST | `/api/auth/password-reset/` | Génère un code à 6 chiffres, affiché dans le terminal de Django (5/heure) | public + CSRF |
| POST | `/api/auth/password-reset/verify/` | Vérifie le code (`email`, `code`) sans le consommer | public + CSRF |
| POST | `/api/auth/password-reset/confirm/` | Nouveau mot de passe avec `email`, `code` et `new_password` (code valable 10 min, 5 essais) | public + CSRF |
| GET, POST | `/api/todos/` | Lister, créer | connecté |
| GET, PATCH, PUT, DELETE | `/api/todos/<id>/` | Lire, modifier, supprimer | propriétaire |

Authentification par **session Django** (cookie `sessionid` HttpOnly) avec protection **CSRF** (en-tête `X-CSRFToken`).

## Tests

```bash
cd back
uv run python manage.py test
```

## Configuration de développement uniquement

`DEBUG = True`, origines `http://localhost:3000` et cookies non `Secure` : à adapter avant toute mise en production (`DEBUG = False`, `ALLOWED_HOSTS`, HTTPS, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`).
