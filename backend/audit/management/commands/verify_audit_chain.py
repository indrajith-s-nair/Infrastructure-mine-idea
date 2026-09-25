from django.core.management.base import BaseCommand
from audit.services import AuditService


class Command(BaseCommand):
    help = 'Cryptographically validates the SHA-256 audit ledger hash chain across all records.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--start-sequence',
            type=int,
            default=1,
            help='Sequence number to start verification from (default: 1)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Maximum number of records to verify'
        )

    def handle(self, *args, **options):
        start_seq = options.get('start_sequence', 1)
        limit = options.get('limit')

        self.stdout.write(self.style.NOTICE(f"Initiating SHA-256 cryptographic audit chain verification from seq #{start_seq}..."))
        result = AuditService.verify_audit_chain(start_sequence=start_seq, limit=limit)

        if result['valid']:
            self.stdout.write(self.style.SUCCESS(
                f"SUCCESS: Audit chain is intact and tamper-free! Verified {result['verified_count']} records."
            ))
            if 'latest_hash' in result:
                self.stdout.write(f"Latest Sequence: #{result.get('latest_sequence', 0)}")
                self.stdout.write(f"Latest Block Hash: {result['latest_hash']}")
        else:
            self.stdout.write(self.style.ERROR(
                f"TAMPERING DETECTED at Sequence #{result.get('broken_sequence')}: {result.get('reason')}"
            ))
            exit(1)
