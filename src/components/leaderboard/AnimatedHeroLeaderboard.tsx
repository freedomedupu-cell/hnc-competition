import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
  MapPin,
  School,
  GraduationCap,
  Coins,
  PartyPopper,
  Zap,
  CheckCircle2,
  ChevronRight,
  Shield,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { SRI_LANKA_25_DISTRICTS } from '../../data/sriLankaDistricts';

interface AnimatedHeroLeaderboardProps {
  onNavigate?: (tab: any) => void;
}

interface RankedStudentItem {
  id: string;
  rank: number;
  name: string;
  school: string;
  district: string;
  districtNameTa?: string;
  districtNameEn?: string;
  grade: string;
  avatarUrl?: string;
  score: number;
  points: number;
  contestsTaken: number;
  accuracy: number;
  isCurrentUser: boolean;
}

export const AnimatedHeroLeaderboard: React.FC<AnimatedHeroLeaderboardProps> = ({
  onNavigate,
}) => {
  const { students, results, currentAuthUser, currentStudent, language } = useApp();
  const [activeMetric, setActiveMetric] = useState<'olympiad' | 'points'>('olympiad');
  const [isPaused, setIsPaused] = useState(false);

  // Trigger celebration confetti
  const handleCelebrate = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6'],
      });
    } catch {}
  };

  // Compile real ranked list from database
  const rankedList: RankedStudentItem[] = useMemo(() => {
    const studentMap = new Map<string, RankedStudentItem>();

    // 1. Ingest registered students
    students.forEach((s) => {
      if (s.id?.startsWith('bm-') || s.id?.includes('demo')) return;

      const normDistrict = (s.district || 'jaffna').toLowerCase().replace(/\s+/g, '_');
      const distObj =
        SRI_LANKA_25_DISTRICTS.find(
          (d) => d.id === normDistrict || d.nameEn.toLowerCase() === normDistrict
        ) || SRI_LANKA_25_DISTRICTS[0];

      const isMe = Boolean(
        (currentAuthUser && (currentAuthUser.uid === s.id || currentAuthUser.email === s.email)) ||
        (currentStudent && (currentStudent.id === s.id || currentStudent.studentId === s.studentId))
      );

      studentMap.set(s.id, {
        id: s.id,
        rank: 0,
        name: s.name || s.fullName || 'Student',
        school: s.institution || s.school || 'Higher Novas College (HNC)',
        district: distObj.nameEn,
        districtNameTa: distObj.nameTa,
        districtNameEn: distObj.nameEn,
        grade: s.gradeLevel || s.grade || 'Grade 10',
        avatarUrl: s.avatarUrl,
        score: 0,
        points: s.referralPoints !== undefined ? s.referralPoints : 25,
        contestsTaken: 0,
        accuracy: 0,
        isCurrentUser: isMe,
      });
    });

    // 2. Accumulate real results from Cloud Firestore
    const scoreMap = new Map<string, { totalScore: number; count: number; totalPercent: number }>();
    results.forEach((r) => {
      if (r.id?.includes('demo') || (r as any).isDemo) return;
      const targetId = r.studentId;
      if (!targetId) return;

      const existing = scoreMap.get(targetId) || { totalScore: 0, count: 0, totalPercent: 0 };
      existing.totalScore += Number(r.score) || 0;
      existing.count += 1;
      existing.totalPercent += Number(r.percentage) || 0;
      scoreMap.set(targetId, existing);
    });

    scoreMap.forEach((data, studentId) => {
      const existingStudent = studentMap.get(studentId);
      if (existingStudent) {
        existingStudent.score = data.totalScore;
        existingStudent.contestsTaken = data.count;
        existingStudent.accuracy = data.count > 0 ? Math.round(data.totalPercent / data.count) : 0;
      }
    });

    // 3. Convert to array and sort according to active metric
    const list = Array.from(studentMap.values());

    if (activeMetric === 'olympiad') {
      list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.points !== a.points) return b.points - a.points;
        return (b.contestsTaken || 0) - (a.contestsTaken || 0);
      });
    } else {
      list.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.score !== a.score) return b.score - a.score;
        return (b.contestsTaken || 0) - (a.contestsTaken || 0);
      });
    }

    // Assign 1-indexed ranks
    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  }, [students, results, currentAuthUser, currentStudent, activeMetric]);

  const top3 = rankedList.slice(0, 3);
  const tickerItems = rankedList.length > 0 ? rankedList.slice(0, 12) : [];
  // Duplicate for seamless infinite loop marquee
  const marqueeItems = [...tickerItems, ...tickerItems];

  const currentUserStanding = rankedList.find((s) => s.isCurrentUser);

  return (
    <div
      id="hero-animated-leaderboard"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#0B1536] to-[#0A1026] text-white border border-blue-500/25 shadow-xl shadow-blue-950/30 p-3.5 sm:p-5 transition-all"
    >
      {/* Ambient background glow accents */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-12 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 left-1/3 w-64 h-32 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        {/* Left Title with Live Radar Beacon */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0">
            <Trophy className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block -ml-2" />
                {language === 'ta' ? 'நேரலை லீடர்போர்டு' : language === 'si' ? 'සජීවී නායක පුවරුව' : 'LIVE LEADERBOARD'}
              </span>
              <span className="text-[10px] text-slate-400 hidden min-[480px]:inline">
                • 25 Districts Active
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
              <span>
                {language === 'ta'
                  ? 'தேசிய சாதனையாளர்கள் & வெற்றியாளர்கள்'
                  : language === 'si'
                  ? 'ජාතික ශූරයින් සහ නායකයින්'
                  : 'National Champions & Top Performers'}
              </span>
            </h2>
          </div>
        </div>

        {/* Right Metric Switcher & Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Metric Selector Buttons */}
          <div className="inline-flex bg-slate-900/80 p-0.5 rounded-xl border border-white/10 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => setActiveMetric('olympiad')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeMetric === 'olympiad'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ta' ? 'போட்டிப் புள்ளிகள்' : 'Olympiad'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('points')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeMetric === 'points'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'வெகுமதி புள்ளிகள்' : 'Points'}</span>
            </button>
          </div>

          {/* Confetti Celebration Button */}
          <button
            type="button"
            onClick={handleCelebrate}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-amber-300 border border-white/10 transition-colors shadow-2xs"
            title="Celebrate Champions!"
          >
            <PartyPopper className="w-4 h-4" />
          </button>

          {/* Full Leaderboard Jump Link */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('Leaderboards')}
              className="px-2.5 py-1 text-xs font-bold text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl transition-all flex items-center gap-1"
            >
              <span>{language === 'ta' ? 'முழு விபரம்' : 'View Hub'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Showcase: Top 3 Podium Cards */}
      {top3.length > 0 ? (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 my-3.5">
          {/* RANK 1 - GOLD CHAMPION (Prominently Center / Elevated) */}
          {top3[0] && (
            <div className="order-1 md:order-2 relative group overflow-hidden rounded-xl bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950 p-3 sm:p-4 border-2 border-amber-400/60 shadow-lg shadow-amber-500/10">
              {/* Shimmer light bar across card */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 text-slate-950 font-black text-sm flex items-center justify-center shadow-md animate-pulse-ring">
                      {top3[0].name.charAt(0)}
                    </div>
                    <div className="absolute -top-2.5 -right-1 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      <Crown className="w-5 h-5 fill-amber-400 stroke-amber-200" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>#1 GOLD CHAMPION</span>
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[170px]">
                      {top3[0].name}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-amber-300 block font-mono">
                    {activeMetric === 'olympiad'
                      ? `${top3[0].score.toLocaleString()} pts`
                      : `${top3[0].points.toLocaleString()} pts`}
                  </span>
                  <span className="text-[9px] font-bold text-amber-400/80 uppercase">
                    {activeMetric === 'olympiad' ? 'Olympiad Score' : 'Reward Balance'}
                  </span>
                </div>
              </div>

              {/* School and District Subtext */}
              <div className="mt-2.5 pt-2 border-t border-amber-400/20 flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 truncate max-w-[160px] text-slate-300">
                  <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{top3[0].school}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-200 shrink-0 font-medium text-[10px]">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{language === 'ta' ? top3[0].districtNameTa || top3[0].district : top3[0].district}</span>
                </div>
              </div>
            </div>
          )}

          {/* RANK 2 - SILVER RUNNER-UP */}
          {top3[1] && (
            <div className="order-2 md:order-1 relative rounded-xl bg-slate-900/80 p-3 sm:p-3.5 border border-slate-300/30 hover:border-slate-300/50 transition-colors shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">
                    {top3[1].name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                      <Medal className="w-3 h-3 text-slate-300" />
                      <span>#2 SILVER STAR</span>
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px]">
                      {top3[1].name}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-slate-200 block font-mono">
                    {activeMetric === 'olympiad'
                      ? `${top3[1].score.toLocaleString()} pts`
                      : `${top3[1].points.toLocaleString()} pts`}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">
                    {activeMetric === 'olympiad' ? 'Score' : 'Points'}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[150px]">{top3[1].school}</span>
                <span className="text-slate-300 shrink-0">📍 {top3[1].district}</span>
              </div>
            </div>
          )}

          {/* RANK 3 - BRONZE ACHIEVER */}
          {top3[2] && (
            <div className="order-3 relative rounded-xl bg-slate-900/80 p-3 sm:p-3.5 border border-amber-700/30 hover:border-amber-700/50 transition-colors shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {top3[2].name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-500" />
                      <span>#3 BRONZE STAR</span>
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px]">
                      {top3[2].name}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-amber-400 block font-mono">
                    {activeMetric === 'olympiad'
                      ? `${top3[2].score.toLocaleString()} pts`
                      : `${top3[2].points.toLocaleString()} pts`}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">
                    {activeMetric === 'olympiad' ? 'Score' : 'Points'}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[150px]">{top3[2].school}</span>
                <span className="text-slate-300 shrink-0">📍 {top3[2].district}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="my-3 py-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-white/5">
          <Trophy className="w-6 h-6 text-amber-400/50 mx-auto mb-1.5" />
          <span>Contest results and registered students will appear live on this podium.</span>
        </div>
      )}

      {/* CONTINUOUS SMOOTH MARQUEE TICKER (Real-Time Scrolling Ribbon) */}
      {tickerItems.length > 0 && (
        <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10">
          <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>
                {language === 'ta'
                  ? 'தேசிய முதல் 10 சாதனையாளர்கள் (Live Ticker)'
                  : 'Top 10 National Star Stream'}
              </span>
            </span>
            <span className="text-[9px] text-slate-500 italic">
              {language === 'ta' ? 'நிறுத்த மவுஸை மேலே வைக்கவும் (Hover to pause)' : 'Hover to pause'}
            </span>
          </div>

          {/* Marquee Wrapper with smooth gradient masks */}
          <div
            className="relative overflow-hidden w-full py-1 group/marquee"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Left & Right fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

            <div
              className={`animate-marquee flex items-center gap-3 ${
                isPaused ? 'animate-marquee:hover' : ''
              }`}
              style={{
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {marqueeItems.map((item, idx) => {
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-transform hover:scale-[1.02] shadow-2xs ${
                      isTop1
                        ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                        : isTop2
                        ? 'bg-slate-300/10 border-slate-300/30 text-slate-200'
                        : isTop3
                        ? 'bg-amber-700/15 border-amber-700/40 text-amber-300'
                        : item.isCurrentUser
                        ? 'bg-blue-600/20 border-blue-400/50 text-blue-200'
                        : 'bg-slate-900/60 border-white/10 text-slate-300'
                    }`}
                  >
                    {/* Rank Badge */}
                    <span
                      className={`font-black font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                        isTop1
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : isTop2
                          ? 'bg-slate-200 text-slate-900'
                          : isTop3
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      #{item.rank}
                    </span>

                    {/* Student Name */}
                    <span className="font-bold text-white flex items-center gap-1">
                      <span>{item.name}</span>
                      {item.isCurrentUser && (
                        <span className="text-[9px] font-black px-1 rounded bg-blue-500 text-white uppercase">
                          YOU
                        </span>
                      )}
                    </span>

                    {/* School / District */}
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({item.district})
                    </span>

                    {/* Score / Points Pill */}
                    <span className="font-mono font-extrabold text-[11px] text-amber-300 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                      {activeMetric === 'olympiad'
                        ? `${item.score} pts`
                        : `${item.points} pts`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Current Student's Personal Standing Card (If logged in as student) */}
      {currentUserStanding && (
        <div className="relative z-10 mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-500/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-300 font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>
                {language === 'ta' ? 'உங்கள் தற்போதைய நிலை:' : 'Your Live Standing:'}
              </span>
            </span>
            <span className="font-black text-white font-mono text-xs bg-blue-600/30 px-2 py-0.5 rounded border border-blue-400/40">
              Rank #{currentUserStanding.rank}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-300 font-mono">
              Score: <strong className="text-amber-300">{currentUserStanding.score} pts</strong>
            </span>
            <span className="text-slate-300 font-mono">
              Reward Points: <strong className="text-emerald-400">{currentUserStanding.points} pts</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
