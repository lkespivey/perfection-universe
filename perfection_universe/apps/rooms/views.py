from rest_framework import generics, permissions
from .models import LiminalRoom
from .serializers import LiminalRoomSerializer

class RoomListView(generics.ListAPIView):
    queryset = LiminalRoom.objects.filter(is_active=True)
    serializer_class = LiminalRoomSerializer
    permission_classes = [permissions.AllowAny]

class RoomDetailView(generics.RetrieveAPIView):
    queryset = LiminalRoom.objects.filter(is_active=True)
    serializer_class = LiminalRoomSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]