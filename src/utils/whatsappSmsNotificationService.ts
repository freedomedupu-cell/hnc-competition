import { Competition, StudentUser } from '../types';

export interface WhatsappSmsSettings {
  whatsappNumber: string;
  enableWhatsappAlerts: boolean;
  enableSmsAlerts: boolean;
  notify15MinBeforeExam: boolean;
  notifyRegistrationConfirm: boolean;
  notifyResultsPublished: boolean;
}

export interface DbWhatsappSmsLog {
  id: string;
  studentId: string;
  studentName: string;
  recipientPhone: string;
  channel: 'whatsapp' | 'sms' | 'both';
  triggerType: '15_min_before_exam' | 'registration_confirm' | 'exam_live' | 'results_published' | 'manual_test';
  competitionId?: string;
  competitionTitle?: string;
  messageText: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'delivered';
}

const STORAGE_KEY_WHATSAPP_SETTINGS = 'hnc_whatsapp_sms_pref_v1';
const STORAGE_KEY_SENT_ALERTS = 'hnc_whatsapp_15min_sent_v1';
const STORAGE_KEY_DISPATCH_LOGS = 'hnc_whatsapp_sms_dispatch_logs_v1';

/**
 * Normalizes Sri Lankan phone numbers into E.164 integer format suitable for WhatsApp API (e.g., 94771234567)
 */
export function normalizeSriLankaPhoneNumber(phoneStr?: string): string {
  if (!phoneStr) return '';
  // Remove spaces, dashes, brackets, plus signs
  let cleaned = phoneStr.replace(/[^0-9]/g, '');

  if (cleaned.startsWith('0')) {
    // Local prefix e.g. 0771234567 -> 94771234567
    cleaned = '94' + cleaned.substring(1);
  } else if (!cleaned.startsWith('94') && cleaned.length === 9) {
    // Bare 9 digits e.g. 771234567 -> 94771234567
    cleaned = '94' + cleaned;
  }

  return cleaned;
}

/**
 * Formats a clean display phone number for UI (e.g. +94 77 123 4567)
 */
export function formatDisplayPhoneNumber(phoneStr?: string): string {
  const norm = normalizeSriLankaPhoneNumber(phoneStr);
  if (norm.length === 11 && norm.startsWith('94')) {
    return `+${norm.slice(0, 2)} ${norm.slice(2, 4)} ${norm.slice(4, 7)} ${norm.slice(7)}`;
  }
  return phoneStr || '';
}

/**
 * Generates WhatsApp Web / App Click-to-Chat URL
 */
