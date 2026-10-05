import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SRI_LANKA_25_DISTRICTS,
  PROVINCES_OF_SRI_LANKA,
  STUDY_GAMING_METHODS,
  StudyGamingMode,
  DISTRICT_QUEST_STORAGE_KEY,
  getGamingMethodById,
  getLocalizedDistrict,
} from '../../data/sriLankaDistricts';
import { DistrictLeaderboardModal } from '../common/DistrictLeaderboardModal';
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
  Crown,
  RotateCw,
  Brain,
  Lightbulb,
  Search,
  Languages,
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  questionTextEn?: string;
  questionTextSi?: string;
  category?: string;
  options: {
    shape: 'triangle' | 'square' | 'circle' | 'diamond';
    symbol: string;
    text: string;
    textEn?: string;
    textSi?: string;
    color: string;
    hoverColor: string;
    borderColor: string;
  }[];
  correctIndex: number;
  hint: string;
  hintEn?: string;
  hintSi?: string;
  explanation: string;
  explanationEn?: string;
  explanationSi?: string;
}

interface DistrictLevel {
  id: number;
  districtKey: string;
  district: string;
  districtEn: string;
  districtSi?: string;
  province: string;
  provinceEn: string;
  provinceSi?: string;
  name: string;
  gradeCategory?: 'primary' | 'junior' | 'senior' | 'advanced' | 'after_school';
  gradeSubject: string;
  gradeSubjectEn?: string;
  gradeSubjectSi?: string;
  locked: boolean;
  isPublished: boolean;
  status: 'Completed' | 'In Progress' | 'Locked';
  points: number;
  iconName: string;
  bgGradient: string;
  accentColor: string;
  description: string;
  descriptionEn?: string;
  descriptionSi?: string;
  gamingMode: StudyGamingMode;
  questionTimerSeconds?: number;
  maxLivesCount?: number;
  passingAccuracyPercent?: number;
  difficultyTier?: 'easy' | 'medium' | 'hard' | 'master';
  enablePowerUps?: boolean;
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

const getGradeCategoryByLevel = (levelNum: number): 'primary' | 'junior' | 'senior' | 'advanced' | 'after_school' => {
  if (levelNum <= 5) return 'primary';
  if (levelNum <= 10) return 'junior';
  if (levelNum <= 16) return 'senior';
  if (levelNum <= 21) return 'advanced';
  return 'after_school';
};

const getDifficultyTierByLevel = (levelNum: number): 'easy' | 'medium' | 'hard' | 'master' => {
  if (levelNum <= 5) return 'easy';
  if (levelNum <= 12) return 'medium';
  if (levelNum <= 19) return 'hard';
  return 'master';
};

// Generate initial 25 levels
const buildInitial25Levels = (): DistrictLevel[] => {
  const modes: StudyGamingMode[] = ['kahoot', 'quizizz', 'trivia_crack', 'brain_out'];
  return SRI_LANKA_25_DISTRICTS.map((d, index) => {
    const lvlNum = d.levelNumber;
    const gCat = getGradeCategoryByLevel(lvlNum);
    const dTier = getDifficultyTierByLevel(lvlNum);

    const timerSecs = dTier === 'easy' ? 30 : dTier === 'medium' ? 20 : dTier === 'hard' ? 15 : 10;
    const lives = dTier === 'easy' ? 5 : dTier === 'medium' ? 4 : dTier === 'hard' ? 3 : 2;
    const passAcc = dTier === 'easy' ? 50 : dTier === 'medium' ? 60 : dTier === 'hard' ? 70 : 80;

    return {
      id: lvlNum,
      districtKey: d.id,
      district: d.nameTa,
      districtEn: d.nameEn,
      districtSi: d.nameSi,
      province: d.provinceTa,
      provinceEn: d.provinceEn,
      provinceSi: d.provinceSi || d.provinceEn,
      name: `${d.nameTa} (${d.gradeSubject})`,
      gradeCategory: gCat,
      gradeSubject: d.gradeSubject,
      gradeSubjectEn: d.gradeSubjectEn,
      gradeSubjectSi: d.gradeSubjectSi || d.gradeSubjectEn,
      locked: lvlNum > 1,
      isPublished: true,
      status: lvlNum === 1 ? 'In Progress' : 'Locked',
      points: d.defaultPoints,
      iconName: d.icon,
      bgGradient: defaultGradients[index % defaultGradients.length],
      accentColor: 'blue',
      description: d.descriptionTa,
      descriptionEn: d.descriptionEn,
      descriptionSi: d.descriptionSi || d.descriptionEn,
      gamingMode: d.defaultGamingMode || modes[index % modes.length],
      questionTimerSeconds: timerSecs,
      maxLivesCount: lives,
      passingAccuracyPercent: passAcc,
      difficultyTier: dTier,
      enablePowerUps: true,
      questions: d.initialQuestions,
    };
  });
};

// Web Audio API sound synthesizer
const playChime = (type: 'correct' | 'wrong' | 'victory' | 'click' | 'powerup' | 'spin' | 'eureka') => {
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
    } else if (type === 'powerup' || type === 'eureka') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'spin') {
      const now = ctx.currentTime;
      for (let j = 0; j < 8; j++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300 + j * 40, now + j * 0.06);
        gain.gain.setValueAtTime(0.05, now + j * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + j * 0.06 + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + j * 0.06);
        osc.stop(now + j * 0.06 + 0.05);
      }
    }
  } catch {}
};

