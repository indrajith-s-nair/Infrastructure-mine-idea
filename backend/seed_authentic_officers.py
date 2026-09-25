import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from accounts.models import User, OfficerProfile
from complaints.models import Complaint

Complaint.objects.all().delete()
User.objects.filter(is_superuser=False).delete()
OfficerProfile.objects.all().delete()

# Create realistic authentic officers
officers_data = [
    {
        "email": "je.pwd.south@gov.in",
        "name": "Rajesh Kumar",
        "designation": "Junior Engineer (JE)",
        "department": "Public Works Department (PWD)",
        "jurisdiction": "South Zone"
    },
    {
        "email": "ae.pwd.south@gov.in",
        "name": "Suresh Menon",
        "designation": "Assistant Engineer (AE)",
        "department": "Public Works Department (PWD)",
        "jurisdiction": "South Zone"
    },
    {
        "email": "je.elec.south@gov.in",
        "name": "Amit Sharma",
        "designation": "Junior Engineer (JE)",
        "department": "Electricity & Power Distribution",
        "jurisdiction": "South Zone"
    },
    {
        "email": "sho.police.ramapuram@gov.in",
        "name": "Vikram Singh",
        "designation": "Station House Officer (SHO)",
        "department": "Law & Order (Police)",
        "jurisdiction": "Ramapuram Junction"
    },
    {
        "email": "sanitary.inspector.ward42@gov.in",
        "name": "Anita Desai",
        "designation": "Sanitary Inspector",
        "department": "Sanitation & Solid Waste Management",
        "jurisdiction": "Ward 42"
    },
    {
        "email": "mo.health.south@gov.in",
        "name": "Dr. Ramesh Gupta",
        "designation": "Medical Officer In-Charge (MO)",
        "department": "Public Health & Medical Services",
        "jurisdiction": "South Zone Health Clinic"
    },
    {
        "email": "ward.officer.42@gov.in",
        "name": "Kavita Reddy",
        "designation": "Ward Officer",
        "department": "Town & Country Planning",
        "jurisdiction": "Ward 42"
    }
]

for o in officers_data:
    user = User.objects.create_user(
        email=o['email'],
        password='password123',
        role='OFFICER',
        name=o['name'], phone_number="9999999999"
    )
    OfficerProfile.objects.create(
        user=user,
        department_name=o['department'],
        officer_designation=o['designation'],
        jurisdiction_area=o['jurisdiction']
    )

print("Authentic officers seeded successfully!")
