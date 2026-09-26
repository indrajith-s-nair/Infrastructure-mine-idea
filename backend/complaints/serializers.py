import os
import re
from rest_framework import serializers
from .models import Complaint
from accounts.models import OfficerProfile
from .gemini_service import analyze_and_assign_complaint_with_gemini, analyze_complaint_with_gemini


def auto_route_complaint_to_officer(complaint: Complaint) -> OfficerProfile | None:
    """
    Automatic routing engine: Matches complaint to the officer whose
    department_name and lgd_jurisdiction_code match the ticket.
    """
    dept = complaint.department_category or ""
    lgd = complaint.lgd_jurisdiction_code or ""

    # 1. Exact Department + LGD match
    officer = OfficerProfile.objects.filter(
        department_name__iexact=dept,
        lgd_jurisdiction_code__iexact=lgd,
        is_on_duty=True
    ).first()
    if officer:
        return officer

    # 2. Case-insensitive / partial department match + exact LGD
    dept_keyword = dept.split()[0] if dept else ""
    officer = OfficerProfile.objects.filter(
        department_name__icontains=dept_keyword,
        lgd_jurisdiction_code__iexact=lgd,
        is_on_duty=True
    ).first()
    if officer:
        return officer

    # 3. Exact Department match (any jurisdiction fallback)
    officer = OfficerProfile.objects.filter(
        department_name__iexact=dept,
        is_on_duty=True
    ).first()
    if officer:
        return officer

    # 4. Partial Department match fallback
    officer = OfficerProfile.objects.filter(
        department_name__icontains=dept_keyword,
        is_on_duty=True
    ).first()
    if officer:
        return officer

    # 5. Any on-duty officer fallback
    return OfficerProfile.objects.filter(is_on_duty=True).first()


class ComplaintCreateSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    lgd_jurisdiction_code = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    gemini_suggested_officer_details = serializers.SerializerMethodField()
    assigned_officer_details = serializers.SerializerMethodField()

    def validate_media_file(self, value):
        if value:
            if value.size > 15 * 1024 * 1024:
                raise serializers.ValidationError("Attached media file exceeds maximum allowed size of 15MB.")
            ext = os.path.splitext(value.name)[1].lower()
            allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.mov', '.avi', '.webm']
            if ext not in allowed:
                raise serializers.ValidationError(f"Unsupported file format '{ext}'. Allowed: {', '.join(allowed)}")
        return value

    def validate_voice_note(self, value):
        if value:
            if value.size > 15 * 1024 * 1024:
                raise serializers.ValidationError("Voice note exceeds maximum allowed size of 15MB.")
            ext = os.path.splitext(value.name)[1].lower()
            allowed = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.aac']
            if ext not in allowed:
                raise serializers.ValidationError(f"Unsupported audio format '{ext}'. Allowed: {', '.join(allowed)}")
        return value

    sla_status = serializers.CharField(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'tracking_code',
            'description',
            'voice_note',
            'media_file',
            'latitude',
            'longitude',
            'address',
            'lgd_jurisdiction_code',
            'ai_severity_score',
            'department_category',
            'ai_analysis_summary',
            'status',
            'central_desk_reviewed',
            'reassigned_to_central_desk',
            'gemini_suggested_officer_details',
            'assigned_officer_details',
            'voice_transcript',
            'detected_language',
            'voice_translated_english',
            'sla_duration_hours',
            'sla_deadline',
            'sla_status',
            'created_at'
        ]
        read_only_fields = [
            'id', 'tracking_code', 'ai_severity_score', 'department_category', 'ai_analysis_summary',
            'status', 'central_desk_reviewed', 'reassigned_to_central_desk',
            'gemini_suggested_officer_details', 'assigned_officer_details',
            'voice_transcript', 'detected_language', 'voice_translated_english',
            'sla_duration_hours', 'sla_deadline', 'sla_status', 'created_at'
        ]

    def get_gemini_suggested_officer_details(self, obj):
        if not obj.gemini_suggested_officer:
            return None
        return {
            'id': obj.gemini_suggested_officer.id,
            'name': obj.gemini_suggested_officer.user.name,
            'email': obj.gemini_suggested_officer.user.email,
            'role': obj.gemini_suggested_officer.officer_designation,
            'role_display': obj.gemini_suggested_officer.officer_designation,
            'department': obj.gemini_suggested_officer.department_name,
        }

    def get_assigned_officer_details(self, obj):
        if not obj.assigned_officer:
            return None
        return {
            'id': obj.assigned_officer.id,
            'name': obj.assigned_officer.user.name,
            'email': obj.assigned_officer.user.email,
            'role': obj.assigned_officer.officer_designation,
            'role_display': obj.assigned_officer.officer_designation,
            'department': obj.assigned_officer.department_name,
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user

        description = validated_data.get('description', '')
        address = validated_data.get('address', '')
        lgd_code = validated_data.get('lgd_jurisdiction_code')

        # Auto-extract pincode/LGD from address if not provided
        if not lgd_code and address:
            pin_match = re.search(r'\b(110\d{3}|560\d{3}|600\d{3}|400\d{3}|700\d{3}|\d{6})\b', address)
            if pin_match:
                lgd_code = f"LGD-{pin_match.group(1)}"
            else:
                lgd_code = "LGD-DEL-042"
        elif not lgd_code:
            lgd_code = "LGD-DEL-042"

        # Process Multilingual Voice Note if attached
        voice_note = validated_data.get('voice_note')
        if voice_note:
            try:
                from .voice_service import VoicePipelineService
                voice_res = VoicePipelineService.process_voice_audio(voice_note)
                if voice_res and voice_res.transcript:
                    validated_data['voice_transcript'] = voice_res.transcript
                    validated_data['detected_language'] = voice_res.detected_language
                    validated_data['voice_translated_english'] = voice_res.translated_english
                    spoken_info = voice_res.translated_english or voice_res.transcript
                    if not description or not description.strip():
                        description = f"[Spoken Audio Grievance ({voice_res.detected_language})]: {spoken_info}".strip()
                    elif len(description.strip()) < 20:
                        description = f"{description}\n[Spoken Audio Grievance ({voice_res.detected_language})]: {spoken_info}".strip()
                    validated_data['description'] = description
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Voice pipeline processing error: {e}")

        # Guard against blank description
        if not description or not description.strip():
            description = "Civic grievance recorded and submitted via DPIP Citizen Portal."
            validated_data['description'] = description

        # 1. Collect Active Frontline Officers for Gemini Assignment
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

        # 2. Run Gemini AI Triage & Dynamic Assignment
        triage = analyze_and_assign_complaint_with_gemini(
            description=description,
            address=address,
            candidate_officers=candidate_roster
        )
        validated_data['ai_severity_score'] = triage['ai_severity_score']
        validated_data['department_category'] = triage['department_category']
        validated_data['ai_analysis_summary'] = triage['ai_analysis_summary']

        complaint = super().create(validated_data)

        # 3. Human-in-the-Loop: Store Gemini Recommended Officer for Central Desk Dispatch
        suggested_officer = None
        if triage.get('assigned_officer_id'):
            suggested_officer = OfficerProfile.objects.filter(id=triage['assigned_officer_id']).first()
        elif triage.get('assigned_officer_email'):
            suggested_officer = OfficerProfile.objects.filter(user__email__iexact=triage['assigned_officer_email']).first()

        if not suggested_officer:
            suggested_officer = auto_route_complaint_to_officer(complaint)

        complaint.gemini_suggested_officer = suggested_officer
        complaint.assigned_officer = None  # Sent to Central Desk queue for human verification & dispatch
        complaint.central_desk_reviewed = False
        complaint.reassigned_to_central_desk = False
        complaint.save(update_fields=['gemini_suggested_officer', 'assigned_officer', 'central_desk_reviewed', 'reassigned_to_central_desk'])

        return complaint


class CentralDeskComplaintSerializer(serializers.ModelSerializer):
    """
    High-fidelity serializer for Central Triage Desk (Human-in-the-Loop Operator View).
    """
    voice_note_url = serializers.SerializerMethodField()
    media_file_url = serializers.SerializerMethodField()
    resolution_proof_url = serializers.SerializerMethodField()
    urgency_level = serializers.CharField(read_only=True)
    citizen_name = serializers.SerializerMethodField()
    citizen_phone = serializers.SerializerMethodField()
    gemini_suggested_officer = serializers.SerializerMethodField()
    assigned_officer = serializers.SerializerMethodField()
    central_desk_operator_name = serializers.SerializerMethodField()
    sla_status = serializers.CharField(read_only=True)
    sla_hours_remaining = serializers.FloatField(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'tracking_code',
            'description',
            'status',
            'address',
            'latitude',
            'longitude',
            'ai_severity_score',
            'urgency_level',
            'department_category',
            'lgd_jurisdiction_code',
            'ai_analysis_summary',
            'central_desk_reviewed',
            'reassigned_to_central_desk',
            'reassignment_reason',
            'gemini_suggested_officer',
            'assigned_officer',
            'central_desk_operator_name',
            'admin_notes',
            'action_taken_report',
            'resolved_at',
            'voice_note_url',
            'media_file_url',
            'resolution_proof_url',
            'citizen_name',
            'citizen_phone',
            'vision_verification_status',
            'vision_confidence_score',
            'vision_audit_notes',
            'voice_transcript',
            'detected_language',
            'voice_translated_english',
            'sla_duration_hours',
            'sla_deadline',
            'escalation_level',
            'is_escalated',
            'escalated_at',
            'sla_status',
            'sla_hours_remaining',
            'created_at',
            'updated_at'
        ]

    def get_citizen_name(self, obj):
        return obj.user.name if obj.user else "Anonymous Citizen"

    def get_citizen_phone(self, obj):
        return obj.user.phone_number if obj.user else "Not Available"

    def get_central_desk_operator_name(self, obj):
        return obj.central_desk_operator.name if obj.central_desk_operator else None

    def get_gemini_suggested_officer(self, obj):
        if obj.gemini_suggested_officer:
            off = obj.gemini_suggested_officer
            return {
                'id': off.id,
                'name': off.user.name,
                'email': off.user.email,
                'designation': off.officer_designation,
                'department_name': off.department_name,
                'lgd_jurisdiction_code': off.lgd_jurisdiction_code,
                'badge_number': off.badge_number,
                'jurisdiction_area': off.jurisdiction_area,
            }
        return None

    def get_assigned_officer(self, obj):
        if obj.assigned_officer:
            off = obj.assigned_officer
            return {
                'id': off.id,
                'name': off.user.name,
                'email': off.user.email,
                'designation': off.officer_designation,
                'department_name': off.department_name,
                'lgd_jurisdiction_code': off.lgd_jurisdiction_code,
            }
        return None

    def get_voice_note_url(self, obj):
        if obj.voice_note:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.voice_note.url) if request else obj.voice_note.url
        return None

    def get_media_file_url(self, obj):
        if obj.media_file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.media_file.url) if request else obj.media_file.url
        return None

    def get_resolution_proof_url(self, obj):
        if obj.resolution_proof:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.resolution_proof.url) if request else obj.resolution_proof.url
        return None


