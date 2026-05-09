from django.contrib import admin
from .models import GameScore

@admin.register(GameScore)
class GameScoreAdmin(admin.ModelAdmin):
    list_display = ['user', 'game', 'mode', 'score', 'wave_reached', 'created_at']
    list_filter = ['game', 'mode']
    ordering = ['-score']