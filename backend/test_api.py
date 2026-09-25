import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from django.test import Client

c = Client()
res = c.post('/api/complaints/', {
    'description': 'A live electric wire fell down on the street and is sparking, this is very dangerous.',
    'address': 'Main street'
})
print("API Response:", res.status_code, res.json())
