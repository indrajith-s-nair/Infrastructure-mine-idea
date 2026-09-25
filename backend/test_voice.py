import os
import django
import logging
logging.basicConfig(level=logging.WARNING)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_core.settings')
django.setup()

from complaints.voice_service import VoicePipelineService
from django.core.files.uploadedfile import SimpleUploadedFile

dummy_audio = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
audio_file = SimpleUploadedFile("test.wav", dummy_audio, content_type="audio/wav")

res = VoicePipelineService.process_voice_audio(audio_file)
print("Transcript:", res.transcript)
