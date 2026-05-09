from django.urls import path
from .views import SignalLogListView, SpeakToSignalView

urlpatterns = [
    path('signals/', SignalLogListView.as_view(), name='signal-logs'),
    path('speak/', SpeakToSignalView.as_view(), name='speak-to-signal'),
]