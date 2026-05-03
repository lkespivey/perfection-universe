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
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name