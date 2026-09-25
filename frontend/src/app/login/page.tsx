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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Header Logo */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/30">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Digital Public Infrastructure Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Official Access Gateway
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure login for Citizens, Central Triage Desk, and Frontline Officers
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
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
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
            Don&apos;t have a citizen account?{' '}
            <Link href="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Sign Up as Citizen
            </Link>
          </p>
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
