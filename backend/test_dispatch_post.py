import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from rest_framework.test import APIClient
from accounts.models import User, OfficerProfile
from complaints.models import Complaint

# 1. Create a dummy central desk user
cd_user, _ = User.objects.get_or_create(email='cd@gov.in', defaults={'name': 'CD', 'role': 'OFFICER', 'is_staff': True})
cd_user.set_password('password')
cd_user.save()

# 2. Get any complaint
complaint = Complaint.objects.first()
if not complaint:
    print("No complaints found")
    exit(0)

# 3. Get any officer
officer = OfficerProfile.objects.first()

print(f"Dispatching complaint {complaint.tracking_code} to officer {officer.id}")

client = APIClient()
client.force_authenticate(user=cd_user)

response = client.post(f'/api/complaints/central-desk/{complaint.tracking_code}/dispatch/', {
    'officer_id': officer.id,
    'operator_notes': 'Testing dispatch'
}, format='json')

print("Response status:", response.status_code)
print("Response data:", response.data)

# Check DB again
complaint.refresh_from_db()
print(f"After dispatch: assigned_officer={complaint.assigned_officer_id}, central_desk_reviewed={complaint.central_desk_reviewed}")
