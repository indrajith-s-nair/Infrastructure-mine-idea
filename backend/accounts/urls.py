from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    RecoverUsernameView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('register', RegisterView.as_view(), name='auth-register-noslash'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('login', LoginView.as_view(), name='auth-login-noslash'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('me', CurrentUserView.as_view(), name='auth-me-noslash'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('token/refresh', TokenRefreshView.as_view(), name='auth-token-refresh-noslash'),
    
    # Citizen Credential & Password Recovery Endpoints
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/request', PasswordResetRequestView.as_view(), name='password-reset-request-noslash'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password-reset/confirm', PasswordResetConfirmView.as_view(), name='password-reset-confirm-noslash'),
    path('recover-username/', RecoverUsernameView.as_view(), name='recover-username'),
    path('recover-username', RecoverUsernameView.as_view(), name='recover-username-noslash'),
]

