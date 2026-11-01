import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  Users,
  GraduationCap,
  Trophy,
  FileCheck,
  Plus,
  ShieldCheck,
  ArrowUpRight,
  Database,
  Activity,
  Calendar,
  HelpCircle,
  FileText,
  Sparkles,
  CheckCircle2,
  Video,
  Download,
  Eye,
  MapPin,
  Settings,
  Bell,
  Clock,
  AlertTriangle,
  Gamepad2,
  Layout,
  Sliders,
  Award,
  Gift,
  Zap,
} from 'lucide-react';
import { CompetitionEditorModal } from '../competitions/CompetitionEditorModal';
import { SpinWheelGovernanceModal } from './SpinWheelGovernanceModal';
import { Competition, CompetitionType, PlatformSettings } from '../../types';
import { AnimatedHeroLeaderboard } from '../leaderboard/AnimatedHeroLeaderboard';

interface SuperAdminDashboardProps {
  onNavigate: (tab: any) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const {
    admins,
    students,
    competitions,
    results,
    auditLogs,
    superAdminUser,
    currentAuthUser,
    payments,
    saveCompetition,
    liveProctorSessions,
    settings,
    updateSettings,
    language,
    t,
    openDistrictsStudio,
  } = useApp();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [editorType, setEditorType] = useState<CompetitionType>('Competition');
  const [editorTab, setEditorTab] = useState<'details' | 'schedule' | 'prizes' | 'questions'>('details');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleToggleSpin = async () => {
    const nextState = settings.enableDailySpinWheel === false;
    await updateSettings({ enableDailySpinWheel: nextState });
    setSuccessToast(
      nextState
        ? (language === 'ta'
            ? 'அதிர்ஷ்ட சுழல் சக்கரம் இயக்கப்பட்டது (Spin Wheel Activated - ON)'
            : 'Lucky Spin Wheel Activated (ON)')
        : (language === 'ta'
            ? 'அதிர்ஷ்ட சுழல் சக்கரம் முடக்கப்பட்டது (Spin Wheel Paused - OFF)'
            : 'Lucky Spin Wheel Paused (OFF)')
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleSubjectAlerts = async () => {
    const nextState = settings.enableSubjectAlerts === false;
    await updateSettings({ enableSubjectAlerts: nextState });
    setSuccessToast(
      nextState
        ? (language === 'ta'
            ? 'பாட அறிவிப்புகள் இயக்கப்பட்டது (Subject Alerts: ON)'
            : 'Subject Alerts Banner Activated (ON)')
        : (language === 'ta'
            ? 'பாட அறிவிப்புகள் முடக்கப்பட்டது (Subject Alerts: OFF)'
            : 'Subject Alerts Banner Paused (OFF)')
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleDeadlineAlerts = async () => {
    const nextState = settings.enableDeadlineAlerts === false;
    await updateSettings({ enableDeadlineAlerts: nextState });
    setSuccessToast(
      nextState
        ? (language === 'ta'
            ? 'கெடுநிலை புஷ் அறிவிப்புகள் இயக்கப்பட்டது (Deadlines Status: ON)'
            : 'Deadlines Status Banner Activated (ON)')
        : (language === 'ta'
            ? 'கெடுநிலை புஷ் அறிவிப்புகள் முடக்கப்பட்டது (Deadlines Status: OFF)'
            : 'Deadlines Status Banner Paused (OFF)')
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleAllStudentAlerts = async (targetState: boolean) => {
    await updateSettings({
      enableSubjectAlerts: targetState,
      enableDeadlineAlerts: targetState,
    });
    setSuccessToast(
      targetState
        ? (language === 'ta'
            ? 'அனைத்து மாணவர் அறிவிப்பு அமைப்புகளும் இயக்கப்பட்டன (All Alerts: ON)'
            : 'All Student Alert Banners Activated (ON)')
        : (language === 'ta'
            ? 'அனைத்து மாணவர் அறிவிப்பு அமைப்புகளும் முடக்கப்பட்டன (All Alerts: OFF)'
            : 'All Student Alert Banners Paused (OFF)')
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleStudyGamesCard = async () => {
    const nextState = settings.enableStudyGamesCard === false;
    await updateSettings({ enableStudyGamesCard: nextState });
    setSuccessToast(
      nextState
        ? (language === 'ta'
            ? 'மாணவர் கல்வி கேம்கள் அட்டை இயக்கப்பட்டது (Study Games Card: ON)'
            : 'Daily Study Games & Focus Lounge Card Activated (ON)')
        : (language === 'ta'
            ? 'மாணவர் கல்வி கேம்கள் அட்டை முடக்கப்பட்டது (Study Games Card: OFF)'
            : 'Daily Study Games & Focus Lounge Card Hidden (OFF)')
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleApplyDashboardPreset = async (preset: 'minimal' | 'full') => {
    if (preset === 'minimal') {
      await updateSettings({
        enableStudyGamesCard: false,
        enableDailySpinWheel: false,
        enableAiTimetableCard: false,
        enableSmartDailyTips: false,
        enableOfflineMaterialsCard: false,
        enableReferralCard: false,
        enableEduArenaCard: false,
        enableLeaderboardsCard: false,
        enableAchievementsCard: false,
        enableToastPreviewDeck: false,
        enableSubjectAlerts: false,
        enableDeadlineAlerts: true, // Keep critical deadlines
        enableNextCompetitionCountdown: true, // Keep next contest
      });
      setSuccessToast(
        language === 'ta'
          ? '🎯 சுத்தமான குறைந்தபட்ச முகப்பு (Minimal Mode) இயக்கப்பட்டது! கூடுதல் கேம்கள் & விளம்பரங்கள் மறைக்கப்பட்டன.'
          : '🎯 Clean & Minimal Mode Activated! Extra gaming and promo widgets hidden.'
      );
    } else {
      await updateSettings({
        enableStudyGamesCard: true,
        enableDailySpinWheel: true,
        enableAiTimetableCard: true,
        enableSmartDailyTips: true,
        enableOfflineMaterialsCard: true,
        enableReferralCard: true,
        enableEduArenaCard: true,
        enableLeaderboardsCard: true,
        enableAchievementsCard: true,
        enableToastPreviewDeck: true,
        enableSubjectAlerts: true,
        enableDeadlineAlerts: true,
        enableNextCompetitionCountdown: true,
      });
      setSuccessToast(
        language === 'ta'
          ? '🌟 முழுமையான முகப்பு (Full Interactive Mode) இயக்கப்பட்டது! அனைத்து கேம்கள் & விட்ஜெட்டுகள் மீண்டும் இயக்கப்பட்டன.'
          : '🌟 Full Interactive Mode Activated! All widgets and games restored.'
      );
    }
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleToggleWidget = async (key: keyof PlatformSettings, labelTa: string, labelEn: string) => {
    const currentState = (settings as any)?.[key] !== false;
    const nextState = !currentState;
    await updateSettings({ [key]: nextState });
    setSuccessToast(
      nextState
        ? (language === 'ta' ? `${labelTa}: இயக்கப்பட்டது (ON)` : `${labelEn}: Activated (ON)`)
        : (language === 'ta' ? `${labelTa}: முடக்கப்பட்டது (OFF)` : `${labelEn}: Hidden (OFF)`)
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const activeWidgetCount = [
    settings?.enableStudyGamesCard !== false,
    settings?.enableDailySpinWheel !== false,
    settings?.enableSubjectAlerts !== false,
    settings?.enableDeadlineAlerts !== false,
    settings?.enableNextCompetitionCountdown !== false,
    settings?.enableToastPreviewDeck !== false,
    settings?.enableSmartDailyTips !== false,
    settings?.enableAiTimetableCard !== false,
    settings?.enableOfflineMaterialsCard !== false,
    settings?.enableReferralCard !== false,
    settings?.enableEduArenaCard !== false,
    settings?.enableLeaderboardsCard !== false,
    settings?.enableAchievementsCard !== false,
  ].filter(Boolean).length;

  const activeProctorCount = liveProctorSessions.filter((s) => s.status === 'active').length;

  const activeCompetitions = competitions.filter(
    (c) => c.status === 'ongoing' || c.status === 'upcoming'
  );
  const publishedResults = results.filter((r) => r.publishStatus === 'published');

  const openEditor = (type: CompetitionType, tab: 'details' | 'questions' = 'details', compToEdit: Competition | null = null) => {
    setEditingComp(compToEdit);
    setEditorType(type);
    setEditorTab(tab);
    setIsEditorOpen(true);
  };

  const handleSave = async (compData: any) => {
    await saveCompetition(compData);
    setSuccessToast(editingComp ? `Updated: ${compData.title}` : `Successfully published ${editorType}: ${compData.title}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Live Animated Leaderboard Ticker & Champions Podium */}
      <AnimatedHeroLeaderboard onNavigate={onNavigate} />

      {/* Top Welcome Banner (COMPACT & SLIM) */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-xs space-y-2">
        {/* Top Title & Info Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
          <div className="min-w-0 flex-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
              Super Admin Operations Control
            </span>
            <h1 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
              {t('welcomeBack')}, {superAdminUser.name}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight truncate">
              National Platform Command — Overall management of competitions, students & leaderboards.
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Super Admin Level
            </span>
          </div>
        </div>

        {/* Quick Action Studio Toolbar (COMPACT & SLIM) */}
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span>⚡ Quick Action Studio Toolbar</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1">
            <button
              id="sa-quick-create-island-quest"
              onClick={() => openDistrictsStudio('create')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="Create Gamified HNC Arena Island Quest (தீவுப் போட்டி உருவாக்கு)"
            >
              <Sparkles className="w-3 h-3 text-amber-200 shrink-0" />
              <span className="truncate">
                {language === 'ta'
                  ? '+ தீவுப் போட்டி'
                  : language === 'si'
                  ? '+ දූපත් තරඟය'
                  : '+ Island Quest'}
              </span>
            </button>

            <button
              id="sa-quick-edu-arena-studio"
              onClick={() => openDistrictsStudio('list')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200/80 hover:bg-indigo-100 transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="HNC Edu-Arena Study Gaming Studio (25 மாவட்டங்கள்)"
            >
              <MapPin className="w-3 h-3 text-indigo-700 shrink-0" />
              <span className="truncate">
                {language === 'ta'
                  ? '🎯 Edu-Arena'
                  : language === 'si'
                  ? '🎯 Edu-Arena'
                  : '🎯 Edu-Arena Studio'}
              </span>
            </button>

            <button
              id="sa-quick-sponsors-ads"
              onClick={() => onNavigate('Sponsors & Ads')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100 transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="Create and Manage Sponsor Advertisements (விளம்பர பலகை)"
            >
              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate">{language === 'ta' ? 'விளம்பரம்' : 'Sponsors & Ads'}</span>
            </button>

            <button
              id="sa-quick-add-quiz"
              onClick={() => openEditor('Quiz', 'details')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100 transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="Create Timed Speed Quiz (வினாடி வினா)"
            >
              <HelpCircle className="w-3 h-3 text-purple-600 shrink-0" />
              <span>+ Quiz</span>
            </button>

            <button
              id="sa-quick-add-exam"
              onClick={() => openEditor('Exam', 'details')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200/80 hover:bg-indigo-100 transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="Create Official Examination (பரீட்சை)"
            >
              <FileText className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>+ Exam</span>
            </button>

            <button
              id="sa-quick-add-comp"
              onClick={() => openEditor('Competition', 'details')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="Create National Academic Olympiad / Competition (போட்டி)"
            >
              <Trophy className="w-3 h-3 shrink-0" />
              <span>+ Contest</span>
            </button>

            <button
              id="sa-quick-paper-studio"
              onClick={() => openEditor('Exam', 'questions')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="Design and assemble question papers with rubrics (வினாத்தாள் தயாரிப்பு)"
            >
              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">Paper Studio</span>
            </button>

            <button
              id="sa-quick-districts-studio"
              onClick={() => onNavigate('Competition Management')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-indigo-700 to-blue-700 text-white hover:from-indigo-800 hover:to-blue-800 transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="இலங்கையின் 25 மாவட்டப் போட்டிகள் & பிரசுரிக்கும் மையம்"
            >
              <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
              <span className="truncate">25 Districts</span>
            </button>

            <button
              id="sa-quick-spin-control"
              onClick={() => setIsSpinModalOpen(true)}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center ${
                settings?.enableDailySpinWheel !== false
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
              }`}
              title={
                language === 'ta'
                  ? 'சுழல் சக்கரம் அமைப்புகள் மற்றும் கட்டுப்பாடு'
                  : 'Spin Wheel Governance & Options'
              }
            >
              <span className="text-xs">🎡</span>
              <span className="truncate">
                {language === 'ta'
                  ? `சுழல்: ${settings?.enableDailySpinWheel !== false ? 'ON' : 'OFF'}`
                  : `Spin: ${settings?.enableDailySpinWheel !== false ? 'ON' : 'OFF'}`}
              </span>
            </button>

            {/* Quick Toggle: Subject Alerts Banner */}
            <button
              id="sa-quick-subject-alerts-toggle"
              onClick={handleToggleSubjectAlerts}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center ${
                settings?.enableSubjectAlerts !== false
                  ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title={
                language === 'ta'
                  ? 'மாணவர் பாட அறிவிப்புகள் ஆன்/ஆஃப் (Subject Alerts On/Off)'
                  : 'Subject Alerts Banner On/Off'
              }
            >
              <Bell className="w-3 h-3 text-blue-700 shrink-0" />
              <span className="truncate">
                {language === 'ta'
                  ? `பாட அறிவிப்பு: ${settings?.enableSubjectAlerts !== false ? 'ON' : 'OFF'}`
                  : `Subj Alert: ${settings?.enableSubjectAlerts !== false ? 'ON' : 'OFF'}`}
              </span>
            </button>

            {/* Quick Toggle: Deadlines Status Banner */}
            <button
              id="sa-quick-deadlines-alerts-toggle"
              onClick={handleToggleDeadlineAlerts}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center ${
                settings?.enableDeadlineAlerts !== false
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title={
                language === 'ta'
                  ? 'கெடுநிலை மற்றும் புஷ் அறிவிப்புகள் ஆன்/ஆஃப் (Deadlines Status & Push On/Off)'
                  : 'Deadlines Status & Push Banner On/Off'
              }
            >
              <Clock className="w-3 h-3 text-amber-700 shrink-0" />
              <span className="truncate">
                {language === 'ta'
                  ? `கெடுநிலை: ${settings?.enableDeadlineAlerts !== false ? 'ON' : 'OFF'}`
                  : `Deadlines: ${settings?.enableDeadlineAlerts !== false ? 'ON' : 'OFF'}`}
              </span>
            </button>

            {/* Quick Toggle: Study Games 4-in-1 Arena */}
            <button
              id="sa-quick-study-games-toggle"
              onClick={handleToggleStudyGamesCard}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center ${
                settings?.enableStudyGamesCard !== false
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title={
                language === 'ta'
                  ? 'மாணவர் கல்வி கேம்கள் அட்டை ஆன்/ஆஃப் (Study Games 4-in-1 On/Off)'
                  : 'Daily Study Games & Focus Lounge On/Off'
              }
            >
              <Gamepad2 className="w-3 h-3 text-indigo-700 shrink-0" />
              <span className="truncate">
                {language === 'ta'
                  ? `கேம்கள்: ${settings?.enableStudyGamesCard !== false ? 'ON' : 'OFF'}`
                  : `Games: ${settings?.enableStudyGamesCard !== false ? 'ON' : 'OFF'}`}
              </span>
            </button>

            {/* Quick Preset: Clean & Minimal Dashboard */}
            <button
              id="sa-quick-clean-dashboard-toggle"
              onClick={() => handleApplyDashboardPreset(activeWidgetCount <= 4 ? 'full' : 'minimal')}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer text-center ${
                activeWidgetCount <= 4
                  ? 'bg-purple-100 text-purple-900 border-purple-400 hover:bg-purple-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
              title={
                language === 'ta'
                  ? 'சுத்தமான முகப்பு (குறைந்தபட்ச வடிவம் / முழு வடிவம் மாற்று)'
                  : 'Toggle Clean & Minimal Dashboard Mode'
              }
            >
              <Layout className="w-3 h-3 text-slate-800 shrink-0" />
              <span className="truncate">
                {activeWidgetCount <= 4
                  ? (language === 'ta' ? '🌟 முழு முகப்பு' : '🌟 Full Mode')
                  : (language === 'ta' ? '🎯 சுத்த முகப்பு' : '🎯 Clean Mode')}
              </span>
            </button>

            {/* Platform Master Controls Tab Direct Jump */}
            <button
              id="sa-quick-platform-master-controls"
              onClick={() => onNavigate('Platform Master Controls')}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-indigo-900 to-purple-900 text-amber-300 border border-indigo-700/80 hover:from-indigo-800 hover:to-purple-800 transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer text-center"
              title="Open Platform Master Controls Tab to manage global modules & grade consistency"
            >
              <Sliders className="w-3 h-3 text-amber-300 shrink-0" />
              <span className="truncate">
                {language === 'ta' ? '⚙️ தள முதன்மை' : '⚙️ Master Controls'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Super Admin Spinning Wheel Options & Control Deck */}
      <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">🎡</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                {language === 'ta'
                  ? 'மாணவர் அதிர்ஷ்ட சுழல் சக்கரம் மேலாண்மை (Lucky Spin Wheel Options)'
                  : 'Student Daily Lucky Spin Wheel Governance'}
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  settings?.enableDailySpinWheel !== false
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings?.enableDailySpinWheel !== false
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                {settings?.enableDailySpinWheel !== false
                  ? language === 'ta'
                    ? 'இயங்குகிறது (ACTIVE - ON)'
                    : 'ACTIVE (ON)'
                  : language === 'ta'
                  ? 'முடக்கப்பட்டுள்ளது (PAUSED - OFF)'
                  : 'PAUSED (OFF)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {language === 'ta'
                ? 'மாணவர் போர்ட்டலின் Study Games Hub இல் உள்ள தினசரி சுழல் சக்கரத்தை இங்கிருந்து ஒரே கிளிக்கில் இயக்கலாம் அல்லது முடக்கலாம். புள்ளிகள், துறைகள் (5, 10, 15, 20, 25, 50 PTS) மற்றும் நேர மீட்டமைப்புகளை அமைப்புகள் மூலம் நிர்வகிக்கலாம்.'
                : 'Direct master control for the Student Study Games Hub daily lucky spin wheel. Toggle on/off instantly or configure point distributions, probabilities, and festival spin resets.'}
            </p>
            {/* Quick sectors preview badge row */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-semibold text-slate-700">
              <span className="text-slate-500">
                {language === 'ta' ? 'புள்ளிகள் பிரிவுகள்:' : 'Point Sectors:'}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">5 PTS</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">10 PTS</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">15 PTS</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">20 PTS</span>
              <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded font-bold">25 PTS</span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">50 PTS 🔥</span>
              <span className="text-slate-400 ml-1">• 1 Spin / 24h</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            {/* Direct ON/OFF Toggle Button */}
            <button
              onClick={handleToggleSpin}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                settings?.enableDailySpinWheel !== false
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-200'
              }`}
              title={
                settings?.enableDailySpinWheel !== false
                  ? 'Click to Turn OFF Spin Wheel'
                  : 'Click to Turn ON Spin Wheel'
              }
            >
              <span>{settings?.enableDailySpinWheel !== false ? '⏸️' : '▶️'}</span>
              <span>
                {settings?.enableDailySpinWheel !== false
                  ? language === 'ta'
                    ? 'சக்கரத்தை முடக்கு (Turn OFF)'
                    : 'Pause Wheel (Turn OFF)'
                  : language === 'ta'
                  ? 'சக்கரத்தை இயக்கு (Turn ON)'
                  : 'Activate Wheel (Turn ON)'}
              </span>
            </button>

            {/* Detailed Options Modal Button */}
            <button
              onClick={() => setIsSpinModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-blue-400 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              title="Open Spinning Wheel Options & Live Simulation"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span>
                {language === 'ta'
                  ? 'சுழல் அமைப்புகள் (Spin Options)'
                  : 'Spin Options & Rules'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Super Admin Student Dashboard Layout & Interactive Games Governance Deck */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-amber-500/10 border-2 border-blue-300/80 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden space-y-5">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-blue-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header Row & Quick Declutter Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-blue-200/60 pb-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">🎨</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                {language === 'ta'
                  ? 'மாணவர் முகப்பு விட்ஜெட்டுகள் & கல்வி கேம்கள் கட்டுப்பாடு (Dashboard Layout & Games Governance)'
                  : 'Student Dashboard Layout & Interactive Games Governance Deck'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                {activeWidgetCount} / 13 {language === 'ta' ? 'செயலில்' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              {language === 'ta'
                ? 'மாணவர் முகப்பில் பல அட்டைகள் தோன்றுவதை எளிதாக்க (Declutter) கீழே உள்ள 1-Click அமைப்புகளைப் பயன்படுத்தவும். Daily Study Games & Focus Lounge, அதிர்ஷ்ட சக்கரம், பாட அறிவிப்புகள், மற்றும் பிற விட்ஜெட்டுகளை இங்கிருந்து நேரடியாக ஆன்/ஆஃப் செய்யலாம்.'
                : 'Super Admin master controls to toggle individual student dashboard widgets (Daily Study Games, Lucky Spin, Subject Alerts, Deadlines, AI Timetable) or use 1-click Clean Mode to declutter the student experience.'}
            </p>
          </div>

          {/* Quick Preset Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              id="deck-btn-preset-minimal"
              onClick={() => handleApplyDashboardPreset('minimal')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Activate Clean Minimal Dashboard (Declutters extra gaming & promo cards)"
            >
              <span>🎯</span>
              <span>{language === 'ta' ? 'சுத்த முகப்பு (Clean Mode)' : 'Clean Minimal Mode'}</span>
            </button>
            <button
              type="button"
              id="deck-btn-preset-full"
              onClick={() => handleApplyDashboardPreset('full')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Activate Full Interactive Dashboard (Enables all games & widgets)"
            >
              <span>🌟</span>
              <span>{language === 'ta' ? 'முழு முகப்பு (Full Mode)' : 'Full Interactive Mode'}</span>
            </button>
            <button
              type="button"
              id="deck-btn-open-master-controls"
              onClick={() => onNavigate('Platform Master Controls')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Open Platform Master Controls dedicated management tab"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'முழு முதன்மைக் கட்டுப்பாட்டு அறை →' : 'Master Controls Tab →'}</span>
            </button>
          </div>
        </div>

        {/* Section 1: Core User-Requested Primary Feature Toggles (4-in-1 Study Games, Spin Wheel, Edu-Arena, Subject Alerts, Deadlines) */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-purple-600" />
              <span>{language === 'ta' ? 'முக்கிய ஊடாடும் அம்சங்கள் & எச்சரிக்கைகள்' : 'Primary Interactive Cards & Alert Banners'}</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">Instant Real-time Sync</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Widget 1: Daily Study Games & Focus Lounge (4-in-1 Interactive) */}
            <div className={`p-4 rounded-xl border-2 transition-all space-y-3 flex flex-col justify-between ${
              settings?.enableStudyGamesCard !== false
                ? 'bg-white border-purple-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-90'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${
                      settings?.enableStudyGamesCard !== false
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-slate-200 text-slate-500 border border-slate-300'
                    }`}>
                      🎮
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          Daily Study Games & Focus Lounge
                        </h5>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          settings?.enableStudyGamesCard !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {settings?.enableStudyGamesCard !== false ? 'ON (இயங்குகிறது)' : 'OFF (முடக்கம்)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-900 font-semibold mt-0.5">
                        4-in-1 Interactive Card
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    id="toggle-study-games-card"
                    onClick={handleToggleStudyGamesCard}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                      settings?.enableStudyGamesCard !== false ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle Daily Study Games Card"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings?.enableStudyGamesCard !== false ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {language === 'ta'
                    ? 'Lucky spin, 60s brain challenge, speed math rush & Lo-Fi Pomodoro study cam அட்டை மாணவர் முகப்பில் தோன்றுவதை ஆன்/ஆஃப் செய்கிறது.'
                    : 'Daily lucky spin, 60s brain challenge, speed math rush & Lo-Fi Pomodoro study cam card on student dashboard.'}
                </p>
              </div>

              <div className="p-2 bg-purple-50/70 rounded-lg border border-purple-100 text-[11px] flex items-center justify-between">
                <span className="text-purple-950 font-medium truncate">
                  {settings?.enableStudyGamesCard !== false ? '✓ மாணவர் திரையில் காட்சியளிக்கிறது' : '⚠️ முகப்பிலிருந்து மறைக்கப்பட்டுள்ளது'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleStudyGamesCard}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition shrink-0 ${
                    settings?.enableStudyGamesCard !== false
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {settings?.enableStudyGamesCard !== false ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            </div>

            {/* Widget 2: Lucky Spin Wheel */}
            <div className={`p-4 rounded-xl border-2 transition-all space-y-3 flex flex-col justify-between ${
              settings?.enableDailySpinWheel !== false
                ? 'bg-white border-amber-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-90'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${
                      settings?.enableDailySpinWheel !== false
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-200 text-slate-500 border border-slate-300'
                    }`}>
                      🎡
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          {language === 'ta' ? 'அதிர்ஷ்ட சக்கரம் (Spin Wheel)' : 'Daily Lucky Spin Wheel'}
                        </h5>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          settings?.enableDailySpinWheel !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {settings?.enableDailySpinWheel !== false ? 'ON (இயங்குகிறது)' : 'OFF (முடக்கம்)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 font-semibold mt-0.5">
                        5 to 50 PTS • 24h limit
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    id="toggle-spin-wheel-card"
                    onClick={handleToggleSpin}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                      settings?.enableDailySpinWheel !== false ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle Lucky Spin Wheel"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings?.enableDailySpinWheel !== false ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {language === 'ta'
                    ? 'மாணவர்கள் தினமும் 1 முறை சுழற்றி போனஸ் புள்ளிகளைப் பெறும் சக்கரத்தைக் கட்டுப்படுத்துகிறது.'
                    : 'Controls daily spin wheel rewarding students 5-50 points. Modifiable via Spin Options.'}
                </p>
              </div>

              <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-100 text-[11px] flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsSpinModalOpen(true)}
                  className="px-2 py-1 rounded text-[10px] font-bold bg-white text-slate-800 border border-slate-300 hover:border-amber-400 cursor-pointer flex items-center gap-1"
                >
                  <Settings className="w-3 h-3 text-amber-600" />
                  <span>{language === 'ta' ? 'அமைப்புகள்' : 'Rules'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleSpin}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition shrink-0 ${
                    settings?.enableDailySpinWheel !== false
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {settings?.enableDailySpinWheel !== false ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            </div>

            {/* Widget 3: HNC Edu-Arena: Island Quest */}
            <div className={`p-4 rounded-xl border-2 transition-all space-y-3 flex flex-col justify-between ${
              settings?.enableEduArenaCard !== false
                ? 'bg-white border-emerald-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-90'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${
                      settings?.enableEduArenaCard !== false
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-500 border border-slate-300'
                    }`}>
                      🎯
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          HNC Edu-Arena: Island Quest
                        </h5>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          settings?.enableEduArenaCard !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {settings?.enableEduArenaCard !== false ? 'ON (இயங்குகிறது)' : 'OFF (முடக்கம்)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900 font-semibold mt-0.5">
                        25 Districts Study Gaming
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    id="toggle-edu-arena-card"
                    onClick={() => handleToggleWidget('enableEduArenaCard', 'Edu-Arena Island Quest', 'Edu-Arena Island Quest')}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                      settings?.enableEduArenaCard !== false ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle Edu-Arena Island Quest"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings?.enableEduArenaCard !== false ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {language === 'ta'
                    ? 'இலங்கையின் 25 மாவட்டங்களை உள்ளடக்கிய கேமிஃபைட் கல்விப் பயணம் விளம்பர அட்டை.'
                    : 'Island Quest 25 Districts gamified quiz map promo card on student dashboard.'}
                </p>
              </div>

              <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-100 text-[11px] flex items-center justify-between">
                <span className="text-emerald-950 font-medium truncate">
                  {settings?.enableEduArenaCard !== false ? '✓ மாணவர் திரையில் காட்சியளிக்கிறது' : '⚠️ முகப்பிலிருந்து மறைக்கப்பட்டுள்ளது'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableEduArenaCard', 'Edu-Arena Island Quest', 'Edu-Arena Island Quest')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition shrink-0 ${
                    settings?.enableEduArenaCard !== false
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {settings?.enableEduArenaCard !== false ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            </div>

            {/* Widget 4: Subject Publication Alerts Banner */}
            <div className={`p-4 rounded-xl border-2 transition-all space-y-3 flex flex-col justify-between ${
              settings?.enableSubjectAlerts !== false
                ? 'bg-white border-blue-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-90'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${
                      settings?.enableSubjectAlerts !== false
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-slate-200 text-slate-500 border border-slate-300'
                    }`}>
                      🌐
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          {language === 'ta' ? 'பாட அறிவிப்புகள் (Subject Alerts)' : 'Subject Alerts Banner'}
                        </h5>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          settings?.enableSubjectAlerts !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {settings?.enableSubjectAlerts !== false ? 'ON (இயங்குகிறது)' : 'OFF (முடக்கம்)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-900 font-semibold mt-0.5">
                        English, Enable Push, Test Alert
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    id="toggle-subject-alerts-banner"
                    onClick={handleToggleSubjectAlerts}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                      settings?.enableSubjectAlerts !== false ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle Subject Alerts"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings?.enableSubjectAlerts !== false ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {language === 'ta'
                    ? 'Subject Alerts: English, Enable Push, 🔔 Test, Manage Subjects பேனரைக் கட்டுப்படுத்துகிறது.'
                    : 'Controls Subject Alerts: English, Enable Push, 🔔 Test, Manage Subjects on student dashboard.'}
                </p>
              </div>

              <div className="p-2 bg-blue-50/70 rounded-lg border border-blue-100 text-[11px] flex items-center justify-between">
                <span className="text-blue-950 font-medium truncate">
                  {settings?.enableSubjectAlerts !== false ? '✓ மாணவர் திரையில் காட்சியளிக்கிறது' : '⚠️ முகப்பிலிருந்து மறைக்கப்பட்டுள்ளது'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleSubjectAlerts}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition shrink-0 ${
                    settings?.enableSubjectAlerts !== false
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {settings?.enableSubjectAlerts !== false ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            </div>

            {/* Widget 5: Deadlines Status & Push Banner */}
            <div className={`p-4 rounded-xl border-2 transition-all space-y-3 flex flex-col justify-between ${
              settings?.enableDeadlineAlerts !== false
                ? 'bg-white border-amber-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-90'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${
                      settings?.enableDeadlineAlerts !== false
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-200 text-slate-500 border border-slate-300'
                    }`}>
                      ⏰
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          {language === 'ta' ? 'கெடுநிலை & புஷ் (Deadlines Status)' : 'Deadlines Status & Push'}
                        </h5>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          settings?.enableDeadlineAlerts !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {settings?.enableDeadlineAlerts !== false ? 'ON (இயங்குகிறது)' : 'OFF (முடக்கம்)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 font-semibold mt-0.5">
                        Schedule Alerts & Push Activation
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    id="toggle-deadlines-alerts-banner"
                    onClick={handleToggleDeadlineAlerts}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                      settings?.enableDeadlineAlerts !== false ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle Deadline Alerts"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings?.enableDeadlineAlerts !== false ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {language === 'ta'
                    ? 'Deadlines Status: No Critical Deadlines Pending... Enable Push Alerts பேனரைக் கட்டுப்படுத்துகிறது.'
                    : 'Controls Deadlines Status, schedule alerts, and Enable Push Alerts button on student dashboard.'}
                </p>
              </div>

              <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-100 text-[11px] flex items-center justify-between">
                <span className="text-amber-950 font-medium truncate">
                  {settings?.enableDeadlineAlerts !== false ? '✓ மாணவர் திரையில் காட்சியளிக்கிறது' : '⚠️ முகப்பிலிருந்து மறைக்கப்பட்டுள்ளது'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleDeadlineAlerts}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition shrink-0 ${
                    settings?.enableDeadlineAlerts !== false
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {settings?.enableDeadlineAlerts !== false ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            </div>

            {/* Widget 6: Gemini AI Study Timetable Banner */}
            <div className={`p-4 rounded-xl border-2 transition-all space-y-3 flex flex-col justify-between ${
              settings?.enableAiTimetableCard !== false
                ? 'bg-white border-indigo-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-90'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${
                      settings?.enableAiTimetableCard !== false
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-200 text-slate-500 border border-slate-300'
                    }`}>
                      📅
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs sm:text-sm font-black text-slate-900">
                          Gemini AI Study Timetable
                        </h5>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          settings?.enableAiTimetableCard !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {settings?.enableAiTimetableCard !== false ? 'ON (இயங்குகிறது)' : 'OFF (முடக்கம்)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-900 font-semibold mt-0.5">
                        Targeted for Weak Subjects & Revision
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    id="toggle-ai-timetable-card"
                    onClick={() => handleToggleWidget('enableAiTimetableCard', 'AI Timetable', 'AI Timetable')}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                      settings?.enableAiTimetableCard !== false ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle Gemini AI Study Timetable"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings?.enableAiTimetableCard !== false ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {language === 'ta'
                    ? 'மாணவர் முகப்பில் தோன்றும் Gemini 3.8 Flash AI Coach அட்டவணை பேனரைக் கட்டுப்படுத்துகிறது.'
                    : 'Personalized AI Timetable banner targeted for weak subjects and upcoming contests.'}
                </p>
              </div>

              <div className="p-2 bg-indigo-50/70 rounded-lg border border-indigo-100 text-[11px] flex items-center justify-between">
                <span className="text-indigo-950 font-medium truncate">
                  {settings?.enableAiTimetableCard !== false ? '✓ மாணவர் திரையில் காட்சியளிக்கிறது' : '⚠️ முகப்பிலிருந்து மறைக்கப்பட்டுள்ளது'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableAiTimetableCard', 'AI Timetable', 'AI Timetable')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition shrink-0 ${
                    settings?.enableAiTimetableCard !== false
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {settings?.enableAiTimetableCard !== false ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Secondary Content Cards & Widgets (Clean Minimal / Declutter Switches) */}
        <div className="space-y-3 relative z-10 pt-2 border-t border-blue-200/50">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-blue-600" />
              <span>{language === 'ta' ? 'கூடுதல் முகப்பு விட்ஜெட்டுகள் (Secondary Widgets - Clean Mode Controls)' : 'Additional Dashboard Widgets (Declutter Controls)'}</span>
            </h4>
            <span className="text-[11px] text-slate-500">Toggle each widget on or off independently</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Widget 7: Smart Daily Tips & Exam Tricks */}
            <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
              settings?.enableSmartDailyTips !== false ? 'bg-white border-amber-200' : 'bg-slate-50 border-slate-200 opacity-80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 truncate">Smart Daily Tips</h6>
                    <span className="text-[10px] text-slate-500">Exam Tricks & Streaks</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableSmartDailyTips', 'Smart Daily Tips', 'Smart Daily Tips')}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    settings?.enableSmartDailyTips !== false ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings?.enableSmartDailyTips !== false ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                <span className={settings?.enableSmartDailyTips !== false ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings?.enableSmartDailyTips !== false ? 'Visible' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableSmartDailyTips', 'Smart Daily Tips', 'Smart Daily Tips')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>

            {/* Widget 8: Offline Study Materials Hub */}
            <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
              settings?.enableOfflineMaterialsCard !== false ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-200 opacity-80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 truncate">Offline Study Hub</h6>
                    <span className="text-[10px] text-slate-500">Service Worker Cache</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableOfflineMaterialsCard', 'Offline Hub', 'Offline Hub')}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    settings?.enableOfflineMaterialsCard !== false ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings?.enableOfflineMaterialsCard !== false ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                <span className={settings?.enableOfflineMaterialsCard !== false ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings?.enableOfflineMaterialsCard !== false ? 'Visible' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableOfflineMaterialsCard', 'Offline Hub', 'Offline Hub')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>

            {/* Widget 9: Referral Rewards & Share Points */}
            <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
              settings?.enableReferralCard !== false ? 'bg-white border-pink-200' : 'bg-slate-50 border-slate-200 opacity-80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 truncate">Referral Points Card</h6>
                    <span className="text-[10px] text-slate-500">+100 PTS Invitations</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableReferralCard', 'Referral Rewards', 'Referral Rewards')}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    settings?.enableReferralCard !== false ? 'bg-pink-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings?.enableReferralCard !== false ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                <span className={settings?.enableReferralCard !== false ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings?.enableReferralCard !== false ? 'Visible' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableReferralCard', 'Referral Rewards', 'Referral Rewards')}
                  className="font-bold text-pink-600 hover:underline cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>

            {/* Widget 10: Leaderboards Hub Promo Card */}
            <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
              settings?.enableLeaderboardsCard !== false ? 'bg-white border-amber-200' : 'bg-slate-50 border-slate-200 opacity-80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 truncate">Leaderboards Promo</h6>
                    <span className="text-[10px] text-slate-500">Podium & Rankings</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableLeaderboardsCard', 'Leaderboards Promo', 'Leaderboards Promo')}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    settings?.enableLeaderboardsCard !== false ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings?.enableLeaderboardsCard !== false ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                <span className={settings?.enableLeaderboardsCard !== false ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings?.enableLeaderboardsCard !== false ? 'Visible' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableLeaderboardsCard', 'Leaderboards Promo', 'Leaderboards Promo')}
                  className="font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>

            {/* Widget 11: Student Achievements & Badges */}
            <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
              settings?.enableAchievementsCard !== false ? 'bg-white border-indigo-200' : 'bg-slate-50 border-slate-200 opacity-80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎖️</span>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 truncate">Student Achievements</h6>
                    <span className="text-[10px] text-slate-500">Medals & Badges Deck</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableAchievementsCard', 'Achievements Deck', 'Achievements Deck')}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    settings?.enableAchievementsCard !== false ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings?.enableAchievementsCard !== false ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                <span className={settings?.enableAchievementsCard !== false ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings?.enableAchievementsCard !== false ? 'Visible' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableAchievementsCard', 'Achievements Deck', 'Achievements Deck')}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>

            {/* Widget 12: Next Contest Countdown Timer */}
            <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
              settings?.enableNextCompetitionCountdown !== false ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-200 opacity-80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 truncate">Contest Countdown</h6>
                    <span className="text-[10px] text-slate-500">Live Timer Clock</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableNextCompetitionCountdown', 'Contest Countdown', 'Contest Countdown')}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    settings?.enableNextCompetitionCountdown !== false ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings?.enableNextCompetitionCountdown !== false ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                <span className={settings?.enableNextCompetitionCountdown !== false ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings?.enableNextCompetitionCountdown !== false ? 'Visible' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableNextCompetitionCountdown', 'Contest Countdown', 'Contest Countdown')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>

            {/* Widget 13: Instant Toast Notification Status Deck */}
            <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
              settings?.enableToastPreviewDeck !== false ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200 opacity-80'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔔</span>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 truncate">Toast System Deck</h6>
                    <span className="text-[10px] text-slate-500">Instant Alert Previews</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableToastPreviewDeck', 'Toast System Deck', 'Toast System Deck')}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    settings?.enableToastPreviewDeck !== false ? 'bg-slate-800' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings?.enableToastPreviewDeck !== false ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                <span className={settings?.enableToastPreviewDeck !== false ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {settings?.enableToastPreviewDeck !== false ? 'Visible' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('enableToastPreviewDeck', 'Toast System Deck', 'Toast System Deck')}
                  className="font-bold text-slate-700 hover:underline cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-super-admins"
          title={t('statAcademicAdmins')}
          value={admins.length}
          subtitle={`${admins.filter((a) => a.status === 'active').length} ${t('statActiveAccreditations')}`}
          icon={Users}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-700"
        />
        <StatCard
          id="stat-super-students"
          title={t('statRegisteredStudents')}
          value={students.length}
          subtitle={t('statEnrolledInstitutions')}
          icon={GraduationCap}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-700"
        />
        <StatCard
          id="stat-super-competitions"
          title={t('statTotalCompetitions')}
          value={competitions.length}
          subtitle={`${activeCompetitions.length} ${t('statActiveUpcoming')}`}
          icon={Trophy}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-700"
        />
        <StatCard
          id="stat-super-results"
          title={t('statOfficialResults')}
          value={results.length}
          subtitle={`${publishedResults.length} ${t('statApprovedPublished')}`}
          icon={FileCheck}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-700"
        />
      </div>

      {/* Main Grid: Active Competitions & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Competition Oversight Summary */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Active & Upcoming Competition Cycle
              </h2>
              <p className="text-xs text-slate-500">
                Live oversight of national olympiads and challenges
              </p>
            </div>
            <button
              onClick={() => onNavigate('Competition Management')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {competitions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No competitions available. Create a competition to begin.
              </div>
            ) : (
              competitions.slice(0, 4).map((comp) => {
                return (
                  <div
                    key={comp.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {comp.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({comp.code})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {comp.competitionType || 'Competition'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>{comp.category}</span>
                        <span>•</span>
                        <span>{comp.enrolledCount} Enrolled Candidates</span>
                        <span>•</span>
                        <span>{comp.duration || 60} Mins</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('Competition Management')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-md transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Audit Trail & Production Architecture */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  {language === 'ta' ? 'நிர்வாக தணிக்கை பதிவு' : 'Governance Audit Trail'}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No audit logs recorded yet.
                </div>
              ) : (
                auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {log.actorName}
                      </span>
                      <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.action}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {log.target}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigate('Audit Trail')}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {language === 'ta'
                  ? 'முழு தணிக்கை விவரங்கள் & PDF அறிக்கை →'
                  : 'Total Audit Details & Compliance Dossier (PDF) →'}
              </span>
            </button>
          </div>

          {/* Institutional Governance Card */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4.5 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
              <Database className="w-4 h-4 text-blue-700" />
              <span>Production Architecture Active</span>
            </div>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              Standardized RBAC boundaries with Firebase Firestore persistence and real-time synchronisation.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Super Admin Institutional Governance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Competition / Quiz / Exam / Question Studio Modal */}
      {isEditorOpen && (
        <CompetitionEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingComp(null);
          }}
          initialCompetition={editingComp}
          initialType={editorType}
          initialTab={editorTab}
          onSave={handleSave}
        />
      )}

      {/* Super Admin Spinning Wheel Governance & Options Modal */}
      <SpinWheelGovernanceModal
        isOpen={isSpinModalOpen}
        onClose={() => setIsSpinModalOpen(false)}
      />
    </div>
  );
};
