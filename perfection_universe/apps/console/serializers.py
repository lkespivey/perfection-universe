from rest_framework import serializers
from .models import SignalLog, SignalResponse, SecretCode

class SignalLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignalLog
        fields = '__all__'

class SignalResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignalResponse
        fields = ['id', 'trigger_keywords', 'response_text', 'priority']