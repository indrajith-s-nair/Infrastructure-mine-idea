'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Star,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  UploadCloud,
  FileCheck,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api, CivicFeedbackStatsResponse, CivicFeedbackItem } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const DEPARTMENTS = [
  'Public Works Department (PWD)',
  'Sanitation & Solid Waste Management',
  'Public Health & Medical Services',
  'Electricity & Power Distribution',
  'Town & Country Planning',
  'Drainage & Flood Mitigation',
  'Revenue & Land Administration',
  'General Municipal Services',
];

function StarRatingInput({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  description?: string;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return '';
    }
  };

  const activeVal = hoverValue !== null ? hoverValue : value;

  return (
    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</label>
          {description && <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
          {activeVal} / 5 ({getRatingLabel(activeVal)})
        </span>
      </div>

      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-hidden"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= activeVal
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function CivicFeedbackContent() {
  const searchParams = useSearchParams();
  const trackingCodeParam = searchParams?.get('tracking_code') || '';
  const { user } = useAuth();

  // Form State
  const [trackingCode, setTrackingCode] = useState(trackingCodeParam);
  const [citizenName, setCitizenName] = useState(user?.name || '');
  const [citizenContact, setCitizenContact] = useState(user?.email || user?.phone_number || '');
  const [departmentCategory, setDepartmentCategory] = useState(DEPARTMENTS[0]);
  const [wardOrArea, setWardOrArea] = useState('');
  const [overallRating, setOverallRating] = useState(5);
  const [resolutionSatisfaction, setResolutionSatisfaction] = useState(5);
  const [officerTimeliness, setOfficerTimeliness] = useState(5);
  const [workQuality, setWorkQuality] = useState(5);
  const [cleanlinessScore, setCleanlinessScore] = useState(5);
  const [comments, setComments] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [photoProof, setPhotoProof] = useState<File | null>(null);

  // Status & Telemetry
  const [submitting, setSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<CivicFeedbackItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<CivicFeedbackStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch Public Satisfaction Metrics
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.feedback.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load feedback stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Update name if user loads after mount
  useEffect(() => {
    if (user && !citizenName) {
      setCitizenName(user.name);
      setCitizenContact(user.email || user.phone_number);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      if (trackingCode.trim()) formData.append('tracking_code', trackingCode.trim().toUpperCase());
      formData.append('citizen_name', citizenName.trim() || 'Citizen');
      if (citizenContact.trim()) formData.append('citizen_contact', citizenContact.trim());
      formData.append('department_category', departmentCategory);
      if (wardOrArea.trim()) formData.append('ward_or_area', wardOrArea.trim());
      formData.append('overall_rating', overallRating.toString());
      formData.append('resolution_satisfaction', resolutionSatisfaction.toString());
      formData.append('officer_timeliness', officerTimeliness.toString());
      formData.append('work_quality', workQuality.toString());
      formData.append('cleanliness_score', cleanlinessScore.toString());
      if (comments.trim()) formData.append('comments', comments.trim());
      formData.append('would_recommend', wouldRecommend ? 'true' : 'false');
      if (photoProof) formData.append('photo_proof', photoProof);

      const res = await api.feedback.submit(formData);
      setSubmittedFeedback(res.data);
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>Digital Public Infrastructure Framework • Citizen Feedback</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-serif">
            Civic Survey & Grievance Feedback
          </h1>
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-sans">
            Your evaluation directly scores municipal field officer performance, verifies work quality,
            and guides capital infrastructure upgrades across city corridors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Feedback Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Citizen Survey Form</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rate your recent grievance resolution or general public services
                </p>
              </div>
              <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold">Submission Error</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {submittedFeedback ? (
              <div className="text-center py-10 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Thank You for Your Feedback!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Your response has been cryptographically recorded on the DPIP Citizen Governance Ledger
                    (Receipt #{submittedFeedback.id}).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Citizen:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{submittedFeedback.citizen_name}</span>
                  </div>
                  {submittedFeedback.tracking_code && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tracking Code:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {submittedFeedback.tracking_code}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Overall Rating:</span>
                    <span className="font-bold text-amber-500">{submittedFeedback.overall_rating} / 5 Stars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {submittedFeedback.department_category}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedFeedback(null);
                      setComments('');
                      setPhotoProof(null);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Submit Another Survey
                  </button>
                  <Link
                    href="/dashboard"
                    className="py-2.5 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all text-center"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tracking Code (Optional Link) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Grievance Tracking ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DPIP-2026-RD9013 (Leave blank for general civic feedback)"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    If rating a resolved complaint, entering its tracking code links your review to the assigned officer.
                  </p>
                </div>

                {/* Citizen Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Citizen Name"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Contact Phone / Email
                    </label>
                    <input
                      type="text"
                      placeholder="Phone or Email"
                      value={citizenContact}
                      onChange={(e) => setCitizenContact(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Department & Ward */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Civic Service Category
                    </label>
                    <select
                      value={departmentCategory}
                      onChange={(e) => setDepartmentCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Ward / Locality / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Connaught Place Ward 42"
                      value={wardOrArea}
                      onChange={(e) => setWardOrArea(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Granular Dimension Ratings */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Dimension Satisfaction Ratings
                  </h3>

                  <StarRatingInput
                    label="1. Overall Grievance Redressal Experience"
                    description="How satisfied are you with the overall outcome and resolution transparency?"
                    value={overallRating}
                    onChange={setOverallRating}
                  />

                  <StarRatingInput
                    label="2. Resolution Satisfaction & Work Quality"
                    description="Was the underlying defect permanently and durably repaired?"
                    value={workQuality}
                    onChange={setWorkQuality}
                  />

                  <StarRatingInput
                    label="3. Field Officer Promptness & Timeliness"
                    description="Did the assigned frontline officer respond within statutory SLA targets?"
                    value={officerTimeliness}
                    onChange={setOfficerTimeliness}
                  />

                  <StarRatingInput
                    label="4. Cleanliness & Site Restoration"
                    description="Was debris, excess gravel, or machinery completely cleared from the site?"
                    value={cleanlinessScore}
                    onChange={setCleanlinessScore}
                  />
                </div>

                {/* Net Promoter / Recommendation Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Would you recommend DPIP Resolution Services to neighbors?
                    </label>
                    <p className="text-[11px] text-slate-500">Helps compute municipal citizen trust index</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        wouldRecommend
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWouldRecommend(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !wouldRecommend
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>No</span>
                    </button>
                  </div>
                </div>

                {/* Qualitative Feedback */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Qualitative Feedback & Suggestions
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Share specific details about officer conduct, repair quality, or suggestions for civic infrastructure improvement..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Photo Verification Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Citizen Photo Verification (Optional)
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoProof(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {photoProof ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <FileCheck className="w-4 h-4" />
                        <span>{photoProof.name} ({(photoProof.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Click to upload site photo after repair
                        </p>
                        <p className="text-[10px] text-slate-400">PNG, JPG, WebP up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Survey on Audit Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Civic Survey & Feedback</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Public Satisfaction Metrics & Recent Reviews */}
        <div className="lg:col-span-5 space-y-6">
          {/* Civic Trust KPI Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Public Satisfaction Index</h3>
              </div>
              <button
                type="button"
                onClick={fetchStats}
                disabled={loadingStats}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                title="Refresh Ratings"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingStats ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : stats ? (
              <div className="space-y-5">
                {/* Score Header */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/60">
                  <div className="text-4xl font-black text-blue-700 dark:text-blue-400">
                    {stats.average_overall_rating.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(stats.average_overall_rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                      {stats.total_count} Verified Citizen Ratings
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {stats.recommend_percentage}% Citizen Recommendation Rate
                    </p>
                  </div>
                </div>

                {/* Dimension Breakdown Bars */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Quality of Repair Work</span>
                      <span className="font-bold">{stats.average_work_quality.toFixed(1)} / 5.0</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${(stats.average_work_quality / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Officer SLA Timeliness</span>
                      <span className="font-bold">{stats.average_officer_timeliness.toFixed(1)} / 5.0</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${(stats.average_officer_timeliness / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Site Cleanliness & Restoration</span>
                      <span className="font-bold">{stats.average_cleanliness_score.toFixed(1)} / 5.0</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${(stats.average_cleanliness_score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Recent Reviews Carousel / List */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Recent Citizen Reviews</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400">Live Feed</span>
            </div>

            {stats?.feedbacks && stats.feedbacks.length > 0 ? (
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {stats.feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 dark:text-white">{fb.citizen_name}</div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= fb.overall_rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                        {fb.department_category.split('&')[0]}
                      </span>
                      {fb.ward_or_area && <span>• {fb.ward_or_area}</span>}
                    </div>

                    {fb.comments && (
                      <p className="text-slate-700 dark:text-slate-300 italic text-[11px] leading-relaxed">
                        &quot;{fb.comments}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No reviews submitted yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CivicFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CivicFeedbackContent />
    </Suspense>
  );
}
