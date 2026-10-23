import { Competition } from '../types';
import { CURRICULUM_PATHS_REGISTRY, detectStudentCurriculumPath } from '../lib/gradeUtils';
import { APP_LOGO } from '../assets/logo';

export interface SubjectItemMeta {
  id: string;
  nameEn: string;
  nameTa: string;
  nameSi: string;
  icon: string;
  badgeBg: string;
  category: 'core' | 'stem' | 'humanities' | 'commerce' | 'languages' | 'olympiad';
}

/**
 * Standard Sri Lankan Academic & Olympiad Subjects Registry
 */
export const SRI_LANKAN_ACADEMIC_SUBJECTS: SubjectItemMeta[] = [
  {
    id: 'mathematics',
    nameEn: 'Mathematics',
    nameTa: 'கணிதம்',
    nameSi: 'ගණිතය',
    icon: '📐',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    category: 'core',
  },
  {
    id: 'science',
    nameEn: 'Science',
    nameTa: 'விஞ்ஞானம்',
    nameSi: 'විද්‍යාව',
    icon: '🔬',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    category: 'stem',
  },
  {
    id: 'ict',
    nameEn: 'Information Technology (ICT)',
    nameTa: 'தகவல் தொடர்பாடல் தொழில்நுட்பம் (ICT)',
    nameSi: 'තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)',
    icon: '💻',
    badgeBg: 'bg-purple-500/10 text-purple-600 border-purple-200',
    category: 'stem',
  },
  {
    id: 'scholarship_iq',
    nameEn: 'Scholarship IQ & Logic',
    nameTa: 'புலமைப்பரிசில் நுண்ணறிவு (Scholarship IQ)',
    nameSi: 'ශිෂ්‍යත්ව බුද්ධි පරීක්ෂණය (IQ)',
    icon: '💡',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200',
    category: 'core',
  },
  {
    id: 'tamil_language',
    nameEn: 'Tamil Language & Literature',
    nameTa: 'தமிழ் மொழி',
    nameSi: 'දෙමළ භාෂාව',
    icon: '📜',
    badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-200',
    category: 'languages',
  },
  {
    id: 'english_language',
    nameEn: 'English Language',
    nameTa: 'ஆங்கில மொழி (English)',
    nameSi: 'ඉංග්‍රීසි භාෂාව',
    icon: '🌐',
    badgeBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    category: 'languages',
  },
  {
    id: 'history',
    nameEn: 'History',
    nameTa: 'வரலாறு',
    nameSi: 'ඉතිහාසය',
    icon: '🏛️',
    badgeBg: 'bg-orange-500/10 text-orange-600 border-orange-200',
    category: 'humanities',
  },
  {
    id: 'environmental_studies',
    nameEn: 'Environmental Studies (ERA)',
    nameTa: 'சுற்றாடல்சார் செயற்பாடுகள் (ERA)',
    nameSi: 'පරිසර ආශ්‍රිත ක්‍රියාකාරකම්',
    icon: '🌱',
    badgeBg: 'bg-teal-500/10 text-teal-600 border-teal-200',
    category: 'core',
  },
  {
    id: 'commerce',
    nameEn: 'Commerce & Accounting',
    nameTa: 'வர்த்தகம் & கணக்கியல்',
    nameSi: 'ව්‍යාපාර හා ගිණුම්කරණය',
    icon: '📊',
    badgeBg: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    category: 'commerce',
  },
  {
    id: 'physics',
    nameEn: 'Physics',
    nameTa: 'பௌதிகவியல் (Physics)',
    nameSi: 'භෞතික විද්‍යාව',
    icon: '⚡',
    badgeBg: 'bg-violet-500/10 text-violet-600 border-violet-200',
    category: 'stem',
  },
  {
    id: 'chemistry',
    nameEn: 'Chemistry',
    nameTa: 'இரசாயனவியல் (Chemistry)',
    nameSi: 'රසායන විද්‍යාව',
    icon: '🧪',
    badgeBg: 'bg-pink-500/10 text-pink-600 border-pink-200',
    category: 'stem',
  },
  {
    id: 'biology',
    nameEn: 'Biology',
    nameTa: 'உயிரியல் (Biology)',
    nameSi: 'ජීව විද්‍යාව',
    icon: '🧬',
    badgeBg: 'bg-green-500/10 text-green-600 border-green-200',
    category: 'stem',
  },
  {
    id: 'general_knowledge',
    nameEn: 'General Knowledge & Current Affairs',
    nameTa: 'பொது அறிவு (GK)',
    nameSi: 'සාමාන්‍ය දැනීම',
    icon: '🏆',
    badgeBg: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
    category: 'olympiad',
  },
  {
    id: 'public_service',
    nameEn: 'Public Service & Gazette IQ',
    nameTa: 'அரச நிர்வாக நடைமுறைகள் & IQ',
    nameSi: 'රාජ්‍ය සේවා සහ ගැසට් විභාග',
    icon: '📑',
    badgeBg: 'bg-slate-500/10 text-slate-700 border-slate-200',
    category: 'olympiad',
  },
];

