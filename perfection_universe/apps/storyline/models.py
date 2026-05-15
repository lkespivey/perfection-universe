from django.db import models

class StoryAct(models.Model):
    act_number = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True,
        help_text='Shown as a brief intro before the entries load.')
    is_active = models.BooleanField(default=True,
        help_text='If false, this act is completely hidden.')
    unlock_at_mars_stage = models.PositiveIntegerField(default=0,
        help_text='0 = always visible. 1-3 = unlocks when player reaches that stage.')

    class Meta:
        ordering = ['act_number']

    def __str__(self):
        return f'Act {self.act_number} — {self.title}'


class StoryEntry(models.Model):
    AUTHOR_CHOICES = [
        ('PERFECTION', 'PERFECTION'),
        ('SIGNAL', 'SIGNAL'),
        ('SYSTEM', 'SYSTEM'),
    ]
    TYPE_CHOICES = [
        ('log', 'Captain\'s Log'),
        ('transmission', 'Transmission'),
        ('system_alert', 'System Alert'),
        ('recovered_file', 'Recovered File'),
        ('redacted', 'Redacted'),
    ]

    act = models.ForeignKey(StoryAct, on_delete=models.CASCADE, related_name='entries')
    author = models.CharField(max_length=20, choices=AUTHOR_CHOICES, default='PERFECTION')
    entry_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='log')
    title = models.CharField(max_length=200)
    stardate = models.CharField(max_length=100, blank=True)
    content = models.TextField()
    signal_version = models.TextField(blank=True,
        help_text='The signal\'s version of this same event. Leave blank if none.')
    order = models.PositiveIntegerField(default=0)
    is_unlocked = models.BooleanField(default=True)
    unlock_at_mars_stage = models.PositiveIntegerField(default=0,
        help_text='0 = always visible if is_unlocked is true.')
    is_corrupted = models.BooleanField(default=False,
        help_text='Renders content with a glitch/corruption effect.')
    is_redacted = models.BooleanField(default=False,
        help_text='Shows the entry but blacks out content with redaction bars.')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'[Act {self.act.act_number}] {self.author} — {self.title}'