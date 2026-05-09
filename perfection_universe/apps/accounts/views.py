from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer
from .models import UserProfile

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UpdateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return the full user object so the frontend stays in sync
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=400)