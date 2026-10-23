/**
 * Personalized AI Study Timetable Service (Gemini API Integration)
 *
 * Tailored specifically for Sri Lankan students preparing for:
 * - Upcoming competitions and exams (Olympiads, School Term Tests, Scholarship, O/L, A/L, Public Service)
 * - Systematic reinforcement of weak subjects detected from past competition results
 */

export interface StudyTimeSlot {
  id: string;
  timeRange: string;
  subject: string;
  topic: string;
  sessionType: 'Weak Area Booster' | 'Upcoming Contest Prep' | 'Concept Mastery' | 'Mock Test Drill' | 'Quick Review' | string;
  activity: string;
  tips: string;
  intensity: 'High' | 'Medium' | 'Light';
  completed?: boolean;
}

export interface StudyDay {
  dayName: string;
  theme: string;
  dailyTargetSummary: string;
  timeSlots: StudyTimeSlot[];
}

export interface WeakAreaItem {
  subject: string;
  scoreNote: string;
  focusTopics: string[];
  recommendedDailyMinutes: number;
}

export interface UpcomingContestStrategy {
  contestTitle: string;
  daysRemaining: number;
  priority: 'High' | 'Medium' | 'Critical';
  strategy: string;
}

export interface StudyTimetable {
  id: string;
  studentId: string;
  generatedAt: string;
  timetableTitle: string;
  curriculumStage: string;
  targetWeek: string;
  overview: string;
  weakAreasIdentified: WeakAreaItem[];
  upcomingContestStrategies: UpcomingContestStrategy[];
  days: StudyDay[];
  aiCounselorTips: string[];
  isAiGenerated: boolean;
}

export interface StudyTimetableInput {
  studentId: string;
  studentName: string;
  grade: string;
  curriculumPath: string;
  medium?: 'Tamil' | 'English' | 'Sinhala';
  language?: 'ta' | 'en' | 'si';
  dailyHours: number;
  preferredTime: string;
  upcomingCompetitions: Array<{
    id: string;
    title: string;
    category?: string;
    startDate?: string;
    daysLeft?: number;
    format?: string;
  }>;
  pastResults: Array<{
    competitionTitle?: string;
    category?: string;
    score: number;
    totalMarks: number;
    percentage: number;
    submittedAt?: string;
  }>;
  weakSubjects: string[];
  strongSubjects: string[];
}

/**
 * Analyzes past results to identify weak subjects (< 70% average or lowest scoring)
 */
