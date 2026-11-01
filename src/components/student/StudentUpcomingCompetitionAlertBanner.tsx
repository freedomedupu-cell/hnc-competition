import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition } from '../../types';
import {
  evaluateUpcomingCompetitionsAlert,
  getStoredWhatsappSmsSettings,
  markUpcomingAlertAsSent,
  logWhatsappSmsDispatch,
  buildWhatsappChatUrl,
  buildNativeSmsUrl,
} from '../../utils/whatsappSmsNotificationService';
import { playSubjectPublicationChime } from '../../utils/subjectNotificationUtils';
import {
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  X,
  Bell,
  Award,
} from 'lucide-react';

interface StudentUpcomingCompetitionAlertBannerProps {
  onViewCompetition: (comp: Competition) => void;
  onOpenWhatsappSettings?: () => void;
}

export const StudentUpcomingCompetitionAlertBanner: React.FC<StudentUpcomingCompetitionAlertBannerProps> = ({
  onViewCompetition,
  onOpenWhatsappSettings,
}) => {
  const {
    competitions,
    currentStudent,
    isStudentRegistered,
    hasStudentSubmitted,
    language,
  } = useApp();

  const [activeAlerts, setActiveAlerts] = useState<
    Array<{
      competition: Competition;
      hoursLeft: number;
      messageText: string;
      whatsappUrl: string;
      smsUrl: string;
    }>
  >([]);

  const [dismissedCompIds, setDismissedCompIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('hnc_dismissed_upcoming_alerts');
        return raw ? JSON.parse(raw) : [];
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (!currentStudent || !currentStudent.id) return;

    const runUpcomingCheck = () => {
      const { dueAlerts } = evaluateUpcomingCompetitionsAlert(
        competitions,
        currentStudent,
        isStudentRegistered,
        hasStudentSubmitted
      );

      const unDismissed = dueAlerts.filter((a) => !dismissedCompIds.includes(a.competition.id));

      if (unDismissed.length > 0) {
        // Play gentle chime
        playSubjectPublicationChime();

        // Mark each as sent in local storage and log dispatch
        unDismissed.forEach((item) => {
          markUpcomingAlertAsSent(currentStudent.id, item.competition.id);

          logWhatsappSmsDispatch({
            studentId: currentStudent.id,
            studentName: currentStudent.name || 'Candidate',
            recipientPhone: currentStudent.phone || getStoredWhatsappSmsSettings().whatsappNumber || '',
            channel: 'both',
            triggerType: 'upcoming_competition',
            competitionId: item.competition.id,
            competitionTitle: item.competition.title,
            messageText: item.messageText,
            status: 'sent',
          });
        });

        setActiveAlerts(unDismissed);
      } else {
        setActiveAlerts([]);
      }
    };

    runUpcomingCheck();
    const interval = setInterval(runUpcomingCheck, 30000);
    return () => clearInterval(interval);
  }, [competitions, currentStudent?.id, dismissedCompIds, isStudentRegistered, hasStudentSubmitted]);

  const handleDismiss = (compId: string) => {
    const updated = [...dismissedCompIds, compId];
    setDismissedCompIds(updated);
    try {
      sessionStorage.setItem('hnc_dismissed_upcoming_alerts', JSON.stringify(updated));
    } catch {}
    setActiveAlerts((prev) => prev.filter((a) => a.competition.id !== compId));
  };

  if (activeAlerts.length === 0) return null;

  const topAlert = activeAlerts[0];
  const comp = topAlert.competition;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white p-4 sm:p-5 shadow-lg border border-indigo-700/50 mb-6 animate-in fade-in slide-in-from-top-3">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300">
            <Calendar className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400 text-slate-950 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {language === 'ta'
                    ? `இன்னும் ${topAlert.hoursLeft} மணிநேரத்தில்`
                    : `Starts in ${topAlert.hoursLeft} hours`}
                </span>
              </span>

              <span className="text-xs font-semibold text-indigo-200">
                {comp.category} • {comp.grade || 'All Grades'}
              </span>

              {activeAlerts.length > 1 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/40 text-indigo-200 border border-indigo-400/20">
                  +{activeAlerts.length - 1} more scheduled
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">
              {comp.title}
            </h3>

            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xl">
              {language === 'ta'
                ? 'அதிகாரப்பூர்வ போட்டி விரைவில் தொடங்குகிறது! பாடத்திட்டத்தை மீள்நோக்கி பதிவு செய்து தயார் நிலையில் இருங்கள்.'
                : 'National academic contest starts soon. Review competition details and prepare your entry ahead of time.'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {topAlert.whatsappUrl && (
            <a
              href={topAlert.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              title="Open WhatsApp Alert"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Alert</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => onViewCompetition(comp)}
            className="px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>{language === 'ta' ? 'விவரங்களைப் பார்' : 'View Competition'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleDismiss(comp.id)}
            className="p-2 text-indigo-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
