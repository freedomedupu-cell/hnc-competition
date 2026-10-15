import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition } from '../../types';
import {
  DeadlineAlert,
  getStudentDeadlineAlerts,
  getStoredPushSettings,
  savePushSettings,
  requestPushNotificationPermission,
  sendLocalPushNotification,
  playDeadlineAlertChime,
  checkAndSendAutomaticDeadlinePushes,
} from '../../utils/deadlineNotificationUtils';
import {
  Bell,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Volume2,
  VolumeX,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  ShieldAlert,
} from 'lucide-react';

interface StudentDeadlineAlertsBannerProps {
  onJoinCompetition: (comp: Competition) => void;
  onViewDetails?: (comp: Competition) => void;
}

export const StudentDeadlineAlertsBanner: React.FC<StudentDeadlineAlertsBannerProps> = ({
  onJoinCompetition,
  onViewDetails,
}) => {
  const {
    competitions,
    currentStudent,
    currentAuthUser,
    isStudentRegistered,
    hasStudentSubmitted,
    language,
    t,
  } = useApp();

  const [pushSettings, setPushSettings] = useState(getStoredPushSettings());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  const studentGrade = currentStudent?.gradeLevel || currentAuthUser?.grade || 'Grade 6';

  // Tick every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute active deadline alerts for this student
  const deadlineAlerts = React.useMemo(() => {
    return getStudentDeadlineAlerts(competitions, studentGrade, {
      isRegistered: (id) => isStudentRegistered(id),
      hasSubmitted: (id) => hasStudentSubmitted(id),
      nowDate: new Date(nowTime),
    });
  }, [competitions, studentGrade, isStudentRegistered, hasStudentSubmitted, nowTime]);

  // Attempt automatic push notifications once when urgent deadlines exist
  useEffect(() => {
    if (deadlineAlerts.length > 0 && pushSettings.enabled) {
      checkAndSendAutomaticDeadlinePushes(deadlineAlerts);
    }
  }, [deadlineAlerts, pushSettings.enabled]);

  const criticalCount = deadlineAlerts.filter((a) => a.urgency === 'critical').length;
  const urgentCount = deadlineAlerts.filter((a) => a.urgency === 'urgent').length;
  const totalCount = deadlineAlerts.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Enable / Request Push Notifications
  const handleTogglePush = async () => {
    if (!pushSettings.enabled) {
      const res = await requestPushNotificationPermission();
      if (res.granted) {
        const updated = savePushSettings({ enabled: true });
        setPushSettings(updated);
        showToast(
          language === 'ta'
            ? '🔔 புஷ் அறிவிப்புகள் வெற்றிகரமாக செயல்படுத்தப்பட்டன! காலக்கெடுகள் வரும்போது உங்களுக்கு அறிவிப்பு வரும்.'
            : '🔔 Push notifications enabled successfully! You will receive timely deadline alerts.'
        );
        sendLocalPushNotification('🎉 HNC Push Notifications Active', {
          body:
            language === 'ta'
              ? 'போட்டி காலக்கெடு அறிவிப்புகள் இனி உங்கள் சாதனத்தில் உடனடியாக தோன்றும்!'
              : 'You will now receive competition deadlines & exam reminders right on this device!',
          playChime: true,
        });
      } else {
        showToast(
          language === 'ta'
            ? '⚠️ புஷ் அனுமதி நிராகரிக்கப்பட்டது அல்லது இந்த உலாவியில் முடக்கப்பட்டுள்ளது. டாஷ்போர்டு அறிவிப்புகள் தொடரும்.'
            : '⚠️ Push permission denied or restricted. Dashboard visual alerts will continue normally.'
        );
      }
    } else {
      const updated = savePushSettings({ enabled: false });
      setPushSettings(updated);
      showToast(
        language === 'ta'
          ? '🔕 புஷ் அறிவிப்புகள் முடக்கப்பட்டன.'
          : '🔕 Push notifications paused.'
      );
    }
  };

  // Test Push Notification & Audio Chime
  const handleTestAlert = () => {
    const testTitle =
      criticalCount > 0
        ? `🔥 HNC அவசர காலக்கெடு சோதனை: ${deadlineAlerts[0]?.title}`
        : '⏰ HNC போட்டி காலக்கெடு அறிவிப்பு சோதனை';

    const testBody =
      criticalCount > 0
        ? deadlineAlerts[0]?.descriptionTa
        : language === 'ta'
        ? 'இது ஒரு சோதனை அறிவிப்பு! அனைத்து தேர்வு காலக்கெடுகளும் சரியாக கண்காணிக்கப்படுகின்றன.'
        : 'This is a test notification! All competition deadlines are being actively tracked.';

    if (pushSettings.soundEnabled) {
      playDeadlineAlertChime();
    }

    const sent = sendLocalPushNotification(testTitle, {
      body: testBody,
      tag: 'hnc-test-alert',
      playChime: false, // Handled above
      requireInteraction: false,
    });

    if (sent) {
      showToast(
        language === 'ta'
          ? '🔔 சோதனை அறிவிப்பு உங்கள் திரையில் அனுப்பப்பட்டது மற்றும் ஒலி ஒலித்தது!'
          : '🔔 Test notification & audio chime sent to your screen!'
      );
    } else {
      showToast(
        language === 'ta'
          ? '🔔 சோதனை ஒலி ஒலித்தது! (உலாவி அறிவிப்புக்கு "Allow Notification" கிளிக் செய்யவும்)'
          : '🔔 Audio chime played! (Click Allow Notification to receive desktop push)'
      );
    }
  };

  // Toggle Sound Chime
  const handleToggleSound = () => {
    const updated = savePushSettings({ soundEnabled: !pushSettings.soundEnabled });
    setPushSettings(updated);
    if (updated.soundEnabled) {
      playDeadlineAlertChime();
      showToast(language === 'ta' ? '🔊 அறிவிப்பு ஒலி இயக்கப்பட்டது' : '🔊 Chime sound enabled');
    } else {
      showToast(language === 'ta' ? '🔇 அறிவிப்பு ஒலி முடக்கப்பட்டது' : '🔇 Chime sound muted');
    }
  };

  // Helper for live countdown format
  const formatCountdown = (targetDate: Date) => {
    const diff = targetDate.getTime() - nowTime;
    if (diff <= 0) return '00:00:00';
    const totalSec = Math.floor(diff / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');

    if (d > 0) {
      return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
    }
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // If no deadline alerts at all, show a compact reassurance pill
  if (totalCount === 0) {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                {language === 'ta' ? 'அனைத்தும் தயார்' : 'Deadlines Status'}
              </span>
              <span className="text-xs font-bold text-emerald-950">
                {language === 'ta' ? 'தற்போது அவசர காலக்கெடு எதுவும் இல்லை' : 'No Critical Deadlines Pending'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {language === 'ta'
                ? `தரம் ${studentGrade} மாணவருக்கான அனைத்து பரீட்சை கால அட்டவணைகளும் சரியான நேரத்தில் உள்ளன.`
                : `All enrolled competition deadlines for ${studentGrade} are on schedule.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTogglePush}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
              pushSettings.enabled
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>
              {pushSettings.enabled
                ? language === 'ta' ? 'புஷ் ஆன் ✅' : 'Push ON ✅'
                : language === 'ta' ? 'புஷ் அறிவிப்பை இயக்கு' : 'Enable Push Alerts'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleTestAlert}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1"
            title="Test alert & sound"
          >
            <Volume2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{language === 'ta' ? 'சோதனை' : 'Test'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine top banner theme
  const hasCritical = criticalCount > 0;
  const bannerBorder = hasCritical
    ? 'border-rose-400 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-rose-500/10 ring-2 ring-rose-400/30'
    : 'border-amber-300 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10';

  return (
    <div className={`rounded-3xl border ${bannerBorder} p-3.5 sm:p-5 shadow-sm space-y-3 transition-all`}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          {/* Animated Glowing Icon */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              hasCritical
                ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white animate-pulse'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
            }`}
          >
            {hasCritical ? <Flame className="w-6 h-6 text-yellow-200" /> : <Clock className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  hasCritical
                    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />
                {language === 'ta' ? 'அவசர காலக்கெடு எச்சரிக்கை' : 'URGENT DEADLINES'}
              </span>

              {criticalCount > 0 && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                  {criticalCount} {language === 'ta' ? 'இன்று முடிவடைகிறது' : 'Ends Today'}
                </span>
              )}

              <span className="text-xs font-extrabold text-slate-800">
                {totalCount} {language === 'ta' ? 'செயலில் உள்ள காலக்கெடுகள்' : 'Active Deadlines'}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1 flex items-center gap-1.5">
              <span>
                {language === 'ta'
                  ? 'போட்டி மற்றும் தேர்வு காலக்கெடு அறிவிப்புகள்'
                  : 'Upcoming Competition Deadlines & Alerts'}
              </span>
            </h3>
          </div>
        </div>

        {/* Action Controls: Push Toggle, Test Chime, Collapse */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleTogglePush}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              pushSettings.enabled
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-current" />
            <span>
              {pushSettings.enabled
                ? language === 'ta' ? 'புஷ் ஆன் ✅' : 'Push Alerts ON ✅'
                : language === 'ta' ? 'புஷ் இயக்கு' : 'Enable Push'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleTestAlert}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition flex items-center gap-1 cursor-pointer"
            title="Test local push notification and audio chime"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ta' ? 'சோதனை செய்' : 'Test Alert'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-1.5 rounded-xl border transition ${
              pushSettings.soundEnabled
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={pushSettings.soundEnabled ? 'Chime sound is enabled' : 'Chime sound is muted'}
          >
            {pushSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Deadline Cards Grid (when expanded) */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {deadlineAlerts.map((alert) => {
            const isCrit = alert.urgency === 'critical';
            const countdown = formatCountdown(alert.targetDateTime);

            return (
              <div
                key={alert.id}
                className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border transition-all hover:shadow-md flex flex-col justify-between gap-3 ${
                  isCrit
                    ? 'bg-white border-rose-300 ring-1 ring-rose-200/80 shadow-xs'
                    : 'bg-white/95 border-amber-200 shadow-2xs'
                }`}
              >
                {/* Top Urgency Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isCrit
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-amber-500 text-slate-950 font-bold'
                        }`}
                      >
                        {isCrit ? <Flame className="w-3 h-3 text-yellow-300" /> : <Clock className="w-3 h-3" />}
                        <span>
                          {language === 'ta'
                            ? alert.badgeLabelTa
                            : language === 'si'
                            ? alert.badgeLabelSi
                            : alert.badgeLabelEn}
                        </span>
                      </span>

                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {alert.competitionType} • {alert.category}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-1">
                      {alert.title}
                    </h4>
                  </div>

                  {/* Live Countdown Clock Pill */}
                  <div
                    className={`shrink-0 text-right font-mono font-black text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                      isCrit
                        ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-current" />
                    <span>{countdown}</span>
                  </div>
                </div>

                {/* Subtext description */}
                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {language === 'ta'
                    ? alert.descriptionTa
                    : language === 'si'
                    ? alert.descriptionSi
                    : alert.descriptionEn}
                </p>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {language === 'ta' ? 'காலக்கெடு:' : 'Deadline:'}{' '}
                    <span className="font-mono font-bold text-slate-700">{alert.targetDateString}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {onViewDetails && (
                      <button
                        type="button"
                        onClick={() => onViewDetails(alert.competition)}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline"
                      >
                        {language === 'ta' ? 'விபரம்' : 'Details'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onJoinCompetition(alert.competition)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer ${
                        isCrit
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span>
                        {alert.deadlineType === 'registration_deadline'
                          ? language === 'ta' ? 'பதிவு செய்' : 'Register'
                          : language === 'ta' ? 'தேர்வு எழுதுக' : 'Take Exam'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
