from django.contrib import admin
from .models import LiminalRoom

@admin.register(LiminalRoom)
class LiminalRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'order']
    list_editable = ['is_active', 'order']
    prepopulated_fields = {'slug': ('name',)}