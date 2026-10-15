import { Competition } from '../types';
import { isGradeEligible } from '../lib/gradeUtils';
import { parseDateTime } from './competitionTimeUtils';
import { APP_LOGO } from '../assets/logo';

export type DeadlineUrgency = 'critical' | 'urgent' | 'warning' | 'upcoming';
export type DeadlineType = 'registration_deadline' | 'exam_ending' | 'exam_starting';

export interface DeadlineAlert {
  id: string;
  competitionId: string;
  competition: Competition;
  title: string;
  competitionType: string;
  category: string;
  grade: string;
  deadlineType: DeadlineType;
  targetDateTime: Date;
  targetDateString: string;
  hoursRemaining: number;
  daysRemaining: number;
  urgency: DeadlineUrgency;
  badgeLabelTa: string;
  badgeLabelEn: string;
  badgeLabelSi: string;
  descriptionTa: string;
  descriptionEn: string;
  descriptionSi: string;
  isRegistered: boolean;
  isSubmitted: boolean;
}

export interface PushNotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  permission: NotificationPermission | 'unsupported';
  lastNotifiedMap: Record<string, number>;
}

const STORAGE_KEY_SETTINGS = 'hnc_deadline_push_settings_v1';

/**
 * Reads push notification preferences from localStorage
 */
export function getStoredPushSettings(): PushNotificationSettings {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      soundEnabled: true,
      permission: 'unsupported',
      lastNotifiedMap: {},
    };
  }

  const perm: NotificationPermission | 'unsupported' =
    'Notification' in window ? Notification.permission : 'unsupported';

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled) && perm === 'granted',
        soundEnabled: parsed.soundEnabled ?? true,
        permission: perm,
        lastNotifiedMap: parsed.lastNotifiedMap || {},
      };
    }
  } catch {}

  return {
    enabled: perm === 'granted',
    soundEnabled: true,
    permission: perm,
    lastNotifiedMap: {},
  };
}

/**
 * Saves push notification preferences to localStorage
 */
export function savePushSettings(settings: Partial<PushNotificationSettings>): PushNotificationSettings {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      soundEnabled: true,
      permission: 'unsupported',
      lastNotifiedMap: {},
    };
  }

  const current = getStoredPushSettings();
  const updated: PushNotificationSettings = {
    ...current,
    ...settings,
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
  };

  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  } catch {}

  return updated;
}

/**
 * Plays a pleasant synthetic dual-tone chime notification using Web Audio API
 */
export function playDeadlineAlertChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.12);
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {
    // Ignore audio playback failure if blocked by browser autoplay policy
  }
}

/**
 * Requests browser permission for local Push Notifications
 */
export async function requestPushNotificationPermission(): Promise<{
  granted: boolean;
  permission: NotificationPermission | 'unsupported';
  error?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, permission: 'unsupported', error: 'Notifications not supported in this browser' };
  }

  try {
    const perm = await Notification.requestPermission();
    const granted = perm === 'granted';
    savePushSettings({
      enabled: granted,
      permission: perm,
    });
    return { granted, permission: perm };
  } catch (err: any) {
    return { granted: false, permission: 'denied', error: err?.message || 'Permission request failed' };
  }
}

/**
 * Dispatches a local browser push notification if permission is granted
 */
