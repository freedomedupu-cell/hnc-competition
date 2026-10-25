import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition, DbAttempt } from '../../types';
import { getCompetitionScheduleStatus, parseDateTime } from '../../utils/competitionTimeUtils';
import {
  Trophy,
  Calendar,
  Clock,
  ChevronRight,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  CheckSquare,
  Sparkles,
  Target,
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  Lock,
  Gift,
  Share2,
  Coins,
  MessageCircle,
  Copy,
  Check,
  Shield,
  Phone,
  Mail,
  ExternalLink,
  Gamepad2,
  Flame,
  Zap,
  Headphones,
  Coffee,
} from 'lucide-react';
import {
  Math3DIcon,
  Science3DIcon,
  English3DIcon,
  Environment3DIcon,
  HeroGraphicComposition,
  CelebratingStudentGraphic,
} from './StudentIllustrations';
import { CompetitionDetailsModal } from './CompetitionDetailsModal';
import { CompetitionInstructionsModal } from './CompetitionInstructionsModal';
import { isGradeEligible } from '../../lib/gradeUtils';
import { SubmissionConfirmationView } from './SubmissionConfirmationView';
import { CompetitionPaymentModal } from './CompetitionPaymentModal';
import { StudentAchievements } from './StudentAchievements';
import { ExamCameraVerificationModal } from './ExamCameraVerificationModal';
import { StudentMembershipModal } from './StudentMembershipModal';
import { DynamicAdBillboard } from '../common/DynamicAdBillboard';
import { AnimatedHeroLeaderboard } from '../leaderboard/AnimatedHeroLeaderboard';
import { SmartDailyTips } from './SmartDailyTips';
import { StudentDeadlineAlertsBanner } from './StudentDeadlineAlertsBanner';
import { SubjectPublicationAlertBanner } from './SubjectPublicationAlertBanner';
import { PreExam15MinAlertBanner } from './PreExam15MinAlertBanner';
import { WhatsappSmsAlertModal } from './WhatsappSmsAlertModal';
import { EnrolledSubjectsModal } from './EnrolledSubjectsModal';
import { identifyWeakSubjectsFromResults } from '../../services/studyTimetableService';
import { NextEnrolledCompetitionCountdown } from './NextEnrolledCompetitionCountdown';
import { OfflineStudyMaterialsHub } from './OfflineStudyMaterialsHub';

