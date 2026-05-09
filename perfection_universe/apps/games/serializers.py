from rest_framework import serializers
from .models import GameScore

class GameScoreSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = GameScore
        fields = ['id', 'username', 'game', 'mode', 'score', 'wave_reached', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']