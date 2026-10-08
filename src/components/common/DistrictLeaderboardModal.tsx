import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Sparkles,
  MapPin,
  Filter,
  X,
  Search,
  Star,
  Zap,
  Globe,
  CheckCircle2,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Modal } from './Modal';
import { SRI_LANKA_25_DISTRICTS } from '../../data/sriLankaDistricts';
import { useApp } from '../../context/AppContext';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  school: string;
  districtKey: string;
  districtNameTa: string;
  districtNameEn: string;
  districtNameSi?: string;
  gradeCategory: 'primary' | 'junior' | 'senior' | 'advanced' | 'after_school';
  gradeText: string;
  totalXp: number;
  completedDistrictsCount: number;
  crownsCount: number;
  accuracyPercent: number;
  isCurrentUser?: boolean;
  avatarUrl?: string;
}

export const DISTRICT_LEADERBOARD_STORAGE_KEY = 'hnc_edu_arena_25_districts_leaderboard_v2';

// Realistic sample top performers across Sri Lankan districts
const SEEDED_ISLAND_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lead-1',
    rank: 1,
    name: 'க. சுகந்தன் (K. Suganthan)',
    school: 'Jaffna Hindu College, Jaffna',
    districtKey: 'jaffna',
    districtNameTa: 'யாழ்ப்பாணம்',
    districtNameEn: 'Jaffna',
    gradeCategory: 'advanced',
    gradeText: 'Grade 13 (A/L Science)',
    totalXp: 18450,
    completedDistrictsCount: 25,
    crownsCount: 24,
    accuracyPercent: 98,
  },
  {
    id: 'lead-2',
    rank: 2,
    name: 'M. Fernando',
    school: 'Royal College, Colombo',
    districtKey: 'colombo',
    districtNameTa: 'கொழும்பு',
    districtNameEn: 'Colombo',
    gradeCategory: 'senior',
    gradeText: 'Grade 11 (O/L Maths)',
    totalXp: 16900,
    completedDistrictsCount: 23,
    crownsCount: 20,
    accuracyPercent: 95,
  },
  {
    id: 'lead-3',
    rank: 3,
    name: 'த. முஹம்மத் (T. Mohamed)',
    school: "St. Michael's College, Batticaloa",
    districtKey: 'batticaloa',
    districtNameTa: 'மட்டக்களப்பு',
    districtNameEn: 'Batticaloa',
    gradeCategory: 'advanced',
    gradeText: 'Grade 12 (A/L Bio)',
    totalXp: 15420,
    completedDistrictsCount: 21,
    crownsCount: 18,
    accuracyPercent: 94,
  },
  {
    id: 'lead-4',
    rank: 4,
    name: 'A. B. Perera',
    school: 'Dharmaraja College, Kandy',
    districtKey: 'kandy',
    districtNameTa: 'கண்டி',
    districtNameEn: 'Kandy',
    gradeCategory: 'senior',
    gradeText: 'Grade 10',
    totalXp: 14100,
    completedDistrictsCount: 19,
    crownsCount: 16,
    accuracyPercent: 92,
  },
  {
    id: 'lead-5',
    rank: 5,
    name: 'வி. கிருஷாந்த் (V. Kirushanth)',
    school: 'Trincomalee Hindu College',
    districtKey: 'trincomalee',
    districtNameTa: 'திருகோணமலை',
    districtNameEn: 'Trincomalee',
    gradeCategory: 'junior',
    gradeText: 'Grade 9',
    totalXp: 12850,
    completedDistrictsCount: 17,
    crownsCount: 14,
    accuracyPercent: 91,
  },
  {
    id: 'lead-6',
    rank: 6,
    name: 'S. Wickramasinghe',
    school: 'Maliyadeva College, Kurunegala',
    districtKey: 'kurunegala',
    districtNameTa: 'குருநாகல்',
    districtNameEn: 'Kurunegala',
    gradeCategory: 'advanced',
    gradeText: 'Grade 13 (Commerce)',
    totalXp: 11900,
    completedDistrictsCount: 16,
    crownsCount: 12,
    accuracyPercent: 89,
  },
  {
    id: 'lead-7',
    rank: 7,
    name: 'ஆர். கவிதா (R. Kavitha)',
    school: 'Vavuniya Tamil Maha Vidyalayam',
    districtKey: 'vavuniya',
    districtNameTa: 'வவுனியா',
    districtNameEn: 'Vavuniya',
    gradeCategory: 'primary',
    gradeText: 'Grade 5 (Scholarship)',
    totalXp: 10800,
    completedDistrictsCount: 15,
    crownsCount: 11,
    accuracyPercent: 96,
  },
  {
    id: 'lead-8',
    rank: 8,
    name: 'D. De Silva',
    school: 'Southlands College, Galle',
    districtKey: 'galle',
    districtNameTa: 'காலி',
    districtNameEn: 'Galle',
    gradeCategory: 'junior',
    gradeText: 'Grade 8',
    totalXp: 9650,
    completedDistrictsCount: 13,
    crownsCount: 10,
    accuracyPercent: 88,
  },
  {
    id: 'lead-9',
    rank: 9,
    name: 'பி. லவன் (P. Lavan)',
    school: 'Kilinochchi Central College',
    districtKey: 'kilinochchi',
    districtNameTa: 'கிளிநொச்சி',
    districtNameEn: 'Kilinochchi',
    gradeCategory: 'senior',
    gradeText: 'Grade 11',
    totalXp: 8900,
    completedDistrictsCount: 12,
    crownsCount: 9,
    accuracyPercent: 87,
  },
  {
    id: 'lead-10',
    rank: 10,
    name: 'N. Jayasuriya',
    school: 'Central College, Anuradhapura',
    districtKey: 'anuradhapura',
    districtNameTa: 'அனுராதபுரம்',
    districtNameEn: 'Anuradhapura',
    gradeCategory: 'advanced',
    gradeText: 'Grade 12',
    totalXp: 8100,
    completedDistrictsCount: 11,
    crownsCount: 8,
    accuracyPercent: 85,
  },
  {
    id: 'lead-11',
    rank: 11,
    name: 'செ. அபிராமி (S. Abirami)',
    school: 'Ampara Carmel Fatima College',
    districtKey: 'ampara',
    districtNameTa: 'அம்பாறை',
    districtNameEn: 'Ampara',
    gradeCategory: 'primary',
    gradeText: 'Grade 4',
    totalXp: 7450,
    completedDistrictsCount: 10,
    crownsCount: 8,
    accuracyPercent: 93,
  },
  {
    id: 'lead-12',
    rank: 12,
    name: 'K. Bandara',
    school: 'Uva Science College, Badulla',
    districtKey: 'badulla',
    districtNameTa: 'பதுளை',
    districtNameEn: 'Badulla',
    gradeCategory: 'senior',
    gradeText: 'Grade 10',
    totalXp: 6800,
    completedDistrictsCount: 9,
    crownsCount: 7,
    accuracyPercent: 84,
  },
  {
    id: 'lead-13',
    rank: 13,
    name: 'த. கஜன் (T. Kajan - Teaching Aspirant)',
    school: 'College of Education, Jaffna',
    districtKey: 'jaffna',
    districtNameTa: 'யாழ்ப்பாணம்',
    districtNameEn: 'Jaffna',
    gradeCategory: 'after_school',
    gradeText: 'After School - Teaching Exam',
    totalXp: 16200,
    completedDistrictsCount: 22,
    crownsCount: 21,
    accuracyPercent: 97,
  },
  {
    id: 'lead-14',
    rank: 14,
    name: 'R. M. Silva (Gramasewaka Candidate)',
    school: 'General Service Candidate, Gampaha',
    districtKey: 'gampaha',
    districtNameTa: 'கம்பஹா',
    districtNameEn: 'Gampaha',
    gradeCategory: 'after_school',
    gradeText: 'After School - GS Exam',
    totalXp: 14800,
    completedDistrictsCount: 20,
    crownsCount: 19,
    accuracyPercent: 96,
  },
  {
    id: 'lead-15',
    rank: 15,
    name: 'ச. பவதாரிணி (S. Bhavatharani - SLEAS)',
    school: 'Education Service Officer, Batticaloa',
    districtKey: 'batticaloa',
    districtNameTa: 'மட்டக்களப்பு',
    districtNameEn: 'Batticaloa',
    gradeCategory: 'after_school',
    gradeText: 'After School - SLEAS Admin Exam',
    totalXp: 13900,
    completedDistrictsCount: 18,
    crownsCount: 17,
    accuracyPercent: 95,
  },
];

