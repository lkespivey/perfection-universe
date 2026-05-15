from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT auth endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # App API routes
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/home/', include('apps.home.urls')),
    path('api/console/', include('apps.console.urls')),
    path('api/rooms/', include('apps.rooms.urls')),
    path('api/games/', include('apps.games.urls')),
    path('api/map/', include('apps.map.urls')),
    path('api/storyline/', include('apps.storyline.urls')),
]