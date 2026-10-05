import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  Trophy,
  Users,
  FileCheck,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  FileText,
  Sparkles,
  Video,
  Download,
  MapPin,
} from 'lucide-react';
import { CompetitionEditorModal } from '../competitions/CompetitionEditorModal';
import { Competition, CompetitionType } from '../../types';

interface AdminDashboardViewProps {
  onNavigate: (tab: any) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const { currentAdmin, competitions, students, results, saveCompetition, liveProctorSessions, language, t, openDistrictsStudio } = useApp();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [editorType, setEditorType] = useState<CompetitionType>('Competition');
  const [editorTab, setEditorTab] = useState<'details' | 'schedule' | 'prizes' | 'questions'>('details');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeProctorCount = liveProctorSessions.filter((s) => s.status === 'active').length;

  // Filter competitions supervised by this admin
  const myCompetitions = competitions.filter(
    (c) => c.leadAdminId === currentAdmin.id || c.leadAdminName === currentAdmin.name
  );

  const pendingEvaluations = results.filter(
    (r) => r.publishStatus === 'under_review'
  );

  const totalParticipantsInSupervision = myCompetitions.reduce(
    (sum, c) => sum + c.enrolledCount,
    0
  );

  const openEditor = (type: CompetitionType, tab: 'details' | 'questions' = 'details', compToEdit: Competition | null = null) => {
    setEditingComp(compToEdit);
    setEditorType(type);
    setEditorTab(tab);
    setIsEditorOpen(true);
  };

