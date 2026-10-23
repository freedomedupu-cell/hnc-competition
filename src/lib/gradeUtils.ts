/**
 * Grade eligibility and matching utilities for HNC Competition
 * Ensures competitions are strictly filtered so students only see contests
 * relevant to their academic level (e.g. Grade 6 sees Grade 6, not Grade 7).
 */

/**
 * Extracts all numeric grade values from a string.
 * Examples:
 *   "Grade 6" -> [6]
 *   "தரம் 6" -> [6]
 *   "Grade 6 - 7" -> [6, 7]
 *   "Grade 6 to 8" -> [6, 7, 8]
 *   "Grade 10 - 11 (O/L)" -> [10, 11]
 *   "Grade 12-13 (A/L)" -> [12, 13]
 *   "Open" -> []
 *   "All Grades" -> []
 */
export function extractGradeNumbers(gradeStr?: string): number[] {
  if (!gradeStr) return [];
  const normalized = gradeStr.trim().toLowerCase();

  // If clearly open to all or general
  if (
    normalized.includes('open') ||
    normalized.includes('all') ||
    normalized.includes('general') ||
    normalized.includes('அனைத்து')
  ) {
    return [];
  }

  // Check for range patterns like "6 - 8", "6 to 8", "6-8"
  const rangeMatch = normalized.match(/(\d+)\s*(?:-|to|–|—)\s*(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && start <= end && end <= 14) {
      const numbers: number[] = [];
      for (let i = start; i <= end; i++) {
        numbers.push(i);
      }
      return numbers;
    }
  }

  // Find all individual numbers in the string
  const matches = normalized.match(/\b\d+\b/g);
  if (matches) {
    return Array.from(new Set(matches.map((m) => parseInt(m, 10)).filter((n) => !isNaN(n))));
  }

  return [];
}

/**
 * Determines whether a competition is eligible for a specific student grade.
 *
 * Rules:
 * 1. If competition is "Open", "All Grades", or has no grade specified -> eligible for everyone.
 * 2. If student has no grade specified or is "Open" -> sees all.
 * 3. If both specify grade numbers, the student's grade number must overlap
 *    with the competition's supported grades.
 * 4. Otherwise, falls back to normalized substring match.
 */
