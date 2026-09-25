from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OfficerProfile


class OfficerProfileInline(admin.StackedInline):
    model = OfficerProfile
    can_delete = False
    verbose_name_plural = 'Officer Profile'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'phone_number', 'role', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('role', 'is_staff', 'is_active', 'date_joined')
    inlines = (OfficerProfileInline,)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'phone_number', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('date_joined',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'phone_number', 'role', 'password', 'is_staff', 'is_active'),
        }),
    )
    search_fields = ('email', 'name', 'phone_number')
    ordering = ('-date_joined',)


@admin.register(OfficerProfile)
class OfficerProfileAdmin(admin.ModelAdmin):
    list_display = ('officer_designation', 'user', 'department_name', 'lgd_jurisdiction_code', 'badge_number', 'is_on_duty')
    list_filter = ('officer_designation', 'department_name', 'lgd_jurisdiction_code', 'is_on_duty')
    search_fields = ('user__name', 'user__email', 'department_name', 'lgd_jurisdiction_code', 'badge_number')
