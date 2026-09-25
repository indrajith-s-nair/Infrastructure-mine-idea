'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Clock,
  CircleDot,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ArrowRight,
  User as UserIcon,
  Phone,
  Mail,
  Loader2,
  FileQuestion,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  X,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, ComplaintData } from '@/lib/api';

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [myComplaints, setMyComplaints] = useState<ComplaintData[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [quickTrackInput, setQuickTrackInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Reopen Modal States
  const [reopenTarget, setReopenTarget] = useState<ComplaintData | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [reopenSuccess, setReopenSuccess] = useState<string | null>(null);

  const reloadComplaints = () => {
    setLoadingComplaints(true);
    api.complaints.getMyComplaints()
      .then((data) => setMyComplaints(data))
      .catch(() => {})
      .finally(() => setLoadingComplaints(false));
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    // Frontline Officers must never be in the Citizen Dashboard
    if (!authLoading && isAuthenticated && (user?.role === 'OFFICER' || user?.officer_profile)) {
      router.replace('/officer');
      return;
    }

    if (isAuthenticated) {
      reloadComplaints();
    }
  }, [isAuthenticated, authLoading, user, router]);

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenTarget) return;
    if (!reopenReason.trim() || reopenReason.trim().length < 5) {
      setReopenError('Please provide a reason with at least 5 characters.');
      return;
    }

    setReopenSubmitting(true);
    setReopenError(null);

    try {
      const res = await api.complaints.reopen(reopenTarget.tracking_code, {
        reason: reopenReason.trim(),
      });
      setReopenSuccess(res.message || 'Grievance reopened successfully and escalated to Central Desk.');
      // Update local complaints state immediately
      setMyComplaints((prev) =>
        prev.map((c) =>
          c.tracking_code === reopenTarget.tracking_code
            ? { ...c, status: 'PENDING', is_reopened: true, reopen_reason: reopenReason.trim() }
            : c
        )
      );
      setTimeout(() => {
        setReopenTarget(null);
        setReopenReason('');
        setReopenSuccess(null);
        reloadComplaints();
      }, 1200);
    } catch (err: any) {
      setReopenError(err.message || 'Failed to reopen grievance.');
    } finally {
      setReopenSubmitting(false);
    }
  };

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackInput.trim()) {
      router.push(`/complaints/track/${encodeURIComponent(quickTrackInput.trim().toUpperCase())}`);
    }
  };

  const filteredComplaints = myComplaints.filter((c) => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  const pendingCount = myComplaints.filter((c) => c.status === 'PENDING').length;
  const inProgressCount = myComplaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = myComplaints.filter((c) => c.status === 'RESOLVED').length;

  if (authLoading || (isAuthenticated && (user?.role === 'OFFICER' || user?.officer_profile))) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500">Redirecting to Frontline Officer Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Citizen Greeting Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Verified Citizen Account
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome back, {user?.name || 'Citizen'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {user?.phone_number}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/complaints/register"
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>Register a Grievance</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Under Review
            </span>
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            {pendingCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Awaiting municipal verification</p>
        </div>

        <div className="p-6 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              In Progress
            </span>
            <CircleDot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            {inProgressCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Field work & repair dispatched</p>
        </div>

        <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Resolved & Proof Uploaded
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            {resolvedCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Official closure documents ready</p>
        </div>
      </div>

      {/* Track Any Complaint Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
        <form onSubmit={handleQuickTrack} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Track any reference number (e.g. DPIP-2026-YHZ6DB)..."
              value={quickTrackInput}
              onChange={(e) => setQuickTrackInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            disabled={!quickTrackInput.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Track Status</span>
          </button>
        </form>
      </div>

      {/* My Complaints Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              My Registered Grievances
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status overview of issues submitted under your citizen ID.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st === 'ALL' ? 'All Grievances' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loadingComplaints && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading your grievances...</p>
          </div>
        )}

        {!loadingComplaints && filteredComplaints.length === 0 && (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <FileQuestion className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">No Grievances Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You haven&apos;t filed any grievances under this filter yet.
              </p>
            </div>
            <Link
              href="/complaints/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Register New Grievance
            </Link>
          </div>
        )}

        {/* Complaints Cards List */}
        {!loadingComplaints && filteredComplaints.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((item) => {
              const statusColors = {
                PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
                IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
                RESOLVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
                REJECTED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300',
              };

              return (
                <div
                  key={item.tracking_code}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:bg-white dark:hover:bg-slate-900 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-sm bg-blue-100/70 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                        {item.tracking_code}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          statusColors[item.status] || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                      {item.is_reopened && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <RotateCcw className="w-2.5 h-2.5" />
                          REOPENED
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Filed {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.description}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {(item.status === 'RESOLVED' || item.status === 'REJECTED') && (
                      <button
                        type="button"
                        onClick={() => {
                          setReopenTarget(item);
                          setReopenReason('');
                          setReopenError(null);
                          setReopenSuccess(null);
                        }}
                        className="px-3.5 py-2 rounded-lg border border-amber-400/80 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Reopen</span>
                      </button>
                    )}

                    <Link
                      href={`/complaints/track/${encodeURIComponent(item.tracking_code)}`}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                    >
                      <span>Track Progress</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dashboard Reopen Modal */}
      {reopenTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !reopenSubmitting && setReopenTarget(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
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
                    {reopenTarget.tracking_code}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={reopenSubmitting}
                onClick={() => setReopenTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Administrative Escalation Process
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-400">
                Reopening resets this grievance back to <strong className="font-bold">Pending</strong> status and routes it directly to the Central Desk queue for priority re-inspection.
              </p>
            </div>

            {reopenError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium">
                {reopenError}
              </div>
            )}

            {reopenSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{reopenSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Citizen Explanation / Detailed Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Explain why the grievance is being reopened (e.g., Power failed again after 15 minutes, or work remains incomplete)..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Minimum 5 characters</span>
                  <span>{reopenReason.length} characters</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={reopenSubmitting}
                  onClick={() => setReopenTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={reopenSubmitting || reopenReason.trim().length < 5}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {reopenSubmitting ? (
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
}
