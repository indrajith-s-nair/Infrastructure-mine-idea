from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AuditEvent
from .services import AuditService


class AuditEventListView(APIView):
    """
    Lists system audit ledger records with cryptographic hashes.
    Can be filtered by action, resource, or resource_id.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = AuditEvent.objects.all().order_by('-sequence')

        action = request.query_params.get('action')
        if action:
            query = query.filter(action=action)

        resource = request.query_params.get('resource')
        if resource:
            query = query.filter(resource=resource)

        resource_id = request.query_params.get('resource_id')
        if resource_id:
            query = query.filter(resource_id=resource_id)

        limit = request.query_params.get('limit', 50)
        try:
            limit = min(int(limit), 200)
        except (ValueError, TypeError):
            limit = 50

        events = query[:limit]
        data = [
            {
                'id': str(e.id),
                'sequence': e.sequence,
                'previous_hash': e.previous_hash,
                'current_hash': e.current_hash,
                'actor': e.actor,
                'actor_id': e.actor_id,
                'action': e.action,
                'resource': e.resource,
                'resource_id': e.resource_id,
                'payload_hash': e.payload_hash,
                'payload': e.payload,
                'created_at': e.created_at.isoformat(),
            }
            for e in events
        ]
        return Response({
            'count': len(data),
            'results': data
        }, status=status.HTTP_200_OK)


class AuditChainVerifyView(APIView):
    """
    Triggers cryptographic audit chain integrity check.
    Recalculates all SHA-256 blocks from genesis to detect any database tampering.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        limit = request.data.get('limit', 500)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 500

        result = AuditService.verify_audit_chain(limit=limit)
        http_status = status.HTTP_200_OK if result.get('valid') else status.HTTP_409_CONFLICT
        return Response(result, status=http_status)

    def get(self, request):
        """Allow quick GET verification check."""
        result = AuditService.verify_audit_chain(limit=500)
        http_status = status.HTTP_200_OK if result.get('valid') else status.HTTP_409_CONFLICT
        return Response(result, status=http_status)


class ComplaintAuditTrailView(APIView):
    """
    Fetches the cryptographic audit history for a specific grievance tracking code.
    Used by public tracking page and administrative dashboards to show immutable history.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, tracking_code):
        clean_code = tracking_code.strip().upper()
        events = AuditEvent.objects.filter(
            resource='Complaint',
            resource_id=clean_code
        ).order_by('sequence')

        chain_verification = AuditService.verify_audit_chain()

        data = [
            {
                'sequence': e.sequence,
                'action': e.action,
                'actor': e.actor,
                'actor_id': e.actor_id,
                'created_at': e.created_at.isoformat(),
                'current_hash': e.current_hash,
                'previous_hash': e.previous_hash,
                'payload_hash': e.payload_hash,
                'payload': e.payload,
            }
            for e in events
        ]

        return Response({
            'tracking_code': clean_code,
            'event_count': len(data),
            'chain_valid': chain_verification.get('valid', True),
            'latest_chain_hash': chain_verification.get('latest_hash'),
            'trail': data
        }, status=status.HTTP_200_OK)
