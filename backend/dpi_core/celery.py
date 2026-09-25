import os
from celery import Celery

# Set default Django settings module for 'celery'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')

app = Celery('dpi_core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Periodic task beat schedule
app.conf.beat_schedule = {
    'audit-slas-every-5-minutes': {
        'task': 'complaints.tasks.check_statutory_slas',
        'schedule': 300.0,  # Every 5 minutes
    },
}
