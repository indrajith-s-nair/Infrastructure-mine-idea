import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from accounts.models import OfficerProfile

officers = OfficerProfile.objects.all()
for o in officers:
    print(f"ID: {o.id}, Name: {o.user.name}, Dept: {o.department_name}, OnDuty: {o.is_on_duty}")