class OfficerComplaintSerializer(serializers.ModelSerializer):
    """
    High-fidelity serializer for Level 1 Frontline Officer Mobile Feed & Detail View.
    """
    voice_note_url = serializers.SerializerMethodField()
    media_file_url = serializers.SerializerMethodField()
    resolution_proof_url = serializers.SerializerMethodField()
    urgency_level = serializers.CharField(read_only=True)
    citizen_name = serializers.SerializerMethodField()
    citizen_phone = serializers.SerializerMethodField()
    assigned_officer_name = serializers.SerializerMethodField()
    assigned_officer_designation = serializers.SerializerMethodField()
    sla_status = serializers.CharField(read_only=True)
    sla_hours_remaining = serializers.FloatField(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'tracking_code',
            'description',
            'status',
            'address',
            'latitude',
            'longitude',
            'ai_severity_score',
            'urgency_level',
            'department_category',
            'lgd_jurisdiction_code',
            'ai_analysis_summary',
            'action_taken_report',
            'admin_notes',
            'voice_note_url',
            'media_file_url',
            'resolution_proof_url',
            'citizen_name',
            'citizen_phone',
            'assigned_officer_name',
            'assigned_officer_designation',
            'vision_verification_status',
            'vision_confidence_score',
            'vision_audit_notes',
            'voice_transcript',
            'detected_language',
            'voice_translated_english',
            'sla_duration_hours',
            'sla_deadline',
            'escalation_level',
            'is_escalated',
            'escalated_at',
            'sla_status',
            'sla_hours_remaining',
            'is_reopened',
            'reopen_reason',
            'reopened_at',
            'reopen_count',
            'created_at',
            'updated_at',
            'resolved_at'
        ]

    def get_citizen_name(self, obj):
        return obj.user.name if obj.user else "Anonymous Citizen"

    def get_citizen_phone(self, obj):
        return obj.user.phone_number if obj.user else "Not Available"

    def get_assigned_officer_name(self, obj):
        return obj.assigned_officer.user.name if obj.assigned_officer else None

    def get_assigned_officer_designation(self, obj):
        return obj.assigned_officer.officer_designation if obj.assigned_officer else None

    def get_voice_note_url(self, obj):
        if obj.voice_note:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.voice_note.url) if request else obj.voice_note.url
        return None

    def get_media_file_url(self, obj):
        if obj.media_file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.media_file.url) if request else obj.media_file.url
        return None

    def get_resolution_proof_url(self, obj):
        if obj.resolution_proof:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.resolution_proof.url) if request else obj.resolution_proof.url
        return None


