from rest_framework import serializers
from .models import LiminalRoom

class LiminalRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiminalRoom
        fields = '__all__'