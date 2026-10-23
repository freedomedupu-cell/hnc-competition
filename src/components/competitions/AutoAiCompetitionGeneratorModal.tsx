import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Competition, CompetitionType, QuestionItem } from '../../types';
import { Modal } from '../common/Modal';
import { SRI_LANKA_25_DISTRICTS, PROVINCES_OF_SRI_LANKA } from '../../data/sriLankaDistricts';
import { generateSriLankanCurriculumCompetition } from '../../data/sriLankanCurriculumFallback';
import {
  Sparkles,
  HelpCircle,
  FileText,
  Trophy,
  Compass,
  Zap,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
  BookOpen,
  Award,
  AlertCircle,
  Send,
  Loader2,
  Edit,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Sliders,
} from 'lucide-react';

export type AiEventMode =
  | 'quiz'
  | 'exam'
  | 'competition'
  | 'island_quest'
  | 'edu_arena'
  | 'district_quiz';

interface AutoAiCompetitionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'super_admin' | 'admin';
  onImportToEditor?: (comp: Competition) => void;
}

const EVENT_MODES: {
  id: AiEventMode;
  nameEn: string;
  nameTa: string;
  nameSi: string;
  descEn: string;
  descTa: string;
  icon: React.ReactNode;
  badge: string;
  color: string;
  border: string;
  bgLight: string;
}[] = [
  {
    id: 'quiz',
    nameEn: 'Standard Quiz',
    nameTa: 'பாட வினாடி வினா',
    nameSi: 'විෂය ප්‍රශ්නාවලිය',
    descEn: 'Fast-paced curriculum test with timed MCQs and instant student feedback.',
    descTa: 'பாடத்திட்ட அடிப்படையிலான விரைவு வினாடி வினா. உடனடி புள்ளிகள்.',
    icon: <HelpCircle className="w-5 h-5 text-purple-600" />,
    badge: 'Standard Quiz',
    color: 'from-purple-600 to-indigo-600',
    border: 'border-purple-200 hover:border-purple-500',
    bgLight: 'bg-purple-50/50',
  },
  {
    id: 'exam',
    nameEn: 'Term Exam / National Paper',
    nameTa: 'தவணைப் பரீட்சை / தேசிய வினாத்தாள்',
    nameSi: 'වාර විභාගය / ජාතික ප්‍රශ්න පත්‍රය',
    descEn: 'NIE aligned examination paper with mark schemes, learning outcomes, and explanations.',
    descTa: 'இலங்கை கல்வி அமைச்சு (NIE) பாடத்திட்ட தவணை அல்லது மாதிரிப் பரீட்சைத் தாள்.',
    icon: <FileText className="w-5 h-5 text-indigo-600" />,
    badge: 'Curriculum Exam',
    color: 'from-indigo-600 to-blue-600',
    border: 'border-indigo-200 hover:border-indigo-500',
    bgLight: 'bg-indigo-50/50',
  },
  {
    id: 'competition',
    nameEn: 'National Olympiad / Competition',
    nameTa: 'தேசிய ஒலிம்பியாட் / கல்விப் போட்டி',
    nameSi: 'ජාතික ඔලිම්පියාඩ් / තරඟය',
    descEn: 'High-stakes academic challenge awarding Gold, Silver, and Bronze medals & merits.',
    descTa: 'அனைத்திலங்கை மட்ட மாணவர்களுக்கான கௌரவப் பதக்கங்கள் மற்றும் சான்றிதழ் போட்டி.',
    icon: <Trophy className="w-5 h-5 text-amber-600" />,
    badge: 'National Olympiad',
    color: 'from-amber-500 to-orange-600',
    border: 'border-amber-200 hover:border-amber-500',
    bgLight: 'bg-amber-50/50',
  },
  {
    id: 'island_quest',
    nameEn: 'Island Quest (தீவு வினா வேட்டை)',
    nameTa: 'இலங்கைத் தீவு வினா வேட்டை',
    nameSi: 'ශ්‍රී ලංකා දූපත් ගවේෂණය',
    descEn: 'Interactive journey across Sri Lanka’s 9 provinces with milestone unlocks & folklore.',
    descTa: 'இலங்கையின் 9 மாகாணங்களையும் இணைக்கும் ஆய்வுப் பயணம் & வினா வேட்டை.',
    icon: <Compass className="w-5 h-5 text-emerald-600" />,
    badge: 'Island Quest',
    color: 'from-emerald-600 to-teal-600',
    border: 'border-emerald-200 hover:border-emerald-500',
    bgLight: 'bg-emerald-50/50',
  },
  {
    id: 'edu_arena',
    nameEn: 'Edu Arena (Rapid Fire Challenge)',
    nameTa: 'கல்வி அரங்கு (மின்னல் வேகம்)',
    nameSi: 'අධ්‍යාපනික පිටිය (ක්ෂණික අභියෝගය)',
    descEn: 'Speed battle arena with time-pressure countdowns and combo multipliers.',
    descTa: 'மின்னல் வேக கவுண்ட்டவுன், காம்போ மல்டிபிளையர் புள்ளிகள் மற்றும் நேரடி தரவரிசை.',
    icon: <Zap className="w-5 h-5 text-rose-600" />,
    badge: 'Speed Arena',
    color: 'from-rose-600 to-orange-600',
    border: 'border-rose-200 hover:border-rose-500',
    bgLight: 'bg-rose-50/50',
  },
  {
    id: 'district_quiz',
    nameEn: 'District Championship (25 Districts)',
    nameTa: '25 மாவட்ட வினாடி வினா சாம்பியன்ஷிப்',
    nameSi: 'දිස්ත්‍රික්ක 25 ශූරතාවය',
    descEn: 'Inter-district competition focusing on the history, geography, and culture of a specific district.',
    descTa: 'குறிப்பிட்ட மாவட்டத்தின் வரலாறு, புவியியல், கலாசாரம் மற்றும் பாடப்புலமை சார்ந்த போட்டி.',
    icon: <MapPin className="w-5 h-5 text-blue-600" />,
    badge: 'District Cup',
    color: 'from-blue-600 to-cyan-600',
    border: 'border-blue-200 hover:border-blue-500',
    bgLight: 'bg-blue-50/50',
  },
];

