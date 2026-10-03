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

  // Open competitions are accessible to everyone
  if (
    compNorm.includes('open') ||
    compNorm.includes('all') ||
    compNorm.includes('general') ||
    compNorm.includes('அனைத்து') ||
    compNorm === ''
  ) {
    return true;
  }

  // If student hasn't specified a grade, don't block
  if (!studentGrade) return true;
  const stuNorm = studentGrade.trim().toLowerCase();
  if (
    stuNorm.includes('open') ||
    stuNorm.includes('all') ||
    stuNorm.includes('general') ||
    stuNorm === ''
  ) {
    return true;
  }

  const compNumbers = extractGradeNumbers(competitionGrade);
  const stuNumbers = extractGradeNumbers(studentGrade);

  // If both have extracted numeric grades:
  if (compNumbers.length > 0 && stuNumbers.length > 0) {
    // Student must match at least one of the competition's eligible grades
    return stuNumbers.some((num) => compNumbers.includes(num));
  }

  // Fallback: sanitized string match
  const cleanComp = compNorm.replace(/[^a-z0-9]/g, '');
  const cleanStu = stuNorm.replace(/[^a-z0-9]/g, '');

  if (cleanComp === cleanStu) return true;
  if (cleanComp.includes(cleanStu) || cleanStu.includes(cleanComp)) return true;

  return false;
}

/**
 * Standard list of educational grades in Sri Lankan school system
 */
export const AVAILABLE_GRADES = [
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11 (O/L)',
  'Grade 12 (A/L)',
  'Grade 13 (A/L)',
  'Open (All Grades)',
];
