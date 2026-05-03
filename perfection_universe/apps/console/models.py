from django.db import models

class SignalLog(models.Model):
    """A message/signal entry in the ship console story."""
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