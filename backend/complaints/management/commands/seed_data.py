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
        else:
            total_complaints = Complaint.objects.count()
            self.stdout.write(self.style.SUCCESS(f'DPIP setup verified: {total_complaints} active citizen complaints retained safely in database.'))

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

            clusters = GISClusteringService.run_predictive_clustering(min_complaints=1)
            self.stdout.write(self.style.SUCCESS(
                f"GIS Geospatial Intelligence: {len(clusters)} civic failure hotspots identified with CapEx recommendations."
            ))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Audit/GIS initialization note: {e}"))
