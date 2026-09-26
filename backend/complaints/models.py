import random
import string
from django.conf import settings
from django.db import models
from django.utils import timezone


def generate_unique_tracking_code():
    """Generates a clean government-tier tracking code e.g. DPIP-2026-X7K9M2"""
    year = timezone.now().year
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"DPIP-{year}-{suffix}"


class Complaint(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'
        REJECTED = 'REJECTED', 'Rejected'

    tracking_code = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        default=generate_unique_tracking_code,
        editable=False,
        verbose_name="Unique Tracking Code"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaints',
        verbose_name="Citizen User"
    )
    description = models.TextField(verbose_name="Complaint Description")
    
    # Audio voice note recorded via MediaRecorder
    voice_note = models.FileField(
        upload_to='voice_notes/%Y/%m/',
        null=True,
        blank=True,
        verbose_name="Voice Note Audio"
    )
    
    # Photos or documents uploaded by citizen
    media_file = models.FileField(
        upload_to='complaint_media/%Y/%m/',
        null=True,
        blank=True,
        verbose_name="Photos / Documents"
    )

    # GPS Coordinates (Latitude & Longitude)
    latitude = models.FloatField(null=True, blank=True, verbose_name="Latitude")
    longitude = models.FloatField(null=True, blank=True, verbose_name="Longitude")
    address = models.CharField(max_length=500, verbose_name="Exact Address")

    # Phase 2: AI Triage & Routing Fields
    ai_severity_score = models.FloatField(
        default=0.0,
        db_index=True,
        verbose_name="AI Severity Score (Urgency)"
    )
    department_category = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Classified Department Category"
    )
    lgd_jurisdiction_code = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="LGD Jurisdiction Code"
    )
    assigned_officer = models.ForeignKey(
        'accounts.OfficerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_complaints',
        verbose_name="Assigned Frontline Officer"
    )
    gemini_suggested_officer = models.ForeignKey(
        'accounts.OfficerProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='gemini_suggested_complaints',
        verbose_name="Gemini Recommended Officer"
    )
    central_desk_reviewed = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Central Desk Reviewed / Dispatched"
    )
    reassigned_to_central_desk = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Reassigned Back to Central Desk"
    )
    reassignment_reason = models.TextField(
        null=True,
        blank=True,
        verbose_name="Officer Reassignment Reason"
    )
    central_desk_operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dispatched_complaints',
        verbose_name="Central Desk Dispatch Operator"
    )
    ai_analysis_summary = models.TextField(
        null=True,
        blank=True,
        verbose_name="AI Triage Summary & Urgency Analysis"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
        verbose_name="Status"
    )

    # Resolution fields & Action Taken Report (ATR)
    action_taken_report = models.TextField(
        null=True,
        blank=True,
        verbose_name="Action Taken Report (ATR)"
    )
    admin_notes = models.TextField(
        null=True,
        blank=True,
        verbose_name="Admin Resolution Notes"
    )
    resolution_proof = models.FileField(
        upload_to='resolution_proofs/%Y/%m/',
        null=True,
        blank=True,
        verbose_name="Photographic Resolution Proof"
    )
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="Resolved At")
    previous_resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="Previous Resolution Timestamp")

    # Computer Vision Quality & Anti-Fraud Verification (Ported from Vision Engine)
    class VisionStatus(models.TextChoices):
        NOT_INSPECTED = 'NOT_INSPECTED', 'Not Inspected'
        VERIFIED = 'VERIFIED', 'Verified Resolved'
        FLAGGED = 'FLAGGED', 'Suspected Unresolved / Fraudulent'
        INCONCLUSIVE = 'INCONCLUSIVE', 'Inconclusive / Manual Review'

    vision_verification_status = models.CharField(
        max_length=30,
        choices=VisionStatus.choices,
        default=VisionStatus.NOT_INSPECTED,
        db_index=True,
        verbose_name="AI Vision Verification Status"
    )
    vision_confidence_score = models.FloatField(
        default=0.0,
        verbose_name="Vision Confidence Score"
    )
    vision_audit_notes = models.TextField(
        null=True,
        blank=True,
        verbose_name="Computer Vision Quality Notes"
    )

    # Multilingual Voice Ingestion Pipeline (Ported from Voice Engine)
    voice_transcript = models.TextField(
        null=True,
        blank=True,
        verbose_name="Automated Speech Transcript"
    )
    detected_language = models.CharField(
        max_length=32,
        default='en',
        verbose_name="Detected Audio Spoken Language"
    )
    voice_translated_english = models.TextField(
        null=True,
        blank=True,
        verbose_name="Voice Translation (English)"
    )

    # Statutory SLA & Hierarchical Escalation (Ported from SLA Engine)
    class EscalationLevel(models.TextChoices):
        LEVEL_1_FIELD = 'LEVEL_1_FIELD', 'Level 1: Frontline Field Officer'
        LEVEL_2_DIVISION = 'LEVEL_2_DIVISION', 'Level 2: Assistant Executive Engineer / Division Head'
        LEVEL_3_COMMISSIONER = 'LEVEL_3_COMMISSIONER', 'Level 3: Municipal Commissioner / District Collector'

    sla_duration_hours = models.PositiveIntegerField(
        default=48,
        verbose_name="Statutory SLA Target Hours"
    )
    sla_deadline = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="SLA Resolution Deadline"
    )
    escalation_level = models.CharField(
        max_length=30,
        choices=EscalationLevel.choices,
        default=EscalationLevel.LEVEL_1_FIELD,
        db_index=True,
        verbose_name="Current Escalation Hierarchy Level"
    )
    is_escalated = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Is Statutorily Escalated"
    )
    escalated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Escalated Timestamp"
    )

    # Citizen Reopen Lifecycle
    is_reopened = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Is Grievance Reopened"
    )
    reopen_reason = models.TextField(
        null=True,
        blank=True,
        verbose_name="Citizen Reopen Reason"
    )
    reopened_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Reopened At"
    )
    reopen_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Number of Times Reopened"
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Registered At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Last Updated")

    class Meta:
        verbose_name = "Citizen Complaint"
        verbose_name_plural = "Citizen Complaints"
        ordering = ['-ai_severity_score', '-created_at']

    def __str__(self):
        return f"[{self.tracking_code}] Score:{self.ai_severity_score} - {self.status} - {self.address[:25]}"

    @property
    def urgency_level(self):
        if self.ai_severity_score >= 85:
            return "CRITICAL"
        elif self.ai_severity_score >= 65:
            return "HIGH"
        elif self.ai_severity_score >= 40:
            return "MEDIUM"
        return "LOW"

    @property
    def sla_hours_remaining(self) -> float:
        if self.status == self.Status.RESOLVED:
            return 0.0
        if not self.sla_deadline:
            return float(self.sla_duration_hours or 48)
        diff_hours = (self.sla_deadline - timezone.now()).total_seconds() / 3600.0
        return round(diff_hours, 1)

    @property
    def sla_status(self) -> str:
        if self.status == self.Status.RESOLVED:
            if self.resolved_at and self.sla_deadline and self.resolved_at > self.sla_deadline:
                return "RESOLVED_OVERDUE"
            return "RESOLVED_IN_SLA"
        if not self.sla_deadline:
            return "COMPLIANT"
        if timezone.now() > self.sla_deadline:
            return "BREACHED"
        if self.sla_hours_remaining <= 12.0:
            return "APPROACHING_BREACH"
        return "COMPLIANT"

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            for _ in range(10):
                code = generate_unique_tracking_code()
                if not Complaint.objects.filter(tracking_code=code).exists():
                    self.tracking_code = code
                    break

        # Compute statutory SLA duration based on Department if not specified
        if not self.sla_duration_hours or self.sla_duration_hours == 48:
            dept = (self.department_category or '').lower()
            if any(w in dept for w in ['power', 'electricity', 'light']):
                self.sla_duration_hours = 24
            elif any(w in dept for w in ['sanitation', 'waste', 'garbage', 'health']):
                self.sla_duration_hours = 24
            elif any(w in dept for w in ['water', 'drainage', 'sewerage']):
                self.sla_duration_hours = 48
            elif any(w in dept for w in ['police', 'order', 'hazard']):
                self.sla_duration_hours = 12
            elif any(w in dept for w in ['road', 'pwd', 'works']):
                self.sla_duration_hours = 72
            elif any(w in dept for w in ['planning', 'building']):
                self.sla_duration_hours = 96
            else:
                self.sla_duration_hours = 48

        if not self.sla_deadline:
            now_dt = self.created_at if self.created_at else timezone.now()
            from datetime import timedelta
            self.sla_deadline = now_dt + timedelta(hours=self.sla_duration_hours)

        # Check and update hierarchical escalation status
        if self.sla_deadline and timezone.now() > self.sla_deadline and self.status in [self.Status.PENDING, self.Status.IN_PROGRESS]:
            if not self.is_escalated:
                self.is_escalated = True
                self.escalated_at = timezone.now()
                self.escalation_level = self.EscalationLevel.LEVEL_2_DIVISION

        # Auto-set resolved_at timestamp when marked resolved
        if self.status == self.Status.RESOLVED and not self.resolved_at:
            self.resolved_at = timezone.now()
        elif self.status != self.Status.RESOLVED:
            if self.resolved_at and not self.previous_resolved_at:
                self.previous_resolved_at = self.resolved_at
            self.resolved_at = None

        super().save(*args, **kwargs)


