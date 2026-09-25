import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dpi_core.settings")
import django
django.setup()
from complaints.models import Complaint
print(list(Complaint.objects.values("id", "ai_severity_score", "description")[:5]))