  const handleSave = async (compData: any) => {
    // Automatically assign current admin as lead supervisor
    const enriched = {
      ...compData,
      leadAdminId: currentAdmin.id,
      leadAdminName: currentAdmin.name,
    };
    await saveCompetition(enriched);
    setSuccessToast(editingComp ? `Updated: ${compData.title}` : `Successfully created ${editorType}: ${compData.title}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 overflow-hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              {t('deptAdminDeck')}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {t('staffIdLabel')}: {currentAdmin.staffId}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 break-words">
            {t('welcomeBack')}, {currentAdmin.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl break-words">
            {currentAdmin.department} — Oversight of assigned Olympiads, candidate submissions evaluation, and question paper curation.
          </p>
        </div>

        {/* Quick Action Buttons: Create Quiz, Create Exam, Create Competition, Paper Studio, Score Submissions, Island Quest */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            id="adm-quick-create-island-quest"
            onClick={() => openDistrictsStudio('create')}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Create Gamified HNC Arena Island Quest (தீவுப் போட்டி உருவாக்கு)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>
              {language === 'ta'
                ? '+ தீவுப் போட்டி'
                : language === 'si'
                ? '+ දූපත් තරඟය'
                : '+ Island Quest'}
            </span>
          </button>

          <button
            id="adm-quick-edu-arena-studio"
            onClick={() => openDistrictsStudio('list')}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-indigo-100 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="HNC Edu-Arena Study Gaming Studio (25 மாவட்டங்கள்)"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-700" />
            <span>
              {language === 'ta'
                ? '🎯 Edu-Arena (25 மாவட்டங்கள்)'
                : language === 'si'
                ? '🎯 Edu-Arena (දිස්ත්‍රික්ක 25)'
                : '🎯 Edu-Arena Studio'}
            </span>
          </button>

          <button
            id="adm-quick-add-quiz"
            onClick={() => openEditor('Quiz', 'details')}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors shadow-2xs flex items-center gap-1.5"
            title="Create Timed Speed Quiz (வினாடி வினா)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Quiz</span>
          </button>

          <button
            id="adm-quick-add-exam"
            onClick={() => openEditor('Exam', 'details')}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs flex items-center gap-1.5"
            title="Create Academic Examination (பரீட்சை)"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Exam</span>
          </button>

          <button
            id="adm-quick-add-comp"
            onClick={() => openEditor('Competition', 'details')}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-xs flex items-center gap-1.5"
            title="Create Academic Competition (போட்டி)"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>+ Competition</span>
          </button>

          <button
            id="adm-quick-live-proctor"
            onClick={() => onNavigate('Live Proctoring')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 ${
              activeProctorCount > 0
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
            title="Real-time student webcam monitoring (நேரலை கண்காணிப்பு)"
          >
            <Video className="w-3.5 h-3.5" />
            <span>
              {language === 'ta' ? 'நேரலை கண்காணிப்பு' : 'Live Proctor'}
              {activeProctorCount > 0 ? ` (${activeProctorCount})` : ''}
            </span>
          </button>

          <button
            id="adm-quick-paper-studio"
            onClick={() => openEditor('Exam', 'questions')}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs flex items-center gap-1.5"
            title="Design question papers and scoring rubrics (வினாத்தாள் தயாரிப்பு)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paper Studio</span>
          </button>

          <button
            id="adm-quick-districts-studio"
            onClick={() => onNavigate('Competition Management')}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-700 to-blue-700 text-white hover:from-indigo-800 hover:to-blue-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="இலங்கையின் 25 மாவட்டப் போட்டிகள் & பிரசுரிக்கும் மையம்"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>🎯 25 மாவட்டங்கள்</span>
          </button>

          <button
            id="adm-quick-results"
            onClick={() => onNavigate('Results')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('scoreSubmissionsBtn')}</span>
          </button>

          <button
            id="adm-quick-audit-trail"
            onClick={() => onNavigate('Audit Trail')}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-900 hover:bg-blue-950 text-white transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Total Audit Details & Compliance Dossier (PDF)"
          >
            <Download className="w-3.5 h-3.5 text-blue-300" />
            <span>{language === 'ta' ? 'தணிக்கை PDF' : 'Audit PDF'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-adm-assigned"
          title={t('statAssignedContests')}
          value={myCompetitions.length}
          subtitle={t('statUnderSupervision')}
          icon={Trophy}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-700"
        />
        <StatCard
          id="stat-adm-students"
          title={t('statActiveParticipants')}
          value={totalParticipantsInSupervision}
          subtitle={t('statEnrolledSupervision')}
          icon={Users}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-700"
        />
        <StatCard
          id="stat-adm-evaluations"
          title={t('statPendingEvaluations')}
          value={pendingEvaluations.length}
          subtitle={t('statAwaitingJuryReview')}
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-700"
        />
        <StatCard
          id="stat-adm-results"
          title={t('statGradedRatified')}
          value={results.filter((r) => r.publishStatus === 'published').length}
          subtitle={t('statCertifiedPublished')}
          icon={FileCheck}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-700"
        />
      </div>

      {/* Main Grid: Supervised Contests & Evaluation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Competitions */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('assignedOlympiads')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('assignedPortfolio')}
              </p>
            </div>
            <button
              onClick={() => onNavigate('Competition Management')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {myCompetitions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No competitions assigned currently. Click "+ Quiz", "+ Exam", or "+ Competition" above to create one.
              </p>
            ) : (
              myCompetitions.map((comp) => (
                <div
                  key={comp.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 space-y-3 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {comp.title}
                        </span>
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {comp.code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {comp.competitionType || 'Competition'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{comp.category}</p>
                    </div>
                    <Badge
                      variant={
                        comp.status === 'ongoing' || comp.status === 'Registration Open'
                          ? 'emerald'
                          : comp.status === 'upcoming' || comp.status === 'Published'
                          ? 'blue'
                          : 'amber'
                      }
                      dot
                    >
                      {comp.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Registration Ends
                      </span>
                      <span className="font-semibold text-slate-700">
                        {comp.registrationEnd || comp.registrationDeadline || 'TBD'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Duration
                      </span>
                      <span className="font-semibold text-slate-700">
                        {comp.duration || 60} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Questions
                      </span>
                      <span className="font-semibold text-slate-700">
                        {comp.questions?.length || 0} items
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Enrolled Candidates
                      </span>
                      <span className="font-semibold text-slate-700">
                        {comp.enrolledCount}
                      </span>
                    </div>
                  </div>

                  {/* Actions for this specific competition */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => openEditor((comp.competitionType as any) || 'Exam', 'questions', comp)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                    >
                      Paper Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditor((comp.competitionType as any) || 'Competition', 'details', comp)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                    >
                      Edit Paper
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Submissions Evaluation Queue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Evaluation Queue
              </h2>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {pendingEvaluations.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {pendingEvaluations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                All assigned candidate submissions are fully evaluated and ratified.
              </p>
            ) : (
              pendingEvaluations.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {item.studentName}
                    </span>
                    <Badge variant="amber">Review</Badge>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                    <p className="font-medium text-slate-800">{item.competitionTitle}</p>
                    <p className="text-slate-500 mt-0.5 italic">
                      "{item.feedback || 'Jury evaluation pending final rubric ratification.'}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      Draft Score: {item.score}/{item.maxScore}
                    </span>
                    <button
                      onClick={() => onNavigate('Results')}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Open Rubric →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Embedded Competition / Quiz / Exam / Question Studio Modal */}
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
          onSave={handleSave}
        />
      )}
    </div>
  );
};
