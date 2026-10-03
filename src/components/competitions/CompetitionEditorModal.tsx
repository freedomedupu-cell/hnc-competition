import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { APP_LOGO } from '../../assets/logo';
import {
  Competition,
  CompetitionCategory,
  CompetitionStatus,
  CompetitionType,
  QuestionItem,
  QuestionType,
  SupportedLanguage,
} from '../../types';
import {
  Trophy,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  BookOpen,
  FileQuestion,
  Eye,
  Sparkles,
  Upload,
  AlertCircle,
  HelpCircle,
  Check,
  Languages,
  Copy,
  ArrowRight,
  Layers,
  Settings2,
  Sliders,
  FileSpreadsheet,
  Camera,
  Video,
  ShieldCheck,
  Shield,
  Zap,
  RefreshCw,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompetitionPreviewModal } from './CompetitionPreviewModal';
import { BulkQuestionImportModal } from './BulkQuestionImportModal';
import { getSampleQuestionsForCategory } from '../../data/questionPool';

interface QuestionEditorCardProps {
  q: QuestionItem;
  idx: number;
  totalQuestions: number;
  onUpdateQuestion: (id: string, updates: Partial<QuestionItem>) => void;
  onDeleteQuestion: (id: string) => void;
  onMoveQuestion: (index: number, direction: 'up' | 'down') => void;
  onDuplicateQuestion: (q: QuestionItem) => void;
  onImageUpload: (qId: string, file: File) => void;
}

