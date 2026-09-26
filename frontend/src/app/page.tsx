'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import LoginPage from './login/page';
import OfficerModulePage from './officer/page';
import CentralDeskPage from './central-desk/page';
import DashboardPage from './dashboard/page';

export default function RootHomePage() {
  const { user, isAuthenticated, loading: authLoading, isOfficer, isCentralDesk } = useAuth();

  // 1. Loading Screen while authenticating
  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
          Initializing Digital Public Infrastructure Gateway...
        </p>
      </div>
    );
  }

  // 2. If NOT logged in: Show the Official Access Gateway (Login / Sign Up / Credential Recovery)
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // 3. If logged in as Central Desk: Shift interface directly to Central Triage Desk
  if (isCentralDesk || user.role === 'CENTRAL_DESK') {
    return <CentralDeskPage />;
  }

  // 4. If logged in as Frontline Officer: Shift interface directly to Officer Field Portal
  if (isOfficer || user.role === 'OFFICER' || user.officer_profile) {
    return <OfficerModulePage />;
  }

  // 5. If logged in as Citizen: Shift interface directly to Citizen Dashboard
  return <DashboardPage />;
}