export function sendLocalPushNotification(
  title: string,
  options: {
    body: string;
    tag?: string;
    icon?: string;
    requireInteraction?: boolean;
    data?: any;
    playChime?: boolean;
  }
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (options.playChime !== false) {
    const settings = getStoredPushSettings();
    if (settings.soundEnabled) {
      playDeadlineAlertChime();
    }
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notif = new Notification(title, {
      body: options.body,
      icon: options.icon || APP_LOGO || '/favicon.ico',
      badge: options.icon || APP_LOGO || '/favicon.ico',
      tag: options.tag || 'hnc-deadline-alert',
      requireInteraction: options.requireInteraction ?? false,
      silent: false,
    });

    notif.onclick = () => {
      window.focus();
      try {
        const targetEl = document.getElementById('upcoming-competitions-section');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      } catch {}
      notif.close();
    };

    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates all upcoming competition deadlines for the student
 */
export function getStudentDeadlineAlerts(
  competitions: Competition[],
  studentGrade: string,
  options?: {
    isRegistered?: (compId: string) => boolean;
    hasSubmitted?: (compId: string) => boolean;
    nowDate?: Date;
  }
): DeadlineAlert[] {
  const alerts: DeadlineAlert[] = [];
  const now = options?.nowDate || new Date();
  const nowMs = now.getTime();

  for (const comp of competitions) {
    if (!comp) continue;

    const s = (comp.status || '').toLowerCase().trim();
    // Exclude draft, inactive, closed
    if (s.includes('draft') || s === 'closed' || s === 'inactive' || s === 'unpublished') {
      continue;
    }

    // Check grade eligibility
    if (!isGradeEligible(comp.grade, studentGrade)) {
      continue;
    }

    const compId = comp.id;
    const isSubmitted = options?.hasSubmitted ? options.hasSubmitted(compId) : false;
    const isRegistered = options?.isRegistered ? options.isRegistered(compId) : false;

    // If already submitted, student has completed this exam
    if (isSubmitted) {
      continue;
    }

    // 1. Check Registration Deadline (if student has not yet registered)
    const regDateStr = comp.registrationEnd || comp.registrationDeadline;
    if (regDateStr && !isRegistered) {
      const regEnd = parseDateTime(regDateStr, '23:59', 'end');
      if (regEnd) {
        const diffMs = regEnd.getTime() - nowMs;
        // If deadline is in the future and within next 7 days
        if (diffMs > 0 && diffMs <= 7 * 24 * 3600 * 1000) {
          const hoursRemaining = Math.max(0.1, diffMs / (1000 * 3600));
          const daysRemaining = Math.floor(hoursRemaining / 24);

          let urgency: DeadlineUrgency = 'warning';
          if (hoursRemaining <= 24) urgency = 'critical';
          else if (hoursRemaining <= 48) urgency = 'urgent';

          let timeStrTa = '';
          let timeStrEn = '';
          let timeStrSi = '';

          if (hoursRemaining < 24) {
            const h = Math.floor(hoursRemaining);
            const m = Math.floor((hoursRemaining % 1) * 60);
            timeStrTa = `இன்று இரவு ${h} மணி ${m} நிமிடங்களில் முடிவடைகிறது!`;
            timeStrEn = `Closes in ${h}h ${m}m today!`;
            timeStrSi = `අද පැය ${h}කින් අවසන් වේ!`;
          } else {
            timeStrTa = `பதிவு செய்ய இன்னும் ${daysRemaining} நாட்கள் மட்டுமே`;
            timeStrEn = `Only ${daysRemaining} days left to register`;
            timeStrSi = `ලියාපදිංචියට තව දින ${daysRemaining}ක් පමණයි`;
          }

          alerts.push({
            id: `${compId}-reg-deadline`,
            competitionId: compId,
            competition: comp,
            title: comp.title,
            competitionType: comp.competitionType || 'Quiz',
            category: comp.category || 'General',
            grade: comp.grade || 'All Grades',
            deadlineType: 'registration_deadline',
            targetDateTime: regEnd,
            targetDateString: regDateStr,
            hoursRemaining,
            daysRemaining,
            urgency,
            badgeLabelTa: urgency === 'critical' ? '🔥 பதிவு நிறைவு: இன்று!' : `⏳ பதிவு காலக்கெடு: ${daysRemaining} நாள்`,
            badgeLabelEn: urgency === 'critical' ? '🔥 Registration Closes Today!' : `⏳ Reg. Closes: ${daysRemaining}d`,
            badgeLabelSi: urgency === 'critical' ? '🔥 ලියාපදිංචිය අද අවසන් වේ!' : `⏳ ලියාපදිංචිය: දින ${daysRemaining}ක්`,
            descriptionTa: `"${comp.title}" போட்டிக்கான பதிவு காலக்கெடு: ${timeStrTa}. உடனே பதிவு செய்து பங்கேற்கவும்.`,
            descriptionEn: `Registration deadline for "${comp.title}": ${timeStrEn}. Register now to secure your spot.`,
            descriptionSi: `"${comp.title}" සඳහා ලියාපදිංචි වීමේ කාලසීමාව: ${timeStrSi}.`,
            isRegistered: false,
            isSubmitted: false,
          });
        }
      }
    }

    // 2. Check Exam End Deadline (Exam Window Closing)
    const endDateStr = comp.competitionEnd || comp.endDate;
    const endTimeStr = comp.competitionEndTime || '23:59';
    const examEnd = parseDateTime(endDateStr, endTimeStr, 'end');

    const startDateStr = comp.competitionStart || comp.startDate;
    const startTimeStr = comp.competitionStartTime || '00:00';
    const examStart = parseDateTime(startDateStr, startTimeStr, 'start');

    // Is the exam currently live or within active window?
    const isLive = (!examStart || nowMs >= examStart.getTime()) && (!examEnd || nowMs <= examEnd.getTime());
    const isUpcoming = examStart ? nowMs < examStart.getTime() : false;

    if (isLive && examEnd) {
      const diffMs = examEnd.getTime() - nowMs;
      // Active exam window closing within next 7 days
      if (diffMs > 0 && diffMs <= 7 * 24 * 3600 * 1000) {
        const hoursRemaining = Math.max(0.1, diffMs / (1000 * 3600));
        const daysRemaining = Math.floor(hoursRemaining / 24);

        let urgency: DeadlineUrgency = 'warning';
        if (hoursRemaining <= 24) urgency = 'critical';
        else if (hoursRemaining <= 48) urgency = 'urgent';

        let timeStrTa = '';
        let timeStrEn = '';
        let timeStrSi = '';

        if (hoursRemaining < 24) {
          const h = Math.floor(hoursRemaining);
          const m = Math.floor((hoursRemaining % 1) * 60);
          timeStrTa = `முடிவடைய இன்னும் ${h} மணி ${m} நிமிடங்கள் மட்டுமே!`;
          timeStrEn = `Closes in ${h}h ${m}m!`;
          timeStrSi = `අවසන් වීමට තව පැය ${h}යි!`;
        } else {
          timeStrTa = `முடிவடைய இன்னும் ${daysRemaining} நாட்கள் உள்ளன`;
          timeStrEn = `${daysRemaining} days remaining to submit`;
          timeStrSi = `අවසන් වීමට තව දින ${daysRemaining}ක් ඇත`;
        }

        alerts.push({
          id: `${compId}-exam-ending`,
          competitionId: compId,
          competition: comp,
          title: comp.title,
          competitionType: comp.competitionType || 'Quiz',
          category: comp.category || 'General',
          grade: comp.grade || 'All Grades',
          deadlineType: 'exam_ending',
          targetDateTime: examEnd,
          targetDateString: endDateStr || '',
          hoursRemaining,
          daysRemaining,
          urgency,
          badgeLabelTa: urgency === 'critical' ? '🔥 தேர்வு நிறைவு: இன்று!' : `⏰ தேர்வு நிறைவு: ${daysRemaining} நாள்`,
          badgeLabelEn: urgency === 'critical' ? '🔥 Exam Window Closes Today!' : `⏰ Exam Closes: ${daysRemaining}d`,
          badgeLabelSi: urgency === 'critical' ? '🔥 විභාගය අද අවසන් වේ!' : `⏰ විභාගය: දින ${daysRemaining}ක්`,
          descriptionTa: `"${comp.title}" தேர்வு காலம் நிறைவடைய உள்ளது (${timeStrTa}). உடனடியாக தேர்வு எழுதி உங்கள் மதிப்பெண்ணைப் பெறுங்கள்!`,
          descriptionEn: `"${comp.title}" examination window is closing (${timeStrEn}). Take the exam now to submit your score!`,
          descriptionSi: `"${comp.title}" විභාගය අවසන් වීමට ආසන්නයි (${timeStrSi}). දැන්ම සහභාගී වන්න!`,
          isRegistered,
          isSubmitted: false,
        });
      }
    } else if (isUpcoming && examStart) {
      // Upcoming exam opening within 48 hours
      const diffMs = examStart.getTime() - nowMs;
      if (diffMs > 0 && diffMs <= 48 * 3600 * 1000) {
        const hoursRemaining = Math.max(0.1, diffMs / (1000 * 3600));
        const daysRemaining = Math.floor(hoursRemaining / 24);

        alerts.push({
          id: `${compId}-exam-starting`,
          competitionId: compId,
          competition: comp,
          title: comp.title,
          competitionType: comp.competitionType || 'Quiz',
          category: comp.category || 'General',
          grade: comp.grade || 'All Grades',
          deadlineType: 'exam_starting',
          targetDateTime: examStart,
          targetDateString: startDateStr || '',
          hoursRemaining,
          daysRemaining,
          urgency: 'upcoming',
          badgeLabelTa: hoursRemaining <= 12 ? '🚀 விரைவில் ஆரம்பம்!' : '📅 நாளை தொடங்குகிறது',
          badgeLabelEn: hoursRemaining <= 12 ? '🚀 Opens Very Soon!' : '📅 Starts Tomorrow',
          badgeLabelSi: hoursRemaining <= 12 ? '🚀 ළඟදීම ආරම්භ වේ!' : '📅 හෙට ආරම්භ වේ',
          descriptionTa: `"${comp.title}" பரீட்சை விரைவில் தொடங்குகிறது. உங்கள் தயாரிப்புகளை தயாராக வைத்திருக்கவும்.`,
          descriptionEn: `"${comp.title}" examination opens soon. Get ready to compete!`,
          descriptionSi: `"${comp.title}" විභාගය ඉක්මනින් ආරම්භ වේ. සූදානම් වන්න!`,
          isRegistered,
          isSubmitted: false,
        });
      }
    }
  }

  // Sort by urgency first (critical > urgent > warning > upcoming), then by targetDateTime ascending
  const urgencyWeight: Record<DeadlineUrgency, number> = {
    critical: 1,
    urgent: 2,
    warning: 3,
    upcoming: 4,
  };

  alerts.sort((a, b) => {
    const diff = urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
    if (diff !== 0) return diff;
    return a.targetDateTime.getTime() - b.targetDateTime.getTime();
  });

  return alerts;
}

/**
 * Checks pending deadline alerts and sends local push notifications if not recently alerted
 */
export function checkAndSendAutomaticDeadlinePushes(alerts: DeadlineAlert[]) {
  if (typeof window === 'undefined') return;

  const settings = getStoredPushSettings();
  if (!settings.enabled || settings.permission !== 'granted') return;

  const now = Date.now();
  const MIN_INTERVAL_MS = 4 * 3600 * 1000; // 4 hours between duplicate push notifications for same deadline
  const updatedLastNotified = { ...settings.lastNotifiedMap };
  let sentAny = false;

  // Only auto-push for critical or urgent items (< 48 hours)
  const urgentAlerts = alerts.filter((a) => a.urgency === 'critical' || a.urgency === 'urgent');

  for (const alert of urgentAlerts) {
    const lastNotified = updatedLastNotified[alert.id] || 0;
    if (now - lastNotified > MIN_INTERVAL_MS) {
      const title = alert.urgency === 'critical' ? `🚨 அவசர காலக்கெடு: ${alert.title}` : `⏰ நினைவூட்டல்: ${alert.title}`;
      const body = alert.descriptionTa;

      const sent = sendLocalPushNotification(title, {
        body,
        tag: alert.id,
        requireInteraction: alert.urgency === 'critical',
        playChime: true,
      });

      if (sent) {
        updatedLastNotified[alert.id] = now;
        sentAny = true;
      }
    }
  }

  if (sentAny) {
    savePushSettings({ lastNotifiedMap: updatedLastNotified });
  }
}
