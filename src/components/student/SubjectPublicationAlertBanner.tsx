import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition } from '../../types';
import {
  Bell,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  getStoredSubjectPushSettings,
  saveSubjectPushSettings,
  requestSubjectPushPermission,
  sendSubjectPublicationBrowserPush,
  playSubjectPublicationChime,
  SRI_LANKAN_ACADEMIC_SUBJECTS,
} from '../../utils/subjectNotificationUtils';
import { isGradeEligible } from '../../lib/gradeUtils';

interface SubjectPublicationAlertBannerProps {
  onViewDetails?: (comp: Competition) => void;
  onJoinCompetition?: (comp: Competition) => void;
  onOpenSubjectsModal?: () => void;
}

export const SubjectPublicationAlertBanner: React.FC<SubjectPublicationAlertBannerProps> = ({
  onViewDetails,
  onJoinCompetition,
  onOpenSubjectsModal,
}) => {
  const {
    competitions,
    studentEnrolledSubjects,
    subjectPublicationAlerts,
    dismissSubjectPublicationAlert,
    currentStudent,
    currentAuthUser,
    language,
  } = useApp();

  const [pushSettings, setPushSettings] = useState(getStoredSubjectPushSettings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestPushPermission = async () => {
    const res = await requestSubjectPushPermission();
    setPushSettings(getStoredSubjectPushSettings());

    if (res.granted) {
      showToast(
        language === 'ta'
          ? '🔔 உலாவி அறிவிப்புகள் வெற்றிகரமாக இயக்கப்பட்டன!'
          : language === 'si'
          ? '🔔 බ්‍රවුසර දැනුම්දීම් සාර්ථකව සක්‍රීය කරන ලදී!'
          : '🔔 Browser push notifications enabled successfully!'
      );
    } else if (res.permission === 'denied') {
      showToast(
        language === 'ta'
          ? '⚠️ உலாவியில் அறிவிப்பு அனுமதி மறுக்கப்பட்டுள்ளது. Browser Settings-இல் மாற்றவும்.'
          : '⚠️ Browser notification permission denied. Please allow it in browser settings.'
      );
    } else {
      showToast(
        language === 'ta'
          ? '⚠️ இந்த உலாவியில் புஷ் அறிவிப்புகள் ஆதரிக்கப்படவில்லை.'
          : '⚠️ Push notifications are not supported in this browser.'
      );
    }
  };

  const handleToggleSound = () => {
    const nextVal = !pushSettings.soundEnabled;
    const updated = saveSubjectPushSettings({ soundEnabled: nextVal });
    setPushSettings(updated);
    if (nextVal) {
      playSubjectPublicationChime();
      showToast(
        language === 'ta'
          ? '🔊 அறிவிப்பு ஒலி இயக்கப்பட்டது!'
          : '🔊 Push notification chime enabled!'
      );
    } else {
      showToast(
        language === 'ta'
          ? '🔇 அறிவிப்பு ஒலி முடக்கப்பட்டது.'
          : '🔇 Notification chime muted.'
      );
    }
  };

  const studentGrade = currentStudent?.gradeLevel || currentAuthUser?.grade || 'Grade 6';

  // Strict Grade Filter: Only show notifications matching student's enrolled grade (or open to all)
  const filteredAlerts = subjectPublicationAlerts.filter((a) => isGradeEligible(a.grade, studentGrade));

  const handleTestNotification = () => {
    // Pick the first available competition matching student's grade or create a sample
    const targetComp = competitions.find((c) => isGradeEligible(c.grade, studentGrade)) || competitions[0] || {
      id: 'comp-sample-test',
      title: 'Sri Lankan National Junior Science & STEM Quiz 2026',
      competitionType: 'Quiz',
      category: 'Science',
      grade: studentGrade,
      duration: 45,
    };

    const targetSubject = studentEnrolledSubjects[0] || 'Science';
    playSubjectPublicationChime();

    const sent = sendSubjectPublicationBrowserPush(targetComp as any, targetSubject, language);

    if (sent) {
      showToast(
        language === 'ta'
          ? '🔔 சோதனை அறிவிப்பு உங்கள் திரைக்கு அனுப்பப்பட்டது!'
          : '🔔 Test push notification & audio chime sent to your screen!'
      );
    } else {
      showToast(
        language === 'ta'
          ? '🔔 சோதனை ஒலி ஒலித்தது! (உலாவி அறிவிப்புக்கு "Allow Notification" கிளிக் செய்யவும்)'
          : '🔔 Audio chime played! (Click Allow Notifications to receive desktop push)'
      );
    }
  };

  const currentAlert = filteredAlerts[activeAlertIndex] || filteredAlerts[0];

  return (
    <div className="space-y-2">
      {/* Toast Notification message */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-bounce bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40 backdrop-blur-md flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PENDING NOTIFICATION ALERT BANNER */}
      {currentAlert ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-900 to-blue-950 text-white p-4 sm:p-5 border border-purple-500/40 shadow-lg shadow-purple-950/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center text-xl shrink-0 shadow-md shadow-amber-500/20 animate-pulse">
                🔔
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    {language === 'ta' ? 'பதிவு செய்யப்பட்ட பாடம்' : 'Enrolled Subject Alert'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                    {currentAlert.subject}
                  </span>
                  <span className="text-[10px] font-mono font-semibold bg-white/10 px-2 py-0.5 rounded text-blue-200">
                    {currentAlert.competitionType || 'Quiz'}
                  </span>
                  {filteredAlerts.length > 1 && (
                    <span className="text-[10px] bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                      {activeAlertIndex + 1} / {filteredAlerts.length}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-black text-white tracking-tight line-clamp-1">
                  {currentAlert.competitionTitle}
                </h3>

                <p className="text-xs text-indigo-200/90 leading-tight">
                  {language === 'ta'
                    ? `உங்கள் பாடத்திட்டத்தில் புதிய ${currentAlert.subject} போட்டி/வினாடி வினா வெளியிடப்பட்டுள்ளது. இப்போதே பதிவு செய்து பரிசுகளை வெல்லுங்கள்!`
                    : language === 'si'
                    ? `ඔබ ලියාපදිංචි වී ඇති විෂය සඳහා නව තරඟයක් ප්‍රකාශයට පත් කරන ලදී!`
                    : `A brand-new contest in your enrolled subject (${currentAlert.subject}) is officially published and accepting student registrations!`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0 flex-wrap">
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => {
                    const comp = competitions.find((c) => c.id === currentAlert.competitionId);
                    if (comp) onViewDetails(comp);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>{language === 'ta' ? 'விபரங்கள் & பதிவு' : 'View & Register'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              {filteredAlerts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveAlertIndex((prev) => (prev + 1) % filteredAlerts.length)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  {language === 'ta' ? 'அடுத்தது' : 'Next'} ({activeAlertIndex + 1}/{filteredAlerts.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => dismissSubjectPublicationAlert(currentAlert.id)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title={language === 'ta' ? 'நீக்குக' : 'Dismiss'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* QUICK ENROLLED SUBJECTS & PUSH NOTIFICATION RIBBON */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-300 uppercase tracking-wider shrink-0">
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{language === 'ta' ? 'பாட அறிவிப்புகள்' : 'Subject Alerts'}:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {studentEnrolledSubjects.slice(0, 4).map((subj) => {
              const matchedMeta = SRI_LANKAN_ACADEMIC_SUBJECTS.find(
                (s) => s.nameEn.toLowerCase() === subj.toLowerCase() || s.nameTa.includes(subj)
              );
              return (
                <span
                  key={subj}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/80 border border-indigo-700/50 text-indigo-200 flex items-center gap-1"
                >
                  <span>{matchedMeta?.icon || '📚'}</span>
                  <span>{subj}</span>
                </span>
              );
            })}
            {studentEnrolledSubjects.length > 4 && (
              <span className="text-[10px] text-slate-400 font-semibold">
                +{studentEnrolledSubjects.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
          {pushSettings.permission !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestPushPermission}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors flex items-center gap-1 shadow-xs"
              title="Allow Browser Push Notifications"
            >
              <Bell className="w-3 h-3" />
              <span>{language === 'ta' ? 'அறிவிப்பை இயக்கு' : 'Enable Push'}</span>
            </button>
          ) : (
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              <span>{language === 'ta' ? 'உலாவி புஷ் தயார்' : 'Push Active'}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg border transition-colors ${
              pushSettings.soundEnabled
                ? 'bg-blue-950/60 border-blue-700/50 text-blue-300 hover:bg-blue-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={pushSettings.soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {pushSettings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleTestNotification}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Test push notification & audio chime"
          >
            🔔 {language === 'ta' ? 'சோதனை' : 'Test'}
          </button>

          {onOpenSubjectsModal && (
            <button
              type="button"
              onClick={onOpenSubjectsModal}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/60 hover:bg-indigo-600 text-white border border-indigo-500/50 transition-colors flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              <span>{language === 'ta' ? 'பாடங்களை மாற்று' : 'Manage Subjects'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