class CivicFeedback(models.Model):
    """
    Citizen Civic Survey & Public Infrastructure Feedback model.
    Captures granular multidimensional citizen satisfaction metrics for grievance redressal,
    officer performance evaluation, and municipal service quality.
    """
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback_records',
        verbose_name="Associated Grievance Ticket"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='civic_feedbacks',
        verbose_name="Citizen User Account"
    )
    tracking_code = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Tracking Code (if applicable)"
    )
    citizen_name = models.CharField(
        max_length=255,
        default='Citizen',
        verbose_name="Citizen Name"
    )
    citizen_contact = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="Contact / Phone / Email"
    )
    department_category = models.CharField(
        max_length=150,
        default='General Municipal Services',
        db_index=True,
        verbose_name="Department / Civic Service Category"
    )
    ward_or_area = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Ward / Zone / Locality"
    )

    # Granular 1-5 Star Dimension Ratings
    overall_rating = models.PositiveSmallIntegerField(
        default=5,
        verbose_name="Overall Experience (1-5)"
    )
    resolution_satisfaction = models.PositiveSmallIntegerField(
        default=5,
        verbose_name="Grievance Resolution Satisfaction (1-5)"
    )
    officer_timeliness = models.PositiveSmallIntegerField(
        default=5,
        verbose_name="Officer Promptness & Timeliness (1-5)"
    )
    work_quality = models.PositiveSmallIntegerField(
        default=5,
        verbose_name="Quality of Work & Durability (1-5)"
    )
    cleanliness_score = models.PositiveSmallIntegerField(
        default=5,
        verbose_name="Cleanliness & Site Restoration (1-5)"
    )

    comments = models.TextField(
        null=True,
        blank=True,
        verbose_name="Qualitative Feedback / Suggestions"
    )
    photo_proof = models.FileField(
        upload_to='feedback_proofs/%Y/%m/',
        null=True,
        blank=True,
        verbose_name="Citizen Verification Photo"
    )
    would_recommend = models.BooleanField(
        default=True,
        verbose_name="Would Recommend DPIP Resolution Services"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Submitted At"
    )

    class Meta:
        verbose_name = "Civic Feedback & Survey"
        verbose_name_plural = "Civic Feedback & Surveys"
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback #{self.id} - {self.citizen_name} ({self.overall_rating}/5 Stars) [{self.department_category}]"


