import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition, CompetitionCategory, DbAttempt } from '../../types';
import {
  Trophy,
  Search,
  Calendar,
  Clock,
  Users,
  Award,
  CheckCircle2,
  Eye,
  BookOpen,
  HelpCircle,
  Play,
  Lock,
  FileCheck,
  Sparkles,
  Camera,
  Share2,
} from 'lucide-react';
import { CompetitionDetailsModal } from './CompetitionDetailsModal';
import { CompetitionInstructionsModal } from './CompetitionInstructionsModal';
import { SubmissionConfirmationView } from './SubmissionConfirmationView';
import { CompetitionPaymentModal } from './CompetitionPaymentModal';
import { ExamCameraVerificationModal } from './ExamCameraVerificationModal';
import { CompetitionLeaderboardModal } from '../common/CompetitionLeaderboardModal';
import { ShareModal } from '../common/ShareModal';
import { getCompetitionQuestions } from '../../data/questionPool';
import { GraduationCap, Shield } from 'lucide-react';
import { APP_LOGO } from '../../assets/logo';
import { StudentMembershipModal } from './StudentMembershipModal';
import { DynamicAdBillboard } from '../common/DynamicAdBillboard';
import { isGradeEligible } from '../../lib/gradeUtils';

export const StudentCompetitionsView: React.FC = () => {
  const {
    competitions,
    results,
    currentAuthUser,
    currentStudent,
    registerStudentForCompetition,
    isStudentRegistered,
    hasStudentSubmitted,
    getStudentAttempt,
    startActiveExam,
    isCompetitionPaid,
    isExamVerified,
    isMembershipActiveForStudent,
    membershipSettings,
    setStudentNav,
    language,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'quiz' | 'exam' | 'competition'>('all');
  const [regToast, setRegToast] = useState<string | null>(null);

  // Modal states
  const [detailsComp, setDetailsComp] = useState<Competition | null>(null);
  const [instructionComp, setInstructionComp] = useState<Competition | null>(null);
  const [paymentComp, setPaymentComp] = useState<Competition | null>(null);
  const [verificationComp, setVerificationComp] = useState<Competition | null>(null);
  const [leaderboardComp, setLeaderboardComp] = useState<Competition | null>(null);
  const [shareComp, setShareComp] = useState<Competition | null>(null);
  const [membershipPromptComp, setMembershipPromptComp] = useState<Competition | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState<boolean>(false);
  const [viewingReceipt, setViewingReceipt] = useState<{
    attempt: DbAttempt;
    competition: Competition;
  } | null>(null);

  // Student's academic grade level (e.g. Grade 11 (O/L), Grade 6, etc.)
  const studentGrade = currentStudent?.gradeLevel || currentAuthUser?.grade || 'Grade 6';

  // Visible to students: Published, Registration Open, Ongoing (Real Firestore competitions only)
  // STRICT GRADE FILTER:
  // "குறிப்பிட்ட மாணவருடைய தரங்களுக்கு மட்டுமே அவரவர் டாஸ் போர்டுல பரீட்சைகள் டிஸ்ப்ளே ஆக வேண்டும் ஓபன் அண்ட் கொடுத்தா மட்டும் தான் எல்லா மாணவர்களும் டிஸ்ப்ளே ஆகணும்"
  const visibleCompetitions = competitions.filter((comp) => {
    const s = (comp.status || '').toLowerCase();
    const isPublished = !s.includes('draft') && !s.includes('closed');
    if (!isPublished) return false;

    // Strict: Only matches student's enrolled grade OR competition is Open to all grades
    return isGradeEligible(comp.grade, studentGrade);
  });

  // Dynamic categories extracted from actual competitions
  const categories: string[] = Array.from(
    new Set(visibleCompetitions.map((c) => c.category?.trim()).filter(Boolean) as string[])
  ).sort();

  const quizCompetitionsCount = visibleCompetitions.filter(
    (c) => (c.competitionType || '').toLowerCase() === 'quiz'
  ).length;

  const filteredCompetitions = visibleCompetitions.filter((comp) => {
    // 1. Search Term (searches title, code, category, and grade level)
    const matchesSearch =
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.grade && comp.grade.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Category Filter
    const matchesCategory =
      categoryFilter === 'all' ? true : comp.category.toLowerCase() === categoryFilter.toLowerCase();

    // 3. Type Filter
    const matchesType =
      typeFilter === 'all' ? true : (comp.competitionType || '').toLowerCase() === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleRegister = (comp: Competition) => {
    // Check membership eligibility if membership is required
    if (comp.membershipRequired && !isMembershipActiveForStudent()) {
      setMembershipPromptComp(comp);
      return;
    }

    // For Paid competitions: check payment first
    const isPaid = comp.entryType === 'Paid' && comp.entryFee && comp.entryFee > 0;
    if (isPaid && !isCompetitionPaid(comp.id)) {
      setPaymentComp(comp);
      return;
    }

    // For Free competitions: register directly
    const success = registerStudentForCompetition(comp.id);
    if (success) {
      setRegToast(`Successfully registered for ${comp.title}! You can now start the competition.`);
      setTimeout(() => setRegToast(null), 4000);
    }
  };

  const handleStartFlow = (comp: Competition) => {
    if (hasStudentSubmitted(comp.id)) return;

    // Check membership eligibility if membership is required
    if (comp.membershipRequired && !isMembershipActiveForStudent()) {
      setDetailsComp(null);
      setMembershipPromptComp(comp);
      return;
    }

    // Check payment for paid competitions
    const isPaid = comp.entryType === 'Paid' && comp.entryFee && comp.entryFee > 0;
    if (isPaid && !isCompetitionPaid(comp.id)) {
      setDetailsComp(null);
      setPaymentComp(comp);
      return;
    }

    setDetailsComp(null);
    setInstructionComp(comp);
  };

  const handleStartNowFromInstructions = async () => {
    if (!instructionComp) return;
    const comp = instructionComp;
    setInstructionComp(null);

    // Exam / Competition Photo Verification requirement:
    // If requireCameraVerification is enabled (or legacy Exam default), photo verification is required before starting.
    const requiresCam = typeof comp.requireCameraVerification === 'boolean'
      ? comp.requireCameraVerification
      : comp.competitionType === 'Exam';

    if (requiresCam && !isExamVerified(comp.id)) {
      setVerificationComp(comp);
      return;
    }

    await startActiveExam(comp);
  };

  // If viewing a previous submission receipt
  if (viewingReceipt) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewingReceipt(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition"
          >
            ← Back to Competitions Catalog
          </button>
        </div>
        <SubmissionConfirmationView
          attempt={viewingReceipt.attempt}
          competition={viewingReceipt.competition}
          onReturnToCompetitions={() => setViewingReceipt(null)}
          onViewResults={() => setStudentNav('My Results')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured Dynamic Billboard */}
      <DynamicAdBillboard />

      {/* Page Header */}
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
            <h1 className="text-xl font-bold text-slate-900">
              Academic Olympiads & Competitions
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Discover verified competitions, review test problem scopes, register, and start your exam session.
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto">
          Active Contests: {visibleCompetitions.length}
        </div>
      </div>

      {/* Registration Toast Feedback */}
      {regToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{regToast}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-student-comps"
            type="text"
            placeholder={
              language === 'ta'
                ? 'பாடப்பிரிவு, தலைப்பு அல்லது வகுப்பு வாரியாக தேடவும்...'
                : language === 'si'
                ? 'විෂයය, මාතෘකාව හෝ ශ්‍රේණිය අනුව සොයන්න...'
                : 'Search olympiads by title, subject, grade...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              categoryFilter === 'all'
                ? 'bg-blue-700 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'ta'
              ? 'அனைத்துப் பாடங்களும்'
              : language === 'si'
              ? 'සියලු විෂයයන්'
              : 'All Subjects'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filter Strip: All, Quiz, Exam, Competition */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          {language === 'ta' ? 'வகை:' : language === 'si' ? 'වර්ගය:' : 'Type:'}
        </span>
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            typeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {language === 'ta' ? 'அனைத்தும்' : language === 'si' ? 'සියල්ල' : 'All'} ({visibleCompetitions.length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('quiz')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
            typeFilter === 'quiz'
              ? 'bg-blue-700 text-white shadow-2xs'
              : 'bg-blue-50/70 border border-blue-200 text-blue-800 hover:bg-blue-100'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {language === 'ta' ? 'Quiz வினாடி வினா' : language === 'si' ? 'Quiz ප්‍රශ්නාවලිය' : 'Quiz'} ({quizCompetitionsCount})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('exam')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
            typeFilter === 'exam'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'Exam பரீட்சை' : language === 'si' ? 'Exam විභාගය' : 'Exam'}</span>
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('competition')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
            typeFilter === 'competition'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'Competition போட்டி' : language === 'si' ? 'Competition තරඟය' : 'Competition'}</span>
        </button>
      </div>

      {/* Competitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {competitions.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-3">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {language === 'ta'
                ? 'தற்போது புதிய போட்டிகள் அல்லது தேர்வுகள் அட்டவணைப்படுத்தப்படவில்லை'
                : language === 'si'
                ? 'දැනට නව තරඟ හෝ විභාග කාලසටහන්ගත කර නොමැත'
                : 'No Competitions or Exams Currently Scheduled'}
            </h3>
            <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
              {language === 'ta'
                ? 'பள்ளி அல்லது கல்வி நிர்வாகத்தால் புதிய வினாடி வினாக்கள் (Quizzes), பரீட்சைகள் அல்லது போட்டிகள் வெளியிடப்படும் போது அவை இங்கே நேரடியாகக் காண்பிக்கப்படும்.'
                : language === 'si'
                ? 'පාසල හෝ අධ්‍යාපන පරිපාලනය විසින් නව ප්‍රශ්නාවලි (Quizzes), විභාග හෝ තරඟ ප්‍රකාශයට පත් කළ විට ඒවා මෙහි සෘජුවම දිස්වනු ඇත.'
                : 'When new quizzes, exams, or competitions are published by administrators, they will appear here directly.'}
            </p>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 p-8 shadow-2xs">
            <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">
              {language === 'ta'
                ? 'பொருந்தக்கூடிய போட்டிகள் எதுவும் இல்லை'
                : language === 'si'
                ? 'ගැලපෙන තරඟ හමු නොවීය'
                : 'No matching competitions found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {language === 'ta'
                ? 'தேர்ந்தெடுக்கப்பட்ட வகை அல்லது தேடலில் போட்டிகள் இல்லை. வடிகட்டிகளை மாற்றி மீண்டும் முயற்சிக்கவும்.'
                : language === 'si'
                ? 'වෙනත් ප්‍රවර්ගයක් තෝරා හෝ සෙවුම් පදය වෙනස් කර නැවත උත්සාහ කරන්න.'
                : 'Try adjusting your category filter, competition type, or search query.'}
            </p>
            {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs hover:bg-blue-800 transition"
              >
                {language === 'ta'
                  ? 'வடிகட்டிகளை மீட்டமை (Reset Filters)'
                  : language === 'si'
                  ? 'පෙරහන් යළි සකසන්න (Reset Filters)'
                  : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          filteredCompetitions.map((comp) => {
            const isRegistered = isStudentRegistered(comp.id);
            const isSubmitted = hasStudentSubmitted(comp.id);
            const previousAttempt = getStudentAttempt(comp.id);
            const isPaidComp = comp.entryType === 'Paid' && comp.entryFee && comp.entryFee > 0;
            const hasPaid = isCompetitionPaid(comp.id);

            const questions = getCompetitionQuestions(comp);
            const questionCount = questions.length || comp.questionsCount || 10;
            const totalMarks =
              comp.totalMarks || questions.reduce((sum, q) => sum + (q.marks || 0), 0) || 100;
            const duration = comp.duration || 60;

            return (
              <div
                key={comp.id}
                id={`comp-card-${comp.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 hover:shadow-md transition duration-200"
              >
                <div className="space-y-3">
                  {/* Category & Status Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 p-0.5 shrink-0 flex items-center justify-center">
                        <img
                          src={APP_LOGO}
                          alt="HNC"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {comp.code || `HNC-${comp.id.toUpperCase()}`}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {comp.competitionType || 'Quiz'}
                      </span>
                    </div>

                    {isPaidComp ? (
                      hasPaid ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Paid • LKR {comp.entryFee?.toLocaleString()}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          Fee: LKR {comp.entryFee?.toLocaleString()}
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        Free Entry
                      </span>
                    )}

                    {comp.membershipRequired && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-purple-600" />
                        <span>Membership Pass</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {comp.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs flex-wrap mt-1.5">
                      <span className="font-semibold text-blue-700">{comp.category}</span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        <GraduationCap className="w-3 h-3 text-blue-600" />
                        <span>{comp.grade || 'Open'}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 text-[11px]">{comp.language || 'English'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {comp.description}
                  </p>

                  {/* Metadata Specs */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Duration:</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {duration} mins
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {language === 'ta'
                            ? 'Quiz எண்ணிக்கை:'
                            : language === 'si'
                            ? 'Quiz ප්‍රශ්න ගණන:'
                            : 'Quiz Questions:'}
                        </span>
                      </span>
                      <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {questionCount}{' '}
                        {language === 'ta'
                          ? 'வினாக்கள்'
                          : language === 'si'
                          ? 'ප්‍රශ්න'
                          : 'Questions'}{' '}
                        ({totalMarks} pts)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {language === 'ta'
                            ? 'திகதி / காலம்:'
                            : language === 'si'
                            ? 'දිනය / කාලය:'
                            : 'Date / Window:'}
                        </span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {comp.competitionStart || comp.startDate || (language === 'ta' ? 'இப்போது திறக்கப்பட்டுள்ளது' : language === 'si' ? 'දැන් විවෘතයි' : 'Open Now')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {language === 'ta'
                            ? 'பதிவு விகிதம்:'
                            : language === 'si'
                            ? 'ලියාපදිංචි අනුපාතය:'
                            : 'Enrolled Ratio:'}
                        </span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {comp.enrolledCount || 0} / {comp.maxParticipants || 500}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {language === 'ta'
                            ? 'கேமரா சரிபார்ப்பு:'
                            : language === 'si'
                            ? 'කැමරා සත්‍යාපනය:'
                            : 'Camera Verification:'}
                        </span>
                      </span>
                      <span
                        className={`font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                          (typeof comp.requireCameraVerification === 'boolean'
                            ? comp.requireCameraVerification
                            : comp.competitionType === 'Exam')
                            ? 'text-indigo-800 bg-indigo-50 border border-indigo-200'
                            : 'text-slate-600 bg-slate-50 border border-slate-200'
                        }`}
                      >
                        {(typeof comp.requireCameraVerification === 'boolean'
                          ? comp.requireCameraVerification
                          : comp.competitionType === 'Exam')
                          ? (language === 'ta' ? '📸 தேவை' : language === 'si' ? '📸 අවශ්‍යයි' : '📸 Required')
                          : (language === 'ta' ? '⚡ தேவையில்லை' : language === 'si' ? '⚡ අවශ්‍ය නැත' : '⚡ Not Required')}
                      </span>
                    </div>

                    {comp.prizesEnabled && comp.prizeDetails?.firstPrize && (
                      <div className="flex items-center justify-between text-amber-900">
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {language === 'ta'
                              ? '1ஆம் பரிசு:'
                              : language === 'si'
                              ? '1 වන ත්‍යාගය:'
                              : '1st Prize:'}
                          </span>
                        </span>
                        <span className="font-bold truncate max-w-[140px]">
                          {comp.prizeDetails.firstPrize}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-view-details-${comp.id}`}
                      type="button"
                      onClick={() => setDetailsComp(comp)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {language === 'ta'
                          ? 'விவரங்கள்'
                          : language === 'si'
                          ? 'විස්තර'
                          : 'Details'}
                      </span>
                    </button>

                    <button
                      id={`btn-share-comp-${comp.id}`}
                      type="button"
                      onClick={() => setShareComp(comp)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 border border-blue-200 shadow-2xs"
                      title={language === 'ta' ? 'நண்பர்களுடன் பகிர்' : 'Share Competition'}
                    >
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {language === 'ta'
                          ? 'பகிர்'
                          : language === 'si'
                          ? 'බෙදාගන්න'
                          : 'Share'}
                      </span>
                    </button>
                  </div>

                  {/* Flow buttons based on attempt status */}
                  {isSubmitted ? (
                    // Attempt Control: If student has already submitted, show "Receipt", "Completed", & "Rankings"
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-leaderboard-${comp.id}`}
                        type="button"
                        onClick={() => setLeaderboardComp(comp)}
                        className="p-1.5 text-amber-800 hover:bg-amber-50 rounded-lg transition border border-amber-200"
                        title={
                          language === 'ta'
                            ? 'தரவரிசைப் பட்டியல்'
                            : language === 'si'
                            ? 'නායකත්ව පුවරුව බලන්න'
                            : 'View Official Leaderboard & Rankings'
                        }
                      >
                        <Trophy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-receipt-${comp.id}`}
                        type="button"
                        onClick={() =>
                          previousAttempt &&
                          setViewingReceipt({ attempt: previousAttempt, competition: comp })
                        }
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        title="View Submission Details"
                      >
                        {language === 'ta'
                          ? 'ரசீது'
                          : language === 'si'
                          ? 'රිසිට්පත'
                          : 'Receipt'}
                      </button>
                      <button
                        id={`btn-completed-${comp.id}`}
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {language === 'ta'
                            ? 'முடிவடைந்தது'
                            : language === 'si'
                            ? 'සම්පූර්ණයි'
                            : 'Completed'}
                        </span>
                      </button>
                    </div>
                  ) : isPaidComp && !hasPaid ? (
                    // Paid competition requiring payment
                    <button
                      id={`btn-pay-${comp.id}`}
                      type="button"
                      onClick={() => setPaymentComp(comp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-sm transition"
                    >
                      <span>
                        {language === 'ta'
                          ? `கட்டணம் செலுத்தவும் (LKR ${comp.entryFee?.toLocaleString()})`
                          : language === 'si'
                          ? `ගාස්තුව ගෙවන්න (LKR ${comp.entryFee?.toLocaleString()})`
                          : `Pay Entry Fee (LKR ${comp.entryFee?.toLocaleString()})`}
                      </span>
                    </button>
                  ) : isRegistered ? (
                    // Registered (or Paid & Confirmed): Show "Start Competition"
                    <button
                      id={`btn-start-${comp.id}`}
                      type="button"
                      onClick={() => handleStartFlow(comp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>
                        {comp.competitionType === 'Exam'
                          ? (language === 'ta'
                              ? 'பரீட்சையைத் தொடங்கு'
                              : language === 'si'
                              ? 'විභාගය ආරම්භ කරන්න'
                              : 'Start Exam')
                          : (language === 'ta'
                              ? 'போட்டியைத் தொடங்கு'
                              : language === 'si'
                              ? 'තරඟය ආරම්භ කරන්න'
                              : 'Start Competition')}
                      </span>
                    </button>
                  ) : (
                    // Free competition not yet registered: Show "Register"
                    <button
                      id={`btn-register-${comp.id}`}
                      type="button"
                      onClick={() => handleRegister(comp)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm transition"
                    >
                      {language === 'ta'
                        ? 'பதிவு செய்க'
                        : language === 'si'
                        ? 'ලියාපදිංචි වන්න'
                        : 'Register'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Competition Details Modal */}
      {detailsComp && (
        <CompetitionDetailsModal
          competition={detailsComp}
          isOpen={!!detailsComp}
          onClose={() => setDetailsComp(null)}
          onStartExam={(comp) => handleStartFlow(comp)}
        />
      )}

      {/* Modal 2: Instructions Modal */}
      {instructionComp && (
        <CompetitionInstructionsModal
          competition={instructionComp}
          isOpen={!!instructionComp}
          onClose={() => setInstructionComp(null)}
          onStartNow={handleStartNowFromInstructions}
        />
      )}

      {/* Modal 3: Phase 5 Competition Payment Modal */}
      {paymentComp && (
        <CompetitionPaymentModal
          competition={paymentComp}
          isOpen={!!paymentComp}
          onClose={() => setPaymentComp(null)}
          onPaymentSuccess={(payment) => {
            setPaymentComp(null);
            setRegToast(
              `Payment confirmed (LKR ${payment.amount.toLocaleString()})! Registration active for ${payment.competitionTitle || 'competition'}.`
            );
            setTimeout(() => setRegToast(null), 5000);
          }}
        />
      )}

      {/* Modal 4: Phase 5 Exam Camera Verification Modal */}
      {verificationComp && (
        <ExamCameraVerificationModal
          competition={verificationComp}
          isOpen={!!verificationComp}
          onClose={() => setVerificationComp(null)}
          onVerified={async () => {
            const comp = verificationComp;
            setVerificationComp(null);
            setRegToast(`Photo verified successfully! Launching ${comp.title}...`);
            setTimeout(() => setRegToast(null), 3000);
            await startActiveExam(comp);
          }}
        />
      )}

      {/* Modal 5: Phase 5 Competition Leaderboard & Rankings Modal */}
      {leaderboardComp && (
        <CompetitionLeaderboardModal
          competition={leaderboardComp}
          results={results}
          currentStudentId={currentAuthUser?.uid || currentStudent.id}
          isOpen={!!leaderboardComp}
          onClose={() => setLeaderboardComp(null)}
        />
      )}

      {/* Share Modal */}
      {shareComp && (
        <ShareModal
          isOpen={!!shareComp}
          onClose={() => setShareComp(null)}
          competition={shareComp}
        />
      )}

      {/* Membership Required Notice Modal */}
      {membershipPromptComp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Active Membership Required
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Active monthly membership is required to participate in{' '}
                <span className="font-semibold text-slate-900">{membershipPromptComp.title}</span>.
                Please activate or renew your subscription to access all protected Olympiads.
              </p>
            </div>
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-xs flex items-center justify-between">
              <span className="font-semibold text-indigo-900">Monthly Pass</span>
              <span className="font-black text-indigo-900">
                {(membershipSettings.monthlyFeeLkr || 1500).toLocaleString()} LKR / Month
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMembershipPromptComp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Dismiss
              </button>
              <button
                type="button"
                id="btn-open-membership-from-comp"
                onClick={() => {
                  setMembershipPromptComp(null);
                  setShowMembershipModal(true);
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Activate / Renew Membership
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Membership Payment Modal */}
      <StudentMembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
      />
    </div>
  );
};