interface StudentDashboardViewProps {
  onNavigate: (tab: any) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigate }) => {
  const {
    currentStudent,
    currentAuthUser,
    competitions,
    results,
    isStudentRegistered,
    hasStudentSubmitted,
    getStudentAttempt,
    startActiveExam,
    isCompetitionPaid,
    isExamVerified,
    setStudentNav,
    saveCompetition,
    registerStudentForCompetition,
    awardSharePoints,
    isMembershipActiveForStudent,
    membershipSettings,
    studentCurriculumPath,
    language,
    t,
  } = useApp();

  // Active question-format filter from the 4 colorful top cards
  const [selectedFormat, setSelectedFormat] = useState<
    'all' | 'Quiz ( MCQ )' | 'True / False' | 'Short Answer' | 'Picture Questions'
  >('all');

  // Modals state
  const [detailsComp, setDetailsComp] = useState<Competition | null>(null);
  const [instructionComp, setInstructionComp] = useState<Competition | null>(null);
  const [paymentComp, setPaymentComp] = useState<Competition | null>(null);
  const [verificationComp, setVerificationComp] = useState<Competition | null>(null);
  const [membershipPromptComp, setMembershipPromptComp] = useState<Competition | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState<boolean>(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState<boolean>(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState<boolean>(false);
  const [viewingReceipt, setViewingReceipt] = useState<{
    attempt: DbAttempt;
    competition: Competition;
  } | null>(null);

  // Referral state
  const [copiedRef, setCopiedRef] = useState(false);
  const [refToast, setRefToast] = useState<string | null>(null);

  // Student's academic grade level (e.g. Grade 11 (O/L), Grade 6, etc.)
  const studentGrade = currentStudent?.gradeLevel || currentAuthUser?.grade || 'Grade 6';

  // Live points update listener for instant synchronization
  const [livePoints, setLivePoints] = useState<number>(() => {
    return (
      currentStudent?.referralPoints ??
      currentAuthUser?.referralPoints ??
      (typeof window !== 'undefined'
        ? parseInt(
            localStorage.getItem(`hnc_student_points_${currentAuthUser?.uid}`) ||
            localStorage.getItem('hnc_student_points_active') ||
            '0',
            10
          )
        : 0)
    );
  });

  useEffect(() => {
    const handlePointsUpdate = (e: any) => {
      if (e?.detail?.points !== undefined) {
        setLivePoints(e.detail.points);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('hnc_points_updated', handlePointsUpdate);
      return () => window.removeEventListener('hnc_points_updated', handlePointsUpdate);
    }
  }, []);

  useEffect(() => {
    const pts = currentStudent?.referralPoints ?? currentAuthUser?.referralPoints;
    if (pts !== undefined && pts !== null) {
      setLivePoints(pts);
    }
  }, [currentStudent?.referralPoints, currentAuthUser?.referralPoints]);

  // Check if daily spin is already claimed today across all persistent layers
  const localToday = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const isSpinClaimedToday = Boolean(
    (currentAuthUser?.lastSpinDate && (currentAuthUser.lastSpinDate === localToday || currentAuthUser.lastSpinDate.startsWith(localToday))) ||
    (currentStudent?.lastSpinDate && (currentStudent.lastSpinDate === localToday || currentStudent.lastSpinDate.startsWith(localToday))) ||
    (typeof window !== 'undefined' &&
      (localStorage.getItem(`hnc_spin_date_${currentAuthUser?.uid}`) === localToday ||
       localStorage.getItem(`hnc_spin_date_${currentStudent?.id}`) === localToday ||
       localStorage.getItem(`hnc_spin_date_${currentAuthUser?.studentId}`) === localToday ||
       localStorage.getItem('hnc_spin_date_last') === localToday ||
       (() => {
         const ts = localStorage.getItem('hnc_spin_last_timestamp');
         if (!ts) return false;
         const d = new Date(parseInt(ts, 10));
         const now = new Date();
         return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
       })()))
  );

  // Filter only real active/published competitions from Firestore
  // STRICT GRADE FILTER:
  // "குறிப்பிட்ட மாணவருடைய தரங்களுக்கு மட்டுமே அவரவர் டாஸ் போர்டுல பரீட்சைகள் டிஸ்ப்ளே ஆக வேண்டும் ஓபன் அண்ட் கொடுத்தா மட்டும் தான் எல்லா மாணவர்களும் டிஸ்ப்ளே ஆகணும்"
  const visibleCompetitions = competitions.filter((comp) => {
    if (!comp) return false;
    const s = (comp.status || '').toLowerCase().trim();
    if (s.includes('draft') || s === 'closed' || s === 'inactive' || s === 'unpublished') {
      return false;
    }

    // Matches student's enrolled grade OR competition is marked as Open (All Grades)
    return isGradeEligible(comp.grade, studentGrade);
  });

  const studentResults = React.useMemo(() => {
    const sId = currentAuthUser?.uid || currentStudent?.id;
    const sName = currentAuthUser?.fullName || currentStudent?.name;
    return results.filter(
      (r) =>
        r.studentId === sId ||
        r.studentId === currentStudent?.id ||
        r.studentName === sName ||
        r.studentName === currentStudent?.name
    );
  }, [results, currentAuthUser, currentStudent]);

  const { weakSubjects } = React.useMemo(() => {
    return identifyWeakSubjectsFromResults(studentResults, competitions);
  }, [studentResults, competitions]);

  const combinedCompetitions = visibleCompetitions.map((c) => {
    let iconComp: React.ReactNode = <Math3DIcon />;
    let badgeClass = 'bg-blue-50 text-blue-700 border border-blue-200/60';
    let pillClass = 'bg-[#FDF2F8] text-[#BE185D] border border-rose-200/80';
    const cat = (c.category || '').toLowerCase();

    if (cat.includes('sci')) {
      iconComp = <Science3DIcon />;
      badgeClass = 'bg-cyan-50 text-cyan-700 border border-cyan-200/60';
      pillClass = 'bg-[#EBF5FF] text-[#1E40AF] border border-blue-200/80';
    } else if (cat.includes('eng')) {
      iconComp = <English3DIcon />;
      badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200/60';
      pillClass = 'bg-[#FFF4E5] text-[#D97706] border border-amber-200/80';
    } else if (cat.includes('env')) {
      iconComp = <Environment3DIcon />;
      badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
      pillClass = 'bg-[#ECFDF5] text-[#047857] border border-emerald-200/80';
    } else if (cat.includes('logic') || cat.includes('iq')) {
      badgeClass = 'bg-purple-50 text-purple-700 border border-purple-200/60';
      pillClass = 'bg-[#F5EEFD] text-[#6B21A8] border border-purple-200/80';
    }

    let formatType: 'Quiz ( MCQ )' | 'True / False' | 'Short Answer' | 'Picture Questions' = 'Quiz ( MCQ )';
    if (c.competitionType === 'Exam') {
      formatType = 'Short Answer';
    } else if (c.category?.toLowerCase().includes('picture') || c.category?.toLowerCase().includes('visual')) {
      formatType = 'Picture Questions';
    } else if (c.category?.toLowerCase().includes('true') || c.category?.toLowerCase().includes('concept')) {
      formatType = 'True / False';
    }

    const isRegistered = isStudentRegistered(c.id);
    const hasSubmitted = hasStudentSubmitted(c.id);
    const sched = getCompetitionScheduleStatus(c);

    let deadlineBadge: {
      text: string;
      level: 'critical' | 'urgent' | 'warning' | 'normal';
      classes: string;
    } | null = null;

    if (!hasSubmitted) {
      const nowMs = Date.now();
      const regDateStr = c.registrationEnd || c.registrationDeadline;
      if (regDateStr && !isRegistered) {
        const regEnd = parseDateTime(regDateStr, '23:59', 'end');
        if (regEnd) {
          const diffMs = regEnd.getTime() - nowMs;
          if (diffMs > 0 && diffMs <= 24 * 3600 * 1000) {
            deadlineBadge = {
              text: language === 'ta' ? '🔥 பதிவு இன்று நிறைவு!' : language === 'si' ? '🔥 ලියාපදිංචිය අද අවසන්' : '🔥 Reg. Closes Today!',
              level: 'critical',
              classes: 'bg-rose-600 text-white animate-pulse shadow-2xs',
            };
          } else if (diffMs > 0 && diffMs <= 48 * 3600 * 1000) {
            deadlineBadge = {
              text: language === 'ta' ? '⏳ பதிவு: நாளை முடிவு' : language === 'si' ? '⏳ ලියාපදිංචිය හෙට අවසන්' : '⏳ Reg. Ends Tomorrow',
              level: 'urgent',
              classes: 'bg-amber-500 text-slate-950 font-bold shadow-2xs',
            };
          }
        }
      }

      if (!deadlineBadge && sched.isLive && sched.endDateTime) {
        const diffMs = sched.endDateTime.getTime() - nowMs;
        if (diffMs > 0 && diffMs <= 24 * 3600 * 1000) {
          deadlineBadge = {
            text: language === 'ta' ? '🔥 தேர்வு இன்று நிறைவு!' : language === 'si' ? '🔥 විභාගය අද අවසන්' : '🔥 Exam Closes Today!',
            level: 'critical',
            classes: 'bg-rose-600 text-white animate-pulse shadow-2xs',
          };
        } else if (diffMs > 0 && diffMs <= 48 * 3600 * 1000) {
          deadlineBadge = {
            text: language === 'ta' ? '⏰ தேர்வு: 2 நாளில் நிறைவு' : language === 'si' ? '⏰ දින 2කින් අවසන්' : '⏰ Exam Ends in 2d',
            level: 'urgent',
            classes: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
          };
        }
      }
    }

    let countdownText = 'Active Contest';
    const targetEnd = sched.endDateTime;
    if (targetEnd) {
      const remainingSec = Math.max(0, Math.floor((targetEnd.getTime() - Date.now()) / 1000));
      if (remainingSec > 0) {
        const days = Math.floor(remainingSec / 86400);
        const hours = Math.floor((remainingSec % 86400) / 3600);
        const minutes = Math.floor((remainingSec % 3600) / 60);
        const pad = (n: number) => String(n).padStart(2, '0');
        countdownText = days > 0 ? `Ends in ${days}d ${pad(hours)}:${pad(minutes)}` : `Ends in ${pad(hours)}:${pad(minutes)}`;
      } else {
        countdownText = language === 'ta' ? 'முடிவடைந்தது' : 'Closed';
      }
    }

    return {
      id: c.id,
      title: c.title,
      categoryBadge: c.category || 'General',
      categoryBadgeClass: badgeClass,
      formatType,
      questionsCount: c.questionsCount || 10,
      durationMinutes: c.duration || 30,
      dateDisplay: c.startDate || c.competitionStart || 'Open Now',
      gradeRange: c.grade || 'All Grades',
      countdownText,
      countdownPillClass: pillClass,
      iconComponent: iconComp,
      fullCompetition: c,
      deadlineBadge,
    };
  });

  // Apply format filter
  const displayedCompetitions = combinedCompetitions.filter((c) => {
    if (selectedFormat === 'all') return true;
    return c.formatType === selectedFormat;
  });

  // Handle student clicking "Join Now →"
  const handleJoinCompetition = async (comp: Competition) => {
    // If student has already submitted, allow viewing receipt
    if (hasStudentSubmitted(comp.id)) {
      const prevAttempt = getStudentAttempt(comp.id);
      if (prevAttempt) {
        setViewingReceipt({ attempt: prevAttempt, competition: comp });
        return;
      }
    }

    // Check if competition start date/time is in the future
    const sched = getCompetitionScheduleStatus(comp);
    if (sched.isUpcoming) {
      setRefToast(
        language === 'ta'
          ? `⚠️ இந்த பரீட்சை இன்னும் தொடங்கவில்லை! ${sched.formattedStart} அன்று தான் தானாகவே திறக்கப்படும்.`
          : language === 'si'
          ? `⚠️ මෙම විභාගය තවම ආරම්භ වී නැත! ${sched.formattedStart} දින විවෘත වේ.`
          : `⚠️ Exam has not started yet! Opens automatically on ${sched.formattedStart}.`
      );
      setTimeout(() => setRefToast(null), 5000);
      return;
    }

    // Check membership eligibility if membership is required
    if (comp.membershipRequired && !isMembershipActiveForStudent()) {
      setMembershipPromptComp(comp);
      return;
    }

    // Check payment if paid competition
    const isPaid = comp.entryType === 'Paid' && comp.entryFee && comp.entryFee > 0;
    if (isPaid && !isCompetitionPaid(comp.id)) {
      setPaymentComp(comp);
      return;
    }

    // Auto-register if not yet registered
    if (!isStudentRegistered(comp.id)) {
      registerStudentForCompetition(comp.id);
    }

    // Open instructions modal first
    setInstructionComp(comp);
  };

  const handleStartFromInstructions = async () => {
    if (!instructionComp) return;
    const comp = instructionComp;
    setInstructionComp(null);

    // If camera photo verification is required (either explicit toggle or Exam default)
    const requiresCam = typeof comp.requireCameraVerification === 'boolean'
      ? comp.requireCameraVerification
      : comp.competitionType === 'Exam';

    if (requiresCam && !isExamVerified(comp.id)) {
      setVerificationComp(comp);
      return;
    }

    await startActiveExam(comp);
  };

  // If viewing previous submission receipt
  if (viewingReceipt) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewingReceipt(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition"
        >
          ← Back to Student Arena
        </button>
        <SubmissionConfirmationView
          attempt={viewingReceipt.attempt}
          competition={viewingReceipt.competition}
          onReturnToCompetitions={() => setViewingReceipt(null)}
          onViewResults={() => setStudentNav('My Results')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-10">
      {/* 0. DYNAMIC SUPER ADMIN OFFICIAL ADVERTISING BILLBOARD */}
      <DynamicAdBillboard />

      {/* TOP BAR கீழ், WELCOME CARD மேலேயும்: ANIMATED NATIONAL LEADERBOARD */}
      <AnimatedHeroLeaderboard onNavigate={onNavigate} />

      {/* 0.3 AUTOMATED WHATSAPP & SMS 15-MIN PRE-EXAM ALERT BANNER */}
      <PreExam15MinAlertBanner
        onJoinCompetition={handleJoinCompetition}
        onOpenWhatsappSettings={() => setShowWhatsappModal(true)}
      />

      {/* 0.4 ENROLLED SUBJECTS REAL-TIME PUBLICATION NOTIFICATIONS */}
      <SubjectPublicationAlertBanner
        onViewDetails={(comp) => setDetailsComp(comp)}
        onJoinCompetition={handleJoinCompetition}
        onOpenSubjectsModal={() => setShowSubjectsModal(true)}
      />

      {/* 0.5 URGENT COMPETITION DEADLINES & LOCAL PUSH NOTIFICATION SYSTEM */}
      <StudentDeadlineAlertsBanner
        onJoinCompetition={handleJoinCompetition}
        onViewDetails={(comp) => setDetailsComp(comp)}
      />

      {/* SRI LANKAN SINGLE CURRICULUM PATH SPECIFICATION BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-4 sm:p-5 text-white border border-indigo-700/60 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xl shadow-md shrink-0 border border-indigo-300/30">
              {studentCurriculumPath.icon}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                  {language === 'ta' ? 'ஒற்றைப் பாடத்திட்டப் பாதை' : language === 'si' ? 'තනි විෂය නිර්දේශ මාවත' : 'Single Curriculum Path Active'}
                </span>
                <span className="text-[11px] font-bold text-blue-200">
                  {studentCurriculumPath.stageBadgeTa}
                </span>
                <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded border border-white/15 text-emerald-300">
                  {studentCurriculumPath.mcqOptionCount} Options Strict
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                {studentCurriculumPath.titleTa}
              </h2>
              <p className="text-[11px] text-slate-300 leading-tight">
                {language === 'ta'
                  ? `பதிவு செய்யப்பட்ட வகுப்பு: ${studentGrade}. உங்கள் கல்வி நிலைக்குரிய வினாக்கள் மற்றும் போட்டிகள் மட்டுமே இங்கு காட்டப்படும்; பிற வகுப்புகள் தானாக மறைக்கப்பட்டுள்ளன.`
                  : `Enrolled Grade: ${studentGrade}. Only content aligned with your single curriculum path is displayed; irrelevant tiers are hidden.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <span>🏛️ {studentCurriculumPath.curriculumStandard.split('(')[0].trim()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 0.8 LIVE COUNTDOWN TIMER UNTIL NEXT ENROLLED COMPETITION */}
      <NextEnrolledCompetitionCountdown
        onJoinCompetition={handleJoinCompetition}
        onViewDetails={(comp) => setDetailsComp(comp)}
      />

      {/* 1. HERO BANNER: "Challenge Yourself and Win!" (COMPACT) */}
      <div
        id="student-hero-banner"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#183EA8] via-[#2152D4] to-[#1A3D9E] text-white p-3.5 sm:p-5 lg:p-6 shadow-md shadow-blue-900/10"
      >
        {/* Subtle glowing ambient circles */}
        <div className="absolute -top-6 -left-6 w-32 sm:w-48 h-32 sm:h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 -right-6 w-36 sm:w-56 h-36 sm:h-56 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left Hero Content */}
          <div className="flex-1 text-center md:text-left">
            {/* Small uppercase tag */}
            <span className="inline-block text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-blue-200 mb-0.5 sm:mb-1">
              {language === 'ta' ? 'போட்டிகள்' : language === 'si' ? 'තරඟාවලි' : 'COMPETITIONS'}
            </span>

            {/* Display Heading */}
            <h1 className="text-sm min-[360px]:text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight leading-tight sm:leading-snug">
              {language === 'ta' ? (
                <>
                  உங்களை நீங்களே சோதித்து <br className="hidden sm:inline" />
                  <span className="text-[#FFD233] italic font-serif text-base min-[360px]:text-lg sm:text-2xl lg:text-3xl font-black drop-shadow-[0_2px_6px_rgba(255,210,51,0.35)] inline-block transform -rotate-1">
                    வெற்றி பெறுங்கள்!
                  </span>
                </>
              ) : language === 'si' ? (
                <>
                  ඔබේ හැකියාවන් අභියෝගයට ලක් කර <br className="hidden sm:inline" />
                  <span className="text-[#FFD233] italic font-serif text-base min-[360px]:text-lg sm:text-2xl lg:text-3xl font-black drop-shadow-[0_2px_6px_rgba(255,210,51,0.35)] inline-block transform -rotate-1">
                    ජයග්‍රහණය කරන්න!
                  </span>
                </>
              ) : (
                <>
                  Challenge Yourself <br className="hidden sm:inline" />
                  and{' '}
                  <span className="text-[#FFD233] italic font-serif text-base min-[360px]:text-lg sm:text-2xl lg:text-3xl font-black drop-shadow-[0_2px_6px_rgba(255,210,51,0.35)] inline-block transform -rotate-1">
                    Win!
                  </span>
                </>
              )}
            </h1>

            {/* Subtext */}
            <p className="text-blue-100/90 text-[10px] sm:text-xs font-normal max-w-md mt-1 leading-snug line-clamp-2">
              {language === 'ta'
                ? 'விறுவிறுப்பான வினாடி வினாக்களில் பங்கேற்று, உங்கள் அறிவை வெளிப்படுத்தி பரிசுகளை வெல்லுங்கள்!'
                : language === 'si'
                ? 'උද්යෝගිමත් ප්‍රශ්නාවලිවලට සහභාගී වී, ඔබේ දැනුම පෙන්වා විශිෂ්ට ත්‍යාග දිනා ගන්න!'
                : 'Take part in exciting quizzes, show your knowledge and earn amazing rewards!'}
            </p>

            {/* CTA Button */}
            <div className="mt-2.5 sm:mt-3.5 flex justify-center md:justify-start">
              <button
                id="btn-hero-explore-competitions"
                onClick={() => {
                  const el = document.getElementById('upcoming-competitions-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  setSelectedFormat('all');
                }}
                className="bg-[#FFCA28] hover:bg-[#FFC107] active:scale-95 text-slate-900 font-extrabold text-[11px] sm:text-xs px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
              >
                <span>
                  {language === 'ta'
                    ? 'போட்டிகளைப் பார்க்க'
                    : language === 'si'
                    ? 'තරඟ ගවේෂණය කරන්න'
                    : 'Explore Competitions'}
                </span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Right 3D Vector Graphic Composition */}
          <div className="shrink-0 flex items-center justify-center">
            <HeroGraphicComposition className="max-w-[100px] sm:max-w-[130px] md:max-w-[160px] h-[55px] sm:h-[70px] md:h-[90px]" />
          </div>
        </div>
      </div>

      {/* STUDENT REWARD POINTS & DAILY SPIN STATUS DASHBOARD WIDGET */}
      <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-blue-500/15 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/25 shrink-0 text-2xl">
            🪙
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                {language === 'ta' ? 'மொத்த புள்ளிகள் (Reward Points)' : language === 'si' ? 'මුළු ලකුණු (Reward Points)' : 'Student Reward Points'}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight flex items-center gap-1">
                <span>{livePoints}</span>
                <span className="text-xs text-amber-700 font-bold">PTS</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              {language === 'ta'
                ? 'அதிர்ஷ்ட ஸ்பின், வேகக் கணிதம், மற்றும் பரிந்துரை மூலம் பெற்ற புள்ளிகள்.'
                : 'Points accumulated from Lucky Spin Wheel, Speed Math & Referral Rewards.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setStudentNav('Study Games Hub')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
              isSpinClaimedToday
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-105 active:scale-95 shadow-amber-400/20 animate-pulse'
            }`}
          >
            <span className="text-sm">🎡</span>
            <span>
              {isSpinClaimedToday
                ? (language === 'ta' ? 'இன்றைய ஸ்பின் முடிந்தது ✓' : 'Today’s Spin Claimed ✓')
                : (language === 'ta' ? 'அதிர்ஷ்ட ஸ்பின் சுழற்றுக! 🎡' : 'Spin Lucky Wheel Now! 🎡')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStudentNav('Referral & Points')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'புள்ளிகளைப் பயன்படுத்து (Redeem)' : 'Redeem Points'}</span>
          </button>
        </div>
      </div>

      {/* 4-IN-1 STUDY GAMES, DAILY STREAK & FOCUS CAM QUICK DECK */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Gamepad2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
                <span>
                  {language === 'ta'
                    ? '🎮 மாணவர் கல்வி கேம்கள் & தினசரி சவால்கள்'
                    : language === 'si'
                    ? '🎮 දෛනික අධ්‍යාපනික ක්‍රීඩා & අභියෝග'
                    : '🎮 Daily Study Games & Focus Lounge'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-xs">
                  4-in-1 Interactive
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-300">
                {language === 'ta'
                  ? 'தினமும் லாகின் செய்து பாயிண்ட்ஸ், அதிர்ஷ்ட ஸ்பின், வேகக் கணிதம் மற்றும் இசையுடன் படியுங்கள்!'
                  : 'Daily lucky spin, 60s brain challenge, speed math rush & Lo-Fi Pomodoro study cam!'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStudentNav('Study Games Hub')}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
          >
            <span>{language === 'ta' ? 'கேம்கள் பகுதிக்குச் செல்க' : 'Launch Games Arena'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Quick Game Mode Launchers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* 1. Lucky Spin Wheel */}
          <div
            onClick={() => setStudentNav('Study Games Hub')}
            className="cursor-pointer p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🎡</span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isSpinClaimedToday
                  ? 'bg-slate-700/80 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-400/95 text-slate-950 animate-pulse'
              }`}>
                {isSpinClaimedToday ? 'Done ✓' : 'Free Spin'}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-extrabold text-white group-hover:text-amber-300 transition">
                Lucky Spin Wheel
              </div>
              <div className="text-[10px] text-slate-300">
                {isSpinClaimedToday
                  ? (language === 'ta' ? 'இன்றைய ஸ்பின் முடிந்தது ✓' : 'Claimed for Today ✓')
                  : (language === 'ta' ? 'இன்றைய இலவச சுழல் தயார்!' : 'Daily Free Spin Ready!')}
              </div>
            </div>
          </div>

          {/* 2. Daily Streak & 1-Min Challenge */}
          <div
            onClick={() => setStudentNav('Study Games Hub')}
            className="cursor-pointer p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🔥</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500 text-white animate-pulse">
                Daily Streak
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-extrabold text-white group-hover:text-orange-300 transition">
                1-Min Brain Workout
              </div>
              <div className="text-[10px] text-slate-300">
                {language === 'ta' ? '3 விரைவு வினாக்கள்' : 'Daily 3 Questions'}
              </div>
            </div>
          </div>

          {/* 3. Speed Math Rush */}
          <div
            onClick={() => setStudentNav('Study Games Hub')}
            className="cursor-pointer p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">⚡</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500 text-white">
                60s Race
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-extrabold text-white group-hover:text-blue-300 transition">
                Speed Math Rush
              </div>
              <div className="text-[10px] text-slate-300">
                {language === 'ta' ? 'வேகக் கணித மின்னல்' : 'Combo Multiplier'}
              </div>
            </div>
          </div>

          {/* 4. Focus Study Room & Lo-Fi */}
          <div
            onClick={() => setStudentNav('Study Games Hub')}
            className="cursor-pointer p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🎧</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-bold">
                Lo-Fi Cam
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition">
                Focus Study Room
              </div>
              <div className="text-[10px] text-slate-300">
                {language === 'ta' ? 'பொமோடோரோ & இசை' : 'Pomodoro 25m Timer'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SMART DAILY TIPS & EXAM TRICKS (AI-POWERED) */}
      <SmartDailyTips />

      {/* 2.5 GEMINI AI PERSONALIZED STUDY TIMETABLE BANNER / WIDGET */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-700/60 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 text-slate-950" />
                <span>Gemini 3.8 Flash AI Coach</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-blue-200 border border-white/15">
                {language === 'ta' ? 'தனிப்பயனாக்கப்பட்ட படிப்பு அட்டவணை' : 'Personalized AI Timetable'}
              </span>
              {weakSubjects.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-400/30">
                  {weakSubjects.length} {language === 'ta' ? 'பலவீனமான பாடங்கள் இலக்கு' : 'Weak Subjects Targeted'}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              {language === 'ta'
                ? 'உங்கள் பலவீனமான பாடங்கள் & போட்டித் தேதிகளுக்கான AI படிப்பு அட்டவணை'
                : 'AI Study Timetable: Targeted for Weak Subjects & Upcoming Contests'}
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {language === 'ta'
                ? `கடந்த பரீட்சைகளின் அடிப்படையில் கண்டறியப்பட்ட ${weakSubjects.slice(0, 2).join(', ')} போன்ற பலவீனமான பாடங்களை பலப்படுத்தவும், ${visibleCompetitions.length} எதிர்வரும் போட்டிகளில் அதிக புள்ளிகளை பெறவும் 7-நாள் தனிப்பயனாக்கப்பட்ட அட்டவணை.`
                : `Targeted revision for weak areas (${weakSubjects.slice(0, 2).join(', ')}) combined with strategic prep for your ${visibleCompetitions.length} eligible upcoming contests.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('AI Study Timetable')}
              className="px-4.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md shadow-amber-400/20 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-950" />
              <span>{language === 'ta' ? 'படிப்பு அட்டவணையைத் திறக்க →' : 'Open AI Timetable →'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2.8 OFFLINE STUDY MATERIALS & DOWNLOADS HUB (SERVICE WORKER CACHED) */}
      <OfflineStudyMaterialsHub
        studentGrade={currentAuthUser?.grade || currentStudent?.gradeLevel || 'Grade 10'}
        onNavigate={onNavigate}
      />

      {/* 3. FORMAT / CATEGORY CARDS (4 in a Row) (COMPACT) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {/* Card 1: Quiz ( MCQ ) */}
        <div
          id="cat-card-mcq"
          onClick={() => setSelectedFormat(selectedFormat === 'Quiz ( MCQ )' ? 'all' : 'Quiz ( MCQ )')}
          className={`cursor-pointer rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5 border ${
            selectedFormat === 'Quiz ( MCQ )'
              ? 'bg-[#F3E8FF] border-purple-400 ring-2 ring-purple-300'
              : 'bg-[#F7EEFF]/80 hover:bg-[#F3E8FF] border-purple-100'
          }`}
        >
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center shadow-xs shadow-purple-500/20 mb-1.5">
            <Trophy className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
            {language === 'ta' ? 'வினாடி வினா' : language === 'si' ? 'ප්‍රශ්නාවලිය' : 'Quiz'}
          </span>
          <span className="text-[10px] font-bold text-purple-700 mt-0.5">
            ( MCQ )
          </span>
        </div>

        {/* Card 2: True / False */}
        <div
          id="cat-card-tf"
          onClick={() => setSelectedFormat(selectedFormat === 'True / False' ? 'all' : 'True / False')}
          className={`cursor-pointer rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5 border ${
            selectedFormat === 'True / False'
              ? 'bg-[#E8F8F0] border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-[#E8F8F0]/80 hover:bg-[#E8F8F0] border-emerald-100'
          }`}
        >
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-xs shadow-emerald-500/20 mb-1.5">
            <CheckSquare className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
            {language === 'ta' ? 'சரி / பிழை' : language === 'si' ? 'හරි / වැරදි' : 'True / False'}
          </span>
          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">
            {language === 'ta' ? 'கருத்து சோதனை' : language === 'si' ? 'සංකල්ප පරීක්ෂාව' : 'Concept Check'}
          </span>
        </div>

        {/* Card 3: Short Answer */}
        <div
          id="cat-card-short-answer"
          onClick={() => setSelectedFormat(selectedFormat === 'Short Answer' ? 'all' : 'Short Answer')}
          className={`cursor-pointer rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5 border ${
            selectedFormat === 'Short Answer'
              ? 'bg-[#FFF3E0] border-amber-400 ring-2 ring-amber-300'
              : 'bg-[#FFF3E0]/80 hover:bg-[#FFF3E0] border-amber-100'
          }`}
        >
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs shadow-amber-500/20 mb-1.5">
            <FileText className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
            {language === 'ta' ? 'குறுகிய விடை' : language === 'si' ? 'කෙටි පිළිතුරු' : 'Short Answer'}
          </span>
          <span className="text-[10px] font-bold text-amber-700 mt-0.5">
            {language === 'ta' ? 'நேரடி எழுத்து' : language === 'si' ? 'සෘජු ලිවීම' : 'Direct Writing'}
          </span>
        </div>

        {/* Card 4: Picture Questions */}
        <div
          id="cat-card-picture-questions"
          onClick={() => setSelectedFormat(selectedFormat === 'Picture Questions' ? 'all' : 'Picture Questions')}
          className={`cursor-pointer rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5 border ${
            selectedFormat === 'Picture Questions'
              ? 'bg-[#FFE4E8] border-rose-400 ring-2 ring-rose-300'
              : 'bg-[#FFE4E8]/80 hover:bg-[#FFE4E8] border-rose-100'
          }`}
        >
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xs shadow-rose-500/20 mb-1.5">
            <ImageIcon className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
            {language === 'ta' ? 'பட வினாக்கள்' : language === 'si' ? 'පින්තූර ප්‍රශ්න' : 'Picture Questions'}
          </span>
          <span className="text-[10px] font-bold text-rose-700 mt-0.5">
            {language === 'ta' ? 'காட்சி பகுப்பாய்வு' : language === 'si' ? 'දෘශ්‍ය විශ්ලේෂණය' : 'Visual Analysis'}
          </span>
        </div>
      </div>

      {/* 2.5 REFERRAL & SHARE POINTS PROMO BANNER */}
      {refToast && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{refToast}</span>
          </div>
          <button onClick={() => setRefToast(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-300/60 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                {language === 'ta' ? 'புள்ளிகள் & வெகுமதிகள்' : 'Earn Points'}
              </span>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {livePoints} PTS
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
              {language === 'ta'
                ? 'நண்பர்களை அழைத்து இலவச தேர்வுகள் & தூதர் விருதுகளை வெல்லுங்கள்! 🎁'
                : language === 'si'
                ? 'මිතුරන්ට ආරාධනා කර නොමිලේ විභාග සහ තානාපති ත්‍යාග දිනාගන්න! 🎁'
                : 'Invite Friends: Unlock Free Exams, Ambassador Cert & Gold Badge! 🎁'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {language === 'ta'
                ? 'ஒரு பதிவிற்கு 25 புள்ளிகள்! 200 புள்ளிகளில் இலவச தேர்வு, 500-ல் தூதர் சான்றிதழ், 1000-ல் தங்க பேட்ஜ்!'
                : language === 'si'
                ? 'සෑම ලියාපදිංචියකටම ලකුණු 25ක්! ලකුණු 200න් නොමිලේ විභාග, 500න් තානාපති සහතිකය, 1000න් රන් තරු ලාංඡනය!'
                : 'Earn 25 points per registration! Unlock: 200 pts Free Exam, 500 pts Ambassador Cert, 1,000 pts Gold Star Badge!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap justify-end">
          <button
            onClick={() => {
              const code = currentStudent.referralCode || `HNC-${(currentStudent.studentId || 'STUDENT').toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
              const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-hf3y3oosirb26omqwqx6g7-151010066822.asia-southeast1.run.app';
              const text = `🏆 Join me in HNC National Student Competition! Register with my referral code ${code} to get 25 welcome bonus points: ${baseUrl}?ref=${code}`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
              setRefToast(
                language === 'ta'
                  ? '📲 WhatsApp-ல் திறக்கப்பட்டது! உங்கள் நண்பர் பதிவு செய்தவுடன் உங்களுக்கு +25 புள்ளிகள் சேரும்.'
                  : '📲 Shared to WhatsApp! You will receive +25 points when your friend completes registration.'
              );
              setTimeout(() => setRefToast(null), 4000);
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{language === 'ta' ? 'WhatsApp-ல் பகிர்க' : 'Share on WhatsApp'}</span>
          </button>

          <button
            onClick={() => setStudentNav('Referral & Points')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{language === 'ta' ? 'வெகுமதிகள்' : 'Rewards Hub'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2.5 HNC EDU-ARENA: ISLAND QUEST HERO PROMO CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-900 p-6 sm:p-7 text-white shadow-md border border-indigo-700/50">
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-8 w-40 h-40 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'புதிய கேமிஃபிகேஷன் அரங்கம்' : 'Interactive Gamified Quest'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>🎯 HNC Edu-Arena: தீவுப் பயணம்</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'ta'
                ? 'இலங்கையின் 25 மாவட்டங்களைக் கடந்து உங்கள் கல்விச் சிகரத்தை அடையுங்கள்! 50-50, நேர முடக்கம் மற்றும் HNC Arena போர்க்களத்தில் பங்கேற்று XP புள்ளிகளை வெல்லுங்கள்!'
                : 'Conquer the academic challenges across 25 Sri Lankan districts! Compete in rapid HNC Arena battles with 50-50 power-ups and earn XP!'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStudentNav('Edu-Arena Quest')}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
            >
              <Gamepad2 className="w-5 h-5 text-slate-950" />
              <span>{language === 'ta' ? 'விளையாடத் தொடங்கு ⚔️' : 'Play Quest Now ⚔️'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2.6 ALL LEADERBOARDS HUB PROMO CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-amber-300/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/25 shrink-0">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {language === 'ta' ? 'அனைத்து தரவரிசைகள்' : 'Official Leaderboards Hub'}
                </span>
                <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  4 Active Rankings 🇱🇰
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                {language === 'ta'
                  ? 'தேர்வு, வினாடி-வினா, பரிந்துரை, 25 மாவட்ட தீவுப் பயணம் & Edu-Arena தரவரிசை மையம்'
                  : 'Exams, Quizzes, Referral Points, Island Quest & Edu-Arena Leaderboards Hub'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {language === 'ta'
                  ? 'உங்கள் தேசிய நிலை, விருதுகள், மற்றும் சக மாணவர்களின் மதிப்பெண்களை நேரடியாகப் பாருங்கள்.'
                  : 'Explore real-time All-Island podium rankings, ambassador scores, and district honors.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStudentNav('Leaderboards')}
            className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95 shrink-0"
          >
            <Trophy className="w-4 h-4 text-slate-950" />
            <span>{language === 'ta' ? 'தரவரிசையைப் பார்க்க 🏆' : 'View Leaderboards 🏆'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. UPCOMING COMPETITIONS CARD CONTAINER */}
      <div
        id="upcoming-competitions-section"
        className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-4"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Calendar className="w-5 h-5 text-slate-800" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              {language === 'ta' ? 'வரவிருக்கும் போட்டிகள்' : language === 'si' ? 'ඉදිරි තරඟාවලි' : 'Upcoming Competitions'}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-700 text-white shadow-2xs">
              <GraduationCap className="w-3 h-3" />
              {language === 'ta'
                ? `தரம்: ${studentGrade} & பொதுவானவை (Open)`
                : language === 'si'
                ? `ශ්‍රේණිය: ${studentGrade} සහ විවෘත (Open)`
                : `Grade: ${studentGrade} & Open`}
            </span>
            {selectedFormat !== 'all' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {selectedFormat}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedFormat !== 'all' && (
              <button
                onClick={() => setSelectedFormat('all')}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
              >
                {language === 'ta' ? 'அனைத்தும்' : language === 'si' ? 'සියල්ල' : 'Clear'}
              </button>
            )}
            <button
              onClick={() => setStudentNav('Competitions')}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
            >
              <span>{language === 'ta' ? 'முழு பட்டியல்' : language === 'si' ? 'සියලු තරඟ' : 'View Catalog'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Competitions Items List */}
        <div className="divide-y divide-slate-100">
          {visibleCompetitions.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'ta'
                  ? 'தற்போது புதிய போட்டிகள் அல்லது வினாடி வினாக்கள் இல்லை'
                  : language === 'si'
                  ? 'දැනට නව තරඟ හෝ ප්‍රශ්නාවලි නොමැත'
                  : 'No upcoming competitions or quizzes currently available'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                {language === 'ta'
                  ? 'கல்வி நிர்வாகம் புதிய போட்டிகள், வினாடி வினாக்கள் அல்லது பரீட்சைகளை வெளியிடும் போது அவை நேரடியாக இங்கு தோன்றும்.'
                  : language === 'si'
                  ? 'අධ්‍යාපන පරිපාලනය නව තරඟ හෝ ප්‍රශ්නාවලි ප්‍රකාශයට පත් කළ විට ඒවා මෙහි දිස්වනු ඇත.'
                  : 'Official challenges published by administrators will appear here in real time.'}
              </p>
            </div>
          ) : displayedCompetitions.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shadow-2xs">
                🎯
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {selectedFormat !== 'all'
                  ? `${selectedFormat} - ${language === 'ta' ? 'போட்டிகள் எதுவும் இல்லை' : language === 'si' ? 'තරඟ කිසිවක් නැත' : 'No competitions available'}`
                  : (language === 'ta' ? 'பொருந்தக்கூடிய போட்டிகள் எதுவும் இல்லை' : language === 'si' ? 'ගැලපෙන තරඟ කිසිවක් හමු නොවීය' : 'No matching competitions found')}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {selectedFormat !== 'all'
                  ? (language === 'ta' ? 'வடிகட்டியை நீக்கி மற்ற வகைகளைப் பார்க்கவும்.' : language === 'si' ? 'පෙරහන ඉවත් කර වෙනත් කාණ්ඩ බලන්න.' : 'Try clearing the format filter or selecting another quiz category.')
                  : (language === 'ta' ? 'வடிகட்டிகளை மாற்றி மீண்டும் முயற்சிக்கவும்.' : language === 'si' ? 'පෙරහන් වෙනස් කර නැවත උත්සාහ කරන්න.' : 'Try adjusting your filters.')}
              </p>
              {selectedFormat !== 'all' && (
                <button
                  onClick={() => setSelectedFormat('all')}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Show All Competitions
                </button>
              )}
            </div>
          ) : (
            displayedCompetitions.map((item) => {
            const hasSubmitted = hasStudentSubmitted(item.fullCompetition.id);
            const isRegistered = isStudentRegistered(item.fullCompetition.id);
            const sched = getCompetitionScheduleStatus(item.fullCompetition);

            return (
              <div
                key={item.id}
                className={`py-4 sm:py-5 first:pt-2 last:pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group hover:bg-slate-50/60 p-2 sm:p-3 rounded-2xl transition-all ${
                  item.deadlineBadge?.level === 'critical'
                    ? 'border-l-4 border-l-rose-500 bg-rose-50/30'
                    : item.deadlineBadge?.level === 'urgent'
                    ? 'border-l-4 border-l-amber-500 bg-amber-50/20'
                    : ''
                }`}
              >
                {/* Left: 3D Icon Box + Meta Details */}
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
                  {/* 3D Icon */}
                  <div className="shrink-0">{item.iconComponent}</div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${item.categoryBadgeClass}`}
                      >
                        {item.categoryBadge}
                      </span>
                      {item.deadlineBadge && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${item.deadlineBadge.classes}`}
                        >
                          <Flame className="w-3 h-3 text-yellow-300" />
                          <span>{item.deadlineBadge.text}</span>
                        </span>
                      )}
                    </div>

                    {/* Meta Row: Questions | Duration | Date | Grade */}
                    <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-slate-500 font-medium mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.questionsCount} Questions</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.durationMinutes} Minutes</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.dateDisplay}</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.gradeRange}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Countdown Pill & Join Now Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 lg:pt-0">
                  {/* Ends in countdown pill */}
                  <div
                    className={`text-xs font-bold px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 shrink-0 ${item.countdownPillClass}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.countdownText}</span>
                  </div>

                  {/* Join Now Button */}
                  {hasSubmitted ? (
                    <button
                      onClick={() => handleJoinCompetition(item.fullCompetition)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {language === 'ta'
                          ? 'ரசீது பார்க்க'
                          : language === 'si'
                          ? 'රිසිට්පත බලන්න'
                          : 'View Receipt'}
                      </span>
                    </button>
                  ) : sched.isUpcoming ? (
                    <button
                      id={`join-btn-${item.id}`}
                      onClick={() => handleJoinCompetition(item.fullCompetition)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Lock className="w-4 h-4 text-amber-700" />
                      <span>
                        {language === 'ta'
                          ? `தொடங்கும் நேரம்: ${sched.formattedStart}`
                          : language === 'si'
                          ? `ආරම්භක දිනය: ${sched.formattedStart}`
                          : `Opens: ${sched.formattedStart}`}
                      </span>
                    </button>
                  ) : (
                    <button
                      id={`join-btn-${item.id}`}
                      onClick={() => handleJoinCompetition(item.fullCompetition)}
                      className="bg-[#1877F2] hover:bg-[#166FE5] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2 sm:py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>
                        {language === 'ta'
                          ? 'இப்போதே சேரவும்'
                          : language === 'si'
                          ? 'දැන් එකතු වන්න'
                          : 'Join Now'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* 4. BOTTOM MOTIVATIONAL BANNER (COMPACT) */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#DDEEFF] via-[#E8F2FF] to-[#E3EDFD] border border-blue-200/80 px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xs flex items-center justify-between gap-2.5">
        {/* Left: Target Icon and Text */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-blue-200">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] sm:text-xs font-extrabold text-slate-900 leading-tight truncate">
              {language === 'ta'
                ? 'ஒவ்வொரு வினாடி வினாவும் உங்கள் இலக்கை நோக்கி உங்களை வழிநடத்துகிறது!'
                : language === 'si'
                ? 'සෑම ප්‍රශ්නාවලියක්ම ඔබව ඔබේ ඉලක්ක වෙත සමීප කරයි!'
                : 'Every Quiz Brings You Closer to Your Goals!'}
            </h3>
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-600 leading-tight">
              {language === 'ta'
                ? 'பங்கேற்கவும் • முன்னேறவும் • பரிசுகளை வெல்லவும்'
                : language === 'si'
                ? 'සහභාගී වන්න • දියුණු වන්න • ත්‍යාග දිනා ගන්න'
                : 'Participate • Improve • Earn Rewards'}
            </p>
          </div>
        </div>

        {/* Right: Vector Celebration Graphic (Ultra Compact) */}
        <CelebratingStudentGraphic className="relative w-12 sm:w-14 h-7 sm:h-8 shrink-0 flex items-center justify-center select-none" />
      </div>

      {/* 4.4 STUDENT ACHIEVEMENTS & MILESTONES */}
      <StudentAchievements compact={true} />

      {/* 4.45 STUDENT FEEDBACK & QUERY CALLOUT */}
      <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 rounded-3xl p-5 sm:p-6 border border-rose-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm text-2xl">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-200 text-rose-800">
                {language === 'ta' ? 'கருத்து & ஆலோசனை' : 'Student Voice'}
              </span>
              <span className="text-xs text-rose-600 font-bold">★ Community Feedback</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {language === 'ta'
                ? 'உங்கள் அனுபவம் & கருத்துக்களைப் பகிருங்கள் (Feedback Form)'
                : 'Have Feedback or Questions on Competitions?'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              {language === 'ta'
                ? 'போட்டிகள், வினாக்களின் தரம், Edu-Arena தீவுப் பயணம் பற்றிய உங்கள் கருத்துக்கள் மற்றும் ஆலோசனைகளை நேரடியாகச் சமர்ப்பியுங்கள்.'
                : 'Share your thoughts, report question doubts, or suggest new features directly to our academic jury.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStudentNav('Feedback')}
          className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>{language === 'ta' ? 'கருத்துப் படிவம் திறக்க' : 'Open Feedback Form'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4.5 OFFICIAL COMMUNITY & SUPPORT BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-amber-400 text-sm shrink-0">
              HNC
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {language === 'ta' ? 'அதிகாரப்பூர்வ சமூக ஊடகங்கள் & உதவி மையம்' : language === 'si' ? 'නිල සමාජ මාධ්‍ය සහ උපකාරක සේවාව' : 'Higher Novas College Official Community & Support'}
              </h3>
              <p className="text-xs text-blue-200/80 font-medium">
                {language === 'ta' ? 'புதிய தகவல்கள் பெற இணைந்து கொள்ளுங்கள் • உடனடி உதவி பெற தொடர்புகொள்ளுங்கள்' : language === 'si' ? 'නව තොරතුරු සඳහා එකතු වන්න • ක්ෂණික සහාය ලබා ගන්න' : 'Join our official channels for real-time announcements & instant help'}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            24/7 Helpline Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <a
            href="https://whatsapp.com/channel/0029VaEAS90Gk1FwJW7arA23"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-white text-xs block group-hover:text-amber-300 transition-colors">WhatsApp Channel</span>
                <span className="text-[10px] text-blue-200/70">Official News & Links</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-blue-300 group-hover:text-white" />
          </a>

          <a
            href="https://www.facebook.com/share/18cWgwEKmy/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-white text-xs block group-hover:text-amber-300 transition-colors">Facebook Page</span>
                <span className="text-[10px] text-blue-200/70">College Posts & Photos</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-blue-300 group-hover:text-white" />
          </a>

          <a
            href="https://wa.me/94741760710"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-white text-xs block group-hover:text-amber-300 transition-colors">WhatsApp / Call</span>
                <span className="text-[11px] font-mono font-bold text-emerald-300">+94 74 176 0710</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-blue-300 group-hover:text-white" />
          </a>

          <a
            href="mailto:highernovascollege01@gmail.com"
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="font-bold text-white text-xs block group-hover:text-amber-300 transition-colors">Official Email</span>
                <span className="text-[10px] font-mono text-blue-200 truncate block">highernovascollege01@gmail.com</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-blue-300 group-hover:text-white shrink-0" />
          </a>
        </div>
      </div>

      {/* 5. Modals for seamless competition interaction */}
      {detailsComp && (
        <CompetitionDetailsModal
          competition={detailsComp}
          isOpen={!!detailsComp}
          onClose={() => setDetailsComp(null)}
          onStartExam={handleJoinCompetition}
        />
      )}

      {instructionComp && (
        <CompetitionInstructionsModal
          competition={instructionComp}
          isOpen={!!instructionComp}
          onClose={() => setInstructionComp(null)}
          onStartNow={handleStartFromInstructions}
        />
      )}

      {paymentComp && (
        <CompetitionPaymentModal
          competition={paymentComp}
          isOpen={!!paymentComp}
          onClose={() => setPaymentComp(null)}
          onPaymentSuccess={() => {
            const comp = paymentComp;
            setPaymentComp(null);
            if (comp) {
              if (!isStudentRegistered(comp.id)) {
                registerStudentForCompetition(comp.id);
              }
              setInstructionComp(comp);
            }
          }}
        />
      )}

      {verificationComp && (
        <ExamCameraVerificationModal
          competition={verificationComp}
          isOpen={!!verificationComp}
          onClose={() => setVerificationComp(null)}
          onVerified={async () => {
            const comp = verificationComp;
            setVerificationComp(null);
            await startActiveExam(comp);
          }}
        />
      )}

      {/* Membership Required Notice Modal */}
      {membershipPromptComp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Active Membership Required
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Active monthly membership is required to participate in{' '}
                <span className="font-semibold text-slate-900">{membershipPromptComp.title}</span>.
                Please activate or renew your subscription to access all protected Olympiads.
              </p>
            </div>
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-xs flex items-center justify-between">
              <span className="font-semibold text-indigo-900">Monthly Pass</span>
              <span className="font-black text-indigo-900">
                {(membershipSettings.monthlyFeeLkr || 1500).toLocaleString()} LKR / Month
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMembershipPromptComp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Dismiss
              </button>
              <button
                type="button"
                id="btn-open-membership-from-dash"
                onClick={() => {
                  setMembershipPromptComp(null);
                  setShowMembershipModal(true);
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Activate / Renew Membership
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Membership Payment Modal */}
      <StudentMembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
      />

      {/* Student Enrolled Subjects & Notification Preferences Modal */}
      <EnrolledSubjectsModal
        isOpen={showSubjectsModal}
        onClose={() => setShowSubjectsModal(false)}
      />

      {/* WhatsApp & SMS Automated Alert Center Modal */}
      <WhatsappSmsAlertModal
        isOpen={showWhatsappModal}
        onClose={() => setShowWhatsappModal(false)}
      />
    </div>
  );
};
