from rest_framework import serializers
from .models import SignalLog

class SignalLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignalLog
        fields = '__all__'