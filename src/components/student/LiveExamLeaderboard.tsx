import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition, CompetitionResult, DbAttempt } from '../../types';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Sparkles,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Users,
  ChevronDown,
  ChevronUp,
  MapPin,
  School,
  Zap,
  Flame,
  Globe,
  Star,
  Activity,
  UserCheck,
} from 'lucide-react';

interface LiveExamLeaderboardProps {
  onSelectCompetition?: (comp: Competition) => void;
}

export const LiveExamLeaderboard: React.FC<LiveExamLeaderboardProps> = ({
  onSelectCompetition,
}) => {
  const {
    competitions,
    results,
    studentAttempts,
    currentStudent,
    currentAuthUser,
    language,
  } = useApp();

  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Filter Active / Published / Ongoing / Completed competitions
  const activeCompetitions = competitions.filter((c) => {
    if (!c) return false;
    const s = (c.status || '').toLowerCase().trim();
    return s === 'ongoing' || s === 'published' || s === 'upcoming' || s === 'completed';
  });

  // Keep last sync time fresh
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Merge official results with active live student attempts for real-time live standings
  const activeCompIds = activeCompetitions.map((c) => c.id);

  // 1. Gather results belonging to active competitions
  let filteredResults = results.filter((r) => activeCompIds.includes(r.competitionId));

  // If specific competition selected
  if (selectedCompId !== 'all') {
    filteredResults = filteredResults.filter((r) => r.competitionId === selectedCompId);
  }

  // 2. Also map any real-time submitted student attempts from AppContext if not already in results
  const liveAttemptsResults: CompetitionResult[] = [];
  studentAttempts.forEach((att) => {
    if (att.status === 'submitted' || att.status === 'completed') {
      const isAlreadyInResults = filteredResults.some(
        (r) => r.competitionId === att.competitionId && r.studentId === att.studentId
      );
      if (!isAlreadyInResults && activeCompIds.includes(att.competitionId)) {
        if (selectedCompId === 'all' || selectedCompId === att.competitionId) {
          const comp = competitions.find((c) => c.id === att.competitionId);
          const maxMarks = comp?.totalMarks || att.totalMarks || 100;
          const score = att.score || 0;
          const pct = Math.round((score / maxMarks) * 100);

          liveAttemptsResults.push({
            id: `live-attempt-${att.attemptId}`,
            competitionId: att.competitionId,
            competitionTitle: att.competitionTitle || comp?.title || 'Academic Exam',
            studentId: att.studentId,
            studentName: att.studentName || currentStudent?.fullName || currentAuthUser?.fullName || 'Active Candidate',
            studentInstitution: currentStudent?.school || 'Participating Institution',
            score,
            maxScore: maxMarks,
            totalMarks: maxMarks,
            percentage: pct,
            rank: 0,
            percentile: pct,
            award: pct >= 90 ? 'Gold Medal' : pct >= 75 ? 'Silver Medal' : pct >= 60 ? 'Bronze Medal' : 'Participation',
            publishStatus: 'published',
            submittedAt: att.submittedAt || att.startedAt,
            certificateId: `CERT-${att.attemptId}`,
          });
        }
      }
    }
  });

  const combinedLeaderboard = [...filteredResults, ...liveAttemptsResults];

  // Sort strictly by:
  // 1. Highest Score / Percentage
  // 2. Earlier submission timestamp
  combinedLeaderboard.sort((a, b) => {
    const scoreA = a.percentage ?? Math.round(((a.score || 0) / (a.maxScore || 100)) * 100);
    const scoreB = b.percentage ?? Math.round(((b.score || 0) / (b.maxScore || 100)) * 100);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const timeA = a.submittedAt || a.publishedAt ? new Date(a.submittedAt || a.publishedAt || '').getTime() : 0;
    const timeB = b.submittedAt || b.publishedAt ? new Date(b.submittedAt || b.publishedAt || '').getTime() : 0;
    return timeA - timeB;
  });

  // Assign live rank numbers
  const rankedLeaderboard = combinedLeaderboard.map((item, idx) => ({
    ...item,
    liveRank: idx + 1,
  }));

  // Filter by Search Query
  const displayedLeaderboard = rankedLeaderboard.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.studentName.toLowerCase().includes(q) ||
      item.studentInstitution.toLowerCase().includes(q) ||
      item.competitionTitle.toLowerCase().includes(q)
    );
  });

  // Current logged in student ID
  const currentUid = currentAuthUser?.uid || currentStudent?.id;
  const currentStudentRankEntry = rankedLeaderboard.find(
    (item) => item.studentId === currentUid || item.studentName === (currentStudent?.fullName || currentAuthUser?.fullName)
  );

  // Top 3 Podium Candidates
  const top1 = displayedLeaderboard[0];
  const top2 = displayedLeaderboard[1];
  const top3 = displayedLeaderboard[2];

  // Display list limit
  const visibleList = isExpanded ? displayedLeaderboard : displayedLeaderboard.slice(0, 8);

  const activeCompObj = competitions.find((c) => c.id === selectedCompId);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-indigo-800/40 relative overflow-hidden space-y-6">
      {/* Background Decorative Lighting */}
      <div className="absolute -right-16 -top-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Live Pulse Badge */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>
                {language === 'ta'
                  ? 'நேரலைத் தரவரிசைப் பட்டியல் (Real-Time Sync)'
                  : language === 'si'
                  ? 'තත්‍ය කාලීන නායකත්ව පුවරුව'
                  : 'Real-Time Live Leaderboard'}
              </span>
            </span>

            <span className="text-[11px] text-indigo-300 font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Synced: {lastSyncTime}</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 pt-1">
            <Trophy className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
            <span>
              {selectedCompId === 'all'
                ? language === 'ta'
                  ? '🏆 அனைத்து நேரலைப் பரீட்சைகளின் முதன்மைத் தரவரிசை'
                  : language === 'si'
                  ? '🏆 සියලුම සක්‍රිය විභාග ශ්‍රේණිගත කිරීම්'
                  : '🏆 All Active Exam Standings'
                : activeCompObj?.title || 'Live Exam Leaderboard'}
            </span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {language === 'ta'
              ? 'தேசிய அளவிலான வினாடி வினாக்கள் மற்றும் பரீட்சைகளில் மாணவர்கள் பெறும் மதிப்பெண்கள் உடனுக்குடன் நேரலையாக இங்கு புதுப்பிக்கப்படுகின்றன!'
              : language === 'si'
              ? 'සක්‍රිය විභාග සඳහා සිසුන්ගේ සජීවී ලකුණු සහ ශ්‍රේණිගත කිරීම් මෙහි නිරූපණය වේ.'
              : 'Live candidate rankings and test scores updated synchronously across active olympiads and competitions.'}
          </p>
        </div>

        {/* Total Active Candidates Badge */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center min-w-[120px]">
            <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              <span>Contenders</span>
            </div>
            <div className="text-xl font-black text-white mt-0.5">
              {rankedLeaderboard.length} <span className="text-xs font-semibold text-slate-400">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Exam Tabs Switcher */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>
              {language === 'ta' ? 'சක්‍ரிய பரீட்சையைத் தேர்ந்தெடுக்க:' : 'Select Active Contest:'}
            </span>
          </span>
          <span className="text-[11px] text-indigo-300 font-mono">
            {activeCompetitions.length} Active Contests
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCompId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
              selectedCompId === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20'
                : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>
              {language === 'ta' ? 'அனைத்து பரீட்சைகளும்' : 'All Contests'}
            </span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-900/40 font-mono">
              {combinedLeaderboard.length}
            </span>
          </button>

          {activeCompetitions.map((comp) => {
            const isSelected = selectedCompId === comp.id;
            const count = combinedLeaderboard.filter((r) => r.competitionId === comp.id).length;

            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => setSelectedCompId(comp.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-400 font-black shadow-lg shadow-blue-500/20'
                    : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[180px]">{comp.title}</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-900/60 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Student Position Banner */}
      {currentStudentRankEntry && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-blue-950/90 border border-blue-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
              #{currentStudentRankEntry.liveRank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">
                  {language === 'ta' ? 'உங்கள் தற்போதைய நேரலை தரம்:' : 'Your Live Standings:'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                  📍 Position #{currentStudentRankEntry.liveRank}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                {currentStudentRankEntry.competitionTitle} • Score: {currentStudentRankEntry.score} / {currentStudentRankEntry.maxScore || 100} ({currentStudentRankEntry.percentage || 0}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Award Status: {currentStudentRankEntry.award || 'Gold Contender'}</span>
          </div>
        </div>
      )}

      {/* TOP 3 PODIUM CARDS */}
      {displayedLeaderboard.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Top Performing Champions (Podium Leaders)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
            {/* 2ND PLACE (Silver Medalist) */}
            {top2 ? (
              <div className="bg-gradient-to-b from-slate-800 via-slate-800/90 to-slate-900 rounded-2xl p-4.5 border-2 border-slate-300/80 relative overflow-hidden flex flex-col justify-between space-y-3 shadow-xl shadow-slate-500/10 order-2 sm:order-1 transform transition hover:-translate-y-1">
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-slate-300 to-slate-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-bl-xl shadow-sm flex items-center gap-1">
                  <Medal className="w-3 h-3 text-slate-900" />
                  <span>🥈 Silver Medalist</span>
                </div>

                <div className="flex items-start justify-between pt-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-300 text-slate-950 font-black text-base flex items-center justify-center shadow-lg ring-2 ring-slate-300/80">
                    2
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-200 bg-slate-700/90 px-2.5 py-1 rounded-full border border-slate-500/50 shadow-xs">
                    {top2.percentage || 0}% Accuracy
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-white truncate flex items-center gap-1">
                    <span>{top2.studentName}</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 truncate flex items-center gap-1">
                    <School className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{top2.studentInstitution}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 truncate font-medium">{top2.competitionTitle}</p>
                </div>

                <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-200">{top2.score} / {top2.maxScore || 100} pts</span>
                  <span className="text-[10px] font-black text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded-lg shadow-xs">
                    {top2.award || 'Silver Award'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-2xl p-4 border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500 order-2 sm:order-1 h-36">
                Awaiting 2nd Place
              </div>
            )}

            {/* 1ST PLACE (Gold Champion) */}
            {top1 ? (
              <div className="bg-gradient-to-b from-amber-500/30 via-amber-600/15 to-slate-950 rounded-3xl p-5 border-2 border-amber-400 relative overflow-hidden flex flex-col justify-between space-y-3.5 shadow-2xl shadow-amber-500/20 order-1 sm:order-2 transform sm:-translate-y-3 ring-4 ring-amber-400/20">
                <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="absolute top-0 right-0 px-3.5 py-1 bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-bl-xl shadow-md flex items-center gap-1.5 border-b border-l border-amber-300 animate-pulse">
                  <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>🥇 Gold Champion</span>
                </div>

                <div className="flex items-start justify-between pt-3 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-xl shadow-amber-500/40 ring-2 ring-yellow-200">
                    1
                  </div>
                  <span className="text-xs font-mono font-black text-amber-200 bg-amber-950/90 px-3 py-1 rounded-full border border-amber-400/80 shadow-md">
                    🔥 {top1.percentage || 0}% Accuracy
                  </span>
                </div>

                <div className="space-y-1 z-10">
                  <h4 className="font-black text-base text-white truncate flex items-center gap-1.5">
                    <span>{top1.studentName}</span>
                    <Crown className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                  </h4>
                  <p className="text-xs text-amber-200/90 truncate flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{top1.studentInstitution}</span>
                  </p>
                  <p className="text-[11px] text-slate-300 truncate font-semibold">{top1.competitionTitle}</p>
                </div>

                <div className="pt-2.5 border-t border-amber-500/40 flex items-center justify-between text-xs z-10">
                  <span className="font-black text-base text-amber-300">{top1.score} / {top1.maxScore || 100} pts</span>
                  <span className="text-[11px] font-black text-slate-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-3 py-1 rounded-xl shadow-md border border-amber-200">
                    {top1.award || 'Grand Champion'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-2xl p-4 border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500 order-1 sm:order-2 h-40">
                Awaiting 1st Place
              </div>
            )}

            {/* 3RD PLACE (Bronze Contender) */}
            {top3 ? (
              <div className="bg-gradient-to-b from-amber-950/50 via-slate-900 to-slate-950 rounded-2xl p-4.5 border-2 border-amber-700/80 relative overflow-hidden flex flex-col justify-between space-y-3 shadow-xl shadow-amber-900/10 order-3 transform transition hover:-translate-y-1">
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-amber-700 to-amber-800 text-amber-100 text-[10px] font-black uppercase tracking-wider rounded-bl-xl shadow-sm flex items-center gap-1 border-b border-l border-amber-600">
                  <Award className="w-3 h-3 text-amber-200" />
                  <span>🥉 Bronze Contender</span>
                </div>

                <div className="flex items-start justify-between pt-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 font-black text-base flex items-center justify-center shadow-lg ring-2 ring-amber-600/80">
                    3
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-200 bg-amber-950/90 px-2.5 py-1 rounded-full border border-amber-700/60 shadow-xs">
                    {top3.percentage || 0}% Accuracy
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-white truncate">{top3.studentName}</h4>
                  <p className="text-[11px] text-slate-300 truncate flex items-center gap-1">
                    <School className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{top3.studentInstitution}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 truncate font-medium">{top3.competitionTitle}</p>
                </div>

                <div className="pt-2 border-t border-amber-800/60 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-300">{top3.score} / {top3.maxScore || 100} pts</span>
                  <span className="text-[10px] font-black text-amber-950 bg-amber-300 px-2.5 py-0.5 rounded-lg shadow-xs">
                    {top3.award || 'Bronze Award'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-2xl p-4 border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500 order-3 h-36">
                Awaiting 3rd Place
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              language === 'ta'
                ? 'மாணவர் பெயர் அல்லது பாடசாலை மூலம் தேடுக...'
                : 'Search contender or school...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>

        <span className="text-xs text-slate-400 font-semibold self-end sm:self-auto">
          Showing {visibleList.length} of {displayedLeaderboard.length} Contenders
        </span>
      </div>

      {/* FULL STANDINGS TABLE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/90 border-b border-slate-700 text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center">Rank</th>
                <th className="px-4 py-3">Candidate & Institution</th>
                <th className="px-4 py-3">Exam Contest</th>
                <th className="px-4 py-3 text-center">Score / Total</th>
                <th className="px-4 py-3 text-center">Accuracy %</th>
                <th className="px-4 py-3 text-center">Status / Award</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {visibleList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {language === 'ta'
                      ? 'தற்போது நேரலைத் தரவரிசை முடிவுகள் எதுவுமில்லை.'
                      : 'No live exam submissions match your search.'}
                  </td>
                </tr>
              ) : (
                visibleList.map((item) => {
                  const isCurrentStudent =
                    item.studentId === currentUid ||
                    item.studentName === (currentStudent?.fullName || currentAuthUser?.fullName);

                  const pct = item.percentage ?? Math.round(((item.score || 0) / (item.maxScore || 100)) * 100);

                  const isRank1 = item.liveRank === 1;
                  const isRank2 = item.liveRank === 2;
                  const isRank3 = item.liveRank === 3;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isCurrentStudent
                          ? 'bg-blue-900/50 border-l-4 border-l-amber-400 font-bold'
                          : isRank1
                          ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-900/80 border-l-4 border-l-amber-400 font-semibold'
                          : isRank2
                          ? 'bg-gradient-to-r from-slate-300/15 via-slate-400/5 to-slate-900/80 border-l-4 border-l-slate-300'
                          : isRank3
                          ? 'bg-gradient-to-r from-amber-800/20 via-amber-700/5 to-slate-900/80 border-l-4 border-l-amber-600'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Rank Column with Badges */}
                      <td className="px-4 py-3 text-center font-black text-sm">
                        {isRank1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs shadow-md ring-2 ring-amber-300/50 animate-pulse">
                            🥇 #1
                          </span>
                        ) : isRank2 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-300 text-slate-950 font-black text-xs shadow-md ring-2 ring-slate-300/50">
                            🥈 #2
                          </span>
                        ) : isRank3 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100 font-black text-xs shadow-md ring-2 ring-amber-600/50">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">#{item.liveRank}</span>
                        )}
                      </td>

                      {/* Candidate Name & School */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${
                              isRank1
                                ? 'bg-amber-400 text-slate-950 border-yellow-200 ring-2 ring-amber-400/40'
                                : isRank2
                                ? 'bg-slate-200 text-slate-950 border-slate-100 ring-2 ring-slate-300/40'
                                : isRank3
                                ? 'bg-amber-700 text-amber-100 border-amber-600 ring-2 ring-amber-600/40'
                                : 'bg-slate-800 text-amber-300 border-slate-700'
                            }`}
                          >
                            {item.studentName.charAt(0)}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-white text-xs">{item.studentName}</span>
                              {isCurrentStudent && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] uppercase">
                                  You
                                </span>
                              )}
                              {isRank1 && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold text-[9px] uppercase">
                                  Gold Champion
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px] flex items-center gap-1">
                              <School className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{item.studentInstitution}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Exam Title */}
                      <td className="px-4 py-3 text-xs text-slate-300 font-semibold truncate max-w-[180px]">
                        {item.competitionTitle}
                      </td>

                      {/* Score / Total */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono font-extrabold text-amber-300 text-sm">
                          {item.score}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal"> / {item.maxScore || 100}</span>
                      </td>

                      {/* Accuracy Progress Bar */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs text-slate-200">{pct}%</span>
                        </div>
                      </td>

                      {/* Award / Status */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-800 border border-slate-700 text-amber-300">
                          <Award className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{item.award || 'Completed'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expand / Collapse Toggle Button */}
        {displayedLeaderboard.length > 8 && (
          <div className="p-3 bg-slate-800/60 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition cursor-pointer border border-slate-700"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Show Top 8 Only</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>
                    {language === 'ta'
                      ? `அனைத்து ${displayedLeaderboard.length} போட்டியாளர்களையும் காண்க`
                      : `View All ${displayedLeaderboard.length} Contenders`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
