/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AuthView } from './components/auth/AuthView';
import { APP_LOGO } from './assets/logo';

// Direct imports for critical entry views (instant first paint for login and student dashboard)
import { StudentDashboardView } from './components/student/StudentDashboardView';

// SuperAdmin Views
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { AdminManagement } from './components/superadmin/AdminManagement';
import { StudentManagement } from './components/superadmin/StudentManagement';
import { CompetitionManagement } from './components/superadmin/CompetitionManagement';
import { ResultsManagement } from './components/superadmin/ResultsManagement';
import { SettingsView } from './components/superadmin/SettingsView';
import { PlatformMasterControlsView } from './components/superadmin/PlatformMasterControlsView';

// Admin Views
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AdminCompetitionsView } from './components/admin/AdminCompetitionsView';
import { StudentInfoView } from './components/admin/StudentInfoView';
import { AdminResultsView } from './components/admin/AdminResultsView';
import { AdminProfileView } from './components/admin/AdminProfileView';
import { LiveProctorView } from './components/admin/LiveProctorView';
import { SubjectAdminPortal } from './components/admin/SubjectAdminPortal';
import { SponsorsAndAdsView } from './components/admin/SponsorsAndAdsView';
import { AdminFeedbackView } from './components/admin/AdminFeedbackView';

// Student Views
import { StudentCompetitionsView } from './components/student/StudentCompetitionsView';
import { StudentResultsView } from './components/student/StudentResultsView';
import { StudentProfileView } from './components/student/StudentProfileView';
import { StudentExamInterface } from './components/student/StudentExamInterface';
import { StudentReferralView } from './components/student/StudentReferralView';
import { StudentAnnouncementsView } from './components/student/StudentAnnouncementsView';
import { GameQuest } from './components/student/GameQuest';
import { StudyGamesHub } from './components/student/StudyGamesHub';
import { StudentFeedbackView } from './components/student/StudentFeedbackView';
import { StudentTimetableView } from './components/student/StudentTimetableView';

// Leaderboard & Common Views
import { LeaderboardsHubView } from './components/leaderboard/LeaderboardsHubView';
import { AnnouncementsManagementView } from './components/common/AnnouncementsManagementView';
import { NotificationsConfigPanel } from './components/common/NotificationsConfigPanel';

const ViewLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center animate-pulse">
    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
      <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
    <span className="text-xs font-semibold text-slate-500">ஏற்றப்படுகிறது... (Loading view...)</span>
  </div>
);

// Session Security & Inactivity Timeout Warning
import { SessionTimeoutWarning } from './components/common/SessionTimeoutWarning';
import { StudentGlobalToastContainer } from './components/common/StudentGlobalToastContainer';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PortalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PortalErrorBoundary caught an error:', error, errorInfo);
    const msg = error?.message || '';
    const isChunkOrModuleError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Loading chunk') ||
      msg.includes('error loading dynamically imported module');

    if (isChunkOrModuleError && typeof window !== 'undefined') {
      try {
        const retryKey = 'hnc_chunk_reload_attempted';
        if (!sessionStorage.getItem(retryKey)) {
          sessionStorage.setItem(retryKey, '1');
          this.clearCachesAndReload();
        }
      } catch {
        // Ignore sessionStorage errors
      }
    }
  }

  clearCachesAndReload = async () => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const names = await window.caches.keys();
        await Promise.all(names.map((name) => window.caches.delete(name)));
      }
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
      }
    } catch {
      // Ignore cache cleanup failures
    }
    window.location.reload();
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    this.clearCachesAndReload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || '';
      const isNetworkOrModuleError =
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('Loading chunk');

      return (
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm my-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">
              பக்கத்தை ஏற்றுவதில் தற்காலிக இடையூறு (Display Notice)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isNetworkOrModuleError
                ? 'புதிய பதிப்பு அல்லது இணைய இணைப்பு மாற்றத்தால் பழைய கோப்பு ஏற்றப்படவில்லை. பக்கத்தைப் புதுப்பிக்கவும்.'
                : 'பக்கத்தை மீண்டும் ஏற்றுவதன் மூலம் தடையின்றி தொடரலாம்.'}
              <br />
              <span className="text-[11px] text-slate-500">
                {isNetworkOrModuleError
                  ? '(App assets were updated or connection dropped. Click Reload to fetch the latest version.)'
                  : '(A display issue occurred. Please click below to refresh and continue.)'}
              </span>
            </p>
            {errorMessage && (
              <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-rose-700 break-words text-left">
                {errorMessage}
              </div>
            )}
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

