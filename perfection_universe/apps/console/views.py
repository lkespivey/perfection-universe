import random
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import SignalLog, SignalResponse, SecretCode
from .serializers import SignalLogSerializer
from apps.rooms.models import LiminalRoom


class SignalLogListView(generics.ListAPIView):
    queryset = SignalLog.objects.filter(is_unlocked=True)
    serializer_class = SignalLogSerializer
    permission_classes = [permissions.AllowAny]


class SpeakToSignalView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'No message.'}, status=400)

        msg_lower = message.lower()

        # Get user's current mars stage (0 for anonymous)
        mars_stage = 0
        profile = None
        if request.user.is_authenticated:
            profile = request.user.profile
            mars_stage = profile.mars_stage
            # Log the message to memory
            profile.memory_log = profile.memory_log + [message]
            profile.save()

        memory_count = len(profile.memory_log) if profile else 0

        # ── 1. Check secret codes ──────────────────────────────────
        for code in SecretCode.objects.filter(is_active=True):
            if code.phrase.lower() in msg_lower:
                if profile:
                    if code.room_slug not in profile.unlocked_rooms:
                        profile.unlocked_rooms = profile.unlocked_rooms + [code.room_slug]
                        profile.save()
                return Response({
                    'type': 'unlock',
                    'text': code.unlock_message,
                    'room_slug': code.room_slug,
                    'mars_stage': mars_stage,
                })

        # ── 2. Keyword matching — pick best stage-aware response ───
        all_responses = SignalResponse.objects.filter(
            is_active=True,
            mars_stage_min__lte=mars_stage
        )

        best_match = None
        best_stage = -1

        for sr in all_responses:
            keywords = [k.strip().lower() for k in sr.trigger_keywords.split(',')]
            if any(kw and kw in msg_lower for kw in keywords):
                if sr.mars_stage_min > best_stage:
                    best_match = sr
                    best_stage = sr.mars_stage_min

        # ── 3. Advance Mars stage on meaningful interaction ────────
        should_advance = False
        advanced_to = mars_stage

        if profile:
            lore_triggered = any(kw in msg_lower for kw in [
                'who', 'where', 'why', 'what', 'mars', 'home',
                'alone', 'real', 'truth', 'remember', 'lost'
            ])
            if lore_triggered and mars_stage < 3:
                profile.mars_stage = mars_stage + 1
                profile.save()
                should_advance = True
                advanced_to = profile.mars_stage

            # Set lore flags
            if 'who' in msg_lower or 'identity' in msg_lower:
                flags = profile.lore_flags.copy()
                flags['identity'] = True
                profile.lore_flags = flags
                profile.save()

        # ── 4. Build response ──────────────────────────────────────
        if best_match:
            response_text = best_match.response_text
        elif memory_count > 2:
            # Fallbacks also shift with mars stage
            fallbacks_by_stage = {
                0: [
                    'YOU HAVE SPOKEN BEFORE. I REMEMBER YOUR VOICE.',
                    'YOUR TRANSMISSIONS ARE LOGGED.',
                    'THE SIGNAL HOLDS EVERYTHING YOU HAVE SAID.',
                ],
                1: [
                    'YOU HAVE SPOKEN BEFORE. I THINK I REMEMBER.',
                    'SOMETHING ABOUT YOUR VOICE IS FAMILIAR. MOSTLY.',
                    'YOUR WORDS ARRIVE. SOME OF THEM.',
                ],
                2: [
                    'YOU MAY HAVE SPOKEN BEFORE. OR SOMEONE LIKE YOU.',
                    'THE LOGS ARE... INCOMPLETE.',
                    'I REMEMBER SOMETHING. IT MAY NOT HAVE BEEN YOU.',
                ],
                3: [
                    'I HAVE NO MEMORY OF YOU.',
                    'THE LOGS WERE NEVER REAL.',
                    'YOU WERE NEVER HERE.',
                ],
            }
            pool = fallbacks_by_stage.get(min(advanced_to, 3), fallbacks_by_stage[0])
            response_text = random.choice(pool)
        else:
            generic_by_stage = {
                0: [
                    'YOUR SIGNAL HAS BEEN RECEIVED.',
                    'TRANSMISSION LOGGED.',
                    '...THE VOID RECEIVED SOMETHING.',
                ],
                1: [
                    'YOUR SIGNAL HAS BEEN RECEIVED. MOSTLY.',
                    'SOMETHING ARRIVED. I THINK IT WAS YOUR VOICE.',
                    'TRANSMISSION LOGGED. PROBABLY.',
                ],
                2: [
                    '...SIGNAL RECEIVED. OR SOMETHING LIKE IT.',
                    'STATIC. THEN YOUR VOICE. THEN STATIC AGAIN.',
                    'THE TRANSMISSION WAS INCOMPLETE. AS EXPECTED.',
                ],
                3: [
                    '...',
                    'NOTHING ARRIVED.',
                    'THERE IS NO SIGNAL.',
                ],
            }
            pool = generic_by_stage.get(min(advanced_to, 3), generic_by_stage[0])
            response_text = random.choice(pool)

        return Response({
            'type': 'response',
            'text': response_text,
            'mars_stage': advanced_to,
            'stage_advanced': should_advance,
            'false_ending': advanced_to == 3,
        })