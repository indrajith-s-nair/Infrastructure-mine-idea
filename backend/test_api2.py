import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()
from django.test import Client
import json

c = Client()
res = c.post('/api/complaints/', {
    'description': 'A live electric wire fell down on the street and is sparking, this is very dangerous.',
    'address': 'Main street'
})
print(json.dumps(res.json(), indent=2))
