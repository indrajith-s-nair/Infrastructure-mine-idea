from django.core.management.base import BaseCommand
from accounts.models import User, OfficerProfile, OfficerDesignation
from complaints.models import Complaint


class Command(BaseCommand):
    help = 'Seeds authentic demonstration data for Phase 2 using strictly authentic designations and realistic civic grievances'

    def add_arguments(self, parser):
        parser.add_argument(
            '--purge',
            action='store_true',
            help='Purge all existing complaints from the database (Use with caution!)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Ensuring DPIP System Roles and Authentic Officer Credentials...'))

        # 1. Superuser / Admin
        admin_email = 'admin@dpip.gov.in'
        admin_user = User.objects.filter(email=admin_email).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                email=admin_email,
                name='System Administrator',
                phone_number='+91 1800-11-2233',
                password='AdminPassword123!'
            )
            self.stdout.write(self.style.SUCCESS(f'Created Administrator: {admin_email}'))
        else:
            admin_user.name = 'System Administrator'
            admin_user.set_password('AdminPassword123!')
            admin_user.save()

        # 2. Citizen Account
        citizen_email = 'citizen@example.gov.in'
        citizen_user = User.objects.filter(email=citizen_email).first()
        if not citizen_user:
            citizen_user = User.objects.create_user(
                email=citizen_email,
                name='Citizen',
                phone_number='+91 9876543210',
                password='Citizen@123',
                role=User.Role.CITIZEN
            )
            self.stdout.write(self.style.SUCCESS(f'Created Citizen: {citizen_email}'))
        else:
            citizen_user.name = 'Citizen'
            citizen_user.role = User.Role.CITIZEN
            citizen_user.set_password('Citizen@123')
            citizen_user.save()

        # 2.1 Central Triage Desk Operator
        central_email = 'centraldesk@dpip.gov.in'
        central_user = User.objects.filter(email=central_email).first()
        if not central_user:
            central_user = User.objects.create_user(
                email=central_email,
                name='Central Triage Desk Operator',
                phone_number='+91 1800-44-5566',
                password='CentralDesk@123',
                role=User.Role.CENTRAL_DESK,
                is_staff=False
            )
            self.stdout.write(self.style.SUCCESS(f'Created Central Desk: {central_email}'))
        else:
            central_user.name = 'Central Triage Desk Operator'
            central_user.role = User.Role.CENTRAL_DESK
            central_user.is_staff = False
            central_user.set_password('CentralDesk@123')
            central_user.save()

        # 3. All Authentic Frontline Officer Designations
        all_officers_data = [
            {
                'name': 'Rajesh Kumar',
                'email': 'officer.sanitary@dpip.gov.in',
                'designation': OfficerDesignation.SANITARY_INSPECTOR,
                'phone': '+91 9423456789',
                'password': 'Officer@123',
                'dept': 'Sanitation & Solid Waste Management',
                'lgd': 'LGD-KA-204',
                'badge': 'MCD-SAN-310',
                'area': 'East Zone Ward 112'
            },
            {
                'name': 'Priya Sharma',
                'email': 'officer.ward@dpip.gov.in',
                'designation': OfficerDesignation.WARD_OFFICER,
                'phone': '+91 9434567890',
                'password': 'Officer@123',
                'dept': 'Town & Country Planning',
                'lgd': 'LGD-DEL-042',
                'badge': 'NDMC-WO-05',
                'area': 'Barakhamba Circle'
            },
            {
                'name': 'Amit Patel',
                'email': 'officer.panchayat@dpip.gov.in',
                'designation': OfficerDesignation.PANCHAYAT_SECRETARY,
                'phone': '+91 9456789016',
                'password': 'Officer@123',
                'dept': 'Town & Country Planning',
                'lgd': 'LGD-MH-303',
                'badge': 'PR-SEC-41',
                'area': 'Gram Panchayat Office'
            },
            {
                'name': 'Sanjay Singh',
                'email': 'officer.vdo@dpip.gov.in',
                'designation': OfficerDesignation.VILLAGE_DEVELOPMENT_OFFICER,
                'phone': '+91 9456789017',
                'password': 'Officer@123',
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-MH-303',
                'badge': 'PR-VDO-19',
                'area': 'Village Development Circle'
            },
            {
                'name': 'Ritu Verma',
                'email': 'officer.townplanner@dpip.gov.in',
                'designation': OfficerDesignation.ASSISTANT_TOWN_PLANNER,
                'phone': '+91 9434567891',
                'password': 'Officer@123',
                'dept': 'Town & Country Planning',
                'lgd': 'LGD-DEL-042',
                'badge': 'TCP-ATP-22',
                'area': 'Zonal Planning Wing'
            },
            {
                'name': 'Deepak Gupta',
                'email': 'officer.revinspector@dpip.gov.in',
                'designation': OfficerDesignation.REVENUE_INSPECTOR,
                'phone': '+91 9456789014',
                'password': 'Officer@123',
                'dept': 'Revenue & Land Administration',
                'lgd': 'LGD-UP-108',
                'badge': 'REV-RI-15',
                'area': 'Revenue Circle 4'
            },
            {
                'name': 'Karthik N',
                'email': 'officer.vao@dpip.gov.in',
                'designation': OfficerDesignation.VILLAGE_ADMINISTRATIVE_OFFICER,
                'phone': '+91 9456789015',
                'password': 'Officer@123',
                'dept': 'Revenue & Land Administration',
                'lgd': 'LGD-TN-501',
                'badge': 'REV-VAO-88',
                'area': 'Rural Village Administrative Unit'
            },
            {
                'name': 'Vikram Yadav',
                'email': 'officer.patwari@dpip.gov.in',
                'designation': OfficerDesignation.PATWARI,
                'phone': '+91 9456789012',
                'password': 'Officer@123',
                'dept': 'Revenue & Land Administration',
                'lgd': 'LGD-UP-108',
                'badge': 'REV-PAT-202',
                'area': 'Tehsil Sector 62'
            },
            {
                'name': 'Anil Deshmukh',
                'email': 'officer.ae@dpip.gov.in',
                'designation': OfficerDesignation.ASSISTANT_ENGINEER,
                'phone': '+91 9412345680',
                'password': 'Officer@123',
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'badge': 'PWD-ND-AE-101',
                'area': 'Sub-Division Central PWD'
            },
            {
                'name': 'Suresh Power',
                'email': 'officer.electrical@dpip.gov.in',
                'designation': OfficerDesignation.JUNIOR_ENGINEER,
                'phone': '+91 9412345681',
                'password': 'Officer@123',
                'dept': 'Electricity & Power Distribution',
                'lgd': 'LGD-DEL-042',
                'badge': 'ELEC-JE-202',
                'area': 'Central Grid Station'
            },
            {
                'name': 'Sunil Meena',
                'email': 'officer.je@dpip.gov.in',
                'designation': OfficerDesignation.JUNIOR_ENGINEER,
                'phone': '+91 9412345678',
                'password': 'Officer@123',
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'badge': 'PWD-ND-8942',
                'area': 'Connaught Place & Central Ward 42'
            },
            {
                'name': 'Ramesh Tomar',
                'email': 'officer.sho@dpip.gov.in',
                'designation': OfficerDesignation.STATION_HOUSE_OFFICER,
                'phone': '+91 9445678901',
                'password': 'Officer@123',
                'dept': 'Law & Order (Police)',
                'lgd': 'LGD-DEL-042',
                'badge': 'DL-POL-4412',
                'area': 'Parliament Street Jurisdiction'
            },
            {
                'name': 'Dr. Neha Kapoor',
                'email': 'officer.health@dpip.gov.in',
                'designation': OfficerDesignation.MEDICAL_OFFICER_IN_CHARGE,
                'phone': '+91 9467890123',
                'password': 'Officer@123',
                'dept': 'Public Health & Medical Services',
                'lgd': 'LGD-DEL-042',
                'badge': 'DHS-MO-118',
                'area': 'Central Health District'
            },
            {
                'name': 'Manish Tiwari',
                'email': 'officer.education@dpip.gov.in',
                'designation': OfficerDesignation.BLOCK_EDUCATION_OFFICER,
                'phone': '+91 9478901234',
                'password': 'Officer@123',
                'dept': 'School Education Department',
                'lgd': 'LGD-DEL-042',
                'badge': 'EDU-BEO-09',
                'area': 'District Education Zone 1'
            }
        ]

        for o_info in all_officers_data:
            clean_email = o_info['email'].strip().lower()
            user = User.objects.filter(email__iexact=clean_email).first()
            if not user:
                user = User.objects.create_user(
                    email=clean_email,
                    name=o_info['name'],
                    phone_number=o_info['phone'],
                    password=o_info['password'],
                    role=User.Role.OFFICER,
                    is_staff=True
                )
            else:
                user.name = o_info['name']
                user.role = User.Role.OFFICER
                user.set_password(o_info['password'])
                user.save()

            OfficerProfile.objects.update_or_create(
                user=user,
                defaults={
                    'department_name': o_info['dept'],
                    'lgd_jurisdiction_code': o_info['lgd'],
                    'officer_designation': o_info['designation'],
                    'badge_number': o_info['badge'],
                    'jurisdiction_area': o_info['area'],
                    'is_on_duty': True
                }
            )

        # 4. Clean previous complaints only if explicitly requested
        if options.get('purge'):
            deleted_count, _ = Complaint.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Purged {deleted_count} complaints as requested via --purge flag.'))

        # 4.1 Seed Clustered Hotspot & CapEx Complaints
        from complaints.models import CivicFeedback
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        pw_officer = OfficerProfile.objects.filter(officer_designation=OfficerDesignation.JUNIOR_ENGINEER, department_name__icontains='Public Works').first() or OfficerProfile.objects.filter(officer_designation=OfficerDesignation.ASSISTANT_ENGINEER).first()
        sanitary_officer = OfficerProfile.objects.filter(officer_designation=OfficerDesignation.SANITARY_INSPECTOR).first()
        ward_officer = OfficerProfile.objects.filter(officer_designation=OfficerDesignation.WARD_OFFICER).first()
        elec_officer = OfficerProfile.objects.filter(department_name__icontains='Electricity').first()

        DEMO_COMPLAINT_DATASETS = [
            # --- CLUSTER 1: Connaught Place / Barakhamba (Roadways & Structural Potholes) ---
            {
                'tracking_code': 'DPIP-2026-RD9011',
                'description': 'Severe 8-inch deep crater and collapsed asphalt near Metro Gate 4, Barakhamba Road causing severe traffic bottlenecks and two-wheeler skidding hazards.',
                'address': 'Inner Circle Block B, Connaught Place, New Delhi',
                'lat': 28.6315,
                'lng': 77.2185,
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'score': 88.0,
                'status': Complaint.Status.IN_PROGRESS,
                'officer': pw_officer,
                'ai_summary': 'Urgent structural road failure detected. Heavy transit hazard with active risk of vehicular collision.',
                'action_taken_report': 'Site inspected by Junior Engineer. Emergency cold-mix asphalt patch team dispatched.',
                'sla_hours': 48,
            },
            {
                'tracking_code': 'DPIP-2026-RD9012',
                'description': 'Multiple recurring deep potholes along KG Marg intersection leading towards Connaught Place. Bitumen layer completely peeled off.',
                'address': 'Kasturba Gandhi Marg, Near Regal Junction, Connaught Place',
                'lat': 28.6322,
                'lng': 77.2198,
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'score': 78.5,
                'status': Complaint.Status.PENDING,
                'officer': pw_officer,
                'ai_summary': 'Corridor deterioration with aggregate displacement. Recurrent asphalt failure zone.',
                'sla_hours': 48,
            },
            {
                'tracking_code': 'DPIP-2026-RD9013',
                'description': 'Sunken manhole frame and jagged road surface depression opposite Super Bazar, Barakhamba corridor.',
                'address': 'Radial Road 3, Connaught Circus, New Delhi',
                'lat': 28.6308,
                'lng': 77.2178,
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'score': 74.0,
                'status': Complaint.Status.RESOLVED,
                'officer': pw_officer,
                'ai_summary': 'Manhole collar depression rectified with reinforced aggregate base.',
                'action_taken_report': 'Manhole cover realigned to road grade, cured with high-density quick-set bituminous concrete.',
                'sla_hours': 48,
            },
            {
                'tracking_code': 'DPIP-2026-RD9014',
                'description': 'Large road crater re-emerged after recent rains at Tolstoy Marg roundabout crossing.',
                'address': 'Tolstoy Marg Junction, Connaught Place Outer Circle',
                'lat': 28.6298,
                'lng': 77.2189,
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'score': 92.0,
                'status': Complaint.Status.PENDING,
                'officer': pw_officer,
                'ai_summary': 'Chronic structural failure in arterial junction. Recommended for comprehensive road resurfacing.',
                'is_reopened': True,
                'reopen_reason': 'Temporary gravel filling washed away within 48 hours. Proper asphalt paving required.',
                'sla_hours': 24,
            },

            # --- CLUSTER 2: East Delhi / Mayur Vihar (Water Trunk & Supply Contamination) ---
            {
                'tracking_code': 'DPIP-2026-WT8821',
                'description': 'Underground drinking water trunk line burst. High pressure potable water gushing onto main street for 36 hours.',
                'address': 'Pocket 1 Main Road, Mayur Vihar Phase 1, East Delhi',
                'lat': 28.6085,
                'lng': 77.2950,
                'dept': 'Public Health & Medical Services',
                'lgd': 'LGD-KA-204',
                'score': 91.0,
                'status': Complaint.Status.IN_PROGRESS,
                'officer': ward_officer,
                'ai_summary': 'Critical municipal water infrastructure breach. Pressure loss across 450 households.',
                'action_taken_report': 'Isolation valve closed. Excavator deployed to replace damaged 200mm distribution pipe.',
                'sla_hours': 24,
            },
            {
                'tracking_code': 'DPIP-2026-WT8822',
                'description': 'Contaminated yellowish supply water mixed with sewage smell in residential block taps.',
                'address': 'Pocket 2 Sector A, Mayur Vihar Phase 1, East Delhi',
                'lat': 28.6092,
                'lng': 77.2965,
                'dept': 'Public Health & Medical Services',
                'lgd': 'LGD-KA-204',
                'score': 85.0,
                'status': Complaint.Status.PENDING,
                'officer': ward_officer,
                'ai_summary': 'Cross-contamination risk between potable pipeline and parallel drain. Immediate chlorine dosage and pipeline inspection needed.',
                'sla_hours': 24,
            },
            {
                'tracking_code': 'DPIP-2026-WT8823',
                'description': 'Zero water pressure in overhead municipal supply line for 4 consecutive days.',
                'address': 'Pocket 3 Market Lane, Mayur Vihar Phase 1, East Delhi',
                'lat': 28.6078,
                'lng': 77.2942,
                'dept': 'Public Health & Medical Services',
                'lgd': 'LGD-KA-204',
                'score': 68.0,
                'status': Complaint.Status.RESOLVED,
                'officer': ward_officer,
                'ai_summary': 'Booster pump air-lock resolved and supply pressure normalized.',
                'action_taken_report': 'Sub-station booster pump serviced, telemetric pressure gauge restored to 2.4 bar.',
                'sla_hours': 24,
            },

            # --- CLUSTER 3: Karol Bagh / West Zone (Solid Waste Management & Illegal Dumps) ---
            {
                'tracking_code': 'DPIP-2026-SW7731',
                'description': 'Unauthorized open municipal solid waste dumping site overflowing onto footpath and pedestrian walkway.',
                'address': 'Arya Samaj Road, Near Karol Bagh Metro, New Delhi',
                'lat': 28.6520,
                'lng': 77.1910,
                'dept': 'Sanitation & Solid Waste Management',
                'lgd': 'LGD-KA-204',
                'score': 82.0,
                'status': Complaint.Status.IN_PROGRESS,
                'officer': sanitary_officer,
                'ai_summary': 'Sanitary health hazard. High rodent activity and leachate seepage across commercial zone.',
                'action_taken_report': 'JCB excavator and tipper truck deployed for secondary waste clearance.',
                'sla_hours': 24,
            },
            {
                'tracking_code': 'DPIP-2026-SW7732',
                'description': 'Community dumper bin broken and uncollected for 5 days. Foul stench spreading into adjacent girls primary school.',
                'address': 'Padam Singh Road, Karol Bagh, New Delhi',
                'lat': 28.6531,
                'lng': 77.1925,
                'dept': 'Sanitation & Solid Waste Management',
                'lgd': 'LGD-KA-204',
                'score': 89.0,
                'status': Complaint.Status.PENDING,
                'officer': sanitary_officer,
                'ai_summary': 'Severe epidemiological hazard in proximity to school. Priority 1 clearance required.',
                'sla_hours': 12,
            },
            {
                'tracking_code': 'DPIP-2026-SW7733',
                'description': 'Plastic waste, commercial market debris, and rotting vegetable piles dumped near vegetable mandi corner.',
                'address': 'Ajmal Khan Road Crossing, Karol Bagh, New Delhi',
                'lat': 28.6515,
                'lng': 77.1902,
                'dept': 'Sanitation & Solid Waste Management',
                'lgd': 'LGD-KA-204',
                'score': 76.0,
                'status': Complaint.Status.RESOLVED,
                'officer': sanitary_officer,
                'ai_summary': 'Commercial market waste collected and lime powder disinfection applied.',
                'action_taken_report': '3.2 metric tons of mixed waste cleared, lime powder sprayed, commercial vendors issued compliance notices.',
                'sla_hours': 24,
            },

            # --- CLUSTER 4: South Delhi / Saket (Stormwater Drainage & Culvert Blockages) ---
            {
                'tracking_code': 'DPIP-2026-DR6611',
                'description': 'Major stormwater drain clogged with construction rubble causing 2-foot sewage water stagnation across main avenue.',
                'address': 'Press Enclave Marg, Saket District Centre, New Delhi',
                'lat': 28.5245,
                'lng': 77.2165,
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'score': 86.0,
                'status': Complaint.Status.IN_PROGRESS,
                'officer': pw_officer,
                'ai_summary': 'Stormwater drainage failure. Urban flood vulnerability in commercial district.',
                'action_taken_report': 'Super-sucker desilting machine stationed at culvert mouth to extract solidified debris.',
                'sla_hours': 48,
            },
            {
                'tracking_code': 'DPIP-2026-DR6612',
                'description': 'Broken concrete drain slab with exposed rusted rebars causing vehicle damage and pedestrian falls.',
                'address': 'Mandir Marg, Sector 6 Saket, New Delhi',
                'lat': 28.5258,
                'lng': 77.2178,
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'score': 72.0,
                'status': Complaint.Status.PENDING,
                'officer': pw_officer,
                'ai_summary': 'Structural safety risk on sidewalk drain cover.',
                'sla_hours': 48,
            },
            {
                'tracking_code': 'DPIP-2026-DR6613',
                'description': 'Overflowing sewer manhole bubbling back into residential basement driveways during evening peak hours.',
                'address': 'J-Block Residential Road, Saket, New Delhi',
                'lat': 28.5238,
                'lng': 77.2152,
                'dept': 'Public Works Department (PWD)',
                'lgd': 'LGD-DEL-042',
                'score': 84.0,
                'status': Complaint.Status.RESOLVED,
                'officer': pw_officer,
                'ai_summary': 'Hydraulic backflow cleared by mechanical rodding.',
                'action_taken_report': 'High pressure jetting deployed over 120m sewer run to dislodge grease blockage.',
                'sla_hours': 24,
            },

            # --- CLUSTER 5: Civil Lines / North Zone (Streetlights & Electrical Grid) ---
            {
                'tracking_code': 'DPIP-2026-EL5501',
                'description': 'Complete stretch of 12 LED streetlights non-functional for 2 weeks. Total blackout posing women safety hazard.',
                'address': 'Rajpur Road, Civil Lines, North Delhi',
                'lat': 28.6780,
                'lng': 77.2250,
                'dept': 'Electricity & Power Distribution',
                'lgd': 'LGD-DEL-042',
                'score': 81.0,
                'status': Complaint.Status.IN_PROGRESS,
                'officer': elec_officer,
                'ai_summary': 'Arterial illumination failure. High public safety and anti-social vulnerability.',
                'action_taken_report': 'Feeder pillar circuit breaker repaired. 8 damaged LED luminaires replaced with 90W smart fixtures.',
                'sla_hours': 24,
            },
            {
                'tracking_code': 'DPIP-2026-EL5502',
                'description': 'Exposed sparking live power cable hanging near bus shelter roof.',
                'address': 'Sham Nath Marg, Civil Lines, North Delhi',
                'lat': 28.6792,
                'lng': 77.2265,
                'dept': 'Electricity & Power Distribution',
                'lgd': 'LGD-DEL-042',
                'score': 95.0,
                'status': Complaint.Status.RESOLVED,
                'officer': elec_officer,
                'ai_summary': 'Electrocution hazard. Immediate emergency lineman isolation performed.',
                'action_taken_report': 'Live armored cable spliced, enclosed inside weatherproof conduit and elevated 4.5 meters.',
                'sla_hours': 12,
            },
            {
                'tracking_code': 'DPIP-2026-EL5503',
                'description': 'Streetlight pole tilted at 45 degree angle after vehicle impact, dangling over parked cars.',
                'address': 'Alipur Road Crossing, Civil Lines, North Delhi',
                'lat': 28.6772,
                'lng': 77.2238,
                'dept': 'Electricity & Power Distribution',
                'lgd': 'LGD-DEL-042',
                'score': 77.0,
                'status': Complaint.Status.PENDING,
                'officer': elec_officer,
                'ai_summary': 'Physical pole collapse hazard.',
                'sla_hours': 24,
            },
        ]

        created_count = 0
        for data in DEMO_COMPLAINT_DATASETS:
            comp, created = Complaint.objects.update_or_create(
                tracking_code=data['tracking_code'],
                defaults={
                    'user': citizen_user,
                    'description': data['description'],
                    'address': data['address'],
                    'latitude': data['lat'],
                    'longitude': data['lng'],
                    'department_category': data['dept'],
                    'lgd_jurisdiction_code': data['lgd'],
                    'ai_severity_score': data['score'],
                    'status': data['status'],
                    'assigned_officer': data.get('officer'),
                    'gemini_suggested_officer': data.get('officer'),
                    'central_desk_reviewed': True,
                    'ai_analysis_summary': data.get('ai_summary'),
                    'action_taken_report': data.get('action_taken_report'),
                    'admin_notes': data.get('action_taken_report'),
                    'sla_duration_hours': data.get('sla_hours', 48),
                    'is_reopened': data.get('is_reopened', False),
                    'reopen_reason': data.get('reopen_reason'),
                    'reopened_at': now if data.get('is_reopened') else None,
                    'vision_verification_status': 'VERIFIED' if data['status'] == Complaint.Status.RESOLVED else 'NOT_INSPECTED',
                    'vision_confidence_score': 94.5 if data['status'] == Complaint.Status.RESOLVED else 0.0,
                    'vision_audit_notes': 'AI Vision Verification passed: Clear repaired infrastructure with structural restoration verified.' if data['status'] == Complaint.Status.RESOLVED else None,
                    'resolved_at': now - timedelta(hours=6) if data['status'] == Complaint.Status.RESOLVED else None,
                }
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Seeded/Updated {len(DEMO_COMPLAINT_DATASETS)} clustered grievances across 5 municipal failure sectors.'))

        # 4.2 Seed Realistic Civic Survey & Feedback Records
        DEMO_FEEDBACKS = [
            {
                'tracking_code': 'DPIP-2026-RD9013',
                'name': 'Aditya Sen',
                'contact': '+91 9811223344',
                'dept': 'Public Works Department (PWD)',
                'ward': 'Inner Circle, Connaught Place Ward 42',
                'overall': 5,
                'res_sat': 5,
                'timeliness': 5,
                'quality': 5,
                'cleanliness': 4,
                'comments': 'Excellent response! The dangerous sunken manhole was levelled within 24 hours of filing the complaint. High quality asphalt finish.',
                'rec': True,
            },
            {
                'tracking_code': 'DPIP-2026-WT8823',
                'name': 'Sunita Mehra',
                'contact': '+91 9822334455',
                'dept': 'Public Health & Medical Services',
                'ward': 'Pocket 3, Mayur Vihar Phase 1',
                'overall': 5,
                'res_sat': 5,
                'timeliness': 4,
                'quality': 5,
                'cleanliness': 5,
                'comments': 'Water supply pressure was fully restored before morning. Officer called to verify tap pressure.',
                'rec': True,
            },
            {
                'tracking_code': 'DPIP-2026-SW7733',
                'name': 'Harish Chawla',
                'contact': '+91 9833445566',
                'dept': 'Sanitation & Solid Waste Management',
                'ward': 'Ajmal Khan Road, Karol Bagh',
                'overall': 4,
                'res_sat': 5,
                'timeliness': 4,
                'quality': 4,
                'cleanliness': 5,
                'comments': 'Huge vegetable waste pile cleared completely and disinfectant powder was sprayed. Very professional handling.',
                'rec': True,
            },
            {
                'tracking_code': 'DPIP-2026-EL5502',
                'name': 'Gurpreet Singh',
                'contact': '+91 9844556677',
                'dept': 'Electricity & Power Distribution',
                'ward': 'Sham Nath Marg, Civil Lines',
                'overall': 5,
                'res_sat': 5,
                'timeliness': 5,
                'quality': 5,
                'cleanliness': 5,
                'comments': 'High urgency hazard handled within 4 hours. Sparking line removed and insulated properly.',
                'rec': True,
            },
            {
                'tracking_code': 'DPIP-2026-DR6613',
                'name': 'Meenakshi Iyer',
                'contact': '+91 9855667788',
                'dept': 'Public Works Department (PWD)',
                'ward': 'J-Block, Saket',
                'overall': 5,
                'res_sat': 5,
                'timeliness': 4,
                'quality': 5,
                'cleanliness': 4,
                'comments': 'Sewer backflow cleared by jetting machine team. Transparent photo tracking on DPIP portal is very helpful.',
                'rec': True,
            },
            {
                'tracking_code': None,
                'name': 'Rohan Deshpande',
                'contact': '+91 9866778899',
                'dept': 'General Municipal Services',
                'ward': 'Central Delhi Ward 42',
                'overall': 5,
                'res_sat': 5,
                'timeliness': 5,
                'quality': 5,
                'cleanliness': 5,
                'comments': 'The multilingual voice grievance feature is revolutionary. Filed in Hindi and got resolved smoothly.',
                'rec': True,
            },
        ]

        for fb in DEMO_FEEDBACKS:
            comp_obj = Complaint.objects.filter(tracking_code=fb['tracking_code']).first() if fb['tracking_code'] else None
            CivicFeedback.objects.update_or_create(
                tracking_code=fb['tracking_code'],
                citizen_name=fb['name'],
                defaults={
                    'complaint': comp_obj,
                    'user': citizen_user,
                    'citizen_contact': fb['contact'],
                    'department_category': fb['dept'],
                    'ward_or_area': fb['ward'],
                    'overall_rating': fb['overall'],
                    'resolution_satisfaction': fb['res_sat'],
                    'officer_timeliness': fb['timeliness'],
                    'work_quality': fb['quality'],
                    'cleanliness_score': fb['cleanliness'],
                    'comments': fb['comments'],
                    'would_recommend': fb['rec'],
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(DEMO_FEEDBACKS)} citizen civic satisfaction surveys & reviews.'))

        # 5. Initialize Audit Ledger & GIS Hotspot Clustering
        try:
            from audit.services import AuditService
            from audit.models import AuditEvent
            from gis.clustering import GISClusteringService

            for c in Complaint.objects.all().order_by('created_at'):
                if not AuditEvent.objects.filter(resource='Complaint', resource_id=c.tracking_code).exists():
                    AuditService.record_event(
                        actor=c.user.email if c.user else 'Citizen',
                        actor_id=str(c.user.id) if c.user else None,
                        action='complaint.created',
                        resource='Complaint',
                        resource_id=c.tracking_code,
                        payload={
                            'tracking_code': c.tracking_code,
                            'description': c.description,
                            'address': c.address,
                            'ai_severity_score': c.ai_severity_score,
                            'department_category': c.department_category,
                            'lgd_jurisdiction_code': c.lgd_jurisdiction_code,
                            'assigned_officer': c.assigned_officer.officer_designation if c.assigned_officer else None,
                            'status': c.status,
                        }
                    )

            chain_status = AuditService.verify_audit_chain()
            self.stdout.write(self.style.SUCCESS(
                f"Audit Ledger verified: {chain_status.get('verified_count', 0)} events, Valid={chain_status.get('valid')}"
            ))

            # Run predictive spatial clustering to compute Hotspot Clusters and CapEx budgets
            clusters = GISClusteringService.run_predictive_clustering(radius_meters=350.0, min_complaints=2)
            self.stdout.write(self.style.SUCCESS(
                f"GIS Geospatial Intelligence: {len(clusters)} chronic civic failure hotspots identified with CapEx municipal budgets."
            ))
            for cl in clusters:
                self.stdout.write(self.style.NOTICE(
                    f"  -> Hotspot: '{cl.name}' | Severity: {cl.severity_score}/100 | CapEx Plan: {cl.capex_recommendation_title} (₹{float(cl.capex_estimated_budget_inr):,.2f})"
                ))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Audit/GIS initialization note: {e}"))

