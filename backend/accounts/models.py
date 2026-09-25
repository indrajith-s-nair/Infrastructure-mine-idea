from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, name, phone_number, password=None, role='CITIZEN', **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        if not name:
            raise ValueError("A name is required.")
        if not phone_number:
            raise ValueError("A phone number is required.")

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            name=name,
            phone_number=phone_number,
            role=role,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, name, phone_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User Model with Role-Based Access Control (RBAC):
    - CITIZEN: End citizen registering complaints and tracking grievances.
    - OFFICER: Level 1 Frontline Field Officer resolving tickets.
    - ADMIN: Administrative and oversight authority.
    """
    class Role(models.TextChoices):
        CITIZEN = 'CITIZEN', 'Citizen'
        OFFICER = 'OFFICER', 'Frontline Officer'
        CENTRAL_DESK = 'CENTRAL_DESK', 'Central Desk Triage Operator'
        ADMIN = 'ADMIN', 'System Administrator'

    name = models.CharField(max_length=255, verbose_name="Full Name")
    email = models.EmailField(unique=True, db_index=True, verbose_name="Email Address")
    phone_number = models.CharField(max_length=20, verbose_name="Phone Number")
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CITIZEN,
        db_index=True,
        verbose_name="User Role"
    )

    is_active = models.BooleanField(default=True, verbose_name="Active")
    is_staff = models.BooleanField(default=False, verbose_name="Staff Status")
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name="Date Joined")

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'phone_number']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.name} ({self.email}) [{self.role}]"

    @property
    def is_officer(self):
        return self.role == self.Role.OFFICER or hasattr(self, 'officer_profile')

    @property
    def is_central_desk(self):
        return self.role in [self.Role.CENTRAL_DESK, self.Role.ADMIN] or self.is_superuser

    @property
    def is_citizen(self):
        return self.role == self.Role.CITIZEN


class OfficerDesignation(models.TextChoices):
    SANITARY_INSPECTOR = 'Sanitary Inspector', 'Sanitary Inspector'
    WARD_OFFICER = 'Ward Officer', 'Ward Officer'
    PANCHAYAT_SECRETARY = 'Panchayat Secretary', 'Panchayat Secretary'
    VILLAGE_DEVELOPMENT_OFFICER = 'Village Development Officer (VDO)', 'Village Development Officer (VDO)'
    ASSISTANT_TOWN_PLANNER = 'Assistant Town Planner', 'Assistant Town Planner'
    REVENUE_INSPECTOR = 'Revenue Inspector', 'Revenue Inspector'
    VILLAGE_ADMINISTRATIVE_OFFICER = 'Village Administrative Officer (VAO)', 'Village Administrative Officer (VAO)'
    PATWARI = 'Patwari', 'Patwari'
    ASSISTANT_ENGINEER = 'Assistant Engineer (AE)', 'Assistant Engineer (AE)'
    JUNIOR_ENGINEER = 'Junior Engineer (JE)', 'Junior Engineer (JE)'
    STATION_HOUSE_OFFICER = 'Station House Officer (SHO)', 'Station House Officer (SHO)'
    MEDICAL_OFFICER_IN_CHARGE = 'Medical Officer In-Charge (MO)', 'Medical Officer In-Charge (MO)'
    BLOCK_EDUCATION_OFFICER = 'Block Education Officer (BEO)', 'Block Education Officer (BEO)'
    HEADMASTER = 'Headmaster', 'Headmaster'


class OfficerProfile(models.Model):
    """
    Level 1 Frontline Officer Profile model linked to User.
    Contains Department_Name, LGD_Jurisdiction_Code, and Officer_Designation.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='officer_profile',
        verbose_name="Officer User Account"
    )
    department_name = models.CharField(
        max_length=150,
        db_index=True,
        verbose_name="Department Name"
    )
    lgd_jurisdiction_code = models.CharField(
        max_length=64,
        db_index=True,
        verbose_name="LGD Jurisdiction Code"
    )
    officer_designation = models.CharField(
        max_length=100,
        choices=OfficerDesignation.choices,
        verbose_name="Officer Designation"
    )
    badge_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="Govt Employee / Badge ID"
    )
    jurisdiction_area = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Ward / Circle / Village Name"
    )
    is_on_duty = models.BooleanField(
        default=True,
        verbose_name="Available On-Duty"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Officer Profile"
        verbose_name_plural = "Officer Profiles"
        ordering = ['department_name', 'lgd_jurisdiction_code']

    def __str__(self):
        return f"{self.officer_designation} - {self.user.name} ({self.department_name} | {self.lgd_jurisdiction_code})"
