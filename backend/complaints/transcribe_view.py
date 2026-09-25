import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .gemini_service import transcribe_audio_with_gemini

class TranscribeAudioView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response({'error': 'No audio file provided'}, status=400)
            
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
            
        try:
            transcript = transcribe_audio_with_gemini(tmp_path)
            return Response({'transcript': transcript})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
