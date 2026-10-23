import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  CheckCircle2,
  Trash2,
  FileText,
  WifiOff,
  BookOpen,
  Sparkles,
  Layers,
  Clock,
  Eye,
  RefreshCw,
  FolderDown,
  Check,
  ShieldCheck,
  HardDrive,
  FileCheck,
} from 'lucide-react';
import {
  OfflineStudyMaterial,
  getOfflineMaterialsList,
  cacheStudyMaterialOffline,
  removeCachedStudyMaterial,
  isStudyMaterialCached,
} from '../../services/studyMaterialsOfflineService';

interface OfflineStudyMaterialsHubProps {
  studentGrade?: string;
  onNavigate?: (tab: any) => void;
}

export const OfflineStudyMaterialsHub: React.FC<OfflineStudyMaterialsHubProps> = ({
  studentGrade = 'Grade 10',
  onNavigate,
}) => {
  const { language, currentAuthUser, currentStudent } = useApp();
  const [offlineMaterials, setOfflineMaterials] = useState<OfflineStudyMaterial[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<any | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshList = () => {
    setOfflineMaterials(getOfflineMaterialsList());
  };

  useEffect(() => {
    refreshList();
    const handleUpdate = () => refreshList();
    window.addEventListener('hnc_offline_materials_updated', handleUpdate);
    return () => window.removeEventListener('hnc_offline_materials_updated', handleUpdate);
  }, []);

  // Standard Curriculum Curated Study Packs available for offline caching
  const CURATED_STUDY_PACKS = [
    {
      id: 'pack_math_formulas',
      title: language === 'ta' ? 'தேசிய கணித சமன்பாடுகள் & தேற்றங்கள் சுருக்கம்' : 'National Mathematics Formulas & Theorems Summary',
      subject: 'Mathematics',
      grade: studentGrade,
      fileType: 'pdf' as const,
      sizeStr: '1.2 MB',
      description: language === 'ta'
        ? 'இலங்கை NIE பாடத்திட்டத்தின் மடக்கை, இருபடிச் சமன்பாடுகள், திரிகோணமிதி & கேத்திரகணிதத் தேற்றங்கள்.'
        : 'All essential formulae, log laws, circle theorems & trigonometry for Sri Lankan curriculum.',
      topics: ['Trigonometry', 'Algebra', 'Circle Theorems', 'Logarithms'],
      sampleContent: {
        title: 'National Mathematics Formula Sheet',
        grade: studentGrade,
        modules: [
          { name: 'Quadratic Formula', formula: 'x = (-b ± √(b² - 4ac)) / (2a)' },
          { name: 'Circle Area & Circumference', formula: 'Area = πr², Circumference = 2πr' },
          { name: 'Pythagoras Theorem', formula: 'a² + b² = c² (Right-angled triangle)' },
          { name: 'Sine & Cosine Rule', formula: 'a/sin(A) = b/sin(B) = c/sin(C), c² = a² + b² - 2ab cos(C)' },
          { name: 'Logarithm Rules', formula: 'log(xy) = log x + log y, log(x/y) = log x - log y' },
        ],
      },
    },
    {
      id: 'pack_science_revision',
      title: language === 'ta' ? 'விஞ்ஞானப் பாட முதன்மைக் குறிப்புகள் & வரைபடங்கள்' : 'Core Science Notes & Revision Diagrams',
      subject: 'Science',
      grade: studentGrade,
      fileType: 'pdf' as const,
      sizeStr: '2.4 MB',
      description: language === 'ta'
        ? 'உயிரியல் கலக்கட்டமைப்பு, மனித உடற்றொகுதி, நியூட்டனின் இயக்க விதிகள் & இரசாயனப் பிணைப்புகள்.'
        : 'Cell biology, human circulatory system, Newton laws of motion, and chemical bonding notes.',
      topics: ['Circulation & Respiration', 'Newtonian Mechanics', 'Chemical Bonding', 'Genetics'],
      sampleContent: {
        title: 'Core Science Revision Guide',
        grade: studentGrade,
        modules: [
          { name: 'Human Circulation', summary: 'Left ventricle pumps oxygenated blood via Aorta to the whole body. Vena Cava returns deoxygenated blood to right atrium.' },
          { name: 'Photosynthesis', summary: '6CO₂ + 6H₂O + Solar Energy (Chlorophyll) -> C₆H₁₂O₆ + 6O₂' },
          { name: 'Newton 2nd Law', summary: 'F = m × a (Force = Mass × Acceleration). Unit: Newtons (N).' },
          { name: 'Periodic Table Trends', summary: 'Electronegativity increases across a period and decreases down a group.' },
        ],
      },
    },
    {
      id: 'pack_past_paper_model',
      title: language === 'ta' ? 'தேசிய மாதிரி வினாத்தாள் & விடைக் குறிப்புகள்' : 'Model Exam Paper & Full Step-by-Step Solutions',
      subject: 'Combined Revision',
      grade: studentGrade,
      fileType: 'json' as const,
      sizeStr: '850 KB',
      description: language === 'ta'
        ? 'இலங்கை கல்வி அமைச்சு வினாத்தாள் முறைக்கு அமைவான 40 பல்தேர்வு வினாக்கள் மற்றும் விரிவான விளக்கங்கள்.'
        : '40 NIE aligned multiple choice questions with complete step-by-step reasoning.',
      topics: ['Model Paper 1', 'Answer Keys', 'Marking Schemes', 'NIE Competencies'],
      sampleContent: {
        title: `${studentGrade} National Model Examination Paper`,
        questionsCount: 40,
        allocatedMinutes: 60,
        instructions: 'Attempt all questions. Offline practice mode enabled.',
      },
    },
  ];

  const handleDownloadPack = async (pack: typeof CURATED_STUDY_PACKS[0]) => {
    setDownloadingId(pack.id);
    try {
      const downloadUrl = `/offline-materials/${pack.id}_${studentGrade.replace(/\s+/g, '_')}.${pack.fileType}`;
      const payload: OfflineStudyMaterial = {
        id: pack.id,
        title: pack.title,
        subject: pack.subject,
        grade: pack.grade,
        fileType: pack.fileType,
        downloadUrl,
        downloadedAt: new Date().toISOString(),
        description: pack.description,
        topics: pack.topics,
      };

      await cacheStudyMaterialOffline(payload, JSON.stringify(pack.sampleContent, null, 2));
      refreshList();
    } catch (err) {
      console.warn('Offline download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteMaterial = async (m: OfflineStudyMaterial) => {
    await removeCachedStudyMaterial(m.id, m.downloadUrl);
    refreshList();
    if (activePreview?.id === m.id) {
      setActivePreview(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-black text-blue-300 shrink-0">
            <FolderDown className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white">
                {language === 'ta'
                  ? 'ஆஃப்லைன் பாடக் குறிப்புகள் & பதிவிறக்கங்கள்'
                  : 'Offline Study Materials & Downloads'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Service Worker Cache Ready</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {language === 'ta'
                ? 'இணைய இணைப்பு இல்லாத போதும் (Without Internet) நீங்கள் பதிவிறக்கிய பாடக் குறிப்புகளை எப்போது வேண்டுமானாலும் அணுகலாம்.'
                : 'Access your downloaded revision notes, formula sheets, and past timetables even with zero internet connectivity.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-slate-200 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-300" />
            <span>
              {offlineMaterials.length} {language === 'ta' ? 'கோப்புகள் சேமிப்பில்' : 'Cached Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Offline Status Alert Strip if student has no internet */}
      {!isOnline && (
        <div className="p-3 bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 px-5">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            {language === 'ta'
              ? 'நீங்கள் தற்போது ஆஃப்லைன் பயன்முறையில் உள்ளீர்கள். சேவைப் பணியாளர் (Service Worker Cache) மூலம் பதிவிறக்கிய பாடக் குறிப்புகள் கிடைக்கின்றன!'
              : 'You are currently in Offline Mode. All downloaded study materials below are fully accessible without internet!'}
          </span>
        </div>
      )}

      {/* Content Grid */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* Curated Study Materials to Download */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                {language === 'ta'
                  ? `${studentGrade} பாடக் குறிப்புகள் (1-கிளிக் ஆஃப்லைன் பதிவிறக்கம்)`
                  : `${studentGrade} Syllabus Study Packs (1-Click Offline Save)`}
              </span>
            </h4>
            <span className="text-[11px] text-slate-500 font-semibold">
              {language === 'ta' ? '60 நாட்கள் வரை தக்கவைப்பு' : 'Retained for 60 Days'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CURATED_STUDY_PACKS.map((pack) => {
              const isCached = offlineMaterials.some((m) => m.id === pack.id);
              const isDownloading = downloadingId === pack.id;

              return (
                <div
                  key={pack.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isCached
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {pack.subject}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                        {pack.sizeStr}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 leading-snug">
                      {pack.title}
                    </h5>

                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {pack.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {pack.topics.map((t, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    {isCached ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{language === 'ta' ? 'ஆஃப்லைனில் தயார்' : 'Saved Offline'}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setActivePreview(pack)}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'படிக்க' : 'Read'}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownloadPack(pack)}
                        disabled={isDownloading}
                        className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>{language === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Caching...'}</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'ஆஃப்லைனில் பதிவிறக்கு' : 'Download for Offline'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saved Offline Library Table / Cards */}
        {offlineMaterials.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'ta'
                  ? `பதிவிறக்கம் செய்யப்பட்ட உங்கள் கோப்புகள் (${offlineMaterials.length})`
                  : `Your Saved Offline Library (${offlineMaterials.length})`}
              </span>
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {offlineMaterials.map((item) => (
                <div
                  key={item.id}
                  className="p-3 sm:px-4 bg-slate-50/50 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-blue-700">{item.subject}</span>
                        <span>•</span>
                        <span>{item.grade}</span>
                        <span>•</span>
                        <span>
                          {language === 'ta' ? 'பதிவிறக்கியது: ' : 'Saved: '}
                          {new Date(item.downloadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Cache Storage</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(item)}
                      title="Remove from offline cache"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Preview for Reading Offline Material */}
        {activePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-xl max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{activePreview.title}</h4>
                    <p className="text-[10px] text-blue-200">
                      {activePreview.subject} • {studentGrade} • Offline Cached
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                >
                  {language === 'ta' ? 'மூடுக' : 'Close'}
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {language === 'ta'
                      ? 'இந்த ஆவணம் சேவைப் பணியாளர் கேச் (CacheStorage) இல் சேமிக்கப்பட்டுள்ளது. இணையம் இல்லாமல் இதை வாசிக்கலாம்.'
                      : 'This document is safely stored in Service Worker CacheStorage. Available anytime without internet.'}
                  </span>
                </div>

                {activePreview.sampleContent?.modules && (
                  <div className="space-y-2.5">
                    {activePreview.sampleContent.modules.map((m: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <h5 className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black inline-flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{m.name}</span>
                        </h5>
                        {m.formula && (
                          <div className="font-mono text-xs font-bold text-indigo-700 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                            {m.formula}
                          </div>
                        )}
                        {m.summary && (
                          <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{m.summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
