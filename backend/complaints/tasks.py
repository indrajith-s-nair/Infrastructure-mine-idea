import logging
from celery import shared_task
from django.core.management import call_command

logger = logging.getLogger(__name__)


@shared_task(name='complaints.tasks.check_statutory_slas')
def check_statutory_slas():
    """
    Periodic task to evaluate SLA deadlines and trigger hierarchical escalations.
    """
    logger.info("Executing statutory SLA check periodic task...")
    try:
        call_command('check_slas')
        return "SLA audit completed successfully"
    except Exception as e:
        logger.error(f"Error executing check_slas task: {e}")
        return f"SLA audit failed: {e}"


@shared_task(name='complaints.tasks.async_verify_resolution')
def async_verify_resolution(tracking_code: str, actor_name: str = "CELERY_VISION_WORKER"):
    """
    Background worker task to run Computer Vision verification on resolution photographic evidence.
    """
    from complaints.models import Complaint
    from complaints.vision_service import ComputerVisionQualityService

    complaint = Complaint.objects.filter(tracking_code__iexact=tracking_code.strip()).first()
    if not complaint:
        return f"Complaint {tracking_code} not found"

    res = ComputerVisionQualityService.verify_resolution_proof(complaint=complaint, actor_name=actor_name)
    return res
