from django.db import models

class LiminalRoom(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    ambient_color = models.CharField(max_length=7, default='#2a003f')
    background_gradient = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    unlock_requirement = models.CharField(max_length=200, blank=True,
        help_text='Leave blank for always available')
    mars_level = models.PositiveIntegerField(default=0,
        help_text='Set to 3 for the secret Mars Level 3 room. 0 = always visible.')
    is_secret = models.BooleanField(default=False,
        help_text='Secret rooms are hidden until unlocked via passphrase.')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name