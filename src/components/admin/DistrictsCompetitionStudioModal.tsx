import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SRI_LANKA_25_DISTRICTS,
  PROVINCES_OF_SRI_LANKA,
  STUDY_GAMING_METHODS,
  StudyGamingMode,
  GamingMethodDef,
  SriLankaDistrictInfo,
  DISTRICT_QUEST_STORAGE_KEY,
  getGamingMethodById,
  getLocalizedDistrict,
} from '../../data/sriLankaDistricts';
import {
  MapPin,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Layers,
  Search,
  Filter,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Radio,
  FileQuestion,
  HelpCircle,
  Lock,
  Unlock,
  Languages,
  Crown,
  Brain,
  RotateCw,
  Flame,
} from 'lucide-react';
import { Competition } from '../../types';

interface DistrictState extends SriLankaDistrictInfo {
  isPublished: boolean;
  isLockedForStudents: boolean;
  gamingMode: StudyGamingMode;
  questionTimerSeconds?: number;
  maxLivesCount?: number;
  passingAccuracyPercent?: number;
  difficultyTier?: 'easy' | 'medium' | 'hard' | 'master';
  enablePowerUps?: boolean;
}

const createBlankManualQuestion = (idNum: number) => ({
  id: `q_manual_${Date.now()}_${idNum}`,
  questionText: '',
  questionTextEn: '',
  questionTextSi: '',
  category: 'General Knowledge',
  options: [
    { shape: 'triangle' as const, symbol: '▲', text: '', textEn: '', textSi: '', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
    { shape: 'diamond' as const, symbol: '♦', text: '', textEn: '', textSi: '', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
    { shape: 'circle' as const, symbol: '●', text: '', textEn: '', textSi: '', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
    { shape: 'square' as const, symbol: '■', text: '', textEn: '', textSi: '', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
  ],
  correctIndex: 0,
  hint: '',
  hintEn: '',
  hintSi: '',
  explanation: '',
  explanationEn: '',
  explanationSi: '',
});

interface DistrictsCompetitionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'super_admin' | 'admin';
  onCreateFormalCompetition?: (district: DistrictState) => void;
  initialAction?: 'list' | 'create';
}

export const DistrictsCompetitionStudioModal: React.FC<DistrictsCompetitionStudioModalProps> = ({
  isOpen,
  onClose,
  role,
  onCreateFormalCompetition,
  initialAction = 'list',
}) => {
  const { language: appLanguage, setLanguage: setAppLanguage } = useApp();

  // Internal language state for trilingual editing: Tamil, English, Sinhala
  const [activeLang, setActiveLang] = useState<'ta' | 'en' | 'si'>(appLanguage || 'ta');

  useEffect(() => {
    if (appLanguage) {
      setActiveLang(appLanguage);
    }
  }, [appLanguage]);

  // Load district settings from storage or initialize
  const [districts, setDistricts] = useState<DistrictState[]>(() => {
    try {
      const saved = localStorage.getItem(DISTRICT_QUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return SRI_LANKA_25_DISTRICTS.map((base, idx) => {
          const match = parsed.find((p: any) => p.id === base.id);
          const defaultModes: StudyGamingMode[] = ['kahoot', 'quizizz', 'trivia_crack', 'brain_out'];
          return {
            ...base,
            isPublished: match ? match.isPublished ?? true : true,
            isLockedForStudents: match ? match.isLockedForStudents ?? (base.levelNumber > 1) : base.levelNumber > 1,
            gamingMode: match?.gamingMode || base.defaultGamingMode || defaultModes[idx % defaultModes.length],
            gradeSubject: match?.gradeSubject || base.gradeSubject,
            defaultPoints: match?.defaultPoints || base.defaultPoints,
            initialQuestions: match?.initialQuestions || base.initialQuestions,
          };
        });
      }
    } catch {}

    const defaultModes: StudyGamingMode[] = ['kahoot', 'quizizz', 'trivia_crack', 'brain_out'];
    return SRI_LANKA_25_DISTRICTS.map((base, idx) => ({
      ...base,
      isPublished: true,
      isLockedForStudents: base.levelNumber > 1,
      gamingMode: base.defaultGamingMode || defaultModes[idx % defaultModes.length],
    }));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [activeEditingDistrict, setActiveEditingDistrict] = useState<DistrictState | null>(null);
  const [showCreateQuestModal, setShowCreateQuestModal] = useState<boolean>(initialAction === 'create');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialAction === 'create') {
      setShowCreateQuestModal(true);
    }
  }, [initialAction]);

  // New Island Quest Creation Form State
  const [newQuestDistrictId, setNewQuestDistrictId] = useState<string>('colombo');
  const [newQuestGamingMode, setNewQuestGamingMode] = useState<StudyGamingMode>('kahoot');
  const [newQuestTitleTa, setNewQuestTitleTa] = useState<string>('புதிய தீவுப் போர்');
  const [newQuestTitleEn, setNewQuestTitleEn] = useState<string>('New Island Battle');
  const [newQuestTitleSi, setNewQuestTitleSi] = useState<string>('නව දූපත් තරඟය');
  const [newQuestGradeSubject, setNewQuestGradeSubject] = useState<string>('தரம் 10 • பொது அறிவு & விஞ்ஞானம்');
  const [newQuestPoints, setNewQuestPoints] = useState<number>(150);
  const [newQuestTimerSeconds, setNewQuestTimerSeconds] = useState<number>(20);
  const [newQuestLivesCount, setNewQuestLivesCount] = useState<number>(3);
  const [newQuestPassingAccuracy, setNewQuestPassingAccuracy] = useState<number>(70);
  const [newQuestDifficultyTier, setNewQuestDifficultyTier] = useState<'easy' | 'medium' | 'hard' | 'master'>('medium');
  const [newQuestEnablePowerups, setNewQuestEnablePowerups] = useState<boolean>(true);

  // Manual questions authored directly in the Quest Creator
  const [newQuestQuestions, setNewQuestQuestions] = useState<any[]>(() => {
    const colombo = SRI_LANKA_25_DISTRICTS.find((d) => d.id === 'colombo');
    if (colombo && colombo.initialQuestions.length > 0) {
      return JSON.parse(JSON.stringify(colombo.initialQuestions));
    }
    return [createBlankManualQuestion(1)];
  });
  const [newQuestActiveQTab, setNewQuestActiveQTab] = useState<number>(0);

  // Question editing sub-state inside district editor
  const [activeQuestionTab, setActiveQuestionTab] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Save changes to storage whenever districts change
  const saveDistrictsProgress = (updated: DistrictState[]) => {
    setDistricts(updated);
    try {
      localStorage.setItem(DISTRICT_QUEST_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  if (!isOpen) return null;

  // Trilingual dictionary for UI labels
  const uiText = {
    title: {
      ta: '🎯 HNC Edu-Arena: தீவுப் பயணம் & Study Gaming Mode ஸ்டுடியோ',
      en: '🎯 HNC Edu-Arena: Island Quest & Study Gaming Mode Studio',
      si: '🎯 HNC Edu-Arena: දූපත් චාරිකාව සහ අධ්‍යාපනික ක්‍රීඩා මාදිලි මැදිරිය',
    },
    subtitle: {
      ta: 'இலங்கையின் 25 மாவட்டங்களுக்கும் HNC Speed Rush, Power Battle, Wheel Duel மற்றும் Brain Logic ஆகிய விளையாட்டு முறைகளில் போட்டிகளை உருவாக்கி பிரசுரிக்கவும்.',
      en: 'Create, customize, and publish interactive competitions across all 25 Sri Lankan districts using native HNC Arena game modes.',
      si: 'ශ්‍රී ලංකාවේ දිස්ත්‍රික්ක 25ටම HNC Arena ක්‍රීඩා මාදිලිවලින් තරඟ සාදා ප්‍රකාශයට පත් කරන්න.',
    },
    createQuestBtn: {
      ta: '+ புதிய தீவுப் போட்டி உருவாக்கு (Create Quest)',
      en: '+ Create Island Quest (Edu-Arena)',
      si: '+ නව දූපත් තරඟයක් සාදන්න',
    },
    publishAll: {
      ta: 'அனைத்தையும் பிரசுரி (Publish All 25)',
      en: 'Publish All 25 Districts',
      si: 'දිස්ත්‍රික්ක 25ම ප්‍රකාශයට පත් කරන්න',
    },
    searchPlaceholder: {
      ta: 'மாவட்டம் அல்லது பாடப்பிரிவைத் தேடுங்கள்...',
      en: 'Search district, province, or subject...',
      si: 'දිස්ත්‍රික්කය හෝ විෂය සොයන්න...',
    },
    allModes: {
      ta: 'அனைத்து கேமிங் முறைகளும் (All Modes)',
      en: 'All Gaming Modes',
      si: 'සියලුම ක්‍රීඩා මාදිලි',
    },
    allProvinces: {
      ta: 'அனைத்து 9 மாகாணங்களும் (All 9 Provinces)',
      en: 'All 9 Provinces',
      si: 'සියලු පළාත් 9',
    },
    published: {
      ta: 'பிரசுரமானது (Live)',
      en: 'Live Published',
      si: 'ප්‍රකාශිතයි (Live)',
    },
    draft: {
      ta: 'வரைவு (Draft)',
      en: 'Draft / Unpublished',
      si: 'කෙටුම්පත (Draft)',
    },
    editQuestions: {
      ta: 'கேமிங் முறை & வினாக்கள் (Edit Mode & Qs)',
      en: 'Game Mode & Questions',
      si: 'ක්‍රීඩා මාදිලිය සහ ප්‍රශ්න',
    },
    makeCompetition: {
      ta: 'போட்டியாக்கு',
      en: 'Make Competition',
      si: 'තරඟයක් කරන්න',
    },
  };

  // Filter districts list
  const filteredDistricts = districts.filter((d) => {
    const localized = getLocalizedDistrict(d, activeLang);
    const matchesSearch =
      d.nameTa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nameSi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      localized.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.gradeSubject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince =
      selectedProvince === 'all'
        ? true
        : PROVINCES_OF_SRI_LANKA.find((p) => p.id === selectedProvince)?.districts.includes(d.id);

    const matchesMode =
      selectedModeFilter === 'all' ? true : d.gamingMode === selectedModeFilter;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'published'
        ? d.isPublished
        : !d.isPublished;

    return matchesSearch && matchesProvince && matchesMode && matchesStatus;
  });

  // Toggle publish status for a district
  const handleTogglePublish = (districtId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = districts.map((d) => {
      if (d.id === districtId) {
        const nextState = !d.isPublished;
        showToast(
          nextState
            ? `🟢 ${d.nameTa} (${d.nameEn}) போட்டி நேரலையில் பிரசுரிக்கப்பட்டது!`
            : `🟡 ${d.nameTa} (${d.nameEn}) போட்டி வரைவுக்கு மாற்றப்பட்டது.`
        );
        return { ...d, isPublished: nextState };
      }
      return d;
    });
    saveDistrictsProgress(updated);
  };

  // Change Gaming Mode for a district
  const handleChangeGamingMode = (districtId: string, newMode: StudyGamingMode) => {
    const updated = districts.map((d) =>
      d.id === districtId ? { ...d, gamingMode: newMode } : d
    );
    saveDistrictsProgress(updated);
    const modeInfo = getGamingMethodById(newMode);
    showToast(`🎮 ${modeInfo.nameTa} முறை வெற்றிகரமாகப் பொருத்தப்பட்டது!`);
  };

  // Save district edits
  const handleSaveDistrictEdits = () => {
    if (!activeEditingDistrict) return;
    const updated = districts.map((d) =>
      d.id === activeEditingDistrict.id ? activeEditingDistrict : d
    );
    saveDistrictsProgress(updated);
    showToast(`✅ ${activeEditingDistrict.nameTa} விவரங்கள் மற்றும் வினாக்கள் சேமிக்கப்பட்டன!`);
    setActiveEditingDistrict(null);
  };

  // Question management inside New Island Quest Creator
  const handleAddNewQuestionToNewQuest = () => {
    const newQ = createBlankManualQuestion(newQuestQuestions.length + 1);
    const updated = [...newQuestQuestions, newQ];
    setNewQuestQuestions(updated);
    setNewQuestActiveQTab(updated.length - 1);
    showToast('✨ புதிய வினா சேர்க்கப்பட்டது!');
  };

  const handleDeleteQuestionFromNewQuest = (idx: number) => {
    if (newQuestQuestions.length <= 1) {
      showToast('⚠️ குறைந்தது ஒரு வினா இருக்க வேண்டும்!');
      return;
    }
    const updated = newQuestQuestions.filter((_, i) => i !== idx);
    setNewQuestQuestions(updated);
    setNewQuestActiveQTab(Math.max(0, idx - 1));
    showToast('🗑️ வினா நீக்கப்பட்டது');
  };

  const handleLoadDistrictTemplateQuestions = () => {
    const match = districts.find((d) => d.id === newQuestDistrictId);
    if (match && match.initialQuestions && match.initialQuestions.length > 0) {
      setNewQuestQuestions(JSON.parse(JSON.stringify(match.initialQuestions)));
      setNewQuestActiveQTab(0);
      showToast(`📋 ${match.nameTa} மாவட்டத்தின் மாதிரி வினாக்கள் ஏற்றப்பட்டன!`);
    } else {
      showToast('⚠️ வினாக்கள் கிடைக்கவில்லை!');
    }
  };

  // Handle New Island Quest Creation
  const handleCreateNewQuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDistrict = districts.find((d) => d.id === newQuestDistrictId);
    if (!targetDistrict) return;

    // Validate that at least one question has text
    const validQuestions = newQuestQuestions.filter(
      (q) => (q.questionText && q.questionText.trim()) || (q.questionTextEn && q.questionTextEn.trim()) || (q.options && q.options.some((o: any) => o.text && o.text.trim()))
    );

    const finalQuestions = validQuestions.length > 0 ? newQuestQuestions : targetDistrict.initialQuestions;

    const updated = districts.map((d) => {
      if (d.id === newQuestDistrictId) {
        return {
          ...d,
          gamingMode: newQuestGamingMode,
          gradeSubject: newQuestGradeSubject,
          defaultPoints: newQuestPoints,
          questionTimerSeconds: newQuestTimerSeconds,
          maxLivesCount: newQuestLivesCount,
          passingAccuracyPercent: newQuestPassingAccuracy,
          difficultyTier: newQuestDifficultyTier,
          enablePowerUps: newQuestEnablePowerups,
          initialQuestions: finalQuestions,
          isPublished: true,
        };
      }
      return d;
    });

    saveDistrictsProgress(updated);
    showToast(`🎉 "${newQuestTitleTa}" (${targetDistrict.nameTa}) புதிய தீவுப் போட்டி உருவாக்கப்பட்டு பிரசுரிக்கப்பட்டது!`);
    setShowCreateQuestModal(false);
  };

  // Add new question to editing district
  const handleAddQuestionToDistrict = () => {
    if (!activeEditingDistrict) return;
    const newQId = `q_${activeEditingDistrict.id}_${Date.now()}`;
    const newQuestion = {
      id: newQId,
      questionText: 'புதிய வினாத் தொடர்...',
      questionTextEn: 'New question prompt...',
      questionTextSi: 'නව ප්‍රශ්නය...',
      category: 'General Knowledge',
      options: [
        { shape: 'triangle' as const, symbol: '▲', text: 'விடை 1 (Option A)', textEn: 'Option A', textSi: 'පිළිතුර 1', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
        { shape: 'square' as const, symbol: '■', text: 'விடை 2 (Option B)', textEn: 'Option B', textSi: 'පිළිතුර 2', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
        { shape: 'circle' as const, symbol: '●', text: 'விடை 3 (Option C)', textEn: 'Option C', textSi: 'පිළිතුර 3', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
        { shape: 'diamond' as const, symbol: '♦', text: 'விடை 4 (Option D)', textEn: 'Option D', textSi: 'පිළිතුර 4', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
      ],
      correctIndex: 0,
      hint: 'பாடநூல் குறிப்பு...',
      hintEn: 'Textbook hint...',
      hintSi: 'ඉඟිය...',
      explanation: 'சரியான விடைக்கான விளக்கம்...',
      explanationEn: 'Explanation for correct answer...',
      explanationSi: 'පැහැදිලි කිරීම...',
    };

    setActiveEditingDistrict({
      ...activeEditingDistrict,
      initialQuestions: [...activeEditingDistrict.initialQuestions, newQuestion],
    });
    setActiveQuestionTab(activeEditingDistrict.initialQuestions.length);
  };

  // Delete a question from editing district
  const handleDeleteQuestion = (qIndex: number) => {
    if (!activeEditingDistrict) return;
    if (activeEditingDistrict.initialQuestions.length <= 1) {
      alert('குறைந்தது ஒரு வினாவாவது இருக்க வேண்டும்!');
      return;
    }
    const updatedQs = activeEditingDistrict.initialQuestions.filter((_, idx) => idx !== qIndex);
    setActiveEditingDistrict({
      ...activeEditingDistrict,
      initialQuestions: updatedQs,
    });
    setActiveQuestionTab(Math.max(0, qIndex - 1));
  };

  const publishedCount = districts.filter((d) => d.isPublished).length;
  const totalQuestionsAllDistricts = districts.reduce(
    (sum, d) => sum + (d.initialQuestions?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Toast alert */}
        {toastMsg && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-top-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Top Header with Trilingual Language Switcher */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>HNC Edu-Arena • Study Gaming Mode Studio</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({role === 'super_admin' ? 'Super Admin Authority' : 'Academic Admin Console'})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{uiText.title[activeLang]}</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {uiText.subtitle[activeLang]}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {/* Trilingual Switcher Buttons */}
            <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/20 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveLang('ta');
                  setAppLanguage('ta');
                }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeLang === 'ta'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLang('en');
                  setAppLanguage('en');
                }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeLang === 'en'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLang('si');
                  setAppLanguage('si');
                }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeLang === 'si'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                සිංහල
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 4 Study Gaming Methods Showcase Bar */}
        <div className="bg-slate-900 border-b border-indigo-900/60 p-3 px-6 flex items-center gap-3 overflow-x-auto text-xs text-white shrink-0">
          <span className="font-extrabold uppercase tracking-wider text-amber-400 shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gaming Modes:</span>
          </span>

          {STUDY_GAMING_METHODS.map((method) => {
            const isSelected = selectedModeFilter === method.id;

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedModeFilter(isSelected ? 'all' : method.id)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 border-white shadow-sm'
                    : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20'
                }`}
              >
                <span className="text-sm">{method.icon}</span>
                <span>
                  {activeLang === 'ta' ? method.nameTa : activeLang === 'si' ? method.nameSi : method.nameEn}
                </span>
                {isSelected && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full">✓ Active</span>}
              </button>
            );
          })}

          {selectedModeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedModeFilter('all')}
              className="text-[11px] text-amber-300 hover:underline shrink-0 font-medium"
            >
              Clear mode filter
            </button>
          )}
        </div>

        {/* Action Header & Quick KPI Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>{activeLang === 'ta' ? 'மொத்த மாவட்டங்கள்' : activeLang === 'si' ? 'මුළු දිස්ත්‍රික්ක' : 'Districts'}: <strong className="text-slate-900">25</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{uiText.published[activeLang]}: <strong className="text-emerald-900">{publishedCount} / 25</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
              <FileQuestion className="w-4 h-4 text-purple-600" />
              <span>{activeLang === 'ta' ? 'வினாக்கள்' : activeLang === 'si' ? 'ප්‍රශ්න' : 'Questions'}: <strong className="text-slate-900">{totalQuestionsAllDistricts} Qs</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Create Island Quest Action Button */}
            <button
              type="button"
              onClick={() => setShowCreateQuestModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{uiText.createQuestBtn[activeLang]}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const allPub = districts.map((d) => ({ ...d, isPublished: true }));
                saveDistrictsProgress(allPub);
                showToast('🚀 அனைத்து 25 மாவட்டப் போட்டிகளும் மாணவர்களுக்குப் பிரசுரிக்கப்பட்டன!');
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{uiText.publishAll[activeLang]}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 px-6 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 text-xs">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={uiText.searchPlaceholder[activeLang]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Province Filter */}
          <div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{uiText.allProvinces[activeLang]}</option>
              {PROVINCES_OF_SRI_LANKA.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {activeLang === 'ta' ? prov.nameTa : activeLang === 'si' ? prov.nameSi : prov.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">அனைத்து நிலைகளும் (All Statuses)</option>
              <option value="published">🟢 {uiText.published[activeLang]}</option>
              <option value="draft">🟡 {uiText.draft[activeLang]}</option>
            </select>
          </div>
        </div>

        {/* Districts Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDistricts.map((district) => {
              const qCount = district.initialQuestions?.length || 0;
              const modeMeta = getGamingMethodById(district.gamingMode || 'kahoot');
              const localized = getLocalizedDistrict(district, activeLang);

              return (
                <div
                  key={district.id}
                  className={`rounded-2xl border transition-all duration-200 bg-white shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    district.isPublished
                      ? 'border-slate-200 hover:border-blue-400'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  {/* District Card Header */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-slate-100">
                          {district.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                              Level {district.levelNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {localized.province}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">
                            {localized.name}{' '}
                            <span className="text-xs text-slate-400 font-normal">
                              ({district.nameEn})
                            </span>
                          </h3>
                        </div>
                      </div>

                      {/* Publish / Unpublish Status Pill */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePublish(district.id, e)}
                        className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer ${
                          district.isPublished
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                        }`}
                        title="Toggle Publish Status"
                      >
                        <Radio className={`w-3 h-3 ${district.isPublished ? 'animate-pulse text-emerald-600' : 'text-amber-600'}`} />
                        <span>{district.isPublished ? uiText.published[activeLang] : uiText.draft[activeLang]}</span>
                      </button>
                    </div>

                    {/* Gaming Method Selector Badge */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-500">Method:</span>
                        <select
                          value={district.gamingMode || 'kahoot'}
                          onChange={(e) => handleChangeGamingMode(district.id, e.target.value as StudyGamingMode)}
                          className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 cursor-pointer"
                        >
                          {STUDY_GAMING_METHODS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.icon} {activeLang === 'ta' ? m.nameTa : activeLang === 'si' ? m.nameSi : m.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="font-bold text-amber-600 flex items-center gap-1 text-xs">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>{district.defaultPoints} XP</span>
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-xs font-semibold text-slate-700 block">
                        📚 {localized.gradeSubject}
                      </span>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {localized.description}
                      </p>
                    </div>

                    {/* Stats & Question Pill */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="font-semibold flex items-center gap-1 text-purple-700">
                        <FileQuestion className="w-3.5 h-3.5" />
                        <span>{qCount} Questions</span>
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {modeMeta.taglineEn}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="p-3 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveEditingDistrict({ ...district });
                        setActiveQuestionTab(0);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      <span>{uiText.editQuestions[activeLang]}</span>
                    </button>

                    {onCreateFormalCompetition && (
                      <button
                        type="button"
                        onClick={() => {
                          onCreateFormalCompetition(district);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="இந்த மாவட்டத்தை மையமாகக் கொண்டு முழுமையான போட்டியை உருவாக்கு"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{uiText.makeCompetition[activeLang]}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CREATE NEW ISLAND QUEST MODAL (WIZARD) */}
        {showCreateQuestModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-60 flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in zoom-in-95">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-amber-600 to-indigo-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-xs uppercase font-extrabold tracking-wider text-amber-200">
                      HNC Edu-Arena Quest Creator
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    {uiText.createQuestBtn[activeLang]}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateQuestModal(false)}
                  className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewQuestSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
                {/* 1. Target District */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">
                    1. இலக்கு மாவட்டம் (Target Sri Lankan District):
                  </label>
                  <select
                    value={newQuestDistrictId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setNewQuestDistrictId(newId);
                      const match = districts.find((d) => d.id === newId);
                      if (match && match.initialQuestions && match.initialQuestions.length > 0) {
                        setNewQuestQuestions(JSON.parse(JSON.stringify(match.initialQuestions)));
                        setNewQuestActiveQTab(0);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.icon} {d.nameTa} ({d.nameEn} • {d.nameSi}) — {d.provinceTa}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Gaming Method Selection */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-2">
                    2. கேமிங் முறைமை (Study Gaming Method):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STUDY_GAMING_METHODS.map((m) => {
                      const isSelected = newQuestGamingMode === m.id;

                      return (
                        <div
                          key={m.id}
                          onClick={() => setNewQuestGamingMode(m.id)}
                          className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl p-1.5 rounded-xl bg-white shadow-2xs border border-slate-100">
                              {m.icon}
                            </span>
                            <div>
                              <span className="font-black text-slate-900 block text-xs">
                                {activeLang === 'ta' ? m.nameTa : activeLang === 'si' ? m.nameSi : m.nameEn}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {m.taglineEn}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Titles in 3 Languages */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">தலைப்பு (தமிழ்):</label>
                    <input
                      type="text"
                      required
                      value={newQuestTitleTa}
                      onChange={(e) => setNewQuestTitleTa(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Title (English):</label>
                    <input
                      type="text"
                      required
                      value={newQuestTitleEn}
                      onChange={(e) => setNewQuestTitleEn(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">මාතෘකාව (සිංහල):</label>
                    <input
                      type="text"
                      required
                      value={newQuestTitleSi}
                      onChange={(e) => setNewQuestTitleSi(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* 4. Grade Subject & Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">தரம் & பாடம் (Grade / Subject):</label>
                    <input
                      type="text"
                      required
                      value={newQuestGradeSubject}
                      onChange={(e) => setNewQuestGradeSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">வெற்றி XP புள்ளிகள் (Reward Points):</label>
                    <input
                      type="number"
                      required
                      min={50}
                      max={1000}
                      value={newQuestPoints}
                      onChange={(e) => setNewQuestPoints(parseInt(e.target.value, 10) || 100)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* 5. Game Mechanics Customization (Timer, Hearts, Level Progression & Difficulty) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-slate-50 border border-indigo-200/80 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-extrabold text-indigo-950 text-xs uppercase tracking-wider">
                        5. விளையாட்டு கட்டுப்பாடுகள் & லெவல் அன்லாக் விதிகள் (Game Timer & Progression)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-200/70 text-indigo-900 text-[10px] font-black">
                      Custom Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Speed Timer Selector */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        ⏱️ வினா நேர அளவு (Speed Timer per Q):
                      </label>
                      <select
                        value={newQuestTimerSeconds}
                        onChange={(e) => setNewQuestTimerSeconds(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      >
                        <option value={10}>⚡ 10 விநாடிகள் (Ultra Speed Rush)</option>
                        <option value={15}>🚀 15 விநாடிகள் (Fast Speed)</option>
                        <option value={20}>⏱️ 20 விநாடிகள் (Standard Speed)</option>
                        <option value={30}>🕒 30 விநாடிகள் (Relaxed Speed)</option>
                        <option value={45}>🎯 45 விநாடிகள் (Pro Focus)</option>
                        <option value={60}>🧠 60 விநாடிகள் (Deep Logic)</option>
                      </select>
                    </div>

                    {/* Hearts / Lives Allowance */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        ❤️ மாணவர் இதய உயிர்கள் (Hearts Count):
                      </label>
                      <select
                        value={newQuestLivesCount}
                        onChange={(e) => setNewQuestLivesCount(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      >
                        <option value={3}>❤️❤️❤️ 3 உயிர்கள் (Default Classic)</option>
                        <option value={5}>❤️❤️❤️❤️❤️ 5 உயிர்கள் (Generous Practice)</option>
                        <option value={1}>❤️ 1 உயிர் (Hardcore Sudden Death)</option>
                        <option value={99}>♾️ 99 உயிர்கள் (Unlimited Practice)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Passing Accuracy Required */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        🔓 அடுத்த லெவல் அன்லாக் துல்லியம் (Unlock %):
                      </label>
                      <select
                        value={newQuestPassingAccuracy}
                        onChange={(e) => setNewQuestPassingAccuracy(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      >
                        <option value={50}>50% துல்லியம் (Easy Pass)</option>
                        <option value={60}>60% துல்லியம் (Standard)</option>
                        <option value={70}>70% துல்லியம் (Recommended)</option>
                        <option value={80}>80% துல்லியம் (High Mastery)</option>
                        <option value={90}>90% துல்லியம் (Expert Level)</option>
                        <option value={100}>100% துல்லியம் (Perfect Mastery)</option>
                      </select>
                    </div>

                    {/* Difficulty Tier */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        🏆 சவால் நிலை (Difficulty Tier):
                      </label>
                      <select
                        value={newQuestDifficultyTier}
                        onChange={(e) => setNewQuestDifficultyTier(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      >
                        <option value="easy">🟢 Easy (தொடக்க நிலை • 1.0x XP)</option>
                        <option value="medium">🔵 Medium (இடைநிலை • 1.25x XP)</option>
                        <option value="hard">🟠 Hard (சவாலான நிலை • 1.5x XP)</option>
                        <option value="master">🔴 Master (நிபுணர் நிலை • 2.0x XP)</option>
                      </select>
                    </div>

                    {/* Power-Ups Allowance */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        ⚡ பவர்-அப்கள் அனுமதி (Power-Ups):
                      </label>
                      <select
                        value={newQuestEnablePowerups ? 'enabled' : 'disabled'}
                        onChange={(e) => setNewQuestEnablePowerups(e.target.value === 'enabled')}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      >
                        <option value="enabled">🟢 பவர்-அப்கள் அனுமதி (50-50, Time Freeze, Shield)</option>
                        <option value="disabled">🔴 பவர்-அப்கள் முடக்கு (Pure Exam Mode)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 6. Manual Questions Authoring Section */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                          6. சொந்த வினாக்கள் உருவாக்கம் (Manual Questions Creation)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        இப்போட்டியில் மாணவர்கள் பதிலளிக்க வேண்டிய வினாக்களை நீங்களே நேரடியாக தட்டச்சு செய்து உள்ளிடலாம்.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleLoadDistrictTemplateQuestions}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                        title="Load existing template questions for selected district"
                      >
                        டெம்ப்ளேட் வினாக்களை ஏற்று
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewQuestionToNewQuest}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ வினா சேர்</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Tabs (Q1, Q2, Q3...) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
                    {newQuestQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewQuestActiveQTab(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                          newQuestActiveQTab === idx
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>வினா #{idx + 1}</span>
                        {newQuestQuestions.length > 1 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestionFromNewQuest(idx);
                            }}
                            className="text-white/70 hover:text-white hover:bg-black/20 rounded p-0.5 text-xs font-black"
                            title="வினாவை நீக்கு"
                          >
                            ×
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Active Question Editor Form */}
                  {newQuestQuestions[newQuestActiveQTab] && (
                    <div className="space-y-4 pt-1">
                      {/* Question Prompt Inputs (Tamil, English, Sinhala) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            வினா வாசகம் (தமிழ் Prompt) *
                          </label>
                          <textarea
                            rows={2}
                            required
                            placeholder="உதாரணம்: இலங்கையின் மிக நீளமான ஆறு எது?"
                            value={newQuestQuestions[newQuestActiveQTab].questionText}
                            onChange={(e) => {
                              const updated = [...newQuestQuestions];
                              updated[newQuestActiveQTab].questionText = e.target.value;
                              setNewQuestQuestions(updated);
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Question Prompt (English)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Which is the longest river in Sri Lanka?"
                            value={newQuestQuestions[newQuestActiveQTab].questionTextEn || ''}
                            onChange={(e) => {
                              const updated = [...newQuestQuestions];
                              updated[newQuestActiveQTab].questionTextEn = e.target.value;
                              setNewQuestQuestions(updated);
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            ප්‍රශ්න විස්තරය (සිංහල Prompt)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="ශ්‍රී ලංකාවේ දිගම ගංගාව කුමක්ද?"
                            value={newQuestQuestions[newQuestActiveQTab].questionTextSi || ''}
                            onChange={(e) => {
                              const updated = [...newQuestQuestions];
                              updated[newQuestActiveQTab].questionTextSi = e.target.value;
                              setNewQuestQuestions(updated);
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* 4 Answer Options (HNC Arena Gaming Pads) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-bold text-slate-700 block text-xs">
                            4 விடைக் கூறுகள் (HNC Arena Gaming Pads - சரியான விடையைத் தேர்ந்தெடுக்கவும்):
                          </label>
                          <span className="text-[10px] text-slate-500">
                            சரியான விடைக்கு எதிரே உள்ள <strong>'✓ சரி'</strong> பொத்தானை அழுத்தவும்
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {newQuestQuestions[newQuestActiveQTab].options.map((opt: any, oIdx: number) => {
                            const isCorrect = newQuestQuestions[newQuestActiveQTab].correctIndex === oIdx;

                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border flex flex-col gap-2 transition ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center shrink-0 ${opt.color}`}>
                                    {opt.symbol}
                                  </span>

                                  <input
                                    type="text"
                                    required
                                    placeholder={`விடை #${oIdx + 1} (தமிழ்)`}
                                    value={opt.text}
                                    onChange={(e) => {
                                      const updated = [...newQuestQuestions];
                                      updated[newQuestActiveQTab].options[oIdx].text = e.target.value;
                                      setNewQuestQuestions(updated);
                                    }}
                                    className="flex-1 px-2.5 py-1 border border-slate-200 rounded text-xs bg-white font-medium"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...newQuestQuestions];
                                      updated[newQuestActiveQTab].correctIndex = oIdx;
                                      setNewQuestQuestions(updated);
                                    }}
                                    className={`px-2.5 py-1 rounded text-[10px] font-black shrink-0 transition cursor-pointer ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {isCorrect ? '✓ சரி (Correct)' : 'தேர்ந்தெடு'}
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 pl-9">
                                  <input
                                    type="text"
                                    placeholder="English (Optional)"
                                    value={opt.textEn || ''}
                                    onChange={(e) => {
                                      const updated = [...newQuestQuestions];
                                      updated[newQuestActiveQTab].options[oIdx].textEn = e.target.value;
                                      setNewQuestQuestions(updated);
                                    }}
                                    className="px-2 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50"
                                  />
                                  <input
                                    type="text"
                                    placeholder="සිංහල (Optional)"
                                    value={opt.textSi || ''}
                                    onChange={(e) => {
                                      const updated = [...newQuestQuestions];
                                      updated[newQuestActiveQTab].options[oIdx].textSi = e.target.value;
                                      setNewQuestQuestions(updated);
                                    }}
                                    className="px-2 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hint & Explanation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            விளக்கக் குறிப்பு (Hint / உதவிக்குறிப்பு):
                          </label>
                          <input
                            type="text"
                            placeholder="மாணவர்களுக்கான உதவிக்குறிப்பு..."
                            value={newQuestQuestions[newQuestActiveQTab].hint || ''}
                            onChange={(e) => {
                              const updated = [...newQuestQuestions];
                              updated[newQuestActiveQTab].hint = e.target.value;
                              setNewQuestQuestions(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            பதில் விளக்கம் (Explanation / விரிவான விடை):
                          </label>
                          <input
                            type="text"
                            placeholder="சரியான விடைக்கான காரணம்..."
                            value={newQuestQuestions[newQuestActiveQTab].explanation || ''}
                            onChange={(e) => {
                              const updated = [...newQuestQuestions];
                              updated[newQuestActiveQTab].explanation = e.target.value;
                              setNewQuestQuestions(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateQuestModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                  >
                    ரத்து செய் (Cancel)
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                  >
                    உடனடியாகப் பிரசுரி (Create & Publish Now)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DISTRICT QUESTIONS & DETAILS EDITOR MODAL (SUB-MODAL) */}
        {activeEditingDistrict && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-60 flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in zoom-in-95">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-white/10">{activeEditingDistrict.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {activeEditingDistrict.nameTa} ({activeEditingDistrict.nameEn} • {activeEditingDistrict.nameSi})
                    </h2>
                    <p className="text-xs text-slate-400">
                      {activeEditingDistrict.provinceTa} • Level {activeEditingDistrict.levelNumber}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveEditingDistrict(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* District Level Configs & Gaming Method */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Gaming Method (முறை):</label>
                    <select
                      value={activeEditingDistrict.gamingMode || 'kahoot'}
                      onChange={(e) =>
                        setActiveEditingDistrict({
                          ...activeEditingDistrict,
                          gamingMode: e.target.value as StudyGamingMode,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-black text-indigo-900"
                    >
                      {STUDY_GAMING_METHODS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.icon} {m.nameEn} ({m.nameTa})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">தரம் & பாடம் (Grade / Subject):</label>
                    <input
                      type="text"
                      value={activeEditingDistrict.gradeSubject}
                      onChange={(e) =>
                        setActiveEditingDistrict({ ...activeEditingDistrict, gradeSubject: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">வெற்றி XP (Points):</label>
                    <input
                      type="number"
                      value={activeEditingDistrict.defaultPoints}
                      onChange={(e) =>
                        setActiveEditingDistrict({
                          ...activeEditingDistrict,
                          defaultPoints: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">பிரசுரிக்கும் நிலை (Status):</label>
                    <select
                      value={activeEditingDistrict.isPublished ? 'published' : 'draft'}
                      onChange={(e) =>
                        setActiveEditingDistrict({
                          ...activeEditingDistrict,
                          isPublished: e.target.value === 'published',
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    >
                      <option value="published">🟢 மாணவர் அரங்கில் நேரலை (Published)</option>
                      <option value="draft">🟡 வரைவு / நிறுத்திவை (Draft)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">⏱️ வினா நேர அளவு (Speed Timer):</label>
                    <select
                      value={activeEditingDistrict.questionTimerSeconds || 20}
                      onChange={(e) =>
                        setActiveEditingDistrict({
                          ...activeEditingDistrict,
                          questionTimerSeconds: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    >
                      <option value={10}>⚡ 10s (Ultra Rush)</option>
                      <option value={15}>🚀 15s (Fast)</option>
                      <option value={20}>⏱️ 20s (Standard)</option>
                      <option value={30}>🕒 30s (Relaxed)</option>
                      <option value={45}>🎯 45s (Pro Focus)</option>
                      <option value={60}>🧠 60s (Deep Logic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">❤️ இதய உயிர்கள் (Hearts Count):</label>
                    <select
                      value={activeEditingDistrict.maxLivesCount || 3}
                      onChange={(e) =>
                        setActiveEditingDistrict({
                          ...activeEditingDistrict,
                          maxLivesCount: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    >
                      <option value={3}>❤️❤️❤️ 3 உயிர்கள் (Default)</option>
                      <option value={5}>❤️❤️❤️❤️❤️ 5 உயிர்கள் (Practice)</option>
                      <option value={1}>❤️ 1 உயிர் (Sudden Death)</option>
                      <option value={99}>♾️ 99 உயிர்கள் (Unlimited)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">🔓 அன்லாக் % (Unlock Target):</label>
                    <select
                      value={activeEditingDistrict.passingAccuracyPercent || 70}
                      onChange={(e) =>
                        setActiveEditingDistrict({
                          ...activeEditingDistrict,
                          passingAccuracyPercent: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    >
                      <option value={50}>50% துல்லியம்</option>
                      <option value={60}>60% துல்லியம்</option>
                      <option value={70}>70% துல்லியம்</option>
                      <option value={80}>80% துல்லியம்</option>
                      <option value={90}>90% துல்லியம்</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">🏆 சவால் நிலை (Difficulty Tier):</label>
                    <select
                      value={activeEditingDistrict.difficultyTier || 'medium'}
                      onChange={(e) =>
                        setActiveEditingDistrict({
                          ...activeEditingDistrict,
                          difficultyTier: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    >
                      <option value="easy">🟢 Easy (1.0x XP)</option>
                      <option value="medium">🔵 Medium (1.25x XP)</option>
                      <option value="hard">🟠 Hard (1.5x XP)</option>
                      <option value="master">🔴 Master (2.0x XP)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions Management Tabs */}
              <div className="px-5 pt-4 bg-white border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {activeEditingDistrict.initialQuestions.map((q, qIdx) => (
                    <button
                      key={q.id || qIdx}
                      type="button"
                      onClick={() => setActiveQuestionTab(qIdx)}
                      className={`px-3 py-1.5 rounded-t-lg text-xs font-bold transition whitespace-nowrap ${
                        activeQuestionTab === qIdx
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      வினா #{qIdx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestionToDistrict}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>வினா சேர்</span>
                </button>
              </div>

              {/* Active Question Editor Body with Trilingual Inputs */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {activeEditingDistrict.initialQuestions[activeQuestionTab] && (() => {
                  const currentQ = activeEditingDistrict.initialQuestions[activeQuestionTab];

                  return (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 text-sm">
                          கேள்வி #{activeQuestionTab + 1} வடிவமைப்பு ({activeEditingDistrict.gamingMode.toUpperCase()} Mode)
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(activeQuestionTab)}
                          className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>வினாவை நீக்கு</span>
                        </button>
                      </div>

                      {/* Question Text (Tamil, English & Sinhala) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">வினா வாசகம் (தமிழ் Prompt):</label>
                          <textarea
                            rows={2}
                            value={currentQ.questionText}
                            onChange={(e) => {
                              const newQs = [...activeEditingDistrict.initialQuestions];
                              newQs[activeQuestionTab].questionText = e.target.value;
                              setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Question Prompt (English):</label>
                          <textarea
                            rows={2}
                            value={currentQ.questionTextEn || ''}
                            placeholder="Optional English prompt..."
                            onChange={(e) => {
                              const newQs = [...activeEditingDistrict.initialQuestions];
                              newQs[activeQuestionTab].questionTextEn = e.target.value;
                              setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">ප්‍රශ්න විස්තරය (සිංහල Prompt):</label>
                          <textarea
                            rows={2}
                            value={currentQ.questionTextSi || ''}
                            placeholder="සිංහල ප්‍රශ්නය..."
                            onChange={(e) => {
                              const newQs = [...activeEditingDistrict.initialQuestions];
                              newQs[activeQuestionTab].questionTextSi = e.target.value;
                              setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* 4 Choices (HNC Arena Gaming Pads) */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-2">
                          4 விடைக் கூறுகள் (HNC Arena Gaming Pads - சரியான விடையைத் தேர்ந்தெடுக்கவும்):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentQ.options.map((opt, oIdx) => {
                            const isCorrect = currentQ.correctIndex === oIdx;

                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border flex flex-col gap-2 ${
                                  isCorrect ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center shrink-0 ${opt.color}`}>
                                    {opt.symbol}
                                  </span>

                                  <input
                                    type="text"
                                    placeholder="தமிழ் விடை (Tamil)"
                                    value={opt.text}
                                    onChange={(e) => {
                                      const newQs = [...activeEditingDistrict.initialQuestions];
                                      newQs[activeQuestionTab].options[oIdx].text = e.target.value;
                                      setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                                    }}
                                    className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newQs = [...activeEditingDistrict.initialQuestions];
                                      newQs[activeQuestionTab].correctIndex = oIdx;
                                      setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] font-black shrink-0 ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {isCorrect ? '✓ சரி' : 'தேர்ந்தெடு'}
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 pl-9">
                                  <input
                                    type="text"
                                    placeholder="English text (Opt)"
                                    value={opt.textEn || ''}
                                    onChange={(e) => {
                                      const newQs = [...activeEditingDistrict.initialQuestions];
                                      newQs[activeQuestionTab].options[oIdx].textEn = e.target.value;
                                      setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                                    }}
                                    className="px-2 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50"
                                  />
                                  <input
                                    type="text"
                                    placeholder="සිංහල පිළිතුර (Opt)"
                                    value={opt.textSi || ''}
                                    onChange={(e) => {
                                      const newQs = [...activeEditingDistrict.initialQuestions];
                                      newQs[activeQuestionTab].options[oIdx].textSi = e.target.value;
                                      setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                                    }}
                                    className="px-2 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hint & Explanation */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">விளக்கக் குறிப்பு (Hint):</label>
                          <input
                            type="text"
                            value={currentQ.hint}
                            onChange={(e) => {
                              const newQs = [...activeEditingDistrict.initialQuestions];
                              newQs[activeQuestionTab].hint = e.target.value;
                              setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">பதில் விளக்கம் (Explanation):</label>
                          <input
                            type="text"
                            value={currentQ.explanation}
                            onChange={(e) => {
                              const newQs = [...activeEditingDistrict.initialQuestions];
                              newQs[activeQuestionTab].explanation = e.target.value;
                              setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">විස්තරය / ඉඟිය (Sinhala Hint / Exp):</label>
                          <input
                            type="text"
                            value={currentQ.hintSi || ''}
                            placeholder="සිංහල ඉඟිය..."
                            onChange={(e) => {
                              const newQs = [...activeEditingDistrict.initialQuestions];
                              newQs[activeQuestionTab].hintSi = e.target.value;
                              setActiveEditingDistrict({ ...activeEditingDistrict, initialQuestions: newQs });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveEditingDistrict(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  ரத்து செய் (Cancel)
                </button>

                <button
                  type="button"
                  onClick={handleSaveDistrictEdits}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>சேமித்து பிரசுரி (Save & Update)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
