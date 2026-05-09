from django.db import models
from django.contrib.auth.models import User

class GameScore(models.Model):
    GAME_CHOICES = [
        ('asteroid_drift', 'Asteroid Drift'),
        ('echo_match', 'Echo Match'),
        ('signal_alignment', 'Signal Alignment'),
    ]
    MODE_CHOICES = [('arcade', 'Arcade'), ('story', 'Story')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scores')
    game = models.CharField(max_length=50, choices=GAME_CHOICES, default='asteroid_drift')
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='arcade')
    score = models.PositiveIntegerField(default=0)
    wave_reached = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score']

    def __str__(self):
        return f'{self.user.username} — {self.game} — {self.score}'