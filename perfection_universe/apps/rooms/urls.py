from django.urls import path
from .views import RoomListView, RoomDetailView

urlpatterns = [
    path('', RoomListView.as_view(), name='room-list'),
    path('<slug:slug>/', RoomDetailView.as_view(), name='room-detail'),
]