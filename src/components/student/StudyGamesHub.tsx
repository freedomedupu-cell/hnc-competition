import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Flame,
  Zap,
  Clock,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Headphones,
  Coffee,
  BookOpen,
  Award,
  Star,
  ChevronRight,
  ShieldCheck,
  Check,
  Plus,
  Coins,
  ArrowRight,
  Lightbulb,
  Gift,
  HelpCircle,
  Timer,
  Lock,
  RefreshCw,
} from 'lucide-react';

export type StudyGameTab = 'spin' | 'streak' | 'math' | 'focus';

interface StudyGamesHubProps {
  initialTab?: StudyGameTab;
  onNavigate?: (nav: any) => void;
}

// Sound Synthesizer using Web Audio API (Zero external MP3 dependencies)
class WebAudioFx {
  private ctx: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio fallback
    }
  }

  playCorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  playIncorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio fallback
    }
  }

  playWin() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch {
      // Audio fallback
    }
  }

  startAmbient(type: 'lofi' | 'rain' | 'waves') {
    this.stopAmbient();
    try {
      this.initCtx();
      if (!this.ctx) return;

      if (type === 'lofi') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(174.61, this.ctx.currentTime); // F3 calming frequency
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        this.ambientOsc = osc;
        this.ambientGain = gain;
      } else {
        // Noise buffer for rain / waves
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'rain' ? 800 : 350, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        whiteNoise.start();
        this.noiseNode = whiteNoise;
        this.ambientGain = gain;
      }
    } catch {
      // Audio fallback
    }
  }

  stopAmbient() {
    try {
      if (this.ambientOsc) {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
        this.ambientOsc = null;
      }
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.ambientGain) {
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
    } catch {
      // Cleanup fallback
    }
  }
}

const audio = new WebAudioFx();

// WHEEL SECTORS
interface WheelSector {
  label: string;
  sublabel: string;
  points: number;
  color: string;
  textColor: string;
  icon: string;
  isJackpot?: boolean;
}

const WHEEL_SECTORS: WheelSector[] = [
  { label: '+15 Pts', sublabel: 'Study Bonus', points: 15, color: '#3B82F6', textColor: '#ffffff', icon: '🪙' },
  { label: '+25 Pts', sublabel: 'Smart Boost', points: 25, color: '#8B5CF6', textColor: '#ffffff', icon: '⚡' },
  { label: '🌟 50 PTS', sublabel: 'JACKPOT!', points: 50, color: '#F59E0B', textColor: '#000000', icon: '🏆', isJackpot: true },
  { label: '+10 Pts', sublabel: 'Starter Token', points: 10, color: '#10B981', textColor: '#ffffff', icon: '🌱' },
  { label: '+30 Pts', sublabel: 'Genius Token', points: 30, color: '#EC4899', textColor: '#ffffff', icon: '💎' },
  { label: '+20 Pts', sublabel: 'Knowledge Cup', points: 20, color: '#06B6D4', textColor: '#ffffff', icon: '🎓' },
  { label: '+40 Pts', sublabel: 'Super Scholar', points: 40, color: '#6366F1', textColor: '#ffffff', icon: '🚀' },
  { label: '+10 Pts', sublabel: 'Daily Gift', points: 10, color: '#14B8A6', textColor: '#ffffff', icon: '🎁' },
];

// Local calendar date key (YYYY-MM-DD) matching user's real calendar date
const getLocalTodayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export type GradeTier =
  | 'primary_early' // Gr 1 - 2 (ஆரம்ப பிரிவு 1)
  | 'primary_late'  // Gr 3 - 5 (புலமைப்பரிசில் பிரிவு)
  | 'junior'        // Gr 6 - 9 (இடைநிலைப் பிரிவு)
  | 'senior'        // Gr 10 - 11 (சாதாரண தரம் O/L)
  | 'advanced';     // Gr 12 - 13 (உயர் தரம் A/L)

export const parseGradeToTier = (gradeStr?: string): GradeTier => {
  if (!gradeStr) return 'junior';
  const s = gradeStr.toLowerCase().trim();
  if (
    s.includes('grade 1') ||
    s.includes('grade 01') ||
    s.includes('grade 2') ||
    s.includes('grade 02') ||
    s.includes('தரம் 1') ||
    s.includes('தரம் 01') ||
    s.includes('தரம் 2') ||
    s.includes('தரம் 02') ||
    s.includes('gr 1') ||
    s.includes('gr 2') ||
    s === 'grade 1' ||
    s === 'grade 2'
  ) {
    return 'primary_early';
  }
  if (
    s.includes('grade 3') ||
    s.includes('grade 03') ||
    s.includes('grade 4') ||
    s.includes('grade 04') ||
    s.includes('grade 5') ||
    s.includes('grade 05') ||
    s.includes('தரம் 3') ||
    s.includes('தரம் 4') ||
    s.includes('தரம் 5') ||
    s.includes('scholarship') ||
    s.includes('புலமைப்பரிசில்')
  ) {
    return 'primary_late';
  }
  if (
    s.includes('grade 10') ||
    s.includes('grade 11') ||
    s.includes('தரம் 10') ||
    s.includes('தரம் 11') ||
    s.includes('o/l') ||
    s.includes('ol')
  ) {
    return 'senior';
  }
  if (
    s.includes('grade 12') ||
    s.includes('grade 13') ||
    s.includes('தரம் 12') ||
    s.includes('தரம் 13') ||
    s.includes('a/l') ||
    s.includes('al') ||
    s.includes('advanced')
  ) {
    return 'advanced';
  }
  return 'junior';
};

export const GRADE_TIERS_META: Record<
  GradeTier,
  {
    nameTa: string;
    nameEn: string;
    icon: string;
    badgeColor: string;
    descTa: string;
    descEn: string;
  }
> = {
  primary_early: {
    nameTa: 'தரம் 01 - 02 (ஆரம்ப நிலை)',
    nameEn: 'Grade 01 - 02 (Early Primary)',
    icon: '🌱',
    badgeColor: 'bg-emerald-500 text-white border-emerald-400',
    descTa: 'எளிய ஒற்றை இலக்க கூட்டல்/கழித்தல் & எளிய வண்ணப் புதிர்கள்',
    descEn: 'Single-digit arithmetic & fun visual logic for young kids',
  },
  primary_late: {
    nameTa: 'தரம் 03 - 05 (புலமைப்பரிசில்)',
    nameEn: 'Grade 03 - 05 (Scholarship)',
    icon: '🌿',
    badgeColor: 'bg-teal-600 text-white border-teal-400',
    descTa: 'இரட்டை இலக்க கணக்குகள், வாய்ப்பாடுகள் & புலமைப்பரிசில் நுண்ணறிவு',
    descEn: 'Double-digit arithmetic, multiplication tables & scholarship logic',
  },
  junior: {
    nameTa: 'தரம் 06 - 09 (இடைநிலைப் பிரிவு)',
    nameEn: 'Grade 06 - 09 (Junior Secondary)',
    icon: '📘',
    badgeColor: 'bg-blue-600 text-white border-blue-400',
    descTa: 'இருபடி எண்கள், வகுத்தல், அடிப்படை இயற்கணிதம் & அறிவியல்',
    descEn: 'Squares, division, rapid order of operations & junior science',
  },
  senior: {
    nameTa: 'தரம் 10 - 11 (சாதாரண தரம் O/L)',
    nameEn: 'Grade 10 - 11 (G.C.E. O/L)',
    icon: '🎓',
    badgeColor: 'bg-indigo-600 text-white border-indigo-400',
    descTa: 'வர்க்கமூலம், சதவீதங்கள், O/L கணிதம் & தர்க்க சிந்தனை',
    descEn: 'Square roots, percentages, fast mental algebra & O/L logic',
  },
  advanced: {
    nameTa: 'தரம் 12 - 13 (உயர் தரம் A/L)',
    nameEn: 'Grade 12 - 13 (G.C.E. A/L)',
    icon: '🚀',
    badgeColor: 'bg-purple-600 text-white border-purple-400',
    descTa: 'A/L வேகக் கணக்கீடுகள், அடுக்குகளின் மதிப்பு & உயர்நிலை அறிவியல் தர்க்கம்',
    descEn: 'A/L rapid powers, higher roots, calculus aptitude & advanced puzzles',
  },
};

