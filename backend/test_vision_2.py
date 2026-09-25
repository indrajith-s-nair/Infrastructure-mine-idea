import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from google import genai
import mimetypes

api_key = os.environ.get('GEMINI_API_KEY', '').strip()
if api_key:
    client = genai.Client(api_key=api_key)
    
    img_path = '/Users/indrajiths/.gemini/antigravity-ide/brain/d9bc5981-93a6-4ebc-b708-a81305158a19/.user_uploaded/media_1790328040143.png'
    with open(img_path, 'rb') as f:
        img_bytes = f.read()
    
    parts = [
        genai.types.Part.from_bytes(data=img_bytes, mime_type='image/png'),
        "Describe exactly what this screenshot shows regarding severity score. Is there a table with severity risk scores?"
    ]
    
    response = client.models.generate_content(
        model='gemini-3.7-flash',
        contents=parts
    )
    print(response.text)
