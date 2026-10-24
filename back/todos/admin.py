from django.contrib import admin

from .models import Todo


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'completed', 'priority', 'due_date', 'created_at')
    list_filter = ('completed', 'priority')
    search_fields = ('title', 'owner__email')