export const DAILY_QUESTIONS_BY_TIER: Record<
  GradeTier,
  Array<{
    id: string;
    questionTa: string;
    questionEn: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>
> = {
  primary_early: [
    {
      id: 'pe1',
      questionTa: 'ஒரு பசுவிற்கு (Cow) எத்தனை கால்கள் உள்ளன?',
      questionEn: 'How many legs does a cow have?',
      options: ['2', '4', '6', '8'],
      correctIndex: 1,
      explanation: 'பசுவிற்கு 4 கால்கள் உள்ளன! (A cow has 4 legs!)',
    },
    {
      id: 'pe2',
      questionTa: '1, 2, 3, 4, 5 — அடுத்து வரும் எண் எது?',
      questionEn: '1, 2, 3, 4, 5 — What number comes next?',
      options: ['6', '7', '8', '4'],
      correctIndex: 0,
      explanation: '5-க்கு அடுத்து வரும் எண் 6! (The next number is 6!)',
    },
    {
      id: 'pe3',
      questionTa: 'பந்து போல் வட்ட வடிவமான பழம் எது?',
      questionEn: 'Which fruit is round like a ball?',
      options: ['ஆரஞ்சு (Orange)', 'வாழைப்பழம் (Banana)', 'அன்னாசி (Pineapple)', 'வெள்ளரி (Cucumber)'],
      correctIndex: 0,
      explanation: 'ஆரஞ்சு உருண்டையான வட்ட வடிவம் கொண்டது! (An orange is round!)',
    },
  ],
  primary_late: [
    {
      id: 'pl1',
      questionTa: 'தொடரில் அடுத்த எண் என்ன: 5, 10, 15, 20, ?',
      questionEn: 'What is the next number in the pattern: 5, 10, 15, 20, ?',
      options: ['25', '30', '22', '24'],
      correctIndex: 0,
      explanation: 'ஒவ்வொரு எண்ணும் 5 கூடுகிறது: 20 + 5 = 25! (Increases by 5!)',
    },
    {
      id: 'pl2',
      questionTa: 'ஒரு வாரத்தில் 7 நாட்கள் எனில், 4 வாரங்களில் எத்தனை நாட்கள் உள்ளன?',
      questionEn: 'If 1 week has 7 days, how many days are there in 4 weeks?',
      options: ['28', '30', '24', '32'],
      correctIndex: 0,
      explanation: '4 × 7 = 28 நாட்கள்! (4 × 7 = 28 days!)',
    },
    {
      id: 'pl3',
      questionTa: 'கடிகாரத்தில் முட்கள் சரியாக 3:00 மணியைக் காட்டும்போது உருவாகும் கோணம் என்ன?',
      questionEn: 'What angle is formed by the clock hands at exactly 3:00?',
      options: ['செங்கோணம் (90° Right Angle)', 'விரிகோணம் (120°)', 'குறுகோணம் (45°)', 'நேர்கோடு (180°)'],
      correctIndex: 0,
      explanation: '3:00 மணிக்கு உருவாகும் கோணம் 90° செங்கோணம் ஆகும்! (90° Right Angle)',
    },
  ],
  junior: [
    {
      id: 'j1',
      questionTa: 'தொடரில் அடுத்த எண் என்ன: 2, 4, 8, 16, ?',
      questionEn: 'What is the next number in the pattern: 2, 4, 8, 16, ?',
      options: ['32', '24', '30', '64'],
      correctIndex: 0,
      explanation: 'ஒவ்வொரு எண்ணும் 2-ஆல் பெருக்கப்படுகிறது: 16 × 2 = 32! (Doubling pattern)',
    },
    {
      id: 'j2',
      questionTa: 'கடல் மட்டத்தில் தூய நீரின் கொதிநிலை (Boiling Point of water) என்ன?',
      questionEn: 'What is the boiling point of pure water at standard sea level?',
      options: ['100°C', '0°C', '50°C', '120°C'],
      correctIndex: 0,
      explanation: 'கடல் மட்டத்தில் நீரின் கொதிநிலை 100°C ஆகும்! (100°C boiling point)',
    },
    {
      id: 'j3',
      questionTa: 'ஒரு முக்கோணத்தின் மூன்று உட்கோணங்களின் கூட்டுத்தொகை எவ்வளவு?',
      questionEn: 'What is the sum of all three interior angles of a triangle?',
      options: ['180°', '360°', '90°', '270°'],
      correctIndex: 0,
      explanation: 'எந்தவொரு முக்கோணத்தின் உட்கோணங்களின் கூட்டுத்தொகை 180° ஆகும்!',
    },
  ],
  senior: [
    {
      id: 's1',
      questionTa: 'ஒரு மட்டையும் பந்தும் சேர்த்து $1.10. மட்டையின் விலை பந்தை விட $1.00 அதிகம் என்றால், பந்தின் விலை எவ்வளவு?',
      questionEn: 'A bat and ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?',
      options: ['$0.05', '$0.10', '$0.15', '$0.01'],
      correctIndex: 0,
      explanation: 'பந்து = $0.05, மட்டை = $1.05. மொத்தம் = $1.10! (Ball = $0.05)',
    },
    {
      id: 's2',
      questionTa: 'தொடரில் அடுத்த எண் என்ன: 2, 6, 12, 20, 30, ?',
      questionEn: 'What is the next number in the pattern: 2, 6, 12, 20, 30, ?',
      options: ['42', '40', '36', '48'],
      correctIndex: 0,
      explanation: 'வித்தியாசம்: +4, +6, +8, +10, +12 => 30 + 12 = 42!',
    },
    {
      id: 's3',
      questionTa: 'வெற்றிடத்தில் ஒளியின் வேகம் (Speed of light in vacuum) தோராயமாக எவ்வளவு?',
      questionEn: 'Approximately what is the speed of light in a vacuum?',
      options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '330 m/s'],
      correctIndex: 0,
      explanation: 'ஒளியின் வேகம் c ≈ 3 × 10⁸ m/s (300,000 km/s)!',
    },
  ],
  advanced: [
    {
      id: 'a1',
      questionTa: 'ஒரு சமச்சீரான நாணயத்தை 3 முறை சுண்டும் போது, சரியாக 2 தலைகள் (Exactly 2 Heads) கிடைப்பதற்கான நிகழ்தகவு என்ன?',
      questionEn: 'When tossing a fair coin 3 times, what is the probability of getting exactly 2 heads?',
      options: ['3/8 (0.375)', '1/2 (0.500)', '1/4 (0.250)', '5/8 (0.625)'],
      correctIndex: 0,
      explanation: 'மொத்த நிலைகள் = 8. (HHT, HTH, THH) = 3 நிலைகள். நிகழ்தகவு = 3/8!',
    },
    {
      id: 'a2',
      questionTa: 'சார்பு f(x) = x³ - 3x² + 5 எனில், x = 2-ல் அதன் முதலாம் வகைக்கெழு f\'(2) மதிப்பு என்ன?',
      questionEn: 'If f(x) = x³ - 3x² + 5, what is the value of the derivative f\'(2)?',
      options: ['0', '4', '-2', '12'],
      correctIndex: 0,
      explanation: 'f\'(x) = 3x² - 6x. x=2 எனில், 3(4) - 6(2) = 12 - 12 = 0!',
    },
    {
      id: 'a3',
      questionTa: 'சூரிய ஒளி பூமியை வந்தடைய சராசரியாக எத்தனை நிமிடங்கள் ஆகிறது?',
      questionEn: 'Approximately how many minutes does sunlight take to reach Earth?',
      options: ['8 நிமிடங்கள் 20 விநாடிகள்', '3 நிமிடங்கள்', '12 நிமிடங்கள்', 'உடனடியாக (0s)'],
      correctIndex: 0,
      explanation: 'சூரிய ஒளி ~150 மில்லியன் கி.மீ பயணித்து பூமியை அடைய 8 நிமிடம் 20 விநாடிகள் (~500s) ஆகும்!',
    },
  ],
};