export function identifyWeakSubjectsFromResults(
  results: Array<{
    category?: string;
    competitionId?: string;
    competitionTitle?: string;
    score: number;
    maxScore?: number;
    totalMarks?: number;
    percentage?: number;
  }>,
  allCompetitions?: Array<{ id: string; category?: string; title?: string }>
): { weakSubjects: string[]; strongSubjects: string[]; subjectStats: Record<string, { avgPercentage: number; count: number }> } {
  const stats: Record<string, { totalPct: number; count: number }> = {};

  results.forEach((r) => {
    let rawCat = (r.category || '').trim();
    if (!rawCat && allCompetitions && r.competitionId) {
      const match = allCompetitions.find((c) => c.id === r.competitionId);
      if (match?.category) rawCat = match.category;
    }
    if (!rawCat && r.competitionTitle) {
      const titleLow = r.competitionTitle.toLowerCase();
      if (titleLow.includes('math') || titleLow.includes('கணித')) rawCat = 'Mathematics';
      else if (titleLow.includes('sci') || titleLow.includes('விஞ்ஞான')) rawCat = 'Science';
      else if (titleLow.includes('eng') || titleLow.includes('ஆங்கில')) rawCat = 'English';
      else if (titleLow.includes('iq') || titleLow.includes('logic') || titleLow.includes('நுண்ணறிவு')) rawCat = 'IQ & Logic';
      else if (titleLow.includes('env') || titleLow.includes('era') || titleLow.includes('சுற்றாடல்')) rawCat = 'Environmental Studies';
      else if (titleLow.includes('ict') || titleLow.includes('tech') || titleLow.includes('தொழில்நுட்ப')) rawCat = 'ICT';
      else if (titleLow.includes('tamil') || titleLow.includes('தமிழ்')) rawCat = 'Language (Tamil)';
    }
    if (!rawCat) rawCat = 'General';

    // Normalize category name
    let cat = rawCat;
    const low = rawCat.toLowerCase();
    if (low.includes('math') || low.includes('கணித')) cat = 'Mathematics';
    else if (low.includes('sci') || low.includes('விஞ்ஞான')) cat = 'Science';
    else if (low.includes('eng') || low.includes('ஆங்கில')) cat = 'English';
    else if (low.includes('env') || low.includes('era') || low.includes('சுற்றாடல்')) cat = 'Environmental Studies';
    else if (low.includes('iq') || low.includes('logic') || low.includes('நுண்ணறிவு')) cat = 'IQ & Logic';
    else if (low.includes('ict') || low.includes('tech') || low.includes('தொழில்நுட்ப')) cat = 'ICT';
    else if (low.includes('tamil') || low.includes('lang') || low.includes('தமிழ்')) cat = 'Language (Tamil)';

    const total = r.totalMarks || r.maxScore || 100;
    const pct = r.percentage !== undefined ? r.percentage : total > 0 ? (r.score / total) * 100 : 0;
    if (!stats[cat]) {
      stats[cat] = { totalPct: 0, count: 0 };
    }
    stats[cat].totalPct += pct;
    stats[cat].count += 1;
  });

  const subjectStats: Record<string, { avgPercentage: number; count: number }> = {};
  const weakSubjects: string[] = [];
  const strongSubjects: string[] = [];

  Object.entries(stats).forEach(([cat, data]) => {
    const avg = Math.round(data.totalPct / data.count);
    subjectStats[cat] = { avgPercentage: avg, count: data.count };
    if (avg < 70) {
      weakSubjects.push(cat);
    } else {
      strongSubjects.push(cat);
    }
  });

  // If no results or all results are strong, provide sensible curriculum defaults based on typical tough areas
  if (weakSubjects.length === 0) {
    if (results.length === 0) {
      weakSubjects.push('Mathematics', 'Science');
      strongSubjects.push('General Knowledge');
    } else {
      // Find the lowest subject even if above 70%
      const sorted = Object.entries(subjectStats).sort((a, b) => a[1].avgPercentage - b[1].avgPercentage);
      if (sorted.length > 0) {
        weakSubjects.push(sorted[0][0]);
      }
    }
  }

  return { weakSubjects, strongSubjects, subjectStats };
}

/**
 * Calls Gemini server endpoint /api/generate-study-timetable with resilient offline fallback
 */
export async function generateStudyTimetable(input: StudyTimetableInput): Promise<StudyTimetable> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('/api/generate-study-timetable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json().catch(() => null);
      if (data?.success && data?.timetable && Array.isArray(data.timetable.days)) {
        const fullTimetable: StudyTimetable = {
          ...data.timetable,
          id: `tt_${Date.now()}`,
          studentId: input.studentId,
          generatedAt: new Date().toISOString(),
          isAiGenerated: true,
        };
        saveTimetableLocally(input.studentId, fullTimetable);
        return fullTimetable;
      }
    }
  } catch (err) {
    console.warn('Could not connect to Gemini study timetable endpoint, switching to curated fallback:', err);
  }

  // Curated Sri Lankan Curriculum Fallback Generator (Instant 0ms, zero lag)
  const fallback = buildCuratedSriLankanTimetable(input);
  saveTimetableLocally(input.studentId, fallback);
  return fallback;
}

/**
 * Curated Sri Lankan Timetable Generator (Built-in educational intelligence)
 */
