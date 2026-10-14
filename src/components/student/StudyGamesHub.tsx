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

export const StudyGamesHub: React.FC<StudyGamesHubProps> = ({ initialTab = 'spin', onNavigate }) => {
  const { currentStudent, currentAuthUser, adjustStudentPoints, language } = useApp();
  const [activeTab, setActiveTab] = useState<StudyGameTab>(initialTab);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const studentUid = currentAuthUser?.uid || currentStudent?.id || 'guest';
  const todayKey = new Date().toISOString().slice(0, 10);

  // ----------------------------------------------------
  // 1. LUCKY SPIN WHEEL STATE
  // ----------------------------------------------------
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelSector | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [spinToast, setSpinToast] = useState<string | null>(null);

  useEffect(() => {
    const lastSpinDate = localStorage.getItem(`hnc_spin_date_${studentUid}`);
    if (lastSpinDate === todayKey) {
      setHasSpunToday(true);
    }
  }, [studentUid, todayKey]);

  const handleSpinWheel = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWonPrize(null);

    // Pick random sector
    const sectorCount = WHEEL_SECTORS.length;
    const chosenIndex = Math.floor(Math.random() * sectorCount);
    const sectorAngle = 360 / sectorCount;

    // 5 to 7 full rotations plus offset to center chosen sector under top indicator (270 deg)
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetOffset = 360 - (chosenIndex * sectorAngle + sectorAngle / 2);
    const finalRotation = wheelRotation + extraRotations + targetOffset;

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

    setTimeout(async () => {
      setIsSpinning(false);
      const sector = WHEEL_SECTORS[chosenIndex];
      setWonPrize(sector);
      localStorage.setItem(`hnc_spin_date_${studentUid}`, todayKey);
      setHasSpunToday(true);

      if (soundEnabled) {
        audio.playWin();
      }

      confetti({
        particleCount: sector.isJackpot ? 120 : 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Credit student points
      if (adjustStudentPoints && studentUid) {
        try {
          await adjustStudentPoints(
            studentUid,
            sector.points,
            `Daily Lucky Spin Reward: ${sector.label} (${todayKey})`
          );
          setSpinToast(
            language === 'ta'
              ? `வெற்றி! +${sector.points} புள்ளிகள் உங்கள் கணக்கில் சேர்க்கப்பட்டது!`
              : `Awesome! +${sector.points} points credited to your profile!`
          );
          setTimeout(() => setSpinToast(null), 5000);
        } catch {
          // Point fallback
        }
      }
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

  const DAILY_QUESTIONS = [
    {
      id: 'q1',
      questionTa: 'ஒரு மட்டையும் பந்தும் சேர்த்து $1.10. மட்டையின் விலை பந்தை விட $1.00 அதிகம் என்றால், பந்தின் விலை எவ்வளவு?',
      questionEn: 'A bat and ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?',
      options: ['$0.10', '$0.05', '$0.15', '$0.01'],
      correctIndex: 1, // $0.05
      explanation: 'Ball = $0.05, Bat = $1.05. Total = $1.10!',
    },
    {
      id: 'q2',
      questionTa: 'தொடரில் அடுத்த எண் என்ன: 2, 6, 12, 20, 30, ?',
      questionEn: 'What is the next number in the pattern: 2, 6, 12, 20, 30, ?',
      options: ['40', '42', '36', '48'],
      correctIndex: 1, // 42 (+4, +6, +8, +10, +12)
      explanation: 'Differences increase by 2: +4, +6, +8, +10, +12 -> 30 + 12 = 42!',
    },
    {
      id: 'q3',
      questionTa: 'சூரிய ஒளி பூமியை வந்தடைய சராசரியாக எத்தனை நிமிடங்கள் ஆகிறது?',
      questionEn: 'Approximately how many minutes does sunlight take to reach Earth?',
      options: ['3 நிமிடங்கள் (min)', '8 நிமிடங்கள் (min)', '12 நிமிடங்கள் (min)', 'உடனடியாக (0s)'],
      correctIndex: 1, // ~8 minutes 20 seconds
      explanation: 'Sunlight travels ~150M km at the speed of light, taking approx 8 minutes and 20 seconds!',
    },
  ];

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
    const isCorrect = selectedIdx === DAILY_QUESTIONS[currentQuestionIndex].correctIndex;
    if (soundEnabled) {
      if (isCorrect) audio.playCorrect();
      else audio.playIncorrect();
    }

    const updated = [...workoutAnswers, selectedIdx];
    setWorkoutAnswers(updated);

    if (currentQuestionIndex + 1 < DAILY_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate score
      let score = 0;
      DAILY_QUESTIONS.forEach((q, idx) => {
        if (updated[idx] === q.correctIndex) score++;
      });
      setWorkoutScore(score);
      setWorkoutCompleted(true);
      setWorkoutStarted(false);

      if (score === DAILY_QUESTIONS.length) {
        confetti({ particleCount: 80, spread: 60 });
        if (adjustStudentPoints && studentUid) {
          adjustStudentPoints(studentUid, 30, 'Daily 1-Minute Brain Workout: 100% Correct!');
        }
      } else if (score > 0) {
        if (adjustStudentPoints && studentUid) {
          adjustStudentPoints(studentUid, score * 10, 'Daily Brain Workout Participation');
        }
      }
    }
  };

  const handleFinishWorkout = () => {
    setWorkoutCompleted(true);
    setWorkoutStarted(false);
  };

  // ----------------------------------------------------
  // 3. SPEED MATH RUSH STATE
  // ----------------------------------------------------
  const [mathPlaying, setMathPlaying] = useState(false);
  const [mathTimer, setMathTimer] = useState(60);
  const [mathScore, setMathScore] = useState(0);
  const [mathCombo, setMathCombo] = useState(0);
  const [mathQuestion, setMathQuestion] = useState<{ num1: number; num2: number; op: string; answer: number }>({
    num1: 7,
    num2: 8,
    op: '×',
    answer: 56,
  });
  const [mathInput, setMathInput] = useState('');
  const [mathHighScore, setMathHighScore] = useState(() => {
    return parseInt(localStorage.getItem(`hnc_math_high_${studentUid}`) || '0', 10);
  });
  const [mathFeedback, setMathFeedback] = useState<'correct' | 'wrong' | null>(null);

  const generateMathQuestion = () => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1 = 0;
    let num2 = 0;
    let answer = 0;

    if (op === '+') {
      num1 = Math.floor(Math.random() * 40) + 10;
      num2 = Math.floor(Math.random() * 40) + 10;
      answer = num1 + num2;
    } else if (op === '-') {
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * (num1 - 5)) + 5;
      answer = num1 - num2;
    } else {
      num1 = Math.floor(Math.random() * 12) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      answer = num1 * num2;
    }

    setMathQuestion({ num1, num2, op, answer });
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
    generateMathQuestion();
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
      adjustStudentPoints(studentUid, earned, `Speed Math Rush Score: ${mathScore}`);
    }
  };

  const handleMathSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mathPlaying) return;

    const val = parseInt(mathInput.trim(), 10);
    if (isNaN(val)) return;

    if (val === mathQuestion.answer) {
      const newCombo = mathCombo + 1;
      const pointsAdded = 10 + Math.min(newCombo * 2, 20);
      setMathScore((prev) => prev + pointsAdded);
      setMathCombo(newCombo);
      setMathFeedback('correct');
      if (soundEnabled) audio.playCorrect();
      setTimeout(() => setMathFeedback(null), 300);
      generateMathQuestion();
    } else {
      setMathCombo(0);
      setMathFeedback('wrong');
      if (soundEnabled) audio.playIncorrect();
      setTimeout(() => setMathFeedback(null), 300);
      setMathInput('');
    }
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

        <div className="flex items-center gap-2 self-start sm:self-center">
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
                <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-b from-slate-900 to-slate-800 text-white font-black text-xs flex flex-col items-center justify-center shadow-lg border-2 border-amber-300 z-10 pointer-events-none">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>SPIN</span>
                </div>
              </div>

              {spinToast && (
                <div className="mt-4 px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl shadow-xs">
                  {spinToast}
                </div>
              )}
            </div>

            {/* Spin Controls & Rules */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                  {language === 'ta' ? 'தினசரி இலவச வாய்ப்பு' : 'Daily Free Spin'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {language === 'ta' ? 'அதிர்ஷ்ட சுழல் சக்கரம் (Lucky Wheel)' : 'Daily Knowledge Wheel'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {language === 'ta'
                    ? 'மாணவர்கள் தினமும் வெப்சைட்டைத் திறந்ததும் ஒருமுறை இலவசமாகச் சுழற்றி +10 முதல் +50 புள்ளிகள் மற்றும் போனஸ் பரிசுகளை வெல்லலாம்!'
                    : 'Spin the wheel every day to unlock study points, bonuses, and special candidate rewards credited straight to your profile.'}
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
                  disabled={isSpinning}
                  onClick={handleSpinWheel}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm transition-all transform flex items-center justify-center gap-2 shadow-md ${
                    isSpinning
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : !hasSpunToday
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 active:scale-[0.98]'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {isSpinning
                      ? language === 'ta'
                        ? 'சுழல்கிறது...'
                        : 'Spinning...'
                      : !hasSpunToday
                      ? language === 'ta'
                        ? 'இன்றைய இலவச ஸ்பின்னை சுழற்று (Spin Now!)'
                        : 'Claim Free Daily Spin (Spin Now!)'
                      : language === 'ta'
                        ? 'பயிற்சி சுழற்சி (Practice Spin)'
                        : 'Practice Spin (Already Claimed Today)'}
                  </span>
                </button>
                {hasSpunToday && (
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    ✓ {language === 'ta' ? 'இன்றைய நாளுக்கான பரிசு பெறப்பட்டுவிட்டது. நாளை மீண்டும் இலவச ஸ்பின் கிடைக்கும்!' : 'Today\'s reward claimed! Next free official spin unlocks tomorrow.'}
                  </p>
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
                  <span>Question {currentQuestionIndex + 1} of {DAILY_QUESTIONS.length}</span>
                  <span className="font-bold text-blue-700">60s Sprint</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'ta'
                      ? DAILY_QUESTIONS[currentQuestionIndex].questionTa
                      : DAILY_QUESTIONS[currentQuestionIndex].questionEn}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {DAILY_QUESTIONS[currentQuestionIndex].options.map((opt, oIdx) => (
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
                      ? `நீங்கள் ${DAILY_QUESTIONS.length}-ல் ${workoutScore} கேள்விகளுக்கு சரியான விடை அளித்துள்ளீர்கள்!`
                      : `You scored ${workoutScore} out of ${DAILY_QUESTIONS.length} correct!`}
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
                className={`p-8 text-center rounded-2xl border-2 transition-all ${
                  mathFeedback === 'correct'
                    ? 'bg-emerald-50 border-emerald-400 scale-[1.02]'
                    : mathFeedback === 'wrong'
                    ? 'bg-rose-50 border-rose-400 scale-[0.98]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-wider font-mono">
                  {mathQuestion.num1} {mathQuestion.op} {mathQuestion.num2} = ?
                </div>

                <form onSubmit={handleMathSubmit} className="mt-6 max-w-xs mx-auto flex gap-2">
                  <input
                    type="number"
                    autoFocus
                    placeholder="Answer..."
                    value={mathInput}
                    onChange={(e) => setMathInput(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-300 text-center font-mono font-black text-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition"
                  >
                    Submit
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
