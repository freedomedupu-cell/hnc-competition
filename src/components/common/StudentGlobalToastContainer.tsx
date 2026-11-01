import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentToastNotification } from '../../types';
import {
  Trophy,
  Award,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  Layers,
  Flame,
} from 'lucide-react';

interface ToastItemProps {
  toast: StudentToastNotification;
  onDismiss: (id: string) => void;
  onNavigateTab: (tab: any) => void;
  language: string;
}

const SingleToastCard: React.FC<ToastItemProps> = ({
  toast,
  onDismiss,
  onNavigateTab,
  language,
}) => {
  const duration = toast.durationMs || 8000;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    let intervalId: any;
    if (!isPaused) {
      const step = 50;
      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed);
        const percent = (currentRemaining / duration) * 100;
        setProgress(percent);

        if (currentRemaining <= 0) {
          clearInterval(intervalId);
          onDismiss(toast.id);
        }
      }, step);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPaused, duration, onDismiss, toast.id]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    // save remaining time
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  const handleActionClick = () => {
    onDismiss(toast.id);
    if (toast.meta?.linkTab) {
      onNavigateTab(toast.meta.linkTab);
    } else if (toast.type === 'competition') {
      onNavigateTab('Competitions');
    } else if (toast.type === 'result') {
      onNavigateTab('My Results');
    }
  };

  const isCompetition = toast.type === 'competition';
  const isResult = toast.type === 'result';

  // Localized texts
  const displayTitle =
    language === 'ta' && toast.titleTa
      ? toast.titleTa
      : language === 'si' && toast.titleSi
      ? toast.titleSi
      : toast.title;

  const displayMessage =
    language === 'ta' && toast.messageTa
      ? toast.messageTa
      : language === 'si' && toast.messageSi
      ? toast.messageSi
      : toast.message;

  const displayActionLabel =
    language === 'ta' && toast.actionLabelTa
      ? toast.actionLabelTa
      : language === 'si' && toast.actionLabelSi
      ? toast.actionLabelSi
      : toast.actionLabel ||
        (isCompetition
          ? language === 'ta'
            ? 'போட்டியைப் பார் →'
            : language === 'si'
            ? 'තරඟය බලන්න →'
            : 'View Competition →'
          : language === 'ta'
          ? 'முடிவுகளைப் பார் →'
          : language === 'si'
          ? 'ප්‍රතිඵල බලන්න →'
          : 'View Results →');

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto w-full relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-top-3 fade-in ${
        isCompetition
          ? 'bg-slate-900/95 border-amber-400/50 text-white shadow-amber-950/20'
          : isResult
          ? 'bg-slate-900/95 border-emerald-400/50 text-white shadow-emerald-950/20'
          : 'bg-slate-900/95 border-blue-400/50 text-white shadow-blue-950/20'
      }`}
      role="alert"
    >
      {/* Subtle glowing ambient gradient behind icon */}
      <div
        className={`absolute -top-10 -left-10 w-24 h-24 rounded-full blur-xl pointer-events-none ${
          isCompetition
            ? 'bg-amber-400/20'
            : isResult
            ? 'bg-emerald-400/25'
            : 'bg-blue-400/20'
        }`}
      />

      <div className="p-3.5 sm:p-4 space-y-2.5 relative z-10">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                isCompetition
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : isResult
                  ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-blue-400/20 text-blue-300 border-blue-400/30'
              }`}
            >
              {isCompetition ? (
                <Trophy className="w-5 h-5 animate-bounce" />
              ) : isResult ? (
                <Award className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isCompetition
                      ? 'bg-amber-400 text-slate-950'
                      : isResult
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-blue-400 text-slate-950'
                  }`}
                >
                  {isCompetition
                    ? language === 'ta'
                      ? 'புதிய போட்டி'
                      : language === 'si'
                      ? 'නව තරඟය'
                      : 'New Competition'
                    : isResult
                    ? language === 'ta'
                      ? 'மதிப்பீடு முடிவு'
                      : language === 'si'
                      ? 'ප්‍රතිඵලය'
                      : 'Result Graded'
                    : 'Notice'}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {language === 'ta'
                      ? 'சற்றுமுன்'
                      : language === 'si'
                      ? 'දැන්'
                      : 'Just now'}
                  </span>
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white mt-0.5 tracking-tight line-clamp-1">
                {displayTitle}
              </h4>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            title={language === 'ta' ? 'மூடு' : 'Dismiss'}
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message description */}
        <p className="text-xs text-slate-300 leading-relaxed pl-11 line-clamp-2">
          {displayMessage}
        </p>

        {/* Dynamic Badges for Result or Competition */}
        {isResult && toast.meta && (
          <div className="pl-11 flex items-center gap-1.5 flex-wrap text-[11px] font-semibold">
            {toast.meta.score !== undefined && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {language === 'ta' ? 'புள்ளிகள்: ' : 'Score: '}
                {toast.meta.score}/{toast.meta.totalMarks || 100}
                {toast.meta.percentage !== undefined ? ` (${toast.meta.percentage}%)` : ''}
              </span>
            )}
            {toast.meta.rank !== undefined && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {language === 'ta' ? 'தரம்: #' : 'Rank: #'}
                {toast.meta.rank}
              </span>
            )}
            {toast.meta.award && (
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                🎖️ {toast.meta.award}
              </span>
            )}
          </div>
        )}

        {isCompetition && toast.meta && (
          <div className="pl-11 flex items-center gap-1.5 flex-wrap text-[11px] font-medium text-slate-300">
            {toast.meta.grade && (
              <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-white font-bold text-[10px]">
                {toast.meta.grade}
              </span>
            )}
            {toast.meta.entryType && (
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  toast.meta.entryType === 'Free'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {toast.meta.entryType === 'Free'
                  ? language === 'ta'
                    ? 'இலவசம்'
                    : language === 'si'
                    ? 'නොමිලේ'
                    : 'Free Entry'
                  : `Rs. ${toast.meta.entryFee || 0}`}
              </span>
            )}
          </div>
        )}

        {/* Action Button Row */}
        <div className="pl-11 pt-0.5 flex items-center justify-between gap-2">
          <button
            onClick={handleActionClick}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
              isCompetition
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black'
                : isResult
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span>{displayActionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] text-slate-400 italic">
            {isPaused
              ? language === 'ta'
                ? 'நிறுத்தப்பட்டது'
                : 'Paused'
              : ''}
          </span>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full h-1 bg-white/10">
        <div
          className={`h-full transition-all duration-75 ${
            isCompetition
              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : isResult
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
              : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const StudentGlobalToastContainer: React.FC = () => {
  const {
    studentToasts,
    dismissStudentToast,
    clearAllStudentToasts,
    setStudentNav,
    toastSoundEnabled,
    setToastSoundEnabled,
    language,
    currentAuthUser,
    currentPortal,
  } = useApp();

  // Show only if authenticated
  if (!currentAuthUser) return null;

  // Only display for students or when student portal is viewed
  const isStudentContext =
    currentAuthUser.role === 'student' || currentPortal === 'student';

  if (!isStudentContext || !studentToasts || studentToasts.length === 0) {
    return null;
  }

  // Cap at 4 visible toasts to avoid overwhelming screen
  const visibleToasts = studentToasts.slice(0, 4);

  return (
    <aside
      aria-label="Student Notifications"
      className="fixed top-4 right-3 sm:right-5 z-[99999] flex flex-col gap-2.5 max-w-[360px] sm:max-w-md w-[calc(100vw-24px)] pointer-events-none"
    >
      {/* Toast Toolbar if multiple notifications */}
      {studentToasts.length > 1 && (
        <div className="pointer-events-auto self-end flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-white text-[11px] shadow-md backdrop-blur-md">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-slate-200">
            {studentToasts.length}{' '}
            {language === 'ta'
              ? 'அறிவிப்புகள்'
              : language === 'si'
              ? 'දැනුම්දීම්'
              : 'Alerts'}
          </span>

          <span className="text-slate-600">|</span>

          {/* Sound Toggle */}
          <button
            onClick={() => setToastSoundEnabled(!toastSoundEnabled)}
            className="p-0.5 rounded text-slate-300 hover:text-white transition cursor-pointer"
            title={
              toastSoundEnabled
                ? language === 'ta'
                  ? 'ஒலியை முடக்கு'
                  : 'Mute Chime'
                : language === 'ta'
                ? 'ஒலியை இயக்கு'
                : 'Enable Chime'
            }
          >
            {toastSoundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          <span className="text-slate-600">|</span>

          {/* Clear all */}
          <button
            onClick={clearAllStudentToasts}
            className="text-[10px] font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer underline ml-1"
          >
            {language === 'ta'
              ? 'அனைத்தும் நீக்கு'
              : language === 'si'
              ? 'සියල්ල ඉවත් කරන්න'
              : 'Clear all'}
          </button>
        </div>
      )}

      {/* Render list of toasts */}
      {visibleToasts.map((toast) => (
        <SingleToastCard
          key={toast.id}
          toast={toast}
          onDismiss={dismissStudentToast}
          onNavigateTab={setStudentNav}
          language={language}
        />
      ))}
    </aside>
  );
};