export function isGradeEligible(
  competitionGrade?: string,
  studentGrade?: string
): boolean {
  if (!competitionGrade) return true;
  const compNorm = competitionGrade.trim().toLowerCase();

  // 1. "ஓபன் அண்ட் கொடுத்தா மட்டும் தான் எல்லா மாணவர்களும் டிஸ்ப்ளே ஆகணும்"
  // ONLY if competition is explicitly Open / All Grades / General -> Eligible for all students
  const isCompOpen =
    compNorm.includes('open') ||
    compNorm.includes('all') ||
    compNorm.includes('general') ||
    compNorm.includes('அனைத்து') ||
    compNorm === 'open (all grades)' ||
    compNorm === 'all grades' ||
    compNorm === '';

  if (isCompOpen) {
    return true;
  }

  // 2. Competition is for a specific grade: Strictly check student's enrolled grade
  if (!studentGrade) return false;
  const stuNorm = studentGrade.trim().toLowerCase();

  // If student profile is open/general, they can only see open competitions
  if (stuNorm.includes('open') && !compNorm.includes('open')) {
    // If student has no specific grade, fall back to checking if sanitized matches
  }

  // Check for keywords in After School / Competitive exams like Teaching, GS, MA, SLEAS, SLAS
  if (
    compNorm.includes('after school') ||
    compNorm.includes('teaching') ||
    compNorm.includes('gs') ||
    compNorm.includes('gramasewaka') ||
    compNorm.includes('ma') ||
    compNorm.includes('management assistant') ||
    compNorm.includes('sleas') ||
    compNorm.includes('slas') ||
    compNorm.includes('competitive') ||
    compNorm.includes('போட்டி')
  ) {
    if (
      stuNorm.includes('after school') ||
      stuNorm.includes('teaching') ||
      stuNorm.includes('gs') ||
      stuNorm.includes('gramasewaka') ||
      stuNorm.includes('ma') ||
      stuNorm.includes('management assistant') ||
      stuNorm.includes('sleas') ||
      stuNorm.includes('slas') ||
      stuNorm.includes('competitive') ||
      stuNorm.includes('போட்டி')
    ) {
      // Check for specific sub-matches or overlapping terms
      if (compNorm.includes('teaching') && stuNorm.includes('teaching')) return true;
      if ((compNorm.includes('gs') || compNorm.includes('gramasewaka')) && (stuNorm.includes('gs') || stuNorm.includes('gramasewaka'))) return true;
      if ((compNorm.includes('ma') || compNorm.includes('management assistant')) && (stuNorm.includes('ma') || stuNorm.includes('management assistant'))) return true;
      if (compNorm.includes('sleas') && stuNorm.includes('sleas')) return true;
      if (compNorm.includes('slas') && stuNorm.includes('slas')) return true;
      if (compNorm.includes('after school') && stuNorm.includes('after school')) return true;
      if (compNorm.includes('competitive') && stuNorm.includes('competitive')) return true;
    }
  }

  const compNumbers = extractGradeNumbers(competitionGrade);
  const stuNumbers = extractGradeNumbers(studentGrade);

  // If numeric grades are present (e.g. Grade 11 vs Grade 6):
  if (compNumbers.length > 0 && stuNumbers.length > 0) {
    return stuNumbers.some((num) => compNumbers.includes(num));
  }

  // Fallback: sanitized string match
  const cleanComp = compNorm.replace(/[^a-z0-9]/g, '');
  const cleanStu = stuNorm.replace(/[^a-z0-9]/g, '');

  if (cleanComp && cleanStu && (cleanComp === cleanStu || cleanComp.includes(cleanStu) || cleanStu.includes(cleanComp))) return true;

  return false;
}

/**
 * Standard list of educational grades & after-school competitive exam categories in Sri Lankan system
 */
export const AVAILABLE_GRADES = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5 (Scholarship / புலமைப்பரிசில்)',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11 (O/L)',
  'Grade 12 (A/L)',
  'Grade 13 (A/L)',
  'After School - Teaching Exam (ஆசிரியர் பரீட்சை)',
  'After School - GS (Gramasewaka / கிராம உத்தியோகத்தர்)',
  'After School - MA (Management Assistant / மேலாண்மை உதவியாளர்)',
  'After School - SLEAS (SL Education Admin Service)',
  'After School - SLAS (SL Administrative Service)',
  'After School - General Competitive Exam (பொது போட்டிப் பரீட்சை)',
];


// ---------------------------------------------------------------------------
// SRI LANKAN SINGLE CURRICULUM PATH SPECIFICATION & AUTOMATIC GRADE DETECTION
// ---------------------------------------------------------------------------

export type CurriculumPathId =
  | 'primary_early'       // Grades 1–2 (ஆரம்ப நிலை / Early Primary)
  | 'primary_late'        // Grades 3–5 (புலமைப்பரிசில் பிரிவு / Primary Scholarship)
  | 'junior'              // Grades 6–9 (இடைநிலைப் பிரிவு / Junior Secondary)
  | 'senior'              // Grades 10–11 (சாதாரண தரம் G.C.E. O/L)
  | 'advanced'            // Grades 12–13 (உயர்தரம் G.C.E. A/L)
  | 'career_competitive'; // After School / Public Service Gazettes (MSO, SLEAS, SLPS, SLAS)

export interface StudentCurriculumPath {
  id: CurriculumPathId;
  titleTa: string;
  titleEn: string;
  titleSi: string;
  stageBadgeTa: string;
  stageBadgeEn: string;
  stageBadgeSi: string;
  grades: number[];
  gradeRangeLabelTa: string;
  gradeRangeLabelEn: string;
  icon: string;
  badgeColor: string;
  cardGradient: string;
  mcqOptionCount: 3 | 4;
  curriculumStandard: string;
  coreSubjectsTa: string[];
  coreSubjectsEn: string[];
  descriptionTa: string;
  descriptionEn: string;
}