const STORAGE_KEY_SUBJECT_PUSH = 'hnc_subject_push_notifications_pref_v1';
const STORAGE_KEY_NOTIFIED_COMPS = 'hnc_subject_notified_comps_v1';

export interface SubjectPushSettings {
  enabled: boolean;
  soundEnabled: boolean;
  enrolledSubjectsOnly: boolean;
  permission: NotificationPermission | 'unsupported';
}

/**
 * Returns sensible default enrolled subjects based on student grade/curriculum path
 */
export function getDefaultSubjectsForGrade(grade: string): string[] {
  const path = detectStudentCurriculumPath(grade);
  if (path && path.coreSubjectsEn && path.coreSubjectsEn.length > 0) {
    return [...path.coreSubjectsEn];
  }
  return ['Mathematics', 'Science', 'English', 'Information Technology'];
}

/**
 * Subject alias mapping for intelligent bilingual matching
 */
const SUBJECT_ALIASES: Record<string, string[]> = {
  mathematics: [
    'mathematics',
    'maths',
    'math',
    'கணிதம்',
    'கணித',
    'ගණිතය',
    'early mathematics',
    'primary mathematics',
    'combined maths',
    'o/l mathematics',
    'கணித ஒலிம்பியாட்',
  ],
  science: [
    'science',
    'விஞ்ஞானம்',
    'விஞ்ஞான',
    'විද්‍යාව',
    'general science',
    'science & technology',
    'விஞ்ஞான வினாடி வினா',
  ],
  ict: [
    'ict',
    'information technology',
    'computer science',
    'computing',
    'தகவல் தொழில்நுட்பம்',
    'தகவல் தொடர்பாடல்',
    'තොරතුරු තාක්ෂණය',
  ],
  scholarship_iq: [
    'scholarship iq',
    'scholarship',
    'iq',
    'logic',
    'scholarship iq & logic',
    'புலமைப்பரிசில்',
    'புலமைப்பரிசில் நுண்ணறிவு',
    'நுண்ணறிவு',
    'ශිෂ්‍යත්ව',
  ],
  tamil_language: [
    'tamil',
    'tamil language',
    'தமிழ்',
    'தமிழ் மொழி',
    'மொழித்திறன்',
    'first language',
    'දෙමළ',
  ],
  english_language: [
    'english',
    'english language',
    'basic english',
    'ஆங்கிலம்',
    'ஆங்கில மொழி',
    'இංග්‍රීසි',
  ],
  history: [
    'history',
    'வரலாறு',
    'இலங்கை வரலாறு',
    'ඉතිහාසය',
  ],
  environmental_studies: [
    'environmental studies',
    'era',
    'சுற்றாடல்',
    'சுற்றாடல்சார் செயற்பாடுகள்',
    'சுற்றாடல்சார் செயற்பாடுகள் (era)',
    'පරිසරය',
  ],
  commerce: [
    'commerce',
    'accounting',
    'business studies',
    'வணிகம்',
    'கணக்கியல்',
    'வர்த்தகம்',
    'ව්‍යාපාර',
  ],
  physics: [
    'physics',
    'பௌதிகவியல்',
    'பௌதிக',
    'භෞතික',
  ],
  chemistry: [
    'chemistry',
    'இரசாயனவியல்',
    'இரசாயன',
    'රසායන',
  ],
  biology: [
    'biology',
    'உயிரியல்',
    'உயிரியல் (biology)',
    'ජීව විද්‍යාව',
  ],
  general_knowledge: [
    'general knowledge',
    'gk',
    'பொது அறிவு',
    'பொதுஅறிவு',
    'current affairs',
    'සාමාන්‍ය දැනීම',
  ],
  public_service: [
    'public service',
    'gazette',
    'career',
    'அரச நிர்வாகம்',
    'அரசாங்க வர்த்தமானி',
    'රාජ්‍ය සේවා',
  ],
};

