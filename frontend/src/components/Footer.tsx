'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, PhoneCall, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { isAuthenticated, isCitizen } = useAuth();
  const pathname = usePathname();

  // Hide footer on login, register, officer portal, or when not authenticated
  if (!isAuthenticated || !isCitizen || pathname === '/login' || pathname === '/register' || pathname?.startsWith('/officer')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors duration-200">
      {/* Gov Trust Highlights */}
      <div className="border-b border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Government Verified
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official DPIP Redressal Framework</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Unique Tracking ID
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">End-to-End Real-Time Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                National Helpline
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Toll-Free 1800-11-2026 (24x7)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Transparent Resolution
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">On-ground Proofs & ATR Verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                Digital Public Infrastructure Platform
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
              A citizen-centric governance initiative designed for transparent, timely, and geo-verified public grievance redressal across municipal and administrative jurisdictions.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Complies with Digital Personal Data Protection (DPDP) Act & Open Government Data Standards.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Citizen Services
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/complaints/register" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Register Grievance
                </Link>
              </li>
              <li>
                <Link href="/#track-section" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Track Grievance Status
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  My Registered Complaints
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Governance & Policies
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="hover:underline cursor-pointer">Citizen Charter of Rights</span>
              </li>
              <li>
                <span className="hover:underline cursor-pointer">Privacy & Data Governance</span>
              </li>
              <li>
                <span className="hover:underline cursor-pointer">Terms of Grievance Redressal</span>
              </li>
              <li>
                <span className="hover:underline cursor-pointer">Web Accessibility Compliance</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} National Digital Public Infrastructure Platform. All Rights Reserved.</p>
          <p className="font-mono text-[11px]">DPIP-CITIZEN-NODE-V1 • SECURE CITIZEN PORTAL</p>
        </div>
      </div>
    </footer>
  );
};
