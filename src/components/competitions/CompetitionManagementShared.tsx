import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition, CompetitionCategory, CompetitionStatus, CompetitionType } from '../../types';
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
    language,
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
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
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
      comp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.grade && comp.grade.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' ? true : comp.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesGrade = gradeFilter === 'all' ? true : (comp.grade || '').toLowerCase() === gradeFilter.toLowerCase();
    const matchesStatus =
      statusFilter === 'all'
        ? true
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
  const renderStatusBadge = (status: CompetitionStatus) => {
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

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Drafts Pending</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{draftCount}</p>
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

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Grade / Level Filter */}
          <div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Grades / Levels</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="quiz">Quiz (வினாடி வினா - {quizCount})</option>
              <option value="exam">Exam (பரீட்சை)</option>
              <option value="competition">Competition (போட்டி)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
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

                    <div>{renderStatusBadge(comp.status)}</div>
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
              grade: district.gradeSubject.split('•')[0]?.trim() || 'Open (All Grades)',
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
    </div>
  );
};
