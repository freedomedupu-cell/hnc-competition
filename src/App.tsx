/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AuthView } from './components/auth/AuthView';
import { GraduationCap } from 'lucide-react';
import { APP_LOGO } from './assets/logo';

// Super Admin components
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { AdminManagement } from './components/superadmin/AdminManagement';
import { StudentManagement } from './components/superadmin/StudentManagement';
import { CompetitionManagement } from './components/superadmin/CompetitionManagement';
import { ResultsManagement } from './components/superadmin/ResultsManagement';
import { SettingsView } from './components/superadmin/SettingsView';

// Admin components
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AdminCompetitionsView } from './components/admin/AdminCompetitionsView';
import { StudentInfoView } from './components/admin/StudentInfoView';
import { AdminResultsView } from './components/admin/AdminResultsView';
import { AdminProfileView } from './components/admin/AdminProfileView';

// Student components
import { StudentDashboardView } from './components/student/StudentDashboardView';
import { StudentCompetitionsView } from './components/student/StudentCompetitionsView';
import { StudentResultsView } from './components/student/StudentResultsView';
import { StudentProfileView } from './components/student/StudentProfileView';
import { StudentExamInterface } from './components/student/StudentExamInterface';
import { StudentReferralView } from './components/student/StudentReferralView';
import { StudentAnnouncementsView } from './components/student/StudentAnnouncementsView';
import { GameQuest } from './components/student/GameQuest';

// Common Announcements Management (Admin / Super Admin)
import { AnnouncementsManagementView } from './components/common/AnnouncementsManagementView';

// Sponsors & Advertisements Management (Admin / Super Admin)
import { SponsorsAndAdsView } from './components/admin/SponsorsAndAdsView';

// Session Security & Inactivity Timeout Warning
import { SessionTimeoutWarning } from './components/common/SessionTimeoutWarning';

const MainPortalArea: React.FC = () => {
  const {
    currentAuthUser,
    authLoading,
    currentPortal,
    setCurrentPortal,
    superAdminNav,
    setSuperAdminNav,
    adminNav,
    setAdminNav,
    studentNav,
    setStudentNav,
    activeExamComp,
    examSessionStage,
    exitActiveExam,
    language,
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Handle deep-linking URL parameters (?comp=ID) for logged-in students
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !currentAuthUser) return;
      const params = new URLSearchParams(window.location.search);
      const compId = params.get('comp') || sessionStorage.getItem('hnc_target_competition');
      if (compId && currentAuthUser.role === 'student') {
        setStudentNav('Competitions');
      }
    } catch {}
  }, [currentAuthUser?.uid]);

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <img
          src={APP_LOGO}
          alt="HNC Competition"
          className="w-16 h-16 rounded-2xl mb-4 animate-pulse shadow-xl border border-white/20 object-contain bg-white/10 p-1"
          referrerPolicy="no-referrer"
        />
        <p className="text-white text-sm font-semibold tracking-wide">
          HNC Competition • Initializing Secure Session...
        </p>
        <p className="text-slate-400 text-xs mt-1">Connecting to Firebase & Cloud Firestore</p>
      </div>
    );
  }

  // 2. Unauthenticated State -> Show Real Firebase Auth Screen
  if (!currentAuthUser) {
    return <AuthView />;
  }

  // Strict role enforcement: If authenticated as student, NEVER show admin or super admin
  const effectivePortal =
    currentAuthUser.role === 'student'
      ? 'student'
      : currentAuthUser.role === 'admin'
      ? currentPortal === 'student' ? 'student' : 'admin'
      : currentPortal;

  // 3. Phase 4: Distraction-Free Student Exam Engine
  if (effectivePortal === 'student' && activeExamComp && examSessionStage === 'taking') {
    return (
      <StudentExamInterface
        competition={activeExamComp}
        onExit={exitActiveExam}
        onViewResults={() => {
          exitActiveExam();
          setStudentNav('My Results');
        }}
      />
    );
  }

  // 4. Authenticated State -> Route by enforced role
  const renderActiveView = () => {
    switch (effectivePortal) {
      case 'super_admin':
        switch (superAdminNav) {
          case 'Dashboard':
            return <SuperAdminDashboard onNavigate={setSuperAdminNav} />;
          case 'Admin Management':
            return <AdminManagement />;
          case 'Student Management':
            return <StudentManagement />;
          case 'Competition Management':
            return <CompetitionManagement />;
          case 'Results':
            return <ResultsManagement />;
          case 'Announcements':
            return <AnnouncementsManagementView />;
          case 'Sponsors & Ads':
            return <SponsorsAndAdsView />;
          case 'Settings':
            return <SettingsView />;
          default:
            return <SuperAdminDashboard onNavigate={setSuperAdminNav} />;
        }

      case 'admin':
        switch (adminNav) {
          case 'Dashboard':
            return <AdminDashboardView onNavigate={setAdminNav} />;
          case 'Competition Management':
            return <AdminCompetitionsView />;
          case 'Student Information':
            return <StudentInfoView />;
          case 'Results':
            return <AdminResultsView />;
          case 'Announcements':
            return <AnnouncementsManagementView />;
          case 'Sponsors & Ads':
            return <SponsorsAndAdsView />;
          case 'Profile':
            return <AdminProfileView />;
          default:
            return <AdminDashboardView onNavigate={setAdminNav} />;
        }

      case 'student':
        switch (studentNav) {
          case 'Dashboard':
            return <StudentDashboardView onNavigate={setStudentNav} />;
          case 'Competitions':
            return <StudentCompetitionsView />;
          case 'Edu-Arena Quest':
            return <GameQuest />;
          case 'My Results':
            return <StudentResultsView />;
          case 'My Profile':
            return <StudentProfileView />;
          case 'Referral & Points':
            return <StudentReferralView />;
          case 'Announcements':
            return <StudentAnnouncementsView />;
          default:
            return <StudentDashboardView onNavigate={setStudentNav} />;
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900 w-full overflow-x-hidden">
      {/* Automatic Inactivity Session Timeout Warning Modal */}
      <SessionTimeoutWarning />

      <Header onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main id="portal-main-content" className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainPortalArea />
    </AppProvider>
  );
}