const STUDENT_PROGRESS_STORAGE_KEY = 'hnc_edu_arena_student_progress_v2';

export const GameQuest: React.FC = () => {
  const { currentAuthUser, currentStudent, language: appLanguage, setLanguage: setAppLanguage } = useApp();

  // Trilingual language state: Tamil (ta), English (en), Sinhala (si)
  const [questLang, setQuestLang] = useState<'ta' | 'en' | 'si'>('ta');

  // Load 25 district levels dynamically merged with admin updates and student progress
  const [levels, setLevels] = useState<DistrictLevel[]>(() => {
    const baseLevels = buildInitial25Levels();
    try {
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
              gamingMode: match.gamingMode || lvl.gamingMode,
              gradeSubject: match.gradeSubject || lvl.gradeSubject,
              points: match.defaultPoints || lvl.points,
              questionTimerSeconds: match.questionTimerSeconds || lvl.questionTimerSeconds,
              maxLivesCount: match.maxLivesCount || lvl.maxLivesCount,
              passingAccuracyPercent: match.passingAccuracyPercent || lvl.passingAccuracyPercent,
              difficultyTier: match.difficultyTier || lvl.difficultyTier,
              enablePowerUps: match.enablePowerUps ?? lvl.enablePowerUps,
              questions: match.initialQuestions || lvl.questions,
            };
          }
          return lvl;
        });
      }

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
  const [selectedGamingModeFilter, setSelectedGamingModeFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<
    'all' | 'primary' | 'junior' | 'senior' | 'advanced' | 'after_school'
  >('all');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Active game play session state
  const [selectedLevel, setSelectedLevel] = useState<DistrictLevel | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(false);

  // Lifelines (Quizizz & Kahoot)
  const [powerUp5050Used, setPowerUp5050Used] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [extraTimeUsed, setExtraTimeUsed] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [hintActive, setHintActive] = useState(false);

  // Trivia Crack / QuizUp Specific States
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [selectedCategoryWheel, setSelectedCategoryWheel] = useState<string | null>(null);
  const [conqueredCrowns, setConqueredCrowns] = useState<string[]>([]);

  // Brain Out Specific States
  const [brainIQRating, setBrainIQRating] = useState<number>(100);
  const [clueRevealed, setClueRevealed] = useState<boolean>(false);

  // Answer feedback & 100% Score tracking
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [lastEarnedPoints, setLastEarnedPoints] = useState<number>(0);
  const [isLevelMultiplierActive, setIsLevelMultiplierActive] = useState<boolean>(false);

  // Level completion modal
  const [showLevelSummary, setShowLevelSummary] = useState(false);
  const [completedLevelData, setCompletedLevelData] = useState<{
    level: DistrictLevel;
    earnedXp: number;
    accuracy: number;
    correctCount: number;
    totalQuestions: number;
    isPerfect100: boolean;
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
  const triggerSound = (type: 'correct' | 'wrong' | 'victory' | 'click' | 'powerup' | 'spin' | 'eureka') => {
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
    setTimeLeft(level.questionTimerSeconds || (level.gamingMode === 'kahoot' ? 20 : 30));
    setTimerActive(true);
    setPowerUp5050Used(false);
    setHiddenOptions([]);
    setExtraTimeUsed(false);
    setShieldActive(false);
    setHintActive(false);
    setSelectedOptionIndex(null);
    setIsAnswerRevealed(false);
    setStreakCount(0);
    setSessionScore(0);
    setCorrectAnswersCount(0);
    setLastEarnedPoints(0);
    setIsLevelMultiplierActive(false);
    setShowLevelSummary(false);
    setSelectedCategoryWheel(null);
    setClueRevealed(false);
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

  // Shield Power-Up (Quizizz)
  const handleUseShield = () => {
    if (shieldActive || isAnswerRevealed) return;
    triggerSound('powerup');
    setShieldActive(true);
  };

  // Toggle Hint
  const handleToggleHint = () => {
    if (isAnswerRevealed) return;
    triggerSound('powerup');
    setHintActive(!hintActive);
  };

  // Trivia Crack Wheel Spin Simulation
  const handleSpinTriviaWheel = () => {
    if (isWheelSpinning) return;
    setIsWheelSpinning(true);
    triggerSound('spin');

    const categories = [
      'வரலாறு (History)',
      'புவியியல் (Geography)',
      'விஞ்ஞானம் (Science)',
      'இலக்கியம் (Literature)',
      'கணிதம் (Math)',
      'பொது அறிவு (GK)',
    ];

    setTimeout(() => {
      const chosen = categories[Math.floor(Math.random() * categories.length)];
      setSelectedCategoryWheel(chosen);
      setIsWheelSpinning(false);
      triggerSound('powerup');
    }, 1200);
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
      setCorrectAnswersCount((prev) => prev + 1);
      // Kahoot / HNC Speed Rush speed multiplier bonus
      const speedMultiplier = selectedLevel.gamingMode === 'kahoot' ? (timeLeft > 12 ? 2.5 : timeLeft > 6 ? 1.8 : 1.2) : 1;
      const basePoints = 50;
      const streakBonus = streakCount * 15;

      // Level Multiplier Feature: Students earn 1.5x points for streak-based correct answers, encouraging sustained engagement!
      const isStreakActive = streakCount >= 1;
      const levelMultiplier = isStreakActive ? 1.5 : 1.0;
      const earned = Math.round((basePoints + timeLeft * 2 + streakBonus) * speedMultiplier * levelMultiplier);

      setLastEarnedPoints(earned);
      setIsLevelMultiplierActive(isStreakActive);
      setSessionScore((prev) => prev + earned);
      setStreakCount((prev) => prev + 1);

      if (selectedLevel.gamingMode === 'trivia_crack' && selectedCategoryWheel) {
        setConqueredCrowns((prev) => Array.from(new Set([...prev, selectedCategoryWheel])));
      }

      if (selectedLevel.gamingMode === 'brain_out') {
        setBrainIQRating((prev) => prev + 12);
        triggerSound('eureka');
      }
    } else {
      setLastEarnedPoints(0);
      setIsLevelMultiplierActive(false);
      if (shieldActive) {
        // Protected by shield!
        triggerSound('powerup');
        setShieldActive(false);
      } else {
        triggerSound('wrong');
        setStreakCount(0);
      }
    }
  };

  // Next Question or Finish Level
  const handleNextQuestion = () => {
    if (!selectedLevel) return;
    triggerSound('click');

    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < selectedLevel.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setTimeLeft(selectedLevel.questionTimerSeconds || (selectedLevel.gamingMode === 'kahoot' ? 20 : 30));
      setTimerActive(true);
      setHiddenOptions([]);
      setHintActive(false);
      setSelectedOptionIndex(null);
      setIsAnswerRevealed(false);
      setLastEarnedPoints(0);
      setIsLevelMultiplierActive(false);
      setSelectedCategoryWheel(null);
      setClueRevealed(false);
    } else {
      handleFinishLevel();
    }
  };

  // Finish Level & Unlock next ONLY if 100% perfect score achieved
  const handleFinishLevel = () => {
    if (!selectedLevel) return;

    const totalQuestions = Math.max(1, selectedLevel.questions.length);
    const isPerfect100 = correctAnswersCount >= totalQuestions;
    const accuracy = Math.round((correctAnswersCount / totalQuestions) * 100);
    const earnedXp = sessionScore + (isPerfect100 ? 150 : 30);

    const currentId = selectedLevel.id;
    let unlockedNext = false;

    if (isPerfect100) {
      triggerSound('victory');
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
    } else {
      triggerSound('wrong');
    }

    setCompletedLevelData({
      level: selectedLevel,
      earnedXp,
      accuracy,
      correctCount: correctAnswersCount,
      totalQuestions,
      isPerfect100,
      unlockedNext,
    });
    setShowLevelSummary(true);
    setSelectedLevel(null);
  };

  // Reset Quest Progress
  const handleResetProgress = () => {
    const confirmPrompt =
      questLang === 'ta'
        ? 'நீங்கள் தீவுப் பயண நிலைகளை மீண்டும் தொடக்க விரும்புகிறீர்களா?'
        : questLang === 'si'
        ? 'ඔබට මෙම ප්‍රගතිය නැවත මුල සිට ආරම්භ කිරීමට අවශ්‍යද?'
        : 'Do you want to reset all district progress?';

    if (window.confirm(confirmPrompt)) {
      localStorage.removeItem(STUDENT_PROGRESS_STORAGE_KEY);
      setLevels(buildInitial25Levels());
    }
  };

  // Aggregated Stats
  const totalXp = levels.reduce((acc, l) => acc + (l.points || 0), 0);
  const completedCount = levels.filter((l) => l.status === 'Completed').length;
  const currentLevelQ = selectedLevel?.questions[currentQuestionIndex];

  // Helper for trilingual question text
  const getQuestionPrompt = (q?: Question) => {
    if (!q) return '';
    if (questLang === 'en' && q.questionTextEn) return q.questionTextEn;
    if (questLang === 'si' && q.questionTextSi) return q.questionTextSi;
    return q.questionText;
  };

  const getOptionText = (opt: any) => {
    if (questLang === 'en' && opt.textEn) return opt.textEn;
    if (questLang === 'si' && opt.textSi) return opt.textSi;
    return opt.text;
  };

  const getHintText = (q?: Question) => {
    if (!q) return '';
    if (questLang === 'en' && q.hintEn) return q.hintEn;
    if (questLang === 'si' && q.hintSi) return q.hintSi;
    return q.hint;
  };

  const getExplanationText = (q?: Question) => {
    if (!q) return '';
    if (questLang === 'en' && q.explanationEn) return q.explanationEn;
    if (questLang === 'si' && q.explanationSi) return q.explanationSi;
    return q.explanation;
  };

  // Filtered by province, gaming mode, and grade category
  const displayedLevels = levels.filter((l) => {
    const matchesProvince =
      selectedProvinceTab === 'all'
        ? true
        : PROVINCES_OF_SRI_LANKA.find((p) => p.id === selectedProvinceTab)?.districts.includes(l.districtKey);

    const matchesMode =
      selectedGamingModeFilter === 'all' ? true : l.gamingMode === selectedGamingModeFilter;

    const matchesGrade =
      selectedGradeFilter === 'all' ? true : l.gradeCategory === selectedGradeFilter;

    return matchesProvince && matchesMode && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Quest Header with Trilingual Switcher */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-12 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HNC Edu-Arena • Study Gaming Mode</span>
              </span>
              <span className="text-xs text-indigo-300 font-bold px-2.5 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700/50">
                25 Sri Lankan Districts
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>
                {questLang === 'ta'
                  ? '🎯 HNC Edu-Arena: தீவுப் பயணம்'
                  : questLang === 'si'
                  ? '🎯 HNC Edu-Arena: දූපත් චාරිකාව'
                  : '🎯 HNC Edu-Arena: 25 Districts Island Quest'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {questLang === 'ta'
                ? 'இலங்கையின் 25 மாவட்டங்களை HNC Speed Rush, Power Battle, Wheel Duel மற்றும் Brain Logic ஆகிய விளையாட்டு முறைகளில் வென்று உங்கள் கல்விச் சிகரத்தை அடையுங்கள்!'
                : questLang === 'si'
                ? 'ශ්‍රී ලංකාවේ දිස්ත්‍රික්ක 25 HNC Edu-Arena ක්‍රීඩා මාදිලි 4න් ජය ගන්න!'
                : 'Conquer all 25 districts of Sri Lanka powered by native HNC Arena interactive gaming modes!'}
            </p>
          </div>

          {/* Quick Stats Badges & Trilingual Toggle */}
          <div className="flex flex-col gap-3 items-end">
            {/* Trilingual Switcher */}
            <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/20 text-xs font-bold self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setQuestLang('ta');
                  setAppLanguage('ta');
                }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  questLang === 'ta'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestLang('en');
                  setAppLanguage('en');
                }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  questLang === 'en'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestLang('si');
                  setAppLanguage('si');
                }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  questLang === 'si'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                සිංහල
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Leaderboard Button */}
              <button
                type="button"
                onClick={() => setIsLeaderboardOpen(true)}
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-2xl shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer border border-amber-300 active:scale-95"
              >
                <Trophy className="w-4 h-4 fill-amber-950 text-slate-950" />
                <span>
                  {questLang === 'ta'
                    ? '🏆 25 மாவட்ட தரவரிசை'
                    : questLang === 'si'
                    ? '🏆 දිස්ත්‍රික් 25 ශ්‍රේණිගත කිරීම්'
                    : '🏆 25 Districts Leaderboard'}
                </span>
              </button>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/15 text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-0.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">XP Points</span>
                </div>
                <div className="text-xl font-black text-white">{totalXp}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/15 text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Districts</span>
                </div>
                <div className="text-xl font-black text-white">
                  {completedCount} <span className="text-xs font-normal text-slate-400">/ 25</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition text-xs font-medium cursor-pointer"
                  title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-white transition text-xs cursor-pointer"
                  title="Reset Progress"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar through the Island */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="font-semibold text-white">
              {questLang === 'ta' ? 'அனைத்திலங்கை தீவுப் பயண முன்னேற்றம்:' : questLang === 'si' ? 'දූපත් චාරිකා ප්‍රගතිය:' : 'All-Island Quest Progress:'}
            </span>
            <span>{Math.round((completedCount / levels.length) * 100)}% ({completedCount} / 25)</span>
          </div>
          <div className="w-full sm:w-64 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / levels.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grade Level Category Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>{questLang === 'ta' ? 'வகுப்பு நிலை வடிகட்டி (Grade Wise Levels):' : 'Grade Level Categories:'}</span>
          </span>
          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            {questLang === 'ta' ? 'தகுந்த வகுப்பு மட்டத்தைத் தேர்வு செய்க' : 'Select Academic Grade'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedGradeFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              selectedGradeFilter === 'all'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {questLang === 'ta' ? 'அனைத்து வகுப்புகளும் (All Grades)' : 'All Grade Levels'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedGradeFilter('primary')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap border cursor-pointer ${
              selectedGradeFilter === 'primary'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-black'
                : 'bg-amber-50/70 text-amber-950 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {questLang === 'ta' ? '🌱 ஆரம்பப் பிரிவு (Grades 1-5)' : '🌱 Primary (Grades 1-5)'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedGradeFilter('junior')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap border cursor-pointer ${
              selectedGradeFilter === 'junior'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-black'
                : 'bg-blue-50/70 text-blue-950 border-blue-200 hover:bg-blue-100'
            }`}
          >
            {questLang === 'ta' ? '📘 இடைநிலைப் பிரிவு (Grades 6-9)' : '📘 Junior (Grades 6-9)'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedGradeFilter('senior')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap border cursor-pointer ${
              selectedGradeFilter === 'senior'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-black'
                : 'bg-purple-50/70 text-purple-950 border-purple-200 hover:bg-purple-100'
            }`}
          >
            {questLang === 'ta' ? '🎓 சாதாரண தரம் O/L (Grades 10-11)' : '🎓 Senior O/L (Grades 10-11)'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedGradeFilter('advanced')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap border cursor-pointer ${
              selectedGradeFilter === 'advanced'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
                : 'bg-emerald-50/70 text-emerald-950 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {questLang === 'ta' ? '🔥 உயர்தரம் A/L (Grades 12-13)' : '🔥 Advanced A/L (Grades 12-13)'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedGradeFilter('after_school')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap border cursor-pointer ${
              selectedGradeFilter === 'after_school'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-black'
                : 'bg-indigo-50/70 text-indigo-950 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {questLang === 'ta' ? '👔 பாடசாலைக்குப் பிந்திய போட்டிப் பரீட்சைகள் (Teaching, GS, MA, SLEAS, SLAS)' : '👔 After School Competitions (Teaching, GS, MA, SLEAS, SLAS)'}
          </button>
        </div>
      </div>

      {/* 4 Study Gaming Modes Filter Strip */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Study Gaming Modes (கேமிங் முறைமைகள்):</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {questLang === 'ta' ? 'முறை வாரியாக விளையாடவும்' : 'Filter by Gaming Method'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedGamingModeFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              selectedGamingModeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            அனைத்து முறைகளும் (All Modes)
          </button>

          {STUDY_GAMING_METHODS.map((m) => {
            const isSelected = selectedGamingModeFilter === m.id;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedGamingModeFilter(isSelected ? 'all' : m.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm">{m.icon}</span>
                <span>{questLang === 'ta' ? m.nameTa : questLang === 'si' ? m.nameSi : m.nameEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 9 Provinces Navigation Bar Tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setSelectedProvinceTab('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              selectedProvinceTab === prov.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {questLang === 'ta' ? prov.nameTa : questLang === 'si' ? prov.nameSi : prov.nameEn}
          </button>
        ))}
      </div>

      {/* Levels Grid Map Cards (All 25 Districts) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>
              {questLang === 'ta'
                ? 'இலங்கையின் 25 மாவட்டப் போர்க்களங்கள்'
                : questLang === 'si'
                ? 'ශ්‍රී ලංකාවේ දිස්ත්‍රික්ක 25 පිටිය'
                : 'Sri Lanka 25 District Arenas'}
            </span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {displayedLevels.length} {questLang === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedLevels.map((level) => {
            const isCompleted = level.status === 'Completed';
            const modeMeta = getGamingMethodById(level.gamingMode || 'kahoot');
            const distName = questLang === 'ta' ? level.district : questLang === 'si' ? (level.districtSi || level.districtEn) : level.districtEn;
            const provName = questLang === 'ta' ? level.province : questLang === 'si' ? (level.provinceSi || level.provinceEn) : level.provinceEn;
            const subjName = questLang === 'ta' ? level.gradeSubject : questLang === 'si' ? (level.gradeSubjectSi || level.gradeSubjectEn) : (level.gradeSubjectEn || level.gradeSubject);

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
                {/* Level Card Header with District Badge & Gaming Method */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-slate-100 group-hover:scale-110 transition-transform">
                        {level.iconName}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                          <span className="text-xs text-slate-400 font-medium">{provName}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
                          {distName}{' '}
                          <span className="text-xs font-normal text-slate-400">({level.districtEn})</span>
                        </h3>
                      </div>
                    </div>

                    <div>
                      {!level.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                          <span>Draft</span>
                        </span>
                      ) : level.locked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Won</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm group-hover:shadow">
                          <span>⚔️ Play</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Gaming Mode Pill, Grade Level & Difficulty Tier Badges */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200/60 text-[11px] font-bold text-indigo-900">
                      <span>{modeMeta.icon}</span>
                      <span>{questLang === 'ta' ? modeMeta.nameTa : questLang === 'si' ? modeMeta.nameSi : modeMeta.nameEn}</span>
                    </div>

                    {/* Grade Level Category Badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 text-[10px] font-bold border border-purple-200">
                      {level.gradeCategory === 'primary' && '🌱 Gr 1-5'}
                      {level.gradeCategory === 'junior' && '📘 Gr 6-9'}
                      {level.gradeCategory === 'senior' && '🎓 Gr 10-11 O/L'}
                      {level.gradeCategory === 'advanced' && '🔥 Gr 12-13 A/L'}
                    </span>

                    {/* Difficulty Tier Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${
                        level.difficultyTier === 'master'
                          ? 'bg-rose-100 text-rose-950 border-rose-300 animate-pulse'
                          : level.difficultyTier === 'hard'
                          ? 'bg-amber-100 text-amber-950 border-amber-300'
                          : level.difficultyTier === 'medium'
                          ? 'bg-blue-100 text-blue-950 border-blue-200'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-200'
                      }`}
                    >
                      {level.difficultyTier === 'master' && '🔴 Boss Master (10s)'}
                      {level.difficultyTier === 'hard' && '🟠 Tough (15s)'}
                      {level.difficultyTier === 'medium' && '🟡 Medium (20s)'}
                      {level.difficultyTier === 'easy' && '🟢 Easy (30s)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {questLang === 'en' ? level.descriptionEn : level.description}
                  </p>
                </div>

                {/* Card Footer / Points & Subject */}
                <div className="p-4 px-5 pt-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium text-slate-700 truncate max-w-[170px]">
                    {subjName}
                  </span>

                  {level.isPublished && !level.locked ? (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>{level.points} XP</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {!level.isPublished ? 'Unpublished' : 'Complete previous'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE GAME PLAY MODAL WITH 4 SPECIALIZED GAMING METHODS */}
      {selectedLevel && currentLevelQ && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 relative shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                triggerSound('click');
                setSelectedLevel(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Game Header */}
            <div className="pr-8 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex-wrap">
                <span>{selectedLevel.district}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {getGamingMethodById(selectedLevel.gamingMode).icon} {selectedLevel.gamingMode.toUpperCase()} MODE
                </span>
                <span>•</span>
                <span>
                  {questLang === 'ta' ? 'கேள்வி' : questLang === 'si' ? 'ප්‍රශ්නය' : 'Question'}{' '}
                  {currentQuestionIndex + 1} / {selectedLevel.questions.length}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {questLang === 'ta' ? selectedLevel.district : selectedLevel.districtEn} போர்க்களம் ⚔️
              </h2>
            </div>

            {/* MODE 1 & 2: Kahoot / Quizizz Bar */}
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
                  <span>
                    {questLang === 'ta' ? 'டைமர்' : questLang === 'si' ? 'ටයිමරය' : 'Timer'}: {timeLeft}s
                  </span>
                </div>

                {/* Score & Streak & Level Multiplier */}
                <div className="flex items-center gap-2 flex-wrap">
                  {streakCount >= 1 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-xs animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                      <span>1.5x Level Multiplier</span>
                    </span>
                  )}
                  {streakCount > 1 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 font-black text-xs border border-orange-200">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      <span>{streakCount}x Streak</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs shadow-2xs">
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
                  style={{ width: `${(timeLeft / (selectedLevel.questionTimerSeconds || (selectedLevel.gamingMode === 'kahoot' ? 20 : 30))) * 100}%` }}
                />
              </div>

              {/* MODE 2: Quizizz Power-ups tray */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 font-medium">Power-ups:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUse5050}
                    disabled={powerUp5050Used || isAnswerRevealed}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                      powerUp5050Used
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-sm'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-600" />
                    <span>⚡ 50-50</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUseExtraTime}
                    disabled={extraTimeUsed || isAnswerRevealed}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                      extraTimeUsed
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300 shadow-sm'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>⏱️ +15s Freeze</span>
                  </button>

                  {selectedLevel.gamingMode === 'quizizz' && (
                    <button
                      type="button"
                      onClick={handleUseShield}
                      disabled={shieldActive || isAnswerRevealed}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                        shieldActive
                          ? 'bg-emerald-200 text-emerald-900 border-emerald-400'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 shadow-sm'
                      }`}
                    >
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span>🛡️ Shield</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleHint}
                    disabled={isAnswerRevealed}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                      hintActive
                        ? 'bg-purple-200 text-purple-900 border-purple-400'
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300 shadow-sm'
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
                    <span>{getHintText(currentLevelQ)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* MODE 3: Trivia Crack / QuizUp Category Wheel Spinner Banner */}
            {selectedLevel.gamingMode === 'trivia_crack' && (
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white border border-teal-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center text-xl font-bold border border-teal-400/40">
                    🎡
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 block">
                      HNC Wheel Duel Category
                    </span>
                    <span className="text-sm font-bold">
                      {selectedCategoryWheel || 'சக்கரத்தைச் சுழற்றுங்கள் (Spin to Play Category)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSpinTriviaWheel}
                  disabled={isWheelSpinning || isAnswerRevealed}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-black rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isWheelSpinning ? 'animate-spin' : ''}`} />
                  <span>{isWheelSpinning ? 'சுழல்கிறது...' : 'SPIN WHEEL'}</span>
                </button>
              </div>
            )}

            {/* MODE 4: Brain Out Riddle IQ Index Banner */}
            {selectedLevel.gamingMode === 'brain_out' && (
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-pink-950 via-slate-900 to-purple-950 text-white border border-pink-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Brain className="w-6 h-6 text-pink-400" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 block">
                      HNC Brain Logic IQ Rating
                    </span>
                    <span className="text-sm font-black text-white">IQ: {brainIQRating} pts</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setClueRevealed(!clueRevealed);
                    triggerSound('eureka');
                  }}
                  className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{clueRevealed ? 'தடயம் தெரிந்தது' : 'தடயத்தை ஸ்கேன் செய்'}</span>
                </button>
              </div>
            )}

            {clueRevealed && selectedLevel.gamingMode === 'brain_out' && (
              <div className="mb-4 p-3 bg-pink-50 rounded-xl border border-pink-200 text-xs text-pink-900 flex items-center gap-2 animate-in fade-in">
                <Search className="w-4 h-4 text-pink-600 shrink-0" />
                <span>
                  <strong>தடயம் (Riddle Clue):</strong> {getHintText(currentLevelQ)}
                </span>
              </div>
            )}

            {/* Question Card Box */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white rounded-2xl mb-5 shadow-inner">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 block mb-1.5">
                {questLang === 'ta' ? 'வினா' : questLang === 'si' ? 'ප්‍රශ්නය' : 'Question'} #{currentQuestionIndex + 1}:
              </span>
              <p className="text-base sm:text-lg font-bold leading-relaxed">
                {getQuestionPrompt(currentLevelQ)}
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
                    className={`p-4 rounded-2xl font-bold text-left transition-all duration-150 flex items-center justify-between gap-3 text-sm sm:text-base border border-white/20 cursor-pointer ${btnStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center text-lg font-black shrink-0">
                        {opt.symbol}
                      </span>
                      <span className="leading-snug">{getOptionText(opt)}</span>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 block">
                        {selectedOptionIndex === currentLevelQ.correctIndex
                          ? (questLang === 'ta' ? '🎉 அருமை! சரியான விடை!' : questLang === 'si' ? '🎉 විශිෂ්ටයි! නිවැරදි පිළිතුර!' : '🎉 Great Job! Correct Answer!')
                          : (questLang === 'ta' ? '❌ தவறான பதில்!' : questLang === 'si' ? '❌ වැරදි පිළිතුරක්!' : '❌ Incorrect Answer!')}
                      </span>
                      {selectedOptionIndex === currentLevelQ.correctIndex && lastEarnedPoints > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                          +{lastEarnedPoints} XP
                        </span>
                      )}
                      {selectedOptionIndex === currentLevelQ.correctIndex && isLevelMultiplierActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black shadow-xs animate-bounce">
                          <Sparkles className="w-3 h-3 text-yellow-200" />
                          1.5x Level Multiplier Active!
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      {getExplanationText(currentLevelQ)}
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
                        ? (questLang === 'ta' ? 'அடுத்த கேள்வி' : questLang === 'si' ? 'මීළඟ ප්‍රශ්නය' : 'Next Question')
                        : (questLang === 'ta' ? 'போர்க்களத்தை நிறைவு செய்' : questLang === 'si' ? 'අවසන් කරන්න' : 'Complete Arena')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL SUMMARY / VICTORY & RETRY MODAL */}
      {showLevelSummary && completedLevelData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center relative shadow-2xl border border-slate-100">
            {completedLevelData.isPerfect100 ? (
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 mb-4 animate-bounce">
                🏆
              </div>
            ) : (
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center text-4xl shadow-xl shadow-rose-500/20 mb-4">
                🎯
              </div>
            )}

            <span className={`text-xs uppercase font-extrabold tracking-wider block mb-1 ${completedLevelData.isPerfect100 ? 'text-amber-600' : 'text-rose-600'}`}>
              {completedLevelData.isPerfect100 ? '🎉 100% Perfect Mastered Score!' : '🎯 100% Accuracy Required!'}
            </span>

            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {completedLevelData.isPerfect100
                ? `${completedLevelData.level.district} வெற்றி பெறப்பட்டது!`
                : `${completedLevelData.level.district} - மீண்டும் முயற்சிக்கவும்`}
            </h2>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {completedLevelData.isPerfect100
                ? 'அனைத்து வினாக்களுக்கும் 100% சரியாக விடையளித்து அடுத்த மாவட்டப் போர்க்களத்தைத் திறந்துவிட்டீர்கள்!'
                : `நீங்கள் ${completedLevelData.correctCount} / ${completedLevelData.totalQuestions} வினாக்களுக்கு மட்டுமே சரியாக விடையளித்துள்ளீர்கள்.`}
            </p>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-left">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">ஈட்டிய XP</span>
                <span className="text-xl font-black text-amber-600">+{completedLevelData.earnedXp} XP</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">துல்லியம் (Accuracy)</span>
                <span className={`text-xl font-black ${completedLevelData.isPerfect100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {completedLevelData.accuracy}%
                </span>
              </div>
            </div>

            {completedLevelData.isPerfect100 && completedLevelData.unlockedNext ? (
              <div className="p-3.5 mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>அடுத்த மாவட்ட நிலை திறக்கப்பட்டது! (Next District Unlocked)</span>
              </div>
            ) : !completedLevelData.isPerfect100 ? (
              <div className="p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-bold flex items-center justify-center gap-2 text-left">
                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                <span>அடுத்த நிலையைத் திறக்க 100% மதிப்பெண் தேவை! மீண்டும் விளையாடி வெற்றி பெறுங்கள்.</span>
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5">
              {!completedLevelData.isPerfect100 ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowLevelSummary(false);
                    handleStartLevel(completedLevelData.level);
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-slate-950" />
                  <span>🔄 மீண்டும் விளையாடி 100% பெறுக (Retry District)</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setShowLevelSummary(false);
                  setIsLeaderboardOpen(true);
                }}
                className="w-full py-3 px-6 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
              >
                <Trophy className="w-4 h-4 text-amber-800" />
                <span>{questLang === 'ta' ? '25 மாவட்டங்களின் தரவரிசையைப் பார்க்க' : 'View District Leaderboard & Rankings'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLevelSummary(false)}
                className="w-full py-2.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer"
              >
                {questLang === 'ta' ? 'நிலைகள் வரைபடத்திற்குத் திரும்புக' : 'Back to District Map'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 25 Districts Leaderboard Modal */}
      {isLeaderboardOpen && (
        <DistrictLeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          currentUserXp={totalXp}
          currentUserCompletedCount={completedCount}
          currentUserDistrictKey={currentStudent?.district || currentAuthUser?.district}
          currentLanguage={questLang}
        />
      )}
    </div>
  );
};
