import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SRI_LANKA_25_DISTRICTS,
  PROVINCES_OF_SRI_LANKA,
  SriLankaDistrictInfo,
  DISTRICT_QUEST_STORAGE_KEY,
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
} from 'lucide-react';
import { Competition } from '../../types';

interface DistrictState extends SriLankaDistrictInfo {
  isPublished: boolean;
  isLockedForStudents: boolean;
}

interface DistrictsCompetitionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'super_admin' | 'admin';
  onCreateFormalCompetition?: (district: DistrictState) => void;
}

export const DistrictsCompetitionStudioModal: React.FC<DistrictsCompetitionStudioModalProps> = ({
  isOpen,
  onClose,
  role,
  onCreateFormalCompetition,
}) => {
  const { language } = useApp();

  // Load district settings from storage or initialize
  const [districts, setDistricts] = useState<DistrictState[]>(() => {
    try {
      const saved = localStorage.getItem(DISTRICT_QUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return SRI_LANKA_25_DISTRICTS.map((base) => {
          const match = parsed.find((p: any) => p.id === base.id);
          return {
            ...base,
            isPublished: match ? match.isPublished ?? true : true,
            isLockedForStudents: match ? match.isLockedForStudents ?? (base.levelNumber > 1) : base.levelNumber > 1,
            gradeSubject: match?.gradeSubject || base.gradeSubject,
            defaultPoints: match?.defaultPoints || base.defaultPoints,
            initialQuestions: match?.initialQuestions || base.initialQuestions,
          };
        });
      }
    } catch {}

    return SRI_LANKA_25_DISTRICTS.map((base) => ({
      ...base,
      isPublished: true,
      isLockedForStudents: base.levelNumber > 1,
    }));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [activeEditingDistrict, setActiveEditingDistrict] = useState<DistrictState | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  // Filter districts list
  const filteredDistricts = districts.filter((d) => {
    const matchesSearch =
      d.nameTa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.provinceTa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.provinceEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.gradeSubject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince =
      selectedProvince === 'all'
        ? true
        : PROVINCES_OF_SRI_LANKA.find((p) => p.id === selectedProvince)?.districts.includes(d.id);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'published'
        ? d.isPublished
        : !d.isPublished;

    return matchesSearch && matchesProvince && matchesStatus;
  });

  // Toggle publish status for a district
  const handleTogglePublish = (districtId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = districts.map((d) => {
      if (d.id === districtId) {
        const nextState = !d.isPublished;
        showToast(
          nextState
            ? `🟢 ${d.nameTa} போட்டி வெற்றிகரமாக பிரசுரிக்கப்பட்டது (Published)!`
            : `🟡 ${d.nameTa} போட்டி தற்காலிகமாக மறைக்கப்பட்டது (Unpublished)!`
        );
        return { ...d, isPublished: nextState };
      }
      return d;
    });
    saveDistrictsProgress(updated);
  };

  // Toggle initial lock for students
  const handleToggleLock = (districtId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = districts.map((d) => {
      if (d.id === districtId) {
        return { ...d, isLockedForStudents: !d.isLockedForStudents };
      }
      return d;
    });
    saveDistrictsProgress(updated);
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

  // Add new question to editing district
  const handleAddQuestionToDistrict = () => {
    if (!activeEditingDistrict) return;
    const newQId = `q_${activeEditingDistrict.id}_${Date.now()}`;
    const newQuestion = {
      id: newQId,
      questionText: 'புதிய வினாத் தொடர்...',
      options: [
        { shape: 'triangle' as const, symbol: '▲', text: 'விடை 1', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600', borderColor: 'border-rose-400' },
        { shape: 'square' as const, symbol: '■', text: 'விடை 2', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', borderColor: 'border-blue-400' },
        { shape: 'circle' as const, symbol: '●', text: 'விடை 3', color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', borderColor: 'border-amber-400' },
        { shape: 'diamond' as const, symbol: '♦', text: 'விடை 4', color: 'bg-emerald-600', hoverColor: 'hover:bg-emerald-700', borderColor: 'border-emerald-400' },
      ],
      correctIndex: 0,
      hint: 'பாடநூல் குறிப்பு...',
      explanation: 'சரியான விடைக்கான விளக்கம்...',
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Toast alert */}
        {toastMsg && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-top-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>25 மாவட்டங்கள் போர்க்களம் • Districts Studio</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({role === 'super_admin' ? 'Super Admin Oversight' : 'Academic Admin Console'})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>🎯 இலங்கையின் 25 மாவட்டப் போட்டிகள் & பிரசுரிக்கும் மையம்</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              இலங்கையின் 9 மாகாணங்களில் உள்ள 25 மாவட்டங்களுக்கும் தனித்துவமான வினாத்தாள்கள், பாடப்பிரிவுகள் மற்றும் XP நிலைகளை உருவாக்கி, ஒரே கிளிக்கில் மாணவர் தளத்தில் பிரசுரிக்கவும் (Publish / Unpublish).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="மூடுக (Close)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* KPI Strip & Quick Actions */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>மொத்த மாவட்டங்கள்: <strong className="text-slate-900">25</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>நேரலையில் உள்ளவை (Live Published): <strong className="text-emerald-900">{publishedCount} / 25</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-semibold text-slate-700">
              <FileQuestion className="w-4 h-4 text-purple-600" />
              <span>மொத்த வினாக்கள்: <strong className="text-slate-900">{totalQuestionsAllDistricts} Qs</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const allPub = districts.map((d) => ({ ...d, isPublished: true }));
                saveDistrictsProgress(allPub);
                showToast('🚀 அனைத்து 25 மாவட்டப் போட்டிகளும் மாணவர்களுக்குப் பிரசுரிக்கப்பட்டன!');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>அனைத்தையும் பிரசுரி (Publish All 25)</span>
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
              placeholder="மாவட்டம் அல்லது பாடப்பிரிவைத் தேடுங்கள் (Search district)..."
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
              <option value="all">அனைத்து 9 மாகாணங்களும் (All 9 Provinces)</option>
              {PROVINCES_OF_SRI_LANKA.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.nameTa} ({prov.nameEn})
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
              <option value="all">அனைத்து நிலைகளும் (All Status)</option>
              <option value="published">🟢 பிரசுரிக்கப்பட்டவை (Published Only)</option>
              <option value="draft">🟡 வரைவு / மறைக்கப்பட்டவை (Draft / Unpublished)</option>
            </select>
          </div>
        </div>

        {/* Districts Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDistricts.map((district) => {
              const qCount = district.initialQuestions?.length || 0;

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
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                              Level {district.levelNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {district.provinceTa}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">
                            {district.nameTa}{' '}
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
                        title="பிரசுரிக்கும் நிலையை மாற்றுக"
                      >
                        <Radio className={`w-3 h-3 ${district.isPublished ? 'animate-pulse text-emerald-600' : 'text-amber-600'}`} />
                        <span>{district.isPublished ? 'பிரசுரமானது (Live)' : 'வரைவு (Draft)'}</span>
                      </button>
                    </div>

                    <div className="pt-1">
                      <span className="text-xs font-semibold text-slate-700 block">
                        📚 {district.gradeSubject}
                      </span>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {district.descriptionTa}
                      </p>
                    </div>

                    {/* Stats & Question Pill */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="font-semibold flex items-center gap-1 text-purple-700">
                        <FileQuestion className="w-3.5 h-3.5" />
                        <span>{qCount} Kahoot வினாக்கள்</span>
                      </span>

                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>{district.defaultPoints} XP</span>
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
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      <span>வினாக்களைத் திருத்து (Edit Qs)</span>
                    </button>

                    {onCreateFormalCompetition && (
                      <button
                        type="button"
                        onClick={() => {
                          onCreateFormalCompetition(district);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-2xs"
                        title="இந்த மாவட்டத்தை மையமாகக் கொண்டு முழுமையான போட்டியை உருவாக்கு"
                      >
                        <Plus className="w-3 h-3" />
                        <span>போட்டியாக்கு</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DISTRICT QUESTIONS & DETAILS EDITOR MODAL (SUB-MODAL) */}
        {activeEditingDistrict && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-60 flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in zoom-in-95">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-white/10">{activeEditingDistrict.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {activeEditingDistrict.nameTa} ({activeEditingDistrict.nameEn}) • வினாத்தாள் அரங்கம்
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

              {/* District Level Configs */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
                  <label className="font-bold text-slate-700 block mb-1">வெற்றி XP புள்ளிகள் (Reward Points):</label>
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

              {/* Active Question Editor Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {activeEditingDistrict.initialQuestions[activeQuestionTab] && (() => {
                  const currentQ = activeEditingDistrict.initialQuestions[activeQuestionTab];

                  return (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 text-sm">
                          கேள்வி #{activeQuestionTab + 1} வடிவமைப்பு
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

                      {/* Question Text */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">வினா வாசகம் (Question Prompt):</label>
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

                      {/* 4 Choices (Kahoot Style) */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-2">
                          4 விடைக் கூறுகள் (சரியான விடையைத் தேர்ந்தெடுக்கவும்):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentQ.options.map((opt, oIdx) => {
                            const isCorrect = currentQ.correctIndex === oIdx;

                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                                  isCorrect ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className={`w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center shrink-0 ${opt.color}`}>
                                  {opt.symbol}
                                </span>

                                <input
                                  type="text"
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
                            );
                          })}
                        </div>
                      </div>

                      {/* Hint & Explanation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                  ரத்து செய்
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
