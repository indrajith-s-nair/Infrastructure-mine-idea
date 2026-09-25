import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from accounts.models import OfficerProfile
from complaints.models import Complaint

print("OFFICERS:")
for o in OfficerProfile.objects.all():
    print(f"ID: {o.id}, User ID: {o.user.id}, Email: {o.user.email}, Role: {o.officer_designation}")

print("\nCOMPLAINTS:")
for c in Complaint.objects.all():
    assigned = c.assigned_officer_id
    print(f"Tracking: {c.tracking_code}, Assigned Officer ID: {assigned}, Central Desk Reviewed: {c.central_desk_reviewed}")

