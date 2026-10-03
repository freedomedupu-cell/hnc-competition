import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { APP_LOGO } from '../../assets/logo';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Award,
  Bell,
  CheckCircle2,
  Menu,
  LogOut,
  ChevronDown,
  Share2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { ShareModal } from './ShareModal';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    currentPortal,
    setCurrentPortal,
    superAdminUser,
    currentAdmin,
    currentStudent,
    currentAuthUser,
    competitions,
    results,
    logout,
    language,
    setLanguage,
    t,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const getPortalUser = () => {
    switch (currentPortal) {
      case 'super_admin':
        return {
          name: currentAuthUser?.fullName || superAdminUser.name,
          subtitle: currentAuthUser?.email || superAdminUser.email,
          badge: t('superAdminLevel'),
          badgeColor: 'bg-blue-900 text-white',
          icon: <ShieldCheck className="w-4 h-4 text-blue-600" />,
          portalName: t('superAdminPanel'),
        };
      case 'admin':
        return {
          name: currentAuthUser?.fullName || currentAdmin.name,
          subtitle: currentAuthUser?.email || currentAdmin.email,
          badge: t('adminLevel'),
          badgeColor: 'bg-blue-700 text-white',
          icon: <UserCheck className="w-4 h-4 text-emerald-600" />,
          portalName: t('adminDashboard'),
        };
      case 'student':
        return {
          name: currentAuthUser?.fullName || currentStudent.name,
          subtitle: currentAuthUser?.email || currentStudent.email,
          badge: t('studentLevel'),
          badgeColor: 'bg-slate-800 text-white',
          icon: <Award className="w-4 h-4 text-amber-600" />,
          portalName: t('studentPortal'),
        };
    }
  };

  const activeUser = getPortalUser();

  const notificationsList: Array<{ id: string; title: string; time: string; read: boolean }> = [];

  // Dynamic notifications from actual active competitions
  competitions
    .filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s.includes('publish') || s.includes('open') || s.includes('ongoing');
    })
    .slice(0, 3)
    .forEach((c) => {
      notificationsList.push({
        id: `comp-${c.id}`,
        title:
          language === 'ta'
            ? `போட்டி அறிவிப்பு: ${c.title} பதிவு தொடங்கப்பட்டது`
            : language === 'si'
            ? `තරඟ නිවේදනය: ${c.title}`
            : `Active Contest: ${c.title} is open for registration`,
        time: c.startDate || (language === 'ta' ? 'அண்மையில்' : language === 'si' ? 'මෑතකදී' : 'Recent'),
        read: false,
      });
    });

  // Dynamic notifications from actual published results
  results
    .filter((r) => r.publishStatus === 'published')
    .slice(0, 2)
    .forEach((r) => {
      notificationsList.push({
        id: `res-${r.id}`,
        title:
          language === 'ta'
            ? `முடிவுகள் வெளியிடப்பட்டன: ${r.competitionTitle}`
            : language === 'si'
            ? `ප්‍රතිඵල ප්‍රකාශයට පත් කරන ලදී: ${r.competitionTitle}`
            : `Results Published: ${r.competitionTitle}`,
        time: r.publishedAt || r.submittedAt || 'Recent',
        read: true,
      });
    });

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  return (
    <header id="hnc-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3">
          {/* Left: Brand Identity and Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              id="btn-mobile-menu"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <img
                src={APP_LOGO}
                alt="HNC Competition Logo"
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl object-contain shadow-xs shrink-0 border border-slate-200/80 bg-white p-0.5"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[12px] min-[380px]:text-[13px] sm:text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                    {t('appName')}
                  </span>
                  <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded">
                    Firebase Live
                  </span>
                </div>
                <p className="hidden md:block text-[11px] text-slate-500 font-normal truncate">
                  {t('platformSubtitle')}
                </p>
              </div>
            </div>
          </div>



          {/* Right: Language Switcher, Notifications & Current User Profile Bar + Sign Out */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language Switcher Button (English / தமிழ் / සිංහල) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                id="lang-toggle-en"
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Switch to English (Default)"
              >
                <span className="hidden sm:inline">English</span>
                <span className="sm:hidden">EN</span>
              </button>
              <button
                id="lang-toggle-ta"
                type="button"
                onClick={() => setLanguage('ta')}
                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${
                  language === 'ta'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="தமிழுக்கு மாற்றவும் (Switch to Tamil)"
              >
                தமிழ்
              </button>
              <button
                id="lang-toggle-si"
                type="button"
                onClick={() => setLanguage('si')}
                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${
                  language === 'si'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="සිංහල භාෂාවට මාරු වන්න (Switch to Sinhala)"
              >
                සිංහල
              </button>
            </div>

            {/* Quick Refresh Button for Instant Mobile Updates */}
            <button
              id="btn-header-refresh"
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
              title={language === 'ta' ? 'பக்கத்தைப் புதுப்பி (Refresh)' : 'Refresh App'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {/* Quick Platform Share Button */}
            <button
              id="btn-header-share-platform"
              type="button"
              onClick={() => setShowShareModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
              title={language === 'ta' ? 'பதிவு இணைப்பைப் பகிர்க' : 'Share Registration Link'}
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">
                {language === 'ta' ? 'பகிர்' : language === 'si' ? 'බෙදාගන්න' : 'Share'}
              </span>
            </button>

            {/* Notification Bell */}
            <div className="relative shrink-0">
              <button
                id="btn-notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] sm:min-w-[17px] sm:h-[17px] px-0.5 sm:px-1 bg-[#E11D48] text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  id="notifications-dropdown"
                  className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95"
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      {t('platformAlerts')}
                    </span>
                    <span className="text-[11px] text-blue-600 font-medium">{unreadCount} {t('unread')}</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {notificationsList.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-700">
                          {language === 'ta' ? 'புதிய அறிவிப்புகள் இல்லை' : language === 'si' ? 'නව නිවේදන නොමැත' : 'No New Notifications'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {language === 'ta' ? 'அனைத்தும் பார்க்கப்பட்டன!' : language === 'si' ? 'සියල්ල යාවත්කාලීනයි!' : 'All caught up!'}
                        </p>
                      </div>
                    ) : (
                      notificationsList.map((item) => (
                        <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-slate-900">{item.title}</p>
                            {!item.read && (
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{item.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 text-center border-t border-slate-100 bg-slate-50">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-medium text-slate-600 hover:text-blue-700"
                    >
                      {t('close')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            {currentPortal === 'student' ? (
              <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200 select-none">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200 via-amber-100 to-yellow-300 border-2 border-amber-300 flex items-center justify-center text-sm shadow-2xs overflow-hidden shrink-0">
                  {currentStudent.avatarUrl && (currentStudent.avatarUrl.startsWith('data:') || currentStudent.avatarUrl.startsWith('http')) ? (
                    <img src={currentStudent.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span role="img" aria-label="Student Avatar" className="text-base leading-none">
                      {currentStudent.avatarUrl || '👦'}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-xs font-extrabold text-slate-800 leading-tight block">
                    {language === 'ta'
                      ? `வணக்கம், ${currentAuthUser?.fullName?.split(' ')[0] || currentStudent.name?.split(' ')[0] || 'மாணவர்'}!`
                      : language === 'si'
                      ? `ආයුබෝවන්, ${currentAuthUser?.fullName?.split(' ')[0] || currentStudent.name?.split(' ')[0] || 'ශිෂ්‍ය'}!`
                      : `Hello, ${currentAuthUser?.fullName?.split(' ')[0] || currentStudent.name?.split(' ')[0] || 'Student'}!`}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-bold leading-tight flex items-center gap-1 mt-0.5">
                    {language === 'ta' ? 'தொடர்ந்து கற்கவும் 🌿' : language === 'si' ? 'දිගටම ඉගෙන ගන්න 🌿' : 'Keep Learning 🌿'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-800 font-bold text-xs flex items-center justify-center">
                  {activeUser.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 leading-none">
                      {activeUser.name.split(' ')[0]} {activeUser.name.split(' ').slice(-1)[0]}
                    </span>
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight block truncate max-w-[120px]">
                    {activeUser.subtitle}
                  </span>
                </div>
              </div>
            )}

            {/* Logout / Sign Out Button */}
            <button
              id="btn-header-logout"
              onClick={logout}
              title={language === 'ta' ? 'வெளியேறு' : language === 'si' ? 'ඉවත් වන්න' : 'Sign Out'}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                {language === 'ta' ? 'வெளியேறு' : language === 'si' ? 'ඉවත් වන්න' : 'Sign Out'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </header>
  );
};