const SRI_LANKA_SUBJECTS = [
  { name: 'Mathematics (கணிதம்)', en: 'Mathematics', ta: 'கணிதம்', si: 'ගණිතය' },
  { name: 'Science (விஞ்ஞானம்)', en: 'Science', ta: 'விஞ்ஞானம்', si: 'විද්‍යාව' },
  { name: 'Tamil Language & Literature (தமிழ் மொழியும் இலக்கியமும்)', en: 'Tamil Language', ta: 'தமிழ் மொழி', si: 'දෙමළ භාෂාව' },
  { name: 'English Language (ஆங்கிலம்)', en: 'English Language', ta: 'ஆங்கில மொழி', si: 'ඉංග්‍රීසි භාෂාව' },
  { name: 'Sinhala Language (சிங்கள மொழி)', en: 'Sinhala Language', ta: 'சிங்கள மொழி', si: 'සිංහල භාෂාව' },
  { name: 'History (வரலாறு)', en: 'History', ta: 'வரலாறு', si: 'ඉතිහාසය' },
  { name: 'Information & Comm. Technology (ICT)', en: 'ICT', ta: 'தகவல் தொடர்பாடல் தொழில்நுட்பம் (ICT)', si: 'තොරතුරු තාක්ෂණය' },
  { name: 'Geography (புவியியல்)', en: 'Geography', ta: 'புவியியல்', si: 'භූගෝල විද්‍යාව' },
  { name: 'Civic Education (குடிமைக்கல்வி)', en: 'Civic Education', ta: 'குடிமைக்கல்வி', si: 'පුරවැසි අධ්‍යාපනය' },
  { name: 'Commerce & Accounting (வணிகக் கல்வி)', en: 'Commerce', ta: 'வணிகக் கல்வி', si: 'ව්‍යාපාර අධ්‍යයනය' },
  { name: 'General Knowledge (பொது அறிவு)', en: 'General Knowledge', ta: 'பொது அறிவு', si: 'සාමාන්‍ය දැනීම' },
  { name: 'Sri Lankan Heritage & Culture', en: 'Sri Lankan Heritage', ta: 'இலங்கை மரபுரிமையும் கலாசாரமும்', si: 'ශ්‍රී ලංකා උරුමය' },
];

export interface GradeTierConfig {
  tierKey: 'early_primary' | 'upper_primary' | 'junior_secondary' | 'ol' | 'al' | 'general';
  tierTitleTa: string;
  tierTitleEn: string;
  badgeLabelTa: string;
  badgeLabelEn: string;
  optionsCount: number;
  optionsLetters: string[];
  defaultQuestionCount: number;
  questionChoices: { value: number; labelTa: string; labelEn: string; isStandard?: boolean }[];
  defaultDuration: number;
  examPatternDescTa: string;
  examPatternDescEn: string;
}

export function getOptionLettersForCount(count: number): string[] {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const safe = Math.max(2, Math.min(6, count || 4));
  return letters.slice(0, safe);
}

