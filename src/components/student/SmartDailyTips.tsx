import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Clock,
  BookOpen,
  Target,
  Flame,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Brain,
  Zap,
  Award,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudyPlanItem {
  id: string;
  title: string;
  duration: string;
  description: string;
  category: string;
  completed: boolean;
}

interface ExamTrick {
  title: string;
  technique: string;
  actionableStep: string;
  tag: string;
}

interface SmartTipsData {
  summary: string;
  focusSubject: string;
  studyPlan: StudyPlanItem[];
  examTrick: ExamTrick;
  motivationalQuote: string;
  isAiGenerated: boolean;
}

export const SmartDailyTips: React.FC = () => {
  const { currentStudent, currentAuthUser, results, competitions, language, adjustStudentPoints } = useApp();

  const [loading, setLoading] = useState(false);
  const [tipsData, setTipsData] = useState<SmartTipsData | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'trick' | 'insights'>('plan');
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [taskBonusClaimed, setTaskBonusClaimed] = useState<Record<string, boolean>>({});

  const studentName = currentAuthUser?.fullName || currentStudent?.name || 'Student';
  const studentGrade = currentAuthUser?.grade || currentStudent?.gradeLevel || 'Grade 11 (O/L)';
  const studentUid = currentAuthUser?.uid || currentStudent?.id || 'guest';

  // Extract recent student performance
  const studentResults = results.filter(
    (r) =>
      r.studentId === studentUid ||
      r.studentId === currentStudent?.studentId ||
      (r.studentName && r.studentName.toLowerCase() === studentName.toLowerCase())
  );

  const completedCount = studentResults.length;
  const avgPercentage =
    completedCount > 0
      ? Math.round(studentResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / completedCount)
      : 0;

  const recentExamsList = studentResults.slice(0, 3).map((r) => ({
    title: r.competitionTitle,
    score: `${r.score}/${r.maxScore || r.totalMarks}`,
    percentage: `${r.percentage}%`,
    award: r.award,
  }));

  // Generate Fallback Curated Tips based on real student metrics
  const getCuratedSmartTips = (): SmartTipsData => {
    const isOL = studentGrade.includes('11') || studentGrade.includes('O/L') || studentGrade.includes('10');
    const isAL = studentGrade.includes('12') || studentGrade.includes('13') || studentGrade.includes('A/L');

    const focusSub = avgPercentage < 65 ? 'Core Subject Revision & Concept Clarity' : 'Speed & Time Management in MCQs';

    const defaultPlan: StudyPlanItem[] = isOL
      ? [
          {
            id: 'p1',
            title: language === 'ta' ? 'அறிவியல் சமன்பாடுகள் & வரைபட பயிற்சி' : 'Science Formulas & Diagram Review',
            duration: '25 mins',
            description: language === 'ta' ? 'கடந்த கால வினாத்தாள் MCQs-ல் அதிக முறை கேட்கப்பட்ட 5 சமன்பாடுகளை எழுதிப் பாருங்கள்.' : 'Write down and practice 5 high-frequency science formulas from past competition papers.',
            category: 'Science',
            completed: false,
          },
          {
            id: 'p2',
            title: language === 'ta' ? 'கணித வேகப் பயிற்சி (Speed Math)' : 'Speed Arithmetic & Problem Solving',
            duration: '20 mins',
            description: language === 'ta' ? 'வினாடிக்கு ஒரு விடை அளிக்கும் வகையில் 10 பல்தேர்வு கணக்குகளை தீர்க்கவும்.' : 'Solve 10 MCQ math problems with a countdown timer to boost competition speed.',
            category: 'Math',
            completed: false,
          },
          {
            id: 'p3',
            title: language === 'ta' ? 'பழைய தேர்வு தவறுகள் மறுஆய்வு' : 'Review Mistakes from Last Competition',
            duration: '15 mins',
            description: language === 'ta' ? 'முந்தைய தேர்வில் தவறாக விடையளித்த கேள்விகளின் சரியான காரணத்தை புரிந்துகொள்ளுங்கள்.' : 'Inspect incorrect answers from your latest competition result and note the root concepts.',
            category: 'Review',
            completed: false,
          },
        ]
      : [
          {
            id: 'p1',
            title: language === 'ta' ? 'அறிவியல் & கணித சுவாரஸ்யப் புதிர்' : 'Daily Concept Mastery & Flash Review',
            duration: '20 mins',
            description: language === 'ta' ? 'இன்றைய பாடப்பகுதியின் முக்கிய 3 தலைப்புகளை சுருக்கமாக மீள்பார்வை செய்யவும்.' : 'Review key definitions and formulas from your current grade curriculum.',
            category: 'Core',
            completed: false,
          },
          {
            id: 'p2',
            title: language === 'ta' ? 'Edu-Arena வினாடி வினா பயிற்சி' : 'Edu-Arena Quiz & Brain Challenge',
            duration: '15 mins',
            description: language === 'ta' ? 'தினசரி 1 நிமிட மூளைச் சவாலை முடித்து உங்கள் காம்போ புள்ளிகளைப் பெறுங்கள்.' : 'Complete the 60-second daily challenge in the Games Arena to sharpen your focus.',
            category: 'Practice',
            completed: false,
          },
          {
            id: 'p3',
            title: language === 'ta' ? 'சொல்லகராதி & ஆங்கிலப் பயிற்சி' : 'Vocabulary & Logical Reasoning',
            duration: '15 mins',
            description: language === 'ta' ? 'ஒலிம்பியாட் தேர்வுகளில் வரக்கூடிய 5 புதிய ஆங்கிலச் சொற்களைப் படியுங்கள்.' : 'Master 5 high-yield vocabulary words and 1 logical deduction pattern.',
            category: 'English & Logic',
            completed: false,
          },
        ];

    const defaultTrick: ExamTrick = isOL
      ? {
          title: language === 'ta' ? 'இரு-சுற்று தேர்வு உத்தி (The 2-Pass MCQ Strategy)' : 'The 2-Pass Exam Strategy',
          technique: language === 'ta' ? 'நேரத்தை 40% சேமிக்கும் ஒலிம்பியாட் உத்தி' : 'High-Yield Time Optimization for Competitive Exams',
          actionableStep: language === 'ta'
            ? 'முதல் சுற்றில் 100% உறுதியான சுலபமான வினாக்களுக்கு மட்டும் விடையளியுங்கள். இரண்டாவது சுற்றில் மீதமுள்ள சிக்கலான வினாக்களுக்கு கணிப்பு உத்திகளைப் பயன்படுத்துங்கள். இது பதற்றத்தைக் குறைத்து மதிப்பெண்ணை 15% உயர்த்தும்.'
            : 'Pass 1: Answer only questions you know 100% within 30 seconds each. Pass 2: Return to remaining challenging questions. This eliminates negative pressure and saves 10-15 minutes for review.',
          tag: 'Exam Trick',
        }
      : {
          title: language === 'ta' ? 'சுறுசுறுப்பான நினைவுபடுத்தல் (Active Recall)' : 'Active Recall & Feynman Technique',
          technique: language === 'ta' ? 'படித்ததை மறக்காமல் நினைவில் வைக்க' : 'Never Forget Core Principles',
          actionableStep: language === 'ta'
            ? 'புத்தகத்தை மூடிவிட்டு, படித்த கருத்தை 2 நிமிடங்களில் ஒரு நண்பருக்கு விளக்குவது போல நீங்களே உரக்கச் சொல்லிப் பாருங்கள். எங்கு தடுமாறுகிறீர்களோ அதை மட்டும் மீண்டும் படியுங்கள்.'
            : 'Close the textbook and explain the concept aloud in plain terms as if teaching a classmate. Target only the gaps where you hesitate.',
          tag: 'Study Hack',
        };

    const quote =
      language === 'ta'
        ? 'விடாமுயற்சியும் சரியான உத்தியும் இணையும் போது ஒவ்வொரு மாணவனும் சாதனையாளரே!'
        : 'Consistent small daily improvements compound into extraordinary academic podium finishes!';

    return {
      summary:
        language === 'ta'
          ? `${studentName}, உங்கள் ${studentGrade} தரம் மற்றும் சமீபத்திய பரீட்சை செயல்பாட்டின் அடிப்படையில் உருவாக்கப்பட்ட AI வழிகாட்டுதல்.`
          : `Customized for ${studentName} (${studentGrade}) analyzing your ${completedCount} completed exams and average ${avgPercentage}% standing.`,
      focusSubject: focusSub,
      studyPlan: defaultPlan,
      examTrick: defaultTrick,
      motivationalQuote: quote,
      isAiGenerated: false,
    };
  };

  // Generate Smart Tips with Gemini AI
  const generateAiSmartTips = async () => {
    setLoading(true);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Instant intelligent heuristic generator (zero delay, zero lag)
      setTipsData(getCuratedSmartTips());
      setLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const promptContext = `
You are an expert academic coach and exam strategist for Sri Lankan school students competing in national Olympiads, Quizzes, and exams (Grades 1 to 13, O/L, A/L).
Analyze this student's recent academic profile and generate personalized 'Smart Daily Tips' including a 3-step actionable study plan for today, an exam preparation trick/technique, and diagnostic insight.

Student Profile:
- Name: ${studentName}
- Grade Level: ${studentGrade}
- District / School: ${currentStudent?.district || 'Sri Lanka'} / ${currentStudent?.institution || 'School'}
- Exams Completed: ${completedCount}
- Overall Average Score: ${avgPercentage}%
- Recent Competition Results: ${JSON.stringify(recentExamsList)}
- Preferred Language: ${language === 'ta' ? 'Tamil' : language === 'si' ? 'Sinhala' : 'English'}

Instructions:
1. Provide a concise, highly practical, grade-appropriate 3-step study plan for today with realistic durations (15-30 mins).
2. Provide 1 high-impact exam trick/hack (e.g. elimination method, active recall, diagram mnemonics, time allocation).
3. Provide a brief 1-sentence diagnostic focus insight based on whether they need to push from credit to distinction (85%+ Gold Medal).
4. Provide a motivating 1-sentence quote.
5. Respond strictly in valid JSON format matching this schema:
{
  "summary": "Short 1-2 sentence overview in ${language === 'ta' ? 'Tamil' : language === 'si' ? 'Sinhala' : 'English'}",
  "focusSubject": "Specific skill/topic to sharpen",
  "studyPlan": [
    {
      "id": "p1",
      "title": "Action title",
      "duration": "20 mins",
      "description": "Clear specific action to do",
      "category": "Math/Science/English/Review"
    },
    {
      "id": "p2",
      "title": "Action title",
      "duration": "25 mins",
      "description": "Clear specific action to do",
      "category": "Topic"
    },
    {
      "id": "p3",
      "title": "Action title",
      "duration": "15 mins",
      "description": "Clear specific action to do",
      "category": "Topic"
    }
  ],
  "examTrick": {
    "title": "Technique name",
    "technique": "Why it works",
    "actionableStep": "Exact way to apply it during exam or study",
    "tag": "Time Hack / Memory Technique / Trap Avoidance"
  },
  "motivationalQuote": "Inspiring closing line"
}
`;

      if (!apiKey || apiKey.trim().length < 5) {
        setTipsData(getCuratedSmartTips());
        setLoading(false);
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContext,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      });

      const responseText = response.text || '';
      const parsed = JSON.parse(responseText);

      if (parsed && parsed.studyPlan && parsed.examTrick) {
        setTipsData({
          summary: parsed.summary || getCuratedSmartTips().summary,
          focusSubject: parsed.focusSubject || 'Olympiad Readiness',
          studyPlan: parsed.studyPlan.map((p: any, idx: number) => ({
            id: p.id || `p${idx + 1}`,
            title: p.title,
            duration: p.duration || '20 mins',
            description: p.description,
            category: p.category || 'Study',
            completed: false,
          })),
          examTrick: parsed.examTrick,
          motivationalQuote: parsed.motivationalQuote || 'Keep growing every single day!',
          isAiGenerated: true,
        });
      } else {
        setTipsData(getCuratedSmartTips());
      }
    } catch (err) {
      console.warn('Gemini Smart Tips note:', err);
      setTipsData(getCuratedSmartTips());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAiSmartTips();
  }, [studentGrade, completedCount, language]);

  const toggleTask = async (taskId: string) => {
    const isNowDone = !checkedTasks[taskId];
    setCheckedTasks((prev) => ({ ...prev, [taskId]: isNowDone }));

    if (isNowDone && !taskBonusClaimed[taskId]) {
      setTaskBonusClaimed((prev) => ({ ...prev, [taskId]: true }));
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });

      if (adjustStudentPoints && studentUid) {
        try {
          await adjustStudentPoints(studentUid, 5, 'Completed Daily AI Study Plan Task');
        } catch {
          // points note
        }
      }
    }
  };

  const copyPlanToClipboard = () => {
    if (!tipsData) return;
    const text = `🎯 *Smart Daily Study Plan for ${studentName} (${studentGrade})*\n\n` +
      tipsData.studyPlan.map((p, idx) => `${idx + 1}. [${p.duration}] ${p.title}: ${p.description}`).join('\n') +
      `\n\n💡 *Exam Trick:* ${tipsData.examTrick.title}\n${tipsData.examTrick.actionableStep}\n\n🔥 *HNC EduHub Platform*`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const data = tipsData || getCuratedSmartTips();

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/30 border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 relative overflow-hidden">
      {/* Decorative ambient background blur */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-400/10 via-indigo-400/10 to-purple-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with AI Badge & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Brain className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{data.isAiGenerated ? 'Gemini AI Powered' : 'Smart Academic AI'}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {studentGrade}
              </span>
              {completedCount > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {completedCount} {language === 'ta' ? 'தேர்வுகள் ஆய்வு செய்யப்பட்டது' : 'Exams Evaluated'}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 flex items-center gap-2">
              <span>
                {language === 'ta'
                  ? 'ஸ்மார்ட் தினசரி குறிப்புகள் & படிப்புத் திட்டம்'
                  : language === 'si'
                  ? 'බුද්ධිමත් දෛනික ඉඟි සහ අධ්‍යයන සැලැස්ම'
                  : 'Smart Daily Tips & Exam Tricks'}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={copyPlanToClipboard}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            title="Copy plan to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy Plan'}</span>
          </button>

          <button
            disabled={loading}
            onClick={generateAiSmartTips}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="Regenerate suggestions based on latest exams"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? (language === 'ta' ? 'ஆய்வு செய்கிறது...' : 'Analyzing...') : (language === 'ta' ? 'புதிய குறிப்புகள்' : 'Refresh AI Tips')}</span>
          </button>
        </div>
      </div>

      {/* Diagnostic Context Pill */}
      <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-3 rounded-2xl border border-indigo-100/60 shadow-2xs">
        💡 {data.summary}
      </p>

      {/* Sub-Tabs: Study Plan, Exam Trick, Insights */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'plan'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>{language === 'ta' ? 'இன்றைய படிப்புத் திட்டம்' : 'Daily Plan'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-extrabold">
            3 Tasks
          </span>
        </button>

        <button
          onClick={() => setActiveTab('trick')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'trick'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>{language === 'ta' ? 'பரீட்சை உத்தி' : 'Exam Trick'}</span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'insights'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'ta' ? 'முக்கிய கவனம்' : 'Focus Area'}</span>
        </button>
      </div>

      {/* TAB CONTENT 1: TODAY'S STUDY PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.studyPlan.map((task, idx) => {
              const isDone = !!checkedTasks[task.id];
              return (
                <div
                  key={task.id || idx}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        task.category.includes('Science')
                          ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                          : task.category.includes('Math')
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {task.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{task.duration}</span>
                      </span>
                    </div>

                    <h4 className={`text-xs font-extrabold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-indigo-600 transition'}`}>
                      {task.title}
                    </h4>

                    <p className={`text-[11px] leading-relaxed ${isDone ? 'text-slate-400' : 'text-slate-600'}`}>
                      {task.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-emerald-700">
                      {isDone ? '✓ Completed (+5 pts)' : 'Click to complete'}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white group-hover:border-indigo-500'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ta' ? 'இன்றைய திட்டத்தை முடித்து +5 போனஸ் புள்ளிகளைப் பெறுங்கள்!' : 'Check off study tasks as you finish them to earn +5 reward points each!'}</span>
            </span>
            <span className="font-bold text-indigo-700">
              {Object.values(checkedTasks).filter(Boolean).length} / {data.studyPlan.length} Done
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: EXAM TRICK & TECHNIQUE */}
      {activeTab === 'trick' && (
        <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>{data.examTrick.tag || 'Pro Exam Hack'}</span>
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {data.examTrick.technique}
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 mt-1">
                {data.examTrick.title}
              </h4>
            </div>

            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-amber-50/20 border border-amber-200 rounded-xl">
            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block mb-1">
              {language === 'ta' ? 'பரீட்சையில் எவ்வாறு பயன்படுத்துவது:' : 'How to apply in your next competition:'}
            </span>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {data.examTrick.actionableStep}
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DIAGNOSTIC FOCUS AREA & MOTIVATION */}
      {activeTab === 'insights' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                {language === 'ta' ? 'அடுத்த கட்ட இலக்கு (Target Area)' : 'Academic Target Area'}
              </span>
              <div className="text-sm font-black text-slate-900">
                {data.focusSubject}
              </div>
              <p className="text-xs text-slate-600">
                {completedCount === 0
                  ? language === 'ta'
                    ? 'முதல் ஒலிம்பியாட் தேர்வை முடித்தவுடன் மேலும் துல்லியமான AI பரிந்துரைகள் தோன்றும்.'
                    : 'Complete your first competition exam to unlock deeper diagnostic subject scoring.'
                  : language === 'ta'
                  ? `சராசரி ${avgPercentage}% மதிப்பெண்ணை 85%+ தங்கப் பதக்க நிலைக்கு உயர்த்த இந்த தலைப்பில் கவனம் செலுத்துங்கள்.`
                  : `Focusing here will elevate your current ${avgPercentage}% average into the 85%+ Gold Medal threshold.`}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 rounded-2xl border border-indigo-200 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                  {language === 'ta' ? 'தினசரி ஊக்கம் (Daily Motivation)' : 'Daily Academic Booster'}
                </span>
                <p className="text-xs font-bold text-indigo-950 italic mt-1 leading-relaxed">
                  "{data.motivationalQuote}"
                </p>
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold pt-2 border-t border-indigo-100 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />
                <span>Keep your daily study rhythm going!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