export function buildWhatsappChatUrl(phoneNumber: string, messageText: string): string {
  const cleanPhone = normalizeSriLankaPhoneNumber(phoneNumber);
  const encodedText = encodeURIComponent(messageText);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

/**
 * Generates direct native SMS link (sms:+9477...&body=...)
 */
export function buildNativeSmsUrl(phoneNumber: string, messageText: string): string {
  const cleanPhone = normalizeSriLankaPhoneNumber(phoneNumber);
  const encodedText = encodeURIComponent(messageText);
  return `sms:+${cleanPhone}?body=${encodedText}`;
}

/**
 * Formats standard "15 Minutes Before Exam Starts" WhatsApp/SMS message
 */
export function formatExam15MinAlertMessage(
  competition: Competition,
  studentName: string,
  language: string = 'ta'
): string {
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hnc-edu.app';
  const directExamUrl = `${appBaseUrl}/?comp=${competition.id}`;
  const compCode = competition.code || `HNC-${competition.id.slice(0, 5).toUpperCase()}`;
  const durationMins = competition.duration || 30;

  if (language === 'ta') {
    return (
      `🚨 *அவசர நினைவூட்டல்: பரீட்சை தொடங்க இன்னும் 15 நிமிடங்கள் மட்டுமே!*\n\n` +
      `அன்பான ${studentName},\n` +
      `நீங்கள் பதிவு செய்துள்ள *${competition.title}* (${competition.competitionType || 'Exam'}) இன்னும் 15 நிமிடங்களில் உத்தியோகபூர்வமாக தொடங்குகிறது!\n\n` +
      `📌 *பரீட்சை விவரங்கள்:*\n` +
      `• பாடம்: ${competition.category || 'Mathematics'}\n` +
      `• தரம்: ${competition.grade || 'Grade 11'}\n` +
      `• குறியீடு: ${compCode}\n` +
      `• நேரம்: ${durationMins} நிமிடங்கள்\n\n` +
      `🔗 *உடனடியாக பரீட்சை அரங்கிற்குச் செல்ல கிளிக் செய்யவும்:*\n` +
      `${directExamUrl}\n\n` +
      `வாழ்த்துகள்! 🏆\n` +
      `_HNC National Examination Board_`
    );
  } else if (language === 'si') {
    return (
      `🚨 *අවධානයයි: විභාගය ආරම්භ වීමට තව මිනිත්තු 15යි!*\n\n` +
      `හිතවත් ${studentName},\n` +
      `ඔබ ලියාපදිංචි වූ *${competition.title}* විභාගය තව මිනිත්තු 15කින් ආරම්භ වේ!\n\n` +
      `📌 *විභාග තොරතුරු:*\n` +
      `• විෂයය: ${competition.category}\n` +
      `• ශ්‍රේණිය: ${competition.grade}\n` +
      `• කාලය: මිනිත්තු ${durationMins}\n\n` +
      `🔗 *විභාගයට පිවිසීමට මෙතැනින් ක්ලික් කරන්න:*\n` +
      `${directExamUrl}\n\n` +
      `සුබ පතමු! 🏆\n` +
      `_HNC National Examination Board_`
    );
  }

  return (
    `🚨 *URGENT ALERT: Exam Starting in 15 Minutes!*\n\n` +
    `Dear ${studentName},\n` +
    `Your registered assessment *${competition.title}* (${competition.competitionType || 'Exam'}) starts officially in 15 minutes!\n\n` +
    `📌 *Assessment Details:*\n` +
    `• Subject: ${competition.category || 'Mathematics'}\n` +
    `• Grade Tier: ${competition.grade || 'Grade 11'}\n` +
    `• Access Code: ${compCode}\n` +
    `• Duration: ${durationMins} Minutes\n\n` +
    `🔗 *Click to join live exam hall now:*\n` +
    `${directExamUrl}\n\n` +
    `Best of Luck! 🏆\n` +
    `_HNC National Examination Board_`
  );
}

/**
 * Formats Exam Registration Confirmation WhatsApp Message
 */
export function formatRegistrationConfirmMessage(
  competition: Competition,
  studentName: string,
  language: string = 'ta'
): string {
  const compCode = competition.code || `HNC-${competition.id.slice(0, 5).toUpperCase()}`;

  if (language === 'ta') {
    return (
      `✅ *பரீட்சை பதிவு உறுதி செய்யப்பட்டது!*\n\n` +
      `அன்பான ${studentName},\n` +
      `நீங்கள் *${competition.title}* போட்டிக்கு வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளீர்கள்.\n\n` +
      `📌 போட்டி குறியீடு: ${compCode}\n` +
      `⏱️ பரீட்சை தொடங்க 15 நிமிடங்களுக்கு முன் WhatsApp மூலமாக உங்களுக்கு நேரடி நினைவூட்டல் அனுப்பப்படும்.\n\n` +
      `_HNC Examination Hub_`
    );
  }

  return (
    `✅ *Registration Confirmed!*\n\n` +
    `Dear ${studentName},\n` +
    `You are successfully registered for *${competition.title}*.\n\n` +
    `📌 Exam Code: ${compCode}\n` +
    `⏱️ You will receive an automated WhatsApp alert 15 minutes before the exam starts!\n\n` +
    `_HNC Examination Hub_`
  );
}

/**
 * Reads WhatsApp & SMS preferences from LocalStorage
 */
export function getStoredWhatsappSmsSettings(): WhatsappSmsSettings {
  if (typeof window === 'undefined') {
    return {
      whatsappNumber: '',
      enableWhatsappAlerts: true,
      enableSmsAlerts: true,
      notify15MinBeforeExam: true,
      notifyRegistrationConfirm: true,
      notifyResultsPublished: true,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_WHATSAPP_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        whatsappNumber: parsed.whatsappNumber || '',
        enableWhatsappAlerts: parsed.enableWhatsappAlerts ?? true,
        enableSmsAlerts: parsed.enableSmsAlerts ?? true,
        notify15MinBeforeExam: parsed.notify15MinBeforeExam ?? true,
        notifyRegistrationConfirm: parsed.notifyRegistrationConfirm ?? true,
        notifyResultsPublished: parsed.notifyResultsPublished ?? true,
      };
    }
  } catch {}

  return {
    whatsappNumber: '',
    enableWhatsappAlerts: true,
    enableSmsAlerts: true,
    notify15MinBeforeExam: true,
    notifyRegistrationConfirm: true,
    notifyResultsPublished: true,
  };
}

