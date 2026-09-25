from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, CurrentUserView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('register', RegisterView.as_view(), name='auth-register-noslash'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('login', LoginView.as_view(), name='auth-login-noslash'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('me', CurrentUserView.as_view(), name='auth-me-noslash'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('token/refresh', TokenRefreshView.as_view(), name='auth-token-refresh-noslash'),
]
