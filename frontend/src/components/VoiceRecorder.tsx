'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, RotateCcw, Volume2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface VoiceRecorderProps {
  onAudioReady: (file: File | null) => void;
  onTranscriptReady?: (transcript: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onAudioReady, onTranscriptReady }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError(null);
    setLiveTranscript('');
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      transcriptRef.current = '';
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          
          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            if (finalTranscript) {
              transcriptRef.current += finalTranscript;
            }
            const currentDisplay = (transcriptRef.current + (interimTranscript ? ' ' + interimTranscript : '')).trim();
            setLiveTranscript(currentDisplay);
            
            if (interimTranscript) {
              (recognition as any)._lastInterim = interimTranscript;
            } else {
              (recognition as any)._lastInterim = '';
            }
          };
          recognition.start();
          recognitionRef.current = recognition;
        }
      } catch (e) {
        console.warn('Speech recognition not supported or failed to start', e);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Package as File for multipart/form-data upload
        const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([audioBlob], `voicenote_${Date.now()}.${extension}`, { type: mimeType });
        onAudioReady(file);

        // Capture local transcript as baseline
        let localTranscript = transcriptRef.current;
        if (recognitionRef.current && (recognitionRef.current as any)._lastInterim) {
          localTranscript += ' ' + (recognitionRef.current as any)._lastInterim;
        }
        localTranscript = localTranscript.trim();

        // Perform AI Vernacular Speech-to-Text & Translation via backend
        if (onTranscriptReady) {
          setIsTranscribing(true);
          try {
            const formData = new FormData();
            formData.append('audio', file);
            const res = await api.complaints.transcribe(formData);
            if (res.transcript && res.transcript.trim()) {
              setLiveTranscript(res.transcript.trim());
              onTranscriptReady(res.transcript.trim());
            } else if (localTranscript) {
              setLiveTranscript(localTranscript);
              onTranscriptReady(localTranscript);
            }
          } catch (err) {
            console.warn('Backend audio transcription fallback to client transcript:', err);
            if (localTranscript) {
              setLiveTranscript(localTranscript);
              onTranscriptReady(localTranscript);
            }
          } finally {
            setIsTranscribing(false);
          }
        }

        // Stop all audio tracks to release microphone hardware
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // 200ms slices
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error('Microphone error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone permission was denied. Please allow microphone access in browser settings.');
        } else {
          setError(err.message || 'Failed to start voice recording.');
        }
      } else {
        setError('Failed to access microphone.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setLiveTranscript('');
    onAudioReady(null);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Citizen Voice Note Recording (Optional)
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Describe the issue in your own language (Hindi, Tamil, Kannada, etc.)
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recording Control Card */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
        {!isRecording && !audioUrl && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Record Audio Statement</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Speak in Hindi, Tamil, Telugu, Kannada, or English. Gemini AI automatically transcribes and translates your grievance.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startRecording}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Start Recording
            </button>
          </div>
        )}

        {/* Live Recording State */}
        {isRecording && (
          <div className="space-y-3 py-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center recording-pulse">
                  <Mic className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Recording Live...
                    </p>
                  </div>
                  <p className="font-mono text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatTime(recordingTime)}
                  </p>
                </div>

                {/* Animated waveform bars */}
                <div className="hidden sm:flex items-center gap-1 h-8 px-3">
                  <span className="w-1 bg-red-500 rounded-full animate-audio-bar-1"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-audio-bar-2"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-audio-bar-3"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-audio-bar-4"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-audio-bar-5"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-audio-bar-6"></span>
                </div>
              </div>

              <button
                type="button"
                onClick={stopRecording}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop & Save Voice Note
              </button>
            </div>

            {liveTranscript && (
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5">Live Captions:</span>
                <span className="italic">{liveTranscript}</span>
              </div>
            )}
          </div>
        )}

        {/* Recorded Audio Playback & Re-record State */}
        {audioUrl && !isRecording && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Voice Note Ready
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      {formatTime(recordingTime || 5)}
                    </span>
                    {isTranscribing && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        AI Translating...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click play to listen before submission.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-record
                </button>
                <button
                  type="button"
                  onClick={deleteRecording}
                  className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>

            {/* Hidden native audio element */}
            <audio
              ref={audioElementRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-8 mt-2"
              controls
            />

            {liveTranscript && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold mr-1">Transcribed Grievance:</span>
                  <span>{liveTranscript}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
