import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PlatformSettings } from '../../types';
import {
  Sliders,
  Shield,
  ShieldCheck,
  Gamepad2,
  Calendar,
  Sparkles,
  HardDrive,
  Gift,
  Trophy,
  Award,
  Clock,
  Bell,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Layout,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Eye,
  Settings,
  HelpCircle,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Sparkle,
} from 'lucide-react';
import { SpinWheelGovernanceModal } from './SpinWheelGovernanceModal';

interface PlatformMasterControlsViewProps {
  onNavigate?: (tab: any) => void;
}

export const PlatformMasterControlsView: React.FC<PlatformMasterControlsViewProps> = ({ onNavigate }) => {
  const { settings, updateSettings, language, superAdminUser, competitions } = useApp();
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'games' | 'academic' | 'rewards' | 'alerts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditedGrade, setAuditedGrade] = useState<'Grade 02' | 'Grade 05' | 'Grade 10' | 'Grade 12'>('Grade 02');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleToggleModule = async (key: keyof PlatformSettings, labelTa: string, labelEn: string) => {
    const currentState = (settings as any)?.[key] !== false;
    const nextState = !currentState;
    await updateSettings({ [key]: nextState });
    triggerToast(
      nextState
        ? (language === 'ta' ? `✓ ${labelTa} உலகம் முழுவதும் இயக்கப்பட்டது (ON)` : `✓ ${labelEn} globally activated across all grades (ON)`)
        : (language === 'ta' ? `⏸️ ${labelTa} உலகம் முழுவதும் முடக்கப்பட்டது (OFF)` : `⏸️ ${labelEn} globally muted across all grades (OFF)`)
    );
  };

  const handleApplyPreset = async (preset: 'minimal' | 'full' | 'lockdown') => {
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
        enableDeadlineAlerts: true,
        enableNextCompetitionCountdown: true,
      });
      triggerToast(
        language === 'ta'
          ? '🎯 சுத்த முகப்பு (Clean Minimal Mode) அனைத்து தரங்களுக்கும் செயல்படுத்தப்பட்டது!'
          : '🎯 Clean Minimal Mode enforced globally across all grades!'
      );
    } else if (preset === 'full') {
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
      triggerToast(
        language === 'ta'
          ? '🌟 முழு ஊடாடும் முகப்பு (Full Interactive Suite) அனைத்து தரங்களுக்கும் இயக்கப்பட்டது!'
          : '🌟 Full Interactive Suite globally activated across all grades!'
      );
    } else if (preset === 'lockdown') {
      await updateSettings({
        enableStudyGamesCard: false,
        enableDailySpinWheel: false,
        enableAiTimetableCard: false,
        enableSmartDailyTips: false,
        enableOfflineMaterialsCard: true, // Keep study downloads
        enableReferralCard: false,
        enableEduArenaCard: false,
        enableLeaderboardsCard: false,
        enableAchievementsCard: false,
        enableToastPreviewDeck: false,
        enableSubjectAlerts: true, // Keep official test alerts
        enableDeadlineAlerts: true, // Keep deadlines
        enableNextCompetitionCountdown: true, // Keep countdown
      });
      triggerToast(
        language === 'ta'
          ? '🛡️ ஒலிம்பியாட் தேர்வு ஊரடங்கு முறை (Exam Lockdown Mode) இயக்கப்பட்டது!'
          : '🛡️ Olympiad Examination Lockdown Mode active! Distraction-free exam state enforced.'
      );
    }
  };

  // Modules metadata definition
  const MODULES: {
    key: keyof PlatformSettings;
    title: string;
    titleTa: string;
    category: 'games' | 'academic' | 'rewards' | 'alerts';
    icon: string;
    badge: string;
    description: string;
    descriptionTa: string;
    impact: string;
    impactTa: string;
    gradeScope: string;
  }[] = [
    {
      key: 'enableStudyGamesCard',
      title: 'Daily Study Games & Focus Lounge (4-in-1)',
      titleTa: 'தினசரி கல்வி கேம்கள் & ஃபோகஸ் லவுஞ்ச் (4-in-1)',
      category: 'games',
      icon: '🎮',
      badge: '4-in-1 Suite',
      description: 'Daily lucky spin, 60s brain challenge, speed math rush & Lo-Fi Pomodoro study cam.',
      descriptionTa: 'அதிர்ஷ்ட ஸ்பின், 60 வினாடி மூளை சவால், வேகக் கணிதம் மற்றும் லோ-ஃபை போமோடோரோ கேம்கள்.',
      impact: 'Renders the top gaming lounge card on student dashboards across all enrolled grades.',
      impactTa: 'அனைத்து தர மாணவர் முகப்பிலும் ஊடாடும் கேமிங் தொகுதியை காட்டுகிறது.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableDailySpinWheel',
      title: 'Daily Lucky Spin Wheel',
      titleTa: 'தினசரி அதிர்ஷ்ட சக்கரம் (Lucky Spin Wheel)',
      category: 'games',
      icon: '🎡',
      badge: '5 - 50 PTS',
      description: 'Gamified 24h spin wheel rewarding student attendance with 5 to 50 reward points.',
      descriptionTa: 'மாணவர்களுக்கு 24 மணி நேரத்திற்கு ஒரு முறை 5 முதல் 50 புள்ளிகள் வரை வழங்கும் சக்கரம்.',
      impact: 'Enables instant prize spins and daily login retention incentives.',
      impactTa: 'தினசரி வருகை மற்றும் ஈடுபாட்டை ஊக்குவிக்கும் ஸ்பின் பொறிமுறை.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableEduArenaCard',
      title: 'HNC Edu-Arena: 25 Districts Island Quest',
      titleTa: 'HNC எடு-அரீனா: 25 மாவட்டங்கள் தீவு தேடல்',
      category: 'games',
      icon: '🎯',
      badge: '25 Districts',
      description: 'Gamified island quest quiz map progressing through all 25 administrative districts of Sri Lanka.',
      descriptionTa: 'இலங்கையின் 25 மாவட்டங்களையும் உள்ளடக்கிய வரைபட வினாடி வினா கேமிஃபிகேஷன்.',
      impact: 'Renders the Island Quest hero promotional card on student dashboard.',
      impactTa: 'மாவட்ட அளவிலான கல்விப் பயண அட்டை மாணவர் திரையில் தோன்றும்.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableAiTimetableCard',
      title: 'Gemini 3.8 Flash AI Study Timetable',
      titleTa: 'Gemini 3.8 Flash AI படிப்பு அட்டவணை',
      category: 'academic',
      icon: '📅',
      badge: 'Gemini AI',
      description: 'Personalized 7-day revision schedule intelligently targeted for weak subjects and upcoming contests.',
      descriptionTa: 'பலவீனமான பாடங்கள் மற்றும் வரவிருக்கும் போட்டிகளுக்கான தனிப்பயனாக்கப்பட்ட AI அட்டவணை.',
      impact: 'Provides automatic AI study timetable generation and checklist tasks.',
      impactTa: 'மாணவர் பலவீனமான பாடங்களை AI மூலம் கண்டறிந்து அட்டவணை அமைக்கிறது.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableSmartDailyTips',
      title: 'Smart Daily Tips & Exam Tricks',
      titleTa: 'ஸ்மார்ட் தினசரி டிப்ஸ் & தேர்வு தந்திரங்கள்',
      category: 'academic',
      icon: '💡',
      badge: 'AI Coach',
      description: 'Daily rotating study motivation, memory retention tricks, and Sri Lankan exam mastery advice.',
      descriptionTa: 'நினைவாற்றல் குறிப்புகள், பரீட்சை அணுகுமுறைகள் மற்றும் கல்வி ஊக்கமளிக்கும் டிப்ஸ்.',
      impact: 'Displays the daily bite-sized learning card directly under student welcome banner.',
      impactTa: 'முகப்பில் தினசரி சிறிய பயனுள்ள கல்வி குறிப்பை நேரடியாகக் காட்டும்.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableOfflineMaterialsCard',
      title: 'Offline Study Materials & Downloads Hub',
      titleTa: 'ஆஃப்லைன் பாடக் குறிப்புகள் & பதிவிறக்க மையம்',
      category: 'academic',
      icon: '📦',
      badge: 'Service Worker',
      description: 'Service Worker CacheStorage engine enabling students to download and study notes offline with 0 internet.',
      descriptionTa: 'இணையம் இல்லாத போதும் படிக்க சேவைப் பணியாளர் கேச் மூலம் பதிவிறக்கம் செய்யும் வசதி.',
      impact: 'Renders the Offline Study Materials Hub and syncs with the Header Offline Mode indicator.',
      impactTa: 'ஆஃப்லைன் பாடக்குறிப்புகள் மையம் மற்றும் ஹெடர் இண்டிகேட்டருடன் ஒத்திசைகிறது.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableReferralCard',
      title: 'Referral Rewards & Share Points Card',
      titleTa: 'பகிர்ந்து புள்ளி பெறும் அட்டை (Referral Points)',
      category: 'rewards',
      icon: '🎁',
      badge: '+100 PTS',
      description: 'Peer-to-peer invitation system giving +100 PTS when classmates register using student invite link.',
      descriptionTa: 'நண்பர்களை இணைப்பதன் மூலம் தலா 100 புள்ளிகள் பெறும் பகிர்வு அட்டை.',
      impact: 'Renders the vibrant viral growth & share banner on student home feed.',
      impactTa: 'மாணவர் முகப்பில் நண்பர்களை அழைக்கும் விளம்பர அட்டையைக் காட்டும்.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableLeaderboardsCard',
      title: 'All Leaderboards Hub Promo Card',
      titleTa: 'அனைத்து தரவரிசைகள் விளம்பர அட்டை',
      category: 'rewards',
      icon: '🏆',
      badge: 'Podium',
      description: 'National and district-level champions podium with gold, silver, and bronze medalists preview.',
      descriptionTa: 'தேசிய மற்றும் மாவட்ட அளவிலான முதன்மை வெற்றியாளர்களின் தரவரிசை முன்னோட்டம்.',
      impact: 'Links students directly to live olympiad rankings and competitive standing.',
      impactTa: 'நேரலை தரவரிசை மற்றும் சாம்பியன்ஸ் மேடைக்கு நேரடி இணைப்பை வழங்கும்.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableAchievementsCard',
      title: 'Student Achievements, Badges & Medals Deck',
      titleTa: 'மாணவர் சாதனைப் பதக்கங்கள் பலகை',
      category: 'rewards',
      icon: '🎖️',
      badge: 'Badges',
      description: 'Gamified credential badges tracking competition finishes, speed challenges, and perfectionist scores.',
      descriptionTa: 'போட்டி நிறைவு, வேக சவால்கள் மற்றும் இலக்குகளைக் குறிக்கும் டிஜிட்டல் பதக்கங்கள்.',
      impact: 'Displays locked and unlocked achievement badges on student overview.',
      impactTa: 'மாணவர்கள் அடைந்த சாதனைகளை பேட்ஜ்களாக முகப்பில் காட்டும்.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableNextCompetitionCountdown',
      title: 'Next Enrolled Competition Countdown Timer',
      titleTa: 'அடுத்த போட்டி நேரலை கவுண்ட்டவுன் டைமர்',
      category: 'alerts',
      icon: '⏳',
      badge: 'Live Clock',
      description: 'Live ticking countdown timer showing hours, minutes, and seconds until enrolled test goes live.',
      descriptionTa: 'பதிவு செய்த அடுத்த போட்டி தொடங்குவதற்கு மீதமுள்ள நேரத்தைக் காட்டும் கடிகாரம்.',
      impact: 'Helps students prepare and arrive on time for scheduled live competitions.',
      impactTa: 'மாணவர்கள் போட்டித் தொடக்க நேரத்தைத் தவறவிடாமல் தயாராக உதவுகிறது.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableToastPreviewDeck',
      title: 'Instant Toast Notification Status System',
      titleTa: 'உடனடி டோஸ்ட் அறிவிப்பு முன்னோட்ட பலகை',
      category: 'alerts',
      icon: '🔔',
      badge: 'Audio Chime',
      description: 'Informs students instantly with audio chime when new competitions are published or results graded.',
      descriptionTa: 'புதிய போட்டி அல்லது முடிவுகள் வெளியிடப்படும் போது ஒலி மற்றும் காட்சி சமிக்ஞை.',
      impact: 'Renders the live notification test bench and audio status preview.',
      impactTa: 'நிகழ்நேர அறிவிப்பு மற்றும் ஒலி நிலவரத்தை மாணவர் திரையில் அமைக்கிறது.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableSubjectAlerts',
      title: 'Subject Publication Alerts Banner',
      titleTa: 'பாட அறிவிப்புகள் பேனர் (Subject Alerts)',
      category: 'alerts',
      icon: '🌐',
      badge: 'Push & Audio',
      description: 'Subject-specific browser push notifications, sound test, and enrolled subject publication tracker.',
      descriptionTa: 'பாட வாரியான பிரவுசர் புஷ் அறிவிப்புகள், ஒலி சோதனை மற்றும் பாட அமைப்புகள்.',
      impact: 'Controls English, Science, Mathematics push alerts banner on student dashboard.',
      impactTa: 'பாட வாரியான புஷ் மற்றும் ஒலி எச்சரிக்கை பேனரைக் கட்டுப்படுத்துகிறது.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
    {
      key: 'enableDeadlineAlerts',
      title: 'Critical Deadlines Status & Push Banner',
      titleTa: 'கெடுநிலை நிலவரம் & புஷ் அறிவிப்பு பேனர்',
      category: 'alerts',
      icon: '⏰',
      badge: 'Urgent',
      description: 'Alerts students of impending registration deadlines with red pulse indicators and push alerts button.',
      descriptionTa: 'போட்டிப் பதிவு காலக்கெடு எச்சரிக்கை மற்றும் புஷ் பொத்தான் பேனர்.',
      impact: 'Displays urgency banners when competition registration is closing soon.',
      impactTa: 'கெடுநிலை எச்சரிக்கைகளை முகப்பில் முக்கிய இடத்தில் காட்டும்.',
      gradeScope: 'Grades 01 - 13 (Universal)',
    },
  ];

  const activeModulesCount = MODULES.filter(
    (m) => (settings as any)?.[m.key] !== false
  ).length;

  const filteredModules = MODULES.filter((m) => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesQuery =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.titleTa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{successToast}</span>
        </div>
      )}

      {/* Top Header & Policy Governance Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-lg border border-indigo-800/60 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                  <span>Central Platform Governance</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Sync Active</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10">
                  freedomedupu@gmail.com
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Sliders className="w-6 h-6 text-amber-400" />
                <span>
                  {language === 'ta'
                    ? 'தள முதன்மைக் கட்டுப்பாடுகள் (Platform Master Controls)'
                    : 'Platform Master Controls & Module Governance'}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {language === 'ta'
                  ? 'அனைத்து வகுப்புகளுக்கும் (Grades 01 - 13) ஒரே சீரான, நேர்த்தியான அனுபவத்தை உறுதிசெய்ய இரண்டாம் நிலை விட்ஜெட்டுகள், கேம்கள் மற்றும் விளம்பர அட்டைகளை உலகளாவிய ரீதியில் நிர்வகிக்கவும். இங்கே நீங்கள் செய்யும் மாற்றங்கள் அனைத்து மாணவர்களுக்கும் உடனுக்குடன் நடைமுறைப்படுத்தப்படும்.'
                  : 'Manage global availability of secondary platform modules, games, and promotional banners to guarantee a consistent, non-cluttered academic experience across all curriculum tiers.'}
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-amber-300">
                  {activeModulesCount} / {MODULES.length}
                </div>
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  {language === 'ta' ? 'செயலில் உள்ள தொகுதிகள்' : 'Active Modules'}
                </div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center px-2">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">100%</div>
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  {language === 'ta' ? 'சீரான கொள்கை' : 'Grade Uniform'}
                </div>
              </div>
            </div>
          </div>

          {/* Master 1-Click Policy Presets */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{language === 'ta' ? 'முக்கிய முன்னமைப்புகள்:' : 'Global Presets:'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="pmc-preset-minimal"
                onClick={() => handleApplyPreset('minimal')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Enforce clean, decluttered dashboard with only core academic competitions"
              >
                <span>🎯</span>
                <span>{language === 'ta' ? 'சுத்த முகப்பு (Clean Mode)' : 'Clean Minimal Mode'}</span>
              </button>

              <button
                type="button"
                id="pmc-preset-full"
                onClick={() => handleApplyPreset('full')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Activate all secondary modules and gamification across all grades"
              >
                <span>🌟</span>
                <span>{language === 'ta' ? 'முழு ஊடாடும் முறை (Full Suite)' : 'Full Interactive Suite'}</span>
              </button>

              <button
                type="button"
                id="pmc-preset-lockdown"
                onClick={() => handleApplyPreset('lockdown')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Mute all distractions during official examination windows"
              >
                <span>🛡️</span>
                <span>{language === 'ta' ? 'தேர்வு ஊரடங்கு முறை (Exam Lockdown)' : 'Exam Lockdown Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grade-Level Consistency Auditor Strip */}
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {language === 'ta'
                  ? 'வகுப்பு நிலை சீரமைப்பு சோதனை (Grade-Level Consistency Auditor)'
                  : 'Grade-Level Consistency Auditor & Live Simulator'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'ta'
                ? 'தரம் 01 முதல் 13 வரை உள்ள மாணவர்கள் அனைவருக்குமே மேற்படி விட்ஜெட் அமைப்புகள் ஒரே சீராகப் பொருந்துகின்றன என்பதைச் சரிபார்க்கவும்.'
                : 'Inspect how the current master module availability reflects uniformly across different curriculum tiers.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
            {(['Grade 02', 'Grade 05', 'Grade 10', 'Grade 12'] as const).map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setAuditedGrade(grade)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  auditedGrade === grade
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Status Pill */}
        <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-indigo-950">
              {language === 'ta'
                ? `${auditedGrade} மாணவருக்கு தற்போது ${activeModulesCount} இரண்டாம் நிலை தொகுதிகள் இயக்கத்தில் உள்ளன.`
                : `Audited Student (${auditedGrade}): ${activeModulesCount} secondary modules active with zero conflicting overrides.`}
            </span>
          </div>

          <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
            Curriculum Path Unified ✓
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'ta' ? 'அனைத்தும் (All)' : 'All Modules'} ({MODULES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('games')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeCategory === 'games'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎮 {language === 'ta' ? 'கல்வி கேம்கள்' : 'Study Games'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('academic')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeCategory === 'academic'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📚 {language === 'ta' ? 'AI & பாடக் கருவிகள்' : 'AI & Study Tools'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('rewards')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeCategory === 'rewards'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎁 {language === 'ta' ? 'பரிசுகள் & தரவரிசை' : 'Rewards & Social'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('alerts')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeCategory === 'alerts'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📢 {language === 'ta' ? 'எச்சரிக்கைகள் & புஷ்' : 'Alerts & Push'}
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ta' ? 'தொகுதியைத் தேடுக...' : 'Search module...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Modules Governance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((mod) => {
          const isActive = (settings as any)?.[mod.key] !== false;

          return (
            <div
              key={mod.key}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                isActive
                  ? 'bg-white border-blue-200 shadow-xs hover:border-blue-400'
                  : 'bg-slate-50 border-slate-200 opacity-90'
              }`}
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isActive ? 'bg-blue-50 border border-blue-200' : 'bg-slate-200 border border-slate-300'
                      }`}
                    >
                      {mod.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                          {language === 'ta' ? mod.titleTa : mod.title}
                        </h4>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {mod.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
                        {mod.gradeScope}
                      </span>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleModule(mod.key, mod.titleTa, mod.title)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                      isActive ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                    aria-label={`Toggle ${mod.title}`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'ta' ? mod.descriptionTa : mod.description}
                </p>

                {/* Impact Statement */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1">
                  <span className="font-bold text-slate-700 block">
                    {language === 'ta' ? 'தாக்கம் (Student Impact):' : 'Student Impact:'}
                  </span>
                  <span>{language === 'ta' ? mod.impactTa : mod.impact}</span>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {isActive
                    ? language === 'ta'
                      ? 'இயங்குகிறது (Active - ON)'
                      : 'Active (ON)'
                    : language === 'ta'
                    ? 'முடக்கப்பட்டது (Muted - OFF)'
                    : 'Muted (OFF)'}
                </span>

                <div className="flex items-center gap-1.5">
                  {mod.key === 'enableDailySpinWheel' && (
                    <button
                      type="button"
                      onClick={() => setIsSpinModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-3 h-3 text-amber-700" />
                      <span>{language === 'ta' ? 'விதிகள்' : 'Spin Rules'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleModule(mod.key, mod.titleTa, mod.title)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition shadow-2xs ${
                      isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isActive ? 'Turn OFF' : 'Turn ON'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spinning Wheel Configuration Modal */}
      {isSpinModalOpen && (
        <SpinWheelGovernanceModal
          isOpen={isSpinModalOpen}
          onClose={() => setIsSpinModalOpen(false)}
        />
      )}
    </div>
  );
};
