import io
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User
from .models import Complaint


class ComplaintTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.create_url = reverse('complaint-create')
        self.user = User.objects.create_user(
            name='Priya Patel',
            email='priya@example.gov.in',
            phone_number='+91 9123456780',
            password='TestPassword123'
        )

    def test_complaint_creation_generates_tracking_code(self):
        """Test POST /api/complaints/ generates unique tracking code and persists data"""
        audio_content = b'RIFF....WAVEfmt ....data....'
        voice_file = SimpleUploadedFile("voicenote.webm", audio_content, content_type="audio/webm")
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...'
        media_file = SimpleUploadedFile("pothole.png", image_content, content_type="image/png")

        payload = {
            'description': 'Deep pothole on Main Ring Road causing severe traffic congestion.',
            'address': 'Plot 42, Outer Ring Road, Sector 5, New Delhi',
            'latitude': 28.6139,
            'longitude': 77.2090,
            'voice_note': voice_file,
            'media_file': media_file
        }

        response = self.client.post(self.create_url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tracking_code', response.data)
        tracking_code = response.data['tracking_code']
        self.assertTrue(tracking_code.startswith('DPIP-'))

        complaint = Complaint.objects.get(tracking_code=tracking_code)
        self.assertEqual(complaint.status, Complaint.Status.PENDING)
        self.assertEqual(complaint.latitude, 28.6139)
        self.assertEqual(complaint.longitude, 77.2090)
        self.assertTrue(bool(complaint.voice_note))
        self.assertTrue(bool(complaint.media_file))

    def test_complaint_tracking_public_endpoint(self):
        """Test GET /api/complaints/track/<tracking_code>/"""
        complaint = Complaint.objects.create(
            description='Streetlight broken in ward 12',
            address='Ward 12, Park Street, Kolkata',
            latitude=22.5726,
            longitude=88.3639,
            status=Complaint.Status.PENDING
        )

        track_url = reverse('complaint-track', kwargs={'tracking_code': complaint.tracking_code})
        response = self.client.get(track_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['tracking_code'], complaint.tracking_code)
        self.assertEqual(response.data['status'], 'PENDING')
        self.assertIn('timeline', response.data)
        self.assertEqual(len(response.data['timeline']), 4)
        self.assertTrue(response.data['timeline'][0]['completed'])

    def test_complaint_resolution_output_display(self):
        """Test that resolved complaint returns admin notes and proof file in tracking"""
        proof_content = b'%PDF-1.4 official resolution certificate'
        proof_file = SimpleUploadedFile("resolution_cert.pdf", proof_content, content_type="application/pdf")

        complaint = Complaint.objects.create(
            description='Water leakage from main pipeline',
            address='MG Road, Bengaluru',
            latitude=12.9716,
            longitude=77.5946,
            status=Complaint.Status.RESOLVED,
            admin_notes='Pipeline repaired and pressure tested successfully on 22-09-2026 by Ward Engineering Team.',
            resolution_proof=proof_file
        )

        track_url = reverse('complaint-track', kwargs={'tracking_code': complaint.tracking_code})
        response = self.client.get(track_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'RESOLVED')
        self.assertEqual(response.data['admin_notes'], complaint.admin_notes)
        self.assertIsNotNone(response.data['resolution_proof_url'])
        self.assertIsNotNone(response.data['resolved_at'])

    def test_sla_deadline_and_status_computation(self):
        """Test that department-based SLA deadlines and statuses compute correctly"""
        from datetime import timedelta
        from django.utils import timezone

        # 1. Power complaint -> 24 hour SLA
        power_complaint = Complaint.objects.create(
            description='Power failure in Sector 14',
            department_category='Power & Electricity',
            address='Sector 14, Chandigarh'
        )
        self.assertEqual(power_complaint.sla_duration_hours, 24)
        self.assertIsNotNone(power_complaint.sla_deadline)
        self.assertEqual(power_complaint.sla_status, 'COMPLIANT')

        # 2. Roads complaint -> 72 hour SLA
        road_complaint = Complaint.objects.create(
            description='Pothole repair on NH 44',
            department_category='Roads & Bridges (PWD)',
            address='NH 44, Bengaluru'
        )
        self.assertEqual(road_complaint.sla_duration_hours, 72)

        # 3. Breached SLA simulation & automatic escalation on save
        overdue_complaint = Complaint.objects.create(
            description='Water overflow in drain',
            department_category='Water & Sanitation',
            address='Indiranagar, Bengaluru',
            sla_duration_hours=24,
            sla_deadline=timezone.now() - timedelta(hours=2)
        )
        self.assertEqual(overdue_complaint.sla_status, 'BREACHED')
        # Model auto-escalates to LEVEL_2_DIVISION on save when deadline is past
        self.assertTrue(overdue_complaint.is_escalated)
        self.assertEqual(overdue_complaint.escalation_level, Complaint.EscalationLevel.LEVEL_2_DIVISION)

        # 4. Severely overdue (>24h past deadline) -> check_slas escalates to Level 3 (Commissioner)
        from django.core.management import call_command
        severely_overdue = Complaint.objects.create(
            description='Collapsed retaining wall',
            department_category='Roads & Bridges (PWD)',
            address='Ring Road, Bengaluru',
            sla_duration_hours=24,
            sla_deadline=timezone.now() - timedelta(hours=30),
            is_escalated=True,
            escalation_level=Complaint.EscalationLevel.LEVEL_2_DIVISION
        )
        call_command('check_slas')
        severely_overdue.refresh_from_db()
        self.assertEqual(severely_overdue.escalation_level, Complaint.EscalationLevel.LEVEL_3_COMMISSIONER)

    def test_vision_verification_on_resolution(self):
        """Test Computer Vision quality verification engine on resolution proof"""
        from complaints.vision_service import ComputerVisionQualityService
        from accounts.models import OfficerProfile

        officer_user = User.objects.create_user(
            name='Officer Sharma',
            email='officer.sharma@example.gov.in',
            phone_number='+91 9888877777',
            password='TestPassword123',
            role=User.Role.OFFICER
        )
        officer = OfficerProfile.objects.create(
            user=officer_user,
            department_name='Roads & Infrastructure',
            officer_designation='Assistant Engineer',
            is_on_duty=True
        )

        proof_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        proof_file = SimpleUploadedFile("fixed_road.png", proof_content, content_type="image/png")

        complaint = Complaint.objects.create(
            description='Deep pothole near metro station',
            department_category='Roads & Infrastructure',
            address='Metro Station Gate 2, Delhi',
            status=Complaint.Status.IN_PROGRESS,
            assigned_officer=officer,
            central_desk_reviewed=True
        )

        self.client.force_authenticate(user=officer_user)
        resolve_url = reverse('complaint-resolve', kwargs={'tracking_code': complaint.tracking_code})

        response = self.client.post(
            resolve_url,
            {
                'action_taken_report': 'Pothole asphalt cold mix applied, compacted and road opened for traffic.',
                'resolution_proof': proof_file
            },
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        complaint.refresh_from_db()
        self.assertEqual(complaint.status, Complaint.Status.RESOLVED)
        self.assertIn(complaint.vision_verification_status, [
            Complaint.VisionStatus.VERIFIED,
            Complaint.VisionStatus.FLAGGED,
            Complaint.VisionStatus.INCONCLUSIVE
        ])
        self.assertGreaterEqual(complaint.vision_confidence_score, 0.0)

