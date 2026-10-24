from rest_framework.routers import DefaultRouter

from .views import TodoViewSet

# Le routeur génère les routes du ViewSet :
#   /todos/       GET (liste), POST (création)
#   /todos/<id>/  GET, PUT, PATCH, DELETE
router = DefaultRouter()
router.register('todos', TodoViewSet, basename='todo')

urlpatterns = router.urls
