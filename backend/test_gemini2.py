import os
from google import genai
from google.genai import types

api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

try:
    response = client.chats.create(model='gemini-3.8-flash').send_message(
        "Return {\"hello\": \"world\"} as JSON",
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1)
    )
    print("SUCCESS", repr(response.text))
except Exception as e:
    print("ERROR", repr(e))
