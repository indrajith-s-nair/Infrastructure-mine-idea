'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ComplaintData, CentralDeskInboxResponse, CentralDeskOfficer, api } from '@/lib/api';
import {
  Building2,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Lock,
  Volume2,
  Play,
  Pause,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  X,
  Inbox,
  UserCheck,
  Phone,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  Layers,
  Timer,
  ShieldAlert,
  Languages,
} from 'lucide-react';
import { GISHotspotMap } from '@/components/GISHotspotMap';
import { SystemAuditLedger } from '@/components/SystemAuditLedger';
import { AuditLedgerView } from '@/components/AuditLedgerView';

export default function CentralDeskPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // State
  const [inboxData, setInboxData] = useState<CentralDeskInboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & View Mode
  const [activeTab, setActiveTab] = useState<'all' | 'new_triage' | 'reassigned' | 'dispatched' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'queue' | 'gis' | 'audit'>('queue');

  // Selected Complaint for Dispatch / Reassign Modal
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Detail View Modal (Read-Only inspection)
  const [detailComplaint, setDetailComplaint] = useState<ComplaintData | null>(null);

  // Audio player state for complaint details
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch Central Desk Inbox
  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.centralDesk.getInbox({
        type: activeTab,
        search: searchQuery.trim() || undefined,
      });
      setInboxData(data);
    } catch (err: any) {
      console.error('Failed to fetch central desk inbox:', err);
      setError(err.message || 'Failed to load Central Desk queue.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push('/login?redirect=/central-desk');
        return;
      }
      if (user.role !== 'CENTRAL_DESK' && user.role !== 'OFFICER' && user.role !== 'ADMIN') {
        setError('Access Denied: Only Central Desk Triage operators and administrators can access this portal.');
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

  const openDispatchModal = (complaint: ComplaintData) => {
    setSelectedComplaint(complaint);
    setDispatchSuccess(null);
    setDispatchError(null);
    setOperatorNotes('');
    setIsPlayingAudio(false);

    // Pre-select current assigned officer or Gemini AI suggested officer
    if (complaint.assigned_officer?.id) {
      setSelectedOfficerId(complaint.assigned_officer.id);
    } else if (complaint.gemini_suggested_officer?.id) {
      setSelectedOfficerId(complaint.gemini_suggested_officer.id);
    } else if (inboxData?.available_officers && inboxData.available_officers.length > 0) {
      setSelectedOfficerId(inboxData.available_officers[0].id);
    } else {
      setSelectedOfficerId(null);
    }
  };

  const closeDispatchModal = () => {
    setSelectedComplaint(null);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleDispatch = async () => {
    if (!selectedComplaint) return;
    if (!selectedOfficerId) {
      setDispatchError('Please select a frontline officer to assign this grievance to.');
      return;
    }

    setDispatchLoading(true);
    setDispatchError(null);
    try {
      const res = await api.centralDesk.dispatch(selectedComplaint.tracking_code, {
        officer_id: selectedOfficerId,
        operator_notes: operatorNotes.trim() || undefined,
      });

      setDispatchSuccess(
        `Ticket ${selectedComplaint.tracking_code} successfully dispatched to ${res.assigned_officer.name} (${res.assigned_officer.role_display || 'Field Officer'})!`
      );
      
      setTimeout(() => {
        closeDispatchModal();
        fetchInbox();
      }, 1200);
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to dispatch grievance.');
    } finally {
      setDispatchLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // If verifying authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Verifying Central Desk Authorization...
        </p>
      </div>
    );
  }

  // Access Denied Screen
  if (!isAuthenticated || (user && user.role !== 'CENTRAL_DESK' && user.role !== 'OFFICER' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Restricted Central Desk Access</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              This Human-in-the-Loop Triage Desk is strictly reserved for authorized Central Desk Operators.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Sign In with Central Desk Credentials
          </button>
        </div>
      </div>
    );
  }

  const counts = inboxData?.counts || {
    total_all: 0,
    total_queue: 0,
    new_triage: 0,
    reassigned: 0,
    dispatched: 0,
    resolved: 0,
    declined: 0,
  };
  const complaints = inboxData?.complaints || [];
  const officers = inboxData?.available_officers || inboxData?.officers || [];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Left: Desk Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white">
                    DPIP Central Triage Desk
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Human-in-the-Loop Oversight
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Real-Time Grievance Oversight, AI Triage Verification & Dynamic Reassignment Desk
                </p>
              </div>
            </div>

            {/* Right: Controls & User Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
              </button>

              <button
                onClick={fetchInbox}
                title="Refresh Grievances"
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              </button>

              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                  {user?.name ? user.name[0] : 'C'}
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-xs">{user?.name || 'Central Desk Operator'}</p>
                  <p className="text-[10px] text-purple-400 font-mono">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/80 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Module Switcher: Triage Queue / GIS Hotspots / Cryptographic Audit */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setViewMode('queue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'queue'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Triage Queue</span>
            </button>

            <button
              onClick={() => setViewMode('gis')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'gis'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>GIS Failure Hotspots & CapEx</span>
            </button>

            <button
              onClick={() => setViewMode('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'audit'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>SHA-256 Audit Ledger</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 pr-3 hidden sm:block">
            {viewMode === 'queue' && 'Central Desk Dispatch & Reassignment Queue'}
            {viewMode === 'gis' && 'Predictive Haversine Spatial Clustering Active'}
            {viewMode === 'audit' && 'Cryptographic SHA-256 Hash Chain Active'}
          </div>
        </div>

        {viewMode === 'gis' && <GISHotspotMap />}
        {viewMode === 'audit' && <SystemAuditLedger />}

        {viewMode === 'queue' && (
          <div className="space-y-6">
            {/* Metrics Grid (5 KPI Tiles) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Total Registered */}
          <div
            onClick={() => setActiveTab('all')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-sm ${
              activeTab === 'all'
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Requests
              </span>
              <Building2 className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {counts.total_all}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">All civic complaints</p>
          </div>

          {/* New AI Triages */}
          <div
            onClick={() => setActiveTab('new_triage')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-sm ${
              activeTab === 'new_triage'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pending Triage
              </span>
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {counts.new_triage}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Awaiting dispatch</p>
          </div>

          {/* Reassigned by Officers */}
          <div
            onClick={() => setActiveTab('reassigned')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-sm ${
              activeTab === 'reassigned'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Returned
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {counts.reassigned}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Returned by officers</p>
          </div>

          {/* Dispatched & In Progress */}
          <div
            onClick={() => setActiveTab('dispatched')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-sm ${
              activeTab === 'dispatched'
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Field Dispatched
              </span>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {counts.dispatched}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">With frontline officers</p>
          </div>

          {/* Resolved */}
          <div
            onClick={() => setActiveTab('resolved')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-sm ${
              activeTab === 'resolved'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Resolved
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {counts.resolved}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Verified with ATR</p>
          </div>

        </div>

        {/* Workflow Info Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-700/30 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Human-in-the-Loop Protocol (Points 3.2 & 6)</p>
              <p className="text-[11px] text-purple-200/80">
                All requests, assigned officers, and live statuses are tracked here. Central Desk reviews new submissions, monitors active field resolutions, and can re-assign or re-route any grievance to any officer at any stage.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Navigation Filter Tabs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap p-1 rounded-xl bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-3 sm:px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Requests ({counts.total_all})
            </button>
            <button
              onClick={() => setActiveTab('new_triage')}
              className={`py-2 px-3 sm:px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'new_triage'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending Triage ({counts.new_triage})
            </button>
            <button
              onClick={() => setActiveTab('reassigned')}
              className={`py-2 px-3 sm:px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reassigned'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Returned ({counts.reassigned})
            </button>
            <button
              onClick={() => setActiveTab('dispatched')}
              className={`py-2 px-3 sm:px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dispatched'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dispatched / Active ({counts.dispatched})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`py-2 px-3 sm:px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'resolved'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Resolved ({counts.resolved})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <input
              type="text"
              placeholder="Search code, citizen, officer, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Complaints Grid */}
        {loading ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Loading Central Desk Overview...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={fetchInbox}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow hover:bg-red-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Requests in Selected View
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {activeTab === 'new_triage'
                ? 'All citizen complaints have been reviewed and dispatched to frontline officers.'
                : activeTab === 'reassigned'
                ? 'No grievances returned by field officers at this time.'
                : 'No complaints matching your current filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map((c) => {
              const score = c.ai_severity_score ?? 50;
              const isReassigned = c.reassigned_to_central_desk;
              const isDispatched = c.central_desk_reviewed && !c.reassigned_to_central_desk;
              const isResolved = c.status === 'RESOLVED';
              const isRejected = c.status === 'REJECTED';

              return (
                <div
                  key={c.tracking_code}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-mono text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                        {c.tracking_code}
                      </span>
                      
                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5">
                        {/* Ticket Status Badge */}
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                            isResolved
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                              : isRejected
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          }`}
                        >
                          {isResolved ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : isRejected ? (
                            <XCircle className="w-3 h-3 text-red-500" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{c.status.replace('_', ' ')}</span>
                        </span>

                        {/* AI Urgency Badge */}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                            score >= 75
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                              : score >= 50
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                              : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {score >= 75 ? <Flame className="w-3 h-3 text-red-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          <span>{score}</span>
                        </span>
                      </div>
                    </div>

                    {/* Statutory SLA and Computer Vision Indicators */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {c.sla_status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          c.sla_status === 'BREACHED'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                            : c.sla_status === 'APPROACHING_BREACH'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          <Timer className="w-3 h-3" />
                          {c.status === 'RESOLVED' ? (
                            c.sla_status === 'RESOLVED_OVERDUE' ? 'Resolved (Overdue)' : 'Resolved (In SLA)'
                          ) : c.sla_status === 'BREACHED' ? 'SLA BREACHED' : `SLA: ${Math.max(0, Math.round(c.sla_hours_remaining || 0))}h`}
                        </span>
                      )}
                      {c.is_escalated && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 animate-pulse">
                          <ShieldAlert className="w-3 h-3" />
                          {c.escalation_level === 'LEVEL_3_COMMISSIONER' ? 'L3 Commissioner' : 'L2 Division'}
                        </span>
                      )}
                      {c.vision_verification_status && c.vision_verification_status !== 'NOT_INSPECTED' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          c.vision_verification_status === 'VERIFIED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : c.vision_verification_status === 'FLAGGED'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          CV {c.vision_verification_status}
                        </span>
                      )}
                      {c.detected_language && c.detected_language.toLowerCase() !== 'en' && c.detected_language.toLowerCase() !== 'english' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                          <Languages className="w-3 h-3" />
                          {c.detected_language}
                        </span>
                      )}
                    </div>

                    {/* Reassigned Alert Notice */}
                    {isReassigned && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{c.is_reopened ? 'Reopened by Citizen for Re-Triage' : 'Returned by Officer for Reassignment'}</span>
                        </div>
                        {(c.reopen_reason || c.reassignment_reason) && (
                          <p className="text-[10px] text-slate-700 dark:text-slate-300 italic">
                            &ldquo;{c.reopen_reason || c.reassignment_reason}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Department & Description */}
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {c.department_category || 'Civic Infrastructure'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {c.description}
                      </h4>
                    </div>

                    {/* Address & Date */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{c.address || 'Location Pin Provided'}</span>
                      <span className="text-slate-400">•</span>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Citizen Info Pill */}
                    <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <span className="font-medium truncate">
                        Citizen: <strong className="text-slate-800 dark:text-slate-200">{c.citizen_name || 'Citizen'}</strong>
                      </span>
                      {c.citizen_phone && (
                        <span className="font-mono text-[10px] text-slate-500">{c.citizen_phone}</span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Officer Status / Gemini Suggestion Box */}
                  <div className="space-y-2">
                    {c.assigned_officer ? (
                      <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            Assigned Frontline Officer:
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 uppercase">
                            Dispatched
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {c.assigned_officer.name}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400">
                          {c.assigned_officer.designation} • {c.assigned_officer.department_name}
                        </p>
                        <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                          {c.assigned_officer.email}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            Gemini Match:
                          </span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            Awaiting Dispatch
                          </span>
                        </div>
                        {c.gemini_suggested_officer ? (
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {c.gemini_suggested_officer.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {c.gemini_suggested_officer.designation} • {c.gemini_suggested_officer.department_name}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No automated recommendation</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => setDetailComplaint(c)}
                      className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="View Full Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => openDispatchModal(c)}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white ${
                        isDispatched
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                      }`}
                    >
                      <span>{isDispatched ? 'Reassign / Change Officer' : 'Dispatch to Officer'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

          </div>
        )}

      </main>

      {/* 3. DISPATCH / REASSIGN MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-purple-400">
                    {selectedComplaint.tracking_code}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">
                    Central Desk Dispatch
                  </span>
                  {selectedComplaint.assigned_officer && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Currently: {selectedComplaint.assigned_officer.designation}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Citizen Grievance Review & Official Frontline Assignment
                </p>
              </div>

              <button
                onClick={closeDispatchModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-900 dark:text-slate-100">
              
              {/* Alert Feedback */}
              {dispatchSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{dispatchSuccess}</span>
                </div>
              )}

              {dispatchError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{dispatchError}</span>
                </div>
              )}

              {/* Citizen Grievance Statement */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Citizen Grievance Statement
                  </label>
                  <span className="text-xs text-slate-400 font-medium">
                    Department: <strong className="text-slate-700 dark:text-slate-200">{selectedComplaint.department_category || 'General Civic'}</strong>
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed text-slate-900 dark:text-white font-medium">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* Citizen Details & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Citizen Details</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedComplaint.citizen_name || 'Registered Citizen'}</p>
                  <p className="text-slate-500">{selectedComplaint.citizen_phone || 'No phone provided'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Location Address</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{selectedComplaint.address || 'Pinned on GPS Map'}</p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Lat: {selectedComplaint.latitude ? selectedComplaint.latitude.toFixed(4) : 'N/A'}, Lng: {selectedComplaint.longitude ? selectedComplaint.longitude.toFixed(4) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Audio Voice Note Player (if voice complaint) */}
              {selectedComplaint.voice_note_url && (
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                    <Volume2 className="w-4 h-4 text-purple-600" />
                    <span>Citizen Audio Recording Available</span>
                  </div>
                  <audio
                    ref={audioRef}
                    src={selectedComplaint.voice_note_url}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingAudio ? 'Pause Voice' : 'Listen Voice Note'}</span>
                  </button>
                </div>
              )}

              {/* Gemini AI Recommendation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Gemini AI Recommended Officer Match:</span>
                </div>
                {selectedComplaint.gemini_suggested_officer ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900">
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {selectedComplaint.gemini_suggested_officer.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedComplaint.gemini_suggested_officer.designation} ({selectedComplaint.gemini_suggested_officer.department_name})
                      </p>
                      <p className="font-mono text-[11px] text-purple-600 dark:text-purple-400">
                        {selectedComplaint.gemini_suggested_officer.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOfficerId(selectedComplaint.gemini_suggested_officer!.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedOfficerId === selectedComplaint.gemini_suggested_officer.id
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200'
                      }`}
                    >
                      {selectedOfficerId === selectedComplaint.gemini_suggested_officer.id ? '✓ Selected' : 'Accept AI Choice'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No automated recommendation</p>
                )}
              </div>

              {/* Officer Selection Roster */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Select Target Frontline Officer (13 Jurisdictional Designations)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Active Workloads Listed</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {officers.map((off: CentralDeskOfficer) => {
                    const isSelected = selectedOfficerId === off.id;
                    const isAiMatch = selectedComplaint.gemini_suggested_officer?.id === off.id;
                    const isCurrentAssigned = selectedComplaint.assigned_officer?.id === off.id;

                    return (
                      <button
                        key={off.id}
                        type="button"
                        onClick={() => setSelectedOfficerId(off.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {off.name}
                            </span>
                            {isAiMatch && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                                AI Choice
                              </span>
                            )}
                            {isCurrentAssigned && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{off.designation || off.role_display}</p>
                          <p className="font-mono text-[10px] text-blue-600 dark:text-blue-400 truncate">{off.email}</p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {off.active_ticket_count ?? off.active_tickets_count ?? 0} Active
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operator Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Central Desk Dispatch Notes & Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priority dispatch for Junior Engineer (JE). Please inspect water line leakage on site today."
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={closeDispatchModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleDispatch}
                disabled={dispatchLoading || !selectedOfficerId}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {dispatchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Grievance...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{selectedComplaint.assigned_officer ? 'Reassign to Officer ID' : 'Dispatch to Officer ID'}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. READ-ONLY COMPREHENSIVE DETAIL MODAL */}
      {detailComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-purple-400">
                    {detailComplaint.tracking_code}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      detailComplaint.status === 'RESOLVED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : detailComplaint.status === 'REJECTED'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    Status: {detailComplaint.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Full Grievance Lifecycle & Dispatch Telemetry</p>
              </div>

              <button
                onClick={() => setDetailComplaint(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-900 dark:text-slate-100">
              
              {/* Grievance Statement */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Citizen Complaint Statement
                </label>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium leading-relaxed">
                  {detailComplaint.description}
                </div>
              </div>

              {/* Citizen & Location Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Citizen Information</p>
                  <p className="font-bold text-slate-900 dark:text-white">{detailComplaint.citizen_name || 'Citizen'}</p>
                  <p className="text-slate-500">{detailComplaint.citizen_phone || 'No phone provided'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Location & Jurisdiction</p>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{detailComplaint.address || 'Address Provided'}</p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    LGD: {detailComplaint.lgd_jurisdiction_code || 'LGD-DEL-042'}
                  </p>
                </div>
              </div>

              {/* Assigned Officer & AI Triage Analysis */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
                <p className="font-bold text-indigo-900 dark:text-indigo-300 uppercase text-[10px]">
                  Assignment & Dispatch Details
                </p>
                {detailComplaint.assigned_officer ? (
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {detailComplaint.assigned_officer.name} ({detailComplaint.assigned_officer.designation})
                    </p>
                    <p className="text-slate-500">{detailComplaint.assigned_officer.department_name}</p>
                    <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      {detailComplaint.assigned_officer.email}
                    </p>
                  </div>
                ) : (
                  <p className="text-amber-600 dark:text-amber-400 font-bold">
                    Awaiting Central Desk Dispatch
                  </p>
                )}

                {detailComplaint.admin_notes && (
                  <div className="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-800 text-slate-700 dark:text-slate-300 text-[11px]">
                    <strong>Notes / ATR History:</strong> {detailComplaint.admin_notes}
                  </div>
                )}
              </div>

              {/* Action Taken Report if Resolved */}
              {detailComplaint.action_taken_report && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300 uppercase text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Action Taken Report (ATR)</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {detailComplaint.action_taken_report}
                  </p>
                  {detailComplaint.resolved_at && (
                    <p className="text-[10px] text-slate-500">
                      Resolved At: {new Date(detailComplaint.resolved_at).toLocaleString()}
                    </p>
                  )}
                  {detailComplaint.resolution_proof_url && (
                    <a
                      href={detailComplaint.resolution_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-[11px] mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Photographic Resolution Proof</span>
                    </a>
                  )}
                </div>
              )}

              {/* Cryptographic SHA-256 Audit Trail */}
              <div className="pt-2">
                <AuditLedgerView trackingCode={detailComplaint.tracking_code} />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setDetailComplaint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const comp = detailComplaint;
                  setDetailComplaint(null);
                  openDispatchModal(comp);
                }}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <span>Reassign / Dispatch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
