from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import GameScore
from .serializers import GameScoreSerializer


class SubmitScoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = GameScoreSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class LeaderboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        game = request.query_params.get('game', 'asteroid_drift')
        mode = request.query_params.get('mode', 'arcade')

        # Top 10 globally
        top_scores = GameScore.objects.filter(
            game=game, mode=mode
        ).order_by('-score')[:10]

        # Personal best if logged in
        personal_best = None
        if request.user.is_authenticated:
            pb = GameScore.objects.filter(
                user=request.user, game=game, mode=mode
            ).order_by('-score').first()
            if pb:
                personal_best = GameScoreSerializer(pb).data

        return Response({
            'leaderboard': GameScoreSerializer(top_scores, many=True).data,
            'personal_best': personal_best,
        })