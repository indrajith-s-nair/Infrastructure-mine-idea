import hashlib
import json
import uuid
from django.db import models
from django.utils import timezone


class AuditEvent(models.Model):
    """
    Immutable, cryptographically chained SHA-256 audit ledger record.
    Provides tamper-evident verification for all DPIP complaint and governance actions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sequence = models.BigIntegerField(unique=True, db_index=True)
    previous_hash = models.CharField(max_length=64, db_index=True)
    current_hash = models.CharField(max_length=64, db_index=True)

    actor = models.CharField(max_length=255, db_index=True)
    actor_id = models.CharField(max_length=128, blank=True, null=True)

    action = models.CharField(max_length=128, db_index=True)
    resource = models.CharField(max_length=128, db_index=True)
    resource_id = models.CharField(max_length=128, blank=True, null=True, db_index=True)

    payload_hash = models.CharField(max_length=64)
    payload = models.JSONField(default=dict)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    correlation_id = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['sequence']
        indexes = [
            models.Index(fields=['resource', 'resource_id']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['actor', 'created_at']),
        ]
        verbose_name = "Audit Ledger Event"
        verbose_name_plural = "Audit Ledger Events"

    def __str__(self):
        return f"Seq #{self.sequence} | {self.action} on {self.resource}:{self.resource_id} by {self.actor}"

    def save(self, *args, **kwargs):
        # Strict immutability protection
        if self.pk and AuditEvent.objects.filter(pk=self.pk).exists():
            raise PermissionError("Audit ledger records are cryptographically immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError("Audit ledger records are cryptographically immutable and cannot be deleted.")
