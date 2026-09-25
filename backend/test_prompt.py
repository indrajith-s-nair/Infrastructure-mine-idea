import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from complaints.gemini_service import _extract_officer_meta
from accounts.models import OfficerProfile

active_officers = OfficerProfile.objects.select_related('user').filter(is_on_duty=True)
candidate_roster = [
    {
        'id': op.id,
        'email': op.user.email,
        'designation': op.officer_designation,
        'department_name': op.department_name,
        'jurisdiction_area': op.jurisdiction_area or '',
        'lgd_jurisdiction_code': op.lgd_jurisdiction_code or '',
    }
    for op in active_officers
]

normalized_officers = [_extract_officer_meta(o) for o in candidate_roster]
for idx, off in enumerate(normalized_officers, start=1):
    print(f"{idx}. [{off['id']}] {off['designation']} ({off['department_name']}) | Scope: {off['scope']}")
