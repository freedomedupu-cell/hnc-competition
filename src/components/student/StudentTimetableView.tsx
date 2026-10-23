import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Sparkles,
  BookOpen,
  Trophy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Download,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Sliders,
  ChevronRight,
  Shield,
  Target,
  ArrowRight,
  Info,
  Award,
  Layers,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  StudyTimetable,
  generateStudyTimetable,
  getSavedTimetable,
  saveTimetableLocally,
  getCompletedSlots,
  toggleSlotCompleted,
  identifyWeakSubjectsFromResults,
  exportTimetableAsText,
} from '../../services/studyTimetableService';
import { detectStudentCurriculumPath, isGradeEligible } from '../../lib/gradeUtils';
import { getCompetitionScheduleStatus } from '../../utils/competitionTimeUtils';
import { cacheTimetableForOfflineUse } from '../../services/studyMaterialsOfflineService';

interface StudentTimetableViewProps {
  onNavigate?: (view: any) => void;
}

export const StudentTimetableView: React.FC<StudentTimetableViewProps> = ({ onNavigate }) => {
  const { currentStudent, currentAuthUser, competitions, results, language, setStudentNav } = useApp();

  const studentId = currentAuthUser?.uid || currentStudent?.id || 'current_student';
  const studentName = currentAuthUser?.fullName || currentStudent?.name || 'Student';
  const studentGrade = currentAuthUser?.grade || currentStudent?.gradeLevel || 'Grade 10';
  const curriculumPath = detectStudentCurriculumPath(studentGrade);

  // Configuration options for generating timetable
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [preferredTime, setPreferredTime] = useState<string>('Evening (4:00 PM - 8:00 PM)');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [timetable, setTimetable] = useState<StudyTimetable | null>(null);
  const [completedSlots, setCompletedSlots] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Identify student's past results and compute weak subjects
  const studentResults = useMemo(() => {
    return results.filter(
      (r) =>
        r.studentId === studentId ||
        r.studentId === currentStudent?.id ||
        r.studentName === studentName ||
        r.studentName === currentStudent?.name
    );
  }, [results, studentId, studentName, currentStudent]);

  const { weakSubjects, strongSubjects, subjectStats } = useMemo(() => {
    return identifyWeakSubjectsFromResults(studentResults, competitions);
  }, [studentResults, competitions]);

  // Identify student's upcoming eligible competitions
  const upcomingContests = useMemo(() => {
    const now = Date.now();
    return competitions
      .filter((c) => {
        if (!c) return false;
        const status = (c.status || '').toLowerCase();
        if (status.includes('draft') || status === 'closed' || status === 'inactive') return false;
        return isGradeEligible(c.grade, studentGrade);
      })
      .map((c) => {
        const sched = getCompetitionScheduleStatus(c);
        let daysLeft = 14;
        if (sched.endDateTime) {
          daysLeft = Math.max(1, Math.ceil((sched.endDateTime.getTime() - now) / (1000 * 3600 * 24)));
        } else if (sched.startDateTime) {
          daysLeft = Math.max(1, Math.ceil((sched.startDateTime.getTime() - now) / (1000 * 3600 * 24)));
        }
        return {
          id: c.id,
          title: c.title,
          category: c.category || 'General',
          startDate: c.startDate || c.competitionStart,
          daysLeft,
          format: c.competitionType || 'Quiz',
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  }, [competitions, studentGrade]);

  // Load saved timetable or generate initial on mount
  useEffect(() => {
    const saved = getSavedTimetable(studentId);
    if (saved) {
      setTimetable(saved);
      setCompletedSlots(getCompletedSlots(studentId));
    } else {
      handleGenerateTimetable();
    }
  }, [studentId]);

  const handleGenerateTimetable = async () => {
    setLoading(true);
    setToastMessage(null);
    try {
      const generated = await generateStudyTimetable({
        studentId,
        studentName,
        grade: studentGrade,
        curriculumPath: curriculumPath.titleEn,
        medium: language === 'en' ? 'English' : 'Tamil',
        language: language,
        dailyHours,
        preferredTime,
        upcomingCompetitions: upcomingContests,
        pastResults: studentResults.map((r) => {
          const comp = competitions.find((c) => c.id === r.competitionId);
          const total = r.totalMarks || r.maxScore || 100;
          const pct = r.percentage !== undefined ? r.percentage : (r.score / total) * 100;
          return {
            competitionTitle: r.competitionTitle,
            category: comp?.category || 'General',
            score: r.score,
            totalMarks: total,
            percentage: Math.round(pct),
            submittedAt: r.submittedAt,
          };
        }),
        weakSubjects,
        strongSubjects,
      });

      setTimetable(generated);
      setCompletedSlots(getCompletedSlots(studentId));
      cacheTimetableForOfflineUse(studentGrade, generated);
      setShowConfigPanel(false);
      setToastMessage(
        language === 'ta'
          ? '✨ உங்கள் தனிப்பயனாக்கப்பட்ட AI படிப்பு அட்டவணை வெற்றிகரமாக உருவாக்கப்பட்டது!'
          : '✨ Personalized AI Study Timetable generated successfully!'
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = (slotId: string) => {
    const updated = toggleSlotCompleted(studentId, slotId);
    setCompletedSlots(updated);

    if (updated[slotId]) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  const handleCopySchedule = () => {
    if (!timetable) return;
    const text = exportTimetableAsText(timetable);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Progress metrics
  const totalSlotsCount = useMemo(() => {
    if (!timetable || !timetable.days) return 0;
    return timetable.days.reduce((acc, d) => acc + (d.timeSlots?.length || 0), 0);
  }, [timetable]);

  const completedSlotsCount = useMemo(() => {
    if (!timetable || !timetable.days) return 0;
    let count = 0;
    timetable.days.forEach((d) => {
      d.timeSlots?.forEach((s) => {
        if (completedSlots[s.id]) count++;
      });
    });
    return count;
  }, [timetable, completedSlots]);

  const completionPercentage = totalSlotsCount > 0 ? Math.round((completedSlotsCount / totalSlotsCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/50">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Gemini 3.8 Flash AI</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-blue-200 border border-white/15">
                {curriculumPath.stageBadgeTa}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/30">
                {studentGrade}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {language === 'ta'
                ? 'தனிப்பயனாக்கப்பட்ட AI படிப்பு அட்டவணை'
                : language === 'si'
                ? 'පුද්ගලීකරණය කළ AI අධ්‍යයන කාලසටහන'
                : 'Personalized Gemini AI Study Timetable'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {language === 'ta'
                ? 'உங்கள் எதிர்வரும் போட்டிகள் மற்றும் கடந்த பரீட்சை முடிவுகளில் பலவீனமாக இனங்காணப்பட்ட பாடங்களை அடிப்படையாகக் கொண்டு, ஜெமினி AI ஆல் பிரத்தியேகமாக உருவாக்கப்பட்ட 7-நாள் படிப்பு திட்டம்.'
                : 'Custom-tailored 7-day study strategy powered by Gemini API, analyzing your upcoming contest deadlines and targeting low-scoring subjects.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-xs"
            >
              <Sliders className="w-4 h-4 text-blue-300" />
              <span>{language === 'ta' ? 'அட்டவணை விருப்பங்கள்' : 'Customize Plan'}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleGenerateTimetable}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'ta' ? 'AI திட்டமிடுகிறது...' : 'AI Analyzing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'ta' ? 'புதிய அட்டவணை உருவாக்குக' : 'Regenerate Plan'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold text-slate-200">
              {language === 'ta' ? 'வாராந்திர படிப்பு நிறைவு நிலை:' : 'Weekly Study Completion:'}
            </span>
            <span className="font-extrabold text-white">
              {completionPercentage}% ({completedSlotsCount} / {totalSlotsCount} {language === 'ta' ? 'அமர்வுகள்' : 'Sessions'})
            </span>
          </div>

          <div className="w-full sm:w-64 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Collapsible Configuration Panel */}
      {showConfigPanel && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-indigo-200 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'ta' ? 'படிப்பு அட்டவணை விருப்ப அமைப்புகள்' : 'Study Schedule Customization'}
              </h3>
            </div>
            <button
              onClick={() => setShowConfigPanel(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              ✕ {language === 'ta' ? 'மூடு' : 'Close'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {language === 'ta' ? 'ஒரு நாளுக்குரிய படிப்பு நேரம் (Daily Hours):' : 'Daily Available Study Hours:'}
              </label>
              <div className="flex items-center gap-2">
                {[2, 3, 4, 5].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDailyHours(hrs)}
                    className={`flex-1 py-2 rounded-xl font-bold transition text-xs ${
                      dailyHours === hrs
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {hrs} {language === 'ta' ? 'மணிநேரம்' : 'Hours'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {language === 'ta' ? 'விருப்பமான படிப்பு நேரம் (Preferred Study Window):' : 'Preferred Study Window:'}
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Early Morning (5:00 AM - 7:30 AM)">
                  {language === 'ta' ? 'அதிகாலை (5:00 AM - 7:30 AM)' : 'Early Morning (5:00 AM - 7:30 AM)'}
                </option>
                <option value="Afternoon (2:00 PM - 5:00 PM)">
                  {language === 'ta' ? 'பிற்பகல் (2:00 PM - 5:00 PM)' : 'Afternoon (2:00 PM - 5:00 PM)'}
                </option>
                <option value="Evening (4:00 PM - 8:00 PM)">
                  {language === 'ta' ? 'மாலை (4:00 PM - 8:00 PM)' : 'Evening (4:00 PM - 8:00 PM)'}
                </option>
                <option value="Night (7:30 PM - 10:30 PM)">
                  {language === 'ta' ? 'இரவு (7:30 PM - 10:30 PM)' : 'Night (7:30 PM - 10:30 PM)'}
                </option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerateTimetable}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'புதிய விருப்பங்களுடன் புதுப்பி' : 'Apply & Regenerate'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Diagnostic Insights Row: Upcoming Contests & Weak Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Identified Weak Areas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold">
                🎯
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  {language === 'ta' ? 'பலவீனமான பாடங்கள் (Weak Areas Identified)' : 'Identified Weak Areas'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {language === 'ta' ? 'கடந்த பரீட்சை முடிவுகளின் பகுப்பாய்வு' : 'Extracted from your past exam performance'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {weakSubjects.length} {language === 'ta' ? 'பாடங்கள்' : 'Subjects'}
            </span>
          </div>

          <div className="space-y-2">
            {weakSubjects.map((subj) => {
              const stat = subjectStats[subj];
              return (
                <div
                  key={subj}
                  className="p-3 rounded-2xl bg-gradient-to-r from-rose-50/70 to-amber-50/50 border border-rose-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="truncate">{subj}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {stat ? (
                        <>
                          {language === 'ta' ? 'சராசரி புள்ளி:' : 'Past Average:'}{' '}
                          <span className="font-bold text-rose-700">{stat.avgPercentage}%</span> ({stat.count}{' '}
                          {language === 'ta' ? 'தேர்வுகள்' : 'tests'})
                        </>
                      ) : (
                        language === 'ta' ? 'முக்கிய மீளாய்வு தேவைப்படும் பாடம்' : 'Targeted revision priority'
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-600 text-white shrink-0 shadow-2xs">
                    {language === 'ta' ? 'அதிக கவனம் தேவை' : 'High Focus'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Upcoming Contests to Prepare For */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                🏆
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  {language === 'ta' ? 'எதிர்வரும் போட்டிகள் (Upcoming Schedule)' : 'Upcoming Competitions Schedule'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {language === 'ta' ? 'உங்கள் வகுப்பிற்குரிய தேசிய தேர்வுகள்' : 'Eligible contests mapped to your grade'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {upcomingContests.length} {language === 'ta' ? 'போட்டிகள்' : 'Contests'}
            </span>
          </div>

          <div className="space-y-2">
            {upcomingContests.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs italic">
                {language === 'ta' ? 'தற்போது புதிய போட்டிகள் எதுவும் இல்லை' : 'No urgent upcoming contests right now.'}
              </div>
            ) : (
              upcomingContests.slice(0, 3).map((comp) => (
                <div
                  key={comp.id}
                  className="p-3 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-extrabold text-slate-900 truncate">{comp.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{comp.category}</span>
                      <span>•</span>
                      <span>{comp.format}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 shadow-2xs ${
                      comp.daysLeft <= 4
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {comp.daysLeft} {language === 'ta' ? 'நாட்களில்' : 'Days Left'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Weekly Timetable Container */}
      {timetable && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
          {/* Action Toolbar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>📅</span>
                <span>{timetable.timetableTitle}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{timetable.overview}</p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  if (timetable) {
                    await cacheTimetableForOfflineUse(studentGrade, timetable);
                    setToastMessage(
                      language === 'ta'
                        ? '✓ அட்டவணை ஆஃப்லைனில் சேமிக்கப்பட்டது! இணையம் இல்லாமலும் அணுகலாம்.'
                        : '✓ Timetable cached for offline access in Service Worker CacheStorage!'
                    );
                    setTimeout(() => setToastMessage(null), 3500);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Save for offline study"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'ta' ? 'ஆஃப்லைனில் சேமி' : 'Save Offline'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySchedule}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Copy Timetable text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Copied') : (language === 'ta' ? 'நகலெடு' : 'Copy')}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Print Timetable"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{language === 'ta' ? 'அச்சிடு' : 'Print'}</span>
              </button>
            </div>
          </div>

          {/* 7-Day Day Selector Bar */}
          <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
            {timetable.days.map((day, idx) => {
              const isSelected = selectedDayIdx === idx;
              const dayCompletedCount = day.timeSlots.filter((s) => completedSlots[s.id]).length;
              const isDayAllDone = day.timeSlots.length > 0 && dayCompletedCount === day.timeSlots.length;

              return (
                <button
                  key={day.dayName}
                  type="button"
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>{day.dayName.split('(')[0].trim()}</span>
                  {isDayAllDone ? (
                    <span className="text-emerald-400 font-extrabold text-xs">✓</span>
                  ) : dayCompletedCount > 0 ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">
                      {dayCompletedCount}/{day.timeSlots.length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Selected Day View */}
          {timetable.days[selectedDayIdx] && (
            <div className="p-5 sm:p-7 space-y-5 animate-in fade-in duration-200">
              {/* Day Header & Theme */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                      {timetable.days[selectedDayIdx].dayName}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {timetable.days[selectedDayIdx].theme}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {timetable.days[selectedDayIdx].dailyTargetSummary}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-indigo-800 bg-white px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs self-start sm:self-auto">
                  {timetable.days[selectedDayIdx].timeSlots.length} {language === 'ta' ? 'அமர்வுகள் திட்டமிடப்பட்டுள்ளன' : 'Study Blocks'}
                </div>
              </div>

              {/* Time Slots List */}
              <div className="space-y-3">
                {timetable.days[selectedDayIdx].timeSlots.map((slot, sIdx) => {
                  const isDone = Boolean(completedSlots[slot.id]);

                  // Color tag per session type
                  let typeBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (slot.sessionType?.toLowerCase().includes('weak')) {
                    typeBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  } else if (slot.sessionType?.toLowerCase().includes('contest')) {
                    typeBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
                  } else if (slot.sessionType?.toLowerCase().includes('mock')) {
                    typeBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                  }

                  return (
                    <div
                      key={slot.id || `slot_${sIdx}`}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-emerald-50/40 border-emerald-300 opacity-90'
                          : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          {/* Time & Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>{slot.timeRange}</span>
                            </span>

                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                              {slot.subject}
                            </span>

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeBadgeClass}`}>
                              {slot.sessionType}
                            </span>

                            <span className="text-[10px] font-semibold text-slate-400">
                              Intensity: {slot.intensity}
                            </span>
                          </div>

                          {/* Topic & Activity */}
                          <div>
                            <h4
                              className={`text-sm sm:text-base font-extrabold ${
                                isDone ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {slot.topic}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              <span className="font-bold text-slate-700">
                                {language === 'ta' ? 'செயல்முறைப் பயிற்சி:' : 'Action:'}
                              </span>{' '}
                              {slot.activity}
                            </p>
                          </div>

                          {/* Tip Banner */}
                          {slot.tips && (
                            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                              <span className="text-xs">💡</span>
                              <span className="font-medium">{slot.tips}</span>
                            </div>
                          )}
                        </div>

                        {/* Completion Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSlot(slot.id)}
                          className={`self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
                            isDone
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-white' : 'text-slate-400'}`} />
                          <span>
                            {isDone
                              ? (language === 'ta' ? 'முடிந்தது ✓' : 'Done ✓')
                              : (language === 'ta' ? 'நிறைவு செய்க' : 'Mark Done')}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Counselor Study Tips Card */}
          {timetable.aiCounselorTips && timetable.aiCounselorTips.length > 0 && (
            <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {language === 'ta' ? 'AI கல்வி ஆலோசகரின் உத்திகள் & வழிகாட்டல்கள்' : 'Gemini AI Counselor Strategy Tips'}
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                {timetable.aiCounselorTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white border border-indigo-100 shadow-2xs flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button to launch Study Games or Test Arena */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center text-xl shrink-0">
            ⚡
          </div>
          <div>
            <h4 className="text-sm font-extrabold">
              {language === 'ta' ? 'நேரடி வேகப் பயிற்சி வேண்டுமா?' : 'Ready to Test Your Speed?'}
            </h4>
            <p className="text-xs text-blue-100">
              {language === 'ta'
                ? 'HNC Edu-Arena Quest தீவுப் போட்டியில் அல்லது Study Games Hub இல் உடனடி பயிற்சி பெறுங்கள்.'
                : 'Jump into HNC Edu-Arena Quest or Study Games Hub for rapid active recall.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStudentNav('Study Games Hub')}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            {language === 'ta' ? 'கேம்கள் பகுதி' : 'Games Hub'}
          </button>
          <button
            type="button"
            onClick={() => setStudentNav('Competitions')}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            {language === 'ta' ? 'போட்டிகள் பட்டியல்' : 'Competitions'}
          </button>
        </div>
      </div>
    </div>
  );
};
