from django.db import models

class BugReport(models.Model):
    name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    category = models.CharField(max_length=200)
    severity = models.CharField(max_length=20)
    page = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    steps = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.severity.upper()}] {self.category} — {self.created_at.strftime("%Y-%m-%d")}'