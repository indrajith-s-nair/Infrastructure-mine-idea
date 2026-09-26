'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Info,
  KeyRound,
  CheckCircle2,
  X,
  Phone,
  Eye,
  EyeOff,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';

const PREDEFINED_OFFICER_CREDENTIALS = [
  { designation: 'Sanitary Inspector', dept: 'Sanitation & Solid Waste Management', email: 'officer.sanitary@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Ward Officer', dept: 'Town & Country Planning', email: 'officer.ward@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Panchayat Secretary', dept: 'Town & Country Planning', email: 'officer.panchayat@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Village Development Officer (VDO)', dept: 'Public Works Department (PWD)', email: 'officer.vdo@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Assistant Town Planner', dept: 'Town & Country Planning', email: 'officer.townplanner@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Revenue Inspector', dept: 'Revenue & Land Administration', email: 'officer.revinspector@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Village Administrative Officer (VAO)', dept: 'Revenue & Land Administration', email: 'officer.vao@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Patwari', dept: 'Revenue & Land Administration', email: 'officer.patwari@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Assistant Engineer (AE)', dept: 'Public Works Department (PWD)', email: 'officer.ae@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Junior Engineer (JE)', dept: 'Public Works Department (PWD)', email: 'officer.je@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Station House Officer (SHO)', dept: 'Law & Order (Police)', email: 'officer.sho@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Medical Officer In-Charge (MO)', dept: 'Public Health & Medical Services', email: 'officer.health@dpip.gov.in', password: 'Officer@123' },
  { designation: 'Block Education Officer (BEO)', dept: 'School Education Department', email: 'officer.education@dpip.gov.in', password: 'Officer@123' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams?.get('redirect');

  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'CITIZEN' | 'OFFICER' | 'CENTRAL_DESK'>('CITIZEN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDirectory, setShowDirectory] = useState(false);

  // Credential Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState<'RESET_PASSWORD' | 'FIND_USERNAME'>('RESET_PASSWORD');
  const [recoveryStep, setRecoveryStep] = useState<'REQUEST_OTP' | 'CONFIRM_PASSWORD' | 'SUCCESS'>('REQUEST_OTP');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryMaskedEmail, setRecoveryMaskedEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);
  const [recoveredAccounts, setRecoveredAccounts] = useState<Array<{ name: string; masked_email: string; role: string }>>([]);
  const [showPasswordText, setShowPasswordText] = useState(false);

  const handleTabChange = (tab: 'CITIZEN' | 'OFFICER' | 'CENTRAL_DESK') => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === 'CENTRAL_DESK') {
      setEmail('centraldesk@dpip.gov.in');
      setPassword('CentralDesk@123');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const loggedInUser = await login(email.trim(), password);

      // Automatic Role-Based Landing Page Routing:
      if (loggedInUser.role === 'CENTRAL_DESK' || activeTab === 'CENTRAL_DESK') {
        router.push('/central-desk');
      } else if (loggedInUser.role === 'OFFICER' || !!loggedInUser.officer_profile || activeTab === 'OFFICER') {
        router.push('/officer');
      } else if (loggedInUser.role === 'ADMIN') {
        window.location.href = '/admin/';
      } else if (explicitRedirect && !explicitRedirect.startsWith('/officer') && !explicitRedirect.startsWith('/central-desk')) {
        router.push(explicitRedirect);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoveryLoading(true);
    try {
      const res = await api.auth.requestPasswordReset(recoveryIdentifier.trim());
      setRecoveryMaskedEmail(res.masked_email);
      setRecoverySuccessMsg(res.message);
      setRecoveryStep('CONFIRM_PASSWORD');
    } catch (err: any) {
      setRecoveryError(err.message || 'Failed to request OTP. Please verify your details.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('Passwords do not match. Please re-enter.');
      return;
    }
    if (recoveryNewPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters long.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await api.auth.confirmPasswordReset({
        identifier: recoveryIdentifier.trim(),
        otp_code: recoveryOtp.trim(),
        new_password: recoveryNewPassword,
      });
      setRecoverySuccessMsg(res.message);
      setRecoveryStep('SUCCESS');
      if (res.email) {
        setEmail(res.email);
      }
    } catch (err: any) {
      setRecoveryError(err.message || 'Invalid or expired OTP code entered.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleFindUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoveryLoading(true);
    try {
      const res = await api.auth.recoverUsername(recoveryIdentifier.trim());
      setRecoveredAccounts(res.accounts);
      if (res.accounts.length === 0) {
        setRecoveryError('No registered citizen accounts found with this phone number.');
      }
    } catch (err: any) {
      setRecoveryError(err.message || 'Could not find account. Please verify the phone number.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const resetRecoveryModal = () => {
    setShowRecoveryModal(false);
    setRecoveryStep('REQUEST_OTP');
    setRecoveryIdentifier('');
    setRecoveryOtp('');
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryError(null);
    setRecoverySuccessMsg(null);
    setRecoveredAccounts([]);
  };

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full max-w-lg space-y-6 relative">
      {/* Top Controls: Theme Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            DPIP National Redressal Platform
          </span>
        </div>
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle Theme"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline text-[11px]">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Header Logo */}
      <div className="text-center space-y-2 pt-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/20">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Digital Public Infrastructure Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif">
            Official Access Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Secure multi-role authentication for Citizens, Central Triage Desk, and Municipal Officers
          </p>
        </div>
      </div>

      {/* Role Segment Tabs */}
      <div className="grid grid-cols-3 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50 gap-1">
        <button
          type="button"
          onClick={() => handleTabChange('CITIZEN')}
          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'CITIZEN'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Citizen</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('CENTRAL_DESK')}
          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'CENTRAL_DESK'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Central Desk</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('OFFICER')}
          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'OFFICER'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Officer</span>
        </button>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-5">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Authentication Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              {activeTab === 'CENTRAL_DESK'
                ? 'Central Desk Official Email'
                : activeTab === 'OFFICER'
                ? 'Official Frontline Officer Email'
                : 'Citizen Email Address'}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder={
                  activeTab === 'CENTRAL_DESK'
                    ? 'centraldesk@dpip.gov.in'
                    : activeTab === 'OFFICER'
                    ? 'officer.sanitary@dpip.gov.in'
                    : 'citizen@example.gov.in'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              {activeTab === 'CITIZEN' && (
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryIdentifier(email);
                    setShowRecoveryModal(true);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Forgot Password?</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full min-h-[48px] py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
              activeTab === 'CENTRAL_DESK'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with DPIP Core...</span>
              </>
            ) : (
              <>
                <span>
                  {activeTab === 'CENTRAL_DESK'
                    ? 'Sign In to Central Triage Desk'
                    : activeTab === 'OFFICER'
                    ? 'Sign In to Officer Field Portal'
                    : 'Sign In to Citizen Dashboard'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footers according to active tab */}
        {activeTab === 'CITIZEN' ? (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-center text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Don&apos;t have a citizen account?{' '}
              <Link href="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Sign Up as Citizen
              </Link>
            </p>
            <button
              type="button"
              onClick={() => {
                setRecoveryTab('FIND_USERNAME');
                setShowRecoveryModal(true);
              }}
              className="text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Forgot registered email address? <span className="font-semibold underline">Recover credentials via phone</span>
            </button>
          </div>
        ) : activeTab === 'CENTRAL_DESK' ? (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Central Triage Desk (Human-in-the-Loop)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[10px]">
                Pre-configured default credentials for Central Desk Operator:
                <br />
                Email: <span className="font-mono font-bold text-purple-700 dark:text-purple-300">centraldesk@dpip.gov.in</span> | Password: <span className="font-mono font-bold text-purple-700 dark:text-purple-300">CentralDesk@123</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Officer accounts are issued strictly by respective administrative departments.
            </p>

            {/* Collapsible Officer Directory Reference */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5">
              <button
                type="button"
                onClick={() => setShowDirectory(!showDirectory)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Authorized Officer Credentials Directory</span>
                </span>
                {showDirectory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDirectory && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto space-y-1.5 text-[10px] pr-1">
                  <p className="text-[10px] text-slate-400 italic mb-1">
                    Standard Password for all pre-provisioned officers: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">Officer@123</span>
                  </p>
                  {PREDEFINED_OFFICER_CREDENTIALS.map((o) => (
                    <div key={o.email} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{o.designation}</div>
                        <div className="text-slate-500 text-[9px]">{o.dept}</div>
                      </div>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{o.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Citizen Credential & Password Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Close Button */}
            <button
              onClick={resetRecoveryModal}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Citizen Credential Recovery</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reset password or retrieve registered account</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => {
                  setRecoveryTab('RESET_PASSWORD');
                  setRecoveryStep('REQUEST_OTP');
                  setRecoveryError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  recoveryTab === 'RESET_PASSWORD'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryTab('FIND_USERNAME');
                  setRecoveryError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  recoveryTab === 'FIND_USERNAME'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Find Registered Email
              </button>
            </div>

            {/* Error & Success Messages */}
            {recoveryError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccessMsg && recoveryStep !== 'SUCCESS' && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{recoverySuccessMsg}</span>
              </div>
            )}

            {/* TAB 1: RESET PASSWORD */}
            {recoveryTab === 'RESET_PASSWORD' && (
              <>
                {recoveryStep === 'REQUEST_OTP' && (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                        Registered Email or Mobile Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. citizen@example.gov.in or 9876543210"
                          value={recoveryIdentifier}
                          onChange={(e) => setRecoveryIdentifier(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        A 6-digit verification code will be dispatched to your registered email address.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={recoveryLoading || !recoveryIdentifier.trim()}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {recoveryLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Secure OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {recoveryStep === 'CONFIRM_PASSWORD' && (
                  <form onSubmit={handleConfirmReset} className="space-y-4">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
                      OTP sent to: <span className="font-mono font-bold">{recoveryMaskedEmail}</span>
                      <button
                        type="button"
                        onClick={() => setRecoveryStep('REQUEST_OTP')}
                        className="block mt-1 font-bold text-blue-600 hover:underline"
                      >
                        Change Email / Resend Code
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                        Enter 6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={recoveryOtp}
                        onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-xl font-mono tracking-widest py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswordText ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="••••••••••••"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordText(!showPasswordText)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={recoveryConfirmPassword}
                        onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={recoveryLoading || recoveryOtp.length !== 6 || !recoveryNewPassword}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {recoveryLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Set New Password & Confirm</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {recoveryStep === 'SUCCESS' && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Password Reset Successful!</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Your citizen account password has been updated. You can now log in.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetRecoveryModal();
                      }}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                    >
                      Proceed to Sign In
                    </button>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: FIND USERNAME */}
            {recoveryTab === 'FIND_USERNAME' && (
              <form onSubmit={handleFindUsername} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the phone number provided during your citizen registration.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading || !recoveryIdentifier.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {recoveryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching Accounts...</span>
                    </>
                  ) : (
                    <>
                      <span>Find My Account Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {recoveredAccounts.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Matching Account Found:</p>
                    {recoveredAccounts.map((acc, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</div>
                          <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400">{acc.masked_email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryTab('RESET_PASSWORD');
                            setRecoveryIdentifier(acc.masked_email);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Reset Password
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-8 bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-blue-600" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

