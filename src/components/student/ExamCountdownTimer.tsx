import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  CheckCircle2,
  Hourglass,
  Loader2,
} from 'lucide-react';

interface ExamCountdownTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  isLocked: boolean;
  onTimeUp: () => void;
  language?: 'en' | 'ta' | 'si';
  isSubmitting?: boolean;
  className?: string;
}

export const ExamCountdownTimer: React.FC<ExamCountdownTimerProps> = ({
  totalSeconds,
  remainingSeconds,
  isLocked,
  onTimeUp,
  language = 'en',
  isSubmitting = false,
  className = '',
}) => {
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [showLowTimeNotice, setShowLowTimeNotice] = useState<boolean>(false);
  const hasTriggeredTimeUpRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Calculate percentage remaining (0 to 100)
  const percentRemaining = useMemo(() => {
    if (totalSeconds <= 0) return 0;
    return Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
  }, [remainingSeconds, totalSeconds]);

  // Determine alert phase
  const alertPhase = useMemo<'normal' | 'warning' | 'critical' | 'expired'>(() => {
    if (remainingSeconds <= 0) return 'expired';
    if (remainingSeconds <= 60) return 'critical'; // < 1 min
    if (remainingSeconds <= 300) return 'warning'; // < 5 mins
    return 'normal';
  }, [remainingSeconds]);

  // Gentle audio beep synthesizer for final 10 seconds (if audio is enabled)
  const playBeep = (freq: number = 880, duration: number = 0.15) => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + duration);
      }
    } catch {}
  };

  // Trigger time up auto-submit once when remainingSeconds reaches 0
  useEffect(() => {
    if (remainingSeconds <= 0 && !hasTriggeredTimeUpRef.current && !isLocked) {
      hasTriggeredTimeUpRef.current = true;
      playBeep(440, 0.4);
      onTimeUp();
    }
  }, [remainingSeconds, isLocked, onTimeUp]);

  // Warning toast when 5 mins or 1 min remain
  useEffect(() => {
    if (remainingSeconds === 300 || remainingSeconds === 60) {
      setShowLowTimeNotice(true);
      playBeep(660, 0.2);
      const timer = setTimeout(() => setShowLowTimeNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [remainingSeconds]);

  // Beep on final 10 seconds
  useEffect(() => {
    if (remainingSeconds > 0 && remainingSeconds <= 10) {
      playBeep(remainingSeconds === 1 ? 1200 : 880, 0.1);
    }
  }, [remainingSeconds]);

  // Format time as HH:MM:SS or MM:SS
  const formatTimeParts = useMemo(() => {
    const s = Math.max(0, remainingSeconds);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      hasHours: hours > 0,
    };
  }, [remainingSeconds]);

  // Circular progress calculations (Radius = 18, circumference = 2 * PI * 18 = 113.097)
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentRemaining / 100) * circumference;

  // Colors according to alert phase
  const theme = useMemo(() => {
    switch (alertPhase) {
      case 'expired':
        return {
          wrapper: 'bg-red-950/90 border-red-500/80 text-red-200 ring-2 ring-red-500/50',
          strokeColor: '#EF4444',
          trackColor: 'rgba(239, 68, 68, 0.2)',
          badgeColor: 'bg-red-500 text-white',
          textColor: 'text-red-400',
        };
      case 'critical':
        return {
          wrapper: 'bg-red-950/90 border-red-500 text-red-100 animate-pulse ring-4 ring-red-500/40 shadow-lg shadow-red-900/40',
          strokeColor: '#F87171',
          trackColor: 'rgba(248, 113, 113, 0.2)',
          badgeColor: 'bg-red-600 text-white',
          textColor: 'text-red-300',
        };
      case 'warning':
        return {
          wrapper: 'bg-amber-950/80 border-amber-500/80 text-amber-200 ring-2 ring-amber-400/30',
          strokeColor: '#FBBF24',
          trackColor: 'rgba(251, 191, 36, 0.2)',
          badgeColor: 'bg-amber-500 text-slate-900 font-bold',
          textColor: 'text-amber-300',
        };
      case 'normal':
      default:
        return {
          wrapper: 'bg-slate-900/90 border-slate-700 text-white shadow-inner',
          strokeColor: '#34D399',
          trackColor: 'rgba(52, 211, 153, 0.15)',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
          textColor: 'text-emerald-400',
        };
    }
  }, [alertPhase]);

  return (
    <div className={`relative inline-flex items-center gap-2.5 ${className}`}>
      {/* Countdown Card Widget */}
      <div
        id="exam-countdown-timer-widget"
        className={`flex items-center gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl border transition-all duration-300 select-none ${theme.wrapper}`}
        title={`Exam Duration: ${Math.round(totalSeconds / 60)} minutes`}
      >
        {/* SVG Circular Progress Ring */}
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 40 40">
            {/* Background Track */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke={theme.trackColor}
              strokeWidth="3.5"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke={theme.strokeColor}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-linear"
            />
          </svg>

          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : alertPhase === 'critical' ? (
              <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            ) : alertPhase === 'warning' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Digital Time Readout */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-0.5 font-mono font-black text-sm sm:text-base leading-none tracking-tight">
            {formatTimeParts.hasHours && (
              <>
                <span className="tabular-nums">{formatTimeParts.hours}</span>
                <span className="opacity-60 text-xs">:</span>
              </>
            )}
            <span className="tabular-nums">{formatTimeParts.minutes}</span>
            <span className="opacity-60 text-xs">:</span>
            <span className={`tabular-nums ${theme.textColor}`}>
              {formatTimeParts.seconds}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
              {alertPhase === 'expired'
                ? language === 'ta'
                  ? 'நேரம் முடிந்தது'
                  : language === 'si'
                  ? 'කාලය අවසන්'
                  : 'Time Expired'
                : alertPhase === 'critical'
                ? language === 'ta'
                  ? 'கடைசி நிமிடம்'
                  : language === 'si'
                  ? 'අවසන් විනාඩිය'
                  : 'Final Minute'
                : language === 'ta'
                ? 'மீதமுள்ள நேரம்'
                : language === 'si'
                ? 'ඉතිරි කාලය'
                : 'Remaining'}
            </span>

            {/* Subtle percentage pill */}
            <span className="text-[9px] font-bold opacity-60">
              {Math.round(percentRemaining)}%
            </span>
          </div>
        </div>

        {/* Optional Audio Ticker Toggle for Students */}
        <button
          type="button"
          onClick={() => {
            const next = !audioEnabled;
            setAudioEnabled(next);
            if (next) playBeep(880, 0.1);
          }}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          title={audioEnabled ? 'Disable audio warning chime' : 'Enable audio warning chime'}
        >
          {audioEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
          )}
        </button>
      </div>

      {/* Floating Low-Time Notification Toast */}
      {showLowTimeNotice && (
        <div
          role="alert"
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xl border border-amber-300 flex items-center gap-2 animate-bounce"
        >
          <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          <span>
            {remainingSeconds <= 60
              ? language === 'ta'
                ? '⚠️ எச்சரிக்கை: 1 நிமிடமே உள்ளது! விடைகள் தானாகச் சமர்ப்பிக்கப்படும்.'
                : language === 'si'
                ? '⚠️ අවවාදයයි: තව ඇත්තේ විනාඩි 1ක් පමණි! පිළිතුරු ස්වයංක්‍රීයව යොමු වේ.'
                : '⚠️ Warning: Less than 1 minute remaining! Auto-submit will trigger.'
              : language === 'ta'
              ? '⚠️ கவனத்திற்கு: இன்னும் 5 நிமிடங்களே உள்ளன.'
              : language === 'si'
              ? '⚠️ අවධානයට: තව ඉතිරිව ඇත්තේ මිනිත්තු 5ක් පමණි.'
              : '⚠️ Heads up: Only 5 minutes remaining.'}
          </span>
        </div>
      )}
    </div>
  );
};
