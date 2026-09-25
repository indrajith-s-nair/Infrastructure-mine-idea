import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from complaints.serializers import ComplaintCreateSerializer

data = {
    "description": "A live electric wire fell down on the road causing major hazard",
    "address": "MG Road near metro station, 560001",
    "lgd_jurisdiction_code": "LGD-560001"
}
s = ComplaintCreateSerializer(data=data)
if s.is_valid():
    c = s.save()
    print(f"Tracking Code: {c.tracking_code}")
    print(f"Score: {c.ai_severity_score}")
    print(f"Officer: {c.gemini_suggested_officer.officer_designation if c.gemini_suggested_officer else 'None'}")
else:
    print(s.errors)