/**
 * Saves WhatsApp & SMS preferences to LocalStorage
 */
export function saveWhatsappSmsSettings(settings: Partial<WhatsappSmsSettings>): WhatsappSmsSettings {
  const current = getStoredWhatsappSmsSettings();
  const updated: WhatsappSmsSettings = {
    ...current,
    ...settings,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_WHATSAPP_SETTINGS, JSON.stringify(updated));
    } catch {}
  }

  return updated;
}

/**
 * Logs a dispatched WhatsApp / SMS message to persistent logs
 */
export function logWhatsappSmsDispatch(log: Omit<DbWhatsappSmsLog, 'id' | 'sentAt'>): DbWhatsappSmsLog {
  const newLog: DbWhatsappSmsLog = {
    ...log,
    id: `log-ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sentAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DISPATCH_LOGS);
      const list: DbWhatsappSmsLog[] = raw ? JSON.parse(raw) : [];
      list.unshift(newLog);
      // Keep last 50 logs
      if (list.length > 50) list.pop();
      localStorage.setItem(STORAGE_KEY_DISPATCH_LOGS, JSON.stringify(list));
    } catch {}
  }

  return newLog;
}

/**
 * Gets historical dispatch logs
 */
export function getStoredWhatsappSmsLogs(): DbWhatsappSmsLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISPATCH_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Checks whether a 15-minute alert was already sent for a student + competition
 */
export function is15MinAlertAlreadySent(studentId: string, competitionId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = `${STORAGE_KEY_SENT_ALERTS}_${studentId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const ids: string[] = JSON.parse(raw);
    return ids.includes(competitionId);
  } catch {
    return false;
  }
}

/**
 * Marks 15-minute alert as sent to prevent duplicate alerts
 */
export function mark15MinAlertAsSent(studentId: string, competitionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_KEY_SENT_ALERTS}_${studentId}`;
    const raw = localStorage.getItem(key);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(competitionId)) {
      ids.push(competitionId);
      if (ids.length > 50) ids.shift();
      localStorage.setItem(key, JSON.stringify(ids));
    }
  } catch {}
}

/**
 * Evaluates registered competitions for a student and detects any exam starting in 15 minutes or less
 */
export function evaluateUpcomingExamsFor15MinAlert(
  competitions: Competition[],
  student: StudentUser,
  isRegisteredFn: (compId: string) => boolean,
  hasSubmittedFn: (compId: string) => boolean,
  nowDate: Date = new Date()
): {
  dueAlerts: Array<{
    competition: Competition;
    minutesLeft: number;
    messageText: string;
    whatsappUrl: string;
    smsUrl: string;
  }>;
} {
  const dueAlerts: Array<{
    competition: Competition;
    minutesLeft: number;
    messageText: string;
    whatsappUrl: string;
    smsUrl: string;
  }> = [];

  const studentPhone = student.phone || getStoredWhatsappSmsSettings().whatsappNumber || '';
  if (!studentPhone) return { dueAlerts };

  const nowMs = nowDate.getTime();

  for (const comp of competitions) {
    if (!comp) continue;

    // Must be registered & not submitted
    if (!isRegisteredFn(comp.id) || hasSubmittedFn(comp.id)) {
      continue;
    }

    // Check start date/time
    const startDateStr = comp.startDate || comp.competitionStart;
    const startTimeStr = comp.competitionStartTime || '09:00';
    if (!startDateStr) continue;

    let examStartMs = 0;
    try {
      const fullIso = `${startDateStr}T${startTimeStr.length === 5 ? startTimeStr + ':00' : startTimeStr}`;
      examStartMs = new Date(fullIso).getTime();
    } catch {
      continue;
    }

    if (isNaN(examStartMs) || examStartMs <= 0) continue;

    const diffMs = examStartMs - nowMs;
    const diffMins = diffMs / (1000 * 60);

    // If exam is starting within 15 minutes (or currently open/starting) AND not already alerted
    if (diffMins >= -5 && diffMins <= 15) {
      if (!is15MinAlertAlreadySent(student.id, comp.id)) {
        const msg = formatExam15MinAlertMessage(comp, student.name || 'Candidate', 'ta');
        const waUrl = buildWhatsappChatUrl(studentPhone, msg);
        const smsUrl = buildNativeSmsUrl(studentPhone, msg);

        dueAlerts.push({
          competition: comp,
          minutesLeft: Math.max(0, Math.round(diffMins)),
          messageText: msg,
          whatsappUrl: waUrl,
          smsUrl: smsUrl,
        });
      }
    }
  }

  return { dueAlerts };
}
