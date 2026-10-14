import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Sparkles,
  Search,
  Filter,
  Users,
  Gift,
  Share2,
  Gamepad2,
  Zap,
  Flame,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Shield,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  BarChart2,
  Globe,
  Compass,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { SRI_LANKA_25_DISTRICTS } from '../../data/sriLankaDistricts';
import { DISTRICT_LEADERBOARD_STORAGE_KEY } from '../common/DistrictLeaderboardModal';
import { ShareModal } from '../common/ShareModal';

export type LeaderboardCategory = 'exams_quizzes' | 'referrals' | 'island_quest' | 'edu_arena_studio';

interface ParticipantRankItem {
  id: string;
  rank: number;
  name: string;
  school: string;
  district: string;
  districtKey: string;
  grade: string;
  gradeCategory: 'primary' | 'junior' | 'senior' | 'advanced' | 'after_school';
  avatarUrl?: string;
  // Exams/Quiz/Competition fields
  totalScore: number;
  contestsTaken: number;
  examsCount: number;
  quizzesCount: number;
  competitionsCount: number;
  accuracyRate: number;
  podiumWins: number;
  highestScore: number;
  // Referral fields
  referralPoints?: number;
  referralsCount?: number;
  sharesCount?: number;
  ambassadorTier?: 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  // Island Quest fields
  conqueredDistricts?: number;
  questXp?: number;
  crownsCount?: number;
  // Edu-Arena Studio fields
  arenaXp?: number;
  arenaStreak?: number;
  bestSpeedSeconds?: number;
  arenaMasteryTitle?: string;
  preferredMode?: 'kahoot' | 'quizizz' | 'trivia_crack' | 'brain_out';
  isCurrentUser?: boolean;
}

// Helper to get normalized district info
const getDistrictInfo = (distRaw?: string) => {
  const distNormalized = (distRaw || 'jaffna').toLowerCase().replace(/\s+/g, '_');
  return (
    SRI_LANKA_25_DISTRICTS.find(
      (d) => d.id === distNormalized || d.nameEn.toLowerCase() === distNormalized
    ) || SRI_LANKA_25_DISTRICTS[0]
  );
};

// Helper to get grade category
const getGradeCategory = (gradeRaw?: string): 'primary' | 'junior' | 'senior' | 'advanced' | 'after_school' => {
  const gLower = (gradeRaw || '').toLowerCase();
  if (gLower.includes('after') || gLower.includes('ma') || gLower.includes('gs') || gLower.includes('teach')) {
    return 'after_school';
  } else if (gLower.includes('1') || gLower.includes('2') || gLower.includes('3') || gLower.includes('4') || gLower.includes('5')) {
    return 'primary';
  } else if (gLower.includes('6') || gLower.includes('7') || gLower.includes('8') || gLower.includes('9')) {
    return 'junior';
  } else if (gLower.includes('12') || gLower.includes('13') || gLower.includes('advanced')) {
    return 'advanced';
  }
  return 'senior';
};

interface LeaderboardsHubViewProps {
  initialTab?: LeaderboardCategory;
  onNavigateTab?: (tab: string) => void;
}

