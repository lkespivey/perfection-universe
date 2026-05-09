from django.contrib import admin
from .models import SignalLog, SignalResponse, SecretCode

@admin.register(SignalLog)
class SignalLogAdmin(admin.ModelAdmin):
    list_display = ['title', 'signal_type', 'stardate', 'is_unlocked', 'order']
    list_editable = ['is_unlocked', 'order']
    list_filter = ['signal_type']

@admin.register(SignalResponse)
class SignalResponseAdmin(admin.ModelAdmin):
    list_display = ['trigger_keywords', 'mars_stage_min', 'is_active']
    list_editable = ['mars_stage_min', 'is_active']
    list_filter = ['mars_stage_min']
    help_text = 'Higher mars_stage_min = shown when signal is more corrupted/lying.'

@admin.register(SecretCode)
class SecretCodeAdmin(admin.ModelAdmin):
    list_display = ['phrase', 'room_slug', 'is_active']