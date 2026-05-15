from django.urls import path
from .views import StorylineView

urlpatterns = [
    path('', StorylineView.as_view(), name='storyline'),
]