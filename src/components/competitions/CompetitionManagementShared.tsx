import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition, CompetitionCategory, CompetitionStatus, CompetitionType, QuestionItem } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { APP_LOGO } from '../../assets/logo';
import {
  Trophy,
  Plus,
  Search,
  Calendar,
  Users,
  Clock,
  Award,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Filter,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileText,
  Sparkles,
  Share2,
  MapPin,
  Globe,
} from 'lucide-react';
import { CompetitionEditorModal } from './CompetitionEditorModal';
import { CompetitionPreviewModal } from './CompetitionPreviewModal';
import { CompetitionParticipantsModal } from './CompetitionParticipantsModal';
import { SriLankanAiExamGeneratorModal } from './SriLankanAiExamGeneratorModal';
import { AutoAiCompetitionGeneratorModal } from './AutoAiCompetitionGeneratorModal';
import { ShareModal } from '../common/ShareModal';
import { DistrictsCompetitionStudioModal } from '../admin/DistrictsCompetitionStudioModal';
import { SRI_LANKA_25_DISTRICTS } from '../../data/sriLankaDistricts';

interface CompetitionManagementSharedProps {
  role: 'super_admin' | 'admin';
}

export const CompetitionManagementShared: React.FC<CompetitionManagementSharedProps> = ({ role }) => {
  const {
    competitions,
    saveCompetition,
    deleteCompetition,
    updateCompetitionStatus,
    approveCompetitionBySuperAdmin,
    rejectCompetitionBySuperAdmin,
    language,
    currentAdmin,
    isDistrictsStudioOpen,
    setIsDistrictsStudioOpen,
    districtsStudioInitialAction,
    setDistrictsStudioInitialAction,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [editorInitialType, setEditorInitialType] = useState<CompetitionType>('Competition');
  const [editorInitialTab, setEditorInitialTab] = useState<'details' | 'schedule' | 'prizes' | 'questions'>('details');

  const [previewComp, setPreviewComp] = useState<Competition | null>(null);
  const [participantsComp, setParticipantsComp] = useState<Competition | null>(null);
  const [deleteTargetComp, setDeleteTargetComp] = useState<Competition | null>(null);
  const [shareComp, setShareComp] = useState<Competition | null>(null);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isAutoAiModalOpen, setIsAutoAiModalOpen] = useState(false);
  const [rejectTargetComp, setRejectTargetComp] = useState<Competition | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleAiGeneratedImport = (
    newQuestions: QuestionItem[],
    _mode: 'append' | 'replace',
    meta?: any
  ) => {
    const totalMarks = newQuestions.reduce((acc, q) => acc + (q.marks || 2), 0);
    const newComp: Competition = {
      competitionId: `comp_${Date.now()}`,
      title: meta?.title || 'Sri Lankan Academic Examination',
      category: meta?.category || 'Mathematics',
      grade: meta?.grade || 'Grade 10',
      language: (meta?.language || 'Tamil') as any,
      competitionType: 'Exam',
      status: 'Draft',
      duration: meta?.duration || 30,
      questions: newQuestions,
      questionsCount: newQuestions.length,
      totalMarks: totalMarks > 0 ? totalMarks : newQuestions.length * 2,
      createdAt: new Date().toISOString(),
      description: `Official Sri Lankan curriculum examination aligned with ${meta?.curriculumVersion || 'National Standards'}.`,
      examCategory: meta?.examCategory,
      curriculumVersion: meta?.curriculumVersion,
      term: meta?.term,
      gazetteNumber: meta?.gazetteNumber,
    } as any;
    setEditingComp(newComp);
    setEditorInitialType('Exam');
    setEditorInitialTab('questions');
    setIsEditorOpen(true);
    setIsAiGeneratorOpen(false);
    showNotification('✅ Sri Lankan AI questions imported successfully into Question Paper Studio!');
  };

  // Dynamic available categories from actual competitions only
  const availableCategories = Array.from(
    new Set(competitions.map((c) => c.category?.trim()).filter(Boolean) as string[])
  ).sort();

  // Dynamic available grades from actual competitions only
  const availableGrades = Array.from(
    new Set(competitions.map((c) => c.grade?.trim()).filter(Boolean) as string[])
  ).sort();

  // Filter competitions
  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.grade && comp.grade.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' || !categoryFilter.trim()
        ? true
        : comp.category.toLowerCase().includes(categoryFilter.toLowerCase().trim());
    const matchesGrade =
      gradeFilter === 'all' || !gradeFilter.trim()
        ? true
        : (comp.grade || '').toLowerCase().includes(gradeFilter.toLowerCase().trim());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending_approval'
        ? comp.approvalStatus === 'pending_approval' || (comp.status || '').toLowerCase() === 'pending approval'
        : statusFilter === 'rejected'
        ? comp.approvalStatus === 'rejected' || (comp.status || '').toLowerCase() === 'rejected'
        : comp.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType =
      typeFilter === 'all'
        ? true
        : comp.competitionType?.toLowerCase() === typeFilter.toLowerCase();

    const matchesDistrict =
      districtFilter === 'all'
        ? true
        : districtFilter === 'All Island'
        ? !comp.district || comp.district === 'All Island'
        : comp.district === districtFilter;

    return matchesSearch && matchesCategory && matchesGrade && matchesStatus && matchesType && matchesDistrict;
  });

  // KPI calculations
  const totalCount = competitions.length;
  const quizCount = competitions.filter((c) => (c.competitionType || '').toLowerCase() === 'quiz').length;
  const pendingApprovalCount = competitions.filter(
    (c) => c.approvalStatus === 'pending_approval' || (c.status || '').toLowerCase() === 'pending approval'
  ).length;
  const totalQuestionsCount = competitions.reduce(
    (sum, c) => sum + (c.questions?.length || c.questionsCount || 0),
    0
  );
  const activeCount = competitions.filter(
    (c) => c.status === 'Registration Open' || c.status === 'Published' || c.status === 'ongoing'
  ).length;
  const draftCount = competitions.filter((c) => c.status === 'Draft' || c.status === 'draft').length;
  const totalEnrolled = competitions.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);

  // Status badge styling helper
  const renderStatusBadge = (comp: Competition) => {
    const status = comp.status || 'Draft';
    const appStatus = comp.approvalStatus;

    if (appStatus === 'pending_approval' || status === 'Pending Approval') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
          <span>Pending Approval</span>
        </span>
      );
    }
    if (appStatus === 'rejected' || status === 'Rejected') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 shadow-2xs">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Revision Required</span>
        </span>
      );
    }

    const s = status.toLowerCase();
    if (s.includes('draft')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          Draft
        </span>
      );
    }
    if (s.includes('registration open') || s === 'open') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          Registration Open
        </span>
      );
    }
    if (s.includes('published')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          Published
        </span>
      );
    }
    if (s.includes('ongoing')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
          Ongoing
        </span>
      );
    }
    if (s.includes('closed')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          Closed
        </span>
      );
    }
    return <Badge variant="neutral">{status}</Badge>;
  };

  // Status mutation handlers
  const handleQuickStatusChange = async (compId: string, nextStatus: CompetitionStatus) => {
    await updateCompetitionStatus(compId, nextStatus);
    showNotification(`Competition status updated to ${nextStatus}.`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetComp) return;
    await deleteCompetition(deleteTargetComp.id);
    showNotification(`Deleted competition "${deleteTargetComp.title}".`);
    setDeleteTargetComp(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast banner */}
      {statusNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{statusNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 p-2 flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src={APP_LOGO}
              alt="HNC Competition Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Competition & Olympiad Management
              </h1>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                {role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, edit, preview, publish, and evaluate academic challenges with multi-question test engines.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Auto AI Generate: 6 Modes (Quiz, Exam, Competition, Island Quest, Edu Arena, District Quiz) */}
          <button
            type="button"
            id="btn-auto-ai-generate-all-modes"
            onClick={() => setIsAutoAiModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ring-2 ring-amber-300/60"
            title="Auto AI Generate Quiz, Exam, Competition, Island Quest, Edu Arena & District Quiz"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            <span>✨ Auto AI Generate (6 Modes)</span>
          </button>

          {/* Create Quiz Option */}
          <button
            type="button"
            id="btn-create-quiz"
            onClick={() => {
              setEditingComp(null);
              setEditorInitialType('Quiz');
              setEditorInitialTab('details');
              setIsEditorOpen(true);
            }}
            className="px-3 py-2 bg-purple-700 text-white rounded-lg text-xs font-bold hover:bg-purple-800 transition-colors shadow-xs flex items-center gap-1.5"
            title="Create Timed Speed Quiz (வினாடி வினா)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Create Quiz</span>
          </button>

          {/* Create Exam Option */}
          <button
            type="button"
            id="btn-create-exam"
            onClick={() => {
              setEditingComp(null);
              setEditorInitialType('Exam');
              setEditorInitialTab('details');
              setIsEditorOpen(true);
            }}
            className="px-3 py-2 bg-indigo-700 text-white rounded-lg text-xs font-bold hover:bg-indigo-800 transition-colors shadow-xs flex items-center gap-1.5"
            title="Create Official Examination (பரீட்சை)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Create Exam</span>
          </button>

          {/* Create Competition Option */}
          <button
            type="button"
            id="btn-create-competition"
            onClick={() => {
              setEditingComp(null);
              setEditorInitialType('Competition');
              setEditorInitialTab('details');
              setIsEditorOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs flex items-center gap-1.5"
            title="Create National Academic Competition / Olympiad (போட்டி)"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Create Competition</span>
          </button>

          {/* Question Paper Studio Option */}
          <button
            type="button"
            id="btn-open-paper-studio"
            onClick={() => {
              setEditingComp(null);
              setEditorInitialType('Exam');
              setEditorInitialTab('questions');
              setIsEditorOpen(true);
            }}
            className="px-3 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs flex items-center gap-1.5"
            title="Design and assemble question papers with rubrics (வினாத்தாள் தயாரிப்பு)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Question Paper Studio</span>
          </button>

          {/* Sri Lankan AI Auto Quiz & Exam Generator */}
          <button
            type="button"
            id="btn-open-sri-lanka-ai-generator"
            onClick={() => setIsAiGeneratorOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white rounded-lg text-xs font-bold hover:from-blue-800 hover:to-purple-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer ring-1 ring-amber-400/40"
            title="AI Auto Quiz & Exam Generator strictly aligned with Sri Lankan Curricula (e-Thaksalawa, NIE, Gazettes)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {language === 'ta'
                ? '🇱🇰 AI வினாத்தாள் உருவாக்கி'
                : language === 'si'
                ? '🇱🇰 AI විභාග උත්පාදකය'
                : '🇱🇰 AI Exam Generator'}
            </span>
          </button>

          {/* Create Island Quest Option (Kahoot, Quizizz, Trivia Crack, Brain Out) */}
          <button
            type="button"
            id="btn-create-island-quest"
            onClick={() => {
              setDistrictsStudioInitialAction('create');
              setIsDistrictsStudioOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-xs font-bold hover:from-amber-700 hover:to-orange-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Create Gamified HNC Arena Island Quest (தீவுப் போட்டி உருவாக்கு)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>
              {language === 'ta'
                ? '+ தீவுப் போட்டி (Quest)'
                : language === 'si'
                ? '+ දූපත් තරඟය (Quest)'
                : '+ Create Island Quest'}
            </span>
          </button>

          {/* 25 Districts Studio & Study Gaming Arena */}
          <button
            type="button"
            id="btn-open-districts-studio"
            onClick={() => {
              setDistrictsStudioInitialAction('list');
              setIsDistrictsStudioOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-700 to-blue-700 text-white rounded-lg text-xs font-bold hover:from-indigo-800 hover:to-blue-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="HNC Edu-Arena / Study Gaming Mode (இலங்கையின் 25 மாவட்டப் போட்டிகள் அரங்கம்)"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {language === 'ta'
                ? '🎯 HNC Edu-Arena (25 மாவட்டங்கள்)'
                : language === 'si'
                ? '🎯 HNC Edu-Arena (දිස්ත්‍රික්ක 25)'
                : '🎯 HNC Edu-Arena (25 Districts)'}
            </span>
          </button>
        </div>
      </div>

      {/* Subject Specialist Coordinator Banner */}
      {role === 'admin' && (currentAdmin.adminType === 'subject_admin' || currentAdmin.assignedSubject) && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-50 border border-purple-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-purple-950">
                  {language === 'ta' ? 'பாடம் சார்ந்த ஒருங்கிணைப்பாளர் பார்வை' : 'Subject Specialist Coordinator Portal'}
                </p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900 border border-purple-300">
                  {currentAdmin.assignedSubject}
                </span>
              </div>
              <p className="text-[11px] text-purple-700 mt-0.5">
                {language === 'ta'
                  ? `நீங்கள் "${currentAdmin.assignedSubject}" பாடத்திற்கான அங்கீகாரம் பெற்ற பொறுப்பாளர்.`
                  : `You are accredited for "${currentAdmin.assignedSubject}". Filter and manage your specialized challenges.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCategoryFilter(currentAdmin.assignedSubject || 'all')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                categoryFilter.toLowerCase() === (currentAdmin.assignedSubject || '').toLowerCase()
                  ? 'bg-purple-700 text-white shadow-2xs ring-2 ring-purple-300'
                  : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
              }`}
            >
              {language === 'ta' ? `🎯 என் பாடம் (${currentAdmin.assignedSubject})` : `🎯 My Subject (${currentAdmin.assignedSubject})`}
            </button>
            {categoryFilter.toLowerCase() === (currentAdmin.assignedSubject || '').toLowerCase() && (
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                {language === 'ta' ? 'அனைத்தும்' : 'Show All'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Super Admin Approval Queue Banner */}
      {role === 'super_admin' && pendingApprovalCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-2xs">
              <Clock className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight">
                  {language === 'ta'
                    ? `அங்கீகார நிலுவை: ${pendingApprovalCount} கல்வி நிகழ்வுகள் Super Admin அனுமதிக்காகக் காத்திருக்கின்றன`
                    : `Super Admin Approval Queue: ${pendingApprovalCount} contest(s) awaiting authorization`}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white text-amber-950">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5 max-w-xl">
                {language === 'ta'
                  ? 'பாட ஆசிரியர்கள் மற்றும் AI ஆல் உருவாக்கப்பட்ட போட்டிகளை மதிப்பாய்வு செய்து அனுமதிக்கவும். அனுமதிக்கப்பட்ட பின்னரே மாணவர் அரங்கில் காட்சிப்படுத்தப்படும்.'
                  : 'Review submitted question sets, mark schemes, and authorize instant broadcast to student arena. Contests remain hidden from students until authorized.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('pending_approval')}
              className="px-4 py-2 bg-white text-amber-950 font-black rounded-xl text-xs hover:bg-amber-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-amber-700" />
              <span>Review Pending Queue ({pendingApprovalCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Challenges</span>
            <Trophy className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-blue-200 bg-blue-50/30 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
              {language === 'ta' ? 'வினாடி வினாக்கள் (Quizzes)' : language === 'si' ? 'Quiz තරඟ' : 'Quiz Challenges'}
            </span>
            <FileQuestion className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {quizCount} <span className="text-xs font-normal text-slate-500">Quizzes ({totalQuestionsCount} Qs)</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Registration Open</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{activeCount}</p>
        </div>

        <div className={`p-3.5 rounded-xl border shadow-2xs ${pendingApprovalCount > 0 ? 'bg-amber-50/90 border-amber-300' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${pendingApprovalCount > 0 ? 'text-amber-900' : 'text-slate-500'}`}>
              Pending Approval
            </span>
            <Clock className={`w-4 h-4 ${pendingApprovalCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {pendingApprovalCount}{' '}
            <span className="text-xs font-normal text-slate-500">({draftCount} Drafts)</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Total Enrolled</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalEnrolled}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search competition, code, grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Category / Subject (Type Only) */}
          <div className="relative">
            <input
              id="filter-competition-category"
              type="text"
              list="cm-category-suggestions"
              placeholder={language === 'ta' ? 'பாடம் (Type Subject)...' : 'Subject (Type)...'}
              value={categoryFilter === 'all' ? '' : categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value ? e.target.value : 'all')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
            <datalist id="cm-category-suggestions">
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Grade / Level Filter (Type Only) */}
          <div className="relative">
            <input
              id="filter-competition-grade"
              type="text"
              list="cm-grade-suggestions"
              placeholder={language === 'ta' ? 'வகுப்பு (Type Grade)...' : 'Grade (Type)...'}
              value={gradeFilter === 'all' ? '' : gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value ? e.target.value : 'all')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
            <datalist id="cm-grade-suggestions">
              {availableGrades.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="all">All Types (அனைத்து வகைகள்)</option>
              <option value="quiz">Quiz (வினாடி வினா - {quizCount})</option>
              <option value="exam">Exam (பரீட்சை)</option>
              <option value="competition">Competition (போட்டி / ஒலிம்பியாட்)</option>
              <option value="island quest">Island Quest (தீவு வினா வேட்டை)</option>
              <option value="edu arena">Edu Arena (கல்வி அரங்கு)</option>
              <option value="district quiz">District Quiz (மாவட்டப் போட்டி)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="all">All Statuses (அனைத்தும்)</option>
              <option value="pending_approval">⏳ Pending Approval ({pendingApprovalCount})</option>
              <option value="rejected">❌ Revision Required</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="registration open">Registration Open</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* District Scope Filter (25 Districts) */}
          <div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">அனைத்து மாவட்டங்களும் (All)</option>
              <option value="All Island">🌐 அனைத்திலங்கை (National)</option>
              {SRI_LANKA_25_DISTRICTS.map((d) => (
                <option key={d.id} value={d.nameTa}>
                  {d.icon} {d.nameTa} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Competitions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCompetitions.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 p-8 shadow-2xs">
            <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No competitions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or create a new academic competition using the Create Competition button.
            </p>
          </div>
        ) : (
          filteredCompetitions.map((comp) => {
            const questionCount = comp.questions?.length || comp.questionsCount || 0;
            const totalMarks =
              comp.totalMarks ??
              (comp.questions ? comp.questions.reduce((sum, q) => sum + (q.marks || 0), 0) : 0);
            const entryFeeText =
              comp.entryType === 'Paid' ? `LKR ${comp.entryFee?.toLocaleString()}` : 'Free Entry';

            return (
              <div
                key={comp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                {/* Top Row: Category, Type, Status */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900">
                        {comp.competitionType || 'Quiz'}
                      </span>
                      {comp.isAiGenerated && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-purple-100 via-indigo-100 to-pink-100 text-indigo-900 border border-indigo-200 flex items-center gap-1 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>AI: {comp.aiMode ? comp.aiMode.replace('_', ' ').toUpperCase() : 'GENERATED'}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {comp.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {entryFeeText}
                      </span>
                      {comp.membershipRequired && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          Membership Required
                        </span>
                      )}
                    </div>

                    <div>{renderStatusBadge(comp)}</div>
                  </div>

                  {/* Title & Code */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-blue-700 transition-colors">
                      {comp.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="font-mono font-medium text-slate-600">{comp.code}</span>
                      <span>•</span>
                      <span>{comp.grade || 'Open'}</span>
                      <span>•</span>
                      <span>Medium: {comp.language || 'English'}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {comp.district ? `📍 ${comp.district}` : '🌐 அனைத்திலங்கை'}
                      </span>
                    </div>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {comp.description || 'Comprehensive evaluation covering theoretical foundations and advanced exercises.'}
                  </p>

                  {/* Pending Approval / Super Admin Action Box */}
                  {(comp.approvalStatus === 'pending_approval' || (comp.status || '').toLowerCase() === 'pending approval') && (
                    <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-300 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-amber-950 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                          <span>Super Admin Approval Required</span>
                        </span>
                        {comp.leadAdminName && (
                          <span className="text-[10px] text-amber-800 font-medium bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200">
                            By: {comp.leadAdminName}
                          </span>
                        )}
                      </div>

                      {role === 'super_admin' ? (
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={async () => {
                              await approveCompetitionBySuperAdmin(comp.id);
                              showNotification(`🎉 Approved & published "${comp.title}" to Live Student Arena!`);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Approve & Publish Directly</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectTargetComp(comp);
                              setRejectionReason('');
                            }}
                            className="py-1.5 px-3 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject / Revise</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-800 font-medium italic">
                          ⏳ Submitted to Super Admin for approval. Students will not see this contest until approved.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rejected Notice */}
                  {(comp.approvalStatus === 'rejected' || (comp.status || '').toLowerCase() === 'rejected') && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Super Admin Revision Note: </span>
                        <span>{comp.approvalComment || 'Please revise the question paper according to curriculum standards.'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Middle: Details & Meta Strip */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{comp.duration || 60} mins</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-blue-900 bg-blue-50/80 px-2 py-1 rounded border border-blue-200/60 font-semibold truncate">
                    <FileQuestion className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span className="truncate">
                      {comp.competitionType || 'Quiz'}: {questionCount} {language === 'ta' ? 'வினாக்கள்' : language === 'si' ? 'ප්‍රශ්න' : 'Questions'} ({totalMarks} pts)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{comp.enrolledCount || comp.participants?.length || 0} Enrolled</span>
                  </div>
                </div>

                {/* Dates & Prizes line */}
                <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Registration Deadline:</span>
                    <span className="font-semibold text-slate-700">
                      {comp.registrationEnd || comp.registrationDeadline || 'TBD'}
                    </span>
                  </div>
                  {comp.prizesEnabled && comp.prizeDetails?.firstPrize && (
                    <div className="flex items-center justify-between text-amber-900 font-medium">
                      <span>Top Prize:</span>
                      <span className="truncate max-w-[180px]">{comp.prizeDetails.firstPrize}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Quick Status actions: Publish / Unpublish */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {comp.status === 'Draft' ? (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(comp.id, 'Published')}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="போட்டியை உடனடியாக பிரசுரி (Publish Now)"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Publish (பிரசுரி)</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        {comp.status === 'Published' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(comp.id, 'Registration Open')}
                            className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] font-bold transition-colors border border-emerald-200 cursor-pointer"
                          >
                            Open Registration
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(comp.id, 'Draft')}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-medium transition-colors border border-slate-200 cursor-pointer"
                          title="பிரசுரத்தை நிறுத்தி வரைவாக்கு (Unpublish / Draft)"
                        >
                          Unpublish (மறை)
                        </button>
                      </div>
                    )}

                    {/* View Participants */}
                    <button
                      type="button"
                      onClick={() => setParticipantsComp(comp)}
                      className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 hover:bg-purple-100 text-[11px] font-semibold transition-colors border border-purple-200 flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      <span>Candidates ({comp.enrolledCount || comp.participants?.length || 0})</span>
                    </button>
                  </div>

                  {/* Primary Tools: Preview, Question Paper Studio, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingComp(comp);
                        setEditorInitialType((comp.competitionType as any) || 'Competition');
                        setEditorInitialTab('questions');
                        setIsEditorOpen(true);
                      }}
                      title="Question Paper Studio (வினாத்தாள் தயாரிப்பு)"
                      className="px-2 py-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors text-[11px] font-semibold flex items-center gap-1 border border-slate-200"
                    >
                      <FileQuestion className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Paper Studio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewComp(comp)}
                      title="Candidate Preview"
                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShareComp(comp)}
                      title="மாணவர்களுடன் பகிர்க (Share Competition Link)"
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-emerald-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingComp(comp);
                        setEditorInitialType((comp.competitionType as any) || 'Competition');
                        setEditorInitialTab('details');
                        setIsEditorOpen(true);
                      }}
                      title="Edit Competition"
                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTargetComp(comp)}
                      title="Delete Competition"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal (Reusable for Create Quiz, Exam, Competition and Edit) */}
      {isEditorOpen && (
        <CompetitionEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingComp(null);
          }}
          initialCompetition={editingComp}
          initialType={editorInitialType}
          initialTab={editorInitialTab}
          onSave={async (compData) => {
            await saveCompetition(compData);
            showNotification(
              editingComp
                ? `Updated: ${compData.title}`
                : `Successfully created ${editorInitialType}: ${compData.title}`
            );
          }}
        />
      )}

      {/* Preview Modal */}
      {previewComp && (
        <CompetitionPreviewModal
          isOpen={!!previewComp}
          onClose={() => setPreviewComp(null)}
          competition={previewComp}
          onSaveDraft={() => handleQuickStatusChange(previewComp.id, 'Draft')}
          onPublish={() => handleQuickStatusChange(previewComp.id, 'Published')}
        />
      )}

      {/* Participants Modal */}
      {participantsComp && (
        <CompetitionParticipantsModal
          isOpen={!!participantsComp}
          onClose={() => setParticipantsComp(null)}
          competition={participantsComp}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetComp && (
        <Modal
          isOpen={!!deleteTargetComp}
          onClose={() => setDeleteTargetComp(null)}
          title="Delete Competition"
          maxWidthClass="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-900 border border-red-200 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Are you sure you want to delete this competition?</p>
                <p className="text-red-700 mt-1">
                  You are about to delete <strong>{deleteTargetComp.title}</strong> ({deleteTargetComp.code}). This action is permanent and will remove all question items and registrations.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetComp(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-xs"
              >
                Yes, Delete Competition
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Share Modal */}
      {shareComp && (
        <ShareModal
          isOpen={!!shareComp}
          onClose={() => setShareComp(null)}
          competition={shareComp}
        />
      )}

      {/* 25 Districts Studio & Quest Publishing Management Modal */}
      {isDistrictsStudioOpen && (
        <DistrictsCompetitionStudioModal
          isOpen={isDistrictsStudioOpen}
          onClose={() => setIsDistrictsStudioOpen(false)}
          role={role}
          initialAction={districtsStudioInitialAction}
          onCreateFormalCompetition={(district) => {
            const newCode = `HNC-${district.nameEn.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
            const today = new Date();
            const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
            const inThreeWeeks = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
            const inFourWeeks = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000);
            const fmt = (d: Date) => d.toISOString().split('T')[0];

            setEditingComp({
              id: `comp-${district.id}-${Date.now().toString(36)}`,
              code: newCode,
              title: `${district.nameTa} மாவட்டப் போட்டி (${district.gradeSubject})`,
              category: district.gradeSubject.includes('கணிதம்')
                ? 'Mathematics'
                : district.gradeSubject.includes('விஞ்ஞானம்')
                ? 'Science'
                : district.gradeSubject.includes('தமிழ்')
                ? 'Tamil'
                : 'General Knowledge',
              description: district.descriptionTa,
              competitionType: 'Competition',
              grade: district.gradeSubject.split('•')[0]?.trim() || 'Grade 10',
              language: 'Tamil',
              duration: 45,
              entryType: 'Free',
              entryFee: 0,
              status: 'Published',
              enrolledCount: 0,
              district: district.nameTa,
              province: district.provinceTa,
              scope: 'district',
              registrationStart: fmt(today),
              registrationEnd: fmt(inTwoWeeks),
              competitionStart: fmt(inThreeWeeks),
              competitionEnd: fmt(inFourWeeks),
              competitionStartTime: '09:00',
              competitionEndTime: '23:59',
              questions: district.initialQuestions.map((q, idx) => ({
                id: q.id || `q-${idx + 1}`,
                type: 'multiple_choice' as const,
                questionText: q.questionText,
                options: q.options.map((o) => o.text),
                correctAnswer: q.options[q.correctIndex]?.text || '',
                marks: 5,
                order: idx + 1,
                explanation: q.explanation,
              })),
              questionsCount: district.initialQuestions.length,
              totalMarks: district.initialQuestions.length * 5,
            } as any);
            setEditorInitialType('Competition');
            setEditorInitialTab('details');
            setIsEditorOpen(true);
            showNotification(`🎯 ${district.nameTa} போட்டிக்கான வினாத்தாள் எடிட்டரில் தயார்!`);
          }}
        />
      )}

      {/* Sri Lankan AI Auto Quiz & Exam Generator Modal */}
      {isAiGeneratorOpen && (
        <SriLankanAiExamGeneratorModal
          isOpen={isAiGeneratorOpen}
          onClose={() => setIsAiGeneratorOpen(false)}
          onImportQuestions={handleAiGeneratedImport}
          existingCount={0}
          initialGrade="Grade 10"
          initialSubject="Mathematics"
          initialLanguage="Tamil"
        />
      )}

      {/* Super Admin Rejection / Revision Request Modal */}
      {rejectTargetComp && (
        <Modal
          isOpen={!!rejectTargetComp}
          onClose={() => setRejectTargetComp(null)}
          title="Request Revisions / Reject Competition"
          maxWidthClass="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Returning "{rejectTargetComp.title}" for Revision</p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Specify the academic corrections or reasons for revision. The author / coordinator will see this feedback in their portal.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Reason / Revision Feedback (கருத்து):</label>
              <textarea
                rows={3}
                placeholder="e.g. Please verify question 4 options, adjust time duration to 30 mins, or align with NIE Grade 10 Term 2 competencies..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectTargetComp(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const reason = rejectionReason.trim() || 'Curriculum revision requested by Super Admin';
                  await rejectCompetitionBySuperAdmin(rejectTargetComp.id, reason);
                  showNotification(`Returned "${rejectTargetComp.title}" with revision note.`);
                  setRejectTargetComp(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-rose-200" />
                <span>Submit Rejection Note</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Auto AI Competition & Arena Generator Modal (6 Event Modes) */}
      {isAutoAiModalOpen && (
        <AutoAiCompetitionGeneratorModal
          isOpen={isAutoAiModalOpen}
          onClose={() => setIsAutoAiModalOpen(false)}
          role={role}
          onImportToEditor={(compPayload) => {
            setEditingComp(compPayload);
            setEditorInitialType((compPayload.competitionType as any) || 'Quiz');
            setEditorInitialTab('questions');
            setIsEditorOpen(true);
            setIsAutoAiModalOpen(false);
            showNotification('✨ AI Questions imported into Question Paper Studio for fine-tuning!');
          }}
        />
      )}
    </div>
  );
};
