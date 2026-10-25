import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition } from '../../types';
import {
  evaluateUpcomingExamsFor15MinAlert,
  getStoredWhatsappSmsSettings,
  mark15MinAlertAsSent,
  logWhatsappSmsDispatch,
  buildWhatsappChatUrl,
  buildNativeSmsUrl,
} from '../../utils/whatsappSmsNotificationService';
import { playSubjectPublicationChime } from '../../utils/subjectNotificationUtils';
import {
  Clock,
  AlertTriangle,
  MessageSquare,
  Smartphone,
  ExternalLink,
  X,
  Play,
  Sparkles,
  Settings,
} from 'lucide-react';

interface PreExam15MinAlertBannerProps {
  onJoinCompetition: (comp: Competition) => void;
  onOpenWhatsappSettings: () => void;
}

export const PreExam15MinAlertBanner: React.FC<PreExam15MinAlertBannerProps> = ({
  onJoinCompetition,
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
      minutesLeft: number;
      messageText: string;
      whatsappUrl: string;
      smsUrl: string;
    }>
  >([]);

  const [dismissedCompIds, setDismissedCompIds] = useState<string[]>([]);

  useEffect(() => {
    if (!currentStudent || !currentStudent.id) return;

    const runCheck = () => {
      const { dueAlerts } = evaluateUpcomingExamsFor15MinAlert(
        competitions,
        currentStudent,
        isStudentRegistered,
        hasStudentSubmitted
      );

      const unDismissed = dueAlerts.filter((a) => !dismissedCompIds.includes(a.competition.id));

      if (unDismissed.length > 0) {
        // Play chime once
        playSubjectPublicationChime();

        // Mark each as sent in local storage
        unDismissed.forEach((item) => {
          mark15MinAlertAsSent(currentStudent.id, item.competition.id);

          logWhatsappSmsDispatch({
            studentId: currentStudent.id,
            studentName: currentStudent.name || 'Candidate',
            recipientPhone: currentStudent.phone || getStoredWhatsappSmsSettings().whatsappNumber || '',
            channel: 'both',
            triggerType: '15_min_before_exam',
            competitionId: item.competition.id,
            competitionTitle: item.competition.title,
            messageText: item.messageText,
            status: 'sent',
          });
        });

        setActiveAlerts(unDismissed);
      }
    };

    // Run on mount
    runCheck();

    // Check every 15 seconds
    const interval = setInterval(runCheck, 15000);
    return () => clearInterval(interval);
  }, [competitions, currentStudent?.id, dismissedCompIds, isStudentRegistered, hasStudentSubmitted]);

  if (activeAlerts.length === 0) return null;

  const firstAlert = activeAlerts[0];
  const comp = firstAlert.competition;

  const handleDismiss = () => {
    setDismissedCompIds((prev) => [...prev, comp.id]);
    setActiveAlerts((prev) => prev.filter((a) => a.competition.id !== comp.id));
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 text-white p-4 sm:p-5 border-2 border-amber-400 shadow-xl shadow-rose-950/30 animate-pulse">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center text-xl shrink-0 shadow-md shadow-amber-500/30 animate-bounce">
            🚨
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                {language === 'ta' ? 'அவசர நினைவூட்டல் (Starting Soon)' : 'Exam Starting Soon!'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500 text-white border border-rose-400">
                ⏱️ {firstAlert.minutesLeft === 0 ? 'Starts NOW!' : `In ${firstAlert.minutesLeft} Mins`}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight line-clamp-1">
              {comp.title}
            </h3>

            <p className="text-xs text-amber-200/90 leading-tight">
              {language === 'ta'
                ? `உங்கள் பரீட்சை தொடங்க இன்னும் 15 நிமிடங்கள் மட்டுமே உள்ளது. உடனே பரீட்சை அறைக்குச் செல்லவும் அல்லது வாட்ஸ்அப் செய்தியைப் பெறவும்!`
                : `Your registered exam starts officially in ${firstAlert.minutesLeft} minutes. Launch WhatsApp reminder or join live exam room now!`}
            </p>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 flex-wrap">
          {/* WhatsApp Direct Trigger */}
          <a
            href={firstAlert.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
          >
            <MessageSquare className="w-4 h-4 fill-emerald-200" />
            <span>{language === 'ta' ? 'வாட்ஸ்அப் செய்தி' : 'Send WhatsApp Alert'}</span>
          </a>

          {/* Join Exam Room */}
          <button
            type="button"
            onClick={() => onJoinCompetition(comp)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{language === 'ta' ? 'பரீட்சை அறைக்குச் செல்க' : 'Join Exam Room Now'}</span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenWhatsappSettings}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition"
            title="Configure WhatsApp settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
