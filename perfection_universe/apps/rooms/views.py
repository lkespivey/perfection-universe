from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import LiminalRoom
from .serializers import LiminalRoomSerializer

class RoomListView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # don't require auth header at all

    def get(self, request):
        unlocked = []
        # Manually check auth without requiring it
        from rest_framework_simplejwt.authentication import JWTAuthentication
        try:
            auth = JWTAuthentication()
            result = auth.authenticate(request)
            if result:
                user, _ = result
                unlocked = user.profile.unlocked_rooms
        except Exception:
            pass

        rooms = LiminalRoom.objects.filter(is_active=True)
        visible = [r for r in rooms if not r.is_secret or r.slug in unlocked]
        return Response(LiminalRoomSerializer(visible, many=True).data)

class RoomDetailView(generics.RetrieveAPIView):
    queryset = LiminalRoom.objects.filter(is_active=True)
    serializer_class = LiminalRoomSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]