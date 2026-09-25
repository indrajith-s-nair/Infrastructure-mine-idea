import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from complaints.models import Complaint
from audit.services import AuditService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Evaluates active complaints against statutory department SLAs, updates countdown timers, and executes hierarchical escalations."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate SLA checks and escalations without persisting changes.',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        now = timezone.now()
        self.stdout.write(self.style.NOTICE(f"[{now.isoformat()}] Starting Statutory SLA Audit & Hierarchical Escalation Run (dry_run={dry_run})..."))

        active_statuses = [Complaint.Status.PENDING, Complaint.Status.IN_PROGRESS]
        active_complaints = Complaint.objects.filter(status__in=active_statuses)

        scanned = 0
        compliant = 0
        approaching = 0
        breached = 0
        escalated_l2 = 0
        escalated_l3 = 0

        for complaint in active_complaints:
            scanned += 1

            # Ensure deadline exists
            if not complaint.sla_deadline:
                duration = complaint.sla_duration_hours or 48
                complaint.sla_deadline = (complaint.created_at or now) + timedelta(hours=duration)
                if not dry_run:
                    complaint.save(update_fields=['sla_deadline'])

            sla_status = complaint.sla_status
            hours_remaining = complaint.sla_hours_remaining

            if sla_status == "COMPLIANT":
                compliant += 1
            elif sla_status == "APPROACHING_BREACH":
                approaching += 1
            elif sla_status == "BREACHED":
                breached += 1

                # Check hierarchical escalation logic
                # Level 1 -> Level 2
                if not complaint.is_escalated:
                    self.stdout.write(self.style.WARNING(
                        f"Ticket {complaint.tracking_code} breached SLA deadline ({complaint.sla_deadline}). Escalating to Level 2 (Division Head)."
                    ))
                    if not dry_run:
                        complaint.is_escalated = True
                        complaint.escalated_at = now
                        complaint.escalation_level = Complaint.EscalationLevel.LEVEL_2_DIVISION
                        complaint.save(update_fields=['is_escalated', 'escalated_at', 'escalation_level'])

                        AuditService.record_event(
                            actor="SLA_MONITOR_DAEMON",
                            action="complaint.sla_breached_escalated",
                            resource="Complaint",
                            resource_id=complaint.tracking_code,
                            payload={
                                "tracking_code": complaint.tracking_code,
                                "previous_level": Complaint.EscalationLevel.LEVEL_1_FIELD,
                                "new_level": Complaint.EscalationLevel.LEVEL_2_DIVISION,
                                "sla_duration_hours": complaint.sla_duration_hours,
                                "sla_deadline": complaint.sla_deadline.isoformat(),
                                "hours_overdue": round(abs(hours_remaining), 2)
                            }
                        )
                    escalated_l2 += 1

                # Level 2 -> Level 3 (Overdue by more than 24h past initial deadline)
                elif complaint.escalation_level == Complaint.EscalationLevel.LEVEL_2_DIVISION:
                    if complaint.sla_deadline and now > (complaint.sla_deadline + timedelta(hours=24)):
                        self.stdout.write(self.style.ERROR(
                            f"Ticket {complaint.tracking_code} severely overdue (>24h beyond SLA). Escalating to Level 3 (Municipal Commissioner)."
                        ))
                        if not dry_run:
                            complaint.escalation_level = Complaint.EscalationLevel.LEVEL_3_COMMISSIONER
                            complaint.escalated_at = now
                            complaint.save(update_fields=['escalation_level', 'escalated_at'])

                            AuditService.record_event(
                                actor="SLA_MONITOR_DAEMON",
                                action="complaint.sla_escalated_commissioner",
                                resource="Complaint",
                                resource_id=complaint.tracking_code,
                                payload={
                                    "tracking_code": complaint.tracking_code,
                                    "previous_level": Complaint.EscalationLevel.LEVEL_2_DIVISION,
                                    "new_level": Complaint.EscalationLevel.LEVEL_3_COMMISSIONER,
                                    "sla_deadline": complaint.sla_deadline.isoformat(),
                                    "hours_overdue": round(abs(hours_remaining), 2)
                                }
                            )
                        escalated_l3 += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nSLA Evaluation Summary:\n"
            f"  - Total Active Scanned: {scanned}\n"
            f"  - Compliant: {compliant}\n"
            f"  - Approaching Breach (<=12h): {approaching}\n"
            f"  - Breached: {breached}\n"
            f"  - Newly Escalated to L2 (Division Head): {escalated_l2}\n"
            f"  - Newly Escalated to L3 (Commissioner): {escalated_l3}\n"
        ))
