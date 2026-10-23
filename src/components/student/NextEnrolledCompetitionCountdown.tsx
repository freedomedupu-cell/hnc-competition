import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition } from '../../types';
import {
  Clock,
  Calendar,
  Flame,
  Award,
  ArrowRight,
  Sparkles,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Bell,
  Play,
  Layers,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { getCompetitionScheduleStatus, parseDateTime } from '../../utils/competitionTimeUtils';

interface NextEnrolledCompetitionCountdownProps {
  onJoinCompetition?: (comp: Competition) => void;
  onViewDetails?: (comp: Competition) => void;
  className?: string;
}

export const NextEnrolledCompetitionCountdown: React.FC<NextEnrolledCompetitionCountdownProps> = ({
  onJoinCompetition,
  onViewDetails,
  className = '',
}) => {
  const {
    competitions,
    isStudentRegistered,
    hasStudentSubmitted,
    language,
    setStudentNav,
    currentStudent,
    currentAuthUser,
  } = useApp();

  const studentGrade = currentStudent?.gradeLevel || currentAuthUser?.grade || 'Grade 10';

  // Tick clock every second
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter only competitions student has actively registered for and not yet submitted
  const enrolledCompetitions = useMemo(() => {
    return competitions
      .filter((c) => {
        if (!c) return false;
        const status = (c.status || '').toLowerCase().trim();
        if (status.includes('draft') || status === 'closed' || status === 'inactive' || status === 'unpublished') {
          return false;
        }

        const isRegistered = isStudentRegistered(c.id);
        const hasSubmitted = hasStudentSubmitted(c.id);

        return isRegistered && !hasSubmitted;
      })
      .map((c) => {
        const sched = getCompetitionScheduleStatus(c);
        let targetMs = 0;
        let isTargetStart = true;

        if (sched.isUpcoming && sched.startDateTime) {
          targetMs = sched.startDateTime.getTime();
          isTargetStart = true;
        } else if (sched.isLive && sched.endDateTime) {
          targetMs = sched.endDateTime.getTime();
          isTargetStart = false; // Countdown to contest window close
        } else if (sched.endDateTime) {
          targetMs = sched.endDateTime.getTime();
          isTargetStart = false;
        } else {
          targetMs = Date.now() + 86400 * 7 * 1000;
        }

        return {
          competition: c,
          schedule: sched,
          targetMs,
          isTargetStart,
          diffMs: targetMs - nowMs,
        };
      })
      .filter((item) => item.diffMs > 0)
      .sort((a, b) => a.targetMs - b.targetMs);
  }, [competitions, isStudentRegistered, hasStudentSubmitted, nowMs]);

  // Selected enrolled competition index (default to the nearest 0)
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  // Keep index within bounds if enrolled list changes
  useEffect(() => {
    if (selectedIdx >= enrolledCompetitions.length) {
      setSelectedIdx(Math.max(0, enrolledCompetitions.length - 1));
    }
  }, [enrolledCompetitions.length, selectedIdx]);

  const activeEnrolled = enrolledCompetitions[selectedIdx];

  // Calculate live days, hours, minutes, seconds
  const timeUnits = useMemo(() => {
    if (!activeEnrolled) return { days: 0, hours: 0, minutes: 0, seconds: 0, isZero: true };

    const remainingSec = Math.max(0, Math.floor((activeEnrolled.targetMs - nowMs) / 1000));
    const days = Math.floor(remainingSec / 86400);
    const hours = Math.floor((remainingSec % 86400) / 3600);
    const minutes = Math.floor((remainingSec % 3600) / 60);
    const seconds = Math.floor(remainingSec % 60);

    return {
      days,
      hours,
      minutes,
      seconds,
      isZero: remainingSec <= 0,
    };
  }, [activeEnrolled, nowMs]);

  // If student has no enrolled competitions yet, render an encouraging discovery card
  if (enrolledCompetitions.length === 0) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-5 sm:p-6 text-white border border-indigo-800/60 shadow-lg ${className}`}
      >
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0 border border-indigo-400/30">
              <Clock className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-amber-300 border border-white/15">
                  {language === 'ta' ? 'நேரலை கவுண்ட்டவுன்' : 'Live Exam Countdown'}
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  {language === 'ta' ? 'பதிவு செய்யப்பட்ட போட்டிகள் எதுவும் இல்லை' : 'No Enrolled Contests Active'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {language === 'ta'
                  ? 'போட்டிகளில் பதிவு செய்து நேரலை கவுண்ட்டவுனை தொடங்குங்கள்!'
                  : 'Enroll in an Olympiad or Contest to Activate Your Live Countdown!'}
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                {language === 'ta'
                  ? 'உங்கள் வகுப்பிற்குரிய தேசிய ஒலிம்பியாட் அல்லது வினாடி வினாப் போட்டிகளில் பதிவு செய்யும் போது, பரீட்சை தொடங்கும் நேரத்தை வினாடி வாரியாக இங்கு அவதானிக்கலாம்.'
                  : 'Register for any contest aligned with your grade to see a real-time countdown to contest start and exam close.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStudentNav('Competitions')}
            className="self-start md:self-auto px-4.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer shrink-0"
          >
            <Trophy className="w-4 h-4 text-slate-950" />
            <span>{language === 'ta' ? 'போட்டிகளைப் பார்க்க →' : 'Explore Competitions →'}</span>
          </button>
        </div>
      </div>
    );
  }

  const { competition, schedule, isTargetStart } = activeEnrolled;

  const isLive = schedule.isLive;
  const isUpcoming = schedule.isUpcoming;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-5 sm:p-7 text-white border-2 ${
        isLive ? 'border-amber-400 shadow-xl shadow-amber-500/10' : 'border-indigo-600/70 shadow-lg'
      } ${className}`}
    >
      {/* Subtle ambient lighting */}
      <div className="absolute -top-10 -right-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Meta Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
                isLive
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950'
              }`}
            >
              {isLive ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>
                {isLive
                  ? language === 'ta' ? '🔥 நேரலைத் தேர்வு நடக்கிறது!' : '🔥 Exam Window is LIVE!'
                  : language === 'ta' ? '⏳ அடுத்த பதிவுசெய்த போட்டி' : '⏳ Next Enrolled Competition'}
              </span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-emerald-300 border border-white/15 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{language === 'ta' ? 'பதிவு உறுதி செய்யப்பட்டது' : 'Enrolled & Confirmed'}</span>
            </span>

            {/* Multiple Enrolled Switcher Pill if > 1 */}
            {enrolledCompetitions.length > 1 && (
              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5 border border-white/15">
                <span className="text-[10px] text-slate-300 px-1.5 font-bold">
                  {enrolledCompetitions.length} {language === 'ta' ? 'போட்டிகள்' : 'Contests'}:
                </span>
                {enrolledCompetitions.map((item, idx) => (
                  <button
                    key={item.competition.id}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                      selectedIdx === idx
                        ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-300 flex items-center gap-1.5 self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-blue-300" />
            <span>
              {isTargetStart
                ? (language === 'ta' ? 'தொடக்க நேரம்:' : 'Starts:')
                : (language === 'ta' ? 'நிறைவு நேரம்:' : 'Closes:')}{' '}
              <strong className="text-white font-mono font-bold">
                {isTargetStart ? schedule.formattedStart : schedule.formattedEnd}
              </strong>
            </span>
          </div>
        </div>

        {/* Competition Title & Category */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-200 bg-blue-900/60 px-2 py-0.5 rounded-md border border-blue-400/30">
                {competition.category || 'General'}
              </span>
              <span className="text-[11px] text-slate-400">
                Grade: {competition.grade || studentGrade}
              </span>
              <span className="text-[11px] text-slate-400">•</span>
              <span className="text-[11px] text-amber-300 font-bold">
                {competition.duration || 30} {language === 'ta' ? 'நிமிடங்கள்' : 'Minutes'}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
              {competition.title}
            </h2>
            <p className="text-xs text-slate-300 line-clamp-1">
              {competition.description ||
                (language === 'ta'
                  ? 'தேசிய கல்வி பாடத்திட்ட வழிகாட்டலின் அடிப்படையில் அமைக்கப்பட்ட மாதிரிப் பரீட்சை.'
                  : 'National standard curriculum competition prepared for students.')}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            {isLive ? (
              <button
                type="button"
                onClick={() => {
                  if (onJoinCompetition) onJoinCompetition(competition);
                  else if (onViewDetails) onViewDetails(competition);
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-400/30 animate-bounce cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>{language === 'ta' ? 'பரீட்சையைத் தொடங்குக (Start Exam) →' : 'Start Exam Now →'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onViewDetails) onViewDetails(competition);
                  else if (onJoinCompetition) onJoinCompetition(competition);
                }}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
              >
                <span>{language === 'ta' ? 'விதிமுறைகளைப் பார்க்க' : 'View Instructions'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setStudentNav('Study Games Hub')}
              className="px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
              title="Practice with Games"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'ta' ? 'பயிற்சி செய்க' : 'Practice Drills'}</span>
            </button>
          </div>
        </div>

        {/* 4 Digital Glowing Countdown Unit Cards */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isTargetStart
                ? (language === 'ta' ? 'பரீட்சை தொடங்குவதற்கு மீதமுள்ள நேரம்:' : 'Time Remaining Until Contest Begins:')
                : (language === 'ta' ? 'பரீட்சை நிறைவடைவதற்கு மீதமுள்ள நேரம்:' : 'Time Remaining Until Contest Closes:')}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl">
            {/* Days Card */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-md flex flex-col justify-center">
              <span className="font-mono font-black text-2xl sm:text-4xl text-white tracking-tight">
                {String(timeUnits.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider mt-1">
                {language === 'ta' ? 'நாட்கள்' : language === 'si' ? 'දින' : 'Days'}
              </span>
            </div>

            {/* Hours Card */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-md flex flex-col justify-center">
              <span className="font-mono font-black text-2xl sm:text-4xl text-white tracking-tight">
                {String(timeUnits.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider mt-1">
                {language === 'ta' ? 'மணி' : language === 'si' ? 'පැය' : 'Hours'}
              </span>
            </div>

            {/* Minutes Card */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-md flex flex-col justify-center">
              <span className="font-mono font-black text-2xl sm:text-4xl text-white tracking-tight">
                {String(timeUnits.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider mt-1">
                {language === 'ta' ? 'நிமிடம்' : language === 'si' ? 'මිනිත්තු' : 'Minutes'}
              </span>
            </div>

            {/* Seconds Card (Animated glowing pulse) */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 backdrop-blur-md border border-amber-400/40 text-center shadow-md flex flex-col justify-center">
              <span className="font-mono font-black text-2xl sm:text-4xl text-amber-300 tracking-tight animate-pulse">
                {String(timeUnits.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-extrabold text-white uppercase tracking-wider mt-1">
                {language === 'ta' ? 'நொடி' : language === 'si' ? 'තත්පර' : 'Seconds'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
