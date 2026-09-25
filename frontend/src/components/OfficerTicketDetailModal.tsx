'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ComplaintData, api } from '@/lib/api';
import {
  X,
  Play,
  Pause,
  Volume2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw,
  Zap,
  Camera,
  Upload,
  FileText,
  User,
  Phone,
  Clock,
  Building2,
  Loader2,
  AlertCircle,
  Eye,
  Check,
  Compass,
  XCircle,
  Navigation,
  Timer,
  ShieldAlert,
  Languages,
  Sparkles,
} from 'lucide-react';

interface OfficerTicketDetailModalProps {
  complaint: ComplaintData | null;
  onClose: () => void;
  onTicketUpdated: (updatedComplaint?: ComplaintData) => void;
}

export const OfficerTicketDetailModal: React.FC<OfficerTicketDetailModalProps> = ({
  complaint,
  onClose,
  onTicketUpdated,
}) => {
  // Action States
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reassign Modal State
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [reassignReason, setReassignReason] = useState('');

  // Decline Modal State
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Resolve Form State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [actionTakenReport, setActionTakenReport] = useState('');
  const [resolutionProofFile, setResolutionProofFile] = useState<File | null>(null);
  const [resolutionProofPreview, setResolutionProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset audio & forms when complaint changes
  useEffect(() => {
    setIsPlaying(false);
    setAudioProgress(0);
    setActionError(null);
    setActionSuccess(null);
    setShowResolveModal(false);
    setShowReassignDialog(false);
    setShowDeclineDialog(false);
    setResolutionProofFile(null);
    setResolutionProofPreview(null);
    setActionTakenReport('');
    setDeclineReason('');
    setReassignReason('');
  }, [complaint?.tracking_code]);

  if (!complaint) return null;

  const score = complaint.ai_severity_score ?? 50;
  const lat = complaint.latitude;
  const lng = complaint.longitude;

  // OpenStreetMap Route Navigation from Officer's Current Location to Citizen Destination
  const openOsmDirections = (destLat: number, destLng: number) => {
    if (typeof window === 'undefined') return;

    const fallbackUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${destLat}%2C${destLng}#map=15/${destLat}/${destLng}`;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const curLat = position.coords.latitude;
          const curLng = position.coords.longitude;
          const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${curLat}%2C${curLng}%3B${destLat}%2C${destLng}#map=14/${destLat}/${destLng}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        },
        (error) => {
          console.warn('Geolocation access unavailable or denied:', error);
          window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Audio Handlers
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  // 1. Reassign Workflow
  const handleReassign = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await api.officer.reassign(complaint.tracking_code, reassignReason);
      setActionSuccess(res.message);
      setTimeout(() => {
        onTicketUpdated(res.data);
        onClose();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reassign complaint.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Accept Workflow
  const handleAccept = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await api.officer.accept(complaint.tracking_code);
      setActionSuccess('Ticket accepted! Status updated to IN_PROGRESS.');
      setTimeout(() => {
        onTicketUpdated(res.data);
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to accept complaint.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Decline Workflow
  const handleDecline = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await api.officer.decline(complaint.tracking_code, declineReason);
      setActionSuccess('Ticket declined and marked as Rejected.');
      setTimeout(() => {
        onTicketUpdated(res.data);
        setShowDeclineDialog(false);
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to decline complaint.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Resolve Workflow
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResolutionProofFile(file);
      setResolutionProofPreview(URL.createObjectURL(file));
      setActionError(null);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!resolutionProofFile) {
      setActionError('Photographic proof of the fixed issue is strictly mandatory.');
      return;
    }

    if (!actionTakenReport.trim()) {
      setActionError('Please enter a detailed Action Taken Report (ATR).');
      return;
    }

    setIsActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('resolution_proof', resolutionProofFile);
      formData.append('action_taken_report', actionTakenReport.trim());

      const res = await api.officer.resolve(complaint.tracking_code, formData);
      setActionSuccess('Grievance marked RESOLVED with verified proof!');
      setTimeout(() => {
        onTicketUpdated(res.data);
        setShowResolveModal(false);
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || 'Resolution failed. Ensure photographic proof is attached.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-extrabold text-blue-400">
                {complaint.tracking_code}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                  complaint.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : complaint.status === 'IN_PROGRESS'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : complaint.status === 'REJECTED'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {complaint.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Registered on {new Date(complaint.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Status Notifications */}
        {actionError && (
          <div className="m-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="m-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100">
          
          {/* AI Severity & Triage Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-900/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs">AI</span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                  Gemini Dispatch Triage
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Urgency:</span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                    score >= 85
                      ? 'bg-red-600 text-white'
                      : score >= 65
                      ? 'bg-orange-500 text-white'
                      : score >= 40
                      ? 'bg-yellow-500 text-slate-950'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {score}/100 • {complaint.urgency_level || (score >= 85 ? 'CRITICAL' : score >= 65 ? 'HIGH' : 'MEDIUM')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Classified Department</span>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {complaint.department_category || 'Public Works Department (PWD)'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jurisdiction Code</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {complaint.lgd_jurisdiction_code || 'LGD-DEL-042'}
                </span>
              </div>
            </div>

            {complaint.ai_analysis_summary && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                "{complaint.ai_analysis_summary}"
              </p>
            )}

            {/* Statutory SLA & Hierarchical Escalation Telemetry */}
            <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <Timer className={`w-3.5 h-3.5 ${
                  complaint.sla_status === 'BREACHED' ? 'text-red-500' :
                  complaint.sla_status === 'APPROACHING_BREACH' ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <span className={
                  complaint.sla_status === 'BREACHED' ? 'text-red-600 dark:text-red-400 font-extrabold' :
                  complaint.sla_status === 'APPROACHING_BREACH' ? 'text-amber-600 dark:text-amber-400' :
                  'text-emerald-700 dark:text-emerald-300'
                }>
                  Statutory SLA: {complaint.sla_duration_hours || 48}h Target
                  {complaint.sla_deadline && (
                    <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">
                      ({complaint.sla_status === 'BREACHED' ? 'BREACHED' : `${Math.max(0, Math.round(complaint.sla_hours_remaining || 0))}h remaining`})
                    </span>
                  )}
                </span>
              </div>
              {complaint.is_escalated && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px] flex items-center gap-1 animate-pulse border border-red-300 dark:border-red-800">
                  <ShieldAlert className="w-3 h-3 text-red-600" />
                  {complaint.escalation_level === 'LEVEL_3_COMMISSIONER' ? 'Escalated: L3 Commissioner' : 'Escalated: L2 Division Head'}
                </span>
              )}
            </div>
          </div>

          {/* Citizen Description Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Citizen Complaint Statement
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </div>
          </div>

          {/* Citizen Details & Contact */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">{complaint.citizen_name || 'Citizen'}</span>
                <span className="text-slate-500 text-[11px]">Registered Grievance</span>
              </div>
            </div>
            {complaint.citizen_phone && complaint.citizen_phone !== 'Not Available' && (
              <a
                href={`tel:${complaint.citizen_phone}`}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{complaint.citizen_phone}</span>
              </a>
            )}
          </div>

          {/* Audio Voice Note Player (if recorded) */}
          {complaint.voice_note_url && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                Citizen Voice Note Recording
              </h3>
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center gap-3">
                <audio
                  ref={audioRef}
                  src={complaint.voice_note_url}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onLoadedMetadata={handleAudioLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow transition-transform active:scale-95 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>{Math.floor(audioProgress)}s</span>
                    <span>{Math.floor(audioDuration || 0)}s</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Citizen Media Evidence Attachment */}
          {complaint.media_file_url && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Attached Evidence Media
              </h3>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center max-h-72">
                <img
                  src={complaint.media_file_url}
                  alt="Citizen Evidence"
                  className="w-full h-auto max-h-72 object-contain"
                />
              </div>
            </div>
          )}

          {/* Location & OpenStreetMap Navigation Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Incident Location & OpenStreetMap Routing
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                {complaint.address}
              </p>
              {lat && lng && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Citizen Coordinates</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      GPS: {lat.toFixed(6)}, {lng.toFixed(6)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openOsmDirections(lat, lng)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Open in OpenStreetMap (Directions from My Location)</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rejected / Declined Notice if ticket was declined */}
          {complaint.status === 'REJECTED' && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs uppercase tracking-wide">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Ticket Declined by Officer</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {complaint.admin_notes || 'Declined as outside operational purview or unverified on-site.'}
              </p>
            </div>
          )}

          {/* Resolution & ATR if already resolved */}
          {complaint.status === 'RESOLVED' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Field Resolution & ATR</span>
                </div>
                {complaint.vision_verification_status && complaint.vision_verification_status !== 'NOT_INSPECTED' && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    complaint.vision_verification_status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                      : complaint.vision_verification_status === 'FLAGGED'
                      ? 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                  }`}>
                    <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    CV {complaint.vision_verification_status} ({Math.round((complaint.vision_confidence_score || 0.85) * 100)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {complaint.action_taken_report || complaint.admin_notes || 'Issue resolved on site.'}
              </p>
              {complaint.vision_audit_notes && (
                <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs font-mono">
                  <span className="text-[10px] text-purple-300 font-bold uppercase block pb-1">AI Photographic Audit:</span>
                  &ldquo;{complaint.vision_audit_notes}&rdquo;
                </div>
              )}
              {complaint.resolution_proof_url && (
                <div className="rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-800 max-h-60 bg-black">
                  <img
                    src={complaint.resolution_proof_url}
                    alt="Photographic Resolution Proof"
                    className="w-full h-auto max-h-60 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4-ACTION WORKFLOW BAR (Accept, Decline, Reassign, Resolve) */}
        {complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              
              {/* Button 1: Accept */}
              <button
                type="button"
                onClick={handleAccept}
                disabled={isActionLoading || complaint.status === 'IN_PROGRESS'}
                className={`min-h-[46px] py-2 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer disabled:opacity-60 ${
                  complaint.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                {isActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>{complaint.status === 'IN_PROGRESS' ? 'Accepted' : 'Accept'}</span>
              </button>

              {/* Button 2: Decline */}
              <button
                type="button"
                onClick={() => setShowDeclineDialog(true)}
                disabled={isActionLoading}
                className="min-h-[46px] py-2 px-3 rounded-2xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Decline</span>
              </button>

              {/* Button 3: Reassign */}
              <button
                type="button"
                onClick={() => setShowReassignDialog(true)}
                disabled={isActionLoading}
                className="min-h-[46px] py-2 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Reassign</span>
              </button>

              {/* Button 4: Resolve */}
              <button
                type="button"
                onClick={() => setShowResolveModal(true)}
                disabled={isActionLoading}
                className="min-h-[46px] py-2 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </button>
            </div>
          </div>
        )}

        {/* Decline Confirmation Modal */}
        {showDeclineDialog && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Decline Civic Grievance</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Provide a reason for declining ticket <span className="font-mono font-bold text-slate-900 dark:text-white">{complaint.tracking_code}</span> (e.g. duplicate grievance, false evidence, or issue outside municipal jurisdiction).
              </p>
              <textarea
                rows={3}
                placeholder="Reason for declining this complaint..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclineDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isActionLoading}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Decline</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reassign Confirmation Modal */}
        {showReassignDialog && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <RefreshCw className="w-5 h-5" />
                <span>Return Grievance to Central Desk ID</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This will send ticket <span className="font-mono font-bold text-slate-900 dark:text-white">{complaint.tracking_code}</span> back to the <strong className="text-blue-600 dark:text-blue-400">Central Desk Triage</strong> along with your reassignment reason, where operators will review and re-route it to the appropriate officer/department.
              </p>
              <textarea
                rows={3}
                required
                placeholder="State reassignment reason (e.g. Broken water mains fall under Water Works / Jal Board, not Sanitation)..."
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReassignDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReassign}
                  disabled={isActionLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Return to Central Desk</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STRICT RESOLVE MODAL (Mandatory Photo Proof & ATR) */}
        {showResolveModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Submit Official Resolution & Proof</span>
                </div>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleResolveSubmit} className="space-y-4">
                {/* 1. Camera / File Upload for Photographic Proof */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      Photographic Proof of Fixed Issue <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Mandatory</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {resolutionProofPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-950 max-h-52 flex items-center justify-center">
                      <img
                        src={resolutionProofPreview}
                        alt="Resolution Proof"
                        className="w-full h-auto max-h-52 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-bold shadow flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Capture Photo or Upload Proof
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Device Camera / Gallery (PNG, JPG, WebP)
                      </span>
                    </button>
                  )}
                </div>

                {/* 2. Action Taken Report (ATR) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Action Taken Report (ATR) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe specific field action taken (e.g. 200m asphalt stretch patched with cold mix, drainage blockage cleared and flow verified on-site)..."
                    value={actionTakenReport}
                    onChange={(e) => setActionTakenReport(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Submission Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading || !resolutionProofFile || !actionTakenReport.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isActionLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading & Resolving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Submit Final Resolution</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
