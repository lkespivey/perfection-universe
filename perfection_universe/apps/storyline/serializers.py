from rest_framework import serializers
from .models import StoryAct, StoryEntry


class StoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryEntry
        fields = [
            'id', 'author', 'entry_type', 'title', 'stardate',
            'content', 'signal_version', 'order',
            'is_corrupted', 'is_redacted',
        ]


class StoryActSerializer(serializers.ModelSerializer):
    entries = serializers.SerializerMethodField()

    class Meta:
        model = StoryAct
        fields = ['id', 'act_number', 'title', 'subtitle', 'description', 'entries']

    def get_entries(self, obj):
        mars_stage = self.context.get('mars_stage', 0)
        entries = obj.entries.filter(
            is_unlocked=True,
            unlock_at_mars_stage__lte=mars_stage,
        )
        return StoryEntrySerializer(entries, many=True).data