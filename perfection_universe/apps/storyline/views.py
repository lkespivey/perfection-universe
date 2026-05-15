from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import StoryAct
from .serializers import StoryActSerializer


class StorylineView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        mars_stage = 0
        if request.user.is_authenticated:
            try:
                mars_stage = request.user.profile.mars_stage
            except Exception:
                pass

        acts = StoryAct.objects.filter(
            is_active=True,
            unlock_at_mars_stage__lte=mars_stage,
        )
        serializer = StoryActSerializer(acts, many=True, context={'mars_stage': mars_stage})

        # Also send locked acts so frontend can show them as locked
        locked_acts = StoryAct.objects.filter(
            is_active=True,
            unlock_at_mars_stage__gt=mars_stage,
        )
        locked_data = [
            {
                'id': a.id,
                'act_number': a.act_number,
                'title': a.title,
                'subtitle': a.subtitle,
                'locked': True,
                'unlock_at_mars_stage': a.unlock_at_mars_stage,
            }
            for a in locked_acts
        ]

        return Response({
            'mars_stage': mars_stage,
            'acts': serializer.data,
            'locked_acts': locked_data,
        })