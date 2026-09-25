'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  PlusCircle,
  ShieldCheck,
  Building2,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  HardHat,
  Volume2,
  Layers,
  Zap,
} from 'lucide-react';
import { api, StatsData, ComplaintData } from '@/lib/api';
import { TrackingTimeline } from '@/components/TrackingTimeline';
import { ResolutionOutput } from '@/components/ResolutionOutput';
import LoginPage from './login/page';
import OfficerModulePage from './officer/page';

export default function RootHomePage() {
  const { user, isAuthenticated, loading: authLoading, isOfficer } = useAuth();
  const router = useRouter();

  const [trackingInput, setTrackingInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<ComplaintData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [stats, setStats] = useState<StatsData>({
    total_complaints: 0,
    pending_complaints: 0,
    in_progress_complaints: 0,
    resolved_complaints: 0,
    resolution_rate: '0%',
  });

  useEffect(() => {
    // Fetch live platform metrics
    api.complaints.getStats()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const data = await api.complaints.track(trackingInput.trim());
      setSearchResult(data);
    } catch (err: any) {
      setSearchError(err.message || 'No grievance record found with this reference code.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDemoTrack = (code: string) => {
    setTrackingInput(code);
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    api.complaints.track(code)
      .then((data) => setSearchResult(data))
      .catch((err: any) => setSearchError(err.message || 'Error fetching sample code.'))
      .finally(() => setSearchLoading(false));
  };

  // Loading Screen while authenticating
  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Initializing Digital Public Infrastructure Gateway...
        </p>
      </div>
    );
  }

  // 1. If NOT logged in: Show the Login / Authentication page directly and alone
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // 2. If logged in as Frontline Officer: Show the Officer Field Module with their specific jurisdiction data
  if (isOfficer || user.role === 'OFFICER' || user.officer_profile) {
    return <OfficerModulePage />;
  }

  // 3. If logged in as Citizen: Show the Citizen Grievance Portal & Redressal Page
  return (
    <div className="space-y-16 pb-20">
      
      {/* Citizen Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white pt-10 pb-18 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          
          {/* Top Citizen Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Citizen Public Grievance Redressal Portal</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Transparent, Geo-Verified <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                Citizen Grievance Redressal
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Report civic, municipal, road, electrical, or sanitation issues. Attach voice notes and GPS coordinates for direct automated triage to your jurisdictional municipal officer.
            </p>
          </div>

          {/* Citizen Core Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/complaints/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-base font-bold shadow-lg shadow-emerald-900/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>Register a Grievance</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-white text-base font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Layers className="w-5 h-5 text-blue-400" />
              <span>My Registered Complaints</span>
            </Link>
          </div>

          {/* Live Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.total_complaints}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Total Registered</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{stats.pending_complaints}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Under Review</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">{stats.in_progress_complaints}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">In Field Action</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-xs">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{stats.resolved_complaints}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Verified Resolved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Tracking & Verification Section */}
      <section id="track-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Instant Audit & Progress Lookup
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Track Grievance Resolution
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Enter your tracking reference code (e.g. <span className="font-mono text-blue-600">DPIP-2026-X7K9M2</span>) to inspect live field status and photographic proof.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="space-y-4">
            <div className="relative flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  placeholder="Enter Tracking ID (e.g. DPIP-2026-X7K9M2)"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
              </div>

              <button
                type="submit"
                disabled={searchLoading}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {searchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <span>Inspect Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {searchError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{searchError}</span>
              </div>
            )}
          </form>

          {/* Search Result Card & Timeline */}
          {searchResult && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-blue-900 dark:text-blue-300">
                      {searchResult.tracking_code}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        searchResult.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : searchResult.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {searchResult.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{searchResult.address}</p>
                </div>

                <Link
                  href={`/complaints/track/${encodeURIComponent(searchResult.tracking_code)}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>View Full Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Progress Timeline */}
              <TrackingTimeline
                timeline={searchResult.timeline || []}
                status={searchResult.status}
                createdAt={searchResult.created_at}
                resolvedAt={searchResult.resolved_at}
              />

              {/* Resolution Proof & Reopen Action */}
              {(searchResult.status === 'RESOLVED' || (searchResult.is_reopened && (searchResult.resolved_at || searchResult.previous_resolved_at))) && (
                <ResolutionOutput
                  adminNotes={searchResult.admin_notes || searchResult.action_taken_report || null}
                  resolutionProofUrl={searchResult.resolution_proof_url}
                  resolvedAt={searchResult.resolved_at || searchResult.previous_resolved_at}
                  trackingCode={searchResult.tracking_code}
                  isReopened={searchResult.is_reopened}
                  reopenReason={searchResult.reopen_reason}
                  reopenedAt={searchResult.reopened_at}
                  reopenCount={searchResult.reopen_count}
                  onReopen={() => {
                    api.complaints.track(searchResult.tracking_code)
                      .then((data) => setSearchResult(data))
                      .catch(() => {});
                  }}
                />
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
