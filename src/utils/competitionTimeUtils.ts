import { Competition } from '../types';

export interface CompetitionScheduleStatus {
  phase: 'upcoming' | 'live' | 'ended';
  isUpcoming: boolean;
  isLive: boolean;
  isEnded: boolean;
  canTakeExam: boolean;
  isRegistrationOpen: boolean;
  isRegistrationClosed: boolean;
  regEndDateTime: Date | null;
  startDateTime: Date | null;
  endDateTime: Date | null;
  formattedStart: string;
  formattedEnd: string;
  formattedRegEnd: string;
  statusBadgeTa: string;
  statusBadgeEn: string;
  statusBadgeSi: string;
  timeRemainingTextTa: string;
  timeRemainingTextEn: string;
}

/**
 * Parses Date (YYYY-MM-DD) and Time (HH:MM in 24h format) reliably without timezone shifting bugs
 */
export function parseDateTime(dateStr?: string, timeStr?: string, defaultTime: 'start' | 'end' = 'start'): Date | null {
  if (!dateStr || !dateStr.trim()) return null;

  const trimmedDate = dateStr.trim();
  // If already contains T and full ISO string
  if (trimmedDate.includes('T')) {
    const d = new Date(trimmedDate);
    if (!isNaN(d.getTime())) return d;
  }

  const parts = trimmedDate.split('-');
  if (parts.length !== 3) {
    const d = new Date(trimmedDate);
    return isNaN(d.getTime()) ? null : d;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  let hours = defaultTime === 'start' ? 0 : 23;
  let minutes = defaultTime === 'start' ? 0 : 59;
  let seconds = defaultTime === 'start' ? 0 : 59;

  if (timeStr && timeStr.trim()) {
    const timeParts = timeStr.trim().split(':');
    if (timeParts.length >= 2) {
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;
      if (timeParts.length >= 3) {
        seconds = parseInt(timeParts[2], 10) || 0;
      }
    }
  }

  return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Formats time string (e.g. "09:30") to readable 12-hour format "9:30 AM"
 */
export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Formats a Date object into human-friendly date and time
 */
export function formatDateTimeReadable(date: Date | null, language: string = 'ta'): string {
  if (!date || isNaN(date.getTime())) return '—';

  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();

  let h = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;

  const timePart = `${h}:${mins} ${ampm}`;
  const datePart = `${y}-${m}-${d}`;

  return `${datePart} ${timePart}`;
}

/**
 * Calculates live real-time schedule status for any competition
 */
export function getCompetitionScheduleStatus(comp: Competition): CompetitionScheduleStatus {
  const startDateStr = comp.competitionStart || comp.startDate;
  const startTimeStr = comp.competitionStartTime || '00:00';

  const endDateStr = comp.competitionEnd || comp.endDate;
  const endTimeStr = comp.competitionEndTime || '23:59';

  const startDateTime = parseDateTime(startDateStr, startTimeStr, 'start');
  const endDateTime = parseDateTime(endDateStr, endTimeStr, 'end');

  const now = new Date();
  const nowMs = now.getTime();

  let phase: 'upcoming' | 'live' | 'ended' = 'live';

  if (startDateTime && nowMs < startDateTime.getTime()) {
    phase = 'upcoming';
  } else if (endDateTime && nowMs > endDateTime.getTime()) {
    phase = 'ended';
  } else {
    phase = 'live';
  }

  // Calculate remaining time countdown string
  let timeRemainingTextTa = '';
  let timeRemainingTextEn = '';

  if (phase === 'upcoming' && startDateTime) {
    const diffMs = startDateTime.getTime() - nowMs;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      timeRemainingTextTa = `ஆரம்பமாக இன்னும் ${diffDays} நாள் ${diffHours % 24} மணிநேரம்`;
      timeRemainingTextEn = `Starts in ${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      timeRemainingTextTa = `ஆரம்பமாக இன்னும் ${diffHours} மணி ${diffMins % 60} நிமிடம்`;
      timeRemainingTextEn = `Starts in ${diffHours}h ${diffMins % 60}m`;
    } else {
      timeRemainingTextTa = `ஆரம்பமாக இன்னும் ${Math.max(1, diffMins)} நிமிடங்கள்`;
      timeRemainingTextEn = `Starts in ${Math.max(1, diffMins)} minutes`;
    }
  } else if (phase === 'live' && endDateTime) {
    const diffMs = endDateTime.getTime() - nowMs;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      timeRemainingTextTa = `முடிவடைய இன்னும் ${diffDays} நாள் ${diffHours % 24} மணி`;
      timeRemainingTextEn = `Ends in ${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      timeRemainingTextTa = `முடிவடைய இன்னும் ${diffHours} மணி ${diffMins % 60} நிமி`;
      timeRemainingTextEn = `Ends in ${diffHours}h ${diffMins % 60}m`;
    } else {
      timeRemainingTextTa = `முடிவடைய இன்னும் ${Math.max(1, diffMins)} நிமிடங்கள்`;
      timeRemainingTextEn = `Ends in ${Math.max(1, diffMins)}m`;
    }
  } else if (phase === 'ended') {
    timeRemainingTextTa = 'போட்டி காலம் நிறைவடைந்தது';
    timeRemainingTextEn = 'Competition examination window has closed';
  }

  const regEndDateStr = comp.registrationEnd || comp.registrationDeadline;
  const regEndDateTime = parseDateTime(regEndDateStr, '23:59', 'end');
  const isRegistrationClosed = regEndDateTime ? nowMs > regEndDateTime.getTime() : false;
  const isRegistrationOpen = !isRegistrationClosed;

  const formattedStart = startDateTime ? formatDateTimeReadable(startDateTime) : 'இப்போது திறக்கப்பட்டுள்ளது (Open Now)';
  const formattedEnd = endDateTime ? formatDateTimeReadable(endDateTime) : 'வரையறுக்கப்படவில்லை (No limit)';
  const formattedRegEnd = regEndDateTime ? formatDateTimeReadable(regEndDateTime) : 'முடிவடையவில்லை (No deadline)';

  return {
    phase,
    isUpcoming: phase === 'upcoming',
    isLive: phase === 'live',
    isEnded: phase === 'ended',
    canTakeExam: phase === 'live',
    isRegistrationOpen,
    isRegistrationClosed,
    regEndDateTime,
    startDateTime,
    endDateTime,
    formattedStart,
    formattedEnd,
    formattedRegEnd,
    statusBadgeTa:
      phase === 'upcoming'
        ? `⏰ வரவிருக்கும் போட்டி (ஆரம்பம்: ${formatTime12h(startTimeStr) || formattedStart})`
        : phase === 'live'
        ? `🔴 நேரலை (Live Now • முடிவு: ${formatTime12h(endTimeStr) || formattedEnd})`
        : '🔒 போட்டி நிறைவடைந்தது (Closed)',
    statusBadgeEn:
      phase === 'upcoming'
        ? `⏰ Upcoming (Opens: ${formatTime12h(startTimeStr) || formattedStart})`
        : phase === 'live'
        ? `🔴 Live Assessment (Closes: ${formatTime12h(endTimeStr) || formattedEnd})`
        : '🔒 Competition Closed',
    statusBadgeSi:
      phase === 'upcoming'
        ? `⏰ ඉදිරියට පැවැත්වෙන තරඟය`
        : phase === 'live'
        ? `🔴 දැන් සජීවීව ක්‍රියාත්මකයි`
        : '🔒 තරඟය අවසන් විය',
    timeRemainingTextTa,
    timeRemainingTextEn,
  };
}
