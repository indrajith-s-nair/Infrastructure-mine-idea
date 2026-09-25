'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ComplaintData, OfficerInboxResponse, api } from '@/lib/api';
import { OfficerMapFeed } from '@/components/OfficerMapFeed';
import { OfficerTicketDetailModal } from '@/components/OfficerTicketDetailModal';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Sun,
  Moon,
  Volume2,
  Image,
  ChevronRight,
  Layers,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  LogOut,
  Lock,
  Compass,
  ExternalLink,
} from 'lucide-react';

export default function OfficerModulePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Officer Data State
  const [inboxData, setInboxData] = useState<OfficerInboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for modal
  const [selectedTicket, setSelectedTicket] = useState<ComplaintData | null>(null);

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

  // Fetch Officer Inbox
  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.officer.getInbox({
        status: statusTab === 'ALL' ? undefined : statusTab,
        search: searchQuery.trim() || undefined,
      });
      setInboxData(data);
    } catch (err: any) {
      console.error('Failed to fetch officer inbox:', err);
      setError(err.message || 'Failed to load officer inbox.');
    } finally {
      setLoading(false);
    }
  }, [statusTab, searchQuery]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push('/login?redirect=/officer');
        return;
      }
      if (user.role === 'CITIZEN' && !user.officer_profile) {
        setError('Access Denied: Citizens cannot access the Frontline Officer Portal.');
        setLoading(false);
        return;
      }
      fetchInbox();
    }
  }, [authLoading, isAuthenticated, user, router, fetchInbox]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // If loading authentication state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Verifying Officer Authorization...
        </p>
      </div>
    );
  }

  // Access Denied Screen for non-officers
  if (!isAuthenticated || (user && user.role === 'CITIZEN' && !user.officer_profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Restricted Government Access</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              This field portal is strictly reserved for authorized Frontline Officers. Citizens are not permitted to view departmental telemetry.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Sign In with Officer Credentials
          </button>
        </div>
      </div>
    );
  }

  const complaintsList = inboxData?.complaints || [];
  const officerProfile = inboxData?.officer || user?.officer_profile;
  const officerDesignation = (officerProfile as any)?.designation || (officerProfile as any)?.officer_designation || 'Frontline Officer';
  const officerLgd = officerProfile?.lgd_jurisdiction_code || 'LGD-JURISDICTION';
  const officerDept = officerProfile?.department_name || 'Government Department';

  const metrics = inboxData?.metrics || {
    total_assigned: complaintsList.length,
    pending: complaintsList.filter((c) => c.status === 'PENDING').length,
    in_progress: complaintsList.filter((c) => c.status === 'IN_PROGRESS').length,
    resolved: complaintsList.filter((c) => c.status === 'RESOLVED').length,
    critical_urgency: complaintsList.filter((c) => (c.ai_severity_score || 0) >= 85).length,
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      
      {/* 1. Mobile-First Officer Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Frontline Officer Portal
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                  Field L1
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                {officerDesignation} • {officerLgd}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={fetchInbox}
              title="Refresh Inbox"
              aria-label="Refresh Feed"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              aria-label="Toggle Dark / Light Mode"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Officer Sign Out */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container (Strictly Mobile-First max-w-4xl) */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6">
        
        {/* 2. Officer Profile & Jurisdiction Badge Card */}
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-black text-base">
                <Building2 className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>{officerDesignation}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active On-Field Duty"></span>
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                  <span className="font-bold text-blue-300">{officerDept}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono font-bold tracking-wider">
                {officerLgd}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Real-Time Metric Pills */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div
            onClick={() => setStatusTab('ALL')}
            className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              statusTab === 'ALL'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Assigned Total</span>
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {metrics.total_assigned}
            </span>
          </div>

          <div
            onClick={() => setStatusTab('PENDING')}
            className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              statusTab === 'PENDING'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">Pending Review</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {metrics.pending}
            </span>
          </div>

          <div
            onClick={() => setStatusTab('IN_PROGRESS')}
            className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              statusTab === 'IN_PROGRESS'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">In Progress</span>
              <Zap className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {metrics.in_progress}
            </span>
          </div>

          <div
            onClick={() => setStatusTab('RESOLVED')}
            className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
              statusTab === 'RESOLVED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {metrics.resolved}
            </span>
          </div>
        </section>

        {/* 4. Authentic Map Integration at Top of Feed */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Jurisdiction Coordinates (Live Pins)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              OpenStreetMap Deep-Linked
            </span>
          </div>

          <OfficerMapFeed
            complaints={complaintsList}
            onSelectComplaint={(c) => setSelectedTicket(c)}
            officerJurisdiction={officerLgd}
          />
        </section>

        {/* 5. Feed Search & Status Tabs Bar */}
        <section className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Tracking Code, description, or street..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
              />
            </div>

            {/* AI Priority Sort Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-bold shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Prioritized by AI Severity</span>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
            {(['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusTab === tab
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All Tickets' : tab === 'REJECTED' ? 'Declined' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>

        {/* 6. Scrollable Card-Based Feed */}
        <section className="space-y-3">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading assigned field grievances...</p>
            </div>
          ) : complaintsList.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No grievances assigned</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active complaints currently routed to {officerDesignation} ({officerDept}).
              </p>
            </div>
          ) : (
            complaintsList.map((ticket) => {
              const score = ticket.ai_severity_score ?? 50;
              const isCritical = score >= 85;
              const isHigh = score >= 65 && score < 85;
              const isMedium = score >= 40 && score < 65;

              return (
                <div
                  key={ticket.tracking_code}
                  onClick={() => setSelectedTicket(ticket)}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer space-y-3.5"
                >
                  {/* Top Bar: Tracking Code + Urgency Severity Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {ticket.tracking_code}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          ticket.status === 'RESOLVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : ticket.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : ticket.status === 'REJECTED'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {ticket.status === 'REJECTED' ? 'DECLINED' : ticket.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* AI Severity Score Badge */}
                    <div className="flex items-center gap-1.5">
                      {isCritical && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                      )}
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                          isCritical
                            ? 'bg-red-600 text-white shadow-xs'
                            : isHigh
                            ? 'bg-orange-500 text-white'
                            : isMedium
                            ? 'bg-yellow-400 text-slate-950 font-bold'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>{score}/100</span>
                        <span className="text-[10px] font-semibold opacity-90 hidden sm:inline">
                          • {ticket.urgency_level || (isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MEDIUM')}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Grievance Description Statement */}
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  {/* Department & Address Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {ticket.department_category || 'General Department'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[220px]">{ticket.address}</span>
                    </div>
                  </div>

                  {/* Card Footer: Media Tags + Tap for Workflow */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      {ticket.voice_note_url && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 text-[10px]">
                          <Volume2 className="w-3 h-3" />
                          <span>Voice Note</span>
                        </span>
                      )}
                      {ticket.media_file_url && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 text-[10px]">
                          <Image className="w-3 h-3" />
                          <span>Photo Attached</span>
                        </span>
                      )}
                      {ticket.latitude && ticket.longitude && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOsmDirections(ticket.latitude!, ticket.longitude!);
                          }}
                          title="Open OpenStreetMap Route from My Location"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 text-[10px] border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Compass className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Route (OSM)</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </button>
                      )}
                      <span className="text-slate-400 text-[10px] hidden sm:inline">
                        {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

      </main>

      {/* 7. Dedicated Ticket Detail & 3-Button Action Workflow Modal */}
      {selectedTicket && (
        <OfficerTicketDetailModal
          complaint={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={() => {
            fetchInbox();
          }}
        />
      )}

    </div>
  );
}