function buildCuratedSriLankanTimetable(input: StudyTimetableInput): StudyTimetable {
  const isTa = input.language !== 'en';
  const primaryWeak = input.weakSubjects[0] || 'Mathematics';
  const secondaryWeak = input.weakSubjects[1] || 'Science';
  const urgentContest = input.upcomingCompetitions[0];

  const daysData: StudyDay[] = [
    {
      dayName: isTa ? 'திங்கட்கிழமை (Day 1 - Monday)' : 'Day 1 - Monday',
      theme: isTa ? `${primaryWeak} பாடத்திற்கான அடித்தளப் பயிற்சிகள்` : `${primaryWeak} Core Foundation & Drills`,
      dailyTargetSummary: isTa
        ? `பலவீனமான பாடமான ${primaryWeak} இற்கு 60 நிமிட விசேட மீளாய்வு`
        : `Targeted 60-minute reinforcement on weak subject ${primaryWeak}`,
      timeSlots: [
        {
          id: 'slot_1_1',
          timeRange: '05:00 PM - 06:00 PM',
          subject: primaryWeak,
          topic: isTa ? 'அடிப்படைக் கோட்பாடுகள் மற்றும் சூத்திரங்கள்' : 'Core Definitions & Formula Mastery',
          sessionType: 'Weak Area Booster',
          activity: isTa
            ? 'e-Thaksalawa பாடப்புத்தக அலகு குறிப்புகளை வாசித்து 10 மாதிரி வினாக்களை தீர்த்தல்'
            : 'Read e-Thaksalawa unit notes and solve 10 textbook problems',
          tips: isTa ? 'சிக்கலான பகுதிகளை ஒரு தனி குறிப்பேட்டில் குறித்து வைக்கவும்' : 'Write formulas on summary cards',
          intensity: 'High',
        },
        {
          id: 'slot_1_2',
          timeRange: '06:15 PM - 07:00 PM',
          subject: urgentContest ? urgentContest.category || urgentContest.title : secondaryWeak,
          topic: isTa ? 'எதிர்வரும் போட்டிப் பரீட்சைக்கான மாதிரிப் பயிற்சி' : 'Upcoming Contest Readiness',
          sessionType: 'Upcoming Contest Prep',
          activity: isTa
            ? `${urgentContest?.title || 'போட்டி'} வினாத்தாள் பாணியிலான 15 நிமிட வேகப் பயிற்சி`
            : 'Rapid 15-minute question drills on HNC Platform',
          tips: isTa ? 'நேரத்தை அவதானித்து வேகத்தை அதிகரியுங்கள்' : 'Time each question for speed practice',
          intensity: 'Medium',
        },
      ],
    },
    {
      dayName: isTa ? 'செவ்வாய்க்கிழமை (Day 2 - Tuesday)' : 'Day 2 - Tuesday',
      theme: isTa ? `${secondaryWeak} பாடத்தின் முக்கிய அலகுகள்` : `${secondaryWeak} High-Yield Units`,
      dailyTargetSummary: isTa ? 'விஞ்ஞானக் கருத்துக்கள் & செய்முறைப் பயிற்சிகள்' : 'Science & Practical Reasoning',
      timeSlots: [
        {
          id: 'slot_2_1',
          timeRange: '05:00 PM - 05:50 PM',
          subject: secondaryWeak,
          topic: isTa ? 'தேசிய பாடத்திட்ட முக்கிய வினாக்கள்' : 'NIE National Syllabus Focus Questions',
          sessionType: 'Weak Area Booster',
          activity: isTa
            ? 'முந்தைய பரீட்சை வினாக்களில் தவறவிட்ட விடயங்களை மீண்டும் செய்து பார்த்தல்'
            : 'Redo previously missed questions with step-by-step reasoning',
          tips: isTa ? 'படம் வரைந்து பாகங்களை நினைவில் நிறுத்துங்கள்' : 'Use diagrams for active recall',
          intensity: 'High',
        },
        {
          id: 'slot_2_2',
          timeRange: '06:00 PM - 06:45 PM',
          subject: primaryWeak,
          topic: isTa ? 'வேகக் கணக்கீடுகள் மற்றும் HNC கேமிங் அரங்கம்' : 'Speed Calculations & Gaming Arena',
          sessionType: 'Mock Test Drill',
          activity: isTa
            ? 'HNC Study Games Hub - வேகக் கணித சவாலில் 5 சுற்றுகள் முடித்தல்'
            : 'Play 5 rounds in HNC Speed Math Rush',
          tips: isTa ? 'மனக்கணக்குத் திறனை மெருகேற்றுங்கள்' : 'Build mental calculation reflex',
          intensity: 'Medium',
        },
      ],
    },
    {
      dayName: isTa ? 'புதன்கிழமை (Day 3 - Wednesday)' : 'Day 3 - Wednesday',
      theme: isTa ? 'போட்டிப் பரீட்சை மாதிரி வினாத்தாள் ஆய்வு' : 'Olympiad & Past Paper Mock',
      dailyTargetSummary: isTa ? 'காலவரையறை கொண்ட மாதிரித் தேர்வு' : 'Timed mock session under exam conditions',
      timeSlots: [
        {
          id: 'slot_3_1',
          timeRange: '05:00 PM - 06:15 PM',
          subject: urgentContest?.category || primaryWeak,
          topic: isTa ? 'முழுமையான மாதிரிப் பரீட்சை (Timed Mock)' : 'Full Mock Exam Simulation',
          sessionType: 'Mock Test Drill',
          activity: isTa
            ? '25 வினாக்களை 30 நிமிடத்திற்குள் செய்து சுய மதிப்பீடு செய்தல்'
            : 'Attempt 25 questions in 30 minutes with self-scoring',
          tips: isTa ? 'சந்தேகமான வினாக்களை குறித்து வைத்து இறுதியில் பார்க்கவும்' : 'Flag difficult questions to review at the end',
          intensity: 'High',
        },
        {
          id: 'slot_3_2',
          timeRange: '06:30 PM - 07:15 PM',
          subject: 'General Knowledge & Logic',
          topic: isTa ? 'பொது அறிவு மற்றும் தர்க்க சிந்தனை' : 'General Knowledge & Logical IQ',
          sessionType: 'Concept Mastery',
          activity: isTa
            ? 'இலங்கை வரலாறு, பூகோளம் மற்றும் சமகால நிகழ்வுகள் வாசிப்பு'
            : 'Review Sri Lanka geography, national parks & recent landmarks',
          tips: isTa ? 'வரைபடங்களை உற்றுநோக்கி நினைவில் வைக்கவும்' : 'Link facts to Sri Lankan districts',
          intensity: 'Light',
        },
      ],
    },
    {
      dayName: isTa ? 'வியாழக்கிழமை (Day 4 - Thursday)' : 'Day 4 - Thursday',
      theme: isTa ? `${primaryWeak} பாடத்தின் கடினமான அலகுகள்` : `${primaryWeak} Hard Problem Solving`,
      dailyTargetSummary: isTa ? 'தவறுகளைத் திருத்தும் சிறப்பு அமர்வு' : 'Error analysis & formula recovery',
      timeSlots: [
        {
          id: 'slot_4_1',
          timeRange: '05:00 PM - 06:00 PM',
          subject: primaryWeak,
          topic: isTa ? 'படிமுறை தீர்வு மற்றும் விரிவான விடைகள்' : 'Step-by-step Detailed Solutions',
          sessionType: 'Weak Area Booster',
          activity: isTa
            ? 'இலங்கை பரீட்சைத் திணைக்கள புள்ளி வழங்கும் திட்டத்தை (Marking Scheme) ஒப்பிடுதல்'
            : 'Compare answers with official Department of Examinations marking scheme',
          tips: isTa ? 'ஒவ்வொரு படிக்கும் புள்ளி உண்டு என்பதை மறவாதீர்கள்' : 'Every correct step earns partial marks',
          intensity: 'High',
        },
        {
          id: 'slot_4_2',
          timeRange: '06:15 PM - 07:00 PM',
          subject: secondaryWeak,
          topic: isTa ? 'குறுகிய மீளாய்வு வினாடி வினா' : 'Rapid Concept Flashcards',
          sessionType: 'Quick Review',
          activity: isTa
            ? '20 சுருக்கமான வினாக்களுக்கு வாய்வழியாக விடையளித்தல்'
            : 'Test active recall on 20 key terms without looking at notes',
          tips: isTa ? 'ஞாபக மறதியைத் தவிர்க்க இடைவெளி மீளாய்வு அவசியம்' : 'Spaced repetition solidifies long-term memory',
          intensity: 'Light',
        },
      ],
    },
    {
      dayName: isTa ? 'வெள்ளிக்கிழமை (Day 5 - Friday)' : 'Day 5 - Friday',
      theme: isTa ? 'மொழித்திறன் மற்றும் சுற்றாடல் ஆய்வுகள்' : 'Language & Applied Environmental Logic',
      dailyTargetSummary: isTa ? 'வாசிப்புத் திறன் & விரைவு விடை நுட்பங்கள்' : 'Speed reading & comprehension agility',
      timeSlots: [
        {
          id: 'slot_5_1',
          timeRange: '05:00 PM - 05:45 PM',
          subject: 'Language / English',
          topic: isTa ? 'வாக்கிய அமைப்பு மற்றும் இலக்கணப் பயன்பாடு' : 'Grammar Precision & Comprehension Skills',
          sessionType: 'Concept Mastery',
          activity: isTa
            ? 'பந்தியினை வாசித்து விடையளிக்கும் வினாக்களை 15 நிமிடத்தில் முடித்தல்'
            : 'Read passages and answer MCQs within target deadline',
          tips: isTa ? 'முக்கிய சொற்களை அடிக்கோடிடுங்கள்' : 'Underline keywords in question stems',
          intensity: 'Medium',
        },
        {
          id: 'slot_5_2',
          timeRange: '06:00 PM - 07:00 PM',
          subject: urgentContest ? urgentContest.category || urgentContest.title : primaryWeak,
          topic: isTa ? 'வார இறுதிப் பரீட்சைக்கான முழு தயாரிப்பு' : 'Contest Simulation & Pressure Handling',
          sessionType: 'Upcoming Contest Prep',
          activity: isTa
            ? 'HNC Edu-Arena Quest தீவுப் போட்டியில் புதிய மாவட்டங்களை விளையாடி XP திரட்டுதல்'
            : 'Level up in HNC Edu-Arena Quest to build competitive confidence',
          tips: isTa ? 'பதட்டமின்றி அமைதியாக யோசிக்கப் பழகுங்கள்' : 'Practice deep breathing before timed tests',
          intensity: 'Medium',
        },
      ],
    },
    {
      dayName: isTa ? 'சனிக்கிழமை (Day 6 - Saturday)' : 'Day 6 - Saturday',
      theme: isTa ? 'தீவிர மாதிரிப் பரீட்சை நாள் (Mega Practice Day)' : 'Intensive Mock Marathon Day',
      dailyTargetSummary: isTa ? 'முழு வினாத்தாள் நேரடிப் பயிற்சி' : 'Real exam timed endurance drill',
      timeSlots: [
        {
          id: 'slot_6_1',
          timeRange: '09:30 AM - 11:00 AM',
          subject: primaryWeak,
          topic: isTa ? 'முழுமையான அலகுத் தேர்வு (Unit Master Challenge)' : 'Comprehensive Unit Exam',
          sessionType: 'Mock Test Drill',
          activity: isTa
            ? 'உண்மையான பரீட்சை சூழலில் 40 நிமிடங்களுக்கு அமைதியாக அமர்ந்து பரீட்சை எழுதுதல்'
            : 'Simulate full exam conditions with no distractions or devices',
          tips: isTa ? 'தேர்வு தொடங்கும் முன் வினாக்களை ஒருமுறை வாசித்து திட்டமிடுங்கள்' : 'Spend first 2 minutes scanning paper',
          intensity: 'High',
        },
        {
          id: 'slot_6_2',
          timeRange: '04:00 PM - 05:00 PM',
          subject: secondaryWeak,
          topic: isTa ? 'தவறு ஆய்வுக் கூடம் (Error Correction)' : 'Post-Test Diagnostic & Weakness Patching',
          sessionType: 'Weak Area Booster',
          activity: isTa
            ? 'காலையில் எழுதிய வினாத்தாளில் விட்ட பிழைகளை பாடப்புத்தகத்தை வைத்து திருத்துதல்'
            : 'Deep dive into every error made and write corrective notes',
          tips: isTa ? 'பிழைகளே சிறந்த ஆசான்' : 'Errors are highest value learning opportunities',
          intensity: 'Medium',
        },
      ],
    },
    {
      dayName: isTa ? 'ஞாயிற்றுக்கிழமை (Day 7 - Sunday)' : 'Day 7 - Sunday',
      theme: isTa ? 'வாராந்திர மீளாய்வு மற்றும் அடுத்த வாரத் திட்டம்' : 'Weekly Review & Mental Rejuvenation',
      dailyTargetSummary: isTa ? 'இலகுவான மீளாய்வு மற்றும் மன அமைதி' : 'Light consolidation & strategy setting',
      timeSlots: [
        {
          id: 'slot_7_1',
          timeRange: '10:00 AM - 11:00 AM',
          subject: 'All Subjects',
          topic: isTa ? 'வாராந்திர சுருக்கக் குறிப்புகள் வாசிப்பு' : 'Weekly Summary Flash Review',
          sessionType: 'Quick Review',
          activity: isTa
            ? 'இந்த வாரம் படித்து முடித்த அனைத்து சுருக்கக் குறிப்புகளையும் 45 நிமிடங்களில் மீள்வாசித்தல்'
            : 'Speed scan all notes written during the week',
          tips: isTa ? 'நம்பிக்கையுடன் இருங்கள்; நிலையான முயற்சியே வெற்றியைத் தரும்' : 'Consistency beats last-minute cramming',
          intensity: 'Light',
        },
        {
          id: 'slot_7_2',
          timeRange: '05:00 PM - 05:45 PM',
          subject: 'Exam Strategy & Schedule',
          topic: isTa ? 'அடுத்த வார இலக்குகள் நிர்ணயம்' : 'Next Week Competition Strategy',
          sessionType: 'Concept Mastery',
          activity: isTa
            ? 'எதிர்வரும் HNC போட்டிகளின் திகதிகளை சரிபார்த்து தயாரிப்பை உறுதிசெய்தல்'
            : 'Check upcoming contest dates on HNC dashboard and set target scores',
          tips: isTa ? 'போதுமான தூக்கமும் ஓய்வும் மூளையின் ஆற்றலை அதிகரிக்கும்' : 'Prioritize 8 hours of sleep for peak performance',
          intensity: 'Light',
        },
      ],
    },
  ];

  return {
    id: `tt_curated_${Date.now()}`,
    studentId: input.studentId,
    generatedAt: new Date().toISOString(),
    timetableTitle: isTa
      ? `${input.studentName} அவர்களின் தனிப்பயனாக்கப்பட்ட AI படிப்பு அட்டவணை`
      : `${input.studentName}'s Personalized AI Study Timetable`,
    curriculumStage: input.curriculumPath,
    targetWeek: isTa ? '7-நாள் தொடர் கல்வி வழிகாட்டல் (Mon - Sun)' : '7-Day Strategic Study Blueprint (Mon - Sun)',
    overview: isTa
      ? `கடந்த பரீட்சை முடிவுகளில் பலவீனமாக இனங்காணப்பட்ட பாடங்களான ${input.weakSubjects.join(', ')} இற்கு அதிக முக்கியத்துவம் அளித்து, எதிர்வரும் போட்டிகளுக்கான பிரத்தியேக அட்டவணை உருவாக்கப்பட்டுள்ளது.`
      : `Optimized timetable focusing on identified weak subjects (${input.weakSubjects.join(', ')}) and aligning with upcoming competition schedules.`,
    weakAreasIdentified: input.weakSubjects.map((subj) => ({
      subject: subj,
      scoreNote: isTa ? 'கடந்த தேர்வுகளில் கூடுதல் பயிற்சி தேவைப்படும் பாடமாக கண்டறியப்பட்டுள்ளது' : 'Identified from past results as needing targeted reinforcement',
      focusTopics: [
        isTa ? `${subj} அடிப்படைக் கோட்பாடுகள்` : `${subj} Core Competencies`,
        isTa ? 'தேசிய வினாத்தாள் மாதிரி வினாக்கள்' : 'Past National Paper Questions',
        isTa ? 'வேகக் கணக்கீட்டு நுட்பங்கள்' : 'Speed & Accuracy Drills',
      ],
      recommendedDailyMinutes: 50,
    })),
    upcomingContestStrategies: input.upcomingCompetitions.slice(0, 3).map((comp) => ({
      contestTitle: comp.title,
      daysRemaining: comp.daysLeft || 7,
      priority: (comp.daysLeft || 7) <= 5 ? 'Critical' : 'High',
      strategy: isTa
        ? `போட்டிக்கு இன்னும் ${comp.daysLeft || 7} நாட்களே உள்ளதால் தினசரி மாதிரி வினாக்களில் ஈடுபடவும்.`
        : `With ${comp.daysLeft || 7} days remaining, prioritize timed exam simulations and active recall.`,
    })),
    days: daysData,
    aiCounselorTips: isTa
      ? [
          'பலவீனமான பாடங்களை நாள் தொடங்கும் போதே, மனம் புத்துணர்ச்சியுடன் இருக்கும் நேரத்தில் படியுங்கள்.',
          'ஒவ்வொரு 25 நிமிட படிப்பிற்குப் பின்னரும் 5 நிமிட இடைவெளி (Pomodoro Technique) எடுத்துக் கொள்ளுங்கள்.',
          'போட்டித் தேர்வுக்கு 24 மணித்தியாலத்திற்கு முன்னதாக புதிய பாடங்களை படிக்காமல், ஏற்கனவே படித்தவற்றை மட்டுமே மீளாய்வு செய்யுங்கள்.',
          'HNC Edu-Arena கேம்களை ஓய்வு நேரங்களில் விளையாடி, தர்க்க சிந்தனையையும் XP புள்ளிகளையும் வெல்லுங்கள்.',
        ]
      : [
          'Tackle your most challenging subjects early in your study block when cognitive focus is peak.',
          'Apply the 25/5 Pomodoro method to maintain high concentration without burnout.',
          '48 hours before any contest, shift from learning new theory to timed practice questions.',
          'Consistent daily 45-minute drills yield 3x better retention than weekend cramming.',
        ],
    isAiGenerated: false,
  };
}

