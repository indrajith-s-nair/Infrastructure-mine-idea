import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from accounts.models import OfficerProfile

officer = OfficerProfile.objects.filter(is_on_duty=True).first()
print("First officer:", officer.user.name, officer.officer_designation)