interface DistrictLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserXp?: number;
  currentUserCompletedCount?: number;
  currentUserDistrictKey?: string;
  currentLanguage?: 'ta' | 'en' | 'si';
}

export const DistrictLeaderboardModal: React.FC<DistrictLeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUserXp = 0,
  currentUserCompletedCount = 0,
  currentUserDistrictKey,
  currentLanguage = 'ta',
}) => {
  const { currentAuthUser, currentStudent } = useApp();

  const [activeScope, setActiveScope] = useState<'island' | 'district'>('island');
  const [selectedDistrict, setSelectedLeaderboardDistrict] = useState<string>(
    currentUserDistrictKey || 'all'
  );
  const [selectedGradeCategory, setSelectedGradeCategory] = useState<
    'all' | 'primary' | 'junior' | 'senior' | 'advanced' | 'after_school'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sourced entries merged with live user state
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let baseList = [...SEEDED_ISLAND_LEADERBOARD];

    // Try loading persistent custom leaderboard entries
    try {
      const stored = localStorage.getItem(DISTRICT_LEADERBOARD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseList = parsed;
        }
      }
    } catch {}

    // Integrate current user live stats dynamically
    const studentName = currentStudent?.fullName || currentAuthUser?.fullName || 'நீங்கள் (Your Profile)';
    const studentSchool = currentStudent?.school || 'HNC Edu-Hub Arena Student';
    const rawDistKey = (currentStudent?.district || currentAuthUser?.district || currentUserDistrictKey || 'jaffna').toLowerCase().replace(/\s+/g, '_');
    const matchedDistInfo = SRI_LANKA_25_DISTRICTS.find((d) => d.id === rawDistKey || d.nameEn.toLowerCase() === rawDistKey) || SRI_LANKA_25_DISTRICTS[0];

    const currentGrade = currentStudent?.grade || currentAuthUser?.grade || 'Grade 10';
    let userGradeCategory: 'primary' | 'junior' | 'senior' | 'advanced' | 'after_school' = 'senior';
    const cGNorm = currentGrade.toLowerCase();
    if (
      cGNorm.includes('after school') ||
      cGNorm.includes('teaching') ||
      cGNorm.includes('gs') ||
      cGNorm.includes('gramasewaka') ||
      cGNorm.includes('ma') ||
      cGNorm.includes('management assistant') ||
      cGNorm.includes('sleas') ||
      cGNorm.includes('slas') ||
      cGNorm.includes('competitive')
    ) {
      userGradeCategory = 'after_school';
    } else if (cGNorm.includes('1') || cGNorm.includes('2') || cGNorm.includes('3') || cGNorm.includes('4') || cGNorm.includes('5')) {
      userGradeCategory = 'primary';
    } else if (cGNorm.includes('6') || cGNorm.includes('7') || cGNorm.includes('8') || cGNorm.includes('9')) {
      userGradeCategory = 'junior';
    } else if (cGNorm.includes('12') || cGNorm.includes('13') || cGNorm.includes('advanced')) {
      userGradeCategory = 'advanced';
    }

    const userEntry: LeaderboardEntry = {
      id: 'current-user-live-entry',
      rank: 0,
      name: studentName,
      school: `${studentSchool} (${matchedDistInfo.nameTa})`,
      districtKey: matchedDistInfo.id,
      districtNameTa: matchedDistInfo.nameTa,
      districtNameEn: matchedDistInfo.nameEn,
      districtNameSi: matchedDistInfo.nameSi,
      gradeCategory: userGradeCategory,
      gradeText: currentGrade,
      totalXp: currentUserXp,
      completedDistrictsCount: currentUserCompletedCount,
      crownsCount: Math.min(currentUserCompletedCount, 25),
      accuracyPercent: currentUserCompletedCount > 0 ? 92 : 0,
      isCurrentUser: true,
      avatarUrl: currentStudent?.avatarUrl || currentAuthUser?.avatarUrl,
    };

    // Filter out previous duplicate current-user entry if present
    const filteredBase = baseList.filter((e) => e.id !== 'current-user-live-entry' && !e.isCurrentUser);
    const combined = [...filteredBase, userEntry];

    // Sort descending by totalXP, completedDistrictsCount, and crowns
    combined.sort((a, b) => {
      if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
      if (b.completedDistrictsCount !== a.completedDistrictsCount) return b.completedDistrictsCount - a.completedDistrictsCount;
      return b.accuracyPercent - a.accuracyPercent;
    });

    // Reassign ranks
    const ranked = combined.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    setLeaderboardList(ranked);
  }, [currentUserXp, currentUserCompletedCount, currentUserDistrictKey, currentAuthUser, currentStudent]);

  // Apply filters
  const filteredLeaderboard = leaderboardList.filter((entry) => {
    // 1. Scope / District Filter
    if (activeScope === 'district' && selectedDistrict !== 'all') {
      if (entry.districtKey !== selectedDistrict) return false;
    }

    // 2. Grade Category Filter
    if (selectedGradeCategory !== 'all') {
      if (entry.gradeCategory !== selectedGradeCategory) return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = entry.name.toLowerCase().includes(q);
      const matchSchool = entry.school.toLowerCase().includes(q);
      const matchDistrict = entry.districtNameEn.toLowerCase().includes(q) || entry.districtNameTa.includes(q);
      if (!matchName && !matchSchool && !matchDistrict) return false;
    }

    return true;
  });

  // Top 3 Podium Winners
  const top1 = filteredLeaderboard[0];
  const top2 = filteredLeaderboard[1];
  const top3 = filteredLeaderboard[2];

  // User's own entry
  const userLiveRankEntry = leaderboardList.find((e) => e.isCurrentUser);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      preventBackdropClose={true}
      maxWidthClass="max-w-4xl"
      title={
        currentLanguage === 'ta'
          ? '🏆 25 மாவட்டங்களின் தேசிய தரவரிசைப் பட்டியல் (National Leaderboard)'
          : '🏆 25 Sri Lankan Districts National Leaderboard'
      }
    >
      <div className="space-y-5 max-h-[82vh] overflow-y-auto pr-1 text-slate-800">
        {/* Header Hero Banner with Current User Live Stats */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white shadow-lg border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/40 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>25 Districts Arena Rankings</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] font-bold border border-indigo-400/30">
                {currentLanguage === 'ta' ? 'தேசிய கல்விக் சாதனைப் பட்டியல்' : 'Official All-Island Standings'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>
                {currentLanguage === 'ta'
                  ? 'தேசிய மற்றும் மாவட்ட மாணவர் தகுதிப் பட்டியல்'
                  : 'Sri Lanka 25 Districts Academic Leaderboard'}
              </span>
            </h2>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {currentLanguage === 'ta'
                ? 'இலங்கையின் 25 மாவட்டங்களில் உயரிய XP புள்ளிகள், மகுடங்கள் மற்றும் துல்லியமான விடைகளுடன் முதலிடம் வகிக்கும் தேசிய மாணவர்கள்!'
                : 'Recognizing top academic performers and district conquerors across all 25 Sri Lankan administrative districts!'}
            </p>
          </div>

          {/* User Live Rank Badge Box */}
          {userLiveRankEntry && (
            <div className="z-10 bg-white/10 backdrop-blur-md p-3.5 px-5 rounded-2xl border border-white/20 text-center shrink-0 min-w-[170px]">
              <span className="text-[10px] uppercase font-bold text-amber-300 block mb-0.5 flex items-center justify-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>{currentLanguage === 'ta' ? 'உங்கள் தற்போதைய நிலை' : 'Your Live Rank'}</span>
              </span>
              <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                <span>#{userLiveRankEntry.rank}</span>
                <span className="text-xs font-semibold text-slate-300">/ {leaderboardList.length}</span>
              </div>
              <div className="text-[11px] font-bold text-white mt-1">
                {userLiveRankEntry.totalXp} XP • {userLiveRankEntry.completedDistrictsCount} / 25 Districts
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3 text-xs">
          {/* Top Row: Scope Switcher & Search Input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveScope('island');
                  setSelectedLeaderboardDistrict('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeScope === 'island'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'ta' ? 'அனைத்து இலங்கை (All Island)' : 'All Island'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScope('district')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeScope === 'district'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentLanguage === 'ta' ? 'மாவட்டம் வாரியாக' : 'District Wise'}</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={currentLanguage === 'ta' ? 'மாணவர் பெயர் / பாடசாலை மூலம் தேடுக...' : 'Search student or school...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bottom Row: District & Grade Category Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            {/* District Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentLanguage === 'ta' ? 'மாவட்டத் தேர்வு:' : 'Select District:'}</span>
              </span>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedLeaderboardDistrict(e.target.value);
                  if (e.target.value !== 'all') setActiveScope('district');
                }}
                className="px-3 py-1 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🌐 {currentLanguage === 'ta' ? 'அனைத்து 25 மாவட்டங்களும்' : 'All 25 Districts'}</option>
                {SRI_LANKA_25_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    📍 {currentLanguage === 'ta' ? d.nameTa : d.nameEn} ({d.provinceTa})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-500 text-[11px] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>{currentLanguage === 'ta' ? 'வகுப்புப் பிரிவு:' : 'Grade Level:'}</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedGradeCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedGradeCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {currentLanguage === 'ta' ? 'அனைத்தும்' : 'All Grades'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeCategory('primary')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedGradeCategory === 'primary'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                {currentLanguage === 'ta' ? 'ஆரம்பப் பிரிவு (Gr 1-5)' : 'Primary (Gr 1-5)'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeCategory('junior')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedGradeCategory === 'junior'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {currentLanguage === 'ta' ? 'இடைநிலைப் பிரிவு (Gr 6-9)' : 'Junior (Gr 6-9)'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeCategory('senior')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedGradeCategory === 'senior'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                {currentLanguage === 'ta' ? 'சாதாரண தரம் O/L (Gr 10-11)' : 'Senior O/L (Gr 10-11)'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeCategory('advanced')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedGradeCategory === 'advanced'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {currentLanguage === 'ta' ? 'உயர்தரம் A/L (Gr 12-13)' : 'Advanced A/L (Gr 12-13)'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeCategory('after_school')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedGradeCategory === 'after_school'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {currentLanguage === 'ta' ? '👔 போட்டிப் பரீட்சைகள் (Teaching, GS, SLEAS, SLAS)' : '👔 After School Competitions'}
              </button>
            </div>
          </div>
        </div>

        {/* TOP 3 PODIUM DISPLAY */}
        {filteredLeaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 pt-2 items-end max-w-2xl mx-auto">
            {/* Rank #2 Silver Medalist */}
            {top2 && (
              <div className="bg-gradient-to-t from-slate-200 via-slate-100 to-white p-4 rounded-2xl border-2 border-slate-300 text-center shadow-md relative space-y-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-slate-100 shadow-md">
                  🥈 #2
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[9px] font-black uppercase tracking-wider">
                  Silver Medalist
                </div>
                <div className="font-extrabold text-xs text-slate-900 truncate" title={top2.name}>
                  {top2.name}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold truncate">{top2.school}</div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-100 text-[10px] font-black shadow-xs">
                  {top2.totalXp} XP
                </div>
              </div>
            )}

            {/* Rank #1 Gold Champion */}
            {top1 && (
              <div className="bg-gradient-to-t from-amber-200 via-amber-100 to-white p-4.5 rounded-3xl border-2 border-amber-400 text-center shadow-xl relative space-y-1.5 transform -translate-y-2.5 ring-4 ring-amber-300/40">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider border border-amber-300 shadow-md flex items-center gap-1 animate-pulse">
                  <Crown className="w-3 h-3 text-slate-950" /> Gold Champion
                </div>
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 font-black text-base flex items-center justify-center border-2 border-yellow-200 shadow-md">
                  🥇 #1
                </div>
                <div className="font-black text-sm text-slate-950 truncate" title={top1.name}>
                  {top1.name}
                </div>
                <div className="text-[10px] text-amber-950 font-extrabold truncate">{top1.school}</div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-sm">
                  🔥 {top1.totalXp} XP
                </div>
              </div>
            )}

            {/* Rank #3 Bronze Contender */}
            {top3 && (
              <div className="bg-gradient-to-t from-amber-100/80 via-amber-50 to-white p-4 rounded-2xl border-2 border-amber-300/80 text-center shadow-md relative space-y-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 font-black text-sm flex items-center justify-center border-2 border-amber-400 shadow-md">
                  🥉 #3
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[9px] font-black uppercase tracking-wider">
                  Bronze Contender
                </div>
                <div className="font-extrabold text-xs text-slate-900 truncate" title={top3.name}>
                  {top3.name}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold truncate">{top3.school}</div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-900 text-amber-100 text-[10px] font-black shadow-xs">
                  {top3.totalXp} XP
                </div>
              </div>
            )}
          </div>
        )}

        {/* FULL RANKINGS LIST */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 px-2">
            <span>
              {filteredLeaderboard.length} {currentLanguage === 'ta' ? 'மாணவர்கள் தரவரிசைப் பட்டியலில்' : 'Students Ranked'}
            </span>
            <span className="text-[11px] text-slate-400">
              {currentLanguage === 'ta' ? 'XP புள்ளிகள் & பூர்த்தி செய்யப்பட்ட மாவட்டங்கள் அடிப்படையிலானது' : 'Sorted by XP Points & Districts Conquered'}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredLeaderboard.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-1">
                <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-xs text-slate-700">
                  {currentLanguage === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டியில் மாணவர்கள் எவரும் இல்லை' : 'No students found for this filter selection'}
                </p>
              </div>
            ) : (
              filteredLeaderboard.map((entry) => {
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <div
                    key={entry.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                      entry.isCurrentUser
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30 shadow-md font-semibold'
                        : isTop1
                        ? 'bg-amber-100/60 border-amber-300 shadow-2xs font-medium'
                        : isTop2
                        ? 'bg-slate-100/80 border-slate-300 shadow-2xs'
                        : isTop3
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Number / Badge */}
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isTop1
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : isTop2
                            ? 'bg-slate-300 text-slate-900'
                            : isTop3
                            ? 'bg-amber-200 text-amber-950'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        #{entry.rank}
                      </span>

                      {/* Student Info */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                            {entry.name}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                              {currentLanguage === 'ta' ? 'நீங்கள்' : 'YOU'}
                            </span>
                          )}
                          <span className="px-2 py-0.2 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                            {entry.gradeText}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                          <span>🏫 {entry.school}</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-700">
                            📍 {entry.districtNameTa} ({entry.districtNameEn})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* XP & Stats Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right space-y-0.5">
                        <span className="font-black text-amber-600 text-sm block">
                          ⚡ {entry.totalXp} XP
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          👑 {entry.completedDistrictsCount} / 25 {currentLanguage === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium">
            💡 {currentLanguage === 'ta' ? 'மாவட்டப் போர்க்களங்களில் வெற்றிபெற்று உங்கள் XP மற்றும் தரவரிசையை உயர்த்துங்கள்!' : 'Complete district quests to increase your XP and climb the national leaderboard!'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            {currentLanguage === 'ta' ? 'மூடுக' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