export const CURRICULUM_PATHS_REGISTRY: Record<CurriculumPathId, StudentCurriculumPath> = {
  primary_early: {
    id: 'primary_early',
    titleTa: 'ஆரம்ப நிலை பாடத்திட்டம் (தரம் 01 - 02)',
    titleEn: 'Early Primary Curriculum Path (Grades 01 - 02)',
    titleSi: 'මූලික ප්‍රාථමික විෂය නිර්දේශ මාවත (01 - 02 ශ්‍රේණි)',
    stageBadgeTa: '🌱 தரம் 01 - 02 (ஆரம்ப நிலை)',
    stageBadgeEn: '🌱 Grade 01 - 02 (Early Primary)',
    stageBadgeSi: '🌱 01 - 02 ශ්‍රේණි (මූලික ප්‍රාථමික)',
    grades: [1, 2],
    gradeRangeLabelTa: 'தரம் 1 முதல் 2 வரை',
    gradeRangeLabelEn: 'Grades 1 to 2',
    icon: '🌱',
    badgeColor: 'bg-emerald-600 text-white border-emerald-400',
    cardGradient: 'from-emerald-950 via-teal-900 to-slate-900',
    mcqOptionCount: 3,
    curriculumStandard: 'National Institute of Education (NIE) / e-Thaksalawa Early Primary Activity-Based Curriculum (2026 Reforms Active)',
    coreSubjectsTa: ['ஆரம்பக் கணிதம்', 'சுற்றாடல்சார் செயற்பாடுகள் (ERA)', 'தமிழ் மொழி', 'ஆங்கிலம்'],
    coreSubjectsEn: ['Early Mathematics', 'Environmental Studies (ERA)', 'Language', 'Basic English'],
    descriptionTa: 'எளிய ஒற்றை இலக்க கூட்டல்/கழித்தல், வண்ணப் புதிர்கள் மற்றும் ஆரம்ப மொழிப் பயிற்சிகள் கொண்ட தனித்துவ பாடத்திட்டப் பாதை.',
    descriptionEn: 'Single-digit arithmetic, basic foundational visual logic & play-based early primary learning.',
  },
  primary_late: {
    id: 'primary_late',
    titleTa: 'புலமைப்பரிசில் பாடத்திட்டம் (தரம் 03 - 05)',
    titleEn: 'Primary Scholarship Curriculum Path (Grades 03 - 05)',
    titleSi: 'ශිෂ්‍යත්ව විෂය නිර්දේශ මාවත (03 - 05 ශ්‍රේණි)',
    stageBadgeTa: '🌿 தரம் 03 - 05 (புலமைப்பரிசில்)',
    stageBadgeEn: '🌿 Grade 03 - 05 (Scholarship)',
    stageBadgeSi: '🌿 03 - 05 ශ්‍රේණි (ශිෂ්‍යත්ව)',
    grades: [3, 4, 5],
    gradeRangeLabelTa: 'தரம் 3 முதல் 5 வரை',
    gradeRangeLabelEn: 'Grades 3 to 5',
    icon: '🌿',
    badgeColor: 'bg-teal-600 text-white border-teal-400',
    cardGradient: 'from-teal-950 via-emerald-900 to-slate-900',
    mcqOptionCount: 3,
    curriculumStandard: 'Department of Examinations Sri Lanka Grade 5 Scholarship Examination Standards',
    coreSubjectsTa: ['புலமைப்பரிசில் நுண்ணறிவு (Scholarship IQ)', 'கணிதம்', 'மொழித்திறன்', 'சுற்றாடல்'],
    coreSubjectsEn: ['Scholarship IQ & Logic', 'Primary Mathematics', 'First Language', 'Environmental Studies'],
    descriptionTa: 'இலங்கை பரீட்சைத் திணைக்கள தரம் 5 புலமைப்பரிசில் பரீட்சைக்கான மாதிரி வினாக்கள், வாய்ப்பாடுகள் மற்றும் நுண்ணறிவுப் பயிற்சிகள்.',
    descriptionEn: 'Double-digit arithmetic, multiplication tables, visual aptitude & official Sri Lankan Grade 5 Scholarship prep.',
  },
  junior: {
    id: 'junior',
    titleTa: 'இடைநிலைப் பிரிவு பாடத்திட்டம் (தரம் 06 - 09)',
    titleEn: 'Junior Secondary Curriculum Path (Grades 06 - 09)',
    titleSi: 'කනිෂ්ඨ ද්විතීයික විෂය නිර්දේශ මාවත (06 - 09 ශ්‍රේණි)',
    stageBadgeTa: '📘 தரம் 06 - 09 (இடைநிலைப் பிரிவு)',
    stageBadgeEn: '📘 Grade 06 - 09 (Junior Secondary)',
    stageBadgeSi: '📘 06 - 09 ශ්‍රේණි (කනිෂ්ඨ ද්විතීයික)',
    grades: [6, 7, 8, 9],
    gradeRangeLabelTa: 'தரம் 6 முதல் 9 வரை',
    gradeRangeLabelEn: 'Grades 6 to 9',
    icon: '📘',
    badgeColor: 'bg-blue-600 text-white border-blue-400',
    cardGradient: 'from-blue-950 via-indigo-900 to-slate-900',
    mcqOptionCount: 4,
    curriculumStandard: 'NIE Junior Secondary Modular Curriculum Framework (2026 Modular Reform Aligned)',
    coreSubjectsTa: ['கணிதம்', 'விஞ்ஞானம்', 'வரலாறு', 'ICT & தொழில்நுட்பம்', 'தமிழ்/சிங்களம்', 'ஆங்கிலம்'],
    coreSubjectsEn: ['Mathematics', 'Science', 'History', 'Information Technology', 'Language', 'English'],
    descriptionTa: 'அடிப்படை இயற்கணிதம், இருபடி எண்கள், விஞ்ஞான வினாக்கள் மற்றும் ஜூனியர் ஒலிம்பியாட் பாடத்திட்டப் பாதை.',
    descriptionEn: 'Squares, division, rapid order of operations, junior science & modular secondary education.',
  },
  senior: {
    id: 'senior',
    titleTa: 'சாதாரண தரம் O/L பாடத்திட்டம் (தரம் 10 - 11)',
    titleEn: 'G.C.E. O/L Curriculum Path (Grades 10 - 11)',
    titleSi: 'අ.පො.ස. සා/පෙ විෂය නිර්දේශ මාවත (10 - 11 ශ්‍රේණි)',
    stageBadgeTa: '🎓 தரம் 10 - 11 (சாதாரண தரம் O/L)',
    stageBadgeEn: '🎓 Grade 10 - 11 (G.C.E. O/L)',
    stageBadgeSi: '🎓 10 - 11 ශ්‍රේණි (අ.පො.ස. සා/පෙ)',
    grades: [10, 11],
    gradeRangeLabelTa: 'தரம் 10 முதல் 11 வரை (O/L)',
    gradeRangeLabelEn: 'Grades 10 to 11 (O/L)',
    icon: '🎓',
    badgeColor: 'bg-indigo-600 text-white border-indigo-400',
    cardGradient: 'from-indigo-950 via-purple-900 to-slate-900',
    mcqOptionCount: 4,
    curriculumStandard: 'Sri Lanka Department of Examinations National G.C.E. O/L Examination Standard',
    coreSubjectsTa: ['O/L கணிதம்', 'விஞ்ஞானம்', 'வரலாறு', 'வணிகம் / ICT', 'முதல் மொழி', 'ஆங்கிலம்'],
    coreSubjectsEn: ['O/L Mathematics', 'Science', 'History', 'Commerce / ICT', 'First Language', 'English'],
    descriptionTa: 'இலங்கை க.பொ.த சாதாரண தரப் பரீட்சைக்கான பிரத்தியேக தேசிய மாதிரிப் பரீட்சைகள், வர்க்கமூலம், சதவீதங்கள் மற்றும் தர்க்க சிந்தனை.',
    descriptionEn: 'Square roots, percentages, fast mental algebra, national past paper questions & O/L logic.',
  },
  advanced: {
    id: 'advanced',
    titleTa: 'உயர்தரம் A/L பாடத்திட்டம் (தரம் 12 - 13)',
    titleEn: 'G.C.E. A/L Curriculum Path (Grades 12 - 13)',
    titleSi: 'අ.පො.ස. උ/පෙ විෂය නිර්දේශ මාවත (12 - 13 ශ්‍රේණි)',
    stageBadgeTa: '🚀 தரம் 12 - 13 (உயர் தரம் A/L)',
    stageBadgeEn: '🚀 Grade 12 - 13 (G.C.E. A/L)',
    stageBadgeSi: '🚀 12 - 13 ශ්‍රේණි (අ.පො.ස. උ/පෙ)',
    grades: [12, 13],
    gradeRangeLabelTa: 'தரம் 12 முதல் 13 வரை (A/L)',
    gradeRangeLabelEn: 'Grades 12 to 13 (A/L)',
    icon: '🚀',
    badgeColor: 'bg-purple-600 text-white border-purple-400',
    cardGradient: 'from-purple-950 via-indigo-950 to-slate-900',
    mcqOptionCount: 4,
    curriculumStandard: 'Sri Lanka Department of Examinations National G.C.E. A/L Subject Syllabuses',
    coreSubjectsTa: ['இணைந்த கணிதம்', 'உயிரியல்', 'பௌதிகவியல்', 'இரசாயனவியல்', 'தொழில்நுட்பவியல்', 'வர்த்தகம் & கலை'],
    coreSubjectsEn: ['Combined Maths', 'Biology', 'Physics', 'Chemistry', 'Technology', 'Commerce & Arts'],
    descriptionTa: 'இலங்கை க.பொ.த உயர்தர பாடத்திட்டத்திற்கான வேகக் கணக்கீடுகள், உயர்நிலை அறிவியல் தர்க்கம் மற்றும் துறைசார் மாதிரி வினாக்கள்.',
    descriptionEn: 'A/L rapid powers, higher roots, calculus aptitude, scientific reasoning & advanced stream practice.',
  },
  career_competitive: {
    id: 'career_competitive',
    titleTa: 'அரச சேவை & போட்டிப் பரீட்சை பாடத்திட்டம்',
    titleEn: 'Public Service & Competitive Exams Curriculum Path',
    titleSi: 'රාජ්‍ය සේවා & තරඟ විභාග විෂය නිර්දේශ මාවත',
    stageBadgeTa: '🏛️ அரச சேவை & போட்டிப் பரீட்சைகள்',
    stageBadgeEn: '🏛️ Public Service & Competitive Exams',
    stageBadgeSi: '🏛️ රාජ්‍ය සේවා තරඟ විභාග',
    grades: [],
    gradeRangeLabelTa: 'பாடசாலைக்குப் பிந்திய போட்டிப் பரீட்சைகள்',
    gradeRangeLabelEn: 'After School & Public Service Competitive Exams',
    icon: '🏛️',
    badgeColor: 'bg-slate-800 text-white border-slate-600',
    cardGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    mcqOptionCount: 4,
    curriculumStandard: 'Official Sri Lanka Government Gazette & Schemes of Recruitment (SOR)',
    coreSubjectsTa: ['பொது அறிவு (GK)', 'நுண்ணறிவு & தர்க்கம் (IQ)', 'அரச நிர்வாக நடைமுறைகள்', 'மொழித்திறன்'],
    coreSubjectsEn: ['General Knowledge (GK)', 'IQ & Logical Reasoning', 'Public Administration', 'Official Language Proficiency'],
    descriptionTa: 'முகாமைத்துவ சேவை (MSO), கல்வி நிர்வாக சேவை (SLEAS), அதிபர் சேவை (SLPS), ஆசிரியர் மற்றும் நிர்வாக சேவை (SLAS) பரீட்சைகளுக்கான தயாரிப்பு.',
    descriptionEn: 'Gazette-aligned competitive examination prep for MSO, SLEAS, SLPS, SLAS & Island-wide Public Services.',
  },
};

