from django.db import models

class SignalLog(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    signal_type = models.CharField(max_length=50, choices=[
        ('transmission', 'Transmission'),
        ('memory', 'Memory Fragment'),
        ('system', 'System Alert'),
        ('anomaly', 'Anomaly'),
    ], default='transmission')
    stardate = models.CharField(max_length=100, blank=True)
    is_unlocked = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class SignalResponse(models.Model):
    """
    A pre-written signal response.
    mars_stage_min: the MINIMUM mars stage at which this response becomes active.
    When multiple responses match the same keyword, the one with the highest
    mars_stage_min that is <= the user's current stage wins.
    This lets the same keyword return different answers as Mars progresses.
    """
    trigger_keywords = models.CharField(max_length=300,
        help_text='Comma-separated. e.g. "mars,home,red"')
    response_text = models.TextField()
    mars_stage_min = models.PositiveIntegerField(default=0,
        help_text='0=always honest, 1=slightly off, 2=unreliable, 3=fully lying/broken')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['mars_stage_min']

    def __str__(self):
        return f'[Stage {self.mars_stage_min}+] {self.trigger_keywords[:40]}'


class SecretCode(models.Model):
    phrase = models.CharField(max_length=200,
        help_text='Case-insensitive passphrase the user must type.')
    room_slug = models.CharField(max_length=200)
    unlock_message = models.TextField(default='ACCESS GRANTED. THE ROOM IS OPEN.')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'Code: "{self.phrase}" → {self.room_slug}'