'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, Check, Search, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';

interface SuccessModalProps {
  trackingCode: string;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ trackingCode, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try to trigger confetti effect
    import('canvas-confetti')
      .then((confetti) => {
        confetti.default({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      })
      .catch(() => {});
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Official Grievance Registered
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Complaint Submitted Successfully
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Your grievance has been safely transmitted to the municipal dispatch node. Keep your unique reference code to track live progress.
          </p>
        </div>

        {/* Unique Tracking Code Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-slate-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-800/30 border-2 border-blue-200 dark:border-blue-800/80 space-y-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Your Unique Tracking Code
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-blue-700 dark:text-blue-400 select-all">
              {trackingCode}
            </span>
            <button
              type="button"
              onClick={copyToClipboard}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-400 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-all shadow-xs cursor-pointer"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Copied to clipboard!
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href={`/complaints/track/${encodeURIComponent(trackingCode)}`}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Track Real-Time Progress Now
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Citizen Dashboard
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              File Another Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