/**
 * Automatically detects the student's academic curriculum path from their grade string.
 * Maps any variant ("Grade 02", "Grade 2", "தரம் 2", "Grade 11 (O/L)") deterministically to ONE single path.
 */
export function detectStudentCurriculumPath(gradeStr?: string): StudentCurriculumPath {
  if (!gradeStr) {
    return CURRICULUM_PATHS_REGISTRY.junior;
  }
  const s = gradeStr.trim().toLowerCase();

  // 1. Check for Career / Public Service / After School keywords
  if (
    s.includes('after school') ||
    s.includes('teaching') ||
    s.includes('ஆசிரியர்') ||
    s.includes('gs') ||
    s.includes('gramasewaka') ||
    s.includes('கிராம உத்தியோகத்தர்') ||
    s.includes('ma') ||
    s.includes('management assistant') ||
    s.includes('மேலாண்மை') ||
    s.includes('mso') ||
    s.includes('sleas') ||
    s.includes('slas') ||
    s.includes('slps') ||
    s.includes('career') ||
    s.includes('competitive') ||
    s.includes('போட்டிப் பரீட்சை')
  ) {
    return CURRICULUM_PATHS_REGISTRY.career_competitive;
  }

  // 2. Extract numeric grade
  const nums = extractGradeNumbers(gradeStr);
  if (nums.length > 0) {
    const num = nums[0];
    if (num === 1 || num === 2) return CURRICULUM_PATHS_REGISTRY.primary_early;
    if (num >= 3 && num <= 5) return CURRICULUM_PATHS_REGISTRY.primary_late;
    if (num >= 6 && num <= 9) return CURRICULUM_PATHS_REGISTRY.junior;
    if (num === 10 || num === 11) return CURRICULUM_PATHS_REGISTRY.senior;
    if (num === 12 || num === 13) return CURRICULUM_PATHS_REGISTRY.advanced;
  }

  // 3. Fallback string checks for grade terms
  if (
    s.includes('scholarship') ||
    s.includes('புலமைப்பரிசில்') ||
    s.includes('grade 5') ||
    s.includes('தரம் 5') ||
    s.includes('grade 4') ||
    s.includes('grade 3')
  ) {
    return CURRICULUM_PATHS_REGISTRY.primary_late;
  }

  if (
    s.includes('grade 1') ||
    s.includes('grade 2') ||
    s.includes('தரம் 1') ||
    s.includes('தரம் 2') ||
    s.includes('primary') ||
    s.includes('ஆரம்ப')
  ) {
    return CURRICULUM_PATHS_REGISTRY.primary_early;
  }

  if (
    s.includes('o/l') ||
    s.includes('ol') ||
    s.includes('ordinary') ||
    s.includes('சாதாரண தரம்') ||
    s.includes('grade 10') ||
    s.includes('grade 11')
  ) {
    return CURRICULUM_PATHS_REGISTRY.senior;
  }

  if (
    s.includes('a/l') ||
    s.includes('al') ||
    s.includes('advanced') ||
    s.includes('உயர்தரம்') ||
    s.includes('grade 12') ||
    s.includes('grade 13')
  ) {
    return CURRICULUM_PATHS_REGISTRY.advanced;
  }

  return CURRICULUM_PATHS_REGISTRY.junior;
}
