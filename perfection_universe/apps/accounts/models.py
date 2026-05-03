from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=80, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    # Track which liminal rooms the user has unlocked
    unlocked_rooms = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} profile'