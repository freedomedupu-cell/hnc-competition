import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Trophy,
  Award,
  Medal,
  Sparkles,
  Zap,
  Target,
  Crown,
  Flame,
  ShieldCheck,
  Compass,
  Gift,
  Lock,
  CheckCircle2,
  Share2,
  X,
  Star,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react';

export interface MilestoneBadge {
  id: string;
  category: 'competition' | 'quest' | 'social';
  titleEn: string;
  titleTa: string;
  titleSi: string;
  descriptionEn: string;
  descriptionTa: string;
  descriptionSi: string;
  icon: React.ReactNode;
  iconBgUnlocked: string;
  borderUnlocked: string;
  badgePillColor: string;
  unlocked: boolean;
  unlockedDate?: string;
  progressCurrent: number;
  progressMax: number;
  perkRewardPoints: number;
}

export const StudentAchievements: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentStudent, results = [], language } = useApp();
  const [selectedBadge, setSelectedBadge] = useState<MilestoneBadge | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'competition' | 'quest' | 'social'>('all');
  const [showShareToast, setShowShareToast] = useState(false);

  // Derive student specific results
  const studentResults = useMemo(() => {
    return results.filter(
      (r) =>
        r.studentId === currentStudent.id ||
        r.studentId === currentStudent.studentId ||
        r.studentName?.toLowerCase() === currentStudent.name?.toLowerCase()
    );
  }, [results, currentStudent]);

  // Derive district quest completed count from localStorage
  const completedDistrictsCount = useMemo(() => {
    try {
      const saved = localStorage.getItem(`district_quest_progress_v2_${currentStudent.id || currentStudent.studentId || 'def'}`) ||
        localStorage.getItem('district_quest_progress_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => item.completed || item.status === 'Completed').length;
        }
      }
    } catch {
      // ignore
    }
    return 0;
  }, [currentStudent]);

  // Check achievement conditions
  const hasFirstCompetition = studentResults.length > 0 || (currentStudent.competitionsEnrolled || 0) > 0;
  
  const top10Results = studentResults.filter((r) => typeof r.rank === 'number' && r.rank <= 10 && r.rank > 0);
  const hasTop10 = top10Results.length > 0;

  const perfectScoreResults = studentResults.filter(
    (r) => (typeof r.score === 'number' && r.score >= 100) || (r.percentage ?? 0) >= 100 || (r.accuracy ?? 0) >= 100
  );
  const hasPerfectScore = perfectScoreResults.length > 0;

  const goldResults = studentResults.filter((r) => r.rank === 1);
  const hasGold = goldResults.length > 0;

  const silverResults = studentResults.filter((r) => r.rank === 2);
  const hasSilver = silverResults.length > 0;

  const bronzeResults = studentResults.filter((r) => r.rank === 3);
  const hasBronze = bronzeResults.length > 0;

  const hasSpeedMaster = studentResults.some(
    (r) => ((r.percentage ?? 0) >= 80 || (r.accuracy ?? 0) >= 80) && Boolean(r.timeTakenSeconds && r.timeTakenSeconds < 600)
  );

  const enrolledCount = Math.max(currentStudent.competitionsEnrolled || 0, studentResults.length);
  const hasStreak = enrolledCount >= 3;

  const referralPoints = currentStudent.referralPoints || 0;
  const hasReferralPoints = referralPoints >= 100;

  const isVerified = Boolean(currentStudent.studentId && currentStudent.institution);

  // Construct Badges list
  const badges: MilestoneBadge[] = useMemo(() => {
    return [
      {
        id: 'first_competition',
        category: 'competition',
        titleEn: 'First Competition',
        titleTa: 'முதல் போட்டிப் பங்கேற்பு',
        titleSi: 'පළමු තරඟ සහභාගීත්වය',
        descriptionEn: 'Participate and submit your first official competition or live exam.',
        descriptionTa: 'உங்கள் முதலாவது அதிகாரப்பூர்வ தேர்வில் வெற்றிகரமாகப் பங்கேற்கவும்.',
        descriptionSi: 'ඔබගේ පළමු නිල තරඟ විභාගයට මුහුණ දී සම්පූර්ණ කරන්න.',
        icon: <Target className="w-6 h-6 text-emerald-500" />,
        iconBgUnlocked: 'bg-emerald-500/10 text-emerald-600',
        borderUnlocked: 'border-emerald-300/80 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50',
        badgePillColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        unlocked: hasFirstCompetition,
        unlockedDate: hasFirstCompetition ? 'Unlocked' : undefined,
        progressCurrent: hasFirstCompetition ? 1 : 0,
        progressMax: 1,
        perkRewardPoints: 50,
      },
      {
        id: 'top_10',
        category: 'competition',
        titleEn: 'Top 10 Finisher',
        titleTa: 'சிறந்த 10 வெற்றியாளர்',
        titleSi: 'ඉහළම 10 දෙනා අතරට',
        descriptionEn: 'Achieve a rank in the top 10 on an official leaderboard.',
        descriptionTa: 'தேசிய அல்லது மாவட்ட தரவரிசையில் முதல் 10 இடங்களில் இடம் பெறவும்.',
        descriptionSi: 'නිල ශ්‍රේණිගත කිරීමේ සටහනේ ඉහළම 10 දෙනා අතරට පැමිණෙන්න.',
        icon: <Trophy className="w-6 h-6 text-indigo-500" />,
        iconBgUnlocked: 'bg-indigo-500/10 text-indigo-600',
        borderUnlocked: 'border-indigo-300/80 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50',
        badgePillColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        unlocked: hasTop10,
        unlockedDate: hasTop10 ? 'Unlocked' : undefined,
        progressCurrent: hasTop10 ? 1 : 0,
        progressMax: 1,
        perkRewardPoints: 100,
      },
      {
        id: 'perfect_score',
        category: 'competition',
        titleEn: 'Perfect Score',
        titleTa: '100% பூரண மதிப்பெண்',
        titleSi: 'පූර්ණ ලකුණු 100%',
        descriptionEn: 'Achieve 100% accuracy or full score in an exam or quest.',
        descriptionTa: 'தேர்வில் 100% பூரண மதிப்பெண்களைப் பெற்றுச் சாதனை படைக்கவும்.',
        descriptionSi: 'විභාගයකදී 100% පූර්ණ ලකුණු ලබා ගන්න.',
        icon: <Sparkles className="w-6 h-6 text-amber-500" />,
        iconBgUnlocked: 'bg-amber-500/10 text-amber-600',
        borderUnlocked: 'border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-white to-slate-50',
        badgePillColor: 'bg-amber-100 text-amber-800 border-amber-300',
        unlocked: hasPerfectScore,
        unlockedDate: hasPerfectScore ? 'Unlocked' : undefined,
        progressCurrent: hasPerfectScore ? 1 : 0,
        progressMax: 1,
        perkRewardPoints: 150,
      },
      {
        id: 'gold_champion',
        category: 'competition',
        titleEn: 'Gold Champion',
        titleTa: 'தங்கச் சம்பியன்',
        titleSi: 'රන් ශූරයා',
        descriptionEn: 'Secure Rank #1 Gold Podium in an active competition.',
        descriptionTa: 'போட்டித் தரவரிசையில் முதலாவது தங்கப் பதக்கம் வெல்லவும்.',
        descriptionSi: 'තරඟයක ප්‍රථම ස්ථානය රන් පදක්කම හිමිකර ගන්න.',
        icon: <Crown className="w-6 h-6 text-yellow-500" />,
        iconBgUnlocked: 'bg-yellow-500/15 text-amber-600',
        borderUnlocked: 'border-yellow-400/80 bg-gradient-to-br from-amber-100/60 via-yellow-50/40 to-white',
        badgePillColor: 'bg-amber-200 text-amber-900 border-amber-400 font-extrabold',
        unlocked: hasGold,
        unlockedDate: hasGold ? 'Unlocked' : undefined,
        progressCurrent: hasGold ? 1 : 0,
        progressMax: 1,
        perkRewardPoints: 300,
      },
      {
        id: 'silver_medalist',
        category: 'competition',
        titleEn: 'Silver Medalist',
        titleTa: 'வெள்ளிப் பதக்கம்',
        titleSi: 'රිදී පදක්කම්ලාභියා',
        descriptionEn: 'Secure Rank #2 Silver Podium on the leaderboard.',
        descriptionTa: 'போட்டியில் 2ம் இடம் பெற்று வெள்ளிப் பதக்கம் பெறவும்.',
        descriptionSi: 'දෙවන ස්ථානය රිදී පදක්කම දිනා ගන්න.',
        icon: <Medal className="w-6 h-6 text-slate-400" />,
        iconBgUnlocked: 'bg-slate-300/20 text-slate-600',
        borderUnlocked: 'border-slate-300 bg-gradient-to-br from-slate-100/80 via-white to-slate-50',
        badgePillColor: 'bg-slate-200 text-slate-800 border-slate-300',
        unlocked: hasSilver,
        unlockedDate: hasSilver ? 'Unlocked' : undefined,
        progressCurrent: hasSilver ? 1 : 0,
        progressMax: 1,
        perkRewardPoints: 200,
      },
      {
        id: 'bronze_medalist',
        category: 'competition',
        titleEn: 'Bronze Contender',
        titleTa: 'வெண்கலப் பதக்கம்',
        titleSi: 'ලෝකඩ පදක්කම්ලාභියා',
        descriptionEn: 'Secure Rank #3 Bronze Podium in a live exam.',
        descriptionTa: 'போட்டியில் 3ம் இடம் பெற்று வெண்கலப் பதக்கம் பெறவும்.',
        descriptionSi: 'තෙවන ස්ථානය ලෝකඩ පදක්කම හිමිකර ගන්න.',
        icon: <Award className="w-6 h-6 text-amber-700" />,
        iconBgUnlocked: 'bg-amber-700/10 text-amber-800',
        borderUnlocked: 'border-amber-400/60 bg-gradient-to-br from-amber-50/80 via-white to-slate-50',
        badgePillColor: 'bg-amber-100 text-amber-900 border-amber-300',
        unlocked: hasBronze,
        unlockedDate: hasBronze ? 'Unlocked' : undefined,
        progressCurrent: hasBronze ? 1 : 0,
        progressMax: 1,
        perkRewardPoints: 100,
      },
      {
        id: 'district_explorer',
        category: 'quest',
        titleEn: 'District Explorer',
        titleTa: 'மாவட்ட ஆய்வு சாதனையாளர்',
        titleSi: 'දිස්ත්‍රික් ගවේෂක',
        descriptionEn: 'Clear 5 or more Sri Lanka District Quest levels.',
        descriptionTa: 'இலங்கையின் 5 மாவட்ட கல்வி சவால்களை நிறைவு செய்ய வேண்டும்.',
        descriptionSi: 'ශ්‍රී ලංකා දිස්ත්‍රික්ක 5ක අධ්‍යයන අභියෝග ජය ගන්න.',
        icon: <Compass className="w-6 h-6 text-cyan-600" />,
        iconBgUnlocked: 'bg-cyan-500/10 text-cyan-600',
        borderUnlocked: 'border-cyan-300/80 bg-gradient-to-br from-cyan-50/50 via-white to-slate-50',
        badgePillColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        unlocked: completedDistrictsCount >= 5,
        progressCurrent: Math.min(completedDistrictsCount, 5),
        progressMax: 5,
        perkRewardPoints: 120,
      },
      {
        id: 'district_master',
        category: 'quest',
        titleEn: '25 Districts Conqueror',
        titleTa: '25 மாவட்ட மாஸ்டர்',
        titleSi: 'දිස්ත්‍රික්ක 25ම ජයග්‍රාහකයා',
        descriptionEn: 'Complete all 25 District Quest levels across Sri Lanka.',
        descriptionTa: 'இலங்கையின் அனைத்து 25 மாவட்ட சவால்களையும் வெற்றிகரமாக முடிக்கவும்.',
        descriptionSi: 'ශ්‍රී ලංකාවේ දිස්ත්‍රික්ක 25ම අභියෝග සම්පූර්ණ කරන්න.',
        icon: <Crown className="w-6 h-6 text-purple-600" />,
        iconBgUnlocked: 'bg-purple-500/10 text-purple-600',
        borderUnlocked: 'border-purple-300/80 bg-gradient-to-br from-purple-50/50 via-white to-slate-50',
        badgePillColor: 'bg-purple-100 text-purple-800 border-purple-300',
        unlocked: completedDistrictsCount >= 25,
        progressCurrent: Math.min(completedDistrictsCount, 25),
        progressMax: 25,
        perkRewardPoints: 500,
      },
      {
        id: 'speed_master',
        category: 'quest',
        titleEn: 'Speed Master',
        titleTa: 'வேக மின்னல் கணிப்பான்',
        titleSi: 'වේගවත් ගණිතඥයා',
        descriptionEn: 'Complete an exam in under 10 minutes with >=80% score.',
        descriptionTa: '10 நிமிடங்களுக்குள் 80%+ மதிப்பெண்களுடன் தேர்வை முடிக்கவும்.',
        descriptionSi: 'මිනිත්තු 10ට අඩු කාලයකින් 80%+ ලකුණු ලබා ගන්න.',
        icon: <Zap className="w-6 h-6 text-rose-500" />,
        iconBgUnlocked: 'bg-rose-500/10 text-rose-600',
        borderUnlocked: 'border-rose-300/80 bg-gradient-to-br from-rose-50/50 via-white to-slate-50',
        badgePillColor: 'bg-rose-100 text-rose-800 border-rose-300',
        unlocked: hasSpeedMaster,
        progressCurrent: hasSpeedMaster ? 1 : 0,
        progressMax: 1,
        perkRewardPoints: 100,
      },
      {
        id: 'competition_streak',
        category: 'competition',
        titleEn: 'Streak Scholar',
        titleTa: 'தொடர் போட்டியாளர்',
        titleSi: 'නිරන්තර තරඟකරු',
        descriptionEn: 'Enroll and participate in 3 or more official competitions.',
        descriptionTa: '3 அல்லது அதற்கு மேற்பட்ட அதிகாரப்பூர்வ போட்டிகளில் பதிவு செய்யவும்.',
        descriptionSi: 'තරඟ 3ක් හෝ ඊට වැඩි ගණනකට සහභාගී වන්න.',
        icon: <Flame className="w-6 h-6 text-orange-500" />,
        iconBgUnlocked: 'bg-orange-500/10 text-orange-600',
        borderUnlocked: 'border-orange-300/80 bg-gradient-to-br from-orange-50/50 via-white to-slate-50',
        badgePillColor: 'bg-orange-100 text-orange-800 border-orange-300',
        unlocked: hasStreak,
        progressCurrent: Math.min(enrolledCount, 3),
        progressMax: 3,
        perkRewardPoints: 80,
      },
      {
        id: 'verified_candidate',
        category: 'social',
        titleEn: 'Verified Scholar',
        titleTa: 'சரிபார்க்கப்பட்ட மாணவர்',
        titleSi: 'තහවුරු කළ ශිෂ්‍යයා',
        descriptionEn: 'Complete full academic profile registration with candidate ID.',
        descriptionTa: 'கல்வி நிலையத்தில் அடையாள எண்ணுடன் கணக்கை பதிவு செய்யவும்.',
        descriptionSi: 'අපේක්ෂක හැඳුනුම්පත සමඟ ලියාපදිංචිය තහවුරු කරන්න.',
        icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
        iconBgUnlocked: 'bg-blue-500/10 text-blue-600',
        borderUnlocked: 'border-blue-300/80 bg-gradient-to-br from-blue-50/50 via-white to-slate-50',
        badgePillColor: 'bg-blue-100 text-blue-800 border-blue-300',
        unlocked: isVerified,
        progressCurrent: isVerified ? 1 : 0,
        progressMax: 1,
        perkRewardPoints: 50,
      },
      {
        id: 'referral_champion',
        category: 'social',
        titleEn: 'Knowledge Ambassador',
        titleTa: 'கல்விப் தூதர்',
        titleSi: 'දැනුම තානාපති',
        descriptionEn: 'Earn 100+ referral points by sharing higher education opportunity with peers.',
        descriptionTa: 'நண்பர்களை இணைத்து 100+ பரிந்துரைப் புள்ளிகளை ஈட்டவும்.',
        descriptionSi: 'යහළුවන් හඳුන්වා දී ලකුණු 100ක් ලබා ගන්න.',
        icon: <Gift className="w-6 h-6 text-teal-600" />,
        iconBgUnlocked: 'bg-teal-500/10 text-teal-600',
        borderUnlocked: 'border-teal-300/80 bg-gradient-to-br from-teal-50/50 via-white to-slate-50',
        badgePillColor: 'bg-teal-100 text-teal-800 border-teal-300',
        unlocked: hasReferralPoints,
        progressCurrent: Math.min(referralPoints, 100),
        progressMax: 100,
        perkRewardPoints: 100,
      },
    ];
  }, [
    hasFirstCompetition,
    hasTop10,
    hasPerfectScore,
    hasGold,
    hasSilver,
    hasBronze,
    completedDistrictsCount,
    hasSpeedMaster,
    enrolledCount,
    hasStreak,
    isVerified,
    referralPoints,
    hasReferralPoints,
  ]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const percentageUnlocked = Math.round((unlockedCount / badges.length) * 100);

  const filteredBadges = useMemo(() => {
    if (categoryFilter === 'all') return badges;
    return badges.filter((b) => b.category === categoryFilter);
  }, [badges, categoryFilter]);

  const getTitle = (badge: MilestoneBadge) => {
    if (language === 'ta') return badge.titleTa;
    if (language === 'si') return badge.titleSi;
    return badge.titleEn;
  };

  const getDescription = (badge: MilestoneBadge) => {
    if (language === 'ta') return badge.descriptionTa;
    if (language === 'si') return badge.descriptionSi;
    return badge.descriptionEn;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Overall Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>
                  {language === 'ta'
                    ? 'சாதனைப் பதக்கங்கள் & இலக்குகள்'
                    : language === 'si'
                    ? 'ජයග්‍රහණ සහ පදක්කම්'
                    : 'Milestone Badges & Achievements'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {unlockedCount}/{badges.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'ta'
                  ? 'தேர்வுகள் மற்றும் போட்டிகளில் தேர்ச்சி பெற்று பிரத்யேக முத்திரைகளைத் திறக்கவும்.'
                  : language === 'si'
                  ? 'විභාග සහ අභියෝග ජය ගනිමින් විශේෂ පදක්කම් අගුළු හරින්න.'
                  : 'Track unlocked honors, podium medals, and academic progression milestones.'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress ring or summary bar */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              {language === 'ta' ? 'நிறைவு சதவீதம்' : 'Unlocked Rate'}
            </span>
            <span className="text-sm font-extrabold text-slate-900">{percentageUnlocked}%</span>
          </div>
          <div className="w-12 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentageUnlocked}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {!compact && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'அனைத்தும்' : language === 'si' ? 'සියල්ල' : 'All Badges'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('competition')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'competition'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'போட்டிகள்' : 'Competitions'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('quest')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'quest'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'மாவட்ட ஆய்வு' : 'District Quest'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('social')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              categoryFilter === 'social'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'சுயவிவரம் & சமூக' : 'Profile & Perks'}</span>
          </button>
        </div>
      )}

      {/* Badges Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-3.5`}>
        {filteredBadges.map((badge) => {
          const isUnlocked = badge.unlocked;

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`relative rounded-xl p-4 border transition-all duration-200 cursor-pointer group hover:shadow-md ${
                isUnlocked
                  ? badge.borderUnlocked
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Badge Icon Container */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-xs transition transform group-hover:scale-105 ${
                    isUnlocked
                      ? `${badge.iconBgUnlocked} border-white ring-2 ring-slate-100`
                      : 'bg-slate-200/80 text-slate-400 border-slate-300'
                  }`}
                >
                  {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                {/* Badge Content */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4
                      className={`text-xs font-bold truncate ${
                        isUnlocked ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {getTitle(badge)}
                    </h4>

                    {isUnlocked ? (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.badgePillColor} flex items-center gap-1 shrink-0`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>UNLOCKED</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 shrink-0">
                        LOCKED
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {getDescription(badge)}
                  </p>

                  {/* Progress bar for locked or multi-step badges */}
                  {badge.progressMax > 1 && (
                    <div className="pt-1.5 space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>Progress</span>
                        <span>
                          {badge.progressCurrent}/{badge.progressMax}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isUnlocked ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((badge.progressCurrent / badge.progressMax) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Reward Points Tag */}
              <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span>+{badge.perkRewardPoints} PTS</span>
                </span>
                <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition flex items-center gap-0.5 text-[10px]">
                  <span>Details</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Modal Detail Popup */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Icon Header */}
            <div className="text-center space-y-3 pt-2">
              <div
                className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center border-2 shadow-md ${
                  selectedBadge.unlocked
                    ? `${selectedBadge.iconBgUnlocked} border-white ring-4 ring-amber-100`
                    : 'bg-slate-100 text-slate-400 border-slate-300'
                }`}
              >
                {selectedBadge.unlocked ? (
                  <div className="scale-125">{selectedBadge.icon}</div>
                ) : (
                  <Lock className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{getTitle(selectedBadge)}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedBadge.unlocked
                        ? selectedBadge.badgePillColor
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {selectedBadge.unlocked ? 'UNLOCKED MILESTONE' : 'LOCKED MILESTONE'}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    +{selectedBadge.perkRewardPoints} Points
                  </span>
                </div>
              </div>
            </div>

            {/* Badge Description */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider">
                {language === 'ta' ? 'சாதனை விபரம்' : 'Milestone Description'}
              </span>
              <p className="leading-relaxed">{getDescription(selectedBadge)}</p>
            </div>

            {/* Progress status */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{language === 'ta' ? 'முன்னேற்ற நிலை' : 'Requirement Progress'}</span>
                <span>
                  {selectedBadge.progressCurrent} / {selectedBadge.progressMax}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedBadge.unlocked ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((selectedBadge.progressCurrent / selectedBadge.progressMax) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              {selectedBadge.unlocked && (
                <button
                  type="button"
                  onClick={() => {
                    const shareText = `🏆 I unlocked the '${getTitle(
                      selectedBadge
                    )}' badge on Higher Novas College Exam Portal!`;
                    navigator.clipboard.writeText(shareText);
                    setShowShareToast(true);
                    setTimeout(() => setShowShareToast(false), 2500);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{showShareToast ? 'Copied to Clipboard!' : 'Share Achievement'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
