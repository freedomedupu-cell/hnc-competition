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

// Super Admin components (Lazy-loaded for instant startup)
const SuperAdminDashboard = React.lazy(() => import('./components/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const AdminManagement = React.lazy(() => import('./components/superadmin/AdminManagement').then(m => ({ default: m.AdminManagement })));
const StudentManagement = React.lazy(() => import('./components/superadmin/StudentManagement').then(m => ({ default: m.StudentManagement })));
const CompetitionManagement = React.lazy(() => import('./components/superadmin/CompetitionManagement').then(m => ({ default: m.CompetitionManagement })));
const ResultsManagement = React.lazy(() => import('./components/superadmin/ResultsManagement').then(m => ({ default: m.ResultsManagement })));
const SettingsView = React.lazy(() => import('./components/superadmin/SettingsView').then(m => ({ default: m.SettingsView })));

// Admin components (Lazy-loaded)
const AdminDashboardView = React.lazy(() => import('./components/admin/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));
const AdminCompetitionsView = React.lazy(() => import('./components/admin/AdminCompetitionsView').then(m => ({ default: m.AdminCompetitionsView })));
const StudentInfoView = React.lazy(() => import('./components/admin/StudentInfoView').then(m => ({ default: m.StudentInfoView })));
const AdminResultsView = React.lazy(() => import('./components/admin/AdminResultsView').then(m => ({ default: m.AdminResultsView })));
const AdminProfileView = React.lazy(() => import('./components/admin/AdminProfileView').then(m => ({ default: m.AdminProfileView })));
const LiveProctorView = React.lazy(() => import('./components/admin/LiveProctorView').then(m => ({ default: m.LiveProctorView })));

// Student components (Lazy-loaded)
const StudentDashboardView = React.lazy(() => import('./components/student/StudentDashboardView').then(m => ({ default: m.StudentDashboardView })));
const StudentCompetitionsView = React.lazy(() => import('./components/student/StudentCompetitionsView').then(m => ({ default: m.StudentCompetitionsView })));
const StudentResultsView = React.lazy(() => import('./components/student/StudentResultsView').then(m => ({ default: m.StudentResultsView })));
const StudentProfileView = React.lazy(() => import('./components/student/StudentProfileView').then(m => ({ default: m.StudentProfileView })));
const StudentExamInterface = React.lazy(() => import('./components/student/StudentExamInterface').then(m => ({ default: m.StudentExamInterface })));
const StudentReferralView = React.lazy(() => import('./components/student/StudentReferralView').then(m => ({ default: m.StudentReferralView })));
const StudentAnnouncementsView = React.lazy(() => import('./components/student/StudentAnnouncementsView').then(m => ({ default: m.StudentAnnouncementsView })));
const GameQuest = React.lazy(() => import('./components/student/GameQuest').then(m => ({ default: m.GameQuest })));
const StudyGamesHub = React.lazy(() => import('./components/student/StudyGamesHub').then(m => ({ default: m.StudyGamesHub })));
const StudentFeedbackView = React.lazy(() => import('./components/student/StudentFeedbackView').then(m => ({ default: m.StudentFeedbackView })));
const LeaderboardsHubView = React.lazy(() => import('./components/leaderboard/LeaderboardsHubView').then(m => ({ default: m.LeaderboardsHubView })));

// Common & Auxiliary Management Views (Lazy-loaded)
const AnnouncementsManagementView = React.lazy(() => import('./components/common/AnnouncementsManagementView').then(m => ({ default: m.AnnouncementsManagementView })));
const SponsorsAndAdsView = React.lazy(() => import('./components/admin/SponsorsAndAdsView').then(m => ({ default: m.SponsorsAndAdsView })));
const AdminFeedbackView = React.lazy(() => import('./components/admin/AdminFeedbackView').then(m => ({ default: m.AdminFeedbackView })));
const SubjectAdminPortal = React.lazy(() => import('./components/admin/SubjectAdminPortal').then(m => ({ default: m.SubjectAdminPortal })));

// Session Security & Inactivity Timeout Warning
import { SessionTimeoutWarning } from './components/common/SessionTimeoutWarning';

const ViewSkeleton: React.FC = () => (
  <div className="w-full min-h-[380px] flex flex-col items-center justify-center p-8 space-y-3 animate-in fade-in duration-150">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-500">Loading view...</span>
  </div>
);

const MainPortalArea: React.FC = () => {
  const {
    currentAuthUser,
    currentAdmin,
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

  // 1. Loading State (Only shown for fresh visits, with instant skip action)
  if (authLoading && !currentAuthUser) {
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
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('hnc_force_ready'));
            }
          }}
          className="mt-4 px-3 py-1.5 text-xs text-blue-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
        >
          {language === 'ta' ? 'உடனடியாக திறக்கவும் (Skip Wait)' : 'Open Directly'}
        </button>
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
      <React.Suspense fallback={<ViewSkeleton />}>
        <StudentExamInterface
          competition={activeExamComp}
          onExit={exitActiveExam}
          onViewResults={() => {
            exitActiveExam();
            setStudentNav('My Results');
          }}
        />
      </React.Suspense>
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
          case 'Live Proctoring':
            return <LiveProctorView />;
          case 'Feedback':
            return <AdminFeedbackView />;
          case 'Leaderboards':
            return <LeaderboardsHubView />;
          case 'Settings':
            return <SettingsView />;
          default:
            return <SuperAdminDashboard onNavigate={setSuperAdminNav} />;
        }

      case 'admin': {
        const isSubjectAdmin =
          currentAdmin.adminType === 'subject_admin' || Boolean(currentAdmin.assignedSubject);

        if (isSubjectAdmin) {
          const activeType: 'Quiz' | 'Exam' | 'Competition' =
            adminNav === 'Exam' ? 'Exam' : adminNav === 'Competition' ? 'Competition' : 'Quiz';
          return (
            <SubjectAdminPortal
              initialType={activeType}
              onTabChange={(tab) => setAdminNav(tab)}
            />
          );
        }

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
          case 'Live Proctoring':
            return <LiveProctorView />;
          case 'Feedback':
            return <AdminFeedbackView />;
          case 'Leaderboards':
            return <LeaderboardsHubView />;
          case 'Profile':
            return <AdminProfileView />;
          default:
            return <AdminDashboardView onNavigate={setAdminNav} />;
        }
      }

      case 'student':
        switch (studentNav) {
          case 'Dashboard':
            return <StudentDashboardView onNavigate={setStudentNav} />;
          case 'Competitions':
            return <StudentCompetitionsView />;
          case 'Edu-Arena Quest':
            return <GameQuest />;
          case 'Study Games Hub':
            return <StudyGamesHub onNavigate={setStudentNav} />;
          case 'Leaderboards':
            return <LeaderboardsHubView />;
          case 'My Results':
            return <StudentResultsView />;
          case 'My Profile':
            return <StudentProfileView />;
          case 'Referral & Points':
            return <StudentReferralView />;
          case 'Announcements':
            return <StudentAnnouncementsView />;
          case 'Feedback':
            return <StudentFeedbackView />;
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
          <React.Suspense fallback={<ViewSkeleton />}>
            {renderActiveView()}
          </React.Suspense>
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