/**
 * Checks if a candidate text represents or matches a canonical subject key
 */
function textMatchesSubjectCanonicalKey(text: string, canonicalKey: string): boolean {
  const norm = text.toLowerCase().trim();
  const aliases = SUBJECT_ALIASES[canonicalKey] || [canonicalKey];
  return aliases.some((alias) => norm === alias || norm.includes(alias) || alias.includes(norm));
}

/**
 * Identifies the canonical subject key for an arbitrary subject name
 */
export function getSubjectCanonicalKey(subjectName: string): string {
  const norm = subjectName.toLowerCase().trim();
  for (const [key, aliases] of Object.entries(SUBJECT_ALIASES)) {
    if (aliases.some((alias) => norm === alias || norm.includes(alias) || alias.includes(norm))) {
      return key;
    }
  }
  return norm.replace(/[^a-z0-9]/g, '_');
}

/**
 * Checks whether a competition or quiz belongs to a student's enrolled subjects
 */
export function isCompetitionInEnrolledSubjects(
  competition: Competition,
  enrolledSubjects: string[]
): { matches: boolean; matchedSubject: string } {
  if (!enrolledSubjects || enrolledSubjects.length === 0) {
    return { matches: false, matchedSubject: '' };
  }

  // Candidate fields from competition
  const candidates = [
    competition.category || '',
    (competition as any).subject || '',
    (competition as any).unitTopic || '',
    competition.title || '',
    competition.description || '',
  ].filter(Boolean);

  for (const enrolled of enrolledSubjects) {
    const enrolledKey = getSubjectCanonicalKey(enrolled);

    for (const cand of candidates) {
      if (textMatchesSubjectCanonicalKey(cand, enrolledKey)) {
        return { matches: true, matchedSubject: enrolled };
      }
    }
  }

  return { matches: false, matchedSubject: '' };
}

/**
 * Reads push settings for subject notifications
 */
export function getStoredSubjectPushSettings(): SubjectPushSettings {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      soundEnabled: true,
      enrolledSubjectsOnly: true,
      permission: 'unsupported',
    };
  }

  const perm: NotificationPermission | 'unsupported' =
    'Notification' in window ? Notification.permission : 'unsupported';

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBJECT_PUSH);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled) && perm === 'granted',
        soundEnabled: parsed.soundEnabled ?? true,
        enrolledSubjectsOnly: parsed.enrolledSubjectsOnly ?? true,
        permission: perm,
      };
    }
  } catch {}

  return {
    enabled: perm === 'granted',
    soundEnabled: true,
    enrolledSubjectsOnly: true,
    permission: perm,
  };
}

/**
 * Saves push settings for subject notifications
 */
export function saveSubjectPushSettings(settings: Partial<SubjectPushSettings>): SubjectPushSettings {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      soundEnabled: true,
      enrolledSubjectsOnly: true,
      permission: 'unsupported',
    };
  }

  const current = getStoredSubjectPushSettings();
  const updated: SubjectPushSettings = {
    ...current,
    ...settings,
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
  };

  try {
    localStorage.setItem(STORAGE_KEY_SUBJECT_PUSH, JSON.stringify(updated));
  } catch {}

  return updated;
}