/**
 * AuthHydrationGate: Ensures user session state is fully hydrated before attempting to render
 * any protected dashboard route, eliminating race conditions and preventing manual page refreshes.
 */
const AuthHydrationGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentAuthUser, isAuthHydrated, language } = useApp();
  const [hydrationTimeoutExpired, setHydrationTimeoutExpired] = useState(false);

  // 1000ms safety circuit breaker so the page is never stuck in a loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setHydrationTimeoutExpired(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 1. Session is actively hydrating from Firebase / Local Storage
  if (!isAuthHydrated && !currentAuthUser && !hydrationTimeoutExpired) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shadow-lg">
            <span className="text-3xl animate-bounce">🏆</span>
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 border-t-transparent animate-spin" />
        </div>
        <h2 className="text-base font-bold text-slate-100 tracking-tight">HNC Competition Platform</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium animate-pulse">
          {language === 'ta'
            ? 'பயனர் அமர்வை சரிபார்க்கிறது...'
            : language === 'si'
            ? 'පරිශීලක සැසිය පූරණය වෙමින් පවතී...'
            : 'Hydrating user session...'}
        </p>
      </div>
    );
  }

  // 2. Hydration complete: If unauthenticated, render AuthView
  if (!currentAuthUser) {
    return <AuthView />;
  }

  // 3. User session state is fully hydrated -> Render protected dashboard route
  return <>{children}</>;
};

const MainPortalArea: React.FC = () => {
  const {
    currentAuthUser,
    currentAdmin,
    currentPortal,
    superAdminNav,
    setSuperAdminNav,
    adminNav,
    setAdminNav,
    studentNav,
    setStudentNav,
    activeExamComp,
    examSessionStage,
    exitActiveExam,
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

  // Unauthenticated fallback safeguard
  if (!currentAuthUser) {
    return <AuthView />;
  }

  // Strict role enforcement: If authenticated as student, NEVER show admin or super admin.
  // When Super Admin or Admin logs in, ensure their authorized portal is active without requiring refresh.
  const effectivePortal =
    currentAuthUser.role === 'student'
      ? 'student'
      : currentAuthUser.role === 'admin'
      ? currentPortal === 'student' ? 'student' : 'admin'
      : currentPortal === 'student' || currentPortal === 'admin'
      ? currentPortal
      : 'super_admin';

  // 2. Distraction-Free Student Exam Engine (Direct render, zero delay)
  if (effectivePortal === 'student' && activeExamComp && examSessionStage === 'taking') {
    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
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

  // 3. Authenticated State -> Route by enforced role
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
          case 'Notifications':
            return <NotificationsConfigPanel />;
          case 'Settings':
            return <SettingsView />;
          case 'Platform Master Controls':
            return <PlatformMasterControlsView onNavigate={setSuperAdminNav} />;
          default:
            return <SuperAdminDashboard onNavigate={setSuperAdminNav} />;
        }

      case 'admin': {
        const isSubjectAdmin =
          currentAdmin?.adminType === 'subject_admin' || Boolean(currentAdmin?.assignedSubject);

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
          case 'Notifications':
            return <NotificationsConfigPanel />;
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
          case 'AI Study Timetable':
            return <StudentTimetableView onNavigate={setStudentNav} />;
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

      default:
        return <StudentDashboardView onNavigate={setStudentNav} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900 w-full overflow-x-hidden">
      {/* Global Student Instant Toast Notification System */}
      <StudentGlobalToastContainer />

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
            <React.Suspense fallback={<ViewLoadingFallback />}>
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
    <PortalErrorBoundary>
      <AppProvider>
        <PortalErrorBoundary>
          <AuthHydrationGate>
            <MainPortalArea />
          </AuthHydrationGate>
        </PortalErrorBoundary>
      </AppProvider>
    </PortalErrorBoundary>
  );
}
