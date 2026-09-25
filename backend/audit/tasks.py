import logging
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task
def process_audit_event(actor: str, action: str, resource: str, payload: dict = None,
                        actor_id: str = None, resource_id: str = None,
                        ip_address: str = None, correlation_id: str = None):
    from .services import AuditService
    try:
        AuditService._record_event(
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
        logger.error(f"Failed to process audit event async: {e}")
