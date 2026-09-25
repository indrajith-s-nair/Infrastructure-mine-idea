import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dpi_core.settings")
django.setup()
from complaints.models import Complaint
from accounts.models import OfficerProfile
with open('db_out.txt', 'w') as f:
    f.write("COMPLAINTS:\n")
    for c in Complaint.objects.all():
        f.write(f"{c.tracking_code} - Assigned: {getattr(c.assigned_officer, 'user', None)} - CD Reviewed: {c.central_desk_reviewed}\n")
    f.write("\nOFFICERS:\n")
    for o in OfficerProfile.objects.all():
        f.write(f"{o.id} - {o.user.email} - {o.officer_designation}\n")
