from django.contrib import admin
from .models import StoryAct, StoryEntry


class StoryEntryInline(admin.TabularInline):
    model = StoryEntry
    extra = 1
    fields = [
        'order', 'author', 'entry_type', 'title', 'stardate',
        'is_unlocked', 'unlock_at_mars_stage', 'is_corrupted', 'is_redacted',
    ]
    ordering = ['order']


@admin.register(StoryAct)
class StoryActAdmin(admin.ModelAdmin):
    list_display = ['act_number', 'title', 'is_active', 'unlock_at_mars_stage']
    list_editable = ['is_active', 'unlock_at_mars_stage']
    inlines = [StoryEntryInline]


@admin.register(StoryEntry)
class StoryEntryAdmin(admin.ModelAdmin):
    list_display = ['act', 'author', 'entry_type', 'title', 'stardate', 'is_unlocked', 'unlock_at_mars_stage', 'is_corrupted', 'is_redacted', 'order']
    list_editable = ['is_unlocked', 'unlock_at_mars_stage', 'is_corrupted', 'is_redacted', 'order']
    list_filter = ['act', 'author', 'entry_type']
    search_fields = ['title', 'content']