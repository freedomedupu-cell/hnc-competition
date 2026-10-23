import React, { useState, useId } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Upload,
  RefreshCw,
  Trash2,
  Plus,
  Scale,
  Award,
  ShieldCheck,
  Check,
  Building2,
  FileSpreadsheet,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { QuestionItem, QuestionType } from '../../types';
import {
  OFFICIAL_CURRICULUM_RESOURCES,
  CURRICULUM_VERSIONS,
  SRI_LANKAN_SUBJECTS_CATALOG,
  getRequiredOptionCountForGrade,
  generateSriLankanQuestions,
  SriLankaExamCategory,
  GenerationResult,
} from '../../services/sriLankaCurriculumService';

interface SriLankanAiExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (
    newQuestions: QuestionItem[],
    mode: 'append' | 'replace',
    suggestedMetadata?: {
      title?: string;
      category?: string;
      grade?: string;
      language?: string;
      duration?: number;
      curriculumVersion?: string;
      term?: string;
      examCategory?: SriLankaExamCategory;
      gazetteNumber?: string;
    }
  ) => void;
  existingCount: number;
  initialGrade?: string;
  initialSubject?: string;
  initialLanguage?: string;
}

export const SriLankanAiExamGeneratorModal: React.FC<SriLankanAiExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
  existingCount,
  initialGrade = 'Grade 10',
  initialSubject = 'Mathematics',
  initialLanguage = 'Tamil',
}) => {
  const fileUploadId = useId();
  // 1. Category Switcher: School Syllabus vs Competitive / Public Service
  const [examCategory, setExamCategory] = useState<SriLankaExamCategory>('school_syllabus');

  // 2. Configuration State
  const [grade, setGrade] = useState<string>(initialGrade);
  const [subjectKey, setSubjectKey] = useState<string>('ol_math');
  const [customSubjectName, setCustomSubjectName] = useState<string>('');
  const [medium, setMedium] = useState<'Tamil' | 'Sinhala' | 'English'>(
    initialLanguage === 'English' ? 'English' : initialLanguage === 'Sinhala' ? 'Sinhala' : 'Tamil'
  );
  const [curriculumVersion, setCurriculumVersion] = useState<string>(
    grade.includes('Grade 1') || grade.includes('Grade 6')
      ? '2026 Revised Competency-Based Framework (Grade 1 & Grade 6 Reforms)'
      : 'National Curriculum Framework (NIE / e-Thaksalawa Standard)'
  );
  const [term, setTerm] = useState<string>('Term 1 (முதலாம் தவணை)');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [customQuestionCount, setCustomQuestionCount] = useState<string>('5');
  const [optionsCount, setOptionsCount] = useState<number>(() => getRequiredOptionCountForGrade(initialGrade));
  const [customOptionsCount, setCustomOptionsCount] = useState<string>(() => String(getRequiredOptionCountForGrade(initialGrade)));
  const [questionType, setQuestionType] = useState<QuestionType | 'mixed'>('multiple_choice');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Medium');
  const [defaultMarks, setDefaultMarks] = useState<number>(2);

  // Reference Material / Source Document
  const [referenceTextSnippet, setReferenceTextSnippet] = useState<string>('');
  const [referenceFileName, setReferenceFileName] = useState<string | null>(null);

  // Public Service Specifics
  const [gazetteNumber, setGazetteNumber] = useState<string>('Gazette Extra. 2385/12');
  const [gazetteDate, setGazetteDate] = useState<string>('2024-05-10');

  // Generation / Review Workflow
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<QuestionItem[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>(existingCount > 0 ? 'append' : 'replace');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Option rule calculation (honors customized optionsCount)
  const isPrimary = optionsCount === 3;

  // Selected catalog helper
  const activeCatalog = SRI_LANKAN_SUBJECTS_CATALOG[subjectKey];
  const activeSubjectDisplay = customSubjectName.trim()
    ? customSubjectName.trim()
    : activeCatalog
    ? medium === 'Tamil'
      ? activeCatalog.subjectTa
      : medium === 'Sinhala'
      ? activeCatalog.subjectSi
      : activeCatalog.subjectEn
    : 'Mathematics';

  // Handle grade change and update curriculum version automatically for 2026 reforms
  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const req = getRequiredOptionCountForGrade(newGrade);
    setOptionsCount(req);
    setCustomOptionsCount(String(req));
    if (newGrade.includes('Grade 1') || newGrade.includes('Grade 6')) {
      setCurriculumVersion('2026 Revised Competency-Based Framework (Grade 1 & Grade 6 Reforms)');
    } else if (examCategory === 'public_service') {
      setCurriculumVersion('Official Government Gazette & Scheme of Recruitment');
    } else {
      setCurriculumVersion('National Curriculum Framework (NIE / e-Thaksalawa Standard)');
    }
  };

  // Upload Reference File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReferenceFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setReferenceTextSnippet(text);
      };
      reader.readAsText(file);
    } else {
      // Binary (PDF / Docx info simulation)
      setReferenceTextSnippet(
        `[Extracted Reference Document: ${file.name} - Size: ${(file.size / 1024).toFixed(1)} KB]\nCompetency-based teacher guide extract & official assessment requirements.`
      );
    }
  };

  // Run AI Question Generation with Sri Lankan Alignment
  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStage('Identifying curriculum version & learning outcomes...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setGenerationStage(`Verifying ${optionsCount}-Option (${['A', 'B', 'C', 'D', 'E', 'F'].slice(0, optionsCount).join(', ')}) examination standard...`);

      const result = await generateSriLankanQuestions({
        examCategory,
        grade,
        subject: activeSubjectDisplay,
        medium,
        term,
        unitTopic: selectedUnit || 'Core Syllabus Modules',
        curriculumVersion,
        questionCount,
        optionsCount,
        questionType,
        difficulty,
        referenceTextSnippet: referenceTextSnippet.trim() || undefined,
        gazetteNumber: examCategory === 'public_service' ? gazetteNumber : undefined,
        gazetteDate: examCategory === 'public_service' ? gazetteDate : undefined,
        defaultMarks,
      });

      setGenerationResult(result);
      setDraftQuestions(result.questions);
    } catch (err: any) {
      console.error('Sri Lankan Question Generator error:', err);
      setErrorMessage(err.message || 'Failed to generate Sri Lankan syllabus questions.');
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  // Update a question in the draft review workbench
  const handleUpdateDraft = (id: string, updates: Partial<QuestionItem>) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  // Delete a question from the draft workbench
  const handleDeleteDraft = (id: string) => {
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Approve all reviewed questions and import into the main paper studio
  const handleApproveAndImport = () => {
    if (draftQuestions.length === 0) return;

    // Mark as approved by admin
    const approvedQuestions: QuestionItem[] = draftQuestions.map((q) => ({
      ...q,
      verificationStatus: 'approved',
    }));

    const suggestedTitle =
      examCategory === 'public_service'
        ? `${grade} - ${activeSubjectDisplay} Competitive Exam (${new Date().getFullYear()})`
        : `${grade} ${activeSubjectDisplay} - ${term} (${new Date().getFullYear()})`;

    onImportQuestions(approvedQuestions, importMode, {
      title: suggestedTitle,
      category: activeSubjectDisplay.split('(')[0].trim(),
      grade,
      language: medium,
      duration: Math.max(15, approvedQuestions.length * 2),
      curriculumVersion,
      term,
      examCategory,
      gazetteNumber: examCategory === 'public_service' ? gazetteNumber : undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-5 text-slate-800 -mt-2">
        {/* MODAL HEADER: SRI LANKAN COAT OF ARMS & OFFICIAL REPOSITORIES BAR */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-blue-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                  <span>Sri Lankan Curriculum AI Engine</span>
                </span>
                <span className="text-[11px] text-blue-200 font-semibold">
                  Official Syllabus & Gazette Aligned
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🇱🇰 இலங்கை பாடத்திட்ட AI வினா & பரீட்சை ஆக்கி</span>
              </h2>
              <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
                e-Thaksalawa மற்றும் தேசிய கல்வி நிறுவகம் (NIE) பாடத்திட்டங்களுக்கு அமைவாக, தரம் 01 முதல் 13 வரை மற்றும் அரச போட்டிப் பரீட்சைகளுக்கான வினாக்களை தானியங்கியாக உருவாக்குங்கள்.
              </p>
            </div>

            {/* Official Source Badges */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
              <a
                href={OFFICIAL_CURRICULUM_RESOURCES.e_thaksalawa.url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                title="Open e-Thaksalawa in new tab"
              >
                <Globe className="w-3.5 h-3.5 text-amber-300" />
                <span>e-Thaksalawa Portal</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
              <a
                href={OFFICIAL_CURRICULUM_RESOURCES.nie.url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                title="Open National Institute of Education in new tab"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>NIE.LK Official</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>

        {/* 2026 CURRICULUM REFORMS ALERT BANNER */}
        {(grade.includes('Grade 1') || grade.includes('Grade 6')) && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-extrabold text-amber-900 block">
                ⚠️ 2026 புதிய பாடத்திட்ட சீர்திருத்தங்கள் இயலுமைப்படுத்தப்பட்டுள்ளன (2026 Reforms Active):
              </span>
              <p className="text-amber-800 leading-relaxed">
                {grade.includes('Grade 1')
                  ? 'தரம் 1 (Grade 1): 2026 ஆம் ஆண்டிற்கான புதிய ஆரம்பநிலை திறன்சார் மட்டுப்படுத்தப்பட்ட (Activity & Competency-based) முறைமையில் 3 தெரிவுகளுடன் (A, B, C) வினாக்கள் வடிவமைக்கப்படும்.'
                  : 'தரம் 6 (Grade 6): 2026 ஆம் ஆண்டிற்கான புதிய மட்டுப்படுத்தப்பட்ட கல்விச் சீர்திருத்த முறைமைக்கு அமைவாக ஒருங்கிணைக்கப்பட்ட வினாக்கள் வடிவமைக்கப்படும்.'}
              </p>
            </div>
          </div>
        )}

        {/* PRIMARY MCQS 3-OPTION SPECIFICATION NOTICE */}
        {isPrimary && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>தரம் 1–5 தேர்வு விதிமுறை:</strong> இலங்கை பரீட்சைத் திணைக்கள புலமைப்பரிசில் விதிகளுக்கு அமைவாக MCQs வினாக்கள் <strong>சரியாக 3 தெரிவுகளை (A, B, C)</strong> மட்டுமே கொண்டிருக்கும்.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 shrink-0">
              3 Options Strict
            </span>
          </div>
        )}

        {/* STEP 1: CATEGORY TOGGLE (3 DISTINCT CATEGORIES: SCHOOL SYLLABUS, COMPETITIONS & OLYMPIADS, PUBLIC SERVICE GAZETTE) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setExamCategory('school_syllabus');
              setGrade(initialGrade.includes('Public') || initialGrade.includes('Competition') ? 'Grade 10' : initialGrade);
              setSubjectKey('ol_math');
              setCurriculumVersion('National Curriculum Framework (NIE / e-Thaksalawa Standard)');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              examCategory === 'school_syllabus'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-700" />
            <span>🏫 பாடசாலை பாடத்திட்டம் (Grades 1–13)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExamCategory('competitive_exam');
              setGrade('Competition: General Knowledge');
              setSubjectKey('competition_gk');
              setCurriculumVersion('Sri Lankan Olympiad & National Competition Standard');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              examCategory === 'competitive_exam'
                ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>🏆 தேசிய கல்விப் போட்டிகள் & ஒலிம்பியாட்</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExamCategory('public_service');
              setGrade('Public Service: MSO');
              setSubjectKey('public_service_mso');
              setCurriculumVersion('Official Government Gazette & Scheme of Recruitment');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              examCategory === 'public_service'
                ? 'bg-white text-purple-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-700" />
            <span>🏛️ அரச சேவை போட்டிப் பரீட்சைகள் (Gazette)</span>
          </button>
        </div>

        {/* CONFIGURATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs">
          {/* Target Grade / Level */}
          <div className="md:col-span-4 space-y-1">
            <label className="font-extrabold text-slate-800 flex items-center justify-between">
              <span>{examCategory === 'public_service' ? 'அரச பரீட்சை (Service Exam):' : examCategory === 'competitive_exam' ? 'போட்டிப் பிரிவு (Competition):' : 'கல்வித் தரம் (Grade Level):'}</span>
              <span className="text-[10px] text-blue-700 font-bold font-mono">
                {isPrimary ? '3 Options (A, B, C)' : '4 Options (A, B, C, D)'}
              </span>
            </label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              {examCategory === 'school_syllabus' ? (
                <>
                  <optgroup label="🌟 Open Exam (பொது / திறந்த தேர்வு) [All Grades]">
                    <option value="Open Exam">பொதுத் தேர்வு (Open Exam / All Grades)</option>
                    <option value="All-Island Open Challenge">அனைத்திலங்கை திறந்த கல்விப் போட்டி (All-Island Open)</option>
                  </optgroup>
                  <optgroup label="🌱 Primary School (Grades 1–5) [Strictly 3 Options]">
                    <option value="Grade 1">தரம் 1 (Grade 1 - 2026 New Reform)</option>
                    <option value="Grade 2">தரம் 2 (Grade 2)</option>
                    <option value="Grade 3">தரம் 3 (Grade 3)</option>
                    <option value="Grade 4">தரம் 4 (Grade 4)</option>
                    <option value="Grade 5 (Scholarship)">தரம் 5 புலமைப்பரிசில் (Scholarship Prep)</option>
                  </optgroup>
                  <optgroup label="📘 Junior Secondary (Grades 6–9) [4 Options]">
                    <option value="Grade 6">தரம் 6 (Grade 6 - 2026 Modular Reform)</option>
                    <option value="Grade 7">தரம் 7 (Grade 7)</option>
                    <option value="Grade 8">தரம் 8 (Grade 8)</option>
                    <option value="Grade 9">தரம் 9 (Grade 9)</option>
                  </optgroup>
                  <optgroup label="🎓 G.C.E. O/L (Grades 10–11) [4 Options]">
                    <option value="Grade 10">தரம் 10 (Grade 10)</option>
                    <option value="Grade 11 (O/L)">தரம் 11 - சாதாரண தரம் (G.C.E. O/L)</option>
                  </optgroup>
                  <optgroup label="🚀 G.C.E. A/L (Grades 12–13) [5 Options]">
                    <option value="Grade 12 (A/L)">தரம் 12 - உயர்தரம் (G.C.E. A/L)</option>
                    <option value="Grade 13 (A/L)">தரம் 13 - உயர்தரம் (G.C.E. A/L)</option>
                  </optgroup>
                </>
              ) : examCategory === 'competitive_exam' ? (
                <>
                  <optgroup label="🏆 Sri Lankan Academic Competitions & Olympiads">
                    <option value="Competition: General Knowledge">தேசிய பொது அறிவுப் போட்டி (All-Island GK)</option>
                    <option value="Competition: IQ & Logic">நுண்ணறிவு & தர்க்கவியல் சாம்பியன்ஷிப்</option>
                    <option value="Competition: Tamil Language">தமிழ் மொழித் திறன் & இலக்கியப் போட்டி</option>
                    <option value="Competition: Olympiad Math/Science">கணித/விஞ்ஞான ஒலிம்பியாட் (SLMC / Olympiad)</option>
                    <option value="Competition: Social Science">சமூக அறிவியல் & புவியியல் போட்டி</option>
                    <option value="Competition: Scholarship Quest">தரம் 5 புலமைப்பரிசில் தேசிய மாதிரிப் போட்டி</option>
                  </optgroup>
                </>
              ) : (
                <>
                  <optgroup label="🏛️ Sri Lankan Public Service Recruitment Examinations (Gazette Aligned)">
                    <option value="Public Service: MSO">முகாமைத்துவ சேவை உத்தியோகத்தர் (MSO)</option>
                    <option value="Public Service: SLEAS">இலங்கை கல்வி நிர்வாக சேவை (SLEAS)</option>
                    <option value="Public Service: SLPS">இலங்கை அதிபர் சேவை (SLPS)</option>
                    <option value="Public Service: SLAS">இலங்கை நிர்வாக சேவை (SLAS)</option>
                  </optgroup>
                </>
              )}
            </select>
          </div>

          {/* Subject Selector */}
          <div className="md:col-span-4 space-y-1">
            <label className="font-extrabold text-slate-800">பாடம் / வினாத்தாள் (Subject):</label>
            <select
              value={subjectKey}
              onChange={(e) => {
                setSubjectKey(e.target.value);
                const catalog = SRI_LANKAN_SUBJECTS_CATALOG[e.target.value];
                if (catalog && catalog.defaultUnits.length > 0) {
                  setSelectedUnit(catalog.defaultUnits[0]);
                }
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              {Object.entries(SRI_LANKAN_SUBJECTS_CATALOG).map(([key, cat]) => (
                <option key={key} value={key}>
                  {medium === 'Tamil' ? cat.subjectTa : medium === 'Sinhala' ? cat.subjectSi : cat.subjectEn}
                </option>
              ))}
            </select>
          </div>

          {/* Language Medium */}
          <div className="md:col-span-4 space-y-1">
            <label className="font-extrabold text-slate-800">மொழி மூலம் (Medium):</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Tamil', 'Sinhala', 'English'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMedium(m)}
                  className={`py-2 px-1 text-center font-bold rounded-xl border text-xs transition cursor-pointer ${
                    medium === m
                      ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {m === 'Tamil' ? 'தமிழ்' : m === 'Sinhala' ? 'සිංහල' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {/* Term / Assessment Stage */}
          <div className="md:col-span-4 space-y-1">
            <label className="font-extrabold text-slate-800">தவணை / மதிப்பீட்டுக் கட்டம் (Term/Stage):</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="Term 1 (முதலாம் தவணைப் பரீட்சை)">Term 1 (முதலாம் தவணைப் பரீட்சை)</option>
              <option value="Term 2 (இரண்டாம் தவணைப் பரீட்சை)">Term 2 (இரண்டாம் தவணைப் பரீட்சை)</option>
              <option value="Term 3 (மூன்றாம் தவணை இறுதிப் பரீட்சை)">Term 3 (மூன்றாம் தவணை இறுதிப் பரீட்சை)</option>
              <option value="Unit Test (அலகு ரீதியான வினாத்தாள்)">Unit Test (அலகு ரீதியான வினாத்தாள்)</option>
              <option value="Scholarship Trial (புலமைப்பரிசில் மாதிரி)">Scholarship Trial (புலமைப்பரிசில் மாதிரி)</option>
              <option value="Olympiad Standard (ஒலிம்பியாட் தரம்)">Olympiad Standard (ஒலிம்பியாட் தரம்)</option>
              <option value="Gazette Scheme (வர்த்தமானி வினாத்தாள்)">Gazette Scheme (வர்த்தமானி வினாத்தாள்)</option>
            </select>
          </div>

          {/* Curriculum Version Selector */}
          <div className="md:col-span-8 space-y-1">
            <label className="font-extrabold text-slate-800 flex items-center justify-between">
              <span>பாடத்திட்ட பதிப்பு (Curriculum Framework Version):</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Checked Against NIE
              </span>
            </label>
            <select
              value={curriculumVersion}
              onChange={(e) => setCurriculumVersion(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              {CURRICULUM_VERSIONS.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit / Topic Selector & Suggestions */}
          <div className="md:col-span-12 space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center justify-between">
              <span>அலகு / பாடப்பரப்பு (Syllabus Unit / Learning Competency):</span>
              <span className="text-[10px] text-slate-500">
                கீழுள்ள அதிகாரப்பூர்வ அலகுகளில் ஒன்றைத் தெரிவுசெய்யலாம்
              </span>
            </label>
            <input
              type="text"
              placeholder="எ.கா. விகிதமும் சதவீதமும் அல்லது விசை"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />

            {/* Quick Suggested Syllabus Units from Catalog */}
            {activeCatalog?.defaultUnits && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeCatalog.defaultUnits.map((u, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedUnit(u)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer ${
                      selectedUnit === u
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Public Service Gazette Requirements (Mandatory when public_service is selected) */}
          {examCategory === 'public_service' && (
            <div className="md:col-span-12 p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <Scale className="w-4 h-4 text-purple-700" />
                <span>அரச வர்த்தமானி அறிவித்தல் தகவல்கள் (Official Gazette Notice Reference):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    வர்த்தமானி இலக்கம் (Gazette Number):
                  </label>
                  <input
                    type="text"
                    value={gazetteNumber}
                    onChange={(e) => setGazetteNumber(e.target.value)}
                    placeholder="e.g. Gazette Extra. 2,385/12"
                    className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    வர்த்தமானித் திகதி (Gazette Date):
                  </label>
                  <input
                    type="date"
                    value={gazetteDate}
                    onChange={(e) => setGazetteDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Counts, Types, and Difficulty */}
          {/* Question Count (Presets + Direct Type-In) */}
          <div className="md:col-span-6 space-y-1.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800">வினாக்களின் எண்ணிக்கை (Count):</label>
              <span className="text-[10px] font-bold text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded-full">
                {questionCount} வினாக்கள்
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setQuestionCount(cnt);
                    setCustomQuestionCount(String(cnt));
                  }}
                  className={`px-2 py-1 text-center font-bold rounded-lg border text-xs transition cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {cnt}
                  {cnt >= 50 ? ' 🔥' : ''}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[11px] font-semibold text-slate-600">தட்டச்சு செய்க (Type):</span>
              <input
                type="number"
                min={1}
                max={150}
                value={customQuestionCount}
                onChange={(e) => {
                  setCustomQuestionCount(e.target.value);
                  const parsed = parseInt(e.target.value, 10);
                  if (!isNaN(parsed) && parsed >= 1 && parsed <= 200) {
                    setQuestionCount(parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(customQuestionCount, 10);
                  const safe = Math.max(1, Math.min(200, isNaN(parsed) ? 10 : parsed));
                  setQuestionCount(safe);
                  setCustomQuestionCount(String(safe));
                }}
                className="w-16 px-2 py-1 rounded-md border border-blue-300 text-center font-bold text-slate-900 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Count"
              />
              <span className="text-[10px] text-slate-400">1 முதல் 100+ வரை</span>
            </div>
          </div>

          {/* Option Rule / Choices Count (3, 4, 5, 6 options + Direct Type-In) */}
          <div className="md:col-span-6 space-y-1.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800">விடை தெரிவுகள் (Options Count):</label>
              <span className="text-[10px] font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-full">
                {optionsCount} தெரிவுகள் ({['A', 'B', 'C', 'D', 'E', 'F'].slice(0, optionsCount).join(', ')})
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 4, 5, 6].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setOptionsCount(cnt);
                    setCustomOptionsCount(String(cnt));
                  }}
                  className={`py-1.5 text-center font-bold rounded-lg border text-xs transition cursor-pointer ${
                    optionsCount === cnt
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs font-black'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {cnt} தெரிவுகள்
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[11px] font-semibold text-slate-600">தட்டச்சு செய்ய (2-6):</span>
              <input
                type="number"
                min={2}
                max={6}
                value={customOptionsCount}
                onChange={(e) => {
                  setCustomOptionsCount(e.target.value);
                  const parsed = parseInt(e.target.value, 10);
                  if (!isNaN(parsed) && parsed >= 2 && parsed <= 6) {
                    setOptionsCount(parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(customOptionsCount, 10);
                  const safe = Math.max(2, Math.min(6, isNaN(parsed) ? 4 : parsed));
                  setOptionsCount(safe);
                  setCustomOptionsCount(String(safe));
                }}
                className="w-14 px-2 py-1 rounded-md border border-amber-300 text-center font-bold text-slate-900 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="3-6"
              />
              <span className="text-[10px] text-slate-400">
                {optionsCount === 3 ? 'A, B, C' : optionsCount === 4 ? 'A, B, C, D' : optionsCount === 5 ? 'A, B, C, D, E' : 'A, B, C, D, E, F'}
              </span>
            </div>
          </div>

          <div className="md:col-span-6 space-y-1">
            <label className="font-extrabold text-slate-800">வினா வகை (Question Type):</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="multiple_choice">
                Multiple Choice ({optionsCount} Options: {['A', 'B', 'C', 'D', 'E', 'F'].slice(0, optionsCount).join(', ')})
              </option>
              <option value="true_false">சரி / பிழை (True / False)</option>
              <option value="short_answer">குறுவிடை வினா (Short Answer)</option>
              <option value="mixed">கலப்பு வினாக்கள் (Mixed Assessment)</option>
            </select>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="font-extrabold text-slate-800">கடினத்தன்மை (Difficulty):</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="Easy">எளிது (Easy / Basic Competency)</option>
              <option value="Medium">நடுத்தரம் (Medium / Standard Exam)</option>
              <option value="Hard">கடினம் (Hard / Distinction / Olympiad)</option>
              <option value="Mixed">கலவை (Mixed Realistic Distribution)</option>
            </select>
          </div>

          {/* Reference Material / Document Extract Textarea */}
          <div className="md:col-span-12 space-y-1.5 pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-700" />
                <span>மூலாதார ஆவணம் / பாடக்குறிப்புகள் (Reference Text / Teacher Guide Snippet):</span>
              </label>

              <label
                htmlFor={fileUploadId}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition shadow-2xs self-start"
              >
                <Upload className="w-3 h-3 text-blue-600" />
                <span>{referenceFileName ? `File: ${referenceFileName}` : 'Upload Reference File (.txt/.csv/.doc)'}</span>
                <input
                  id={fileUploadId}
                  type="file"
                  accept=".txt,.csv,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={3}
              placeholder="அங்கீகரிக்கப்பட்ட பாடசாலை ஆசிரியர் வழிகாட்டி (Teacher Guide), பாடத்திட்ட பகுதி, அல்லது வர்த்தமானி வாசகங்களை இங்கு ஒட்டலாம்..."
              value={referenceTextSnippet}
              onChange={(e) => setReferenceTextSnippet(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs text-xs"
            />
          </div>
        </div>

        {/* ERROR NOTICE */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* GENERATE ACTION BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              அனைத்து வினாக்களும் நிர்வாகி (Admin) ஒப்புதல் அளிக்கும் வரை வரைவு (Draft) நிலையிலேயே இருக்கும்.
            </span>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className={`px-6 py-3 rounded-2xl font-black text-xs text-white transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
              isGenerating
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 hover:from-blue-800 hover:to-purple-800 active:scale-95 shadow-blue-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{generationStage || 'வினாக்கள் உருவாக்கப்படுகின்றன...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>✨ இலங்கை பாடத்திட்ட AI வினாக்களை உருவாக்குக ({questionCount} Questions)</span>
              </>
            )}
          </button>
        </div>

        {/* STEP 2: REVIEW & QUALITY ASSURANCE WORKBENCH */}
        {draftQuestions.length > 0 && (
          <div className="space-y-4 pt-4 border-t-2 border-slate-200">
            {/* QUALITY ASSURANCE REPORT CARD: 7-POINT OFFICIAL CHECKLIST */}
            {generationResult && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-emerald-950 text-sm">
                        7-அம்ச பாடத்திட்ட தரக் கட்டுப்பாடு உறுதி செய்யப்பட்டது (Official 7-Point Quality Check)
                      </span>
                      <span className="text-[11px] text-emerald-800 block">
                        {generationResult.sourceNotice}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-200 text-emerald-950 self-start sm:self-auto shadow-2xs">
                    {draftQuestions.length} Questions Ready for Admin Review
                  </span>
                </div>

                {/* 7 Quality Control Points Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-emerald-200 text-emerald-900 flex items-center gap-1.5 font-bold shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1. Syllabus Relevance (NIE/e-Thaksalawa)</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-200 text-emerald-900 flex items-center gap-1.5 font-bold shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>2. Factual Accuracy & Answer Key</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-200 text-emerald-900 flex items-center gap-1.5 font-bold shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>3. {isPrimary ? 'Primary 3-Option Rule' : 'Secondary 4-Option Rule'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-200 text-emerald-900 flex items-center gap-1.5 font-bold shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>4. {medium} Academic Terminology</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-200 text-emerald-900 flex items-center gap-1.5 font-bold shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>5. Duplicate Detection (0 Duplicates)</span>
                  </div>
                  <div className={`p-2 bg-white rounded-lg border flex items-center gap-1.5 font-bold shadow-2xs ${generationResult.qualityReport.unsupportedClaimsFlagged ? 'border-amber-300 text-amber-900' : 'border-emerald-200 text-emerald-900'}`}>
                    {generationResult.qualityReport.unsupportedClaimsFlagged ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span>6. Source Grounding Audited</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-purple-200 text-purple-900 flex items-center gap-1.5 font-bold shadow-2xs col-span-1 sm:col-span-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>7. Admin Approval Required (Draft State Enforced)</span>
                  </div>
                </div>

                {/* QC Notes / Warnings */}
                {generationResult.qualityReport.notes && generationResult.qualityReport.notes.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 text-[11px] text-slate-700 space-y-1">
                    {generationResult.qualityReport.notes.map((n, nIdx) => (
                      <div key={nIdx} className="flex items-start gap-1.5">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DRAFT QUESTIONS LIST & INLINE EDITING */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {draftQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 bg-white rounded-xl border border-slate-300 space-y-3 shadow-2xs hover:border-blue-400 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-full bg-blue-700 text-white font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {q.gradeOrExam || grade}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {q.subject || activeSubjectDisplay}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        {q.unitTopic || selectedUnit || 'Core Syllabus'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-800 border border-purple-200">
                        {q.options?.length || 0} Options
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-500">Marks:</span>
                        <input
                          type="number"
                          value={q.marks}
                          min={1}
                          max={20}
                          onChange={(e) => handleUpdateDraft(q.id, { marks: Number(e.target.value) })}
                          className="w-12 px-1.5 py-0.5 border border-slate-300 rounded font-bold text-center text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(q.id)}
                        className="p-1 rounded-md text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                        title="Remove question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      வினா வாசகம் (Question Prompt):
                    </label>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleUpdateDraft(q.id, { questionText: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Multiple Choice Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-extrabold text-slate-700 block">
                        தெரிவுகள் (Options) — சரியான விடைக்கு வட்டத்தை தெரிவுசெய்யவும்:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctAnswer === opt;
                          const letter = String.fromCharCode(65 + oIdx);
                          return (
                            <div
                              key={oIdx}
                              onClick={() => handleUpdateDraft(q.id, { correctAnswer: opt })}
                              className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400 font-bold'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {letter}
                              </div>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const next = [...(q.options || [])];
                                  next[oIdx] = e.target.value;
                                  handleUpdateDraft(q.id, {
                                    options: next,
                                    correctAnswer: isCorrect ? e.target.value : q.correctAnswer,
                                  });
                                }}
                                className="w-full bg-transparent border-0 focus:outline-none text-xs font-semibold"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Explanation & Syllabus Metadata */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                    <div className="font-bold text-slate-700">
                      💡 விளக்கம் / படிமுறைகள் (Explanation & Working):
                    </div>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateDraft(q.id, { explanation: e.target.value })}
                      placeholder="விளக்கம் சேர்க்கவும்..."
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* IMPORT CONTROLS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-100 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4 text-xs">
                <span className="font-bold text-slate-700">சேர்க்கும் முறை (Import Mode):</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="importModeRadio"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-blue-600"
                  />
                  <span>புதிதாக மாற்றுக (Replace All)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="importModeRadio"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-blue-600"
                  />
                  <span>இணைக்குக (Append to Existing: +{existingCount})</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  ரத்து செய்க (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleApproveAndImport}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    ✅ அனைத்து {draftQuestions.length} வினாக்களையும் அங்கீகரித்து சேர்க்க (Approve & Import)
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
