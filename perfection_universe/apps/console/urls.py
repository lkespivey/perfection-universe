from django.urls import path
from .views import SignalLogListView

urlpatterns = [
    path('signals/', SignalLogListView.as_view(), name='signal-logs'),
]