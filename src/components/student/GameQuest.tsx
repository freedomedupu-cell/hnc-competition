import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SRI_LANKA_25_DISTRICTS,
  PROVINCES_OF_SRI_LANKA,
  DISTRICT_QUEST_STORAGE_KEY,
} from '../../data/sriLankaDistricts';
import {
  Trophy,
  Zap,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Shield,
  Star,
  Award,
  Volume2,
  VolumeX,
  Compass,
  MapPin,
  Flame,
  Check,
  X,
  ChevronRight,
  Filter,
  Globe,
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  options: {
    shape: 'triangle' | 'square' | 'circle' | 'diamond';
    symbol: string;
    text: string;
    color: string;
    hoverColor: string;
    borderColor: string;
  }[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

interface DistrictLevel {
  id: number;
  districtKey: string;
  district: string;
  districtEn: string;
  province: string;
  provinceEn: string;
  name: string;
  gradeSubject: string;
  locked: boolean;
  isPublished: boolean;
  status: 'Completed' | 'In Progress' | 'Locked';
  points: number;
  iconName: string;
  bgGradient: string;
  accentColor: string;
  description: string;
  questions: Question[];
}

const defaultGradients = [
  'from-amber-500 to-yellow-600',
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-purple-600 to-indigo-800',
  'from-teal-600 to-cyan-700',
  'from-orange-500 to-rose-600',
  'from-rose-600 to-pink-700',
  'from-indigo-600 to-blue-700',
  'from-cyan-600 to-blue-700',
  'from-lime-600 to-emerald-700',
];

// Generate 25 default district levels
const buildInitial25Levels = (): DistrictLevel[] => {
  return SRI_LANKA_25_DISTRICTS.map((d, index) => ({
    id: d.levelNumber,
    districtKey: d.id,
    district: d.nameTa,
    districtEn: d.nameEn,
    province: d.provinceTa,
    provinceEn: d.provinceEn,
    name: `${d.nameTa} (${d.gradeSubject})`,
    gradeSubject: d.gradeSubject,
    locked: d.levelNumber > 1,
    isPublished: true,
    status: d.levelNumber === 1 ? 'In Progress' : 'Locked',
    points: d.defaultPoints,
    iconName: d.icon,
    bgGradient: defaultGradients[index % defaultGradients.length],
    accentColor: 'blue',
    description: d.descriptionTa,
    questions: d.initialQuestions,
  }));
};

// Built-in Web Audio API sound synthesizer
const playChime = (type: 'correct' | 'wrong' | 'victory' | 'click' | 'powerup') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'correct') {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else if (type === 'wrong') {
      const now = ctx.currentTime;
      [220, 196].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.12, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.2);
      });
    } else if (type === 'victory') {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.15, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
      });
    } else if (type === 'powerup') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {}
};

const STUDENT_PROGRESS_STORAGE_KEY = 'hnc_edu_arena_student_progress_v2';