class ComplaintTrackingSerializer(serializers.ModelSerializer):
    voice_note_url = serializers.SerializerMethodField()
    media_file_url = serializers.SerializerMethodField()
    resolution_proof_url = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    citizen_name = serializers.SerializerMethodField()
    urgency_level = serializers.CharField(read_only=True)
    assigned_officer_designation = serializers.SerializerMethodField()
    sla_status = serializers.CharField(read_only=True)
    sla_hours_remaining = serializers.FloatField(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'tracking_code',
            'description',
            'status',
            'address',
            'latitude',
            'longitude',
            'ai_severity_score',
            'urgency_level',
            'department_category',
            'lgd_jurisdiction_code',
            'ai_analysis_summary',
            'assigned_officer_designation',
            'action_taken_report',
            'voice_note_url',
            'media_file_url',
            'admin_notes',
            'resolution_proof_url',
            'vision_verification_status',
            'vision_confidence_score',
            'vision_audit_notes',
            'voice_transcript',
            'detected_language',
            'voice_translated_english',
            'sla_duration_hours',
            'sla_deadline',
            'escalation_level',
            'is_escalated',
            'escalated_at',
            'sla_status',
            'sla_hours_remaining',
            'is_reopened',
            'reopen_reason',
            'reopened_at',
            'reopen_count',
            'previous_resolved_at',
            'created_at',
            'updated_at',
            'resolved_at',
            'timeline',
            'citizen_name'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        is_authorized = (
            user and user.is_authenticated and (
                user.is_staff or 
                getattr(user, 'role', '') in ['OFFICER', 'CENTRAL_DESK', 'ADMIN'] or 
                hasattr(user, 'officer_profile') or 
                (instance.user and instance.user == user)
            )
        )
        if not is_authorized and ret.get('latitude') and ret.get('longitude'):
            # Apply deterministic corridor-level privacy offset (~60m) for public/unauthenticated viewers
            import hashlib, math
            lat = float(ret['latitude'])
            lng = float(ret['longitude'])
            h = int(hashlib.md5(instance.tracking_code.encode('utf-8')).hexdigest()[:8], 16)
            angle = (h % 360) * (math.pi / 180.0)
            dist = 60.0 + (h % 25)
            d_lat = (dist * math.cos(angle)) / 111320.0
            cos_lat = math.cos(math.radians(lat))
            d_lon = (dist * math.sin(angle)) / (111320.0 * (cos_lat if abs(cos_lat) > 0.001 else 1.0))
            ret['latitude'] = round(lat + d_lat, 5)
            ret['longitude'] = round(lng + d_lon, 5)
        return ret

    def get_citizen_name(self, obj):
        return obj.user.name if obj.user else "Citizen"

    def get_assigned_officer_designation(self, obj):
        if obj.assigned_officer:
            return f"{obj.assigned_officer.officer_designation} ({obj.assigned_officer.department_name})"
        return "Jurisdictional Frontline Officer"

    def get_voice_note_url(self, obj):
        if obj.voice_note:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.voice_note.url) if request else obj.voice_note.url
        return None

    def get_media_file_url(self, obj):
        if obj.media_file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.media_file.url) if request else obj.media_file.url
        return None

    def get_resolution_proof_url(self, obj):
        if obj.resolution_proof:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.resolution_proof.url) if request else obj.resolution_proof.url
        return None

    def get_timeline(self, obj):
        """Dynamic step-by-step progress timeline based on complaint status"""
        officer_title = obj.assigned_officer.officer_designation if obj.assigned_officer else 'Jurisdictional Officer'
        is_reopened = getattr(obj, 'is_reopened', False)
        steps = [
            {
                'step': 1,
                'title': 'Complaint Registered & AI Triaged',
                'description': f'Tracking ID {obj.tracking_code} generated. AI Severity: {obj.ai_severity_score}/100 ({obj.department_category or "General Civic"}).',
                'timestamp': obj.created_at,
                'completed': True,
                'current': (obj.status == Complaint.Status.PENDING and not is_reopened)
            },
            {
                'step': 2,
                'title': 'Assigned to Frontline Officer',
                'description': f'Assigned to {officer_title} ({obj.lgd_jurisdiction_code or "LGD Jurisdiction"}) for on-ground verification.',
                'timestamp': obj.updated_at if (obj.status in [Complaint.Status.IN_PROGRESS, Complaint.Status.RESOLVED] or is_reopened) else None,
                'completed': obj.status in [Complaint.Status.IN_PROGRESS, Complaint.Status.RESOLVED] or is_reopened,
                'current': obj.status == Complaint.Status.IN_PROGRESS
            },
            {
                'step': 3,
                'title': 'Field Work & Rectification',
                'description': 'On-ground repair and remediation work in progress by department team.',
                'timestamp': obj.updated_at if (obj.status == Complaint.Status.RESOLVED or is_reopened) else None,
                'completed': obj.status == Complaint.Status.RESOLVED or is_reopened,
                'current': False
            },
            {
                'step': 4,
                'title': 'Resolution Verified & Photographic Proof Uploaded',
                'description': (
                    f"ATR: {obj.action_taken_report or 'Work completed'}. "
                    f"Vision AI Audit: {obj.get_vision_verification_status_display()} ({int(obj.vision_confidence_score * 100)}% confidence)."
                    if obj.vision_verification_status != Complaint.VisionStatus.NOT_INSPECTED
                    else (obj.action_taken_report or 'Issue resolved with official Action Taken Report and photographic proof.')
                ),
                'timestamp': obj.resolved_at or obj.previous_resolved_at,
                'completed': obj.status == Complaint.Status.RESOLVED or is_reopened,
                'current': obj.status == Complaint.Status.RESOLVED
            }
        ]
        if obj.is_escalated:
            steps.insert(2, {
                'step': 3,
                'title': f'Statutory SLA Escalation ({obj.get_escalation_level_display()})',
                'description': f'Grievance breached {obj.sla_duration_hours}h statutory deadline. Escalated to supervisory authority for expedited action.',
                'timestamp': obj.escalated_at or obj.sla_deadline,
                'completed': True,
                'current': (obj.status in [Complaint.Status.PENDING, Complaint.Status.IN_PROGRESS])
            })
            # Re-number steps
            for i, s in enumerate(steps):
                s['step'] = i + 1

        if is_reopened:
            steps.append({
                'step': len(steps) + 1,
                'title': f'Grievance Reopened by Citizen (Reopened x{obj.reopen_count})',
                'description': f'Citizen Reason: "{obj.reopen_reason}". Escalated to Central Desk for priority re-triage.',
                'timestamp': obj.reopened_at,
                'completed': True,
                'current': obj.status == Complaint.Status.PENDING
            })
        elif obj.status == Complaint.Status.REJECTED:
            steps.append({
                'step': len(steps) + 1,
                'title': 'Complaint Rejected / Closed',
                'description': obj.admin_notes or 'Complaint could not be verified or is outside municipal purview.',
                'timestamp': obj.updated_at,
                'completed': True,
                'current': True
            })
        return steps