export function getGradeTierConfig(grade: string): GradeTierConfig {
  const g = (grade || '').toLowerCase();

  // Open Exam / பொதுத் தேர்வு / All Grades
  if (
    g.includes('open') ||
    g.includes('பொது') ||
    g.includes('திறந்த') ||
    g.includes('all grades') ||
    g.includes('all-island open')
  ) {
    return {
      tierKey: 'general',
      tierTitleTa: 'பொதுத் தேர்வு (Open Exam / All Grades)',
      tierTitleEn: 'Open Exam / All Grades (Open Category)',
      badgeLabelTa: 'பொதுத் தேர்வு • திறந்த போட்டி',
      badgeLabelEn: 'Open Exam • All Grades Standard',
      optionsCount: 4,
      optionsLetters: ['A', 'B', 'C', 'D'],
      defaultQuestionCount: 20,
      questionChoices: [
        { value: 10, labelTa: '10 வினாக்கள் (விரைவுச் சோதனை)', labelEn: '10 Questions (Quick Review)' },
        { value: 15, labelTa: '15 வினாக்கள் (அலகுத் தேர்வு)', labelEn: '15 Questions (Unit Test)' },
        { value: 20, labelTa: '20 வினாக்கள் (நிலையான போட்டி)', labelEn: '20 Questions (Standard Contest)' },
        { value: 30, labelTa: '30 வினாக்கள் (மாதிரி வினாத்தாள்)', labelEn: '30 Questions (Model Exam)' },
        { value: 40, labelTa: '40 வினாக்கள் (தேசிய தேர்வு)', labelEn: '40 Questions (National Paper)' },
        { value: 50, labelTa: '50 வினாக்கள் (முழுத் தேர்வு - 50 MCQs)', labelEn: '50 Questions (Full Paper)', isStandard: true },
        { value: 75, labelTa: '75 வினாக்கள் (தீவிர வினாத்தாள் - 75 MCQs)', labelEn: '75 Questions (Intensive Paper)' },
        { value: 100, labelTa: '100 வினாக்கள் (மாபெரும் திறந்த தேர்வு - 100 MCQs)', labelEn: '100 Questions (Grand Challenge)' },
      ],
      defaultDuration: 30,
      examPatternDescTa: 'அனைத்து வகுப்பு அல்லது பொதுப் போட்டிக்கான திறந்த நிலை தேர்வு வடிவம் (3 முதல் 6 தெரிவுகள் மற்றும் விருப்பமான வினாக்கள் எண்ணிக்கை).',
      examPatternDescEn: 'Open competition format with customizable 3 to 6 answer options and custom question counts up to 100+.',
    };
  }

  // A/L - Grades 12 & 13 (Strictly 5 Options: A, B, C, D, E by default)
  if (g.includes('grade 12') || g.includes('grade 13') || g.includes('a/l') || g.includes('உயர்தரம்') || g.includes('advanced')) {
    return {
      tierKey: 'al',
      tierTitleTa: 'க.பொ.த உயர்தரம் (G.C.E. A/L)',
      tierTitleEn: 'G.C.E. Advanced Level (Grades 12–13)',
      badgeLabelTa: '5 தெரிவுகள் (A, B, C, D, E) • A/L தேசிய தரம்',
      badgeLabelEn: '5 Options (A, B, C, D, E) • A/L National Standard',
      optionsCount: 5,
      optionsLetters: ['A', 'B', 'C', 'D', 'E'],
      defaultQuestionCount: 20,
      questionChoices: [
        { value: 10, labelTa: '10 வினாக்கள் (விரைவு மீளாய்வு)', labelEn: '10 Questions (Quick Review)' },
        { value: 20, labelTa: '20 வினாக்கள் (அலகு மாதிரிப் பயிற்சி)', labelEn: '20 Questions (Unit Practice)' },
        { value: 30, labelTa: '30 வினாக்கள் (தீவிர தவணைத் தேர்வு)', labelEn: '30 Questions (Intensive Term Paper)' },
        { value: 40, labelTa: '40 வினாக்கள் (முன்னோடிப் பரீட்சை)', labelEn: '40 Questions (Pilot Examination)' },
        { value: 50, labelTa: '50 வினாக்கள் (G.C.E. A/L பகுதி 1 முழு வினாத்தாள் - 50 MCQs)', labelEn: '50 Questions (Full G.C.E. A/L Paper 1 Standard)', isStandard: true },
        { value: 75, labelTa: '75 வினாக்கள் (தீவிர வினாத்தாள்)', labelEn: '75 Questions (Intensive Paper)' },
        { value: 100, labelTa: '100 வினாக்கள் (மெகா வினாத்தாள்)', labelEn: '100 Questions (Mega Paper)' },
      ],
      defaultDuration: 45,
      examPatternDescTa: 'இலங்கை பரீட்சைத் திணைக்களத்தின் A/L முறைமையின்படி 5 விடைத் தெரிவுகள் (A, B, C, D, E) மற்றும் 20 முதல் 50+ வினாக்கள் வரை.',
      examPatternDescEn: 'Strictly aligned with Sri Lanka Dept of Examinations G.C.E. A/L 5-Option Paper 1 standard (20 to 50+ MCQs).',
    };
  }

  // O/L - Grades 10 & 11 (4 Options: A, B, C, D by default)
  if (g.includes('grade 10') || g.includes('grade 11') || g.includes('o/l') || g.includes('சாதாரண தரம்')) {
    return {
      tierKey: 'ol',
      tierTitleTa: 'க.பொ.த சாதாரண தரம் (G.C.E. O/L)',
      tierTitleEn: 'G.C.E. Ordinary Level (Grades 10–11)',
      badgeLabelTa: '4 தெரிவுகள் (A, B, C, D) • O/L தேசிய தரம்',
      badgeLabelEn: '4 Options (A, B, C, D) • O/L Standard',
      optionsCount: 4,
      optionsLetters: ['A', 'B', 'C', 'D'],
      defaultQuestionCount: 15,
      questionChoices: [
        { value: 10, labelTa: '10 வினாக்கள் (விரைவுச் சோதனை)', labelEn: '10 Questions (Fast Test)' },
        { value: 15, labelTa: '15 வினாக்கள் (அலகுத் தேர்வு)', labelEn: '15 Questions (Unit Test)' },
        { value: 20, labelTa: '20 வினாக்கள் (தவணை மாதிரித் தாள்)', labelEn: '20 Questions (Term Model)' },
        { value: 30, labelTa: '30 வினாக்கள் (தீவிர வினாத்தாள்)', labelEn: '30 Questions (Intensive Paper)' },
        { value: 40, labelTa: '40 வினாக்கள் (G.C.E. O/L பகுதி 1 முழுத் தாள் - 40 MCQs)', labelEn: '40 Questions (Full G.C.E. O/L Paper 1 Standard)', isStandard: true },
        { value: 50, labelTa: '50 வினாக்கள் (விரிவாக்கப்பட்ட மாதிரித் தாள்)', labelEn: '50 Questions (Extended Paper)' },
        { value: 75, labelTa: '75 வினாக்கள் (மெகா அலகுத் தேர்வு)', labelEn: '75 Questions (Mega Unit Paper)' },
        { value: 100, labelTa: '100 வினாக்கள் (முழுமையான வினாத் தொகுப்பு)', labelEn: '100 Questions (Complete Pool)' },
      ],
      defaultDuration: 30,
      examPatternDescTa: 'இலங்கை O/L பாடத்திட்ட தரநிலைக்கு ஏற்ப 4 தெரிவுகள் மற்றும் 10 முதல் 40+ வினாக்கள் வரை.',
      examPatternDescEn: 'Aligned with G.C.E. O/L Paper 1 40-MCQ 4-Option format with custom scaling.',
    };
  }

  // Junior Secondary - Grades 6 - 9 (4 Options: A, B, C, D)
  if (g.includes('grade 6') || g.includes('grade 7') || g.includes('grade 8') || g.includes('grade 9')) {
    return {
      tierKey: 'junior_secondary',
      tierTitleTa: 'இடைநிலைப் பிரிவு (Grades 6–9)',
      tierTitleEn: 'Junior Secondary (Grades 6–9)',
      badgeLabelTa: '4 தெரிவுகள் (A, B, C, D) • இடைநிலை தரம்',
      badgeLabelEn: '4 Options (A, B, C, D) • Secondary Tier',
      optionsCount: 4,
      optionsLetters: ['A', 'B', 'C', 'D'],
      defaultQuestionCount: 10,
      questionChoices: [
        { value: 5, labelTa: '5 வினாக்கள் (விரைவு மீளாய்வு)', labelEn: '5 Questions (Quick Review)' },
        { value: 10, labelTa: '10 வினாக்கள் (வகுப்பறை வினாடி வினா)', labelEn: '10 Questions (Classroom Quiz)' },
        { value: 15, labelTa: '15 வினாக்கள் (அலகுப் பரீட்சை)', labelEn: '15 Questions (Unit Exam)' },
        { value: 20, labelTa: '20 வினாக்கள் (தவணைப் பரீட்சை)', labelEn: '20 Questions (Term Exam)' },
        { value: 25, labelTa: '25 வினாக்கள் (மாகாண கல்விப் போட்டி)', labelEn: '25 Questions (Provincial Challenge)' },
        { value: 40, labelTa: '40 வினாக்கள் (முழுத் தவணைத் தாள்)', labelEn: '40 Questions (Full Term Exam)' },
        { value: 50, labelTa: '50 வினாக்கள் (விரிவாக்கப்பட்ட பயிற்சி)', labelEn: '50 Questions (Extended Paper)' },
      ],
      defaultDuration: 25,
      examPatternDescTa: 'இடைநிலைப் பாடத்திட்டத்திற்கு அமைவாக 4 விடைத் தெரிவுகள் (A, B, C, D) மற்றும் 5 முதல் 50 வினாக்கள் வரை.',
      examPatternDescEn: 'Junior secondary standard with 4 options and customizable questions.',
    };
  }

  // Upper Primary / Scholarship - Grades 4 - 5 (4 Options: A, B, C, D)
  if (g.includes('grade 4') || g.includes('grade 5') || g.includes('scholarship') || g.includes('புலமைப்பரிசில்')) {
    return {
      tierKey: 'upper_primary',
      tierTitleTa: 'மேல் ஆரம்பம் & புலமைப்பரிசில் (Grades 4–5)',
      tierTitleEn: 'Upper Primary & Grade 5 Scholarship',
      badgeLabelTa: '4 தெரிவுகள் (A, B, C, D) • புலமைப்பரிசில் தரம்',
      badgeLabelEn: '4 Options (A, B, C, D) • Scholarship Standard',
      optionsCount: 4,
      optionsLetters: ['A', 'B', 'C', 'D'],
      defaultQuestionCount: 10,
      questionChoices: [
        { value: 5, labelTa: '5 வினாக்கள் (விரைவுப் பயிற்சி)', labelEn: '5 Questions (Fast Drill)' },
        { value: 10, labelTa: '10 வினாக்கள் (நிலையான பயிற்சி)', labelEn: '10 Questions (Standard Practice)' },
        { value: 15, labelTa: '15 வினாக்கள் (அலகு மாதிரி வினாத்தாள்)', labelEn: '15 Questions (Unit Test)' },
        { value: 20, labelTa: '20 வினாக்கள் (முழுப் புலமைப்பரிசில் மாதிரி - 20 MCQs)', labelEn: '20 Questions (Full Scholarship Model)' },
        { value: 30, labelTa: '30 வினாக்கள் (தீவிர மாதிரிப் பரீட்சை)', labelEn: '30 Questions (Intensive Model)' },
        { value: 50, labelTa: '50 வினாக்கள் (மெகா வினாப் பயிற்சி)', labelEn: '50 Questions (Mega Scholarship Paper)' },
      ],
      defaultDuration: 20,
      examPatternDescTa: 'தரம் 5 புலமைப்பரிசில் தேசிய வினாத்தாள் முறைக்கு ஏற்ப 4 தெரிவுகள் மற்றும் 5 முதல் 50 வினாக்கள் வரை.',
      examPatternDescEn: 'Grade 5 scholarship standard with 4 options and customizable question counts.',
    };
  }

  // Early Primary - Grades 1 - 3 (3 Options: A, B, C by default)
  if (g.includes('grade 1') || g.includes('grade 2') || g.includes('grade 3')) {
    return {
      tierKey: 'early_primary',
      tierTitleTa: 'ஆரம்பப் பிரிவு (Grades 1–3)',
      tierTitleEn: 'Early Primary (Grades 1–3)',
      badgeLabelTa: '3 தெரிவுகள் (A, B, C) • ஆரம்பப் பள்ளி தரம்',
      badgeLabelEn: '3 Options (A, B, C) • Early Primary Standard',
      optionsCount: 3,
      optionsLetters: ['A', 'B', 'C'],
      defaultQuestionCount: 5,
      questionChoices: [
        { value: 5, labelTa: '5 வினாக்கள் (எளிய பயிற்சி)', labelEn: '5 Questions (Simple Drill)' },
        { value: 8, labelTa: '8 வினாக்கள் (நிலையான வினாடிவினா)', labelEn: '8 Questions (Standard Quiz)' },
        { value: 10, labelTa: '10 வினாக்கள் (முழுப் பரீட்சை)', labelEn: '10 Questions (Complete Test)' },
        { value: 15, labelTa: '15 வினாக்கள் (அலகு மாதிரி)', labelEn: '15 Questions (Unit Model)' },
        { value: 20, labelTa: '20 வினாக்கள் (விரிவு வினாடி வினா)', labelEn: '20 Questions (Extended Quiz)' },
      ],
      defaultDuration: 10,
      examPatternDescTa: 'சிறு மாணவர்களின் புரிதலுக்கு ஏற்ப எளிமையான 3 விடைத் தெரிவுகள் (A, B, C) மற்றும் 5 முதல் 20 வினாக்கள் வரை.',
      examPatternDescEn: 'Early childhood cognitive pacing with 3 options and customizable questions.',
    };
  }

  // General / Open Default
  return {
    tierKey: 'general',
    tierTitleTa: 'அனைத்துப் பிரிவுகள் (Open to All Grades)',
    tierTitleEn: 'All Grades Open Tier',
    badgeLabelTa: 'பொதுத் தரம் • திறந்த தேர்வு',
    badgeLabelEn: 'General Standard • Open Tier',
    optionsCount: 4,
    optionsLetters: ['A', 'B', 'C', 'D'],
    defaultQuestionCount: 15,
    questionChoices: [
      { value: 5, labelTa: '5 வினாக்கள் (Draft)', labelEn: '5 Questions (Draft)' },
      { value: 10, labelTa: '10 வினாக்கள் (Standard)', labelEn: '10 Questions (Standard)' },
      { value: 15, labelTa: '15 வினாக்கள் (Full Test)', labelEn: '15 Questions (Full Test)' },
      { value: 20, labelTa: '20 வினாக்கள் (Grand Challenge)', labelEn: '20 Questions (Grand Challenge)' },
      { value: 30, labelTa: '30 வினாக்கள் (Mega Exam)', labelEn: '30 Questions (Mega Exam)' },
      { value: 50, labelTa: '50 வினாக்கள் (50 MCQs Full Paper)', labelEn: '50 Questions (50 MCQs Full Paper)', isStandard: true },
      { value: 75, labelTa: '75 வினாக்கள் (75 MCQs Intensive)', labelEn: '75 Questions (75 MCQs Intensive)' },
      { value: 100, labelTa: '100 வினாக்கள் (100 MCQs Grand Open)', labelEn: '100 Questions (100 MCQs Grand Open)' },
    ],
    defaultDuration: 30,
    examPatternDescTa: 'பொதுத் தேவைகளுக்கான தெரிவுகள் மற்றும் விருப்பத்திற்கேற்ற வினாக்கள் எண்ணிக்கை.',
    examPatternDescEn: 'Standard competition configuration with custom options and question counts.',
  };
}