export const GameQuest: React.FC = () => {
  const { currentAuthUser, currentStudent, language } = useApp();

  // Load 25 district levels dynamically merged with admin updates and student completion progress
  const [levels, setLevels] = useState<DistrictLevel[]>(() => {
    const baseLevels = buildInitial25Levels();
    try {
      // 1. Check if Admin/SuperAdmin customized questions or published status in Studio
      const adminStudioData = localStorage.getItem(DISTRICT_QUEST_STORAGE_KEY);
      let merged = [...baseLevels];
      if (adminStudioData) {
        const parsedAdmin = JSON.parse(adminStudioData);
        merged = merged.map((lvl) => {
          const match = parsedAdmin.find((p: any) => p.id === lvl.districtKey);
          if (match) {
            return {
              ...lvl,
              isPublished: match.isPublished ?? true,
              gradeSubject: match.gradeSubject || lvl.gradeSubject,
              points: match.defaultPoints || lvl.points,
              questions: match.initialQuestions || lvl.questions,
            };
          }
          return lvl;
        });
      }

      // 2. Check student's own unlocked levels and scores
      const studentProgressData = localStorage.getItem(STUDENT_PROGRESS_STORAGE_KEY);
      if (studentProgressData) {
        const parsedStudent = JSON.parse(studentProgressData);
        merged = merged.map((lvl) => {
          const match = parsedStudent.find((p: any) => p.id === lvl.id);
          if (match) {
            return {
              ...lvl,
              locked: match.locked,
              status: match.status,
              points: Math.max(lvl.points, match.points || 0),
            };
          }
          return lvl;
        });
      }

      return merged;
    } catch {}

    return baseLevels;
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedProvinceTab, setSelectedProvinceTab] = useState<string>('all');

  // Active game play session state
  const [selectedLevel, setSelectedLevel] = useState<DistrictLevel | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(false);

  // Lifelines
  const [powerUp5050Used, setPowerUp5050Used] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [extraTimeUsed, setExtraTimeUsed] = useState(false);
  const [hintActive, setHintActive] = useState(false);

  // Answer feedback
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);

  // Level completion modal
  const [showLevelSummary, setShowLevelSummary] = useState(false);
  const [completedLevelData, setCompletedLevelData] = useState<{
    level: DistrictLevel;
    earnedXp: number;
    accuracy: number;
    unlockedNext: boolean;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save student progress to localStorage
  useEffect(() => {
    try {
      const studentProgress = levels.map((l) => ({
        id: l.id,
        locked: l.locked,
        status: l.status,
        points: l.points,
      }));
      localStorage.setItem(STUDENT_PROGRESS_STORAGE_KEY, JSON.stringify(studentProgress));
    } catch {}
  }, [levels]);

  // Audio helper
  const triggerSound = (type: 'correct' | 'wrong' | 'victory' | 'click' | 'powerup') => {
    if (soundEnabled) {
      playChime(type);
    }
  };

  // Start Level Game
  const handleStartLevel = (level: DistrictLevel) => {
    if (level.locked || !level.isPublished) return;
    triggerSound('click');
    setSelectedLevel(level);
    setCurrentQuestionIndex(0);
    setTimeLeft(20);
    setTimerActive(true);
    setPowerUp5050Used(false);
    setHiddenOptions([]);
    setExtraTimeUsed(false);
    setHintActive(false);
    setSelectedOptionIndex(null);
    setIsAnswerRevealed(false);
    setStreakCount(0);
    setSessionScore(0);
    setShowLevelSummary(false);
  };

  // Timer Tick
  useEffect(() => {
    if (!timerActive || isAnswerRevealed || !selectedLevel) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, isAnswerRevealed, selectedLevel, currentQuestionIndex]);

  // Handle timeout
  const handleTimeExpired = () => {
    if (isAnswerRevealed) return;
    triggerSound('wrong');
    setIsAnswerRevealed(true);
    setSelectedOptionIndex(-1);
    setStreakCount(0);
  };

  // 50-50 Power-Up
  const handleUse5050 = () => {
    if (powerUp5050Used || isAnswerRevealed || !selectedLevel) return;
    triggerSound('powerup');
    setPowerUp5050Used(true);

    const q = selectedLevel.questions[currentQuestionIndex];
    const incorrectIndices = [0, 1, 2, 3].filter((i) => i !== q.correctIndex);
    const toHide = incorrectIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
    setHiddenOptions(toHide);
  };

  // Extra +15s Time Power-Up
  const handleUseExtraTime = () => {
    if (extraTimeUsed || isAnswerRevealed) return;
    triggerSound('powerup');
    setExtraTimeUsed(true);
    setTimeLeft((prev) => prev + 15);
  };

  // Toggle Hint
  const handleToggleHint = () => {
    if (isAnswerRevealed) return;
    triggerSound('powerup');
    setHintActive(!hintActive);
  };

  // Answer selected
  const handleSelectAnswer = (optionIdx: number) => {
    if (isAnswerRevealed || !selectedLevel) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOptionIndex(optionIdx);
    setIsAnswerRevealed(true);

    const q = selectedLevel.questions[currentQuestionIndex];
    const isCorrect = optionIdx === q.correctIndex;

    if (isCorrect) {
      triggerSound('correct');
      const timeBonus = Math.floor(timeLeft * 2);
      const streakBonus = streakCount * 15;
      const basePoints = 50;
      const totalEarned = basePoints + timeBonus + streakBonus;
      setSessionScore((prev) => prev + totalEarned);
      setStreakCount((prev) => prev + 1);
    } else {
      triggerSound('wrong');
      setStreakCount(0);
    }
  };

  // Next Question or Finish Level
  const handleNextQuestion = () => {
    if (!selectedLevel) return;
    triggerSound('click');

    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < selectedLevel.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setTimeLeft(20);
      setTimerActive(true);
      setHiddenOptions([]);
      setHintActive(false);
      setSelectedOptionIndex(null);
      setIsAnswerRevealed(false);
    } else {
      handleFinishLevel();
    }
  };

  // Finish Level & Unlock next
  const handleFinishLevel = () => {
    if (!selectedLevel) return;
    triggerSound('victory');

    const totalQuestions = selectedLevel.questions.length;
    const earnedXp = sessionScore + 100;
    const accuracy = Math.round((sessionScore / (totalQuestions * 90)) * 100);

    const currentId = selectedLevel.id;
    let unlockedNext = false;

    setLevels((prev) => {
      return prev.map((lvl) => {
        if (lvl.id === currentId) {
          return {
            ...lvl,
            status: 'Completed',
            points: Math.max(lvl.points, earnedXp),
          };
        }
        if (lvl.id === currentId + 1 && lvl.locked) {
          unlockedNext = true;
          return {
            ...lvl,
            locked: false,
            status: 'In Progress',
          };
        }
        return lvl;
      });
    });

    setCompletedLevelData({
      level: selectedLevel,
      earnedXp,
      accuracy: Math.min(100, Math.max(35, accuracy)),
      unlockedNext,
    });
    setShowLevelSummary(true);
    setSelectedLevel(null);
  };

  // Reset Quest Progress
  const handleResetProgress = () => {
    if (window.confirm('நீங்கள் தீவுப் பயண நிலைகளை மீண்டும் தொடக்க விரும்புகிறீர்களா? (Reset all 25 levels progress?)')) {
      localStorage.removeItem(STUDENT_PROGRESS_STORAGE_KEY);
      setLevels(buildInitial25Levels());
    }
  };

  // Aggregated Stats
  const totalXp = levels.reduce((acc, l) => acc + (l.points || 0), 0);
  const completedCount = levels.filter((l) => l.status === 'Completed').length;
  const currentLevelQ = selectedLevel?.questions[currentQuestionIndex];

  // Filtered by province
  const displayedLevels = levels.filter((l) => {
    if (selectedProvinceTab === 'all') return true;
    const prov = PROVINCES_OF_SRI_LANKA.find((p) => p.id === selectedProvinceTab);
    return prov ? prov.districts.includes(l.districtKey) : true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Quest Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-12 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HNC Edu-Arena • 25 Districts All-Island Quest</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>🎯 HNC Edu-Arena: தீவுப் பயணம் (25 மாவட்டங்கள்)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              இலங்கையின் 9 மாகாணங்களில் உள்ள 25 மாவட்டங்களையும் கடந்து உங்கள் கல்விச் சிகரத்தை அடையுங்கள்! வரலாறு, புவியியல், தமிழ், விஞ்ஞானம் மற்றும் கணிதப் புதிர்களை விடுவித்து நிலைகளை வெல்லுங்கள்!
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 px-4 border border-white/15 text-center min-w-[110px]">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-0.5">
                <Trophy className="w-4 h-4" />
                <span className="text-xs uppercase font-bold tracking-wider">ஈட்டிய XP</span>
              </div>
              <div className="text-2xl font-black text-white">{totalXp}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 px-4 border border-white/15 text-center min-w-[110px]">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-0.5">
                <Shield className="w-4 h-4" />
                <span className="text-xs uppercase font-bold tracking-wider">வென்ற மாவட்டங்கள்</span>
              </div>
              <div className="text-2xl font-black text-white">
                {completedCount} <span className="text-xs font-normal text-slate-400">/ 25</span>
              </div>
            </div>

            {/* Sound toggle & reset */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition text-xs font-medium cursor-pointer"
                title={soundEnabled ? 'ஒலியை முடக்கு (Mute)' : 'ஒலியை இயக்கு (Unmute)'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
              <button
                type="button"
                onClick={handleResetProgress}
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-white transition text-xs cursor-pointer"
                title="நிலைகளை மீட்டமை (Reset Progress)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar through the Island */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="font-semibold text-white">அனைத்திலங்கை தீவுப் பயண முன்னேற்றம்:</span>
            <span>{Math.round((completedCount / levels.length) * 100)}% நிறைவுற்றது ({completedCount} / 25 மாவட்டங்கள்)</span>
          </div>
          <div className="w-full sm:w-64 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / levels.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 9 Provinces Navigation Bar Tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setSelectedProvinceTab('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            selectedProvinceTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          அனைத்து 25 மாவட்டங்களும்
        </button>

        {PROVINCES_OF_SRI_LANKA.map((prov) => (
          <button
            key={prov.id}
            type="button"
            onClick={() => setSelectedProvinceTab(prov.id)}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              selectedProvinceTab === prov.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {prov.nameTa}
          </button>
        ))}
      </div>

      {/* Levels Grid Map Cards (All 25 Districts) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>இலங்கையின் 25 மாவட்டப் போர்க்களங்கள்</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            காண்பிக்கப்படுவது: {displayedLevels.length} மாவட்டங்கள்
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedLevels.map((level) => {
            const isCompleted = level.status === 'Completed';

            return (
              <div
                key={level.id}
                onClick={() => level.isPublished && !level.locked && handleStartLevel(level)}
                className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  !level.isPublished
                    ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                    : level.locked
                    ? 'bg-slate-100/80 border-slate-200 opacity-70 cursor-not-allowed'
                    : isCompleted
                    ? 'bg-gradient-to-b from-white to-emerald-50/30 border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-300 cursor-pointer'
                    : 'bg-white border-blue-200 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 cursor-pointer ring-1 ring-blue-500/20'
                }`}
              >
                {/* Level Card Header with District Badge */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-slate-100 group-hover:scale-110 transition-transform">
                        {level.iconName}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              !level.isPublished
                                ? 'bg-amber-100 text-amber-800'
                                : level.locked
                                ? 'bg-slate-200 text-slate-600'
                                : isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            Level {level.id}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{level.province}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
                          {level.district}{' '}
                          <span className="text-xs font-normal text-slate-400">({level.districtEn})</span>
                        </h3>
                      </div>
                    </div>

                    <div>
                      {!level.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                          <span>வரைவு (Draft)</span>
                        </span>
                      ) : level.locked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>வெற்றி</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm group-hover:shadow">
                          <span>⚔️ Play</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                    {level.description}
                  </p>
                </div>

                {/* Card Footer / Points & Subject */}
                <div className="p-4 px-5 pt-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium text-slate-700 truncate max-w-[170px]">
                    {level.gradeSubject}
                  </span>

                  {level.isPublished && !level.locked ? (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>{level.points} XP</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {!level.isPublished ? 'விரைவில் வெளியாகும்' : 'முந்தைய நிலையை வெல்லவும்'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE GAME MODAL (Kahoot-style Interface) */}
      {selectedLevel && currentLevelQ && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 relative shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                triggerSound('click');
                setSelectedLevel(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="வெளியேறு (Close)"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Game Header */}
            <div className="pr-8 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                <span>{selectedLevel.name}</span>
                <span>•</span>
                <span>கேள்வி {currentQuestionIndex + 1} / {selectedLevel.questions.length}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {selectedLevel.district} போர்க்களம் ⚔️
              </h2>
            </div>

            {/* Kahoot-Style Controls & Timer Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Timer Badge */}
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-sm transition-colors ${
                    timeLeft <= 5
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                      : timeLeft <= 10
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>டைமர்: {timeLeft} வினாடிகள்</span>
                </div>

                {/* Score & Streak */}
                <div className="flex items-center gap-2.5">
                  {streakCount > 1 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 font-black text-xs border border-orange-200 animate-bounce">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      <span>{streakCount}x Streak!</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>{sessionScore} XP</span>
                  </span>
                </div>
              </div>

              {/* Progress bar for time */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${(timeLeft / 20) * 100}%` }}
                />
              </div>

              {/* Power-up Lifelines */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 font-medium">பவர்-அப்கள் (Power-ups):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUse5050}
                    disabled={powerUp5050Used || isAnswerRevealed}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition ${
                      powerUp5050Used
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 cursor-pointer shadow-sm'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-600" />
                    <span>⚡ 50-50</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUseExtraTime}
                    disabled={extraTimeUsed || isAnswerRevealed}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition ${
                      extraTimeUsed
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300 cursor-pointer shadow-sm'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>⏱️ +15s Time</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleHint}
                    disabled={isAnswerRevealed}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition ${
                      hintActive
                        ? 'bg-purple-200 text-purple-900 border-purple-400'
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300 cursor-pointer shadow-sm'
                    }`}
                  >
                    <HelpCircle className="w-3 h-3 text-purple-600" />
                    <span>💡 Hint</span>
                  </button>
                </div>
              </div>

              {/* Hint Box (if triggered) */}
              {hintActive && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">குறிப்பு (Hint): </span>
                    <span>{currentLevelQ.hint}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Question Card Box */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white rounded-2xl mb-5 shadow-inner">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 block mb-1.5">
                வினா #{currentQuestionIndex + 1}:
              </span>
              <p className="text-base sm:text-lg font-bold leading-relaxed">
                {currentLevelQ.questionText}
              </p>
            </div>

            {/* Kahoot-Style Answers Grid Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
              {currentLevelQ.options.map((opt, idx) => {
                const isHidden = hiddenOptions.includes(idx);
                const isCorrect = idx === currentLevelQ.correctIndex;
                const isSelected = selectedOptionIndex === idx;

                if (isHidden) {
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 opacity-40 text-center text-xs text-slate-400 font-semibold flex items-center justify-center min-h-[64px]"
                    >
                      🚫 50-50 நீக்கப்பட்டது
                    </div>
                  );
                }

                let btnStyles = `${opt.color} ${opt.hoverColor} text-white shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]`;

                if (isAnswerRevealed) {
                  if (isCorrect) {
                    btnStyles = 'bg-emerald-600 text-white ring-4 ring-emerald-300 shadow-lg';
                  } else if (isSelected) {
                    btnStyles = 'bg-rose-600 text-white ring-4 ring-rose-300 opacity-90';
                  } else {
                    btnStyles = 'bg-slate-300 text-slate-600 opacity-40';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerRevealed}
                    onClick={() => handleSelectAnswer(idx)}
                    className={`p-4 rounded-2xl font-bold text-left transition-all duration-150 flex items-center justify-between gap-3 text-sm sm:text-base border border-white/20 ${btnStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center text-lg font-black shrink-0">
                        {opt.symbol}
                      </span>
                      <span className="leading-snug">{opt.text}</span>
                    </div>

                    {isAnswerRevealed && (
                      <div className="shrink-0">
                        {isCorrect ? (
                          <div className="w-7 h-7 rounded-full bg-white text-emerald-700 flex items-center justify-center font-black shadow">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-white text-rose-700 flex items-center justify-center font-black shadow">
                            <X className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation & Next Question Button */}
            {isAnswerRevealed && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  {selectedOptionIndex === currentLevelQ.correctIndex ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold text-slate-900 block">
                      {selectedOptionIndex === currentLevelQ.correctIndex
                        ? '🎉 அருமை! சரியான விடை!'
                        : '❌ தவறான பதில்!'}
                    </span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      {currentLevelQ.explanation}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex + 1 < selectedLevel.questions.length
                        ? 'அடுத்த கேள்வி (Next Question)'
                        : 'போர்க்களத்தை நிறைவு செய் (Complete Level)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL SUMMARY / VICTORY MODAL */}
      {showLevelSummary && completedLevelData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center relative shadow-2xl border border-slate-100">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 mb-4 animate-bounce">
              🏆
            </div>

            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-600 block mb-1">
              District Conquered!
            </span>
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {completedLevelData.level.district} வெற்றி பெறப்பட்டது!
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              இலங்கையின் 25 மாவட்டப் போர்க்களத்தில் ஒரு முக்கிய சிகரத்தை வெற்றிகரமாக எட்டிவிட்டீர்கள்!
            </p>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">ஈட்டிய புள்ளிகள் (XP)</span>
                <span className="text-xl font-black text-amber-600">+{completedLevelData.earnedXp} XP</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">துல்லியத்தன்மை (Accuracy)</span>
                <span className="text-xl font-black text-emerald-600">{completedLevelData.accuracy}%</span>
              </div>
            </div>

            {completedLevelData.unlockedNext && (
              <div className="p-3.5 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>அடுத்த மாவட்ட நிலை திறக்கப்பட்டது! (Next District Level Unlocked)</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowLevelSummary(false)}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              தொடர்க (Continue Island Quest)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