const QuestionEditorCard = React.memo<QuestionEditorCardProps>(({
  q,
  idx,
  totalQuestions,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onDuplicateQuestion,
  onImageUpload,
}) => {
  return (
    <div
      key={q.id}
      className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs hover:border-slate-300 transition-colors"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center">
            {idx + 1}
          </span>
          <Badge variant="neutral" className="text-[10px] uppercase font-bold tracking-wider">
            {q.type.replace('_', ' ')}
          </Badge>
          <span className="text-slate-400 text-xs">|</span>
          <div className="flex items-center gap-1">
            <label className="text-[11px] font-semibold text-slate-600">Marks:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={q.marks}
              onChange={(e) => onUpdateQuestion(q.id, { marks: Number(e.target.value) })}
              className="w-14 px-2 py-0.5 border border-slate-200 rounded text-center font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveQuestion(idx, 'up')}
            disabled={idx === 0}
            title="Move Up"
            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 rounded"
          >
            <MoveUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveQuestion(idx, 'down')}
            disabled={idx === totalQuestions - 1}
            title="Move Down"
            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 rounded"
          >
            <MoveDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicateQuestion(q)}
            title="வினாவை நகலெடுக்க (Duplicate Question)"
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteQuestion(q.id)}
            title="Delete Question"
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Prompt */}
      <div>
        <input
          type="text"
          placeholder="Enter the question text / prompt..."
          value={q.questionText}
          onChange={(e) => onUpdateQuestion(q.id, { questionText: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Picture Question image upload / url */}
      {(q.type === 'picture_question' || q.imageUrl) && (
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
              <span>Question Diagram / Picture Reference</span>
            </span>
            <label className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Upload File
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onImageUpload(q.id, e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          <input
            type="url"
            placeholder="Or enter image URL (https://...)"
            value={q.imageUrl || ''}
            onChange={(e) => onUpdateQuestion(q.id, { imageUrl: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {q.imageUrl && (
            <div className="mt-2 max-w-xs rounded-lg overflow-hidden border border-slate-200">
              <img
                src={q.imageUrl}
                alt="Preview"
                className="w-full h-32 object-contain bg-slate-900/5"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>
      )}

      {/* Multiple Choice Options Builder */}
      {(q.type === 'multiple_choice' || q.type === 'picture_question') && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">
              Options (Select the radio button corresponding to the correct answer):
            </span>
            <button
              type="button"
              onClick={() => {
                const curOptions = q.options || [];
                onUpdateQuestion(q.id, {
                  options: [...curOptions, `Option ${String.fromCharCode(65 + curOptions.length)}`],
                });
              }}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Option
            </button>
          </div>

          <div className="space-y-1.5">
            {(q.options || []).map((opt, optIdx) => {
              const isCorrect = q.correctAnswer === opt;
              return (
                <div key={optIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={isCorrect}
                    onChange={() => onUpdateQuestion(q.id, { correctAnswer: opt })}
                    className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    title="Mark as correct answer"
                  />
                  <span className="w-5 text-[11px] font-bold text-slate-500 text-center">
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const nextOptions = [...(q.options || [])];
                      nextOptions[optIdx] = e.target.value;
                      const updates: Partial<QuestionItem> = { options: nextOptions };
                      if (isCorrect) updates.correctAnswer = e.target.value;
                      onUpdateQuestion(q.id, updates);
                    }}
                    className={`flex-1 px-2.5 py-1.5 rounded border text-xs ${
                      isCorrect
                        ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950 font-medium'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  />
                  {(q.options || []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextOptions = (q.options || []).filter((_, i) => i !== optIdx);
                        const updates: Partial<QuestionItem> = { options: nextOptions };
                        if (isCorrect) updates.correctAnswer = nextOptions[0] || '';
                        onUpdateQuestion(q.id, updates);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* True / False Options */}
      {q.type === 'true_false' && (
        <div className="pt-1">
          <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
            Correct Answer:
          </span>
          <div className="flex gap-4">
            {['True', 'False'].map((tfVal) => (
              <label
                key={tfVal}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs cursor-pointer font-semibold transition-all ${
                  q.correctAnswer === tfVal
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name={`tf-${q.id}`}
                  checked={q.correctAnswer === tfVal}
                  onChange={() => onUpdateQuestion(q.id, { correctAnswer: tfVal })}
                  className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>{tfVal}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Short Answer */}
      {q.type === 'short_answer' && (
        <div className="pt-1 space-y-1">
          <label className="text-[11px] font-semibold text-slate-700 block">
            Expected Candidate Answer / Keyword:
          </label>
          <input
            type="text"
            placeholder="e.g. 42 or Photosynthesis"
            value={q.correctAnswer}
            onChange={(e) => onUpdateQuestion(q.id, { correctAnswer: e.target.value })}
            className="w-full max-w-md px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
});

interface CompetitionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompetition?: Competition | null;
  initialType?: CompetitionType;
  initialTab?: 'details' | 'schedule' | 'prizes' | 'questions';
  onSave: (comp: Partial<Competition> & { title: string }) => Promise<void>;
}

export const CompetitionEditorModal: React.FC<CompetitionEditorModalProps> = ({
  isOpen,
  onClose,
  initialCompetition,
  initialType,
  initialTab,
  onSave,
}) => {
  const { language: currentAppLanguage } = useApp();

  const [activeTab, setActiveTab] = useState<'details' | 'schedule' | 'prizes' | 'questions'>(initialTab || 'details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // General fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [competitionType, setCompetitionType] = useState<CompetitionType>('Competition');
  const [category, setCategory] = useState<CompetitionCategory>('Mathematics');
  const [grade, setGrade] = useState('Grade 10');
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [duration, setDuration] = useState<number>(60);
  const [requireCameraVerification, setRequireCameraVerification] = useState<boolean>(false);
  const [requireVideoVerification, setRequireVideoVerification] = useState<boolean>(false);
  const [membershipRequired, setMembershipRequired] = useState<boolean>(false);

  // Schedule & Entry
  const [entryType, setEntryType] = useState<'Free' | 'Paid'>('Free');
  const [entryFee, setEntryFee] = useState<number>(0);
  const [registrationStart, setRegistrationStart] = useState('');
  const [registrationEnd, setRegistrationEnd] = useState('');
  const [competitionStart, setCompetitionStart] = useState('');
  const [competitionEnd, setCompetitionEnd] = useState('');
  const [competitionStartTime, setCompetitionStartTime] = useState('09:00');
  const [competitionEndTime, setCompetitionEndTime] = useState('23:59');

  // Prizes
  const [prizesEnabled, setPrizesEnabled] = useState(true);
  const [firstPrize, setFirstPrize] = useState('');
  const [secondPrize, setSecondPrize] = useState('');
  const [thirdPrize, setThirdPrize] = useState('');
  const [participationCertificate, setParticipationCertificate] = useState('');

  // Questions & Evaluation
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<'Automated' | 'Manual Panel' | 'Hybrid'>('Automated');
  const [isOptionsExpanded, setIsOptionsExpanded] = useState<boolean>(true);
  const [showBulkImportModal, setShowBulkImportModal] = useState<boolean>(false);

  // Guard to prevent re-initialization when modal is already open and user is editing
  const prevOpenRef = useRef(false);
  const prevCompIdRef = useRef<string | undefined>(undefined);
  const isDirtyRef = useRef(false);

  // Auto-save states and initialization refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Non-blocking notification and draft recovery states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmCloseNotice, setConfirmCloseNotice] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [availableDraft, setAvailableDraft] = useState<any>(null);

  // 1. Keep-Alive Ping & Immunity Shield: Ensure session inactivity timeout NEVER fires while user is editing
  useEffect(() => {
    if (!isOpen) {
      try {
        localStorage.removeItem('hnc_exam_editor_active');
      } catch {}
      return;
    }

    try {
      localStorage.setItem('hnc_exam_editor_active', 'true');
    } catch {}

    const pingSession = () => {
      try {
        localStorage.setItem('hnc_session_last_active', String(Date.now()));
        localStorage.setItem('hnc_exam_editor_active', 'true');
      } catch {}
    };
    pingSession();
    const interval = setInterval(pingSession, 5000);

    return () => {
      clearInterval(interval);
      try {
        localStorage.removeItem('hnc_exam_editor_active');
      } catch {}
    };
  }, [isOpen]);

  // Safe Close Handler: Prevents accidental loss of exam creation progress without window.confirm
  const handleSafeClose = () => {
    if (questions.length > 0 && isDirtyRef.current) {
      setConfirmCloseNotice(true);
      return;
    }
    onClose();
  };

  // 2. Prevent accidental browser close or reload when questions exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOpen && (questions.length > 0 || isDirtyRef.current)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, questions.length]);

  // Initialize or reset form only when modal opens or target competition changes
  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      prevCompIdRef.current = undefined;
      return;
    }

    const currentCompId = initialCompetition?.id || (initialCompetition as any)?.competitionId;
    const justOpened = !prevOpenRef.current && isOpen;
    const compChanged = currentCompId !== prevCompIdRef.current;

    if (!justOpened && !compChanged) {
      // Already open and editing the same competition - do not reset user's edits
      return;
    }

    prevOpenRef.current = true;
    prevCompIdRef.current = currentCompId;
    isDirtyRef.current = false;
    isInitialLoadRef.current = true;

    if (initialCompetition) {
      setTitle(initialCompetition.title || '');
      setDescription(initialCompetition.description || '');
      setCompetitionType((initialCompetition.competitionType as any) || 'Competition');
      setCategory(initialCompetition.category || 'Mathematics');
      setGrade(initialCompetition.grade || 'Grade 10');
      setLanguage((initialCompetition.language as any) || 'English');
      setDuration(initialCompetition.duration || 60);

      setEntryType(initialCompetition.entryType || 'Free');
      setEntryFee(initialCompetition.entryFee || 0);
      setRegistrationStart(initialCompetition.registrationStart || initialCompetition.registrationDeadline || '');
      setRegistrationEnd(initialCompetition.registrationEnd || initialCompetition.registrationDeadline || '');
      setCompetitionStart(initialCompetition.competitionStart || initialCompetition.startDate || '');
      setCompetitionEnd(initialCompetition.competitionEnd || initialCompetition.endDate || '');
      setCompetitionStartTime(initialCompetition.competitionStartTime || '09:00');
      setCompetitionEndTime(initialCompetition.competitionEndTime || '23:59');

      setPrizesEnabled(initialCompetition.prizesEnabled ?? true);
      setFirstPrize(initialCompetition.prizeDetails?.firstPrize || '');
      setSecondPrize(initialCompetition.prizeDetails?.secondPrize || '');
      setThirdPrize(initialCompetition.prizeDetails?.thirdPrize || '');
      setParticipationCertificate(initialCompetition.prizeDetails?.participationCertificate || '');

      setEvaluationMode(initialCompetition.evaluationMode || 'Automated');
      setRequireCameraVerification(
        typeof initialCompetition.requireCameraVerification === 'boolean'
          ? initialCompetition.requireCameraVerification
          : initialCompetition.competitionType === 'Exam'
      );
      setRequireVideoVerification(
        typeof initialCompetition.requireVideoVerification === 'boolean'
          ? initialCompetition.requireVideoVerification
          : false
      );
      setMembershipRequired(Boolean(initialCompetition.membershipRequired));
      const rawQs = initialCompetition.questions ? [...initialCompetition.questions] : [];
      const cleanQs = rawQs.filter((q) => {
        const text = (q.questionText || '').toLowerCase();
        const qId = (q.id || '').toLowerCase();
        const isSample =
          text.includes('red planet') ||
          text.includes('interior angles') ||
          text.includes('atomic number 6') ||
          text.includes('sound travels faster') ||
          text.includes('value of (2³') ||
          qId.startsWith('q-sample-') ||
          qId.startsWith('gk-q') ||
          qId.startsWith('math-q') ||
          qId.startsWith('sci-q');
        return !isSample;
      });
      setQuestions(cleanQs);
    } else {
      // Default dates
      const today = new Date();
      const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      const inThreeWeeks = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
      const inFourWeeks = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000);

      const fmt = (d: Date) => d.toISOString().split('T')[0];

      setCategory('Mathematics');
      setGrade('Grade 10');
      setLanguage('English');

      setEntryType('Free');
      setEntryFee(0);
      setRegistrationStart(fmt(today));
      setRegistrationEnd(fmt(inTwoWeeks));
      setCompetitionStart(fmt(inThreeWeeks));
      setCompetitionEnd(fmt(inFourWeeks));
      setEvaluationMode('Automated');

      const determinedType: CompetitionType = initialType || 'Competition';
      setCompetitionType(determinedType);

      if (determinedType === 'Quiz') {
        setTitle('');
        setDescription('');
        setDuration(25);
        setRequireCameraVerification(false);
        setPrizesEnabled(false);
        setFirstPrize('');
        setSecondPrize('');
        setThirdPrize('');
        setParticipationCertificate('');
        setQuestions([]);
      } else if (determinedType === 'Exam') {
        setTitle('');
        setDescription('');
        setDuration(90);
        setRequireCameraVerification(true);
        setPrizesEnabled(false);
        setFirstPrize('');
        setSecondPrize('');
        setThirdPrize('');
        setParticipationCertificate('');
        setQuestions([]);
      } else {
        // Competition
        setTitle('');
        setDescription('');
        setDuration(60);
        setPrizesEnabled(true);
        setFirstPrize('');
        setSecondPrize('');
        setThirdPrize('');
        setParticipationCertificate('');
        setQuestions([]);
      }
    }

    // Check for unsaved local draft if starting fresh
    if (!initialCompetition) {
      try {
        const rawDraft = localStorage.getItem('hnc_exam_editor_draft_v2');
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          if (parsed && (parsed.title || (parsed.questions && parsed.questions.length > 0))) {
            setAvailableDraft(parsed);
            setShowRestorePrompt(true);
          }
        }
      } catch {}
    }

    setActiveTab(initialTab || 'details');
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 200);
    return () => clearTimeout(timer);
  }, [initialCompetition, initialType, initialTab, isOpen]);

  const handleRestoreDraft = () => {
    if (!availableDraft) return;
    if (availableDraft.title) setTitle(availableDraft.title);
    if (availableDraft.description) setDescription(availableDraft.description);
    if (availableDraft.competitionType) setCompetitionType(availableDraft.competitionType);
    if (availableDraft.category) setCategory(availableDraft.category);
    if (availableDraft.grade) setGrade(availableDraft.grade);
    if (availableDraft.language) setLanguage(availableDraft.language);
    if (availableDraft.duration) setDuration(availableDraft.duration);
    if (availableDraft.entryType) setEntryType(availableDraft.entryType);
    if (availableDraft.entryFee !== undefined) setEntryFee(availableDraft.entryFee);
    if (availableDraft.questions && Array.isArray(availableDraft.questions)) {
      setQuestions(availableDraft.questions);
    }
    if (availableDraft.firstPrize) setFirstPrize(availableDraft.firstPrize);
    if (availableDraft.secondPrize) setSecondPrize(availableDraft.secondPrize);
    if (availableDraft.thirdPrize) setThirdPrize(availableDraft.thirdPrize);
    if (availableDraft.participationCertificate) setParticipationCertificate(availableDraft.participationCertificate);
    setShowRestorePrompt(false);
    setAvailableDraft(null);
    setValidationError(null);
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem('hnc_exam_editor_draft_v2');
    } catch {}
    setShowRestorePrompt(false);
    setAvailableDraft(null);
  };

  // 3. Debounced Auto-Save Mechanism for Exam Paper Form (Prevents full-page refreshes while editing)
  useEffect(() => {
    if (!isOpen) return;
    if (isInitialLoadRef.current) return;

    isDirtyRef.current = true;
    setAutoSaveStatus('saving');

    const saveTimer = setTimeout(() => {
      try {
        const draftPayload = {
          title,
          description,
          competitionType,
          category,
          grade,
          language,
          duration,
          requireCameraVerification,
          membershipRequired,
          entryType,
          entryFee,
          prizesEnabled,
          firstPrize,
          secondPrize,
          thirdPrize,
          participationCertificate,
          questions,
          evaluationMode,
          registrationStart,
          registrationEnd,
          competitionStart,
          competitionEnd,
          competitionStartTime,
          competitionEndTime,
          lastSavedAt: Date.now(),
        };
        localStorage.setItem('hnc_exam_editor_draft_v2', JSON.stringify(draftPayload));
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastAutoSavedAt(timeStr);
        setAutoSaveStatus('saved');
      } catch (err) {
        console.warn('Debounced auto-save failed:', err);
      }
    }, 1000); // 1-second debounce delay to collect input changes cleanly

    return () => clearTimeout(saveTimer);
  }, [
    isOpen,
    title,
    description,
    competitionType,
    category,
    grade,
    language,
    duration,
    requireCameraVerification,
    entryType,
    entryFee,
    prizesEnabled,
    firstPrize,
    secondPrize,
    thirdPrize,
    participationCertificate,
    questions,
    evaluationMode,
    registrationStart,
    registrationEnd,
    competitionStart,
    competitionEnd,
    competitionStartTime,
    competitionEndTime,
  ]);

  // Dynamic calculations
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  // Question Management handlers
  const handleAddQuestion = (type: QuestionType) => {
    const newId = `q-${Date.now()}-${questions.length + 1}`;
    let newQ: QuestionItem;

    if (type === 'multiple_choice') {
      newQ = {
        id: newId,
        type: 'multiple_choice',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 5,
        order: questions.length + 1,
      };
    } else if (type === 'true_false') {
      newQ = {
        id: newId,
        type: 'true_false',
        questionText: '',
        options: ['True', 'False'],
        correctAnswer: 'True',
        marks: 5,
        order: questions.length + 1,
      };
    } else if (type === 'short_answer') {
      newQ = {
        id: newId,
        type: 'short_answer',
        questionText: '',
        correctAnswer: '',
        marks: 10,
        order: questions.length + 1,
      };
    } else {
      newQ = {
        id: newId,
        type: 'picture_question',
        questionText: '',
        imageUrl: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 10,
        order: questions.length + 1,
      };
    }

    setQuestions((prev) => [...prev, newQ]);
    setEditingQuestionId(newId);
  };

  const handleUpdateQuestion = useCallback((id: string, updates: Partial<QuestionItem>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }, []);

  const handleDeleteQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setEditingQuestionId((prev) => (prev === id ? null : prev));
  }, []);

  const handleMoveQuestion = useCallback((index: number, direction: 'up' | 'down') => {
    setQuestions((prev) => {
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next.map((q, idx) => ({ ...q, order: idx + 1 }));
    });
  }, []);

  const handleDuplicateQuestion = useCallback((q: QuestionItem) => {
    const newId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setQuestions((prev) => [
      ...prev,
      {
        ...q,
        id: newId,
        order: prev.length + 1,
        questionText: `${q.questionText} (Copy)`,
      },
    ]);
  }, []);

  const handleSetTargetQuestionCount = (targetCount: number) => {
    const count = Math.max(0, Math.min(100, Math.floor(targetCount)));
    if (count === questions.length) return;

    if (count < questions.length) {
      setQuestions((prev) => prev.slice(0, count));
    } else {
      const diff = count - questions.length;
      const startOrder = questions.length;
      const existingMark = questions.length > 0 && questions[0].marks ? questions[0].marks : 5;
      const formatted: QuestionItem[] = Array.from({ length: diff }, (_, idx) => {
        const orderNum = startOrder + idx + 1;
        return {
          id: `q-${Date.now()}-${orderNum}`,
          type: 'multiple_choice',
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          marks: existingMark,
          order: orderNum,
        };
      });
      setQuestions((prev) => [...prev, ...formatted]);
    }
  };

  const handleClearAllQuestions = () => {
    if (questions.length === 0) return;
    setQuestions([]);
    setEditingQuestionId(null);
  };

  const handleBulkImportQuestions = (
    newQuestions: QuestionItem[],
    mode: 'append' | 'replace',
    suggestedTitle?: string
  ) => {
    const sanitized = newQuestions.map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
      imageUrl: q.imageUrl || '',
      explanation: q.explanation || '',
    }));

    if (mode === 'replace' || questions.length === 0) {
      const reindexed = sanitized.map((q, idx) => ({ ...q, order: idx + 1 }));
      setQuestions(reindexed);
    } else {
      const startOrder = questions.length;
      const reindexed = sanitized.map((q, idx) => ({ ...q, order: startOrder + idx + 1 }));
      setQuestions((prev) => [...prev, ...reindexed]);
    }

    if (
      suggestedTitle &&
      (!title.trim() ||
        title.includes('Academic Speed Quiz') ||
        title.includes('Term Examination') ||
        title.includes('National Academic Olympiad') ||
        title.includes('Untitled'))
    ) {
      setTitle(suggestedTitle);
    }
  };

  const handleImageUpload = useCallback((qId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        handleUpdateQuestion(qId, { imageUrl: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  }, [handleUpdateQuestion]);

  // Save competition to context/firestore
  const handleSubmit = async (targetStatus: CompetitionStatus) => {
    setValidationError(null);

    // If Paper Studio created questions without explicit title, assign sensible default
    let effectiveTitle = title.trim();
    if (!effectiveTitle && questions.length > 0) {
      effectiveTitle = `${competitionType} - ${category} (${grade})`;
      setTitle(effectiveTitle);
    }

    if (!effectiveTitle) {
      setValidationError(
        currentAppLanguage === 'ta'
          ? 'வினாத்தாள் / போட்டியின் பெயரை (Title) தயவுசெய்து உள்ளிடவும்.'
          : 'Competition / Exam Paper Name is required.'
      );
      if (activeTab !== 'questions') {
        setActiveTab('details');
      }
      return;
    }

    if (entryType === 'Paid' && (!entryFee || entryFee <= 0)) {
      setValidationError(
        currentAppLanguage === 'ta'
          ? 'கட்டணப் போட்டிகளுக்கு செல்லுபடியான நுழைவுக் கட்டணத்தை உள்ளிடவும்.'
          : 'Please specify a valid Entry Fee in LKR for Paid competitions.'
      );
      setActiveTab('schedule');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanQuestions: QuestionItem[] = (questions || []).map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        type: q.type || 'multiple_choice',
        questionText: String(q.questionText || '').trim(),
        options: Array.isArray(q.options) ? q.options.map((o) => String(o || '').trim()).filter(Boolean) : [],
        correctAnswer: String(q.correctAnswer || '').trim(),
        marks: typeof q.marks === 'number' && !isNaN(q.marks) ? q.marks : 1,
        order: idx + 1,
        imageUrl: q.imageUrl || '',
        explanation: q.explanation || '',
      }));

      const finalTotalMarks = cleanQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

      const targetId = initialCompetition?.id || (initialCompetition as any)?.competitionId;
      const compPayload: Partial<Competition> & { title: string } = {
        ...(targetId ? { id: targetId } : {}),
        title: effectiveTitle,
        description: description.trim(),
        competitionType,
        category,
        grade,
        language,
        duration: Number(duration) || 60,
        entryType,
        entryFee: entryType === 'Paid' ? Number(entryFee) : 0,
        prizesEnabled,
        prizeDetails: {
          firstPrize: firstPrize.trim(),
          secondPrize: secondPrize.trim(),
          thirdPrize: thirdPrize.trim(),
          participationCertificate: participationCertificate.trim(),
        },
        registrationStart,
        registrationEnd,
        competitionStart,
        competitionEnd,
        competitionStartTime,
        competitionEndTime,
        registrationDeadline: registrationEnd,
        startDate: competitionStart,
        endDate: competitionEnd,
        status: targetStatus,
        questions: cleanQuestions,
        questionsCount: cleanQuestions.length,
        totalMarks: finalTotalMarks,
        evaluationMode,
        requireCameraVerification,
        requireVideoVerification,
        membershipRequired,
      };

      await onSave(compPayload);

      try {
        localStorage.removeItem('hnc_exam_editor_draft_v2');
      } catch {}
      isDirtyRef.current = false;
      setAutoSaveStatus('idle');

      onClose();
    } catch (err) {
      console.error('Save competition failed:', err);
      setValidationError(
        currentAppLanguage === 'ta'
          ? 'போட்டியை சேமிப்பதில் பிழை ஏற்பட்டது. இணைய இணைப்பை சரிபார்க்கவும்.'
          : 'An error occurred while saving the competition. Please check the network.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compiled object for Preview
  const targetId = initialCompetition?.id || (initialCompetition as any)?.competitionId;
  const currentDraftObject: Partial<Competition> = {
    ...(targetId ? { id: targetId } : {}),
    title: title || 'Untitled Competition Preview',
    description,
    competitionType,
    category,
    grade,
    language,
    duration,
    requireCameraVerification,
    requireVideoVerification,
    membershipRequired,
    entryType,
    entryFee,
    prizesEnabled,
    prizeDetails: {
      firstPrize,
      secondPrize,
      thirdPrize,
      participationCertificate,
    },
    registrationStart,
    registrationEnd,
    competitionStart,
    competitionEnd,
    competitionStartTime,
    competitionEndTime,
    status: initialCompetition?.status || 'Draft',
    questions,
    questionsCount: questions.length,
    totalMarks,
    evaluationMode,
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleSafeClose}
        preventBackdropClose={true}
        title={initialCompetition ? initialCompetition.title : (currentAppLanguage === 'ta' ? 'புதிய போட்டி உருவாக்கல்' : 'Create New Competition')}
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Navigation Tabs with Auto-Save Status Indicator */}
          <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-1 text-xs items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3.5 py-2 font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'details'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Contest Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`px-3.5 py-2 font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'schedule'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>2. Schedule & Entry Fee</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('prizes')}
                className={`px-3.5 py-2 font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'prizes'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>3. Prizes & Honors</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`px-3.5 py-2 font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'questions'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                <span>4. Question Builder ({questions.length})</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900 text-[10px] font-bold">
                  {totalMarks} pts
                </span>
              </button>
            </div>

            {/* Debounced Auto-Save Status Indicator */}
            <div className="shrink-0 pb-1">
              {autoSaveStatus === 'saving' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                  <span>
                    {currentAppLanguage === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving draft...'}
                  </span>
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>
                    {currentAppLanguage === 'ta'
                      ? `வரைவு சேமிக்கப்பட்டது (${lastAutoSavedAt || ''})`
                      : `Draft auto-saved (${lastAutoSavedAt || ''})`}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Validation Alert Banner */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold">{validationError}</span>
              </div>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-red-500 hover:text-red-800 font-bold px-1.5 py-0.5 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Unsaved Draft Recovery Prompt Banner */}
          {showRestorePrompt && availableDraft && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-xs">
                    {currentAppLanguage === 'ta'
                      ? 'முந்தைய வினாத்தாள் வரைவு (Unsaved Draft) கண்டறியப்பட்டது!'
                      : 'Previous Unsaved Exam Draft Found!'}
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {availableDraft.title ? `"${availableDraft.title}" • ` : ''}
                    {availableDraft.questions?.length || 0} {currentAppLanguage === 'ta' ? 'வினாக்கள்' : 'questions'} •{' '}
                    {currentAppLanguage === 'ta' ? 'சேமிக்கப்பட்ட நேரம்:' : 'Saved at:'}{' '}
                    {new Date(availableDraft.lastSavedAt || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                >
                  {currentAppLanguage === 'ta' ? 'வரைவை மீட்டெடு (Restore)' : 'Restore Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-semibold rounded-lg text-xs transition"
                >
                  {currentAppLanguage === 'ta' ? 'புறக்கணி (Discard)' : 'Discard'}
                </button>
              </div>
            </div>
          )}

          {/* Exit Confirmation Warning Banner */}
          {confirmCloseNotice && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-xs">
                    {currentAppLanguage === 'ta'
                      ? 'வினாத்தாளில் உள்ள வினாக்கள் வரைவாக (Draft) சேமிக்கப்பட்டுள்ளன.'
                      : 'Your questions are saved in local draft.'}
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    {currentAppLanguage === 'ta'
                      ? 'நீங்கள் இப்போது வெளியேற விரும்புகிறீர்களா?'
                      : 'Are you sure you want to close and exit?'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setConfirmCloseNotice(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 transition"
                >
                  {currentAppLanguage === 'ta' ? 'தொடர்ந்து தொகு (Keep Editing)' : 'Keep Editing'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmCloseNotice(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-2xs transition"
                >
                  {currentAppLanguage === 'ta' ? 'ஆம், வெளியேறு (Exit)' : 'Yes, Exit'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Competition Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National High School Mathematics Olympiad 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Description & Syllabus Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed academic challenge scope, assessment criteria, prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Grid 1: Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Competition Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Quiz', 'Exam', 'Competition'] as CompetitionType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setCompetitionType(t);
                          if (t === 'Exam') {
                            setRequireCameraVerification(true);
                          } else if (t === 'Quiz') {
                            setRequireCameraVerification(false);
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                          competitionType === t
                            ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {competitionType === 'Quiz' && 'Fast-paced testing with rapid questions and instant score evaluation.'}
                    {competitionType === 'Exam' && 'Formal academic examination paper with structured syllabus scoring.'}
                    {competitionType === 'Competition' && 'Prestigious Olympiad challenge with honors, awards, and podium rankings.'}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Category (பாடப்பிரிவு / வகை) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Science, Tamil, ICT, History..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Grid 2: Grade, Language, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-800">
                      Grade / Level (வகுப்பு / நிலை) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold">
                      {grade.toLowerCase().includes('open') ? '🌐 Open to All' : `🎯 Only ${grade}`}
                    </span>
                  </div>
                  <input
                    type="text"
                    list="grade-presets-list"
                    required
                    placeholder="e.g. Grade 11 (O/L), Grade 6, Open (All Grades)..."
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-slate-900"
                  />
                  <datalist id="grade-presets-list">
                    <option value="Grade 6" />
                    <option value="Grade 7" />
                    <option value="Grade 8" />
                    <option value="Grade 9" />
                    <option value="Grade 10" />
                    <option value="Grade 11 (O/L)" />
                    <option value="Grade 12 (A/L)" />
                    <option value="Grade 13 (A/L)" />
                    <option value="Open (All Grades)" />
                  </datalist>
                  <p className="text-[10px] text-slate-500 mt-1">
                    குறிப்பிட்ட வகுப்புக்கு மட்டும் தெரிய வேண்டுமெனில் (எ.கா: Grade 11 (O/L)) தெரிவு செய்யவும். அனைத்து மாணவர்களுக்கும் தெரிய வேண்டுமெனில் <strong>Open (All Grades)</strong> என வைக்கவும்.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Language Medium <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Sinhala">Sinhala</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Duration (Minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Camera Access & Student Verification Setting */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {currentAppLanguage === 'ta'
                            ? 'கேமரா அனுமதி & மாணவர் சரிபார்ப்பு (Camera Verification)'
                            : currentAppLanguage === 'si'
                            ? 'කැමරා ප්‍රවේශය සහ සිසුන් සත්‍යාපනය'
                            : 'Camera Access & Student Identity Verification'}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs ${
                            requireCameraVerification
                              ? 'bg-indigo-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {requireCameraVerification
                            ? (currentAppLanguage === 'ta' ? 'தேவை (கட்டாயம்)' : currentAppLanguage === 'si' ? 'අවශ්‍යයි' : 'Required')
                            : (currentAppLanguage === 'ta' ? 'தேவையில்லை (உடனடி)' : currentAppLanguage === 'si' ? 'අවශ්‍ය නැත' : 'Disabled')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {currentAppLanguage === 'ta'
                          ? 'மாணவர்கள் போட்டியைத் தொடங்குவதற்கு முன் கேமரா மூலம் முகப் புகைப்படத்தை சரிபார்க்க வேண்டுமா என்பதை முடிவு செய்யுங்கள்.'
                          : currentAppLanguage === 'si'
                          ? 'තරඟය ආරම්භ කිරීමට පෙර සිසුන්ගේ අනන්‍යතාවය කැමරාවෙන් තහවුරු කළ යුතුද යන්න තෝරන්න.'
                          : 'Configure whether students must submit a real-time webcam identity photo before starting the assessment.'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Toggle switch button */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setRequireCameraVerification(!requireCameraVerification)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        requireCameraVerification ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={requireCameraVerification}
                      title="Toggle Camera Verification"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          requireCameraVerification ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      {requireCameraVerification
                        ? (currentAppLanguage === 'ta' ? 'இயக்கப்பட்டுள்ளது' : 'Enabled')
                        : (currentAppLanguage === 'ta' ? 'முடக்கப்பட்டுள்ளது' : 'Disabled')}
                    </span>
                  </div>
                </div>

                {/* 2 Options Cards: Required vs Disabled */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setRequireCameraVerification(true)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      requireCameraVerification
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-900">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>
                            {currentAppLanguage === 'ta'
                              ? 'கேமரா சரிபார்ப்பைக் கட்டாயமாக்கு'
                              : currentAppLanguage === 'si'
                              ? 'කැමරා සත්‍යාපනය අනිවාර්ය කරන්න'
                              : 'Require Camera Verification'}
                          </span>
                        </span>
                        {requireCameraVerification && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {currentAppLanguage === 'ta'
                          ? 'மாணவர் தேர்வு தொடங்கும் முன் கேமரா அனுமதி வழங்கி செல்ஃபி எடுக்க வேண்டும். ஆள்மாறாட்டத்தை தடுத்து உண்மைத்தன்மையை உறுதி செய்யும்.'
                          : currentAppLanguage === 'si'
                          ? 'විභාගය ආරම්භ කිරීමට පෙර සෙල්ෆි ඡායාරූපයක් ගත යුතුය. වංචා වැළැක්වීම සඳහා සුදුසුය.'
                          : 'Students must verify identity via live webcam selfie before timer starts. Best for formal exams, olympiads, and preventing impersonation.'}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center justify-between text-[10px]">
                      <span className="text-indigo-700 font-semibold">🔒 Anti-Cheating & Audit</span>
                      <span className="text-slate-500">Watermarked ID Photo</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequireCameraVerification(false)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      !requireCameraVerification
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
                          <Zap className="w-4 h-4 text-emerald-600" />
                          <span>
                            {currentAppLanguage === 'ta'
                              ? 'கேமரா தேவையில்லை (உடனடி நுழைவு)'
                              : currentAppLanguage === 'si'
                              ? 'කැමරාවක් අවශ්‍ය නොවේ (ක්ෂණික)'
                              : 'No Camera Required (Instant Start)'}
                          </span>
                        </span>
                        {!requireCameraVerification && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {currentAppLanguage === 'ta'
                          ? 'கேமரா அனுமதி இன்றி மாணவர்கள் நேரடியாக தேர்வுக்கு செல்லலாம். விரைவு வினாடி வினாக்கள் மற்றும் குறைந்த இணைய வேகத்திற்கு ஏற்றது.'
                          : currentAppLanguage === 'si'
                          ? 'කැමරා ප්‍රවේශයකින් තොරව සෘජුවම ප්‍රශ්න ආරම්භ කළ හැක. ඉක්මන් ප්‍රශ්නාවලි සඳහා සුදුසුයි.'
                          : 'Direct entry into questions without webcam prompts. Ideal for quick quizzes, practice tests, and students with low bandwidth.'}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-700 font-semibold">⚡ Fast & Zero Friction</span>
                      <span className="text-slate-500">Direct Entry</span>
                    </div>
                  </button>
                </div>

                {/* Additional Video Verification Toggle */}
                {requireCameraVerification && (
                  <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-3 text-xs mt-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold shadow-2xs">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {currentAppLanguage === 'ta'
                            ? 'வீடியோ சரிபார்ப்பு அனுமதி (Video Verification Access)'
                            : 'Video Verification Access (3s Live Clip)'}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {currentAppLanguage === 'ta'
                            ? 'மாணவர் புகைப்படத்துடன் 3 வினாடி நேரலை வீடியோ பதிவையும் (Live Video Clip) சரிபார்ப்பிற்காக சமர்ப்பிக்க அனுமதிக்கிறது.'
                            : 'Requires a short 3-second live video verification clip along with the identity photo.'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRequireVideoVerification(!requireVideoVerification)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        requireVideoVerification ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={requireVideoVerification}
                      title="Toggle Video Verification"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          requireVideoVerification ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Monthly Membership Requirement Control Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {currentAppLanguage === 'ta'
                            ? 'மாதாந்த அங்கத்துவத் தேவை (Monthly Membership Pass)'
                            : currentAppLanguage === 'si'
                            ? 'මාසික සාමාජිකත්ව අවශ්‍යතාවය'
                            : 'Monthly Membership Pass Requirement'}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs ${
                            membershipRequired
                              ? 'bg-purple-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {membershipRequired ? 'Membership Required: YES' : 'Membership Required: NO'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {currentAppLanguage === 'ta'
                          ? 'மாணவர்கள் இப்போட்டியில் பங்கேற்க செல்லுபடியான மாதாந்த அங்கத்துவம் வைத்திருக்க வேண்டுமா என்பதை நிர்ணயிக்கவும்.'
                          : 'Configure whether students must hold an active monthly subscription pass to participate.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setMembershipRequired(!membershipRequired)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        membershipRequired ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={membershipRequired}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          membershipRequired ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      {membershipRequired ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setMembershipRequired(true)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      membershipRequired
                        ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20 text-purple-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-purple-900">
                          <Shield className="w-3.5 h-3.5 text-purple-600" />
                          <span>Active Subscription Required</span>
                        </span>
                        {membershipRequired && <Check className="w-4 h-4 text-purple-600 font-bold" />}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Only students with an active monthly membership can enroll and take this contest.
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-100 text-[10px] text-purple-700 font-semibold">
                      🔒 Protected for Subscribed Students
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMembershipRequired(false)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      !membershipRequired
                        ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Standard Open Access</span>
                        </span>
                        {!membershipRequired && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        All registered students can enter (free or entry fee paid). No monthly membership needed.
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-100 text-[10px] text-emerald-700 font-semibold">
                      ✨ Standard Entry Rules
                    </div>
                  </button>
                </div>
              </div>

              {/* Quiz Questions Count, Marks & Evaluation Options Strip in Tab 1 */}
              <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                      <FileQuestion className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {currentAppLanguage === 'ta'
                            ? 'Quiz எண்ணிக்கை & மதிப்பீட்டு அமைப்புகள்'
                            : currentAppLanguage === 'si'
                            ? 'Quiz ප්‍රශ්න ගණන සහ ඇගයීම් විකල්ප'
                            : 'Quiz Questions Count & Evaluation Options'}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-700 text-white shadow-2xs">
                          {questions.length} {currentAppLanguage === 'ta' ? 'வினாக்கள்' : currentAppLanguage === 'si' ? 'ප්‍රශ්න' : 'Questions'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        <span className="font-bold text-slate-900">
                          Total Marks: {totalMarks} {currentAppLanguage === 'ta' ? 'புள்ளிகள்' : currentAppLanguage === 'si' ? 'ලකුණු' : 'Points'}
                        </span>
                        {' • '}
                        <span className="text-blue-800 font-medium">
                          {evaluationMode === 'Automated'
                            ? (currentAppLanguage === 'ta'
                                ? 'Questions are evaluated automatically upon submission (தானியங்கி முறை)'
                                : currentAppLanguage === 'si'
                                ? 'ස්වයංක්‍රීය ඇගයීම (Automatic Evaluation)'
                                : 'Questions are evaluated automatically upon submission.')
                            : evaluationMode === 'Manual Panel'
                            ? (currentAppLanguage === 'ta'
                                ? 'Submissions are graded manually by instructor panel (ஆசிரியர் குழு திருத்தம்)'
                                : currentAppLanguage === 'si'
                                ? 'ගුරු මණ්ඩල අතින් ඇගයීම'
                                : 'Submissions are graded manually by instructor panel.')
                            : (currentAppLanguage === 'ta'
                                ? 'Hybrid evaluation with moderator review (தானியங்கி + சரிபார்ப்பு)'
                                : currentAppLanguage === 'si'
                                ? 'දෙමුහුන් ඇගයීම'
                                : 'Hybrid evaluation with moderator review.')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 shadow-2xs ${
                        isOptionsExpanded
                          ? 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
                          : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>
                        {isOptionsExpanded
                          ? (currentAppLanguage === 'ta' ? 'சுருக்குக (Hide)' : 'Collapse')
                          : (currentAppLanguage === 'ta' ? 'விருப்பங்களை மாற்றுக (Edit Options)' : 'Edit Options')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('questions')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-2xs flex items-center gap-1"
                    >
                      <span>{currentAppLanguage === 'ta' ? 'வினாக்கள் பட்டியல்' : 'Questions Builder'} ({questions.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {isOptionsExpanded && (
                  <div className="space-y-3 pt-1">
                    {/* OPTION 1: Question Count Stepper and Presets */}
                    <div className="bg-white/90 rounded-xl p-3 border border-blue-100 shadow-2xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <span>{currentAppLanguage === 'ta' ? '1. Quiz எண்ணிக்கை (Questions Count)' : '1. Quiz Questions Count'}</span>
                          </label>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {currentAppLanguage === 'ta'
                              ? 'வினாக்கள் எண்ணிக்கையை கூட்டவோ குறைக்கவோ மாற்றலாம். வினாக்கள் தானாக சரிசெய்யப்படும்.'
                              : 'Adjust question count. Questions are automatically populated from syllabus or trimmed.'}
                          </p>
                        </div>

                        {/* Stepper Input */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleSetTargetQuestionCount(questions.length - 1)}
                            disabled={questions.length <= 1}
                            className="w-7 h-7 rounded-md bg-white text-slate-800 font-bold hover:bg-slate-200 disabled:opacity-40 transition flex items-center justify-center text-sm shadow-2xs"
                            title="Remove 1 question"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={questions.length}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) handleSetTargetQuestionCount(val);
                            }}
                            className="w-14 text-center font-bold text-sm bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleSetTargetQuestionCount(questions.length + 1)}
                            disabled={questions.length >= 100}
                            className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-40 transition flex items-center justify-center text-sm shadow-2xs"
                            title="Add 1 question"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* OPTION 2: Marks Summary */}
                    <div className="bg-white/90 rounded-xl p-3 border border-blue-100 shadow-2xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            <span>{currentAppLanguage === 'ta' ? '2. மதிப்பெண்கள் அமைப்பு (Total Marks & Points)' : '2. Question Marks & Total Points'}</span>
                          </label>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {currentAppLanguage === 'ta'
                              ? `தற்போதைய மொத்த மதிப்பெண்: ${totalMarks} புள்ளிகள் (${questions.length} வினாக்களுக்கு தனித்தனியாக வழங்கப்பட்ட மதிப்பெண்களின் கூட்டுத்தொகை).`
                              : `Current Total Marks: ${totalMarks} pts across ${questions.length} questions.`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Total: {totalMarks} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* OPTION 3: Evaluation Mode */}
                    <div className="bg-white/90 rounded-xl p-3 border border-blue-100 shadow-2xs space-y-2">
                      <div>
                        <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          <span>{currentAppLanguage === 'ta' ? '3. மதிப்பீட்டு முறை (Evaluation Mode)' : '3. Evaluation Mode & Grading'}</span>
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {currentAppLanguage === 'ta'
                            ? 'தேர்வு சமர்ப்பிக்கப்படும் போது வினாக்கள் எவ்வாறு மதிப்பீடு செய்யப்பட வேண்டும் என்பதைத் தேர்வு செய்யவும்.'
                            : 'Choose whether questions are graded instantly by system or reviewed by instructors.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEvaluationMode('Automated')}
                          className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                            evaluationMode === 'Automated'
                              ? 'bg-blue-50/90 border-blue-600 ring-1 ring-blue-600 text-blue-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs">⚡ {currentAppLanguage === 'ta' ? 'தானியங்கி மதிப்பீடு' : 'Automated Evaluation'}</span>
                            {evaluationMode === 'Automated' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {currentAppLanguage === 'ta'
                              ? 'சமர்ப்பித்தவுடன் கணினி மூலம் உடனடி திருத்தம் மற்றும் முடிவுகள் வெளியீடு (Questions evaluated automatically upon submission).'
                              : 'Questions are evaluated automatically upon submission with instant score calculation.'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEvaluationMode('Manual Panel')}
                          className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                            evaluationMode === 'Manual Panel'
                              ? 'bg-blue-50/90 border-blue-600 ring-1 ring-blue-600 text-blue-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs">✍️ {currentAppLanguage === 'ta' ? 'ஆசிரியர் நேரடித் திருத்தம்' : 'Manual Examiner Review'}</span>
                            {evaluationMode === 'Manual Panel' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {currentAppLanguage === 'ta'
                              ? 'நியமிக்கப்பட்ட ஆசிரியர்கள்/பரீட்சகர்கள் வினாக்களை கைமுறையாக சரிபார்த்து மதிப்பெண் வழங்குவர்.'
                              : 'Submissions are reviewed and graded manually by designated teachers or examiners.'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEvaluationMode('Hybrid')}
                          className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                            evaluationMode === 'Hybrid'
                              ? 'bg-blue-50/90 border-blue-600 ring-1 ring-blue-600 text-blue-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs">🛡️ {currentAppLanguage === 'ta' ? 'கலப்பு முறை' : 'Hybrid Moderation'}</span>
                            {evaluationMode === 'Hybrid' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 leading-snug">
                            {currentAppLanguage === 'ta'
                              ? 'தானியங்கி மதிப்பெண்களுடன் ஆசிரியர் சரிபார்ப்புக்குப் பின் இறுதி முடிவுகள் வெளியிடப்படும்.'
                              : 'Automated initial grading followed by instructor review and score moderation.'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE & ENTRY FEE */}
          {activeTab === 'schedule' && (
            <div className="space-y-5 text-xs">
              {/* Entry Type & Fee */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-700" />
                  <span>Entry Type & Assessment Pricing</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Entry Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Free', 'Paid'] as const).map((et) => (
                        <button
                          key={et}
                          type="button"
                          onClick={() => {
                            setEntryType(et);
                            if (et === 'Free') setEntryFee(0);
                          }}
                          className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                            entryType === et
                              ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {et === 'Free' ? 'Free Entry' : 'Paid Entry'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Entry Fee (LKR) {entryType === 'Paid' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      disabled={entryType === 'Free'}
                      placeholder={entryType === 'Free' ? 'Free for all students' : 'e.g. 1500'}
                      value={entryType === 'Free' ? '' : entryFee}
                      onChange={(e) => setEntryFee(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {entryType === 'Free'
                        ? 'Zero enrollment cost for public participation.'
                        : 'Official registration fee in Sri Lankan Rupees (LKR).'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Registration Window */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Registration Window (பதிவு காலம்)</span>
                  </h4>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      Registration Starts Date (பதிவு ஆரம்பத் திகதி)
                    </label>
                    <input
                      type="date"
                      value={registrationStart}
                      onChange={(e) => setRegistrationStart(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      Registration End Date (பதிவு முடிவுத் திகதி / Deadline)
                    </label>
                    <input
                      type="date"
                      value={registrationEnd}
                      onChange={(e) => setRegistrationEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Competition Window */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Competition Examination Window (போட்டி / தேர்வு காலம் & நேரம்)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Competition Starts Date (ஆரம்பத் திகதி)
                      </label>
                      <input
                        type="date"
                        value={competitionStart}
                        onChange={(e) => setCompetitionStart(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Competition Starts Time (ஆரம்ப நேரம்)
                      </label>
                      <input
                        type="time"
                        value={competitionStartTime}
                        onChange={(e) => setCompetitionStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Competition End Date (முடிவுத் திகதி)
                      </label>
                      <input
                        type="date"
                        value={competitionEnd}
                        onChange={(e) => setCompetitionEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Competition End Time (முடிவு நேரம்)
                      </label>
                      <input
                        type="time"
                        value={competitionEndTime}
                        onChange={(e) => setCompetitionEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIZES & HONORS */}
          {activeTab === 'prizes' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="font-bold text-amber-950">Prize & Certification Structure</h4>
                    <p className="text-[11px] text-amber-800">
                      Enable medals, cash grants, trophies, and digital completion certificates.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={prizesEnabled}
                    onChange={(e) => setPrizesEnabled(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                  <span>Enable Prize Pool</span>
                </label>
              </div>

              {prizesEnabled ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      🥇 First Prize / Gold Honor
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gold Medal, Trophy & LKR 50,000 Cash Award"
                      value={firstPrize}
                      onChange={(e) => setFirstPrize(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      🥈 Second Prize / Silver Honor
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Silver Medal & LKR 30,000"
                      value={secondPrize}
                      onChange={(e) => setSecondPrize(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      🥉 Third Prize / Bronze Honor
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bronze Medal & LKR 15,000"
                      value={thirdPrize}
                      onChange={(e) => setThirdPrize(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      📜 Participation Certificate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified Digital Certificate of Excellence"
                      value={participationCertificate}
                      onChange={(e) => setParticipationCertificate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
                  Prizes are disabled for this competition. Standard participation records will be awarded.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUESTIONS BUILDER */}
          {activeTab === 'questions' && (
            <div className="space-y-4 text-xs">
              {/* Paper Studio Quick Header Config Bar */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                      <span>
                        {currentAppLanguage === 'ta'
                          ? 'வினாத்தாள் / போட்டிப் பெயர் (Paper / Competition Title):'
                          : 'Question Paper / Competition Title:'}{' '}
                        <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        currentAppLanguage === 'ta'
                          ? 'எ.கா. தரம் 10 கணித வினாத்தாள் 2026'
                          : 'e.g. Grade 10 Mathematics Term Test Paper 2026'
                      }
                      className="mt-1 w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">
                        {currentAppLanguage === 'ta' ? 'பாடம் (Subject):' : 'Subject:'}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="mt-0.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        {['Mathematics', 'Science', 'English', 'Environmental Studies', 'Logic & Aptitude', 'History'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">
                        {currentAppLanguage === 'ta' ? 'தரம் (Grade):' : 'Grade:'}
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="mt-0.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        {['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (O/L)', 'A/L', 'Open'].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block">
                        {currentAppLanguage === 'ta' ? 'நேரம் (Time):' : 'Duration:'}
                      </label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          min={5}
                          max={300}
                          value={duration}
                          onChange={(e) => setDuration(Math.max(5, Number(e.target.value)))}
                          className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800"
                        />
                        <span className="text-[10px] text-slate-500 font-medium">mins</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Controls Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileQuestion className="w-5 h-5 text-blue-700" />
                    <div>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                        <span>
                          {currentAppLanguage === 'ta' ? 'Quiz எண்ணிக்கை:' : 'Quiz Questions Count:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-700 text-white shadow-2xs">
                          {questions.length} {currentAppLanguage === 'ta' ? 'வினாக்கள்' : 'Questions'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-2xs">
                          Total: {totalMarks} {currentAppLanguage === 'ta' ? 'புள்ளிகள்' : 'Marks'}
                        </span>
                      </span>
                      <span className="text-slate-500 block text-[11px] mt-0.5">
                        Subject: {category} • Grade: {grade} • Evaluation: {evaluationMode}
                      </span>
                    </div>
                  </div>

                  {/* Stepper and Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleSetTargetQuestionCount(questions.length - 1)}
                        disabled={questions.length <= 1}
                        className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-40 transition flex items-center justify-center text-xs"
                        title="Reduce 1 question"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={questions.length}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) handleSetTargetQuestionCount(val);
                        }}
                        className="w-12 text-center font-bold text-xs bg-white text-slate-900 border-0 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetTargetQuestionCount(questions.length + 1)}
                        disabled={questions.length >= 100}
                        className="w-6 h-6 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-40 transition flex items-center justify-center text-xs"
                        title="Add 1 question"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">Create Question:</span>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('multiple_choice')}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Multiple Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('true_false')}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      True / False
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('short_answer')}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      Short Answer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('picture_question')}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-700" /> Picture Question
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {questions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllQuestions}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Clear all questions"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          {currentAppLanguage === 'ta' ? 'அனைத்தையும் நீக்குக (Empty)' : 'Clear All Questions'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      id="btn-open-bulk-import"
                      onClick={() => setShowBulkImportModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>
                        {currentAppLanguage === 'ta'
                          ? 'மொத்தமாக வினாக்கள் ஏற்று (Excel / Text)'
                          : 'Bulk Upload Questions (Excel / Text)'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {questions.length === 0 ? (
                  <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/80 space-y-3">
                    <FileQuestion className="w-10 h-10 mx-auto text-slate-300" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {currentAppLanguage === 'ta' ? 'வினாத்தாளில் வினாக்கள் எதுவும் இல்லை' : 'Question paper is empty'}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-1 max-w-md mx-auto">
                        {currentAppLanguage === 'ta'
                          ? 'இங்கு வினாக்கள் ஏதும் இல்லை. நீங்கள் புதிதாக வினாவைச் சேர்க்கலாம் அல்லது Excel/Text மூலம் மொத்தமாகப் பதிவேற்றலாம்.'
                          : 'No pre-filled questions. Add single questions or bulk upload from Excel/Text.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowBulkImportModal(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>
                          {currentAppLanguage === 'ta'
                            ? 'Excel / Text மூலம் பதிவேற்றுக (Bulk Upload)'
                            : 'Bulk Upload (Excel / CSV / Text)'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion('multiple_choice')}
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {currentAppLanguage === 'ta' ? 'புதிய வினாவைச் சேர்க்க (Add Question)' : 'Add Single Question'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <QuestionEditorCard
                      key={q.id}
                      q={q}
                      idx={idx}
                      totalQuestions={questions.length}
                      onUpdateQuestion={handleUpdateQuestion}
                      onDeleteQuestion={handleDeleteQuestion}
                      onMoveQuestion={handleMoveQuestion}
                      onDuplicateQuestion={handleDuplicateQuestion}
                      onImageUpload={handleImageUpload}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('Draft')}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('Published')}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <img
                  src={APP_LOGO}
                  alt="HNC Logo"
                  className="w-4 h-4 object-contain filter brightness-0 invert"
                  referrerPolicy="no-referrer"
                />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Competition'}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Embedded Preview Modal */}
      {isPreviewOpen && (
        <CompetitionPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          competition={currentDraftObject}
          onSaveDraft={() => handleSubmit('Draft')}
          onPublish={() => handleSubmit('Published')}
        />
      )}

      {/* Bulk Question Import Modal (Excel / CSV / Text Copy-Paste) */}
      {showBulkImportModal && (
        <BulkQuestionImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onImportQuestions={(newQs, mode, suggestedTitle) => {
            handleBulkImportQuestions(newQs, mode, suggestedTitle);
            setShowBulkImportModal(false);
          }}
          existingCount={questions.length}
          currentLanguage={language === 'Tamil' ? 'ta' : language === 'Sinhala' ? 'si' : 'en'}
          defaultMarks={5}
        />
      )}
    </>
  );
};
