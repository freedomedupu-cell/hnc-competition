import React from 'react';
import { useApp } from '../../context/AppContext';
import { APP_LOGO } from '../../assets/logo';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Trophy,
  FileCheck,
  Settings,
  UserCheck,
  User,
  Medal,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  X,
  Home,
  BarChart2,
  Gift,
  Megaphone,
  Bell,
  Video,
  Activity,
  MessageCircle,
  Phone,
  Mail,
  Share2,
  ExternalLink,
  Gamepad2,
} from 'lucide-react';
import { SuperAdminNav, AdminNav, StudentNav } from '../../context/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    currentPortal,
    superAdminNav,
    setSuperAdminNav,
    adminNav,
    setAdminNav,
    studentNav,
    setStudentNav,
    currentStudent,
    currentAuthUser,
    admins,
    students,
    competitions,
    results,
    announcements,
    advertisements,
    liveProctorSessions,
    auditLogs,
    t,
    language,
  } = useApp();

  // Strict role enforcement: If user is a student, portal MUST be student
  const effectivePortal =
    currentAuthUser?.role === 'student'
      ? 'student'
      : currentAuthUser?.role === 'admin'
      ? currentPortal === 'student' ? 'student' : 'admin'
      : currentPortal;

  const isStudent = effectivePortal === 'student';
  const activeProctorCount = liveProctorSessions.filter((s) => s.status === 'active').length;

  // Navigation configurations matching strict requirements
  const superAdminNavItems: {
    id: SuperAdminNav;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
  }[] = [
    {
      id: 'Dashboard',
      label: t('navDashboard'),
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'Admin Management',
      label: t('navAdminManagement'),
      icon: <UserCheck className="w-4 h-4" />,
      badge: admins.length,
    },
    {
      id: 'Student Management',
      label: t('navStudentManagement'),
      icon: <GraduationCap className="w-4 h-4" />,
      badge: students.length,
    },
    {
      id: 'Competition Management',
      label: t('navCompetitionManagement'),
      icon: <Trophy className="w-4 h-4" />,
      badge: competitions.length,
    },
    {
      id: 'Results',
      label: t('navResults'),
      icon: <FileCheck className="w-4 h-4" />,
      badge: results.length,
    },
    {
      id: 'Announcements',
      label:
        language === 'ta'
          ? 'அறிவிப்புகள்'
          : language === 'si'
          ? 'නිවේදන'
          : 'Announcements',
      icon: <Megaphone className="w-4 h-4" />,
      badge: announcements.length,
    },
    {
      id: 'Sponsors & Ads',
      label:
        language === 'ta'
          ? 'விளம்பர பலகை மேலாண்மை'
          : language === 'si'
          ? 'වෙළඳ දැන්වීම් පුවරුව'
          : 'Sponsors & Ads',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      badge: advertisements.length || undefined,
    },
    {
      id: 'Settings',
      label: t('navSettings'),
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const adminNavItems: {
    id: AdminNav;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
  }[] = [
    {
      id: 'Dashboard',
      label: t('navDashboard'),
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'Competition Management',
      label: t('navCompetitionManagement'),
      icon: <Trophy className="w-4 h-4" />,
      badge: competitions.filter(c => c.status === 'ongoing' || c.status === 'upcoming').length,
    },
    {
      id: 'Student Information',
      label: t('navStudentInformation'),
      icon: <Users className="w-4 h-4" />,
      badge: students.length,
    },
    {
      id: 'Results',
      label: t('navResultsScoring'),
      icon: <FileCheck className="w-4 h-4" />,
      badge: results.filter(r => r.publishStatus === 'under_review').length || undefined,
    },
    {
      id: 'Announcements',
      label:
        language === 'ta'
          ? 'அறிவிப்புகள்'
          : language === 'si'
          ? 'නිවේදන'
          : 'Announcements',
      icon: <Megaphone className="w-4 h-4" />,
      badge: announcements.length,
    },
    {
      id: 'Sponsors & Ads',
      label:
        language === 'ta'
          ? 'விளம்பர பலகை மேலாண்மை'
          : language === 'si'
          ? 'වෙළඳ දැන්වීම් පුවරුව'
          : 'Sponsors & Ads',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      badge: advertisements.length || undefined,
    },
    {
      id: 'Profile',
      label: t('navProfile'),
      icon: <User className="w-4 h-4" />,
    },
  ];

  const studentNavItems: {
    id: StudentNav;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
  }[] = [
    {
      id: 'Dashboard',
      label: t('navDashboard'),
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'Competitions',
      label: t('navCompetitions'),
      icon: <Trophy className="w-5 h-5" />,
      badge: competitions.filter((c) => {
        if (!c) return false;
        const s = (c.status || '').toLowerCase().trim();
        return !s.includes('draft') && !s.includes('closed') && !s.includes('inactive');
      }).length,
    },
    {
      id: 'Edu-Arena Quest',
      label:
        language === 'ta'
          ? '🎯 தீவுப் பயணம் (Quest)'
          : language === 'si'
          ? '🎯 දුපත් චාරිකාව (Quest)'
          : '🎯 Island Quest (Arena)',
      icon: <Gamepad2 className="w-5 h-5 text-emerald-500" />,
      badge: '⚡ New',
    },
    {
      id: 'My Results',
      label: t('navMyResults'),
      icon: <BarChart2 className="w-5 h-5" />,
      badge: results.filter(
        (r) =>
          (r.studentId === (currentAuthUser?.uid || currentStudent.id) ||
            r.studentId === currentStudent.id ||
            r.studentName === (currentAuthUser?.fullName || currentStudent.name)) &&
          r.publishStatus === 'published'
      ).length || undefined,
    },
    {
      id: 'Referral & Points',
      label:
        language === 'ta'
          ? 'பகிர்வு & புள்ளிகள்'
          : language === 'si'
          ? 'බෙදාගෙන ලකුණු'
          : 'Share & Earn Points',
      icon: <Gift className="w-5 h-5 text-amber-500" />,
      badge: '🎁 Points',
    },
    {
      id: 'Announcements',
      label:
        language === 'ta'
          ? 'அறிவிப்புகள்'
          : language === 'si'
          ? 'නිවේදන'
          : 'Announcements',
      icon: <Bell className="w-5 h-5 text-indigo-500" />,
      badge: announcements.filter(a => a.targetAudience === 'all' || a.targetAudience === 'students').length || undefined,
    },
    {
      id: 'My Profile',
      label: t('navMyProfile'),
      icon: <User className="w-5 h-5" />,
    },
  ];

  const renderNavSection = () => {
    switch (effectivePortal) {
      case 'super_admin':
        return (
          <div className="space-y-1">
            {superAdminNavItems.map((item) => {
              const active = superAdminNav === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-sa-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    setSuperAdminNav(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-blue-700' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        active
                          ? 'bg-blue-200/70 text-blue-900'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-1">
            <div className="px-3 pb-2 pt-1 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t('adminDashboard')}
              </span>
              <Layers className="w-3.5 h-3.5 text-blue-600" />
            </div>
            {adminNavItems.map((item) => {
              const active = adminNav === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-adm-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    setAdminNav(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-blue-700' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        active
                          ? 'bg-blue-200/70 text-blue-900'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );

      case 'student':
        return (
          <div className="space-y-2">
            {studentNavItems.map((item) => {
              const active = studentNav === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-std-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    setStudentNav(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all select-none ${
                    active
                      ? 'bg-[#1877F2] text-white font-bold shadow-md shadow-blue-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
    }
  };

  const portalDescriptor = {
    super_admin: {
      tag: t('superAdminLevel'),
      desc: t('superAdminDesc'),
    },
    admin: {
      tag: t('adminLevel'),
      desc: t('adminDesc'),
    },
    student: {
      tag: t('studentLevel'),
      desc: t('studentDesc'),
    },
  }[effectivePortal];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-4">
        {/* Navigation list */}
        <nav className="space-y-1">{renderNavSection()}</nav>
      </div>

      {/* Official Higher Novas College Support & Channels Card */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="bg-[#08122B] border border-blue-900/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-300">
            <span>{language === 'ta' ? 'அதிகாரப்பூர்வ தொடர்புகள்' : language === 'si' ? 'නිල සේවාවන්' : 'Official Support & Channels'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <a
              href="https://whatsapp.com/channel/0029VaEAS90Gk1FwJW7arA23"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 text-[10px] font-bold text-emerald-300 transition shrink-0"
              title="Join WhatsApp Channel"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </a>

            <a
              href="https://www.facebook.com/share/18cWgwEKmy/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/50 text-[10px] font-bold text-blue-300 transition shrink-0"
              title="Follow Facebook Page"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Facebook</span>
            </a>
          </div>

          <div className="pt-1.5 border-t border-blue-900/40 space-y-1 text-[10px]">
            <a
              href="https://wa.me/94741760710"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition"
            >
              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-mono font-medium">+94 74 176 0710</span>
            </a>

            <a
              href="mailto:highernovascollege01@gmail.com"
              className="flex items-center gap-1.5 text-slate-300 hover:text-blue-300 transition"
            >
              <Mail className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="truncate font-mono text-[9.5px]">highernovascollege01@gmail.com</span>
            </a>
          </div>
        </div>

        {isStudent ? (
          /* Student Inspiring Watermark Motivation Card */
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0F2252] to-[#0A1633] border border-blue-900/60 p-2.5 text-center select-none shadow-inner">
            <p className="font-serif italic text-xs text-blue-200 font-medium">
              {language === 'ta' ? 'சிறு படிகள்' : language === 'si' ? 'කුඩා පියවර' : 'Small Steps'}
            </p>
            <div className="w-16 h-0.5 bg-[#F59E0B] rounded-full mx-auto my-1 shadow-xs" />
            <p className="font-sans text-[10px] font-black uppercase tracking-wider text-white">
              {language === 'ta' ? 'பெரிய சாதனைகள்!' : language === 'si' ? 'විශිෂ්ට ජයග්‍රහණ!' : 'Big Achievements!'}
            </p>
          </div>
        ) : (
          /* Institutional footer indicator for Admins */
          <div className="p-2.5 bg-blue-900/80 text-white rounded-xl border border-blue-800/60">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span>{t('activeAcademicCycle')}</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-800 rounded text-blue-200">2026</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="hnc-sidebar-desktop"
        className={`hidden lg:block w-64 shrink-0 border-r min-h-[calc(100vh-4rem)] transition-colors ${
          isStudent
            ? 'bg-[#0B1736] border-slate-800/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex"
          onClick={onCloseMobile}
        >
          <div
            id="hnc-sidebar-mobile"
            className={`w-72 max-w-[80vw] h-full shadow-2xl relative flex flex-col ${
              isStudent ? 'bg-[#0B1736] text-white' : 'bg-white text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between p-4 border-b ${
                isStudent ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={APP_LOGO}
                  alt="HNC Competition Logo"
                  className="w-7 h-7 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
                  referrerPolicy="no-referrer"
                />
                <span className="text-sm font-bold">HNC Competition</span>
              </div>
              <button
                onClick={onCloseMobile}
                className={`p-1 rounded-md ${
                  isStudent ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
