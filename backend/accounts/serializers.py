from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OfficerProfile, OfficerDesignation


class OfficerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficerProfile
        fields = [
            'id',
            'department_name',
            'lgd_jurisdiction_code',
            'officer_designation',
            'badge_number',
            'jurisdiction_area',
            'is_on_duty',
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    role = serializers.ChoiceField(
        choices=[(User.Role.CITIZEN, 'Citizen'), (User.Role.OFFICER, 'Frontline Officer')],
        default=User.Role.CITIZEN
    )
    
    # Officer Profile Fields (for Officer Registration)
    department_name = serializers.CharField(required=False, allow_blank=True)
    lgd_jurisdiction_code = serializers.CharField(required=False, allow_blank=True)
    officer_designation = serializers.ChoiceField(choices=OfficerDesignation.choices, required=False, allow_blank=True)
    badge_number = serializers.CharField(required=False, allow_blank=True)
    jurisdiction_area = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'email',
            'phone_number',
            'role',
            'password',
            'department_name',
            'lgd_jurisdiction_code',
            'officer_designation',
            'badge_number',
            'jurisdiction_area',
        ]
        read_only_fields = ['id']

    def validate_email(self, value):
        normalized = value.lower().strip()
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate(self, attrs):
        role = attrs.get('role', User.Role.CITIZEN)
        if role == User.Role.OFFICER:
            if not attrs.get('officer_designation'):
                raise serializers.ValidationError({"officer_designation": "Officer Designation is strictly required."})
            if not attrs.get('department_name'):
                raise serializers.ValidationError({"department_name": "Department Name is strictly required."})
            if not attrs.get('lgd_jurisdiction_code'):
                raise serializers.ValidationError({"lgd_jurisdiction_code": "LGD Jurisdiction Code is strictly required."})
        return attrs

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.CITIZEN)
        dept = validated_data.pop('department_name', None)
        lgd = validated_data.pop('lgd_jurisdiction_code', None)
        designation = validated_data.pop('officer_designation', None)
        badge = validated_data.pop('badge_number', None)
        area = validated_data.pop('jurisdiction_area', None)

        # Strictly use authentic designation / Citizen label instead of personal names
        name = validated_data.get('name')
        if role == User.Role.OFFICER and designation:
            name = designation
        elif not name or name.strip() == '':
            name = 'Citizen'

        user = User.objects.create_user(
            email=validated_data['email'],
            name=name,
            phone_number=validated_data['phone_number'],
            password=validated_data['password'],
            role=role,
            is_staff=(role == User.Role.OFFICER)
        )

        if role == User.Role.OFFICER and designation:
            OfficerProfile.objects.create(
                user=user,
                department_name=dept or "Public Works Department (PWD)",
                lgd_jurisdiction_code=lgd or "LGD-DEL-042",
                officer_designation=designation,
                badge_number=badge or f"{designation[:3].upper()}-{lgd}",
                jurisdiction_area=area or f"Jurisdiction {lgd}",
                is_on_duty=True
            )

        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        try:
            user = User.objects.get(email=email)
            if not user.check_password(password):
                raise serializers.ValidationError("Invalid email or password entered.")
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password entered.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        refresh = RefreshToken.for_user(user)

        officer_data = None
        if hasattr(user, 'officer_profile'):
            officer_data = OfficerProfileSerializer(user.officer_profile).data

        display_name = user.name
        if hasattr(user, 'officer_profile') and user.officer_profile:
            display_name = user.officer_profile.officer_designation

        return {
            'user': {
                'id': user.id,
                'name': display_name,
                'email': user.email,
                'phone_number': user.phone_number,
                'role': user.role,
                'is_staff': user.is_staff,
                'officer_profile': officer_data,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }


class UserProfileSerializer(serializers.ModelSerializer):
    officer_profile = OfficerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone_number', 'role', 'is_staff', 'date_joined', 'officer_profile']
        read_only_fields = ['id', 'role', 'is_staff', 'date_joined']


class PasswordResetRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField(
        required=True,
        help_text="Registered email address or phone number"
    )

    def validate_identifier(self, value):
        val = value.strip().lower()
        # Look up by email or phone
        user = User.objects.filter(email__iexact=val).first()
        if not user:
            user = User.objects.filter(phone_number__icontains=val.replace(' ', '')).first()
        if not user:
            raise serializers.ValidationError("No registered account found with the provided email or phone number.")
        return val


class PasswordResetConfirmSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    otp_code = serializers.CharField(required=True, max_length=6, min_length=6)
    new_password = serializers.CharField(required=True, min_length=6, style={'input_type': 'password'})

    def validate(self, attrs):
        val = attrs.get('identifier', '').strip().lower()
        otp = attrs.get('otp_code', '').strip()

        user = User.objects.filter(email__iexact=val).first()
        if not user:
            user = User.objects.filter(phone_number__icontains=val.replace(' ', '')).first()

        if not user:
            raise serializers.ValidationError({"identifier": "User account not found."})

        from .models import PasswordResetOTP
        otp_record = PasswordResetOTP.objects.filter(
            user=user,
            otp_code=otp,
            is_used=False
        ).order_by('-created_at').first()

        if not otp_record or not otp_record.is_valid():
            raise serializers.ValidationError({"otp_code": "Invalid or expired OTP code entered."})

        attrs['user'] = user
        attrs['otp_record'] = otp_record
        return attrs


class RecoverUsernameSerializer(serializers.Serializer):
    phone_number = serializers.CharField(required=True)

    def validate_phone_number(self, value):
        digits_only = ''.join(filter(str.isdigit, value))
        if len(digits_only) < 6:
            raise serializers.ValidationError("Please provide a valid phone number.")

        def _get_core_digits(p_str: str) -> str:
            d = ''.join(filter(str.isdigit, str(p_str)))
            if d.startswith('91') and len(d) > 10:
                d = d[2:]
            return d.lstrip('0')

        input_core = _get_core_digits(value)

        users = [
            u for u in User.objects.all()
            if input_core and (
                input_core in _get_core_digits(u.phone_number) or
                _get_core_digits(u.phone_number) in input_core or
                value.strip() in u.phone_number
            )
        ]
        if not users:
            raise serializers.ValidationError("No citizen account associated with this phone number.")
        return input_core



