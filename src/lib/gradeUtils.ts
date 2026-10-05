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
  'Open (All Grades / அனைத்து பிரிவுகளும்)',
];
