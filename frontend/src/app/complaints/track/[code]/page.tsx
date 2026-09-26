'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ArrowLeft,
  MapPin,
  Clock,
  FileText,
  Volume2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Timer,
  Languages,
  ShieldAlert,
  Sparkles,
  Star,
} from 'lucide-react';
import { api, ComplaintData } from '@/lib/api';
import { TrackingTimeline } from '@/components/TrackingTimeline';
import { ResolutionOutput } from '@/components/ResolutionOutput';


export default function TrackComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || '';

  const [complaint, setComplaint] = useState<ComplaintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchComplaintData = () => {
    if (!code) return;
    api.complaints.track(code)
      .then((data) => setComplaint(data))
      .catch((err: any) => setError(err.message || 'Unable to retrieve grievance records.'));
  };

  useEffect(() => {
    if (!code) return;

    setLoading(true);
    setError(null);

    api.complaints.track(code)
      .then((data) => setComplaint(data))
      .catch((err: any) => setError(err.message || 'Unable to retrieve grievance records.'))
      .finally(() => setLoading(false));
  }, [code]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isImageMedia =
    complaint?.media_file_url &&
    /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(complaint.media_file_url);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Home
        </Link>

        {complaint && (
          <button
            type="button"
            onClick={copyCode}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-400 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : code}</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="p-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center space-y-4 shadow-xl">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Querying Digital Public Infrastructure Database...
          </p>
        </div>
      )}

      {error && (
        <div className="p-8 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-center space-y-4 shadow-md">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-red-900 dark:text-red-200">Grievance Not Found</h2>
            <p className="text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">{error}</p>
          </div>
          <div className="pt-2">
            <Link
              href="/#track-section"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs hover:shadow-md transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              Try Another Tracking Code
            </Link>
          </div>
        </div>
      )}

      {complaint && !loading && (
        <div className="space-y-8">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Grievance Telemetry
                  </span>
                  <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900">
                    {complaint.tracking_code}
                  </span>
                  {complaint.is_reopened && (
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 text-amber-600" />
                      REOPENED (Re-Triage Active)
                    </span>
                  )}
                  {complaint.is_escalated && (
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-300 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3 text-red-600" />
                      {complaint.escalation_level === 'LEVEL_3_COMMISSIONER'
                        ? 'ESCALATED: Municipal Commissioner (Level 3)'
                        : 'ESCALATED: Division Head (Level 2)'}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {complaint.description}
                </h1>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0 space-y-1">
                <p>Citizen: {complaint.citizen_name || 'Registered Citizen'}</p>
                <p>
                  Filed: {new Date(complaint.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                {complaint.sla_deadline && (
                  <div className="flex items-center sm:justify-end gap-1.5 pt-0.5">
                    <Timer className={`w-3.5 h-3.5 ${
                      complaint.sla_status === 'BREACHED' ? 'text-red-500' :
                      complaint.sla_status === 'APPROACHING_BREACH' ? 'text-amber-500' : 'text-emerald-500'
                    }`} />
                    <span className={`font-bold ${
                      complaint.sla_status === 'BREACHED' ? 'text-red-600 dark:text-red-400 font-black' :
                      complaint.sla_status === 'APPROACHING_BREACH' ? 'text-amber-600 dark:text-amber-400' :
                      complaint.status === 'RESOLVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {complaint.status === 'RESOLVED' ? (
                        complaint.sla_status === 'RESOLVED_OVERDUE' ? 'Resolved (SLA Overdue)' : 'Resolved within SLA Target'
                      ) : (
                        complaint.sla_status === 'BREACHED'
                          ? `SLA Breached (${complaint.sla_duration_hours}h target)`
                          : `SLA: ${Math.max(0, Math.round(complaint.sla_hours_remaining || 0))}h remaining`
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Address & Geo Coordinates */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-medium">{complaint.address}</span>
              </div>

              {complaint.latitude && complaint.longitude && (
                <div className="flex items-center gap-2 font-mono text-slate-500 dark:text-slate-400">
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                    LAT: {complaint.latitude.toFixed(5)}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                    LNG: {complaint.longitude.toFixed(5)}
                  </span>
                </div>
              )}
            </div>

            {complaint.ai_analysis_summary && (
              <div className="mt-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    AI Triage Analysis
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{complaint.ai_analysis_summary}&rdquo;
                </p>
              </div>
            )}

            {/* Evidence Attachments Bar (Voice Note & Media) */}
            {(complaint.voice_note_url || complaint.media_file_url || complaint.voice_transcript) && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Voice Note Player & AI Multilingual Transcript */}
                {(complaint.voice_note_url || complaint.voice_transcript) && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Citizen Voice Audio Statement</span>
                      </div>
                      {complaint.detected_language && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          <Languages className="w-3 h-3" />
                          {complaint.detected_language}
                        </span>
                      )}
                    </div>
                    {complaint.voice_note_url && (
                      <audio
                        controls
                        src={complaint.voice_note_url}
                        className="w-full h-8"
                      />
                    )}
                    {complaint.voice_transcript && (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <p className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                          Automated Speech-To-Text Transcript
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 italic font-sans">
                          &ldquo;{complaint.voice_transcript}&rdquo;
                        </p>
                        {complaint.voice_translated_english && complaint.detected_language?.toLowerCase() !== 'english' && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                              English Translation:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 text-xs">
                              {complaint.voice_translated_english}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Media File Attachment */}
                {complaint.media_file_url && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {isImageMedia ? (
                        <a href={complaint.media_file_url} target="_blank" rel="noreferrer">
                          <img
                            src={complaint.media_file_url}
                            alt="Attached proof"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                          />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Citizen Photo / Document Evidence
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Uploaded with initial filing
                        </p>
                      </div>
                    </div>

                    <a
                      href={complaint.media_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lifecycle Progress Timeline */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
            <TrackingTimeline
              timeline={complaint.timeline || []}
              status={complaint.status}
              createdAt={complaint.created_at}
              resolvedAt={complaint.resolved_at}
            />
          </div>

          {/* Conditional Resolution Output Section */}
          {(complaint.status === 'RESOLVED' || (complaint.is_reopened && (complaint.resolved_at || complaint.previous_resolved_at))) && (
            <>
              <ResolutionOutput
                adminNotes={complaint.admin_notes || complaint.action_taken_report || null}
                resolutionProofUrl={complaint.resolution_proof_url}
                resolvedAt={complaint.resolved_at || complaint.previous_resolved_at}
                trackingCode={complaint.tracking_code}
                isReopened={complaint.is_reopened}
                reopenReason={complaint.reopen_reason}
                reopenedAt={complaint.reopened_at}
                reopenCount={complaint.reopen_count}
                visionVerificationStatus={complaint.vision_verification_status}
                visionConfidenceScore={complaint.vision_confidence_score}
                visionAuditNotes={complaint.vision_audit_notes}
                onReopen={fetchComplaintData}
              />

              {complaint.status === 'RESOLVED' && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        How Was Your Grievance Redressal Experience?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Rate the officer promptness, repair durability, and site cleanliness in our official Civic Survey.
                    </p>
                  </div>

                  <Link
                    href={`/feedback?tracking_code=${encodeURIComponent(complaint.tracking_code)}`}
                    className="shrink-0 py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-white text-white" />
                    <span>Rate Resolution</span>
                  </Link>
                </div>
              )}
            </>
          )}


          {/* If Rejected and not yet reopened, also allow reopening */}
          {complaint.status === 'REJECTED' && !complaint.is_reopened && (
            <ResolutionOutput
              adminNotes={complaint.admin_notes || 'This grievance was declined by municipal triage. You may reopen it with updated details.'}
              resolutionProofUrl={null}
              resolvedAt={complaint.updated_at}
              trackingCode={complaint.tracking_code}
              isReopened={false}
              visionVerificationStatus={complaint.vision_verification_status}
              visionConfidenceScore={complaint.vision_confidence_score}
              visionAuditNotes={complaint.vision_audit_notes}
              onReopen={fetchComplaintData}
            />
          )}
        </div>
      )}
    </div>
  );
}

