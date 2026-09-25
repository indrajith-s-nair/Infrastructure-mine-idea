import hashlib
import json
import logging
import uuid
from django.db import transaction
from django.utils import timezone
from .models import AuditEvent

logger = logging.getLogger(__name__)

GENESIS_HASH = "0" * 64


class AuditService:
    @staticmethod
    def compute_payload_hash(payload: dict) -> str:
        """
        Produces deterministic SHA-256 hash of JSON payload using sorted keys.
        """
        if payload is None:
            payload = {}
        canonical_str = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()

    @staticmethod
    def compute_event_hash(previous_hash: str, event_id: str, actor: str,
                           timestamp_iso: str, action: str, resource: str,
                           payload_hash: str) -> str:
        """
        Cryptographic formula:
        SHA256(previous_hash + event_id + actor + timestamp_iso + action + resource + payload_hash)
        """
        raw = f"{previous_hash}{event_id}{actor}{timestamp_iso}{action}{resource}{payload_hash}"
        return hashlib.sha256(raw.encode('utf-8')).hexdigest()

    @classmethod
    def record_event(cls, actor: str, action: str, resource: str, payload: dict = None,
                     actor_id: str = None, resource_id: str = None,
                     ip_address: str = None, correlation_id: str = None) -> None:
        """
        Atomically appends audit event to the tamper-evident cryptographic hash chain.
        """
        try:
            cls._record_event(
                actor=actor,
                action=action,
                resource=resource,
                payload=payload,
                actor_id=actor_id,
                resource_id=resource_id,
                ip_address=ip_address,
                correlation_id=correlation_id
            )
        except Exception as e:
            logger.error(f"Failed to record audit event: {e}", exc_info=True)

    @classmethod
    def _record_event(cls, actor: str, action: str, resource: str, payload: dict = None,
                     actor_id: str = None, resource_id: str = None,
                     ip_address: str = None, correlation_id: str = None) -> AuditEvent:
        """
        Atomically appends a new audit record to the tamper-evident hash chain.
        """
        if payload is None:
            payload = {}

        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                with transaction.atomic():
                    last_event = AuditEvent.objects.select_for_update().order_by('-sequence').first()
                    if last_event:
                        sequence = last_event.sequence + 1
                        previous_hash = last_event.current_hash
                    else:
                        sequence = 1
                        previous_hash = GENESIS_HASH

                    event_id = str(uuid.uuid4())
                    now = timezone.now()
                    timestamp_iso = now.isoformat()
                    payload_hash = cls.compute_payload_hash(payload)

                    current_hash = cls.compute_event_hash(
                        previous_hash=previous_hash,
                        event_id=event_id,
                        actor=str(actor),
                        timestamp_iso=timestamp_iso,
                        action=action,
                        resource=resource,
                        payload_hash=payload_hash
                    )

                    audit_event = AuditEvent(
                        id=event_id,
                        sequence=sequence,
                        previous_hash=previous_hash,
                        current_hash=current_hash,
                        actor=str(actor),
                        actor_id=str(actor_id) if actor_id else None,
                        action=action,
                        resource=resource,
                        resource_id=str(resource_id) if resource_id else None,
                        payload_hash=payload_hash,
                        payload=payload,
                        ip_address=ip_address,
                        correlation_id=correlation_id,
                        created_at=now
                    )
                    super(AuditEvent, audit_event).save()
                    logger.info(f"Audit event recorded: seq={sequence}, action={action}, resource={resource}:{resource_id}, hash={current_hash[:12]}...")
                    return audit_event
            except Exception as e:
                # Catch lock contention (e.g. SQLite database locked or PG serialization failure)
                if attempt < max_retries - 1 and ('locked' in str(e).lower() or 'concurrency' in str(e).lower()):
                    time.sleep(0.08 * (attempt + 1))
                    continue
                raise

    @classmethod
    def verify_audit_chain(cls, start_sequence: int = 1, limit: int = None) -> dict:
        """
        Sequentially recalculates all hashes and verifies unbroken SHA-256 chain integrity.
        Returns validation status, verified record count, and diagnostic details.
        """
        query = AuditEvent.objects.filter(sequence__gte=start_sequence).order_by('sequence')
        if limit:
            query = query[:limit]

        events = list(query)
        if not events:
            return {
                'valid': True,
                'verified_count': 0,
                'message': 'No audit records to verify.',
                'genesis_hash': GENESIS_HASH,
                'latest_hash': GENESIS_HASH,
            }

        expected_prev_hash = GENESIS_HASH if events[0].sequence == 1 else None
        verified_count = 0

        for i, event in enumerate(events):
            # Check previous hash link
            if i == 0 and expected_prev_hash is not None:
                if event.previous_hash != expected_prev_hash:
                    return {
                        'valid': False,
                        'broken_sequence': event.sequence,
                        'reason': f"Genesis previous_hash mismatch at sequence #{event.sequence}.",
                        'verified_count': verified_count
                    }
            elif i > 0:
                if event.previous_hash != events[i-1].current_hash:
                    return {
                        'valid': False,
                        'broken_sequence': event.sequence,
                        'reason': f"Broken chain link: seq #{event.sequence} previous_hash does not match seq #{events[i-1].sequence} current_hash.",
                        'verified_count': verified_count
                    }

            # Recalculate payload hash
            recalc_payload_hash = cls.compute_payload_hash(event.payload)
            if recalc_payload_hash != event.payload_hash:
                return {
                    'valid': False,
                    'broken_sequence': event.sequence,
                    'reason': f"Payload tampering detected at sequence #{event.sequence}.",
                    'verified_count': verified_count
                }

            # Recalculate current hash
            recalc_current_hash = cls.compute_event_hash(
                previous_hash=event.previous_hash,
                event_id=str(event.id),
                actor=event.actor,
                timestamp_iso=event.created_at.isoformat(),
                action=event.action,
                resource=event.resource,
                payload_hash=recalc_payload_hash
            )

            if recalc_current_hash != event.current_hash:
                return {
                    'valid': False,
                    'broken_sequence': event.sequence,
                    'reason': f"Current hash tampering detected at sequence #{event.sequence}.",
                    'verified_count': verified_count
                }

            verified_count += 1

        return {
            'valid': True,
            'verified_count': verified_count,
            'latest_sequence': events[-1].sequence,
            'latest_hash': events[-1].current_hash,
            'genesis_hash': GENESIS_HASH,
            'message': f"Audit ledger verified successfully across {verified_count} records. All SHA-256 blocks intact."
        }
