import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  Users,
  GraduationCap,
  Trophy,
  FileCheck,
  Plus,
  ShieldCheck,
  ArrowUpRight,
  Database,
  Activity,
  Calendar,
  HelpCircle,
  FileText,
  Sparkles,
  CheckCircle2,
  Video,
  Download,
  Eye,
  MapPin,
} from 'lucide-react';
import { CompetitionEditorModal } from '../competitions/CompetitionEditorModal';
import { Competition, CompetitionType } from '../../types';

interface SuperAdminDashboardProps {
  onNavigate: (tab: any) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const {
    admins,
    students,
    competitions,
    results,
    auditLogs,
    superAdminUser,
    currentAuthUser,
    payments,
    saveCompetition,
    liveProctorSessions,
    language,
    t,
    openDistrictsStudio,
  } = useApp();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [editorType, setEditorType] = useState<CompetitionType>('Competition');
  const [editorTab, setEditorTab] = useState<'details' | 'schedule' | 'prizes' | 'questions'>('details');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeProctorCount = liveProctorSessions.filter((s) => s.status === 'active').length;

  const activeCompetitions = competitions.filter(
    (c) => c.status === 'ongoing' || c.status === 'upcoming'
  );
  const publishedResults = results.filter((r) => r.publishStatus === 'published');

  const openEditor = (type: CompetitionType, tab: 'details' | 'questions' = 'details', compToEdit: Competition | null = null) => {
    setEditingComp(compToEdit);
    setEditorType(type);
    setEditorTab(tab);
    setIsEditorOpen(true);
  };

  const handleSave = async (compData: any) => {
    await saveCompetition(compData);
    setSuccessToast(editingComp ? `Updated: ${compData.title}` : `Successfully published ${editorType}: ${compData.title}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* Top Title & Info Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0 flex-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
              Super Admin Operations Control
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {t('welcomeBack')}, {superAdminUser.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              National Platform Command — Overall management of competitions, admin staff accreditations, student records, and sponsor billboards.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Super Admin Level
            </span>
          </div>
        </div>

        {/* Quick Action Studio Toolbar */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡ Quick Action Studio & Operations Toolbar</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
            <button
              id="sa-quick-create-island-quest"
              onClick={() => openDistrictsStudio('create')}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              title="Create Gamified HNC Arena Island Quest (தீவுப் போட்டி உருவாக்கு)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="truncate">
                {language === 'ta'
                  ? '+ தீவுப் போட்டி'
                  : language === 'si'
                  ? '+ දූපත් තරඟය'
                  : '+ Island Quest'}
              </span>
            </button>

            <button
              id="sa-quick-edu-arena-studio"
              onClick={() => openDistrictsStudio('list')}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200/80 hover:bg-indigo-100 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              title="HNC Edu-Arena Study Gaming Studio (25 மாவட்டங்கள்)"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span className="truncate">
                {language === 'ta'
                  ? '🎯 Edu-Arena'
                  : language === 'si'
                  ? '🎯 Edu-Arena'
                  : '🎯 Edu-Arena Studio'}
              </span>
            </button>

            <button
              id="sa-quick-sponsors-ads"
              onClick={() => onNavigate('Sponsors & Ads')}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              title="Create and Manage Sponsor Advertisements (விளம்பர பலகை)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{language === 'ta' ? 'விளம்பரம்' : 'Sponsors & Ads'}</span>
            </button>

            <button
              id="sa-quick-add-quiz"
              onClick={() => openEditor('Quiz', 'details')}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              title="Create Timed Speed Quiz (வினாடி வினா)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>+ Quiz</span>
            </button>

            <button
              id="sa-quick-add-exam"
              onClick={() => openEditor('Exam', 'details')}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200/80 hover:bg-indigo-100 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              title="Create Official Examination (பரீட்சை)"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>+ Exam</span>
            </button>

            <button
              id="sa-quick-add-comp"
              onClick={() => openEditor('Competition', 'details')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-700 hover:bg-blue-800 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              title="Create National Academic Olympiad / Competition (போட்டி)"
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>+ Contest</span>
            </button>

            <button
              id="sa-quick-paper-studio"
              onClick={() => openEditor('Exam', 'questions')}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              title="Design and assemble question papers with rubrics (வினாத்தாள் தயாரிப்பு)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Paper Studio</span>
            </button>

            <button
              id="sa-quick-districts-studio"
              onClick={() => onNavigate('Competition Management')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-700 to-blue-700 text-white hover:from-indigo-800 hover:to-blue-800 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              title="இலங்கையின் 25 மாவட்டப் போட்டிகள் & பிரசுரிக்கும் மையம்"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">25 Districts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-super-admins"
          title={t('statAcademicAdmins')}
          value={admins.length}
          subtitle={`${admins.filter((a) => a.status === 'active').length} ${t('statActiveAccreditations')}`}
          icon={Users}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-700"
        />
        <StatCard
          id="stat-super-students"
          title={t('statRegisteredStudents')}
          value={students.length}
          subtitle={t('statEnrolledInstitutions')}
          icon={GraduationCap}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-700"
        />
        <StatCard
          id="stat-super-competitions"
          title={t('statTotalCompetitions')}
          value={competitions.length}
          subtitle={`${activeCompetitions.length} ${t('statActiveUpcoming')}`}
          icon={Trophy}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-700"
        />
        <StatCard
          id="stat-super-results"
          title={t('statOfficialResults')}
          value={results.length}
          subtitle={`${publishedResults.length} ${t('statApprovedPublished')}`}
          icon={FileCheck}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-700"
        />
      </div>

      {/* Main Grid: Active Competitions & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Competition Oversight Summary */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Active & Upcoming Competition Cycle
              </h2>
              <p className="text-xs text-slate-500">
                Live oversight of national olympiads and challenges
              </p>
            </div>
            <button
              onClick={() => onNavigate('Competition Management')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {competitions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No competitions available. Create a competition to begin.
              </div>
            ) : (
              competitions.slice(0, 4).map((comp) => {
                return (
                  <div
                    key={comp.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {comp.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({comp.code})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {comp.competitionType || 'Competition'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>{comp.category}</span>
                        <span>•</span>
                        <span>{comp.enrolledCount} Enrolled Candidates</span>
                        <span>•</span>
                        <span>{comp.duration || 60} Mins</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('Competition Management')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-md transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Audit Trail & Production Architecture */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  {language === 'ta' ? 'நிர்வாக தணிக்கை பதிவு' : 'Governance Audit Trail'}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No audit logs recorded yet.
                </div>
              ) : (
                auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {log.actorName}
                      </span>
                      <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.action}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {log.target}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigate('Audit Trail')}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {language === 'ta'
                  ? 'முழு தணிக்கை விவரங்கள் & PDF அறிக்கை →'
                  : 'Total Audit Details & Compliance Dossier (PDF) →'}
              </span>
            </button>
          </div>

          {/* Institutional Governance Card */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4.5 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
              <Database className="w-4 h-4 text-blue-700" />
              <span>Production Architecture Active</span>
            </div>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              Standardized RBAC boundaries with Firebase Firestore persistence and real-time synchronisation.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Super Admin Institutional Governance</span>
            </div>
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
