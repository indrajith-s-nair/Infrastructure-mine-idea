'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Hash,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Cpu,
  Lock,
} from 'lucide-react';
import { api, ComplaintAuditTrailResponse, AuditTrailEvent } from '@/lib/api';

interface AuditLedgerViewProps {
  trackingCode: string;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({ trackingCode }) => {
  const [data, setData] = useState<ComplaintAuditTrailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [expandedSeq, setExpandedSeq] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchTrail = () => {
    setLoading(true);
    api.audit
      .getComplaintTrail(trackingCode)
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load audit trail:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (trackingCode) fetchTrail();
  }, [trackingCode]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await api.audit.verifyChain();
      setVerifyMessage(res.message);
      if (data) {
        setData({ ...data, chain_valid: res.valid, latest_chain_hash: res.latest_hash || data.latest_chain_hash });
      }
    } catch (err: any) {
      setVerifyMessage(err.message || 'Audit chain integrity check failed.');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-center justify-center gap-3 text-slate-500 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        <span>Verifying Cryptographic SHA-256 Audit Trail...</span>
      </div>
    );
  }

  const events = data?.trail || [];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cryptographic Audit Trail
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              SHA-256 HASH-CHAINED
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            Tamper-Evident Governance Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every state mutation is cryptographically linked with SHA-256 hashing to guarantee public integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleVerifyChain}
          disabled={verifying}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
          <span>{verifying ? 'Verifying Hashes...' : 'Verify Cryptographic Chain'}</span>
        </button>
      </div>

      {verifyMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{verifyMessage}</span>
        </div>
      )}

      {/* Ledger Chain Items */}
      {events.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400 font-mono">
          No audit ledger entries recorded yet.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {events.map((evt, idx) => {
            const isExpanded = expandedSeq === evt.sequence;
            return (
              <div
                key={evt.sequence}
                className="relative bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all"
              >
                {/* Node indicator */}
                <div className="absolute -left-[27px] sm:-left-[35px] top-4 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs ring-4 ring-white dark:ring-slate-900">
                  {evt.sequence}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {evt.action.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Actor: <span className="font-mono">{evt.actor}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(evt.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Hashes */}
                <div className="pt-2.5 space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-500 truncate">
                      <span className="text-slate-400">Current Hash:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                        {evt.current_hash}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(evt.current_hash)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 shrink-0"
                      title="Copy SHA-256 hash"
                    >
                      {copiedHash === evt.current_hash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 truncate">
                    <span>Prev Block:</span>
                    <span className="truncate">{evt.previous_hash}</span>
                  </div>
                </div>

                {/* Toggle Payload Details */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedSeq(isExpanded ? null : evt.sequence)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>{isExpanded ? 'Hide Payload' : 'Inspect Signed Payload'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <pre className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto border border-slate-800">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
