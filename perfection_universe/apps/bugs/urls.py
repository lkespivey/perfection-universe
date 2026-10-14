from django.urls import path
from .views import BugReportView

urlpatterns = [
    path('', BugReportView.as_view(), name='bug-report'),
]