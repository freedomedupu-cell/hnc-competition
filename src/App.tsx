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

// Direct imports for ALL platform views (zero dynamic import delay, zero chunk failures)
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { StudentDashboardView } from './components/student/StudentDashboardView';

import { AdminManagement } from './components/superadmin/AdminManagement';
import { StudentManagement } from './components/superadmin/StudentManagement';
import { CompetitionManagement } from './components/superadmin/CompetitionManagement';
import { ResultsManagement } from './components/superadmin/ResultsManagement';
import { SettingsView } from './components/superadmin/SettingsView';

import { AdminCompetitionsView } from './components/admin/AdminCompetitionsView';
import { StudentInfoView } from './components/admin/StudentInfoView';
import { AdminResultsView } from './components/admin/AdminResultsView';
import { AdminProfileView } from './components/admin/AdminProfileView';
import { LiveProctorView } from './components/admin/LiveProctorView';
import { SubjectAdminPortal } from './components/admin/SubjectAdminPortal';

import { StudentCompetitionsView } from './components/student/StudentCompetitionsView';
import { StudentResultsView } from './components/student/StudentResultsView';
import { StudentProfileView } from './components/student/StudentProfileView';
import { StudentExamInterface } from './components/student/StudentExamInterface';
import { StudentReferralView } from './components/student/StudentReferralView';
import { StudentAnnouncementsView } from './components/student/StudentAnnouncementsView';
import { GameQuest } from './components/student/GameQuest';
import { StudyGamesHub } from './components/student/StudyGamesHub';
import { StudentFeedbackView } from './components/student/StudentFeedbackView';
import { LeaderboardsHubView } from './components/leaderboard/LeaderboardsHubView';

import { AnnouncementsManagementView } from './components/common/AnnouncementsManagementView';
import { SponsorsAndAdsView } from './components/admin/SponsorsAndAdsView';
import { AdminFeedbackView } from './components/admin/AdminFeedbackView';

// Session Security & Inactivity Timeout Warning
import { SessionTimeoutWarning } from './components/common/SessionTimeoutWarning';

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
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm my-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              பக்கத்தை ஏற்றுவதில் தற்காலிக இடையூறு (Display Notice)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              பக்கத்தை மீண்டும் ஏற்றுவதன் மூலம் தடையின்றி தொடரலாம்.
              <br />
              <span className="text-[11px] text-slate-500">
                (A display issue occurred. Please click below to refresh and continue.)
              </span>
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

  // 1. Unauthenticated State -> Immediately show Auth / Login View without any blocking delay
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

  // 2. Distraction-Free Student Exam Engine (Direct render, zero delay)
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
          case 'Settings':
            return <SettingsView />;
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

      default:
        return <StudentDashboardView onNavigate={setStudentNav} />;
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
            {renderActiveView()}
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
          <MainPortalArea />
        </PortalErrorBoundary>
      </AppProvider>
    </PortalErrorBoundary>
  );
}