/**
 * Requests browser push notification permission
 */
export async function requestSubjectPushPermission(): Promise<{
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
    saveSubjectPushSettings({
      enabled: granted,
      permission: perm,
    });
    return { granted, permission: perm };
  } catch (err: any) {
    return { granted: false, permission: 'denied', error: err?.message || 'Permission request failed' };
  }
}

/**
 * Plays a cheerful, musical 3-tone chime for newly published competition alerts
 */
export function playSubjectPublicationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;
    // Arpeggio chords: F5 (698.46Hz) -> A5 (880Hz) -> C6 (1046.5Hz)
    const tones = [
      { f: 698.46, start: t, duration: 0.12 },
      { f: 880.0, start: t + 0.1, duration: 0.14 },
      { f: 1046.5, start: t + 0.22, duration: 0.3 },
    ];

    tones.forEach(({ f, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    });
  } catch {
    // Ignore autoplay or audio context constraints gracefully
  }
}

/**
 * Checks if student was already notified about a published competition
 */
export function isCompetitionAlreadyNotified(studentId: string, compId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = `${STORAGE_KEY_NOTIFIED_COMPS}_${studentId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const ids: string[] = JSON.parse(raw);
    return ids.includes(compId);
  } catch {
    return false;
  }
}

/**
 * Marks competition as notified for the student
 */
export function markCompetitionAsNotified(studentId: string, compId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_KEY_NOTIFIED_COMPS}_${studentId || 'guest'}`;
    const raw = localStorage.getItem(key);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(compId)) {
      ids.push(compId);
      // Keep only last 100 notified IDs
      if (ids.length > 100) ids.shift();
      localStorage.setItem(key, JSON.stringify(ids));
    }
  } catch {}
}

/**
 * Dispatches a native browser push notification when a new competition/quiz is published
 */
export function sendSubjectPublicationBrowserPush(
  competition: Competition,
  matchedSubject: string,
  language: string = 'ta'
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  const settings = getStoredSubjectPushSettings();
  if (settings.soundEnabled) {
    playSubjectPublicationChime();
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const isQuiz = (competition.competitionType || '').toLowerCase() === 'quiz';
  const typeLabel = isQuiz
    ? (language === 'ta' ? 'வினாடி வினா' : language === 'si' ? 'ප්‍රශ්නාවලිය' : 'Quiz')
    : (language === 'ta' ? 'போட்டி' : language === 'si' ? 'තරඟය' : 'Competition');

  const title =
    language === 'ta'
      ? `📢 புதிய ${matchedSubject} ${typeLabel} வெளியிடப்பட்டது!`
      : language === 'si'
      ? `📢 නව ${matchedSubject} ${typeLabel} ප්‍රකාශයට පත් කරන ලදී!`
      : `📢 New ${matchedSubject} ${typeLabel} Published!`;

  const body =
    language === 'ta'
      ? `"${competition.title}" இப்போது மாணவர் பதிவுக்கு திறக்கப்பட்டுள்ளது. பங்குபற்றி பதக்கங்களை வெல்லுங்கள்!`
      : language === 'si'
      ? `"${competition.title}" දැන් ලියාපදිංචිය සඳහා විවෘතයි.`
      : `"${competition.title}" is now open for registration. Join now to compete and win merit medals!`;

  try {
    const notif = new Notification(title, {
      body,
      icon: APP_LOGO || '/favicon.ico',
      badge: APP_LOGO || '/favicon.ico',
      tag: `hnc-new-comp-${competition.id}`,
      requireInteraction: false,
      silent: false,
    });

    notif.onclick = () => {
      window.focus();
      try {
        const target = document.getElementById(`comp-card-${competition.id}`) ||
          document.getElementById('upcoming-competitions-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      } catch {}
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn('Browser push notification dispatch note:', err);
    return false;
  }
}
