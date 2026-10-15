import React, { useEffect, useState } from 'react';
import { Check, CloudCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved';

interface SavePulseIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date | null;
  className?: string;
  variant?: 'dark' | 'light' | 'pill';
  size?: 'xs' | 'sm' | 'md';
  language?: 'en' | 'ta' | 'si';
  customLabel?: string;
  customSavingLabel?: string;
  showTimestamp?: boolean;
}

export const SavePulseIndicator: React.FC<SavePulseIndicatorProps> = ({
  status,
  lastSavedAt,
  className = '',
  variant = 'light',
  size = 'sm',
  language = 'en',
  customLabel,
  customSavingLabel,
  showTimestamp = true,
}) => {
  const [pulseTrigger, setPulseTrigger] = useState(false);

  // Trigger brief pulse animation whenever lastSavedAt changes or transitions to saved
  useEffect(() => {
    if (status === 'saved') {
      setPulseTrigger(true);
      const timer = setTimeout(() => setPulseTrigger(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [status, lastSavedAt]);

  const getSavedLabel = () => {
    if (customLabel) return customLabel;
    if (language === 'ta') return 'மாற்றங்கள் சேமிக்கப்பட்டன';
    if (language === 'si') return 'වෙනස්කම් සුරැකිණි';
    return 'Changes saved';
  };

  const getSavingLabel = () => {
    if (customSavingLabel) return customSavingLabel;
    if (language === 'ta') return 'தானாக சேமிக்கப்படுகிறது...';
    if (language === 'si') return 'සුරැකෙමින් පවතී...';
    return 'Saving in real-time...';
  };

  const formatSavedTime = (date?: Date | null) => {
    if (!date) return '';
    try {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const formattedTime = formatSavedTime(lastSavedAt);

  // Styles based on variant
  const isDark = variant === 'dark';
  const isPill = variant === 'pill';

  const containerBg = isDark
    ? status === 'saving'
      ? 'bg-blue-950/70 border-blue-800/80 text-blue-200'
      : 'bg-emerald-950/60 border-emerald-800/70 text-emerald-300'
    : isPill
    ? status === 'saving'
      ? 'bg-blue-50/90 border-blue-200 text-blue-700 shadow-xs'
      : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 shadow-xs'
    : status === 'saving'
    ? 'text-blue-600'
    : 'text-emerald-700';

  const textSize =
    size === 'xs'
      ? 'text-[10px]'
      : size === 'sm'
      ? 'text-[11px]'
      : 'text-xs';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 transition-all duration-300 select-none ${
        isDark || isPill
          ? `px-2.5 py-1 rounded-full border backdrop-blur-xs ${containerBg}`
          : `${containerBg}`
      } ${className}`}
      title={
        status === 'saving'
          ? 'Cloud synchronization in progress'
          : `All answers and inputs automatically secured to database${
              formattedTime ? ` at ${formattedTime}` : ''
            }`
      }
    >
      {status === 'saving' ? (
        <>
          <div className="relative flex items-center justify-center">
            <RefreshCw
              className={`animate-spin ${
                size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
              } text-blue-400`}
            />
          </div>
          <span className={`font-semibold tracking-tight ${textSize}`}>
            {getSavingLabel()}
          </span>
        </>
      ) : (
        <>
          <div className="relative flex items-center justify-center">
            {/* Subtle gentle ping ring when newly saved */}
            {pulseTrigger && (
              <span className="absolute -inset-0.5 rounded-full bg-emerald-400/50 animate-ping opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full ${
                pulseTrigger ? 'bg-emerald-400 scale-110' : 'bg-emerald-500'
              } transition-transform duration-300 ${
                size === 'xs' ? 'w-1.5 h-1.5' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
              }`}
            />
          </div>

          <div className="flex items-center gap-1">
            <Check
              className={`${
                size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
              } ${isDark ? 'text-emerald-400' : 'text-emerald-600'} shrink-0`}
              strokeWidth={2.5}
            />
            <span className={`font-semibold tracking-tight ${textSize}`}>
              {getSavedLabel()}
            </span>
          </div>

          {showTimestamp && formattedTime && (
            <span
              className={`opacity-70 font-mono text-[9px] ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              } hidden sm:inline`}
            >
              • {formattedTime}
            </span>
          )}
        </>
      )}
    </div>
  );
};
