import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  RefreshCw,
  AlertTriangle,
  User,
  CheckCircle2,
} from 'lucide-react';

interface SessionTimeoutWarningProps {
  /**
   * Total idle time in milliseconds before automatic logout.
   * Default: 15 minutes (900,000 ms).
   */
  idleTimeoutMs?: number;
  /**
   * Remaining time in milliseconds when the warning modal should appear.
   * Default: 2 minutes (120,000 ms).
   */
  warningThresholdMs?: number;
  /**
   * Allows external components (e.g. Settings / Header) to trigger a test simulation.
   */
  enableTestTrigger?: boolean;
}

const STORAGE_LAST_ACTIVE_KEY = 'hnc_session_last_active';
export const SESSION_TIMEOUT_MSG_KEY = 'hnc_session_timeout_msg';

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  idleTimeoutMs = 15 * 60 * 1000, // 15 minutes
  warningThresholdMs = 2 * 60 * 1000, // 2 minutes (120 seconds)
}) => {
  const {
    currentAuthUser,
    logout,
    language,
    currentPortal,
    activeExamComp,
    examSessionStage,
  } = useApp();

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.floor(warningThresholdMs / 1000)
  );
  const [showExtendedToast, setShowExtendedToast] = useState(false);

  // References for activity time and debounce
  const lastActiveRef = useRef<number>(Date.now());
  const lastEventThrottleRef = useRef<number>(0);
  const extendButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the "Extend Session" button whenever modal opens for quick keyboard response (Enter/Space)
  useEffect(() => {
    if (isWarningOpen) {
      const timer = setTimeout(() => {
        extendButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isWarningOpen]);

  // Whenever user authenticates or mounts, refresh session timestamp to prevent stale timeout
  useEffect(() => {
    if (currentAuthUser) {
      const now = Date.now();
      lastActiveRef.current = now;
      lastEventThrottleRef.current = now;
      try {
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(now));
      } catch {}
    }
  }, [currentAuthUser?.uid]);

  // Record user activity
  const recordActivity = useCallback(() => {
    // If warning modal is already shown, do NOT silently dismiss it via mouse movement.
    // The user must explicitly click "Extend Session" to confirm presence.
    if (isWarningOpen) return;

    const now = Date.now();
    // Throttle event updates to at most once per 1000ms
    if (now - lastEventThrottleRef.current > 1000) {
      lastEventThrottleRef.current = now;
      lastActiveRef.current = now;
      try {
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(now));
      } catch {
        // Ignore localStorage errors in private mode
      }
    }
  }, [isWarningOpen]);

  // Explicitly extend the session
  const handleExtendSession = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;
    lastEventThrottleRef.current = now;
    try {
      localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(now));
    } catch {}

    setIsWarningOpen(false);
    setShowExtendedToast(true);
    setTimeout(() => {
      setShowExtendedToast(false);
    }, 3500);
  }, []);

  // Handle immediate manual logout from modal
  const handleLogoutNow = useCallback(async () => {
    setIsWarningOpen(false);
    try {
      sessionStorage.setItem(
        SESSION_TIMEOUT_MSG_KEY,
        language === 'ta'
          ? 'உங்கள் அமர்விலிருந்து வெற்றிகரமாக வெளியேறிவிட்டீர்கள்.'
          : language === 'si'
          ? 'ඔබ ඔබේ සැසියෙන් සාර්ථකව ඉවත් විය.'
          : 'You have signed out of your session.'
      );
    } catch {}
    await logout();
  }, [logout, language]);

  // Multi-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_LAST_ACTIVE_KEY && e.newValue) {
        const remoteTimestamp = parseInt(e.newValue, 10);
        if (!isNaN(remoteTimestamp) && remoteTimestamp > lastActiveRef.current) {
          lastActiveRef.current = remoteTimestamp;
          // If warning was open but user was active in another tab, close it
          if (isWarningOpen) {
            setIsWarningOpen(false);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isWarningOpen]);

  // Support custom event for simulation / testing from settings or dev tools
  useEffect(() => {
    const handleSimulateWarning = (e: Event) => {
      const customEvent = e as CustomEvent<{ testSeconds?: number }>;
      const testSec = customEvent.detail?.testSeconds || 60;
      setSecondsRemaining(testSec);
      setIsWarningOpen(true);
    };

    window.addEventListener('hnc_simulate_session_timeout', handleSimulateWarning);
    return () => {
      window.removeEventListener('hnc_simulate_session_timeout', handleSimulateWarning);
    };
  }, []);

  // Register user interaction event listeners
  useEffect(() => {
    if (!currentAuthUser) return;

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
    };
  }, [currentAuthUser?.uid, recordActivity]);

  // Core countdown & timeout check loop (runs every second)
  useEffect(() => {
    if (!currentAuthUser) {
      setIsWarningOpen(false);
      return;
    }

    const interval = setInterval(() => {
      // 1. Sync timestamp from localStorage in case user interacted or auto-saved in same window/tab
      try {
        const storedLastActive = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
        if (storedLastActive) {
          const parsed = parseInt(storedLastActive, 10);
          if (!isNaN(parsed) && parsed > lastActiveRef.current) {
            lastActiveRef.current = parsed;
          }
        }
        const isExamEditorActive = localStorage.getItem('hnc_exam_editor_active') === 'true';
        if (isExamEditorActive) {
          lastActiveRef.current = Date.now();
          if (isWarningOpen) setIsWarningOpen(false);
          return;
        }
      } catch {}

      // Immunity shield: if a student is actively taking a timed exam, keep refreshing activity
      // so exam candidate is never abruptly logged out while reading or thinking.
      if (activeExamComp && examSessionStage === 'taking') {
        lastActiveRef.current = Date.now();
        if (isWarningOpen) setIsWarningOpen(false);
        return;
      }

      const now = Date.now();
      const elapsed = now - lastActiveRef.current;
      const remainingMs = idleTimeoutMs - elapsed;

      // Check if timeout has expired
      if (remainingMs <= 0) {
        clearInterval(interval);
        setIsWarningOpen(false);
        try {
          sessionStorage.setItem(
            SESSION_TIMEOUT_MSG_KEY,
            language === 'ta'
              ? 'செயலற்ற தன்மை காரணமாக பாதுகாப்பு கருதி உங்கள் அமர்வு காலாவதியானது. தயவுசெய்து மீண்டும் உள்நுழையவும்.'
              : language === 'si'
              ? 'අක්‍රියතාව හේතුවෙන් ආරක්ෂාව සඳහා ඔබේ සැසිය කල් ඉකුත් විය. කරුණාකර නැවත ඇතුළු වන්න.'
              : 'Your session timed out due to inactivity for security. Please sign in again.'
          );
        } catch {}
        logout();
        return;
      }

      // Check if we entered warning threshold
      if (remainingMs <= warningThresholdMs) {
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setSecondsRemaining(remainingSec);
        if (!isWarningOpen) {
          setIsWarningOpen(true);
        }
      } else {
        if (isWarningOpen) {
          setIsWarningOpen(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    currentAuthUser?.uid,
    idleTimeoutMs,
    warningThresholdMs,
    isWarningOpen,
    logout,
    language,
    activeExamComp,
    examSessionStage,
  ]);

  if (!currentAuthUser) return null;

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isUrgent = secondsRemaining <= 30;
  const totalWarningSec = Math.floor(warningThresholdMs / 1000);
  const progressPercent = Math.min(
    100,
    Math.max(0, (secondsRemaining / totalWarningSec) * 100)
  );

  return (
    <>
      {/* Toast Notification when session is successfully extended */}
      {showExtendedToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-[9999] animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="bg-emerald-900/90 text-white border border-emerald-500/40 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {language === 'ta'
                  ? 'அமர்வு வெற்றிகரமாக நீட்டிக்கப்பட்டது'
                  : language === 'si'
                  ? 'සැසිය සාර්ථකව දීර්ඝ කරන ලදී'
                  : 'Session Successfully Extended'}
              </p>
              <p className="text-[11px] text-emerald-200">
                {language === 'ta'
                  ? 'உங்கள் பணித்தளம் பாதுகாப்பாக தொடர்கிறது.'
                  : language === 'si'
                  ? 'ඔබේ වැඩපොළ ආරක්ෂිතව පවතී.'
                  : 'You will remain securely signed in.'}
              </p>
            </div>
          </div>
        </aside>
      )}

      {/* Warning Dialog Modal */}
      {isWarningOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-warning-title"
          aria-describedby="session-warning-description"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top decorative accent bar that shrinks with countdown */}
            <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  isUrgent
                    ? 'bg-rose-600 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              {/* Header with animated countdown badge */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-colors ${
                      isUrgent
                        ? 'bg-rose-50 border-rose-200 text-rose-600 animate-bounce'
                        : 'bg-amber-50 border-amber-200 text-amber-600'
                    }`}
                  >
                    {isUrgent ? (
                      <AlertTriangle className="w-6 h-6 text-rose-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {language === 'ta'
                        ? 'பாதுகாப்பு எச்சரிக்கை'
                        : language === 'si'
                        ? 'ආරක්ෂක අනතුරු ඇඟවීම'
                        : 'Security Alert'}
                    </span>
                    <h2
                      id="session-warning-title"
                      className="text-base sm:text-lg font-black text-slate-900 mt-1"
                    >
                      {language === 'ta'
                        ? 'அமர்வு விரைவில் காலாவதியாகிறது!'
                        : language === 'si'
                        ? 'සැසිය ඉක්මනින් අවසන් වේ!'
                        : 'Session Timeout Warning'}
                    </h2>
                  </div>
                </div>

                {/* Digital Clock Display */}
                <div
                  className={`px-3 py-1.5 rounded-xl border text-center font-mono font-black ${
                    isUrgent
                      ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                      : 'bg-slate-900 text-amber-400 border-slate-800 shadow-inner'
                  }`}
                >
                  <span className="text-xl sm:text-2xl tracking-wider block">
                    {formatTime(secondsRemaining)}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-sans opacity-70 block">
                    {language === 'ta' ? 'மீதமுள்ளது' : 'Remaining'}
                  </span>
                </div>
              </div>

              {/* Informative Explanation */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
                <p
                  id="session-warning-description"
                  className="text-slate-600 leading-relaxed font-medium"
                >
                  {language === 'ta'
                    ? 'நீங்கள் சிறிது நேரமாக செயலற்ற நிலையில் உள்ளீர்கள். உங்கள் கல்வி விபரங்கள் மற்றும் கணக்கின் பாதுகாப்பிற்காக இந்த அமர்வு தானாகவே மூடப்படவுள்ளது.'
                    : language === 'si'
                    ? 'ඔබ යම් කාලයක් අක්‍රියව සිට ඇත. ඔබේ ගිණුමේ සහ විභාග තොරතුරුවල ආරක්ෂාව සඳහා මෙම සැසිය ස්වයංක්‍රීයව අවසන් වනු ඇත.'
                    : 'You have been inactive for a while. To safeguard your examination entries and personal data, your session will automatically log out.'}
                </p>

                {/* Logged in User Identification */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-slate-500 text-[11px]">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {language === 'ta' ? 'உள்நுழைந்துள்ள பயனர்:' : 'Signed in as:'}{' '}
                    <strong className="text-slate-700 font-bold">
                      {currentAuthUser.fullName}
                    </strong>{' '}
                    <span className="capitalize text-slate-400">
                      ({currentPortal.replace('_', ' ')})
                    </span>
                  </span>
                </div>
              </div>

              {/* Urgent Advice when <= 30 seconds */}
              {isUrgent && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-pulse">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {language === 'ta'
                      ? 'கவனிக்க: சேமிக்கப்படாத மாற்றங்கள் இழக்கப்படலாம். தொடர உடனடியாக "அமர்வை நீட்டிக்கவும்" அழுத்தவும்.'
                      : language === 'si'
                      ? 'අවධානයට: සුරැකි නොකළ දත්ත අහිමි විය හැක. කරුණාකර සැසිය දීර්ඝ කරන්න.'
                      : 'Urgent: Click "Extend Session" now to prevent automatic sign-out.'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  ref={extendButtonRef}
                  id="btn-extend-session"
                  type="button"
                  onClick={handleExtendSession}
                  className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-blue-500/30 focus:outline-none"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    {language === 'ta'
                      ? 'அமர்வை நீட்டிக்கவும் (Extend)'
                      : language === 'si'
                      ? 'සැසිය දීර්ඝ කරන්න (Extend)'
                      : 'Extend Session'}
                  </span>
                </button>

                <button
                  id="btn-logout-session-timeout"
                  type="button"
                  onClick={handleLogoutNow}
                  className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>
                    {language === 'ta'
                      ? 'வெளியேறுக'
                      : language === 'si'
                      ? 'ඉවත් වන්න'
                      : 'Log Out'}
                  </span>
                </button>
              </div>

              {/* Keyboard helper hint */}
              <p className="text-[10px] text-center text-slate-400">
                {language === 'ta'
                  ? 'விசைப்பலகை குறுக்குவழி: அமர்வை நீட்டிக்க Space அல்லது Enter அழுத்தவும்.'
                  : 'Press Space or Enter to immediately extend your session.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