/**
 * Local storage persistence utilities
 */
export function getSavedTimetable(studentId: string): StudyTimetable | null {
  try {
    const raw = localStorage.getItem(`hnc_study_timetable_${studentId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load saved timetable:', err);
  }
  return null;
}

export function saveTimetableLocally(studentId: string, timetable: StudyTimetable): void {
  try {
    localStorage.setItem(`hnc_study_timetable_${studentId}`, JSON.stringify(timetable));
  } catch (err) {
    console.error('Failed to save timetable locally:', err);
  }
}

export function getCompletedSlots(studentId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`hnc_timetable_completed_${studentId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {};
}

export function toggleSlotCompleted(studentId: string, slotId: string): Record<string, boolean> {
  const current = getCompletedSlots(studentId);
  const updated = {
    ...current,
    [slotId]: !current[slotId],
  };
  try {
    localStorage.setItem(`hnc_timetable_completed_${studentId}`, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function exportTimetableAsText(timetable: StudyTimetable): string {
  let text = `=================================================\n`;
  text += `${timetable.timetableTitle.toUpperCase()}\n`;
  text += `Curriculum Path: ${timetable.curriculumStage}\n`;
  text += `Target Week: ${timetable.targetWeek}\n`;
  text += `Generated At: ${new Date(timetable.generatedAt).toLocaleDateString()}\n`;
  text += `=================================================\n\n`;

  text += `STRATEGIC OVERVIEW:\n${timetable.overview}\n\n`;

  text += `WEAK SUBJECTS TARGETED:\n`;
  timetable.weakAreasIdentified.forEach((w) => {
    text += `- ${w.subject}: ${w.scoreNote}\n`;
    text += `  Focus Topics: ${w.focusTopics.join(', ')}\n`;
  });
  text += `\n`;

  if (timetable.upcomingContestStrategies.length > 0) {
    text += `UPCOMING CONTEST READINESS:\n`;
    timetable.upcomingContestStrategies.forEach((c) => {
      text += `- ${c.contestTitle} (${c.daysRemaining} days left) [${c.priority} Priority]: ${c.strategy}\n`;
    });
    text += `\n`;
  }

  text += `WEEKLY TIMETABLE SCHEDULE:\n`;
  timetable.days.forEach((day) => {
    text += `\n--- ${day.dayName.toUpperCase()} ---\n`;
    text += `Theme: ${day.theme}\n`;
    text += `Target: ${day.dailyTargetSummary}\n`;
    day.timeSlots.forEach((slot) => {
      text += `  [${slot.timeRange}] ${slot.subject}: ${slot.topic} (${slot.sessionType})\n`;
      text += `    Action: ${slot.activity}\n`;
      text += `    Tips: ${slot.tips}\n`;
    });
  });

  text += `\n=================================================\n`;
  text += `AI COUNSELOR STUDY TIPS:\n`;
  timetable.aiCounselorTips.forEach((tip, idx) => {
    text += `${idx + 1}. ${tip}\n`;
  });
  text += `=================================================\n`;
  return text;
}
