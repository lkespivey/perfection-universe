from django.contrib import admin
from .models import BugReport

@admin.register(BugReport)
class BugReportAdmin(admin.ModelAdmin):
    list_display = ['severity', 'category', 'name', 'page', 'created_at', 'resolved']
    list_editable = ['resolved']
    list_filter = ['severity', 'category', 'resolved']
    readonly_fields = ['name', 'email', 'category', 'severity', 'page', 'description', 'steps', 'created_at']
    ordering = ['-created_at']