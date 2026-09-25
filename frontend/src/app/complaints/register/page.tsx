'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { MapPicker } from '@/components/MapPicker';
import { MediaCapture } from '@/components/MediaCapture';
import { SuccessModal } from '@/components/SuccessModal';

export default function RegisterComplaintPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Frontline Officers must NOT register grievances - they resolve them
    if (!authLoading && isAuthenticated && (user?.role === 'OFFICER' || user?.officer_profile)) {
      router.replace('/officer');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Form State
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(28.6139);
  const [longitude, setLongitude] = useState<number | null>(77.2090);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedTrackingCode, setGeneratedTrackingCode] = useState<string | null>(null);

  const handleLocationChange = (loc: { lat: number; lng: number; address: string }) => {
    setLatitude(loc.lat);
    setLongitude(loc.lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim() && !voiceFile) {
      setErrorMessage('Please provide a detailed description of the complaint or record a voice note.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please provide an exact location address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const cleanDesc = description.trim() || (voiceFile ? 'Spoken Audio Grievance attached for jurisdictional review.' : '');
      formData.append('description', cleanDesc);
      formData.append('address', address.trim());

      if (latitude !== null) {
        formData.append('latitude', latitude.toString());
      }
      if (longitude !== null) {
        formData.append('longitude', longitude.toString());
      }

      if (voiceFile) {
        formData.append('voice_note', voiceFile);
      }

      if (mediaFile) {
        formData.append('media_file', mediaFile);
      }

      const res = await api.complaints.create(formData);
      setGeneratedTrackingCode(res.tracking_code);
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setGeneratedTrackingCode(null);
    setDescription('');
    setAddress('');
    setVoiceFile(null);
    setMediaFile(null);
  };

  if (authLoading || (isAuthenticated && (user?.role === 'OFFICER' || user?.officer_profile))) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500">Redirecting to Frontline Officer Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 p-6 sm:p-8 text-white space-y-2 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Official Digital Public Infrastructure Redressal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Register a Citizen Grievance
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Submit details regarding civic, road, electrical, sanitation, or municipal problems. Attach voice notes and drop a GPS pin for faster jurisdictional action.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Detailed Text Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Grievance Description {!voiceFile && <span className="text-red-500">*</span>}
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {description.length} / 2000 chars
              </span>
            </div>
            <textarea
              required={!voiceFile}
              rows={4}
              maxLength={2000}
              placeholder="Describe the issue clearly (e.g. Broken drainage pipe flooding pedestrian path for the last 3 days, hazardous for schoolchildren)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all leading-relaxed"
            />
          </div>

          {/* Section 2: Browser Voice Recording */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <VoiceRecorder 
              onAudioReady={(file) => setVoiceFile(file)} 
              onTranscriptReady={(text) => setDescription((prev) => prev ? prev + ' ' + text : text)}
            />
          </div>

          {/* Section 3: Map & Geolocation */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <MapPicker
              initialLat={latitude}
              initialLng={longitude}
              addressValue={address}
              onAddressChange={(newAddr) => setAddress(newAddr)}
              onLocationChange={handleLocationChange}
            />
          </div>

          {/* Section 4: Media Upload & Camera */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <MediaCapture onMediaSelected={(file) => setMediaFile(file)} />
          </div>

          {/* Submit Button Bar */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              By submitting, you certify that the provided information is true to your knowledge.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Generating Code...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Grievance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal when complaint is registered */}
      {generatedTrackingCode && (
        <SuccessModal
          trackingCode={generatedTrackingCode}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
