'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Hash,
  Database,
} from 'lucide-react';
import { api, AuditTrailEvent, AuditChainVerifyResponse } from '@/lib/api';

export const SystemAuditLedger: React.FC = () => {
  const [events, setEvents] = useState<AuditTrailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<AuditChainVerifyResponse | null>(null);
  const [expandedSeq, setExpandedSeq] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');

  const fetchEvents = () => {
    setLoading(true);
    api.audit
      .getRecentEvents(100)
      .then((res) => setEvents(res.results || []))
      .catch((err) => console.error('Failed to load system audit ledger:', err))
      .finally(() => setLoading(false));
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.audit.verifyChain();
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyResult({
        valid: false,
        verified_count: 0,
        message: err.message || 'Audit chain verification failed.',
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    handleVerify();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredEvents = actionFilter
    ? events.filter((e) => e.action.toLowerCase().includes(actionFilter.toLowerCase()))
    : events;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                BLOCKCHAIN-GRADE SHA-256 HASH CHAIN
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                GENESIS: 00000000...
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              System Cryptographic Audit Ledger
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Provides absolute tamper-evidence. Every complaint registration, officer dispatch, field action,
              resolution with photographic proof, and citizen reopening is committed sequentially into a cryptographically chained ledger.
            </p>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md transition-all self-start sm:self-auto shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Validating Hashes...' : 'Re-Validate Chain Integrity'}</span>
          </button>
        </div>

        {/* Verification Status Banner */}
        {verifyResult && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              verifyResult.valid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {verifyResult.valid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <p className="font-bold">{verifyResult.message}</p>
                {verifyResult.latest_hash && (
                  <p className="font-mono text-[10px] text-slate-500 truncate max-w-xl">
                    Latest Block Hash: {verifyResult.latest_hash}
                  </p>
                )}
              </div>
            </div>
            <span className="font-mono font-bold text-xs shrink-0">
              Seq #{verifyResult.latest_sequence || events.length}
            </span>
          </div>
        )}

        {/* Quick Filter */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by action (e.g. complaint.created, dispatched, resolved)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 w-full sm:w-80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
          {actionFilter && (
            <button
              onClick={() => setActionFilter('')}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Ledger Block List */}
      {loading ? (
        <div className="p-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Querying Sequential SHA-256 Audit Blocks...
          </p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-xs text-slate-500 font-mono">
          No audit records found matching filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const isExpanded = expandedSeq === evt.sequence;
            return (
              <div
                key={evt.sequence}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-black text-xs flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
                      #{evt.sequence}
                    </span>
                    <div>
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {evt.action}
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Actor: <span className="font-bold text-slate-700 dark:text-slate-300">{evt.actor}</span>
                        {evt.payload?.tracking_code && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                            {evt.payload.tracking_code}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(evt.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                {/* Hashes Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-slate-400 block text-[10px]">CURRENT BLOCK HASH</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                        {evt.current_hash}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(evt.current_hash)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded shrink-0"
                      title="Copy Hash"
                    >
                      {copiedHash === evt.current_hash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-slate-400 block text-[10px]">PREVIOUS BLOCK HASH</span>
                      <span className="text-slate-600 dark:text-slate-400 truncate">
                        {evt.previous_hash}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(evt.previous_hash)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded shrink-0"
                      title="Copy Prev Hash"
                    >
                      {copiedHash === evt.previous_hash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Inspect Details Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => setExpandedSeq(isExpanded ? null : evt.sequence)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>{isExpanded ? 'Collapse Payload' : 'Inspect Signed JSON Payload'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <pre className="mt-2 p-3.5 rounded-xl bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto border border-slate-800">
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
