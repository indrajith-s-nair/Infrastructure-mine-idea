import random
from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from complaints.emails import _send_email_async
from .models import User, PasswordResetOTP
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    RecoverUsernameSerializer,
)


def _mask_email(email: str) -> str:
    """Masks email for privacy e.g. citizen@example.gov.in -> c***n@example.gov.in"""
    if not email or '@' not in email:
        return '***@***.***'
    user_part, domain = email.split('@', 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + '***'
    else:
        masked_user = user_part[0] + '***' + user_part[-1]
    return f"{masked_user}@{domain}"


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Citizen account created successfully.',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone_number': user.phone_number,
                'is_staff': user.is_staff,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            'message': 'Logged in successfully.',
            **serializer.validated_data
        }, status=status.HTTP_200_OK)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """
    Step 1: Citizen requests password reset OTP by entering registered email or phone number.
    Generates a secure 6-digit numeric OTP valid for 15 minutes and dispatches an alert email.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier']

        user = User.objects.filter(email__iexact=identifier).first()
        if not user:
            user = User.objects.filter(phone_number__icontains=identifier.replace(' ', '')).first()

        if not user:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Invalidate previous unused OTPs
        PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=15)

        PasswordResetOTP.objects.create(
            user=user,
            otp_code=otp_code,
            expires_at=expires_at
        )

        # Send recovery email
        subject = f"DPIP Security: Password Reset Verification Code [{otp_code}]"
        text_body = (
            f"Dear {user.name},\n\n"
            f"You requested to reset your password on the Digital Public Infrastructure Portal (DPIP).\n\n"
            f"Your 6-Digit One-Time Password (OTP) is: {otp_code}\n\n"
            f"This code will expire in 15 minutes ({expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}).\n"
            f"If you did not make this request, please ignore this email or contact the DPIP Security Desk.\n\n"
            f"Digital Public Infrastructure Portal\nGovernment Grievance Redressal Network"
        )
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; color: #ffffff; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Digital Public Infrastructure Portal</h2>
                <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Citizen Credential & Account Recovery</p>
            </div>
            <div style="padding: 28px; color: #1e293b;">
                <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">Dear <strong>{user.name}</strong>,</p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                    We received a request to reset your citizen credentials on the DPIP Citizen Portal. Use the verification code below to authorize your password change:
                </p>
                <div style="margin: 24px 0; text-align: center;">
                    <div style="display: inline-block; padding: 14px 28px; background: #f1f5f9; border: 2px dashed #2563eb; border-radius: 10px; font-size: 30px; font-weight: 900; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">
                        {otp_code}
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for 15 minutes • Do not share with anyone</p>
                </div>
                <div style="padding: 12px 16px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 13px; color: #1e40af; margin-bottom: 20px;">
                    <strong>Security Notice:</strong> DPIP officials will never ask for your password or verification OTP over call or SMS.
                </div>
                <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin-bottom: 0;">
                    If you did not initiate this password recovery request, your account is still secure and you may disregard this email.
                </p>
            </div>
            <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
                Official Digital Public Infrastructure Portal • Citizen Grievance Redressal Framework
            </div>
        </div>
        """

        _send_email_async(subject, text_body, html_body, [user.email])

        return Response({
            'message': 'A 6-digit verification OTP has been sent to your registered email address.',
            'masked_email': _mask_email(user.email),
            'expires_in_minutes': 15,
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    Step 2: Citizen enters OTP code and sets their new secure password.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        otp_record = serializer.validated_data['otp_record']
        new_password = serializer.validated_data['new_password']

        # Update password securely
        user.set_password(new_password)
        user.save()

        # Mark OTP used
        otp_record.is_used = True
        otp_record.save()

        # Confirmation email
        confirm_subject = "DPIP Security Alert: Password Changed Successfully"
        confirm_text = (
            f"Dear {user.name},\n\n"
            f"Your DPIP account password was successfully updated.\n\n"
            f"If you did not perform this change, please immediately contact the Central Support Desk at support@dpip.gov.in.\n\n"
            f"Digital Public Infrastructure Portal"
        )
        confirm_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #16a34a; padding: 20px; color: #ffffff; text-align: center;">
                <h2 style="margin: 0; font-size: 18px;">Password Changed Successfully</h2>
            </div>
            <div style="padding: 24px; color: #1e293b;">
                <p>Dear <strong>{user.name}</strong>,</p>
                <p>Your password for your DPIP Citizen account (<strong>{user.email}</strong>) has been successfully reset.</p>
                <p>You can now sign in to the portal with your new password.</p>
            </div>
            <div style="background: #f8fafc; padding: 12px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
                DPIP Security System
            </div>
        </div>
        """
        _send_email_async(confirm_subject, confirm_text, confirm_html, [user.email])

        return Response({
            'message': 'Your password has been successfully reset. You can now log in with your new credentials.',
            'email': user.email
        }, status=status.HTTP_200_OK)


class RecoverUsernameView(APIView):
    """
    Allows citizens to find their registered email address using their phone number.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def post(self, request):
        serializer = RecoverUsernameSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        core_digits = serializer.validated_data['phone_number']

        def _get_core_digits(p_str: str) -> str:
            d = ''.join(filter(str.isdigit, str(p_str)))
            if d.startswith('91') and len(d) > 10:
                d = d[2:]
            return d.lstrip('0')

        users = [
            u for u in User.objects.all()
            if core_digits and (
                core_digits in _get_core_digits(u.phone_number) or
                _get_core_digits(u.phone_number) in core_digits
            )
        ]
        results = []
        for u in users:
            results.append({
                'name': u.name,
                'masked_email': _mask_email(u.email),
                'role': u.role
            })

        return Response({
            'count': len(results),
            'accounts': results
        }, status=status.HTTP_200_OK)