export const StudyGamesHub: React.FC<StudyGamesHubProps> = ({ initialTab = 'spin', onNavigate }) => {
  const { currentStudent, currentAuthUser, adjustStudentPoints, language } = useApp();
  const [activeTab, setActiveTab] = useState<StudyGameTab>(initialTab);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const studentUid = currentAuthUser?.uid || currentStudent?.id || 'guest';
  const studentId = currentAuthUser?.studentId || currentStudent?.studentId || '';
  const todayKey = getLocalTodayKey();

  // Student Enrolled Grade Tier (Strictly tied to the student's registered grade)
  const studentEnrolledGrade = currentStudent?.gradeLevel || currentAuthUser?.grade || 'Grade 2';
  const [selectedGradeTier, setSelectedGradeTier] = useState<GradeTier>(() =>
    parseGradeToTier(studentEnrolledGrade)
  );

  useEffect(() => {
    const tier = parseGradeToTier(studentEnrolledGrade);
    setSelectedGradeTier(tier);
    generateMathQuestion(tier);
  }, [studentEnrolledGrade]);

  // Synchronized live reward points state
  const [hubPoints, setHubPoints] = useState<number>(() => {
    return (
      currentStudent?.referralPoints ??
      currentAuthUser?.referralPoints ??
      (typeof window !== 'undefined'
        ? parseInt(
            localStorage.getItem(`hnc_student_points_${studentUid}`) ||
            localStorage.getItem('hnc_student_points_active') ||
            '0',
            10
          )
        : 0)
    );
  });

  useEffect(() => {
    const handlePointsUpdate = (e: any) => {
      if (e?.detail?.points !== undefined) {
        setHubPoints(e.detail.points);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('hnc_points_updated', handlePointsUpdate);
      return () => window.removeEventListener('hnc_points_updated', handlePointsUpdate);
    }
  }, []);

  useEffect(() => {
    const pts = currentStudent?.referralPoints ?? currentAuthUser?.referralPoints;
    if (pts !== undefined && pts !== null) {
      setHubPoints(pts);
    }
  }, [currentStudent?.referralPoints, currentAuthUser?.referralPoints]);

  // ----------------------------------------------------
  // 1. LUCKY SPIN WHEEL STATE & AIRTIGHT 24-HOUR LOCKOUT
  // ----------------------------------------------------
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelSector | null>(null);

  const checkHasSpunToday = () => {
    if (typeof window === 'undefined') return false;
    const currentToday = getLocalTodayKey();
    const isToday = (d?: string | null) => Boolean(d && (d === currentToday || d.startsWith(currentToday)));

    if (isToday(currentAuthUser?.lastSpinDate)) return true;
    if (isToday(currentStudent?.lastSpinDate)) return true;
    if (studentUid && localStorage.getItem(`hnc_spin_date_${studentUid}`) === currentToday) return true;
    if (studentId && localStorage.getItem(`hnc_spin_date_${studentId}`) === currentToday) return true;
    if (localStorage.getItem('hnc_spin_date_last') === currentToday) return true;

    const ts = localStorage.getItem('hnc_spin_last_timestamp');
    if (ts) {
      const spinTime = parseInt(ts, 10);
      if (!isNaN(spinTime)) {
        const d = new Date(spinTime);
        const now = new Date();
        if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
          return true;
        }
      }
    }
    return false;
  };

  const [hasSpunToday, setHasSpunToday] = useState<boolean>(() => checkHasSpunToday());
  const [spinToast, setSpinToast] = useState<string | null>(null);

  // Live countdown to midnight when the next free spin unlocks
  const [timeUntilTomorrow, setTimeUntilTomorrow] = useState<string>('');
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diff = Math.max(0, tomorrowMidnight.getTime() - now.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilTomorrow(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Multi-layer check for daily spin eligibility across Firestore session & localStorage
  useEffect(() => {
    if (checkHasSpunToday()) {
      setHasSpunToday(true);
    }
  }, [
    currentAuthUser?.uid,
    currentAuthUser?.lastSpinDate,
    currentAuthUser?.studentId,
    currentStudent?.lastSpinDate,
    studentUid,
    studentId,
    todayKey,
  ]);

  const handleSpinWheel = async () => {
    // Strictly prevent any spin if already spinning or already claimed today
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setWonPrize(null);

    // Pick random sector
    const sectorCount = WHEEL_SECTORS.length;
    const chosenIndex = Math.floor(Math.random() * sectorCount);
    const sectorAngle = 360 / sectorCount;
    const sector = WHEEL_SECTORS[chosenIndex];

    // 5 to 7 full rotations plus offset to center chosen sector under top indicator (270 deg)
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetOffset = 360 - (chosenIndex * sectorAngle + sectorAngle / 2);
    const finalRotation = wheelRotation + extraRotations + targetOffset;

    // IMMEDIATE AIRTIGHT LOCKOUT: Write to localStorage & React state before animation begins
    const currentToday = getLocalTodayKey();
    if (studentUid) localStorage.setItem(`hnc_spin_date_${studentUid}`, currentToday);
    if (studentId) localStorage.setItem(`hnc_spin_date_${studentId}`, currentToday);
    localStorage.setItem('hnc_spin_date_last', currentToday);
    localStorage.setItem('hnc_spin_last_timestamp', String(Date.now()));
    setHasSpunToday(true);

    // Credit student points immediately to AppContext & Cloud Firestore
    if (adjustStudentPoints) {
      adjustStudentPoints(
        studentUid,
        sector.points,
        `Daily Lucky Spin Reward: ${sector.label} (${currentToday})`
      ).catch((err) => console.error('Error awarding spin points:', err));
    }

    if (soundEnabled) {
      // Audio ticks
      let tickCount = 0;
      const tickInterval = setInterval(() => {
        tickCount++;
        audio.playTick();
        if (tickCount > 25) clearInterval(tickInterval);
      }, 120);
    }

    setWheelRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(sector);

      if (soundEnabled) {
        audio.playWin();
      }

      confetti({
        particleCount: sector.isJackpot ? 120 : 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      const updatedPoints = (hubPoints || 0) + sector.points;
      setHubPoints(updatedPoints);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`hnc_student_points_${studentUid}`, String(updatedPoints));
        localStorage.setItem('hnc_student_points_active', String(updatedPoints));
        try {
          window.dispatchEvent(new CustomEvent('hnc_points_updated', { detail: { points: updatedPoints } }));
        } catch {}
      }
      setSpinToast(
        language === 'ta'
          ? `🎉 வெற்றி! +${sector.points} புள்ளிகள் உங்கள் டாஷ்போர்டில் சேர்க்கப்பட்டது! (மொத்த புள்ளிகள்: ${updatedPoints} PTS)`
          : `🎉 Awesome! +${sector.points} points credited to your dashboard! (Total: ${updatedPoints} PTS)`
      );
      setTimeout(() => setSpinToast(null), 6000);
    }, 4500);
  };

  // ----------------------------------------------------
  // 2. DAILY STREAK & 1-MINUTE BRAIN WORKOUT STATE
  // ----------------------------------------------------
  const [streakDays, setStreakDays] = useState(1);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [workoutTimer, setWorkoutTimer] = useState(60);
  const [workoutAnswers, setWorkoutAnswers] = useState<number[]>([]);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [workoutScore, setWorkoutScore] = useState(0);

  // Active question set dynamically adapted to student's chosen Grade Tier!
  const activeQuestions = DAILY_QUESTIONS_BY_TIER[selectedGradeTier] || DAILY_QUESTIONS_BY_TIER.junior;

  useEffect(() => {
    // Load and update streak
    const lastLogin = localStorage.getItem(`hnc_streak_last_${studentUid}`);
    const currentStreak = parseInt(localStorage.getItem(`hnc_streak_count_${studentUid}`) || '1', 10);

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastLogin === yesterday) {
      const newStreak = currentStreak + 1;
      setStreakDays(newStreak);
      localStorage.setItem(`hnc_streak_count_${studentUid}`, newStreak.toString());
      localStorage.setItem(`hnc_streak_last_${studentUid}`, todayKey);
    } else if (lastLogin === todayKey) {
      setStreakDays(currentStreak);
    } else {
      setStreakDays(1);
      localStorage.setItem(`hnc_streak_count_${studentUid}`, '1');
      localStorage.setItem(`hnc_streak_last_${studentUid}`, todayKey);
    }
  }, [studentUid, todayKey]);

  useEffect(() => {
    let interval: any;
    if (workoutStarted && !workoutCompleted && workoutTimer > 0) {
      interval = setInterval(() => {
        setWorkoutTimer((prev) => {
          if (prev <= 1) {
            handleFinishWorkout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStarted, workoutCompleted, workoutTimer]);

  const handleAnswerWorkout = (selectedIdx: number) => {
    const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];
    const isCorrect = selectedIdx === currentQ.correctIndex;
    if (soundEnabled) {
      if (isCorrect) audio.playCorrect();
      else audio.playIncorrect();
    }

    const updated = [...workoutAnswers, selectedIdx];
    setWorkoutAnswers(updated);

    if (currentQuestionIndex + 1 < activeQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate score
      let score = 0;
      activeQuestions.forEach((q, idx) => {
        if (updated[idx] === q.correctIndex) score++;
      });
      setWorkoutScore(score);
      setWorkoutCompleted(true);
      setWorkoutStarted(false);

      if (score === activeQuestions.length) {
        confetti({ particleCount: 80, spread: 60 });
        if (adjustStudentPoints && studentUid) {
          adjustStudentPoints(studentUid, 30, `Daily 1-Minute Brain Workout: 100% (${selectedGradeTier})`);
        }
      } else if (score > 0) {
        if (adjustStudentPoints && studentUid) {
          adjustStudentPoints(studentUid, score * 10, `Daily Brain Workout Participation (${selectedGradeTier})`);
        }
      }
    }
  };

  const handleFinishWorkout = () => {
    setWorkoutCompleted(true);
    setWorkoutStarted(false);
  };

  // ----------------------------------------------------
  // 3. GRADE-DIFFERENTIATED SPEED MATH RUSH STATE
  // ----------------------------------------------------
  const [mathPlaying, setMathPlaying] = useState(false);
  const [mathTimer, setMathTimer] = useState(60);
  const [mathScore, setMathScore] = useState(0);
  const [mathCombo, setMathCombo] = useState(0);

  interface MathQuestionData {
    num1: number | string;
    num2?: number | string;
    op: string;
    answer: number;
    displayText: string;
    options: number[];
  }

  const [mathQuestion, setMathQuestion] = useState<MathQuestionData>({
    num1: 3,
    num2: 2,
    op: '+',
    answer: 5,
    displayText: '3 + 2 = ?',
    options: [5, 4, 6, 7],
  });
  const [mathInput, setMathInput] = useState('');
  const [mathHighScore, setMathHighScore] = useState(() => {
    return parseInt(localStorage.getItem(`hnc_math_high_${studentUid}`) || '0', 10);
  });
  const [mathFeedback, setMathFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Helper to build 4 unique randomized options around correct answer
  const buildOptions = (correct: number): number[] => {
    const set = new Set<number>();
    set.add(correct);
    const deltas = [-1, 1, -2, 2, -3, 3, 5, -5];
    for (const d of deltas) {
      if (set.size >= 4) break;
      const c = correct + d;
      if (c >= 0) set.add(c);
    }
    while (set.size < 4) {
      set.add(correct + Math.floor(Math.random() * 6) + 1);
    }
    return Array.from(set).sort(() => Math.random() - 0.5);
  };

  const generateMathQuestion = (tier: GradeTier = selectedGradeTier) => {
    let num1: number | string = 0;
    let num2: number | string = 0;
    let op = '+';
    let answer = 0;
    let displayText = '';

    if (tier === 'primary_early') {
      // Grade 1 - 2: Single-digit addition and subtraction (sums up to 10, no negatives)
      const isAdd = Math.random() > 0.45;
      if (isAdd) {
        op = '+';
        const n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const n2 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        answer = n1 + n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} + ${n2} = ?`;
      } else {
        op = '-';
        const n1 = Math.floor(Math.random() * 6) + 4; // 4 to 9
        const n2 = Math.floor(Math.random() * (n1 - 1)) + 1; // 1 to n1-1
        answer = n1 - n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} - ${n2} = ?`;
      }
    } else if (tier === 'primary_late') {
      // Grade 3 - 5: 2-digit sums, multiplication tables 2-9, clean division
      const ops = ['+', '-', '×', '÷'];
      op = ops[Math.floor(Math.random() * ops.length)];
      if (op === '+') {
        const n1 = Math.floor(Math.random() * 35) + 12;
        const n2 = Math.floor(Math.random() * 35) + 10;
        answer = n1 + n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} + ${n2} = ?`;
      } else if (op === '-') {
        const n1 = Math.floor(Math.random() * 50) + 30;
        const n2 = Math.floor(Math.random() * 25) + 10;
        answer = n1 - n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} - ${n2} = ?`;
      } else if (op === '×') {
        const n1 = Math.floor(Math.random() * 7) + 3; // 3 to 9
        const n2 = Math.floor(Math.random() * 7) + 3; // 3 to 9
        answer = n1 * n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} × ${n2} = ?`;
      } else {
        const divisor = Math.floor(Math.random() * 7) + 2; // 2 to 8
        const quotient = Math.floor(Math.random() * 8) + 2; // 2 to 9
        const dividend = divisor * quotient;
        answer = quotient;
        num1 = dividend;
        num2 = divisor;
        displayText = `${dividend} ÷ ${divisor} = ?`;
      }
    } else if (tier === 'junior') {
      // Grade 6 - 9: 2-digit multiplication, division, squares up to 15
      const ops = ['+', '-', '×', '÷', 'x²'];
      op = ops[Math.floor(Math.random() * ops.length)];
      if (op === 'x²') {
        const n1 = Math.floor(Math.random() * 9) + 7; // 7 to 15
        answer = n1 * n1;
        num1 = n1;
        num2 = '';
        displayText = `${n1}² = ?`;
      } else if (op === '×') {
        const n1 = Math.floor(Math.random() * 8) + 12; // 12 to 19
        const n2 = Math.floor(Math.random() * 6) + 4; // 4 to 9
        answer = n1 * n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} × ${n2} = ?`;
      } else if (op === '÷') {
        const divisor = Math.floor(Math.random() * 8) + 4; // 4 to 11
        const quotient = Math.floor(Math.random() * 9) + 6; // 6 to 14
        const dividend = divisor * quotient;
        answer = quotient;
        num1 = dividend;
        num2 = divisor;
        displayText = `${dividend} ÷ ${divisor} = ?`;
      } else if (op === '+') {
        const n1 = Math.floor(Math.random() * 50) + 45;
        const n2 = Math.floor(Math.random() * 50) + 35;
        answer = n1 + n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} + ${n2} = ?`;
      } else {
        const n1 = Math.floor(Math.random() * 80) + 70;
        const n2 = Math.floor(Math.random() * 40) + 25;
        answer = n1 - n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} - ${n2} = ?`;
      }
    } else if (tier === 'senior') {
      // Grade 10 - 11 (O/L): fast mental arithmetic, square roots, squares, percentages
      const ops = ['×', 'x²', '√x', '%'];
      op = ops[Math.floor(Math.random() * ops.length)];
      if (op === '√x') {
        const roots = [121, 144, 169, 196, 225, 256, 289, 324, 361, 400, 625];
        const val = roots[Math.floor(Math.random() * roots.length)];
        answer = Math.round(Math.sqrt(val));
        num1 = val;
        num2 = '';
        displayText = `√${val} = ?`;
      } else if (op === '%') {
        const pcts = [10, 20, 25, 50, 15];
        const bases = [120, 160, 200, 240, 300, 400];
        const p = pcts[Math.floor(Math.random() * pcts.length)];
        const b = bases[Math.floor(Math.random() * bases.length)];
        answer = (p * b) / 100;
        num1 = p;
        num2 = b;
        displayText = `${p}% of ${b} = ?`;
      } else if (op === 'x²') {
        const n1 = Math.floor(Math.random() * 12) + 13; // 13 to 24
        answer = n1 * n1;
        num1 = n1;
        num2 = '';
        displayText = `${n1}² = ?`;
      } else {
        const n1 = Math.floor(Math.random() * 9) + 14; // 14 to 22
        const n2 = Math.floor(Math.random() * 6) + 11; // 11 to 16
        answer = n1 * n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} × ${n2} = ?`;
      }
    } else {
      // Grade 12 - 13 (A/L): Advanced rapid arithmetic, 2ⁿ powers, percentages, roots
      const ops = ['×', '2ⁿ', '√x', '%', 'x²'];
      op = ops[Math.floor(Math.random() * ops.length)];
      if (op === '2ⁿ') {
        const exps = [4, 5, 6, 7, 8, 9];
        const exp = exps[Math.floor(Math.random() * exps.length)];
        answer = Math.pow(2, exp);
        num1 = 2;
        num2 = exp;
        displayText = `2^${exp} (2ⁿ) = ?`;
      } else if (op === '√x') {
        const roots = [576, 625, 729, 784, 900, 1024, 1296];
        const val = roots[Math.floor(Math.random() * roots.length)];
        answer = Math.round(Math.sqrt(val));
        num1 = val;
        num2 = '';
        displayText = `√${val} = ?`;
      } else if (op === '%') {
        const pcts = [35, 45, 15, 75, 40, 25];
        const bases = [200, 300, 400, 500, 600];
        const p = pcts[Math.floor(Math.random() * pcts.length)];
        const b = bases[Math.floor(Math.random() * bases.length)];
        answer = (p * b) / 100;
        num1 = p;
        num2 = b;
        displayText = `${p}% of ${b} = ?`;
      } else if (op === 'x²') {
        const n1 = Math.floor(Math.random() * 12) + 21; // 21 to 32
        answer = n1 * n1;
        num1 = n1;
        num2 = '';
        displayText = `${n1}² = ?`;
      } else {
        const n1 = Math.floor(Math.random() * 12) + 19; // 19 to 30
        const n2 = Math.floor(Math.random() * 11) + 13; // 13 to 23
        answer = n1 * n2;
        num1 = n1;
        num2 = n2;
        displayText = `${n1} × ${n2} = ?`;
      }
    }

    const options = buildOptions(answer);
    setMathQuestion({ num1, num2, op, answer, displayText, options });
    setMathInput('');
  };

  useEffect(() => {
    let interval: any;
    if (mathPlaying && mathTimer > 0) {
      interval = setInterval(() => {
        setMathTimer((prev) => {
          if (prev <= 1) {
            endMathGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mathPlaying, mathTimer]);

  const startMathGame = () => {
    setMathScore(0);
    setMathCombo(0);
    setMathTimer(60);
    setMathPlaying(true);
    generateMathQuestion(selectedGradeTier);
  };

  const endMathGame = () => {
    setMathPlaying(false);
    if (mathScore > mathHighScore) {
      setMathHighScore(mathScore);
      localStorage.setItem(`hnc_math_high_${studentUid}`, mathScore.toString());
      confetti({ particleCount: 90, spread: 70 });
    }
    if (adjustStudentPoints && studentUid && mathScore > 0) {
      const earned = Math.min(50, Math.floor(mathScore / 2));
      adjustStudentPoints(studentUid, earned, `Speed Math Rush (${selectedGradeTier}) Score: ${mathScore}`);
    }
  };

  const submitNumericAnswer = (userVal: number) => {
    if (!mathPlaying) return;

    if (userVal === mathQuestion.answer) {
      const newCombo = mathCombo + 1;
      const pointsAdded = 10 + Math.min(newCombo * 2, 20);
      setMathScore((prev) => prev + pointsAdded);
      setMathCombo(newCombo);
      setMathFeedback('correct');
      if (soundEnabled) audio.playCorrect();
      setTimeout(() => setMathFeedback(null), 300);
      generateMathQuestion(selectedGradeTier);
    } else {
      setMathCombo(0);
      setMathFeedback('wrong');
      if (soundEnabled) audio.playIncorrect();
      setTimeout(() => setMathFeedback(null), 300);
      setMathInput('');
    }
  };

  const handleMathSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mathPlaying) return;
    const val = parseInt(mathInput.trim(), 10);
    if (isNaN(val)) return;
    submitNumericAnswer(val);
  };

  // ----------------------------------------------------
  // 4. FOCUS STUDY ROOM & POMODORO CAM STATE
  // ----------------------------------------------------
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusMode, setFocusMode] = useState<'study' | 'shortBreak' | 'longBreak'>('study');
  const [ambientSound, setAmbientSound] = useState<'none' | 'lofi' | 'rain' | 'waves'>('none');
  const [focusTasks, setFocusTasks] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: '1', text: 'Grade 11 Science Chapter Revision', done: false },
    { id: '2', text: 'Solve 10 Speed Math questions', done: true },
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [totalFocusedMinutes, setTotalFocusedMinutes] = useState(25);

  useEffect(() => {
    let interval: any;
    if (isFocusActive) {
      interval = setInterval(() => {
        if (pomodoroSeconds > 0) {
          setPomodoroSeconds((prev) => prev - 1);
        } else if (pomodoroMinutes > 0) {
          setPomodoroMinutes((prev) => prev - 1);
          setPomodoroSeconds(59);
        } else {
          // Timer finished!
          setIsFocusActive(false);
          audio.playWin();
          confetti({ particleCount: 70, spread: 60 });
          setTotalFocusedMinutes((prev) => prev + 25);
          if (adjustStudentPoints && studentUid) {
            adjustStudentPoints(studentUid, 20, '25-Minute Focused Study Milestone');
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusActive, pomodoroMinutes, pomodoroSeconds, studentUid, adjustStudentPoints]);

  const toggleFocusTimer = () => {
    if (!isFocusActive) {
      setIsFocusActive(true);
      if (ambientSound !== 'none') {
        audio.startAmbient(ambientSound as any);
      }
    } else {
      setIsFocusActive(false);
      audio.stopAmbient();
    }
  };

  const resetFocusTimer = (mode: 'study' | 'shortBreak' | 'longBreak') => {
    setIsFocusActive(false);
    audio.stopAmbient();
    setFocusMode(mode);
    if (mode === 'study') {
      setPomodoroMinutes(25);
      setPomodoroSeconds(0);
    } else if (mode === 'shortBreak') {
      setPomodoroMinutes(5);
      setPomodoroSeconds(0);
    } else {
      setPomodoroMinutes(15);
      setPomodoroSeconds(0);
    }
  };

  const handleAmbientChange = (type: 'none' | 'lofi' | 'rain' | 'waves') => {
    setAmbientSound(type);
    if (type === 'none' || !isFocusActive) {
      audio.stopAmbient();
    } else {
      audio.startAmbient(type as any);
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setFocusTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newTaskText.trim(), done: false },
    ]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setFocusTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER WITH SOUND TOGGLE & QUICK STATS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>4-in-1 Study Gamification</span>
            </span>
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-bounce" />
              <span>{streakDays} Day Streak!</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {language === 'ta'
              ? '🎮 மாணவர் கல்வி கேம்கள் & தினசரி சவால்கள்'
              : language === 'si'
              ? '🎮 ශිෂ්‍ය අධ්‍යාපනික ක්‍රීඩා & අභියෝග'
              : '🎮 Student Study Games & Daily Challenges Arena'}
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            {language === 'ta'
              ? 'தினமும் புதிய சவால்கள், அதிர்ஷ்ட சுழல் சக்கரம், வேகக் கணிதம் மற்றும் இசையுடன் கூடிய அமைதியான படிப்பு அறை.'
              : 'Daily spin rewards, 1-minute brain workout, speed math rush, and focus study lounge with calming beats.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          {/* Student's Enrolled Grade Badge (Automatic, no manual tier switcher needed) */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
            <span>{GRADE_TIERS_META[selectedGradeTier]?.icon || '🌱'}</span>
            <span>{studentEnrolledGrade}</span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs border border-amber-300">
            <Coins className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="font-mono">{hubPoints} PTS</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
              soundEnabled
                ? 'bg-indigo-600/60 border-indigo-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
          </button>
        </div>
      </div>

      {/* 4 INTERACTIVE NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveTab('spin')}
          className={`p-3.5 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
            activeTab === 'spin'
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 text-slate-900 shadow-sm ring-2 ring-amber-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🎡</span>
            {!hasSpunToday ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                Ready!
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400">Claimed</span>
            )}
          </div>
          <div className="mt-2">
            <div className="font-extrabold text-xs text-slate-900">Lucky Spin Wheel</div>
            <div className="text-[11px] text-slate-500">
              {language === 'ta' ? 'அதிர்ஷ்ட சுழல் சக்கரம்' : 'Free Daily Spin'}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('streak')}
          className={`p-3.5 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
            activeTab === 'streak'
              ? 'bg-gradient-to-br from-orange-50 to-rose-50 border-orange-400 text-slate-900 shadow-sm ring-2 ring-orange-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🔥</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-900">
              Day {streakDays}
            </span>
          </div>
          <div className="mt-2">
            <div className="font-extrabold text-xs text-slate-900">1-Min Brain Workout</div>
            <div className="text-[11px] text-slate-500">
              {language === 'ta' ? 'தினசரி மூளைச் சவால்' : 'Daily 3 Questions'}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('math')}
          className={`p-3.5 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
            activeTab === 'math'
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 text-slate-900 shadow-sm ring-2 ring-blue-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">⚡</span>
            <span className="text-[10px] font-bold text-blue-700 font-mono">
              High: {mathHighScore}
            </span>
          </div>
          <div className="mt-2">
            <div className="font-extrabold text-xs text-slate-900">Speed Math Rush</div>
            <div className="text-[11px] text-slate-500">
              {language === 'ta' ? 'வேகக் கணித ரேஸ்' : '60s Time Trial'}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('focus')}
          className={`p-3.5 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
            activeTab === 'focus'
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 text-slate-900 shadow-sm ring-2 ring-emerald-400/30'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🎧</span>
            <span className="text-[10px] font-bold text-emerald-800">
              {isFocusActive ? 'Active' : 'Lo-Fi Lounge'}
            </span>
          </div>
          <div className="mt-2">
            <div className="font-extrabold text-xs text-slate-900">Focus Study Room</div>
            <div className="text-[11px] text-slate-500">
              {language === 'ta' ? 'படிப்பு அறை & டைமர்' : 'Pomodoro Study Cam'}
            </div>
          </div>
        </button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: LUCKY SPIN WHEEL                                             */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'spin' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Visual SVG Wheel */}
            <div className="md:col-span-6 flex flex-col items-center justify-center relative">
              {/* Top pointer marker */}
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-red-600 z-20 -mb-3 drop-shadow-md" />

              <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full p-2 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-xl border-4 border-amber-300">
                <div
                  className="w-full h-full rounded-full overflow-hidden transition-transform ease-out"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transitionDuration: isSpinning ? '4.5s' : '0s',
                  }}
                >
                  <svg viewBox="0 0 300 300" className="w-full h-full">
                    {WHEEL_SECTORS.map((sector, idx) => {
                      const total = WHEEL_SECTORS.length;
                      const angle = 360 / total;
                      const startAngle = idx * angle;
                      const endAngle = (idx + 1) * angle;

                      // SVG arc path calculation
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      const x1 = 150 + 150 * Math.cos(startRad);
                      const y1 = 150 + 150 * Math.sin(startRad);
                      const x2 = 150 + 150 * Math.cos(endRad);
                      const y2 = 150 + 150 * Math.sin(endRad);
                      const path = `M 150 150 L ${x1} ${y1} A 150 150 0 0 1 ${x2} ${y2} Z`;

                      const midAngle = startAngle + angle / 2;
                      const textRad = (midAngle * Math.PI) / 180;
                      const textX = 150 + 95 * Math.cos(textRad);
                      const textY = 150 + 95 * Math.sin(textRad);

                      return (
                        <g key={idx}>
                          <path d={path} fill={sector.color} stroke="#ffffff" strokeWidth="2" />
                          <text
                            x={textX}
                            y={textY}
                            fill={sector.textColor}
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                          >
                            {sector.icon} {sector.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Center Hub Button */}
                <div
                  className={`absolute inset-0 m-auto w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg z-10 pointer-events-none transition-all ${
                    hasSpunToday
                      ? 'bg-slate-900 text-amber-300 border-2 border-slate-600'
                      : 'bg-gradient-to-b from-slate-900 to-slate-800 text-white border-2 border-amber-300'
                  }`}
                >
                  {hasSpunToday ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">CLAIMED</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="font-black text-xs">SPIN</span>
                    </>
                  )}
                </div>
              </div>

              {spinToast && (
                <div className="mt-4 px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl shadow-xs animate-in fade-in duration-300">
                  {spinToast}
                </div>
              )}
            </div>

            {/* Spin Controls & Rules */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                  {language === 'ta' ? 'தினசரி இலவச வாய்ப்பு (1 Spin / Day)' : 'Daily Free Spin (1 Spin / Day)'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {language === 'ta' ? 'அதிர்ஷ்ட சுழல் சக்கரம் (Lucky Wheel)' : 'Daily Knowledge Wheel'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {language === 'ta'
                    ? 'மாணவர்கள் தினமும் ஒருமுறை மட்டுமே இலவசமாகச் சுழற்றலாம். கிடைக்கும் புள்ளிகள் உடனடியாக உங்கள் டாஷ்போர்டில் சேர்க்கப்படும்!'
                    : 'Spin once per day to unlock study points, bonuses, and special candidate rewards credited straight to your dashboard!'}
                </p>
              </div>

              {/* Prize Showcase */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  {language === 'ta' ? 'சாத்தியமான பரிசுகள்:' : 'Available Prize Pool:'}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-lg">🏆</span>
                    <div>
                      <div className="font-bold text-amber-800">+50 Points Jackpot</div>
                      <div className="text-[10px] text-slate-400">Mega Reward</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-lg">⚡</span>
                    <div>
                      <div className="font-bold text-purple-800">+25 Pts Smart Boost</div>
                      <div className="text-[10px] text-slate-400">Speed token</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-lg">💎</span>
                    <div>
                      <div className="font-bold text-pink-800">+30 Pts Genius</div>
                      <div className="text-[10px] text-slate-400">Knowledge badge</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100">
                    <span className="text-lg">🎁</span>
                    <div>
                      <div className="font-bold text-teal-800">+10 to +20 Pts</div>
                      <div className="text-[10px] text-slate-400">Daily Gift Token</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spin Button */}
              <div className="pt-2">
                <button
                  disabled={isSpinning || hasSpunToday}
                  onClick={handleSpinWheel}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm transition-all transform flex items-center justify-center gap-2 shadow-md ${
                    isSpinning
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : hasSpunToday
                      ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed opacity-90'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 active:scale-[0.98] shadow-amber-500/20 cursor-pointer'
                  }`}
                >
                  {isSpinning ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : hasSpunToday ? (
                    <Lock className="w-5 h-5 text-slate-500" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-slate-950" />
                  )}
                  <span>
                    {isSpinning
                      ? (language === 'ta' ? 'சுழல்கிறது...' : 'Spinning...')
                      : hasSpunToday
                      ? (language === 'ta'
                          ? `இன்றைய வாய்ப்பு முடிந்தது (${timeUntilTomorrow})`
                          : `Today's Daily Spin Claimed (${timeUntilTomorrow})`)
                      : (language === 'ta'
                          ? 'இன்றைய இலவச ஸ்பின்னை சுழற்று (Spin Now!)'
                          : 'Claim Free Daily Spin (Spin Now!)')}
                  </span>
                </button>

                {hasSpunToday && (
                  <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-center space-y-1 animate-in fade-in">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {language === 'ta'
                          ? 'இன்றைய இலவச ஸ்பின் பரிசு வெற்றிகரமாகப் பெறப்பட்டது!'
                          : "Today's daily free spin reward claimed successfully!"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {language === 'ta'
                        ? 'ஒரு நாளைக்கு ஒரு முறை மட்டுமே இலவச ஸ்பின் செய்ய முடியும். அடுத்த சுழற்சி நள்ளிரவு 12:00 மணிக்கு திறக்கப்படும். இன்னும் மீதமுள்ள நேரம்: '
                        : 'Only 1 free spin allowed per calendar day. Next free spin unlocks at midnight tomorrow. Time remaining: '}
                      <span className="font-extrabold text-amber-800 font-mono ml-1">{timeUntilTomorrow}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: DAILY STREAK & 1-MINUTE BRAIN WORKOUT                        */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'streak' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Streak Milestone Track */}
          <div className="p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-50 border border-orange-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                  <Flame className="w-6 h-6 fill-orange-200 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-700 block">
                    Daily Login Streak
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-orange-950">{streakDays} Day Streak!</span>
                    <span className="text-xs font-bold text-orange-700">🔥 Flame Active</span>
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-orange-800 bg-white px-3 py-1.5 rounded-xl border border-orange-200">
                {language === 'ta' ? 'தொடர்ந்து வந்து போனஸ் பெறுங்கள்' : 'Open daily to keep streak alive!'}
              </div>
            </div>

            {/* 7-Day Visual Progress Track */}
            <div className="grid grid-cols-7 gap-1.5 pt-2 text-center text-[10px]">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isPassed = streakDays >= day;
                const isCurrent = streakDays === day;
                return (
                  <div
                    key={day}
                    className={`p-2 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-orange-500 text-white font-black border-orange-600 shadow-sm scale-105'
                        : isPassed
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                        : 'bg-white/80 text-slate-400 border-slate-200'
                    }`}
                  >
                    <div>Day {day}</div>
                    <div className="mt-1 font-bold">
                      {day === 7 ? '🎁 +100' : `+${day * 5 + 5}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1-Minute Brain Workout Challenge */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                  ⚡ Quick Dopamine Hit
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {language === 'ta' ? 'தினசரி 1 நிமிட மூளைச் சவால் (Daily Brain Workout)' : 'Daily 1-Minute Brain Workout'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ta'
                    ? '3 விரைவான IQ மற்றும் தர்க்கக் கேள்விகள். 60 வினாடிகளில் முடித்துப் புள்ளிகளைப் பெறுங்கள்!'
                    : 'Answer 3 fast trivia & logic riddles within 60 seconds to earn bonus points.'}
                </p>
              </div>

              {workoutStarted && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100 text-blue-900 font-mono font-bold text-xs">
                  <Clock className="w-4 h-4 text-blue-700 animate-spin" />
                  <span>{workoutTimer}s remaining</span>
                </div>
              )}
            </div>

            {!workoutStarted && !workoutCompleted && (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl shadow-xs">
                  🧠
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {language === 'ta' ? 'இன்றைய 3 வினாடி வினா சவால் தயார்!' : 'Today\'s 3 Rapid Questions Ready!'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {language === 'ta'
                      ? 'கணித புதிர், தொடர் எண் தர்க்கம் மற்றும் பொது அறிவியல் வினாக்கள் உள்ளன.'
                      : 'Features Math riddle, number pattern logic, and science trivia.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWorkoutStarted(true);
                    setWorkoutTimer(60);
                    setCurrentQuestionIndex(0);
                    setWorkoutAnswers([]);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md active:scale-95 transition"
                >
                  🚀 {language === 'ta' ? 'சவாலைத் தொடங்கு (Start 60s Challenge)' : 'Start 60s Workout'}
                </button>
              </div>
            )}

            {workoutStarted && !workoutCompleted && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Question {currentQuestionIndex + 1} of {activeQuestions.length}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {GRADE_TIERS_META[selectedGradeTier].icon} {GRADE_TIERS_META[selectedGradeTier].nameTa}
                    </span>
                  </div>
                  <span className="font-bold text-blue-700">60s Sprint</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'ta'
                      ? activeQuestions[currentQuestionIndex]?.questionTa
                      : activeQuestions[currentQuestionIndex]?.questionEn}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {activeQuestions[currentQuestionIndex]?.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswerWorkout(oIdx)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left text-xs font-semibold text-slate-800 transition active:scale-[0.98] flex items-center justify-between"
                    >
                      <span>{opt}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {workoutCompleted && (
              <div className="p-6 bg-white rounded-2xl border border-emerald-300 text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl">
                  🎉
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    {language === 'ta' ? 'சவால் முடிவடைந்தது!' : 'Workout Complete!'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {language === 'ta'
                      ? `நீங்கள் ${activeQuestions.length}-ல் ${workoutScore} கேள்விகளுக்கு சரியான விடை அளித்துள்ளீர்கள்!`
                      : `You scored ${workoutScore} out of ${activeQuestions.length} correct!`}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setWorkoutCompleted(false);
                      setWorkoutStarted(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setWorkoutCompleted(false);
                      setWorkoutStarted(true);
                      setWorkoutTimer(60);
                      setCurrentQuestionIndex(0);
                      setWorkoutAnswers([]);
                    }}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 3: SPEED MATH RUSH GAME                                         */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'math' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                ⚡ Rapid Fire Math
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {language === 'ta' ? 'வேகக் கணித மின்னல் ரேஸ் (Speed Math Rush)' : 'Speed Math Rush'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ta'
                  ? '60 வினாடிகளில் எத்தனை கணக்குகளுக்கு சரியான விடை அளிக்க முடிகிறது என்று பாருங்கள்!'
                  : 'Solve as many arithmetic challenges as you can within 60 seconds with combo multiplier!'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">High Score</span>
                <span className="font-mono font-black text-slate-800 text-sm">{mathHighScore} pts</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[9px] text-amber-700 font-bold uppercase block">Combo Flame</span>
                <span className="font-mono font-black text-amber-900 text-sm">{mathCombo}x 🔥</span>
              </div>
            </div>
          </div>

          {!mathPlaying ? (
            <div className="p-10 text-center bg-gradient-to-b from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-200 space-y-5">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
                ⚡
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  {language === 'ta' ? '60 வினாடி நேரடி சவால்' : 'Ready for 60-Second Math Rush?'}
                </h4>
                <p className="text-xs text-slate-600">
                  {language === 'ta'
                    ? 'கூட்டல், கழித்தல் மற்றும் பெருக்கல் வினாக்கள் வரும். தவறில்லாமல் விரைவாக விடையளித்தால் காம்போ புள்ளிகள் கூடும்!'
                    : 'Rapid questions: + , - , and ×. Maintain answer streaks without errors for 2x and 3x combo bonuses.'}
                </p>
              </div>
              <button
                onClick={startMathGame}
                className="px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-black text-sm shadow-md active:scale-95 transition flex items-center gap-2 mx-auto"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{language === 'ta' ? 'விளையாட்டைத் தொடங்கு (Start Game)' : 'Start Speed Math Game'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Game Status Bar */}
              <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-inner font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-lg font-black text-amber-300">{mathTimer}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-blue-400" />
                  <span className="text-lg font-black text-white">{mathScore} pts</span>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${mathCombo > 2 ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                    {mathCombo > 0 ? `${mathCombo}x COMBO` : '1x'}
                  </span>
                </div>
              </div>

              {/* Math Question Arena */}
              <div
                className={`p-6 sm:p-8 text-center rounded-2xl border-2 transition-all ${
                  mathFeedback === 'correct'
                    ? 'bg-emerald-50 border-emerald-400 scale-[1.02]'
                    : mathFeedback === 'wrong'
                    ? 'bg-rose-50 border-rose-400 scale-[0.98]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs mb-4 bg-white border border-slate-200 text-slate-800">
                  <span>{GRADE_TIERS_META[selectedGradeTier].icon}</span>
                  <span>{GRADE_TIERS_META[selectedGradeTier].nameTa}</span>
                </div>

                <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-wider font-mono">
                  {mathQuestion.displayText || `${mathQuestion.num1} ${mathQuestion.op} ${mathQuestion.num2} = ?`}
                </div>

                {/* 4 Rapid Answer Choice Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 max-w-md mx-auto">
                  {mathQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => submitNumericAnswer(opt)}
                      className="py-3 px-4 rounded-xl bg-white hover:bg-blue-600 hover:text-white border-2 border-slate-300 hover:border-blue-600 font-mono font-black text-xl text-slate-900 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span>— அல்லது விடையை தட்டச்சு செய்யலாம் —</span>
                </div>

                <form onSubmit={handleMathSubmit} className="mt-3 max-w-xs mx-auto flex gap-2">
                  <input
                    type="number"
                    autoFocus
                    placeholder="விடை..."
                    value={mathInput}
                    onChange={(e) => setMathInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-300 text-center font-mono font-black text-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition text-xs"
                  >
                    சரிபார்
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 4: FOCUS STUDY ROOM & POMODORO STUDY CAM                         */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'focus' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                🎧 Study Cam & Focus Lounge
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {language === 'ta' ? 'கவனக் குவிப்பு படிப்பு அறை (Focus Study Room)' : 'Focus Study Room & Pomodoro Cam'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ta'
                  ? '25-நிமிட அறிவியல் பூர்வ பொமோடோரோ டைமர் மற்றும் கவனச்சிதறல் இல்லாத பின்னணி லோ-ஃபை படிப்பு இசை.'
                  : '25-minute Pomodoro focus cycles with synthesized ambient Lo-Fi study beats & daily goals.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-emerald-600" />
                <span>Today Focused: {totalFocusedMinutes}m</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Animated Study Cam & Timer */}
            <div className="md:col-span-7 space-y-6">
              {/* Virtual Desk Atmosphere */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-8 text-center text-white border border-slate-800 shadow-md">
                {/* Virtual Desk SVG / Animated Ambiance */}
                <div className="flex justify-center items-center gap-6 mb-4">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-xs">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Open Notebook</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-xs animate-pulse">
                    <Coffee className="w-4 h-4 text-emerald-400" />
                    <span>Warm Tea ☕</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-xs">
                    <Headphones className="w-4 h-4 text-blue-400" />
                    <span>Lo-Fi Beats</span>
                  </div>
                </div>

                {/* Pomodoro Timer Digits */}
                <div className="my-6">
                  <div className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-white drop-shadow-md">
                    {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
                  </div>
                  <span className="text-xs uppercase font-bold text-emerald-400 tracking-widest mt-2 block">
                    {focusMode === 'study' ? 'Deep Focus Session (25 min)' : 'Rest & Recharge Break'}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={toggleFocusTimer}
                    className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md active:scale-95 ${
                      isFocusActive
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                    }`}
                  >
                    {isFocusActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isFocusActive ? 'Pause Session' : 'Start Focus (25m)'}</span>
                  </button>
                  <button
                    onClick={() => resetFocusTimer(focusMode)}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Mode Selectors */}
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => resetFocusTimer('study')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      focusMode === 'study' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    25m Focus
                  </button>
                  <button
                    onClick={() => resetFocusTimer('shortBreak')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      focusMode === 'shortBreak' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    5m Short Break
                  </button>
                  <button
                    onClick={() => resetFocusTimer('longBreak')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      focusMode === 'longBreak' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    15m Long Break
                  </button>
                </div>
              </div>

              {/* Lo-Fi Ambient Sounds Selector */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Headphones className="w-4 h-4 text-indigo-600" />
                    <span>Lo-Fi Ambient Study Sound</span>
                  </span>
                  {ambientSound !== 'none' && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Playing ♫
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleAmbientChange('none')}
                    className={`p-2 rounded-xl text-xs font-semibold border transition ${
                      ambientSound === 'none'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Mute 🔇
                  </button>
                  <button
                    onClick={() => handleAmbientChange('lofi')}
                    className={`p-2 rounded-xl text-xs font-semibold border transition ${
                      ambientSound === 'lofi'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Lo-Fi 🎶
                  </button>
                  <button
                    onClick={() => handleAmbientChange('rain')}
                    className={`p-2 rounded-xl text-xs font-semibold border transition ${
                      ambientSound === 'rain'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rain 🌧️
                  </button>
                  <button
                    onClick={() => handleAmbientChange('waves')}
                    className={`p-2 rounded-xl text-xs font-semibold border transition ${
                      ambientSound === 'waves'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Waves 🌊
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Focus Goals Checklist */}
            <div className="md:col-span-5 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ta' ? 'இன்றைய படிப்பு இலக்குகள்' : 'Today\'s Study Goals'}</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  {focusTasks.filter((t) => t.done).length} / {focusTasks.length} Done
                </span>
              </div>

              {/* Task list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {focusTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      task.done
                        ? 'bg-emerald-50/80 border-emerald-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate pr-2">{task.text}</span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        task.done
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {task.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add task form */}
              <form onSubmit={addTask} className="flex gap-2 pt-2 border-t border-slate-200/80">
                <input
                  type="text"
                  placeholder={language === 'ta' ? 'புதிய இலக்கு சேர்க்க...' : 'Add study goal...'}
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                💡 <b>Study Habit Tip:</b> 25 நிமிடங்கள் படித்து முடித்தவுடன் தானாக +20 புள்ளிகள் உங்கள் கணக்கில் வரவு வைக்கப்படும்!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