export const LeaderboardsHubView: React.FC<LeaderboardsHubViewProps> = ({
  initialTab = 'exams_quizzes',
}) => {
  const {
    currentAuthUser,
    currentStudent,
    students,
    results,
    competitions,
    language,
    setStudentNav,
  } = useApp();

  const [activeTab, setActiveTab] = useState<LeaderboardCategory>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all_time' | 'month' | 'week'>('all_time');
  
  // Tab-specific filters
  const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'Exam' | 'Quiz' | 'Competition'>('all');
  const [arenaModeFilter, setArenaModeFilter] = useState<'all' | 'kahoot' | 'quizizz' | 'trivia_crack' | 'brain_out'>('all');

  // Share Modal & Toast
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedCodeToast, setCopiedCodeToast] = useState(false);

  // Trigger confetti on initial load
  useEffect(() => {
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.2 },
        colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
      });
    } catch {}
  }, [activeTab]);

  // Aggregate real participants from registered students and actual competition results
  const processedLeaderboard = useMemo(() => {
    const participantsMap = new Map<string, ParticipantRankItem>();

    // 1. Ingest registered students from Firestore
    students.forEach((std) => {
      // Exclude any legacy mock or test ids
      if (std.id?.startsWith('bm-') || std.id?.startsWith('lead-') || std.id?.includes('demo')) return;

      const dist = getDistrictInfo(std.district);
      const grade = std.gradeLevel || (std as any).grade || 'Grade 10';
      const refPts = std.referralPoints || 0;
      let tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
      if (refPts >= 500) tier = 'Diamond';
      else if (refPts >= 250) tier = 'Gold';
      else if (refPts >= 100) tier = 'Silver';

      const isUser = Boolean(
        (currentAuthUser && (currentAuthUser.uid === std.id || currentAuthUser.email === std.email)) ||
        (currentStudent && currentStudent.id === std.id)
      );

      participantsMap.set(std.id, {
        id: std.id,
        rank: 0,
        name: std.name || (std as any).fullName || 'Student',
        school: std.institution || (std as any).school || 'Higher Novas College (HNC)',
        district: `${dist.nameTa} (${dist.nameEn})`,
        districtKey: dist.id,
        grade,
        gradeCategory: getGradeCategory(grade),
        avatarUrl: std.avatarUrl,
        totalScore: 0,
        contestsTaken: 0,
        examsCount: 0,
        quizzesCount: 0,
        competitionsCount: 0,
        accuracyRate: 0,
        podiumWins: 0,
        highestScore: 0,
        referralPoints: refPts,
        referralsCount: std.totalReferrals || 0,
        sharesCount: std.sharesCount || 0,
        ambassadorTier: tier,
        conqueredDistricts: (std as any).conqueredDistricts || 0,
        questXp: (std as any).questXp || 0,
        crownsCount: (std as any).crownsCount || 0,
        arenaXp: (std as any).arenaXp || 0,
        arenaStreak: (std as any).arenaStreak || 0,
        bestSpeedSeconds: (std as any).bestSpeedSeconds || 0,
        arenaMasteryTitle: (std as any).arenaMasteryTitle || '',
        preferredMode: (std as any).preferredMode || 'kahoot',
        isCurrentUser: isUser,
      });
    });

    // 2. If current user is a genuine student and not yet in the map, register their live profile
    const isStudentUser = currentAuthUser?.role === 'student' || (!currentAuthUser?.role && currentStudent?.id && currentAuthUser?.role !== 'super_admin' && currentAuthUser?.role !== 'admin');
    if (isStudentUser && currentAuthUser) {
      const uid = currentAuthUser.uid || currentStudent?.id || '';
      if (uid && !participantsMap.has(uid)) {
        const dist = getDistrictInfo(currentAuthUser.district || currentStudent?.district);
        const grade = currentAuthUser.grade || currentStudent?.gradeLevel || 'Grade 10';
        const refPts = currentAuthUser.referralPoints || currentStudent?.referralPoints || 0;
        let tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
        if (refPts >= 500) tier = 'Diamond';
        else if (refPts >= 250) tier = 'Gold';
        else if (refPts >= 100) tier = 'Silver';

        participantsMap.set(uid, {
          id: uid,
          rank: 0,
          name: `${currentAuthUser.fullName || currentStudent?.name || 'Student'} (நீங்கள்)`,
          school: currentAuthUser.school || currentStudent?.institution || 'Higher Novas College (HNC)',
          district: `${dist.nameTa} (${dist.nameEn})`,
          districtKey: dist.id,
          grade,
          gradeCategory: getGradeCategory(grade),
          avatarUrl: currentAuthUser.avatarUrl || currentStudent?.avatarUrl,
          totalScore: 0,
          contestsTaken: 0,
          examsCount: 0,
          quizzesCount: 0,
          competitionsCount: 0,
          accuracyRate: 0,
          podiumWins: 0,
          highestScore: 0,
          referralPoints: refPts,
          referralsCount: currentAuthUser.totalReferrals || currentStudent?.totalReferrals || 0,
          sharesCount: currentAuthUser.sharesCount || currentStudent?.sharesCount || 0,
          ambassadorTier: tier,
          conqueredDistricts: 0,
          questXp: 0,
          crownsCount: 0,
          arenaXp: 0,
          arenaStreak: 0,
          bestSpeedSeconds: 0,
          arenaMasteryTitle: '',
          preferredMode: 'kahoot',
          isCurrentUser: true,
        });
      }
    }

    // 3. Process all real competition results from Cloud Firestore
    const accuracyMap = new Map<string, { totalPercent: number; count: number }>();

    results.forEach((res) => {
      // Filter out demo or sample results
      if (res.id?.includes('demo') || res.competitionId?.includes('demo') || (res as any).isDemo) return;

      const studentEmail = (res as any).studentEmail;
      const pId = res.studentId || studentEmail || res.studentName;
      if (!pId) return;

      let participant = participantsMap.get(res.studentId);
      if (!participant && studentEmail) {
        participant = Array.from(participantsMap.values()).find((p) => (p as any).email === studentEmail);
      }
      if (!participant && res.studentName) {
        participant = Array.from(participantsMap.values()).find((p) => p.name === res.studentName);
      }

      if (!participant) {
        const dist = getDistrictInfo((res as any).district);
        const grade = (res as any).grade || 'Grade 10';
        participant = {
          id: res.studentId || `res-${res.id}`,
          rank: 0,
          name: res.studentName || 'Student',
          school: res.studentInstitution || (res as any).school || 'Higher Novas College (HNC)',
          district: `${dist.nameTa} (${dist.nameEn})`,
          districtKey: dist.id,
          grade,
          gradeCategory: getGradeCategory(grade),
          totalScore: 0,
          contestsTaken: 0,
          examsCount: 0,
          quizzesCount: 0,
          competitionsCount: 0,
          accuracyRate: 0,
          podiumWins: 0,
          highestScore: 0,
          referralPoints: 0,
          referralsCount: 0,
          sharesCount: 0,
          ambassadorTier: 'Bronze',
          conqueredDistricts: 0,
          questXp: 0,
          crownsCount: 0,
          arenaXp: 0,
          arenaStreak: 0,
          bestSpeedSeconds: 0,
          arenaMasteryTitle: '',
          preferredMode: 'kahoot',
          isCurrentUser: Boolean(
            currentAuthUser &&
              (currentAuthUser.uid === res.studentId ||
                (studentEmail && currentAuthUser.email === studentEmail) ||
                currentAuthUser.fullName === res.studentName)
          ),
        };
        participantsMap.set(participant.id, participant);
      }

      const score = Number(res.score) || 0;
      participant.totalScore += score;
      participant.contestsTaken += 1;
      if (score > participant.highestScore) participant.highestScore = score;
      if (res.rank && res.rank <= 3) participant.podiumWins += 1;

      const comp = competitions.find((c) => c.id === res.competitionId);
      const cType = comp?.competitionType || 'Quiz';
      if (cType === 'Exam') participant.examsCount += 1;
      else if (cType === 'Quiz') participant.quizzesCount += 1;
      else participant.competitionsCount += 1;

      // Accuracy accumulation
      const acc = accuracyMap.get(participant.id) || { totalPercent: 0, count: 0 };
      let pct = 0;
      if (res.percentage !== undefined && res.percentage !== null) {
        pct = Number(res.percentage) || 0;
      } else if (res.accuracy !== undefined && res.accuracy !== null) {
        pct = Number(res.accuracy) || 0;
      } else if (res.maxScore && res.maxScore > 0) {
        pct = Math.round((score / res.maxScore) * 100);
      } else if ((res as any).totalQuestions && (res as any).totalQuestions > 0) {
        pct = Math.round((score / (res as any).totalQuestions) * 100);
      } else {
        pct = Math.min(100, score);
      }
      acc.totalPercent += Math.min(100, Math.max(0, pct));
      acc.count += 1;
      accuracyMap.set(participant.id, acc);
    });

    // Finalize accuracy
    accuracyMap.forEach((acc, id) => {
      const p = participantsMap.get(id);
      if (p && acc.count > 0) {
        p.accuracyRate = Math.round(acc.totalPercent / acc.count);
      }
    });

    // Check localStorage quest progress for current user
    try {
      const storedLeaderboard = localStorage.getItem(DISTRICT_LEADERBOARD_STORAGE_KEY);
      if (storedLeaderboard) {
        const parsed = JSON.parse(storedLeaderboard);
        if (Array.isArray(parsed)) {
          const found = parsed.find((p: any) => p.isCurrentUser);
          if (found && currentAuthUser) {
            const userP = Array.from(participantsMap.values()).find((p) => p.isCurrentUser);
            if (userP) {
              userP.conqueredDistricts = found.completedDistrictsCount || userP.conqueredDistricts;
              userP.questXp = found.totalXp || userP.questXp;
              userP.crownsCount = found.crownsCount || userP.crownsCount;
            }
          }
        }
      }
    } catch {}

    let list = Array.from(participantsMap.values());

    // Only include participants who have actual activity (scores, referrals, or quest/arena points)
    // or who are the currently logged in student
    list = list.filter(
      (item) =>
        item.isCurrentUser ||
        item.contestsTaken > 0 ||
        (item.referralPoints ?? 0) > 0 ||
        (item.questXp ?? 0) > 0 ||
        (item.arenaXp ?? 0) > 0
    );

    // Sorting according to active tab
    if (activeTab === 'exams_quizzes') {
      list.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.accuracyRate !== a.accuracyRate) return b.accuracyRate - a.accuracyRate;
        return b.contestsTaken - a.contestsTaken;
      });
    } else if (activeTab === 'referrals') {
      list.sort((a, b) => {
        const ptsA = a.referralPoints ?? 0;
        const ptsB = b.referralPoints ?? 0;
        if (ptsB !== ptsA) return ptsB - ptsA;
        return (b.referralsCount ?? 0) - (a.referralsCount ?? 0);
      });
    } else if (activeTab === 'island_quest') {
      list.sort((a, b) => {
        const xpA = a.questXp ?? 0;
        const xpB = b.questXp ?? 0;
        if (xpB !== xpA) return xpB - xpA;
        return (b.conqueredDistricts ?? 0) - (a.conqueredDistricts ?? 0);
      });
    } else if (activeTab === 'edu_arena_studio') {
      list.sort((a, b) => {
        const xpA = a.arenaXp ?? 0;
        const xpB = b.arenaXp ?? 0;
        if (xpB !== xpA) return xpB - xpA;
        return (b.arenaStreak ?? 0) - (a.arenaStreak ?? 0);
      });
    }

    // Assign rank positions
    const ranked = list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    // Apply Filters
    return ranked.filter((item) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSchool = item.school.toLowerCase().includes(q);
        const matchesDistrict = item.district.toLowerCase().includes(q);
        const matchesGrade = item.grade.toLowerCase().includes(q);
        if (!matchesName && !matchesSchool && !matchesDistrict && !matchesGrade) {
          return false;
        }
      }

      // Grade Category Filter
      if (selectedGradeFilter !== 'all') {
        if (item.gradeCategory !== selectedGradeFilter) return false;
      }

      // District Filter
      if (selectedDistrictFilter !== 'all') {
        if (item.districtKey !== selectedDistrictFilter) return false;
      }

      // Tab specific filter: Exam Type
      if (activeTab === 'exams_quizzes' && examTypeFilter !== 'all') {
        if (examTypeFilter === 'Exam' && item.examsCount === 0) return false;
        if (examTypeFilter === 'Quiz' && item.quizzesCount === 0) return false;
        if (examTypeFilter === 'Competition' && item.competitionsCount === 0) return false;
      }

      // Tab specific filter: Edu-Arena Game Mode
      if (activeTab === 'edu_arena_studio' && arenaModeFilter !== 'all') {
        if (item.preferredMode !== arenaModeFilter) return false;
      }

      return true;
    });
  }, [
    students,
    results,
    competitions,
    currentAuthUser,
    currentStudent,
    activeTab,
    searchQuery,
    selectedGradeFilter,
    selectedDistrictFilter,
    examTypeFilter,
    arenaModeFilter,
  ]);

  // Current user's live position in processed leaderboard (only for real student participants)
  const currentUserStanding = useMemo(() => {
    // If the logged in user is admin / super_admin, they are not a student competitor
    if (currentAuthUser?.role === 'super_admin' || currentAuthUser?.role === 'admin') {
      return null;
    }
    return processedLeaderboard.find((p) => p.isCurrentUser);
  }, [processedLeaderboard, currentAuthUser]);

  // Top 3 Podium Winners
  const top1 = processedLeaderboard[0];
  const top2 = processedLeaderboard[1];
  const top3 = processedLeaderboard[2];

  const handleCopyReferralCode = () => {
    const code = currentStudent?.referralCode || currentAuthUser?.referralCode || 'HNC-STUDENT';
    navigator.clipboard.writeText(code);
    setCopiedCodeToast(true);
    setTimeout(() => setCopiedCodeToast(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. HERO HEADER WITH STATS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-indigo-900/60">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                {language === 'ta'
                  ? 'தேசிய அதிகாரப்பூர்வ தரவரிசைப் பலகை மையம் 🇱🇰'
                  : language === 'si'
                  ? 'ජාතික නිල නායකත්ව පුවරුව 🇱🇰'
                  : 'Sri Lanka National Academic Leaderboards 🇱🇰'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {language === 'ta' ? (
                <>
                  மாணவர் தரவரிசை & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400">அரங்க சாம்பியன்ஸ்</span>
                </>
              ) : (
                <>
                  Champions & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400">National Leaderboards</span>
                </>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'ta'
                ? 'பரீட்சைகள், வினாடி வினாக்கள், தூதுவர் பரிந்துரைகள், 25 மாவட்ட தீவுப் பயணம் மற்றும் Edu-Arena கேமிங் ஸ்டுடியோ ஆகியவற்றின் நேரடி மதிப்பீடுகள்.'
                : 'Real-time performance rankings across Academic Exams, Speed Quizzes, Ambassador Referrals, 25 Districts Island Quest, and Edu-Arena Gaming Studio.'}
            </p>
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-lg font-black text-white">
                  {processedLeaderboard.length}
                </span>
                <span className="block text-[11px] text-slate-300 font-medium">
                  {language === 'ta' ? 'பங்கேற்ற மாணவர்கள்' : 'Ranked Scholars'}
                </span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-lg font-black text-emerald-300">
                  {processedLeaderboard.length > 0 ? new Set(processedLeaderboard.map((p) => p.districtKey)).size : 0} / 25
                </span>
                <span className="block text-[11px] text-slate-300 font-medium">
                  {language === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FOUR CORE LEADERBOARD TABS */}
        <div className="mt-8 pt-6 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Tab 1: All Exam, Quiz, Competition Leaderboard */}
          <button
            id="tab-btn-exams-quizzes"
            onClick={() => setActiveTab('exams_quizzes')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-3 rounded-2xl font-bold text-xs transition-all text-center sm:text-left ${
              activeTab === 'exams_quizzes'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/80 scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'exams_quizzes' ? 'text-white' : 'text-blue-400'}`} />
            <div className="min-w-0">
              <span className="block truncate font-extrabold text-[12px]">
                {language === 'ta' ? 'தேர்வு & வினாடி-வினா' : 'Exams, Quizzes & Contests'}
              </span>
              <span className="hidden sm:block text-[10px] opacity-80 truncate">
                {language === 'ta' ? 'அனைத்து போட்டிகள்' : 'Academic Rankings'}
              </span>
            </div>
          </button>

          {/* Tab 2: Referral Points Leaderboard */}
          <button
            id="tab-btn-referrals"
            onClick={() => setActiveTab('referrals')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-3 rounded-2xl font-bold text-xs transition-all text-center sm:text-left ${
              activeTab === 'referrals'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/40 ring-2 ring-amber-400/80 scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Gift className={`w-4 h-4 ${activeTab === 'referrals' ? 'text-white' : 'text-amber-400'}`} />
            <div className="min-w-0">
              <span className="block truncate font-extrabold text-[12px]">
                {language === 'ta' ? 'பரிந்துரை புள்ளிகள்' : 'Referral Points Hub'}
              </span>
              <span className="hidden sm:block text-[10px] opacity-80 truncate">
                {language === 'ta' ? 'மாணவர் தூதுவர்கள்' : 'Ambassador Leaderboard'}
              </span>
            </div>
          </button>

          {/* Tab 3: Island Quest 25 Districts Leaderboard */}
          <button
            id="tab-btn-island-quest"
            onClick={() => setActiveTab('island_quest')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-3 rounded-2xl font-bold text-xs transition-all text-center sm:text-left ${
              activeTab === 'island_quest'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-400/80 scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Compass className={`w-4 h-4 ${activeTab === 'island_quest' ? 'text-white' : 'text-emerald-400'}`} />
            <div className="min-w-0">
              <span className="block truncate font-extrabold text-[12px]">
                {language === 'ta' ? 'தீவு ஆய்வு (25 மாவட்டங்கள்)' : 'Island Quest Leaderboard'}
              </span>
              <span className="hidden sm:block text-[10px] opacity-80 truncate">
                {language === 'ta' ? 'மாவட்ட மகுடங்கள்' : '25 Districts Dominance'}
              </span>
            </div>
          </button>

          {/* Tab 4: HNC Edu-Arena: Study Gaming Mode Studio */}
          <button
            id="tab-btn-edu-arena-studio"
            onClick={() => setActiveTab('edu_arena_studio')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-3 rounded-2xl font-bold text-xs transition-all text-center sm:text-left ${
              activeTab === 'edu_arena_studio'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-purple-400/80 scale-[1.02]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Gamepad2 className={`w-4 h-4 ${activeTab === 'edu_arena_studio' ? 'text-white' : 'text-purple-400'}`} />
            <div className="min-w-0">
              <span className="block truncate font-extrabold text-[12px]">
                {language === 'ta' ? 'Edu-Arena கேமிங் ஸ்டுடியோ' : 'Edu-Arena Gaming Studio'}
              </span>
              <span className="hidden sm:block text-[10px] opacity-80 truncate">
                {language === 'ta' ? 'மின்னல் வேகப் போர்' : 'Kahoot & Quizizz Arena'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. YOUR STANDING CARD (HIGHLIGHTS ACTIVE USER'S STATS IN CHOSEN TAB) */}
      {currentUserStanding && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/30">
                  #{currentUserStanding.rank}
                </div>
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-white shadow-xs">
                  YOU
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {currentUserStanding.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {currentUserStanding.grade}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {currentUserStanding.school} • {currentUserStanding.district}
                </p>
              </div>
            </div>

            {/* Tab specific dynamic performance metric pill */}
            <div className="flex items-center gap-3 sm:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-indigo-200/60">
              {activeTab === 'exams_quizzes' && (
                <>
                  <div className="text-center md:text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {language === 'ta' ? 'மொத்த மதிப்பெண்கள்' : 'Total Score'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-blue-700">
                      {currentUserStanding.totalScore.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {language === 'ta' ? 'துல்லியம்' : 'Accuracy'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-600">
                      {currentUserStanding.accuracyRate}%
                    </span>
                  </div>
                  <button
                    onClick={() => setStudentNav('Competitions')}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all shrink-0"
                  >
                    <span>{language === 'ta' ? 'போட்டிக்கு செல்' : 'Take Exam'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {activeTab === 'referrals' && (
                <>
                  <div className="text-center md:text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {language === 'ta' ? 'பரிந்துரை புள்ளிகள்' : 'Referral Points'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-amber-600">
                      {currentUserStanding.referralPoints} pts
                    </span>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {language === 'ta' ? 'அழைத்த நண்பர்கள்' : 'Invited Friends'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-indigo-700">
                      {currentUserStanding.referralsCount} Students
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyReferralCode}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0"
                    >
                      {copiedCodeToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCodeToast ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                    <button
                      onClick={() => setShareModalOpen(true)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'பகிர்க' : 'Share'}</span>
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'island_quest' && (
                <>
                  <div className="text-center md:text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {language === 'ta' ? 'வென்ற மாவட்டங்கள்' : 'Conquered'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-700">
                      {currentUserStanding.conqueredDistricts} / 25
                    </span>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {language === 'ta' ? 'தீவு XP' : 'Island Quest XP'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-teal-600">
                      {(currentUserStanding.questXp ?? 0).toLocaleString()} XP
                    </span>
                  </div>
                  <button
                    onClick={() => setStudentNav('Edu-Arena Quest')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0"
                  >
                    <span>{language === 'ta' ? 'தீவுப் பயணம் செல்' : 'Launch Island Quest'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {activeTab === 'edu_arena_studio' && (
                <>
                  <div className="text-center md:text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {language === 'ta' ? 'அரங்க XP' : 'Arena XP'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-purple-700">
                      {(currentUserStanding.arenaXp ?? 0).toLocaleString()} XP
                    </span>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {language === 'ta' ? 'ஸ்ட்ரீக்' : 'Streak'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-rose-600 flex items-center gap-0.5 justify-center md:justify-end">
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                      {currentUserStanding.arenaStreak}x
                    </span>
                  </div>
                  <button
                    onClick={() => setStudentNav('Edu-Arena Quest')}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all shrink-0"
                  >
                    <span>{language === 'ta' ? 'அரங்கில் விளையாடு' : 'Play Gaming Mode'}</span>
                    <Gamepad2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. PODIUM SHOWCASE (TOP 3 RANK HOLDERS) */}
      <div className="bg-gradient-to-b from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="text-center max-w-lg mx-auto mb-8 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            <Trophy className="w-3.5 h-3.5" />
            <span>
              {activeTab === 'exams_quizzes' && (language === 'ta' ? 'அகில இலங்கை தேர்வு மேதைகள்' : 'All-Island Academic Laureates')}
              {activeTab === 'referrals' && (language === 'ta' ? 'சிறந்த தேசிய மாணவர் தூதுவர்கள்' : 'Grand Ambassador Champions')}
              {activeTab === 'island_quest' && (language === 'ta' ? '25 மாவட்ட மாமன்னர்கள்' : '25 Districts Grand Sovereigns')}
              {activeTab === 'edu_arena_studio' && (language === 'ta' ? 'Edu-Arena கேமிங் கிராண்ட்மாஸ்டர்ஸ்' : 'Edu-Arena Gaming Grandmasters')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {language === 'ta' ? 'தேசிய வெற்றிக் கம்பளம்' : 'National Honors Podium'}
          </h2>
        </div>

        {/* 3 Pillars of Podium */}
        {!top1 ? (
          <div className="py-10 text-center max-w-md mx-auto space-y-2">
            <Trophy className="w-12 h-12 mx-auto text-amber-400/60" />
            <h3 className="text-base font-bold text-white">
              {language === 'ta' ? 'இன்னும் தரவரிசை முடிவுகள் பதிவாகவில்லை' : 'No Leaderboard Records Yet'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'ta'
                ? 'மாணவர்கள் தேர்வுகள், வினாடி-வினாக்கள் மற்றும் போட்டிகளில் பங்குபற்றும் போது தானாகவே இங்கு தேசிய தரவரிசைப் பட்டியல் நேரலையாகப் புதுப்பிக்கப்படும்.'
                : 'Rankings will appear here live as students complete exams, quizzes, or competitions.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end max-w-4xl mx-auto">
            {/* Rank 2 (Silver) */}
            {top2 && (
              <div className="order-2 md:order-1 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-slate-400/30 text-center flex flex-col items-center relative transition-all group">
                <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center absolute -top-3 shadow-md border-2 border-white">
                  #2
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 flex items-center justify-center font-black text-xl mb-3 shadow-lg shadow-slate-500/20 border-2 border-slate-200">
                  🥈
                </div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                  {top2.name}
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{top2.school}</p>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">{top2.district}</span>

                <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">
                    {activeTab === 'exams_quizzes' ? 'Score' : activeTab === 'referrals' ? 'Points' : 'XP'}
                  </span>
                  <span className="text-slate-200 font-extrabold">
                    {activeTab === 'exams_quizzes'
                      ? `${top2.totalScore.toLocaleString()} pts`
                      : activeTab === 'referrals'
                      ? `${top2.referralPoints} pts`
                      : activeTab === 'island_quest'
                      ? `${(top2.questXp ?? 0).toLocaleString()} XP`
                      : `${(top2.arenaXp ?? 0).toLocaleString()} XP`}
                  </span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Elevated) */}
            {top1 && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 via-slate-800/80 to-slate-900/90 backdrop-blur-md rounded-3xl p-6 border-2 border-amber-400/80 text-center flex flex-col items-center relative shadow-2xl shadow-amber-500/20 -translate-y-2 transition-all">
                <Crown className="w-8 h-8 text-amber-400 absolute -top-5 animate-bounce drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)]" />
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border-2 border-white mb-2">
                  #1
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl mb-3 shadow-xl shadow-amber-500/40 border-4 border-amber-200">
                  👑
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider mb-1">
                  National #1 Champion
                </span>
                <h4 className="font-black text-base text-white">{top1.name}</h4>
                <p className="text-xs text-amber-100/80 mt-0.5 line-clamp-1">{top1.school}</p>
                <span className="text-[11px] font-semibold text-slate-300 mt-1">{top1.district}</span>

                <div className="mt-4 pt-3 border-t border-amber-400/30 w-full flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-200">
                    {activeTab === 'exams_quizzes' ? 'Total Marks' : activeTab === 'referrals' ? 'Ambassador Points' : 'Champion XP'}
                  </span>
                  <span className="text-amber-300 text-base font-black">
                    {activeTab === 'exams_quizzes'
                      ? `${top1.totalScore.toLocaleString()} pts`
                      : activeTab === 'referrals'
                      ? `${top1.referralPoints} pts`
                      : activeTab === 'island_quest'
                      ? `${(top1.questXp ?? 0).toLocaleString()} XP`
                      : `${(top1.arenaXp ?? 0).toLocaleString()} XP`}
                  </span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <div className="order-3 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-amber-700/40 text-center flex flex-col items-center relative transition-all group">
                <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center absolute -top-3 shadow-md border-2 border-white">
                  #3
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 text-amber-100 flex items-center justify-center font-black text-xl mb-3 shadow-lg shadow-amber-800/20 border-2 border-amber-500">
                  🥉
                </div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                  {top3.name}
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{top3.school}</p>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">{top3.district}</span>

                <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">
                    {activeTab === 'exams_quizzes' ? 'Score' : activeTab === 'referrals' ? 'Points' : 'XP'}
                  </span>
                  <span className="text-amber-400 font-extrabold">
                    {activeTab === 'exams_quizzes'
                      ? `${top3.totalScore.toLocaleString()} pts`
                      : activeTab === 'referrals'
                      ? `${top3.referralPoints} pts`
                      : activeTab === 'island_quest'
                      ? `${(top3.questXp ?? 0).toLocaleString()} XP`
                      : `${(top3.arenaXp ?? 0).toLocaleString()} XP`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. SEARCH & FILTER CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-leaderboard-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'மாணவர் பெயர், பாடசாலை அல்லது மாவட்டம் தேடுக...'
                  : 'Search by student name, school, district...'
              }
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Grade Level Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              id="filter-grade-select"
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">{language === 'ta' ? 'அனைத்து தரங்கள் (All Grades)' : 'All Grade Categories'}</option>
              <option value="primary">{language === 'ta' ? 'Grade 1-5 (Primary / புலமைப்பரிசில்)' : 'Grade 1-5 Primary'}</option>
              <option value="junior">{language === 'ta' ? 'Grade 6-9 (Junior Secondary)' : 'Grade 6-9 Junior'}</option>
              <option value="senior">{language === 'ta' ? 'Grade 10-11 (O/L Senior)' : 'Grade 10-11 O/L'}</option>
              <option value="advanced">{language === 'ta' ? 'Grade 12-13 (A/L Advanced)' : 'Grade 12-13 A/L'}</option>
              <option value="after_school">{language === 'ta' ? 'போட்டிப் பரீட்சைகள் (Competitive Exams)' : 'After School & Competitive'}</option>
            </select>

            {/* 25 Districts Filter */}
            <select
              id="filter-district-select"
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">{language === 'ta' ? 'அனைத்து 25 மாவட்டங்கள்' : 'All 25 Districts'}</option>
              {SRI_LANKA_25_DISTRICTS.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {language === 'ta' ? dist.nameTa : dist.nameEn} ({dist.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Specific Sub-Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          {activeTab === 'exams_quizzes' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 mr-1">
                {language === 'ta' ? 'போட்டி வகை:' : 'Type:'}
              </span>
              {[
                { id: 'all', label: language === 'ta' ? 'அனைத்தும்' : 'All Contests' },
                { id: 'Exam', label: language === 'ta' ? 'பரீட்சைகள் (Exams)' : 'Exams' },
                { id: 'Quiz', label: language === 'ta' ? 'வினாடி வினாக்கள் (Quizzes)' : 'Quizzes' },
                { id: 'Competition', label: language === 'ta' ? 'ஒலிம்பியாட்கள் (Competitions)' : 'Competitions' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setExamTypeFilter(opt.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    examTypeFilter === opt.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'edu_arena_studio' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 mr-1">
                {language === 'ta' ? 'கேமிங் வடிவம்:' : 'Gaming Mode:'}
              </span>
              {[
                { id: 'all', label: language === 'ta' ? 'அனைத்து வடிவங்கள்' : 'All Modes' },
                { id: 'kahoot', label: '▲ Speed Rush (Kahoot)' },
                { id: 'quizizz', label: '⚡ Power Battle (Quizizz)' },
                { id: 'trivia_crack', label: '🎡 Wheel Duel (Trivia)' },
                { id: 'brain_out', label: '🧠 Brain Logic (IQ)' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setArenaModeFilter(m.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    arenaModeFilter === m.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {language === 'ta'
                  ? 'ஒவ்வொரு வெற்றிகரமான பதிவிற்கும் +50 புள்ளிகள் மற்றும் சிறப்பு சான்றிதழ்!'
                  : 'Earn +50 Points for every friend who joins & attempts an academic challenge!'}
              </span>
            </div>
          )}

          {activeTab === 'island_quest' && (
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <Compass className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {language === 'ta'
                  ? '25 மாவட்டங்களையும் வென்று இலங்கை தேசிய மகுடத்தைச் சூடுங்கள்!'
                  : 'Conquer all 25 districts to claim the Golden Ceylon Academic Sovereign Crown!'}
              </span>
            </div>
          )}

          <div className="text-[11px] text-slate-400 font-medium ml-auto">
            {processedLeaderboard.length} {language === 'ta' ? 'மாணவர்கள் பட்டியலில்' : 'Participants Ranked'}
          </div>
        </div>
      </div>

      {/* 6. COMPLETE RANKINGS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 w-14 text-center">#</th>
                <th className="py-3.5 px-4">{language === 'ta' ? 'மாணவர் விவரம்' : 'Student & Academy'}</th>
                <th className="py-3.5 px-4">{language === 'ta' ? 'மாவட்டம் & தரம்' : 'District & Grade'}</th>
                <th className="py-3.5 px-4 text-center">
                  {activeTab === 'exams_quizzes' && (language === 'ta' ? 'போட்டிகள்' : 'Participated')}
                  {activeTab === 'referrals' && (language === 'ta' ? 'நண்பர்கள்' : 'Referrals')}
                  {activeTab === 'island_quest' && (language === 'ta' ? 'மாவட்டங்கள்' : 'Districts')}
                  {activeTab === 'edu_arena_studio' && (language === 'ta' ? 'ஸ்ட்ரீக்' : 'Streak Fire')}
                </th>
                <th className="py-3.5 px-4 text-right">
                  {activeTab === 'exams_quizzes' && (language === 'ta' ? 'மொத்த மதிப்பெண்கள்' : 'Total Score')}
                  {activeTab === 'referrals' && (language === 'ta' ? 'பரிந்துரை புள்ளிகள்' : 'Referral Points')}
                  {activeTab === 'island_quest' && (language === 'ta' ? 'தீவு XP' : 'Quest XP')}
                  {activeTab === 'edu_arena_studio' && (language === 'ta' ? 'அரங்க XP' : 'Arena Battle XP')}
                </th>
                <th className="py-3.5 px-4 text-right">
                  {activeTab === 'exams_quizzes' && (language === 'ta' ? 'துல்லியம்' : 'Accuracy')}
                  {activeTab === 'referrals' && (language === 'ta' ? 'தூதுவர் அடுக்கு' : 'Ambassador Tier')}
                  {activeTab === 'island_quest' && (language === 'ta' ? 'மகுடங்கள்' : 'Crowns')}
                  {activeTab === 'edu_arena_studio' && (language === 'ta' ? 'வேக சாதனை' : 'Best Speed')}
                </th>
                <th className="py-3.5 px-4 text-center">{language === 'ta' ? 'கௌரவ நிலை' : 'Honors / Title'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Trophy className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span className="block font-semibold">
                      {language === 'ta' ? 'வடிகட்டலுக்கு ஏற்ப மாணவர்கள் எவருமில்லை' : 'No ranked students match your filter'}
                    </span>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedGradeFilter('all');
                        setSelectedDistrictFilter('all');
                        setExamTypeFilter('all');
                        setArenaModeFilter('all');
                      }}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                    >
                      {language === 'ta' ? 'வடிகட்டல்களை மீட்டமைக்க' : 'Reset all filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                processedLeaderboard.map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;
                  const isUser = item.isCurrentUser;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isUser
                          ? 'bg-blue-50/80 font-bold border-y border-blue-200'
                          : isTop1
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black inline-flex items-center justify-center shadow-xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-black inline-flex items-center justify-center shadow-xs">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black inline-flex items-center justify-center shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="font-extrabold text-slate-600">
                            {item.rank}
                          </span>
                        )}
                      </td>

                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isUser
                                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                : isTop1
                                ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 truncate">
                                {item.name}
                              </span>
                              {isUser && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-200 text-blue-900 font-extrabold">
                                  YOU
                                </span>
                              )}
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            </div>
                            <span className="block text-[11px] text-slate-500 truncate">
                              {item.school}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* District & Grade */}
                      <td className="py-3.5 px-4">
                        <span className="block font-semibold text-slate-800">
                          {item.district}
                        </span>
                        <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5">
                          {item.grade}
                        </span>
                      </td>

                      {/* Center Metric */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {activeTab === 'exams_quizzes' && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.contestsTaken} Contests
                          </span>
                        )}
                        {activeTab === 'referrals' && (
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60">
                            {item.referralsCount ?? 0} Friends
                          </span>
                        )}
                        {activeTab === 'island_quest' && (
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            {item.conqueredDistricts ?? 0} / 25
                          </span>
                        )}
                        {activeTab === 'edu_arena_studio' && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200/60">
                            <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                            {item.arenaStreak ?? 0}x
                          </span>
                        )}
                      </td>

                      {/* Primary Score / Points / XP */}
                      <td className="py-3.5 px-4 text-right">
                        {activeTab === 'exams_quizzes' && (
                          <span className="font-black text-blue-700 text-sm">
                            {item.totalScore.toLocaleString()} pts
                          </span>
                        )}
                        {activeTab === 'referrals' && (
                          <span className="font-black text-amber-600 text-sm">
                            {(item.referralPoints ?? 0).toLocaleString()} pts
                          </span>
                        )}
                        {activeTab === 'island_quest' && (
                          <span className="font-black text-emerald-700 text-sm">
                            {(item.questXp ?? 0).toLocaleString()} XP
                          </span>
                        )}
                        {activeTab === 'edu_arena_studio' && (
                          <span className="font-black text-purple-700 text-sm">
                            {(item.arenaXp ?? 0).toLocaleString()} XP
                          </span>
                        )}
                      </td>

                      {/* Secondary Metric */}
                      <td className="py-3.5 px-4 text-right">
                        {activeTab === 'exams_quizzes' && (
                          <span className="font-bold text-emerald-600">
                            {item.accuracyRate}%
                          </span>
                        )}
                        {activeTab === 'referrals' && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              item.ambassadorTier === 'Diamond'
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                : item.ambassadorTier === 'Gold'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : item.ambassadorTier === 'Silver'
                                ? 'bg-slate-100 text-slate-800 border-slate-200'
                                : 'bg-orange-50 text-orange-800 border-orange-200'
                            }`}
                          >
                            {item.ambassadorTier || 'Bronze'}
                          </span>
                        )}
                        {activeTab === 'island_quest' && (
                          <span className="font-bold text-amber-600 flex items-center gap-1 justify-end">
                            <Crown className="w-3 h-3 text-amber-500" />
                            {item.crownsCount ?? 0}
                          </span>
                        )}
                        {activeTab === 'edu_arena_studio' && (
                          <span className="font-bold text-slate-600">
                            {item.bestSpeedSeconds ? `${item.bestSpeedSeconds}s` : '6.5s'}
                          </span>
                        )}
                      </td>

                      {/* Honors / Badges Title */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            🏆 All-Island #1
                          </span>
                        ) : isTop2 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-300">
                            🥈 Silver Laureate
                          </span>
                        ) : isTop3 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200">
                            🥉 Bronze Medalist
                          </span>
                        ) : item.rank <= 5 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            ⭐ Top 5 Honor
                          </span>
                        ) : item.rank <= 10 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                            ✨ Top 10 Star
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Scholar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal Integration */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        customReferralCode={currentStudent?.referralCode || currentAuthUser?.referralCode}
      />
    </div>
  );
};
