import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition, CompetitionStatus, CompetitionType } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { APP_LOGO } from '../../assets/logo';
import {
  HelpCircle,
  FileText,
  Trophy,
  Plus,
  Search,
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Share2,
  ArrowRight,
  Filter,
  Check,
  Shield,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { CompetitionEditorModal } from '../competitions/CompetitionEditorModal';
import { CompetitionPreviewModal } from '../competitions/CompetitionPreviewModal';
import { ShareModal } from '../common/ShareModal';

interface SubjectAdminPortalProps {
  initialType?: 'Quiz' | 'Exam' | 'Competition';
  onTabChange?: (tab: 'Quiz' | 'Exam' | 'Competition') => void;
}

export const SubjectAdminPortal: React.FC<SubjectAdminPortalProps> = ({
  initialType = 'Quiz',
  onTabChange,
}) => {
  const {
    currentAdmin,
    competitions,
    saveCompetition,
    deleteCompetition,
    updateCompetitionStatus,
    language,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'Quiz' | 'Exam' | 'Competition'>(initialType);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [editorType, setEditorType] = useState<CompetitionType>('Quiz');
  const [editorTab, setEditorTab] = useState<'details' | 'questions'>('details');

  const [previewComp, setPreviewComp] = useState<Competition | null>(null);
  const [shareComp, setShareComp] = useState<Competition | null>(null);
  const [deleteTargetComp, setDeleteTargetComp] = useState<Competition | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Sync prop changes
  React.useEffect(() => {
    if (initialType && initialType !== activeTab) {
      setActiveTab(initialType);
    }
  }, [initialType]);

  const handleTabSelect = (tab: 'Quiz' | 'Exam' | 'Competition') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const assignedSubject = currentAdmin.assignedSubject || currentAdmin.department || 'General';

  // Filter ONLY competitions belonging to this Subject Admin's assigned subject or lead by them
  const subjectCompetitions = competitions.filter((comp) => {
    if (comp.leadAdminId === currentAdmin.id || comp.leadAdminName === currentAdmin.name) {
      return true;
    }
    if (!currentAdmin.assignedSubject) return true;
    const adminSubj = currentAdmin.assignedSubject.toLowerCase().trim();
    const compCat = (comp.category || '').toLowerCase().trim();
    return compCat === adminSubj || compCat.includes(adminSubj) || adminSubj.includes(compCat);
  });

  // Segregate by Quiz, Exam, Competition
  const allQuizzes = subjectCompetitions.filter(
    (c) => (c.competitionType || 'quiz').toLowerCase() === 'quiz'
  );
  const allExams = subjectCompetitions.filter(
    (c) => (c.competitionType || '').toLowerCase() === 'exam'
  );
  const allCompetitions = subjectCompetitions.filter((c) => {
    const t = (c.competitionType || '').toLowerCase();
    return t === 'competition' || (t !== 'quiz' && t !== 'exam');
  });

  // Current tab items
  const currentTabPool =
    activeTab === 'Quiz' ? allQuizzes : activeTab === 'Exam' ? allExams : allCompetitions;

  // Available grades for this subject
  const availableGrades = Array.from(
    new Set(currentTabPool.map((c) => c.grade?.trim()).filter(Boolean) as string[])
  ).sort();

  // Filtered by search, grade, status
  const displayedItems = currentTabPool.filter((comp) => {
    const matchesSearch =
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.grade && comp.grade.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGrade =
      gradeFilter === 'all' || !gradeFilter.trim()
        ? true
        : (comp.grade || '').toLowerCase().includes(gradeFilter.toLowerCase().trim());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : comp.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Open editor pre-configured for this subject and type
  const openEditor = (
    type: CompetitionType,
    tab: 'details' | 'questions' = 'details',
    itemToEdit: Competition | null = null
  ) => {
    setEditingComp(itemToEdit);
    setEditorType(type);
    setEditorTab(tab);
    setIsEditorOpen(true);
  };

  const handleSaveItem = async (compData: any) => {
    const enriched = {
      ...compData,
      category: compData.category || assignedSubject,
      leadAdminId: currentAdmin.id,
      leadAdminName: currentAdmin.name,
    };
    await saveCompetition(enriched);
    showNotification(
      editingComp
        ? `Successfully updated ${editorType}: ${compData.title}`
        : `Successfully created ${editorType}: ${compData.title}`
    );
  };

  const handleToggleStatus = async (comp: Competition) => {
    const newStatus: CompetitionStatus =
      comp.status === 'Published' || comp.status === 'Registration Open' || comp.status === 'ongoing'
        ? 'Draft'
        : 'Published';
    await updateCompetitionStatus(comp.id, newStatus);
    showNotification(`Status updated to: ${newStatus}`);
  };

  const confirmDelete = async () => {
    if (!deleteTargetComp) return;
    await deleteCompetition(deleteTargetComp.id);
    showNotification(`Deleted: ${deleteTargetComp.title}`);
    setDeleteTargetComp(null);
  };

  // Status badge styling
  const renderStatusBadge = (status: CompetitionStatus) => {
    const s = status.toLowerCase();
    if (s.includes('draft')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          DRAFT
        </span>
      );
    }
    if (s.includes('closed') || s.includes('ended')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          CLOSED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        ACTIVE
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{statusNotice}</span>
        </div>
      )}

      {/* Header Banner - Exclusively Subject Focused */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 p-2 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-700 text-white shadow-2xs">
                  {language === 'ta' ? 'பாடம் சார்ந்த நிர்வாக மையம்' : 'Subject Admin Hub'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                  {assignedSubject}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  Staff ID: <span className="font-mono font-bold text-slate-700">{currentAdmin.staffId}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {assignedSubject} — {activeTab} {language === 'ta' ? 'மேலாண்மை' : 'Workspace'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {language === 'ta'
                  ? `இவ்வளாகத்தில் "${assignedSubject}" பாடத்திற்கான Quiz, Exam மற்றும் Competition ஆகியவற்றை மட்டுமே உருவாக்கி, வினாத்தாள்களை தயாரித்து நிர்வகிக்கலாம்.`
                  : `Dedicated workspace for ${assignedSubject}. Manage official Quizzes, Exams, and Competitions.`}
              </p>
            </div>
          </div>

          {/* Quick Create Buttons on Header */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              id="sub-adm-btn-create-quiz"
              onClick={() => openEditor('Quiz', 'details')}
              className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Create Timed Quiz (வினாடி வினா)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>+ Quiz</span>
            </button>

            <button
              id="sub-adm-btn-create-exam"
              onClick={() => openEditor('Exam', 'details')}
              className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Create Academic Exam (பரீட்சை)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Exam</span>
            </button>

            <button
              id="sub-adm-btn-create-comp"
              onClick={() => openEditor('Competition', 'details')}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Create Competition (போட்டி)"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>+ Competition</span>
            </button>

            <button
              id="sub-adm-btn-paper-studio"
              onClick={() => openEditor(activeTab, 'questions')}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Paper Studio (வினாத்தாள் தயாரிப்பு)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Paper Studio</span>
            </button>
          </div>
        </div>

        {/* 3 Prominent Exclusive Tabs: Quiz, Exam, Competition */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            id="tab-subject-quiz"
            type="button"
            onClick={() => handleTabSelect('Quiz')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'Quiz'
                ? 'bg-purple-700 text-white shadow-sm ring-1 ring-purple-800'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <HelpCircle className={`w-4 h-4 ${activeTab === 'Quiz' ? 'text-white' : 'text-purple-600'}`} />
            <span>{language === 'ta' ? 'வினாடி வினா (Quiz)' : language === 'si' ? 'Quiz තරඟ' : 'Quizzes (Quiz)'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'Quiz' ? 'bg-purple-900 text-purple-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {allQuizzes.length}
            </span>
          </button>

          <button
            id="tab-subject-exam"
            type="button"
            onClick={() => handleTabSelect('Exam')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'Exam'
                ? 'bg-indigo-700 text-white shadow-sm ring-1 ring-indigo-800'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'Exam' ? 'text-white' : 'text-indigo-600'}`} />
            <span>{language === 'ta' ? 'பரீட்சை (Exam)' : language === 'si' ? 'විභාග (Exam)' : 'Exams (Exam)'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'Exam' ? 'bg-indigo-900 text-indigo-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {allExams.length}
            </span>
          </button>

          <button
            id="tab-subject-competition"
            type="button"
            onClick={() => handleTabSelect('Competition')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'Competition'
                ? 'bg-blue-700 text-white shadow-sm ring-1 ring-blue-800'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Trophy className={`w-4 h-4 ${activeTab === 'Competition' ? 'text-white' : 'text-blue-600'}`} />
            <span>{language === 'ta' ? 'போட்டிகள் (Competition)' : language === 'si' ? 'තරඟ (Competition)' : 'Competitions'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'Competition' ? 'bg-blue-900 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {allCompetitions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="sub-adm-search"
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}s by title or code...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Grade Filter (Direct Typing) */}
            <div className="relative w-1/2 sm:w-44">
              <input
                id="sub-adm-grade-filter"
                type="text"
                list="portal-grade-suggestions"
                placeholder={language === 'ta' ? 'வகுப்பு (Type Grade)...' : 'Filter Grade (Type)...'}
                value={gradeFilter === 'all' ? '' : gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value ? e.target.value : 'all')}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <datalist id="portal-grade-suggestions">
                {availableGrades.map((g) => (
                  <option key={g} value={g} />
                ))}
                <option value="Grade 10" />
                <option value="Grade 11 (O/L)" />
                <option value="Grade 12 (A/L)" />
                <option value="Grade 13 (A/L)" />
                <option value="Grade 6" />
                <option value="Grade 7" />
                <option value="Grade 8" />
                <option value="Grade 9" />
              </datalist>
            </div>

            {/* Status Filter */}
            <select
              id="sub-adm-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-1/2 sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="all">All Status (அனைத்து நிலைகளும்)</option>
              <option value="published">Published / Active (பிரசுரிக்கப்பட்டது)</option>
              <option value="draft">Draft (வரைவு)</option>
              <option value="closed">Closed (முடிந்தது)</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
          <span>
            Showing <strong className="text-slate-800">{displayedItems.length}</strong> of{' '}
            <strong className="text-slate-800">{currentTabPool.length}</strong> {activeTab}s in{' '}
            <span className="font-bold text-purple-700">{assignedSubject}</span>
          </span>
          {searchTerm || gradeFilter !== 'all' || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setGradeFilter('all');
                setStatusFilter('all');
              }}
              className="text-purple-700 hover:text-purple-900 font-semibold underline cursor-pointer"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Main List of Quizzes / Exams / Competitions */}
      {displayedItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
            {activeTab === 'Quiz' ? (
              <HelpCircle className="w-7 h-7" />
            ) : activeTab === 'Exam' ? (
              <FileText className="w-7 h-7" />
            ) : (
              <Trophy className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No {activeTab}s Found in {assignedSubject}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm || gradeFilter !== 'all' || statusFilter !== 'all'
              ? 'No items match your active filters. Try resetting the search or filter options.'
              : `Create your first ${activeTab.toLowerCase()} for "${assignedSubject}" now. Set questions, timing, and marks.`}
          </p>
          <button
            id={`btn-create-first-${activeTab.toLowerCase()}`}
            onClick={() => openEditor(activeTab, 'details')}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New {activeTab}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.map((comp) => {
            const questionCount = comp.questions?.length || comp.questionsCount || 0;
            const totalMarks =
              comp.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || 100;

            return (
              <div
                key={comp.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-purple-800 bg-purple-50 border border-purple-200">
                      {comp.code || comp.id.slice(0, 10).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {renderStatusBadge(comp.status)}
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {comp.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {comp.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {comp.grade || 'Grade 10'}
                      </span>
                      {comp.language && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          {comp.language}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Questions
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {questionCount} Qs
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Duration
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {comp.duration || 60}m
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Enrolled
                      </span>
                      <span className="text-xs font-bold text-purple-700">
                        {comp.enrolledCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditor((comp.competitionType as any) || activeTab, 'questions', comp)}
                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Manage Questions & Question Paper Studio"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Paper Studio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditor((comp.competitionType as any) || activeTab, 'details', comp)}
                      className="px-2.5 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Edit Settings & Schedule"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Details</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewComp(comp)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        title="Preview Candidate Challenge Interface"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShareComp(comp)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        title="Share Challenge Link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(comp)}
                        className={`px-2 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                          comp.status === 'Published' || comp.status === 'Registration Open'
                            ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                            : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title="Toggle Publish / Draft"
                      >
                        {comp.status === 'Published' || comp.status === 'Registration Open'
                          ? 'Set Draft'
                          : 'Publish'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetComp(comp)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Challenge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal for Quiz / Exam / Competition */}
      {isEditorOpen && (
        <CompetitionEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingComp(null);
          }}
          initialCompetition={editingComp}
          initialType={editorType}
          initialTab={editorTab}
          onSave={handleSaveItem}
        />
      )}

      {/* Preview Modal */}
      {previewComp && (
        <CompetitionPreviewModal
          isOpen={Boolean(previewComp)}
          onClose={() => setPreviewComp(null)}
          competition={previewComp}
        />
      )}

      {/* Share Modal */}
      {shareComp && (
        <ShareModal
          isOpen={Boolean(shareComp)}
          onClose={() => setShareComp(null)}
          competition={shareComp}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetComp && (
        <Modal
          isOpen={Boolean(deleteTargetComp)}
          onClose={() => setDeleteTargetComp(null)}
          title={`Delete ${deleteTargetComp.competitionType || 'Challenge'}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold">Are you sure you want to delete this challenge?</p>
                <p>
                  <strong>{deleteTargetComp.title}</strong> ({deleteTargetComp.category} •{' '}
                  {deleteTargetComp.grade})
                </p>
                <p className="text-[11px] text-rose-700">
                  This action cannot be undone. All questions associated with this challenge will also be removed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetComp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
