import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from complaints.serializers import auto_route_complaint_to_officer
from complaints.models import Complaint
from accounts.models import OfficerProfile

for cat in [
    "Sanitation & Solid Waste Management",
    "Public Works Department (PWD)",
    "Water Supply & Sewerage Board",
    "Electricity & Power Distribution",
    "Town & Country Planning",
    "Public Health & Medical Services",
    "Revenue & Land Administration",
    "Law & Order (Police)",
    "School Education Department",
]:
    class MockComplaint:
        department_category = cat
        lgd_jurisdiction_code = None

    off = auto_route_complaint_to_officer(MockComplaint())
    print(f"Category: {cat} -> {off.user.name if off else 'None'}")
