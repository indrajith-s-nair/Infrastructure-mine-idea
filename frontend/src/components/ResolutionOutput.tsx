'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Download,
  ExternalLink,
  CheckCircle,
  Award,
  RotateCcw,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ResolutionOutputProps {
  adminNotes: string | null;
  resolutionProofUrl: string | null;
  resolvedAt: string | null | undefined;
  trackingCode: string;
  isReopened?: boolean;
  reopenReason?: string | null;
  reopenedAt?: string | null;
  reopenCount?: number;
  visionVerificationStatus?: 'NOT_INSPECTED' | 'VERIFIED' | 'FLAGGED' | 'INCONCLUSIVE';
  visionConfidenceScore?: number;
  visionAuditNotes?: string | null;
  onReopen?: () => void;
}

export const ResolutionOutput: React.FC<ResolutionOutputProps> = ({
  adminNotes,
  resolutionProofUrl,
  resolvedAt,
  trackingCode,
  isReopened = false,
  reopenReason = null,
  reopenedAt = null,
  reopenCount = 0,
  visionVerificationStatus,
  visionConfidenceScore,
  visionAuditNotes,
  onReopen,
}) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formattedDate = resolvedAt
    ? new Date(resolvedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently verified';

  const isImageProof =
    resolutionProofUrl &&
    /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(resolutionProofUrl);

  const quickReasons = [
    'Fault recurred shortly after fix',
    'Civic issue persists without full resolution',
    'Work left incomplete on-site',
    'Photo proof does not match exact spot',
  ];

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMessage('Please provide a reason with at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.complaints.reopen(trackingCode, { reason: reason.trim() });
      setSuccessMessage(res.message || 'Grievance successfully reopened and escalated to Central Desk.');
      setTimeout(() => {
        setIsModalOpen(false);
        setReason('');
        setSuccessMessage(null);
        if (onReopen) {
          onReopen();
        }
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reopen grievance. Please try again or sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 p-6 sm:p-8 space-y-6 shadow-md transition-all">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200 dark:border-emerald-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Official Resolution Output
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              Grievance Successfully Resolved
            </h3>
          </div>
        </div>

        <div className="text-left sm:text-right text-xs font-mono text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Resolution Date</p>
          <p>{formattedDate}</p>
        </div>
      </div>

      {/* Reopened Banner Notice (if complaint was previously or currently reopened) */}
      {isReopened && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Grievance Reopened by Citizen (Reopened x{reopenCount || 1})</span>
          </div>
          {reopenReason && (
            <p className="text-xs text-slate-700 dark:text-slate-300 italic pl-6">
              &ldquo;{reopenReason}&rdquo;
            </p>
          )}
          <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-6">
            This grievance has been reassigned to Central Triage Desk for priority re-inspection and dispatch.
          </p>
        </div>
      )}

      {/* Admin Notes Box */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Jurisdictional Officer Resolution Remarks
        </label>
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
            {adminNotes || 'Grievance has been inspected and rectified by the designated municipal department as per statutory timeline standards.'}
          </p>
        </div>
      </div>

      {/* Attached Resolution Proof Files */}
      {resolutionProofUrl && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Verification Evidence & On-Ground Proof File
          </label>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isImageProof ? (
                <button
                  type="button"
                  onClick={() => setIsImageOpen(true)}
                  className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative group cursor-pointer"
                >
                  <img
                    src={resolutionProofUrl}
                    alt="Resolution proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </button>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <FileCheck className="w-8 h-8" />
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {isImageProof ? 'On-Ground Rectification Photo' : 'Resolution Certificate / Document'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Attached by municipal engineering department
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a
                href={resolutionProofUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Download Proof File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Automated Computer Vision AI Quality & Anti-Fraud Verification Badge */}
      {visionVerificationStatus && visionVerificationStatus !== 'NOT_INSPECTED' && (
        <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-700/80 shadow-md space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                AI Vision Anti-Fraud Verification
              </span>
            </div>
            <div className="flex items-center gap-2">
              {visionVerificationStatus === 'VERIFIED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  VERIFIED GENUINE ({Math.round((visionConfidenceScore || 0.85) * 100)}% Confidence)
                </span>
              )}
              {visionVerificationStatus === 'FLAGGED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  SUSPECTED INCOMPLETE ({Math.round((visionConfidenceScore || 0.3) * 100)}% Confidence)
                </span>
              )}
              {visionVerificationStatus === 'INCONCLUSIVE' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  MANUAL REVIEW REQUIRED
                </span>
              )}
            </div>
          </div>
          {visionAuditNotes && (
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              &ldquo;{visionAuditNotes}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Reopen Action Callout for Citizen */}
      {!isReopened && (
        <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Issue not fixed or recurring in your locality?</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Citizens have the statutory right to reopen this grievance for mandatory administrative re-triage.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border-2 border-amber-500 hover:border-amber-600 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Reopen Grievance</span>
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {isImageOpen && resolutionProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setIsImageOpen(false)}
        >
          <div
            className="max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden bg-slate-900 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={resolutionProofUrl}
              alt="Full Resolution Proof"
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
            />
            <div className="p-3 flex justify-between items-center text-white">
              <span className="text-xs font-mono">Reference: {trackingCode}</span>
              <button
                type="button"
                onClick={() => setIsImageOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isSubmitting && setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Reopen Grievance
                  </h3>
                  <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {trackingCode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Administrative Escalation Process
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-400">
                Reopening resets this grievance back to <strong className="font-bold">Pending</strong> status and routes it directly to the Central Desk queue for priority re-inspection.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Quick Selection
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickReasons.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Citizen Explanation / Detailed Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why the grievance is being reopened (e.g., Power failed again after 15 minutes, or work remains incomplete)..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Minimum 5 characters</span>
                  <span>{reason.length} characters</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || reason.trim().length < 5}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reopening...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Confirm & Reopen Grievance</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