const GRADE_LEVELS = [
  'Open Exam / பொதுத் தேர்வு (All Grades)',
  'Grade 10',
  'Grade 11 (O/L)',
  'Grade 12 (A/L)',
  'Grade 13 (A/L)',
  'Grade 5 (Scholarship)',
  'Grade 9',
  'Grade 8',
  'Grade 7',
  'Grade 6',
  'Grade 4',
  'Grade 3',
  'Grade 2',
  'Grade 1',
  'custom',
];

export const AutoAiCompetitionGeneratorModal: React.FC<AutoAiCompetitionGeneratorModalProps> = ({
  isOpen,
  onClose,
  role,
  onImportToEditor,
}) => {
  const {
    saveCompetition,
    language,
    currentAdmin,
    superAdminUser,
    currentAuthUser,
  } = useApp();

  const [selectedMode, setSelectedMode] = useState<AiEventMode>('quiz');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics (கணிதம்)');
  const [customSubject, setCustomSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [customGrade, setCustomGrade] = useState('');
  const [selectedMedium, setSelectedMedium] = useState<'Tamil' | 'English' | 'Sinhala'>('Tamil');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [optionsCount, setOptionsCount] = useState<number>(4);
  const [customOptionsInput, setCustomOptionsInput] = useState<string>('4');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [customQuestionInput, setCustomQuestionInput] = useState<string>('15');
  const [duration, setDuration] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Challenging'>('Medium');
  const [customPromptNote, setCustomPromptNote] = useState('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Active grade tier config (calculates defaults)
  const tierConfig = getGradeTierConfig(selectedGrade === 'custom' ? (customGrade || 'Open Exam') : selectedGrade);

  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    const newConfig = getGradeTierConfig(newGrade);
    setOptionsCount(newConfig.optionsCount);
    setCustomOptionsInput(String(newConfig.optionsCount));
    setQuestionCount(newConfig.defaultQuestionCount);
    setCustomQuestionInput(String(newConfig.defaultQuestionCount));
    setDuration(newConfig.defaultDuration);
  };

  const handleOptionCountChange = (val: number) => {
    const clamped = Math.max(2, Math.min(6, val));
    setOptionsCount(clamped);
    setCustomOptionsInput(String(clamped));
  };

  const handleQuestionCountChange = (val: number) => {
    const safe = Math.max(1, Math.min(200, val));
    setQuestionCount(safe);
    setCustomQuestionInput(String(safe));
  };

  const cleanErrorText = (raw: string): string => {
    if (!raw) return 'Unable to generate questions at this time. Please try again.';
    try {
      if (raw.includes('{') && raw.includes('}')) {
        const jsonStr = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed?.error?.message) {
          return parsed.error.message;
        }
        if (parsed?.message) {
          return parsed.message;
        }
      }
    } catch {}
    if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
      return 'Google AI மாடல் சேவையில் தற்காலிக நெரிசல் ஏற்பட்டுள்ளது (High Demand). மீண்டும் முயற்சிக்கவும்.';
    }
    return raw;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    const activeSubject = customSubject.trim() || selectedSubject;
    const effectiveGrade = selectedGrade === 'custom' ? (customGrade.trim() || 'Open Exam') : selectedGrade;

    try {
      const response = await fetch('/api/auto-generate-competition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: selectedMode,
          subject: activeSubject,
          category: activeSubject,
          grade: effectiveGrade,
          medium: selectedMedium,
          district: selectedDistrict,
          questionCount,
          optionsCount,
          duration,
          difficulty,
          customTopic: customPromptNote,
        }),
      });

      const result = await response.json();
      if (result.success && result.competition) {
        setGeneratedData(result.competition);
        if (result.source === 'fallback') {
          setSuccessNotice('✨ பாடத்திட்ட அடிப்படையிலான வினாக்கள் வெற்றிகரமாகத் தொகுக்கப்பட்டுள்ளன!');
        }
      } else {
        console.warn('API returned non-success, using curriculum engine:', result.error);
        const fallback = generateSriLankanCurriculumCompetition({
          mode: selectedMode,
          subject: activeSubject,
          grade: effectiveGrade,
          medium: selectedMedium,
          district: selectedDistrict,
          questionCount,
          optionsCount,
          duration,
          difficulty,
          customTopic: customPromptNote,
        });
        setGeneratedData(fallback);
        setSuccessNotice('✨ பாடத்திட்ட அடிப்படையிலான வினாக்கள் வெற்றிகரமாகத் தொகுக்கப்பட்டுள்ளன!');
      }
    } catch (err: any) {
      console.warn('Network notice, using curriculum engine:', err);
      try {
        const fallback = generateSriLankanCurriculumCompetition({
          mode: selectedMode,
          subject: activeSubject,
          grade: effectiveGrade,
          medium: selectedMedium,
          district: selectedDistrict,
          questionCount,
          optionsCount,
          duration,
          difficulty,
          customTopic: customPromptNote,
        });
        setGeneratedData(fallback);
        setSuccessNotice('✨ பாடத்திட்ட அடிப்படையிலான வினாக்கள் வெற்றிகரமாகத் தொகுக்கப்பட்டுள்ளன!');
      } catch (fErr: any) {
        setErrorMessage(cleanErrorText(err.message));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Build competition object
  const buildCompetitionPayload = (approvalStatus: 'approved' | 'pending_approval', status: string): Partial<Competition> => {
    if (!generatedData) return {};
    const effectiveGrade = selectedGrade === 'custom' ? (customGrade.trim() || 'Open Exam') : selectedGrade;

    const questions: QuestionItem[] = (generatedData.questions || []).map((q: any, idx: number) => ({
      id: q.id || `q_${Date.now()}_${idx + 1}`,
      type: 'multiple_choice',
      questionText: q.questionText || `Question ${idx + 1}`,
      options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'Option A'),
      marks: q.marks || 2,
      explanation: q.explanation || '',
      learningOutcome: q.learningOutcome || '',
      difficulty: q.difficulty || difficulty,
    }));

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 2), 0);
    const now = new Date();
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days window

    let compType: CompetitionType = 'Quiz';
    if (selectedMode === 'exam') compType = 'Exam';
    else if (selectedMode === 'competition') compType = 'Competition';
    else if (selectedMode === 'island_quest') compType = 'Island Quest';
    else if (selectedMode === 'edu_arena') compType = 'Edu Arena';
    else if (selectedMode === 'district_quiz') compType = 'District Quiz';

    const adminName = currentAuthUser?.fullName || currentAdmin?.name || (role === 'super_admin' ? superAdminUser.name : 'Staff');
    const adminId = currentAuthUser?.uid || currentAdmin?.id || 'admin-auto';

    return {
      title: generatedData.title || `AI Generated ${compType} - ${selectedSubject}`,
      description: generatedData.description || `Strictly aligned with Sri Lankan Curriculum (${effectiveGrade}).`,
      competitionType: compType,
      category: generatedData.category || generatedData.subject || selectedSubject,
      grade: effectiveGrade,
      language: selectedMedium as any,
      duration: generatedData.duration || duration,
      entryType: 'Free',
      entryFee: 0,
      prizesEnabled: true,
      prizePool: selectedMode === 'competition' ? 'Gold & Silver Medals + Honors' : 'Certificate of Merit',
      prizeDetails: generatedData.prizeDetails || {
        firstPrize: '1st Place Gold Medal & Honors',
        secondPrize: '2nd Place Silver Medal',
        thirdPrize: '3rd Place Bronze Medal',
        participationCertificate: 'Digital Certificate of Merit',
      },
      registrationStart: now.toISOString().split('T')[0],
      registrationEnd: end.toISOString().split('T')[0],
      competitionStart: now.toISOString().split('T')[0],
      competitionEnd: end.toISOString().split('T')[0],
      competitionStartTime: '08:00',
      competitionEndTime: '22:00',
      status: status as any,
      questions,
      questionsCount: questions.length,
      totalMarks,
      leadAdminId: adminId,
      leadAdminName: adminName,
      district: selectedDistrict || '',
      province: '',
      scope: selectedDistrict ? 'district' : 'all_island',
      approvalStatus,
      approvalComment: role === 'super_admin' ? 'Approved directly by Super Admin' : 'Submitted for Super Admin approval',
      approvedBy: role === 'super_admin' ? adminId : undefined,
      approvedByName: role === 'super_admin' ? adminName : undefined,
      approvedAt: role === 'super_admin' ? new Date().toISOString() : undefined,
      isAiGenerated: true,
      aiMode: selectedMode,
    };
  };

  // Super Admin: Direct Approve & Publish
  const handleApproveAndPublish = async () => {
    try {
      const payload = buildCompetitionPayload('approved', 'Registration Open');
      await saveCompetition(payload as any);
      setSuccessNotice('🎉 Approved & Published! This challenge is now active and live in the Student Arena.');
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish competition.');
    }
  };

  // Save to Pending Queue (or Submit for Approval for regular admin)
  const handleSubmitForApproval = async () => {
    try {
      const payload = buildCompetitionPayload('pending_approval', 'Pending Approval');
      await saveCompetition(payload as any);
      if (role === 'super_admin') {
        setSuccessNotice('💾 Saved to Pending Approvals queue for review.');
      } else {
        setSuccessNotice('📤 Successfully submitted to Super Admin for approval and publication!');
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save competition.');
    }
  };

  // Transfer to manual question paper studio
  const handleTransferToEditor = () => {
    if (!generatedData) return;
    const payload = buildCompetitionPayload('pending_approval', 'Draft');
    if (onImportToEditor) {
      onImportToEditor(payload as any);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-6 max-h-[85vh] overflow-y-auto px-1">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white p-6 shadow-md border border-indigo-700/50">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-amber-950" /> Gemini 3.8 Flash
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-blue-200 border border-white/20">
                  {role === 'super_admin' ? 'Super Admin Direct Publisher' : 'Admin Submitter'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                🇱🇰 Auto AI Competition, Exam & Arena Generator
              </h2>
              <p className="text-xs text-blue-200/90 max-w-xl">
                Automatically generate curriculum-aligned academic contests across 6 event modes: Standard Quiz, Term Exam, Competition, Island Quest, Edu Arena, and District Quiz with authentic Sri Lankan NIE competencies.
              </p>
            </div>

            <div className="shrink-0 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">Option Rule (தெரிவு விதி)</span>
              <span className="text-xs font-black text-amber-300">
                {optionsCount} Options ({getOptionLettersForCount(optionsCount).join(', ')})
              </span>
              <span className="text-[9px] text-blue-200/90 block font-medium mt-0.5">
                {optionsCount === 3
                  ? '3 தெரிவுகள் (A, B, C)'
                  : optionsCount === 4
                  ? '4 தெரிவுகள் (A, B, C, D)'
                  : optionsCount === 5
                  ? '5 தெரிவுகள் (A, B, C, D, E)'
                  : `${optionsCount} தெரிவுகள் (${getOptionLettersForCount(optionsCount).join(', ')})`}
              </span>
            </div>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-3 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-2xs shrink-0 flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>மீண்டும் முயற்சி செய் (Retry)</span>
            </button>
          </div>
        )}

        {/* Step 1: Select Event Mode (6 Modes) */}
        {!generatedData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white inline-flex items-center justify-center text-[10px]">1</span>
                <span>Select Event Mode (6 தனித்துவமான நிகழ்வு முறைகள்)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Click to select mode</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EVENT_MODES.map((mode) => {
                const isSelected = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSelectedMode(mode.id);
                      if (mode.id === 'district_quiz' && !selectedDistrict) {
                        setSelectedDistrict('Jaffna');
                      }
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? `ring-2 ring-blue-600 border-blue-600 ${mode.bgLight} shadow-sm`
                        : `${mode.border} bg-white hover:shadow-xs`
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-white shadow-2xs border border-slate-100">
                          {mode.icon}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {mode.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {mode.nameEn}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-600">
                        {mode.nameTa}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                        {mode.descEn}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[10px] font-bold text-blue-700">
                        <span>Selected Mode</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Configure Academic Parameters */}
        {!generatedData && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white inline-flex items-center justify-center text-[10px]">2</span>
                <span>Configure Syllabus & Target Specifications (பாடத்திட்ட விவரங்கள்)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Subject */}
              <div className="space-y-1 lg:col-span-2">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Subject / Discipline (பாடம்)</span>
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SRI_LANKA_SUBJECTS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  <option value="custom">✏️ Other Custom Subject (Specify below)</option>
                </select>
                {selectedSubject === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom subject / topic name..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Grade */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Grade Level (வகுப்பு)</span>
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>
                      {g === 'Open Exam / பொதுத் தேர்வு (All Grades)'
                        ? '🌟 Open Exam / பொதுத் தேர்வு (அனைத்து வகுப்புகள் / Open Category)'
                        : g === 'custom'
                        ? '✏️ Type Custom Grade (பிற வகுப்பு / தனிப்பயன் தரம்)'
                        : g}
                    </option>
                  ))}
                </select>
                {selectedGrade === 'custom' && (
                  <input
                    type="text"
                    placeholder="e.g. Open Exam, University, Teacher Service..."
                    value={customGrade}
                    onChange={(e) => setCustomGrade(e.target.value)}
                    className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                )}
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                    tierConfig.tierKey === 'al'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : tierConfig.tierKey === 'early_primary'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}>
                    <span>⚡ {tierConfig.badgeLabelTa}</span>
                  </span>
                </div>
              </div>

              {/* Medium / Language */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                  <span>Medium (மொழி)</span>
                </label>
                <select
                  value={selectedMedium}
                  onChange={(e) => setSelectedMedium(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tamil">தமிழ் (Tamil Medium)</option>
                  <option value="English">English (English Medium)</option>
                  <option value="Sinhala">සිංහල (Sinhala Medium)</option>
                </select>
              </div>

              {/* Option Rule / Answer Choices (3, 4, 5, 6 தெரிவுகள் - Quick Buttons & Type-In) */}
              <div className="space-y-1.5 lg:col-span-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Option Rule / விடை தெரிவுகள் (3, 4, 5, 6)</span>
                  </label>
                  <span className="text-[10px] font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300">
                    {optionsCount} Options ({getOptionLettersForCount(optionsCount).join(', ')})
                  </span>
                </div>

                {/* Quick Option Count Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 4, 5, 6].map((cnt) => {
                    const isAct = optionsCount === cnt;
                    const letters = getOptionLettersForCount(cnt).join(', ');
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleOptionCountChange(cnt)}
                        className={`py-1.5 px-2 rounded-lg text-center font-bold text-xs border transition-all cursor-pointer ${
                          isAct
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs ring-2 ring-amber-400'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-xs font-black">{cnt} தெரிவுகள்</span>
                        <span className="block text-[9px] font-semibold opacity-90">({letters})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Type-In Input for Options Count */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                    நேரடியாக தட்டச்சு செய்ய (Type Count 2–6):
                  </span>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={customOptionsInput}
                    onChange={(e) => {
                      setCustomOptionsInput(e.target.value);
                      const parsed = parseInt(e.target.value, 10);
                      if (!isNaN(parsed) && parsed >= 2 && parsed <= 6) {
                        setOptionsCount(parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(customOptionsInput, 10);
                      const safe = Math.max(2, Math.min(6, isNaN(parsed) ? 4 : parsed));
                      setOptionsCount(safe);
                      setCustomOptionsInput(String(safe));
                    }}
                    className="w-16 px-2 py-1 rounded-md border border-amber-300 text-center font-black text-slate-900 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="3-6"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">
                    {optionsCount === 3
                      ? 'ஆரம்பப் பள்ளி (A, B, C)'
                      : optionsCount === 4
                      ? 'O/L தேசிய தரம் (A, B, C, D)'
                      : optionsCount === 5
                      ? 'A/L உயர்தரம் (A, B, C, D, E)'
                      : 'விரிவான 6 தெரிவுகள் (A–F)'}
                  </span>
                </div>
              </div>

              {/* Questions Count (Higher Numbers 50, 75, 100 + Direct Type-In) */}
              <div className="space-y-1.5 lg:col-span-2 p-3 rounded-xl bg-blue-50/60 border border-blue-200/80">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Questions Count / வினாக்கள் எண்ணிக்கை</span>
                  </label>
                  <span className="text-[10px] font-black text-blue-900 bg-blue-200/80 px-2.5 py-0.5 rounded-full border border-blue-300">
                    {questionCount} வினாக்கள் ({questionCount >= 50 ? 'அதிக எண்ணிக்கை' : 'நிலையானது'})
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1">
                  {[10, 15, 20, 25, 30, 40, 50, 75, 100].map((num) => {
                    const isAct = questionCount === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleQuestionCountChange(num)}
                        className={`px-2 py-1 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                          isAct
                            ? 'bg-blue-600 text-white border-blue-700 shadow-2xs ring-2 ring-blue-400'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                        {num >= 50 ? ' 🔥' : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Direct Type-In Input */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                    விருப்பமான எண்ணிக்கை (Type Count):
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={150}
                    value={customQuestionInput}
                    onChange={(e) => {
                      setCustomQuestionInput(e.target.value);
                      const parsed = parseInt(e.target.value, 10);
                      if (!isNaN(parsed) && parsed >= 1 && parsed <= 200) {
                        setQuestionCount(parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(customQuestionInput, 10);
                      const safe = Math.max(1, Math.min(200, isNaN(parsed) ? 15 : parsed));
                      setQuestionCount(safe);
                      setCustomQuestionInput(String(safe));
                    }}
                    className="w-20 px-2.5 py-1 rounded-md border border-blue-300 text-center font-black text-slate-900 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 50"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">
                    1 முதல் 100+ வரை எவ்வளவு வினாக்களையும் தட்டச்சு செய்யலாம்
                  </span>
                </div>
              </div>

              {/* Target District Scope */}
              <div className="space-y-1 lg:col-span-2">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target District / Scope (மாவட்டம்)</span>
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">🌐 All-Island Sri Lanka (அனைத்திலங்கை)</option>
                  {SRI_LANKA_25_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.nameEn}>
                      {d.icon} {d.nameTa} ({d.nameEn}) - {d.provinceTa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Duration (நேரம்)</span>
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 Minutes (Speed Test / ஆரம்பம்)</option>
                  <option value={15}>15 Minutes (Short Quiz)</option>
                  <option value={20}>20 Minutes (Standard)</option>
                  <option value={25}>25 Minutes (Secondary)</option>
                  <option value={30}>30 Minutes (Term Model)</option>
                  <option value={45}>45 Minutes (Full O/L & A/L Exam)</option>
                  <option value={60}>60 Minutes (National Olympiad)</option>
                  <option value={90}>90 Minutes (A/L 50 MCQ Standard)</option>
                  <option value={120}>120 Minutes (Open Marathon Exam)</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-rose-600" />
                  <span>Difficulty (கடினத்தன்மை)</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Easy">Easy (அடிப்படைப் பயிற்சி)</option>
                  <option value="Medium">Medium (தவணைத் தேர்வு தரம்)</option>
                  <option value="Hard">Hard (தேசிய வினாத்தாள் தரம்)</option>
                  <option value="Challenging">Challenging (ஒலிம்பியாட் கடினம்)</option>
                </select>
              </div>

              {/* Custom Topic / NIE Unit Focus */}
              <div className="space-y-1 lg:col-span-4">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Specific NIE Unit / Competency Focus (விருப்பத்திற்கேற்ப குறிப்பிட்ட பாடம் / அலகு)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. அலகு 4: முக்கோணவியல் மற்றும் கேத்திரகணிதம், அல்லது Term 2 Unit Revision..."
                  value={customPromptNote}
                  onChange={(e) => setCustomPromptNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Academic Tier Scaling Info Card */}
              <div className="lg:col-span-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white shadow-xs ${
                    optionsCount >= 5
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                      : optionsCount === 3
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                  }`}>
                    {optionsCount}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{tierConfig.tierTitleTa}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        optionsCount >= 5
                          ? 'bg-purple-200/80 text-purple-900 border border-purple-300'
                          : optionsCount === 3
                          ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                          : 'bg-blue-200/80 text-blue-900 border border-blue-300'
                      }`}>
                        {optionsCount} விடைக் குறிப்புகள் ({getOptionLettersForCount(optionsCount).join(', ')})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {tierConfig.examPatternDescTa}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-white/95 px-3 py-1.5 rounded-lg border border-slate-200/80 shrink-0">
                  <span className="text-blue-700">தெரிவுகள்: {getOptionLettersForCount(optionsCount).join(', ')}</span>
                  <span>•</span>
                  <span className="text-indigo-700">{questionCount} வினாக்கள் ({duration} நிமி)</span>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {role === 'super_admin'
                    ? 'Super Admin Mode: Can publish instantly to live students or queue for review.'
                    : 'Admin Mode: Will be routed to Super Admin for approval and publication.'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white font-bold text-xs hover:from-blue-800 hover:to-purple-800 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Gemini AI Generating Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Auto-Generate with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generated Preview & Super Admin Approval Controls */}
        {generatedData && (
          <div className="space-y-5 animate-in fade-in">
            {/* Generated Header Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-md border border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                    {generatedData.competitionType || selectedMode.toUpperCase()}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    {generatedData.grade || selectedGrade}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    {generatedData.language || selectedMedium}
                  </span>
                  {generatedData.district && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                      📍 {generatedData.district}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{generatedData.duration || duration} mins</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>{generatedData.questions?.length || 0} Questions</span>
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">{generatedData.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {generatedData.description}
                </p>
              </div>

              {/* Prize strip */}
              {generatedData.prizeDetails && (
                <div className="pt-2 border-t border-slate-700/80 flex flex-wrap items-center gap-3 text-[11px] text-amber-300">
                  <span className="font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> 1st: {generatedData.prizeDetails.firstPrize}
                  </span>
                  <span>•</span>
                  <span>2nd: {generatedData.prizeDetails.secondPrize}</span>
                  <span>•</span>
                  <span>3rd: {generatedData.prizeDetails.thirdPrize}</span>
                </div>
              )}
            </div>

            {/* Questions List Accordion / Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Review Generated Questions ({generatedData.questions?.length || 0})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setGeneratedData(null)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Change Parameters</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {(generatedData.questions || []).map((q: any, idx: number) => {
                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-black text-xs inline-flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {q.questionText}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                          {q.marks || 2} Marks
                        </span>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                        {(q.options || []).map((opt: string, optIdx: number) => {
                          const isCorrect = opt.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
                          const optLabel = ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] || String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-between ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className={`w-4 h-4 rounded text-[10px] font-bold inline-flex items-center justify-center ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {optLabel}
                                </span>
                                <span>{opt}</span>
                              </span>
                              {isCorrect && (
                                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-200 px-1.5 py-0.5 rounded">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation & Learning Outcome */}
                      {(q.explanation || q.learningOutcome) && (
                        <div className="pl-8 pt-1 text-[11px] text-slate-500 space-y-0.5 border-t border-slate-100 mt-2">
                          {q.learningOutcome && (
                            <p className="font-semibold text-indigo-700">
                              🎯 Competency: {q.learningOutcome}
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-slate-600 italic">
                              💡 Explanation: {q.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approval Workflow Action Bar */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTransferToEditor}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Fine-tune in Paper Studio</span>
              </button>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5 text-slate-300" />
                  <span>
                    {role === 'super_admin' ? 'Save as Pending Review' : 'Submit for Super Admin Approval'}
                  </span>
                </button>

                {role === 'super_admin' && (
                  <button
                    type="button"
                    onClick={handleApproveAndPublish}
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Approve & Publish to Arena</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
