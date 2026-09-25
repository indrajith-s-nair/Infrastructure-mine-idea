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
