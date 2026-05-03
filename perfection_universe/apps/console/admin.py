from django.contrib import admin
from .models import SignalLog

@admin.register(SignalLog)
class SignalLogAdmin(admin.ModelAdmin):
    list_display = ['title', 'signal_type', 'stardate', 'is_unlocked', 'order']
    list_editable = ['is_unlocked', 'order']
    list_filter = ['signal_type']