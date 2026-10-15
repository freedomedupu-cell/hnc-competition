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

// Primary Landing Dashboard components (Imported directly for instant, fail-proof rendering)
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { StudentDashboardView } from './components/student/StudentDashboardView';

// Resilient Lazy Loader with auto-retry for secondary tabs
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await factory();
      } catch (err: any) {
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
      }
    }
    return factory();
  });
}

// Super Admin auxiliary components (Lazy-loaded with retry)
const AdminManagement = lazyWithRetry(() => import('./components/superadmin/AdminManagement').then(m => ({ default: m.AdminManagement })));
const StudentManagement = lazyWithRetry(() => import('./components/superadmin/StudentManagement').then(m => ({ default: m.StudentManagement })));
const CompetitionManagement = lazyWithRetry(() => import('./components/superadmin/CompetitionManagement').then(m => ({ default: m.CompetitionManagement })));
const ResultsManagement = lazyWithRetry(() => import('./components/superadmin/ResultsManagement').then(m => ({ default: m.ResultsManagement })));
const SettingsView = lazyWithRetry(() => import('./components/superadmin/SettingsView').then(m => ({ default: m.SettingsView })));

// Admin auxiliary components (Lazy-loaded with retry)
const AdminCompetitionsView = lazyWithRetry(() => import('./components/admin/AdminCompetitionsView').then(m => ({ default: m.AdminCompetitionsView })));
const StudentInfoView = lazyWithRetry(() => import('./components/admin/StudentInfoView').then(m => ({ default: m.StudentInfoView })));
const AdminResultsView = lazyWithRetry(() => import('./components/admin/AdminResultsView').then(m => ({ default: m.AdminResultsView })));
const AdminProfileView = lazyWithRetry(() => import('./components/admin/AdminProfileView').then(m => ({ default: m.AdminProfileView })));
const LiveProctorView = lazyWithRetry(() => import('./components/admin/LiveProctorView').then(m => ({ default: m.LiveProctorView })));

// Student auxiliary components (Lazy-loaded with retry)
const StudentCompetitionsView = lazyWithRetry(() => import('./components/student/StudentCompetitionsView').then(m => ({ default: m.StudentCompetitionsView })));
const StudentResultsView = lazyWithRetry(() => import('./components/student/StudentResultsView').then(m => ({ default: m.StudentResultsView })));
const StudentProfileView = lazyWithRetry(() => import('./components/student/StudentProfileView').then(m => ({ default: m.StudentProfileView })));
const StudentExamInterface = lazyWithRetry(() => import('./components/student/StudentExamInterface').then(m => ({ default: m.StudentExamInterface })));
const StudentReferralView = lazyWithRetry(() => import('./components/student/StudentReferralView').then(m => ({ default: m.StudentReferralView })));
const StudentAnnouncementsView = lazyWithRetry(() => import('./components/student/StudentAnnouncementsView').then(m => ({ default: m.StudentAnnouncementsView })));
const GameQuest = lazyWithRetry(() => import('./components/student/GameQuest').then(m => ({ default: m.GameQuest })));
const StudyGamesHub = lazyWithRetry(() => import('./components/student/StudyGamesHub').then(m => ({ default: m.StudyGamesHub })));
const StudentFeedbackView = lazyWithRetry(() => import('./components/student/StudentFeedbackView').then(m => ({ default: m.StudentFeedbackView })));
const LeaderboardsHubView = lazyWithRetry(() => import('./components/leaderboard/LeaderboardsHubView').then(m => ({ default: m.LeaderboardsHubView })));

// Common & Auxiliary Management Views (Lazy-loaded with retry)
const AnnouncementsManagementView = lazyWithRetry(() => import('./components/common/AnnouncementsManagementView').then(m => ({ default: m.AnnouncementsManagementView })));
const SponsorsAndAdsView = lazyWithRetry(() => import('./components/admin/SponsorsAndAdsView').then(m => ({ default: m.SponsorsAndAdsView })));
const AdminFeedbackView = lazyWithRetry(() => import('./components/admin/AdminFeedbackView').then(m => ({ default: m.AdminFeedbackView })));
const SubjectAdminPortal = lazyWithRetry(() => import('./components/admin/SubjectAdminPortal').then(m => ({ default: m.SubjectAdminPortal })));

// Session Security & Inactivity Timeout Warning
import { SessionTimeoutWarning } from './components/common/SessionTimeoutWarning';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PortalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Portal ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm my-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {isChunkError ? 'பக்கம் புதுப்பிக்கப்பட வேண்டும் (Page Update Required)' : 'ஏதேனும் தவறு நேர்ந்துவிட்டது (Something went wrong)'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isChunkError
                ? 'புதிய பதிப்பு தயாராக உள்ளது. பக்கத்தை மீண்டும் ஏற்றுவதன் மூலம் தடையின்றி தொடரலாம்.'
                : 'A temporary display issue occurred while loading this view.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              மீண்டும் முயற்சி செய் (Try Again)
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              பக்கத்தை புதுப்பி (Reload)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
          <PortalErrorBoundary>
            <React.Suspense fallback={<ViewSkeleton />}>
              {renderActiveView()}
            </React.Suspense>
          </PortalErrorBoundary>
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