class ComplaintResolveSerializer(serializers.ModelSerializer):
    """
    Resolution Serializer: Strictly requires photographic proof (resolution_proof)
    and Action Taken Report (action_taken_report or admin_notes).
    """
    action_taken_report = serializers.CharField(required=True, allow_blank=False)
    resolution_proof = serializers.FileField(required=True, allow_null=False)

    class Meta:
        model = Complaint
        fields = ['action_taken_report', 'resolution_proof', 'admin_notes']

    def validate_resolution_proof(self, value):
        if not value:
            raise serializers.ValidationError("Photographic proof of the fixed issue is strictly mandatory for resolution.")
        if value.size > 15 * 1024 * 1024:
            raise serializers.ValidationError("Resolution proof file exceeds maximum allowed size of 15MB.")
        ext = os.path.splitext(value.name)[1].lower()
        allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.heic']
        if ext not in allowed:
            raise serializers.ValidationError(f"Unsupported file format '{ext}'. Must be an image or document ({', '.join(allowed)}).")
        return value

    def update(self, instance, validated_data):
        instance.status = Complaint.Status.RESOLVED
        instance.action_taken_report = validated_data.get('action_taken_report', instance.action_taken_report)
        instance.admin_notes = validated_data.get('admin_notes', instance.action_taken_report)
        instance.resolution_proof = validated_data.get('resolution_proof', instance.resolution_proof)
        instance.save()
        return instance


class CivicFeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for Citizen Civic Survey & Grievance Feedback.
    """
    overall_rating = serializers.IntegerField(min_value=1, max_value=5, default=5)
    resolution_satisfaction = serializers.IntegerField(min_value=1, max_value=5, default=5)
    officer_timeliness = serializers.IntegerField(min_value=1, max_value=5, default=5)
    work_quality = serializers.IntegerField(min_value=1, max_value=5, default=5)
    cleanliness_score = serializers.IntegerField(min_value=1, max_value=5, default=5)
    tracking_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    photo_proof = serializers.FileField(required=False, allow_null=True)

    class Meta:
        from .models import CivicFeedback
        model = CivicFeedback
        fields = [
            'id',
            'complaint',
            'tracking_code',
            'citizen_name',
            'citizen_contact',
            'department_category',
            'ward_or_area',
            'overall_rating',
            'resolution_satisfaction',
            'officer_timeliness',
            'work_quality',
            'cleanliness_score',
            'comments',
            'photo_proof',
            'would_recommend',
            'created_at',
        ]
        read_only_fields = ['id', 'complaint', 'created_at']

    def create(self, validated_data):
        from .models import CivicFeedback, Complaint
        tracking_code = validated_data.get('tracking_code')
        complaint = None
        if tracking_code:
            complaint = Complaint.objects.filter(tracking_code__iexact=tracking_code.strip()).first()
            if complaint:
                validated_data['complaint'] = complaint
                if not validated_data.get('department_category') or validated_data.get('department_category') == 'General Municipal Services':
                    validated_data['department_category'] = complaint.department_category or 'General Municipal Services'
                if not validated_data.get('ward_or_area'):
                    validated_data['ward_or_area'] = complaint.address

        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user
            if not validated_data.get('citizen_name') or validated_data.get('citizen_name') == 'Citizen':
                validated_data['citizen_name'] = request.user.name

        return super().create(validated_data)

