import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from complaints.serializers import auto_route_complaint_to_officer
from complaints.models import Complaint

class MockComplaint:
    department_category = "Electricity & Power Distribution"
    lgd_jurisdiction_code = "W123"

mock = MockComplaint()
off = auto_route_complaint_to_officer(mock)
print(f"Fallback officer assigned for Electricity with unknown LGD: {off.user.name}, {off.department_name}, {off.officer_designation}")

