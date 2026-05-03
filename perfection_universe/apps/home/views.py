from rest_framework.views import APIView
from rest_framework.response import Response

class HomeView(APIView):
    def get(self, request):
        return Response({
            'title': 'The In-Between',
            'tagline': 'A space where memories drift, signals echo, and songs become places.',
            'signal_active': False,
        })