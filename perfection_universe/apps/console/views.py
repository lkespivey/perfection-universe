from rest_framework import generics, permissions
from .models import SignalLog
from .serializers import SignalLogSerializer

class SignalLogListView(generics.ListAPIView):
    queryset = SignalLog.objects.filter(is_unlocked=True)
    serializer_class = SignalLogSerializer
    permission_classes = [permissions.AllowAny]