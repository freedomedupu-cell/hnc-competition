import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentUser } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  GraduationCap,
  Search,
  School,
  Trophy,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Coins,
  Gift,
  Share2,
  Copy,
  Check,
  Plus,
  Sparkles,
  ArrowUpDown,
  Key,
  Lock,
  RotateCcw,
  Pencil,
  Filter,
  CheckCircle,
  Award,
  FileText,
  Calendar,
  Medal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { EditStudentModal } from './EditStudentModal';

export const StudentManagement: React.FC = () => {
  const {
    students,
    competitions,
    results,
    deleteStudentAccount,
    updateStudentPassword,
    updateStudentByAdmin,
    adjustStudentPoints,
    language,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'any_dup' | 'email_dup' | 'phone_dup'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'points_desc' | 'referrals_desc' | 'awards_desc' | 'name'>('default');
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<StudentUser | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editSuccessToast, setEditSuccessToast] = useState<string | null>(null);

  // Pagination states for high-performance rendering of any number of candidates
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Automatically reset to page 1 whenever any search or filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradeFilter, duplicateFilter, sortBy, pageSize]);

  // Password change state in modal
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordChangeToast, setPasswordChangeToast] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Bonus points adjustment state
  const [customPointsInput, setCustomPointsInput] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [pointAdjustToast, setPointAdjustToast] = useState<string | null>(null);
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveStudentEdit = async (
    studentUid: string,
    updatedData: any
  ) => {
    await updateStudentByAdmin(studentUid, updatedData);
    setEditSuccessToast(
      language === 'ta'
        ? 'மாணவர் விபரங்கள் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டன!'
        : 'Student details updated successfully!'
    );
    setTimeout(() => setEditSuccessToast(null), 4000);

    if (
      selectedStudent &&
      (selectedStudent.id === studentUid || selectedStudent.studentId === studentUid)
    ) {
      setSelectedStudent((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: updatedData.fullName || prev.name,
          fullName: updatedData.fullName || prev.fullName,
          studentId: updatedData.studentId || prev.studentId,
          username: updatedData.username || prev.username,
          institution: updatedData.school || prev.institution,
          school: updatedData.school || prev.school,
          gradeLevel: updatedData.grade || prev.gradeLevel,
          grade: updatedData.grade || prev.grade,
          district: updatedData.district || prev.district,
          address: updatedData.address || prev.address,
          dateOfBirth: updatedData.dateOfBirth || prev.dateOfBirth,
          guardianName: updatedData.guardianName || prev.guardianName,
          phone: updatedData.phone || prev.phone,
          status: updatedData.status || prev.status,
          referralPoints:
            updatedData.referralPoints !== undefined
              ? updatedData.referralPoints
              : prev.referralPoints,
          referralCode: updatedData.referralCode || prev.referralCode,
        };
      });
    }
  };

  const handleUpdateStudentPassword = async () => {
    if (!selectedStudent || !newPasswordInput.trim()) return;
    if (newPasswordInput.trim().length < 4) {
      setPasswordChangeToast(
        language === 'ta' ? 'கடவுச்சொல் குறைந்தது 4 எழுத்துக்கள் இருக்க வேண்டும்.' : 'Password must be at least 4 characters.'
      );
      return;
    }

    setIsChangingPassword(true);
    try {
      await updateStudentPassword(selectedStudent.id, newPasswordInput.trim());
      setSelectedStudent({
        ...selectedStudent,
        initialPassword: newPasswordInput.trim(),
      });
      setPasswordChangeToast(
        language === 'ta'
          ? 'கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது!'
          : 'Password updated successfully!'
      );
      setNewPasswordInput('');
      setTimeout(() => setPasswordChangeToast(null), 3500);
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordChangeToast(err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const totalCirculatingPoints = students.reduce(
    (acc, s) => acc + (s.referralPoints !== undefined ? s.referralPoints : 25),
    0
  );
  const totalReferralsCount = students.reduce((acc, s) => acc + (s.totalReferrals || 0), 0);

  const handleAdjustPoints = async (studentId: string, delta: number, reason?: string) => {
    setIsAdjustingPoints(true);
    try {
      const newPts = await adjustStudentPoints(studentId, delta, reason);
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({
          ...selectedStudent,
          referralPoints: newPts,
        });
      }
      setPointAdjustToast(
        language === 'ta'
          ? `புள்ளிகள் வெற்றிகரமாக மாற்றப்பட்டன! தற்போதைய இருப்பு: ${newPts} pts`
          : language === 'si'
          ? `ලකුණු යාවත්කාලීන කරන ලදී! නව ශේෂය: ${newPts} pts`
          : `Points adjusted successfully! Current balance: ${newPts} pts`
      );
      setTimeout(() => setPointAdjustToast(null), 3500);
      setCustomPointsInput('');
      setPointsReason('');
    } catch (err) {
      console.error('Failed to adjust points:', err);
    } finally {
      setIsAdjustingPoints(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudentAccount(studentToDelete.id);
      if (selectedStudent?.id === studentToDelete.id) {
        setSelectedStudent(null);
      }
      setStudentToDelete(null);
    } catch (err) {
      console.error('Failed to delete student account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Pre-calculate duplicate maps for instant O(1) detection of duplicate emails and phones
  const { emailMap, phoneMap, duplicateStudentsCount, emailDupCount, phoneDupCount } = useMemo(() => {
    const eMap = new Map<string, string[]>();
    const pMap = new Map<string, string[]>();

    students.forEach((s) => {
      if (s.email && s.email.trim()) {
        const normEmail = s.email.trim().toLowerCase();
        const list = eMap.get(normEmail) || [];
        list.push(s.id);
        eMap.set(normEmail, list);
      }

      if (s.phone && s.phone.trim()) {
        const digits = s.phone.replace(/\D/g, '');
        if (digits.length >= 7) {
          const normPhone = digits.length >= 9 ? digits.slice(-9) : digits;
          const list = pMap.get(normPhone) || [];
          list.push(s.id);
          pMap.set(normPhone, list);
        }
      }
    });

    let dupTotal = 0;
    let eDupTotal = 0;
    let pDupTotal = 0;

    students.forEach((s) => {
      let isEmailDup = false;
      let isPhoneDup = false;

      if (s.email && s.email.trim()) {
        const normEmail = s.email.trim().toLowerCase();
        const list = eMap.get(normEmail);
        if (list && list.length > 1) {
          isEmailDup = true;
          eDupTotal++;
        }
      }

      if (s.phone && s.phone.trim()) {
        const digits = s.phone.replace(/\D/g, '');
        if (digits.length >= 7) {
          const normPhone = digits.length >= 9 ? digits.slice(-9) : digits;
          const list = pMap.get(normPhone);
          if (list && list.length > 1) {
            isPhoneDup = true;
            pDupTotal++;
          }
        }
      }

      if (isEmailDup || isPhoneDup) {
        dupTotal++;
      }
    });

    return {
      emailMap: eMap,
      phoneMap: pMap,
      duplicateStudentsCount: dupTotal,
      emailDupCount: eDupTotal,
      phoneDupCount: pDupTotal,
    };
  }, [students]);

  const getDuplicateStatus = (std: StudentUser) => {
    let isEmailDup = false;
    let emailClashCount = 0;
    if (std.email && std.email.trim()) {
      const normEmail = std.email.trim().toLowerCase();
      const list = emailMap.get(normEmail);
      if (list && list.length > 1) {
        isEmailDup = true;
        emailClashCount = list.length;
      }
    }

    let isPhoneDup = false;
    let phoneClashCount = 0;
    if (std.phone && std.phone.trim()) {
      const digits = std.phone.replace(/\D/g, '');
      if (digits.length >= 7) {
        const normPhone = digits.length >= 9 ? digits.slice(-9) : digits;
        const list = phoneMap.get(normPhone);
        if (list && list.length > 1) {
          isPhoneDup = true;
          phoneClashCount = list.length;
        }
      }
    }

    return {
      isEmailDup,
      emailClashCount,
      isPhoneDup,
      phoneClashCount,
      isAnyDup: isEmailDup || isPhoneDup,
    };
  };

  // Pre-index exam results and honors by student identifiers for instant O(1) lookups
  const studentResultsStatsMap = useMemo(() => {
    const map = new Map<string, { examCount: number; medalsWon: number; avgPct: number }>();

    results.forEach((r) => {
      const keys: string[] = [];
      if (r.studentId) keys.push(r.studentId);
      if (r.studentName) keys.push(r.studentName.toLowerCase().trim());

      const isMedal = r.award && r.award !== 'Participation';
      const pct = r.percentile || r.score || 0;

      keys.forEach((key) => {
        const existing = map.get(key) || { examCount: 0, medalsWon: 0, totalPct: 0 } as any;
        existing.examCount += 1;
        if (isMedal) existing.medalsWon += 1;
        existing.totalPct = (existing.totalPct || 0) + pct;
        existing.avgPct = Math.round(existing.totalPct / existing.examCount);
        map.set(key, existing);
      });
    });

    return map;
  }, [results]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((std) => {
        const dup = getDuplicateStatus(std);

        // Apply duplicate filtering
        if (duplicateFilter === 'any_dup' && !dup.isAnyDup) return false;
        if (duplicateFilter === 'email_dup' && !dup.isEmailDup) return false;
        if (duplicateFilter === 'phone_dup' && !dup.isPhoneDup) return false;

        const term = searchTerm.toLowerCase().trim();
        if (!term && gradeFilter === 'all') return true;

        const matchesSearch =
          !term ||
          std.name.toLowerCase().includes(term) ||
          std.studentId.toLowerCase().includes(term) ||
          (std.username && std.username.toLowerCase().includes(term)) ||
          (std.district && std.district.toLowerCase().includes(term)) ||
          std.institution.toLowerCase().includes(term) ||
          std.email.toLowerCase().includes(term) ||
          (std.phone && std.phone.toLowerCase().includes(term)) ||
          (std.referralCode && std.referralCode.toLowerCase().includes(term));

        const matchesGrade =
          gradeFilter === 'all' ? true : std.gradeLevel.includes(gradeFilter);

        return matchesSearch && matchesGrade;
      })
      .sort((a, b) => {
        // If filtering by duplicates, group identical emails or phones directly adjacent to each other!
        if (duplicateFilter !== 'all') {
          const aVal =
            duplicateFilter === 'email_dup'
              ? (a.email || '').toLowerCase()
              : (a.phone || a.email || '').toLowerCase();
          const bVal =
            duplicateFilter === 'email_dup'
              ? (b.email || '').toLowerCase()
              : (b.phone || b.email || '').toLowerCase();
          if (aVal !== bVal) return aVal.localeCompare(bVal);
        }

        if (sortBy === 'points_desc') {
          const ptsA = a.referralPoints !== undefined ? a.referralPoints : 25;
          const ptsB = b.referralPoints !== undefined ? b.referralPoints : 25;
          return ptsB - ptsA;
        }
        if (sortBy === 'referrals_desc') {
          return (b.totalReferrals || 0) - (a.totalReferrals || 0);
        }
        if (sortBy === 'awards_desc') {
          return (b.awardsCount || 0) - (a.awardsCount || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [students, duplicateFilter, searchTerm, gradeFilter, sortBy, emailMap, phoneMap]);

  // Compute pagination slices
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-700" />
            <span>
              {language === 'ta'
                ? 'மாணவர் முகாமைத்துவம் & புள்ளிகள்'
                : language === 'si'
                ? 'ශිෂ්‍ය කළමනාකරණය සහ ලකුණු'
                : 'Student Management & Points Oversight'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'மாணவர் பதிவுகள், மொத்த வெகுமதி புள்ளிகள், பரிந்துரை புள்ளிவிவரங்கள் மற்றும் கல்வி சான்றளிப்பு.'
              : language === 'si'
              ? 'ශිෂ්‍ය ලියාපදිංචි කිරීම්, මුළු ත්‍යාග ලකුණු, යොමු දත්ත සහ සහතික කිරීම.'
              : 'Institutional verification, student total points balance, referral rewards stats, and academic dossiers.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            {language === 'ta' ? 'மொத்த மாணவர்கள்: ' : 'Total Candidates: '}
            <span className="font-bold">{students.length}</span>
          </span>

          {/* Duplicates Alert Quick Toggle */}
          <button
            type="button"
            onClick={() => setDuplicateFilter(duplicateFilter === 'all' ? 'any_dup' : 'all')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all shadow-2xs ${
              duplicateStudentsCount > 0
                ? duplicateFilter !== 'all'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title="Toggle duplicate registrations filter"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${duplicateFilter !== 'all' ? 'text-white' : duplicateStudentsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>
              {language === 'ta' ? 'நகல் பதிவுகள்: ' : 'Duplicates: '}
              <span className="font-extrabold">{duplicateStudentsCount}</span>
            </span>
          </button>

          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>
              {language === 'ta' ? 'சுழற்சியில் உள்ள புள்ளிகள்: ' : 'Points Circulating: '}
              <span className="font-extrabold text-amber-800">{totalCirculatingPoints.toLocaleString()} pts</span>
            </span>
          </span>

          <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalReferralsCount} Referrals</span>
          </span>
        </div>
      </div>

      {editSuccessToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{editSuccessToast}</span>
          </div>
          <button
            onClick={() => setEditSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-student"
            type="text"
            placeholder={
              language === 'ta'
                ? 'மாணவர் பெயர், ஐடி, பாடசாலை அல்லது பரிந்துரைக் குறியீடு...'
                : 'Search student name, ID, school, or referral code...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">
              {language === 'ta' ? 'வரிசைப்படுத்து:' : 'Sort By:'}
            </span>
            <select
              id="sort-student-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="default">{language === 'ta' ? 'இயல்புநிலை' : 'Default'}</option>
              <option value="points_desc">
                🪙 {language === 'ta' ? 'அதிக புள்ளிகள் (Top Earners)' : 'Highest Points (Top Earners)'}
              </option>
              <option value="referrals_desc">
                👥 {language === 'ta' ? 'அதிக பரிந்துரைகள்' : 'Most Referrals'}
              </option>
              <option value="awards_desc">
                🏆 {language === 'ta' ? 'அதிக விருதுகள்' : 'Most Honors / Awards'}
              </option>
              <option value="name">🔤 {language === 'ta' ? 'பெயர் (A-Z)' : 'Name (A-Z)'}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Grade:</span>
            <select
              id="filter-student-grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Grades</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dedicated Duplicate Filtering Segmented Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'ta' ? 'நகல் வடிகட்டி:' : 'Duplicate Filter:'}</span>
          </span>

          <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200 text-xs shadow-2xs flex-wrap">
            <button
              type="button"
              onClick={() => setDuplicateFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                duplicateFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'ta' ? 'அனைத்து மாணவர்கள்' : 'All Students'} ({students.length})
            </button>

            <button
              type="button"
              onClick={() => setDuplicateFilter('any_dup')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                duplicateFilter === 'any_dup'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : duplicateStudentsCount > 0
                  ? 'text-rose-700 hover:bg-rose-50'
                  : 'text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{language === 'ta' ? 'அனைத்து நகல்கள்' : 'All Duplicates'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                duplicateFilter === 'any_dup' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {duplicateStudentsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDuplicateFilter('email_dup')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                duplicateFilter === 'email_dup'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : emailDupCount > 0
                  ? 'text-amber-800 hover:bg-amber-50'
                  : 'text-slate-400'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>{language === 'ta' ? 'மின்னஞ்சல் நகல்' : 'Duplicate Emails'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                duplicateFilter === 'email_dup' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {emailDupCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDuplicateFilter('phone_dup')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                duplicateFilter === 'phone_dup'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : phoneDupCount > 0
                  ? 'text-purple-800 hover:bg-purple-50'
                  : 'text-slate-400'
              }`}
            >
              <Phone className="w-3 h-3" />
              <span>{language === 'ta' ? 'தொலைபேசி நகல்' : 'Duplicate Phones'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                duplicateFilter === 'phone_dup' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-900'
              }`}>
                {phoneDupCount}
              </span>
            </button>
          </div>
        </div>

        {duplicateFilter !== 'all' && (
          <button
            type="button"
            onClick={() => setDuplicateFilter('all')}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>✕ {language === 'ta' ? 'வடிகட்டியை மீட்டமை' : 'Clear Duplicate Filter'}</span>
          </button>
        )}
      </div>

      {/* Duplicate Filter Guidance Alert Banner */}
      {duplicateFilter !== 'all' && (
        <div className="p-3.5 bg-rose-50/90 border-2 border-rose-300 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-950 shadow-2xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-rose-900 block">
                {language === 'ta'
                  ? `நகல் பதிவுகள் வடிகட்டப்பட்டுள்ளன (${filteredStudents.length} மாணவர்கள் கண்டறியப்பட்டனர்)`
                  : `Duplicate Filter Active (${filteredStudents.length} Candidates Displayed)`}
              </span>
              <span className="text-[11px] text-rose-800 mt-0.5 block leading-relaxed">
                {language === 'ta'
                  ? 'ஒரே மின்னஞ்சல் அல்லது தொலைபேசி எண்ணைப் பகிர்ந்துகொள்ளும் மாணவர்கள் பக்கத்துப்பக்கமாக தொகுக்கப்பட்டுள்ளனர். தவறான விபரங்களை மாற்ற "திருத்து (Edit)" பொத்தானையோ, தேவையற்ற நகலை அகற்ற "நீக்குக (Trash)" பொத்தானையோ பயன்படுத்தவும்.'
                  : 'Candidates sharing identical emails or phone numbers are clustered together. Click "Edit" to modify mismatched details or "Delete" to resolve duplicate accounts.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Students Table with Total Points and Referral metrics */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Candidate & ID</th>
                <th className="px-5 py-3.5">Educational Institution</th>
                <th className="px-5 py-3.5">Grade Level</th>
                <th className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'ta' ? 'மொத்த புள்ளிகள் & பரிந்துரைகள்' : 'Total Points & Referrals'}</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-center">
                  {language === 'ta' ? 'பரீட்சைகள் (முடிந்தது/பதிவு)' : 'Exams (Done/Enrolled)'}
                </th>
                <th className="px-5 py-3.5 text-center">
                  {language === 'ta' ? 'கௌரவங்கள் / பதக்கங்கள்' : 'Honors / Medals'}
                </th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    {duplicateFilter !== 'all'
                      ? (language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட வகைக்குரிய நகல் பதிவுகள் எதுவும் இல்லை.' : 'No duplicate records found for the selected filter.')
                      : 'No student records match your query.'}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => {
                  const points = std.referralPoints !== undefined ? std.referralPoints : 25;
                  const dup = getDuplicateStatus(std);

                  return (
                    <tr
                      key={std.id}
                      className={`transition-colors ${
                        dup.isAnyDup
                          ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full border font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                              dup.isAnyDup
                                ? 'bg-rose-100 border-rose-300 text-rose-900 shadow-2xs'
                                : 'bg-slate-100 border-slate-300 text-slate-800'
                            }`}
                          >
                            {std.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900">{std.name}</p>
                              {dup.isAnyDup && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-700 bg-rose-100/90 px-1.5 py-0.2 rounded border border-rose-300">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  <span>Duplicate Entry</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-slate-500">
                              {std.studentId} {std.username ? `(@${std.username})` : ''}
                            </p>

                            {/* Contact Badges with Instant Duplicate Detection Highlights */}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {std.email && (
                                dup.isEmailDup ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100/90 px-1.5 py-0.5 rounded border border-rose-300 shadow-2xs"
                                    title={`Duplicate email detected across ${dup.emailClashCount} candidate registrations`}
                                  >
                                    <Mail className="w-3 h-3 text-rose-600 shrink-0" />
                                    <span className="truncate max-w-[150px]">{std.email}</span>
                                    <span className="bg-rose-200 text-rose-950 px-1 rounded text-[9px] font-black">
                                      {dup.emailClashCount}x Email
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[150px]">{std.email}</span>
                                  </span>
                                )
                              )}

                              {std.phone && (
                                dup.isPhoneDup ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-900 bg-purple-100/90 px-1.5 py-0.5 rounded border border-purple-300 font-mono shadow-2xs"
                                    title={`Duplicate phone number detected across ${dup.phoneClashCount} candidate registrations`}
                                  >
                                    <Phone className="w-3 h-3 text-purple-600 shrink-0" />
                                    <span>{std.phone}</span>
                                    <span className="bg-purple-200 text-purple-950 px-1 rounded text-[9px] font-black">
                                      {dup.phoneClashCount}x Phone
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{std.phone}</span>
                                  </span>
                                )
                              )}
                            </div>

                            {std.referralCode && (
                              <span className="text-[10px] font-mono text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/50 inline-block mt-1">
                                Ref: {std.referralCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{std.institution}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {std.gradeLevel}
                      </td>

                      {/* Student Total Points & Referral Stats Column */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1.5 font-black text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                            <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            <span>{points} pts</span>
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                            <span className="text-emerald-700 font-semibold">👥 {std.totalReferrals || 0} refs</span>
                            <span>•</span>
                            <span className="text-blue-700">🔗 {std.sharesCount || 0} shares</span>
                          </span>
                        </div>
                      </td>

                      {/* Live Auto-Counted Exam Submissions & Medals via Pre-Indexed Map */}
                      {(() => {
                        const stats =
                          studentResultsStatsMap.get(std.id) ||
                          studentResultsStatsMap.get(std.studentId) ||
                          (std.name ? studentResultsStatsMap.get(std.name.toLowerCase().trim()) : null) ||
                          { examCount: 0, medalsWon: 0, avgPct: 0 };
                        const examCount = stats.examCount;
                        const medalsWon = stats.medalsWon;
                        const avgPct = stats.avgPct;

                        return (
                          <>
                            <td className="px-5 py-3.5 text-center">
                              {examCount > 0 ? (
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>{examCount} {language === 'ta' ? 'முடிந்தது' : 'Done'}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {std.competitionsEnrolled || 0} {language === 'ta' ? 'பதிவு' : 'enrolled'}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  {std.competitionsEnrolled || 0} {language === 'ta' ? 'பதிவு' : 'enrolled'}
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-center">
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                  <Trophy className="w-3 h-3 text-amber-600 fill-amber-400" />
                                  <span>{medalsWon > 0 ? medalsWon : std.awardsCount} {language === 'ta' ? 'விருதுகள்' : 'Honors'}</span>
                                </span>
                                {examCount > 0 && (
                                  <span className="text-[10px] font-semibold text-blue-700">
                                    avg {avgPct}%
                                  </span>
                                )}
                              </div>
                            </td>
                          </>
                        );
                      })()}

                      <td className="px-5 py-3.5">
                        {dup.isAnyDup ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full shadow-2xs"
                            title="Action Needed: Duplicate email or phone"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Duplicate</span>
                          </span>
                        ) : (
                          <Badge variant="emerald" dot>
                            Verified
                          </Badge>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-student-${std.id}`}
                            onClick={() => setStudentToEdit(std)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border shadow-2xs ${
                              dup.isAnyDup
                                ? 'text-rose-900 bg-rose-100 hover:bg-rose-200 border-rose-300 ring-1 ring-rose-400'
                                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300'
                            }`}
                            title={
                              dup.isAnyDup
                                ? 'Resolve duplicate email/phone registration'
                                : language === 'ta'
                                ? 'மாணவர் விபரங்களைத் திருத்து'
                                : 'Edit Student Details'
                            }
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-700" />
                            <span>{dup.isAnyDup ? (language === 'ta' ? 'நகலைத் திருத்து' : 'Resolve') : (language === 'ta' ? 'திருத்து' : 'Edit')}</span>
                          </button>
                          <button
                            id={`btn-view-student-${std.id}`}
                            onClick={() => {
                              setSelectedStudent(std);
                              setPointAdjustToast(null);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 border border-blue-200"
                            title="View Dossier & Manage Points"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'விபரம்' : 'Manage'}</span>
                          </button>
                          <button
                            id={`btn-delete-student-${std.id}`}
                            onClick={() => setStudentToDelete(std)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title={language === 'ta' ? 'மாணவரை நீக்குக' : language === 'si' ? 'ශිෂ්‍යයා ඉවත් කරන්න' : 'Remove Student'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* High-Performance Pagination & Range Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {language === 'ta' ? 'காண்பிக்கப்படுகிறது: ' : 'Showing: '}
              <span className="font-bold text-slate-900">
                {filteredStudents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>
              {' - '}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * pageSize, filteredStudents.length)}
              </span>
              {' of '}
              <span className="font-bold text-slate-900">{filteredStudents.length}</span>
              {language === 'ta' ? ' மாணவர்கள்' : ' candidates'}
            </span>

            {filteredStudents.length > 10 && (
              <div className="flex items-center gap-1.5 sm:ml-3 sm:pl-3 sm:border-l sm:border-slate-200">
                <span className="text-[11px] text-slate-500">
                  {language === 'ta' ? 'பக்கத்திற்கு:' : 'Per page:'}
                </span>
                <select
                  aria-label="Candidates per page"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 font-semibold text-slate-700 cursor-pointer shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'ta' ? 'முந்தைய' : 'Prev'}</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevVal = arr[idx - 1];
                    const showEllipsis = prevVal && p - prevVal > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentPage === p
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 font-semibold text-slate-700 cursor-pointer shadow-2xs"
                title="Next Page"
              >
                <span className="hidden sm:inline">{language === 'ta' ? 'அடுத்த' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student Details & Points Management Dossier Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Candidate Dossier: ${selectedStudent.name}`}
          subtitle={`Registration Reference: ${selectedStudent.studentId} • Points & Academic Oversight`}
        >
          <div className="space-y-5">
            {/* Candidate Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-700 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                {selectedStudent.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {selectedStudent.name}
                    </h4>
                    <Badge variant="emerald" dot>
                      Active Candidate
                    </Badge>
                  </div>
                  <button
                    onClick={() => setStudentToEdit(selectedStudent)}
                    className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    title="Edit Student Registration & Info"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === 'ta' ? 'விபரங்களைத் திருத்து' : 'Edit Details'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  {selectedStudent.institution} ({selectedStudent.gradeLevel})
                </p>
                <p className="text-xs text-slate-500 italic">
                  "{selectedStudent.bio || 'Registered academic competitor.'}"
                </p>
              </div>
            </div>

            {/* DEDICATED STUDENT TOTAL POINTS & REFERRAL MANAGEMENT PANEL */}
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50 border-2 border-amber-300 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Coins className="w-6 h-6 fill-amber-200" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                      {language === 'ta' ? 'மாணவர் மொத்த வெகுமதி புள்ளிகள்' : 'Candidate Total Reward Points'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-900">
                        {selectedStudent.referralPoints !== undefined ? selectedStudent.referralPoints : 25}
                      </span>
                      <span className="text-xs font-bold text-amber-700">Points (புள்ளிகள்)</span>
                    </div>
                  </div>
                </div>

                {/* Referral Code & Copy */}
                <div className="bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'ta' ? 'பரிந்துரைக் குறியீடு:' : 'Referral Code:'}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {selectedStudent.referralCode || `HNC-${selectedStudent.studentId.replace(/[^A-Z0-9]/g, '')}`}
                    </span>
                    <button
                      onClick={() => {
                        const code = selectedStudent.referralCode || `HNC-${selectedStudent.studentId.replace(/[^A-Z0-9]/g, '')}`;
                        navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                      title="Copy Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Referral Activity Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {language === 'ta' ? 'வெற்றிகரமான பரிந்துரைகள்' : 'Successful Referrals'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    👥 {selectedStudent.totalReferrals || 0} friends
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {language === 'ta' ? 'பகிர்வு எண்ணிக்கைகள்' : 'Links Shared'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    🔗 {selectedStudent.sharesCount || 0} times
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {language === 'ta' ? 'பரிந்துரைத்தவர்' : 'Referred By'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 truncate block">
                    {selectedStudent.referredBy || (language === 'ta' ? 'நேரடிப் பதிவு' : 'Direct')}
                  </span>
                </div>
              </div>

              {/* Admin Points Adjustment Controls */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {language === 'ta' ? 'நிர்வாக புள்ளி சரிசெய்தல் / போனஸ் புள்ளிகளை வழங்கு' : 'Admin Point Management / Award Bonus Points'}
                    </span>
                  </span>
                  {pointAdjustToast && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {pointAdjustToast}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Quick Grant:</span>
                  <button
                    disabled={isAdjustingPoints}
                    onClick={() => handleAdjustPoints(selectedStudent.id, 25, 'Quick bonus +25')}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 25 pts
                  </button>
                  <button
                    disabled={isAdjustingPoints}
                    onClick={() => handleAdjustPoints(selectedStudent.id, 50, 'Ambassador reward +50')}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 50 pts
                  </button>
                  <button
                    disabled={isAdjustingPoints}
                    onClick={() => handleAdjustPoints(selectedStudent.id, 100, 'Milestone award +100')}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 100 pts
                  </button>
                  <button
                    disabled={isAdjustingPoints}
                    onClick={() => handleAdjustPoints(selectedStudent.id, -25, 'Point correction -25')}
                    className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                  >
                    -25 pts
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <input
                    type="number"
                    placeholder="Custom pts (+/-)"
                    value={customPointsInput}
                    onChange={(e) => setCustomPointsInput(e.target.value)}
                    className="w-32 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    disabled={isAdjustingPoints || !customPointsInput}
                    onClick={() => {
                      const num = parseInt(customPointsInput, 10);
                      if (!isNaN(num) && num !== 0) {
                        handleAdjustPoints(selectedStudent.id, num, pointsReason || 'Admin adjustment');
                      }
                    }}
                    className="px-3 py-1 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Academic Dossier Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 border border-slate-200 rounded-lg space-y-2 bg-white">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Contact & Accreditation
                </span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStudent.email}</span>
                </div>
                {selectedStudent.username && (
                  <div className="flex items-center gap-2 text-slate-700 font-mono">
                    <span className="text-slate-400">@</span>
                    <span>Username: {selectedStudent.username}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStudent.phone || 'Not provided'}</span>
                </div>
                {selectedStudent.district && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400 font-bold">📍</span>
                    <span>District: {selectedStudent.district}</span>
                  </div>
                )}
                {selectedStudent.address && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400 font-bold">🏠</span>
                    <span>Address: {selectedStudent.address}</span>
                  </div>
                )}
                {selectedStudent.dateOfBirth && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-slate-400 font-bold">🎂</span>
                    <span>DOB: {selectedStudent.dateOfBirth}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Guardian: {selectedStudent.guardianName || 'N/A'}</span>
                </div>
              </div>

              {(() => {
                const dossierResults = results.filter(
                  (r) =>
                    r.studentId === selectedStudent.id ||
                    r.studentId === selectedStudent.studentId ||
                    (r.studentName && r.studentName.toLowerCase() === selectedStudent.name?.toLowerCase())
                );
                const dossierExamsCompleted = dossierResults.length;
                const dossierMedals = dossierResults.filter((r) => r.award && r.award !== 'Participation').length;
                const dossierAvgScore =
                  dossierExamsCompleted > 0
                    ? Math.round(dossierResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / dossierExamsCompleted)
                    : 0;

                return (
                  <div className="p-3 border border-slate-200 rounded-lg space-y-2 bg-white flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        {language === 'ta' ? 'தானியங்கி பரீட்சை புள்ளிவிவரங்கள்' : 'Live Academic & Exam Metrics'}
                      </span>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">
                          {language === 'ta' ? 'செயலில் உள்ள போட்டிகள்:' : 'Enrolled Competitions:'}
                        </span>
                        <span className="font-bold text-slate-800">
                          {selectedStudent.competitionsEnrolled || 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">
                          {language === 'ta' ? 'முடித்த பரீட்சைகள் (Auto):' : 'Exams Completed (Auto):'}
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ {dossierExamsCompleted} {language === 'ta' ? 'முடிந்தது' : 'Done'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">
                          {language === 'ta' ? 'பதக்கங்கள் / கௌரவங்கள்:' : 'Olympiad Awards & Medals:'}
                        </span>
                        <span className="font-bold text-amber-700">
                          🏆 {dossierMedals > 0 ? dossierMedals : selectedStudent.awardsCount} Honors
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">
                          {language === 'ta' ? 'சராசரி மதிப்பெண்:' : 'Average Score:'}
                        </span>
                        <span className="font-bold text-blue-700">
                          {dossierAvgScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* AUTO-COUNTED EXAMS, COMPETITION & QUIZ SUBMISSIONS LIST */}
            {(() => {
              const dossierResults = results.filter(
                (r) =>
                  r.studentId === selectedStudent.id ||
                  r.studentId === selectedStudent.studentId ||
                  (r.studentName && r.studentName.toLowerCase() === selectedStudent.name?.toLowerCase())
              );
              const totalExamsCount = dossierResults.length;
              const totalMedalsCount = dossierResults.filter((r) => r.award && r.award !== 'Participation').length;
              const avgScore =
                totalExamsCount > 0
                  ? Math.round(dossierResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalExamsCount)
                  : 0;

              return (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>
                            {language === 'ta'
                              ? 'தானியங்கி பரீட்சை & வினாடி வினா விபரங்கள்'
                              : 'Auto-Counted Exam & Quiz Submissions'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                            {totalExamsCount} {language === 'ta' ? 'முடிந்தது' : 'Submitted'}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {language === 'ta'
                            ? 'மாணவர் சமர்ப்பித்தவுடன் மதிப்பெண், தரம், சான்றிதழ் மற்றும் தரவரிசை தானாகக் கணக்கிடப்படும்.'
                            : 'All exams, quiz competitions, marks, rankings, and certificates are automatically logged here.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Avg Score</span>
                        <span className="text-xs font-black text-slate-800">{avgScore}%</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-center">
                        <span className="text-[9px] text-amber-600 uppercase font-bold block">Medals</span>
                        <span className="text-xs font-black text-amber-900">{totalMedalsCount}</span>
                      </div>
                    </div>
                  </div>

                  {totalExamsCount === 0 ? (
                    <div className="p-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1">
                      <p className="text-xs font-medium text-slate-600">
                        {language === 'ta'
                          ? 'இந்த மாணவர் இன்னும் எந்த பரீட்சையையும் அல்லது வினாடி வினாவையும் முடிக்கவில்லை.'
                          : 'This candidate has not completed any exams or competition quizzes yet.'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === 'ta'
                          ? 'மாணவர் தனது மாணவர் பக்கத்தில் பரீட்சையை முடித்தவுடன், அனைத்து மதிப்பெண் மற்றும் முடிவுகள் தானாக இங்கே உடனுக்குடன் சேமிக்கப்பட்டு கணக்கிடப்படும்.'
                          : 'As soon as the student takes an exam or quiz, results are calculated and recorded automatically.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {dossierResults.map((res) => (
                        <div
                          key={res.id}
                          className="p-2.5 bg-slate-50/80 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs transition"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                                {res.competitionTitle || 'Academic Exam'}
                              </span>
                              {res.award && res.award !== 'Participation' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  <Medal className="w-2.5 h-2.5 text-amber-600" />
                                  {res.award}
                                </span>
                              )}
                              {res.rank && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                                  Rank #{res.rank}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span>
                                Score: <b className="text-slate-800">{res.score} / {res.maxScore || res.totalMarks}</b> ({res.percentage}%)
                              </span>
                              {res.submittedAt && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(res.submittedAt).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                res.percentage >= 75
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : res.percentage >= 50
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {res.percentage >= 75 ? 'Distinction' : res.percentage >= 50 ? 'Credit' : 'Completed'}
                            </span>
                            {res.certificateId && (
                              <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                {res.certificateId}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SUPER ADMIN DIRECT PASSWORD MANAGEMENT & RESET BOX */}
            <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    {language === 'ta' ? 'கடவுச்சொல் மீட்டமைப்பு (Password Reset)' : 'Student Password Reset'}
                  </span>
                </div>
                {passwordChangeToast && (
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50">
                    {passwordChangeToast}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {language === 'ta' ? 'கடவுச்சொல் நிலை:' : 'Password Security Status:'}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'ta' ? 'பாதுகாக்கப்பட்டது & மறைக்கப்பட்டது' : 'Encrypted & Protected'}</span>
                  </span>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={language === 'ta' ? 'புதிய கடவுச்சொல் தட்டச்சு செய்க...' : 'Enter new password for student...'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
                    let gen = 'HNC@';
                    for (let i = 0; i < 5; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                    setNewPasswordInput(gen);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1"
                  title="Generate Random Password"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Gen</span>
                </button>
                <button
                  type="button"
                  disabled={isChangingPassword || !newPasswordInput.trim()}
                  onClick={handleUpdateStudentPassword}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isChangingPassword ? 'Saving...' : (language === 'ta' ? 'மாற்று' : 'Save Password')}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                id="btn-dossier-delete"
                onClick={() => setStudentToDelete(selectedStudent)}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'மாணவரை நீக்குக' : language === 'si' ? 'ශිෂ්‍යයා ඉවත් කරන්න' : 'Remove Student Account'}</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStudentToEdit(selectedStudent)}
                  className="px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-700" />
                  <span>{language === 'ta' ? 'விபரங்களைத் திருத்து (Edit)' : 'Edit Details'}</span>
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {studentToDelete && (
        <Modal
          isOpen={!!studentToDelete}
          onClose={() => !isDeleting && setStudentToDelete(null)}
          title={
            language === 'ta'
              ? 'மாணவர் கணக்கை நீக்குவதை உறுதிப்படுத்தவும்'
              : language === 'si'
              ? 'ශිෂ්‍ය ගිණුම ඉවත් කිරීම තහවුරු කරන්න'
              : 'Confirm Student Account Removal'
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-900">
                  {language === 'ta'
                    ? `${studentToDelete.name} (${studentToDelete.studentId}) மாணவர் கணக்கை நிச்சயமாக நீக்க விரும்புகிறீர்களா?`
                    : language === 'si'
                    ? `${studentToDelete.name} (${studentToDelete.studentId}) ශිෂ්‍ය ගිණුම ඉවත් කිරීමට ඔබට විශ්වාසද?`
                    : `Are you sure you want to permanently remove candidate ${studentToDelete.name} (${studentToDelete.studentId})?`}
                </p>
                <p className="text-[11px] text-red-700">
                  {language === 'ta'
                    ? 'இந்த நடவடிக்கை தரவுத்தளத்திலிருந்து மாணவர் பதிவு மற்றும் தொடர்புடைய விபரங்களை முழுமையாக நீக்கும்.'
                    : language === 'si'
                    ? 'මෙම ක්‍රියාව දත්ත සමුදායෙන් ශිෂ්‍ය වාර්තාව සම්පූර්ණයෙන්ම ඉවත් කරනු ඇත.'
                    : 'This action will completely remove the student record and login credentials from the database.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {language === 'ta' ? 'ரத்து செய்க' : language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>
              <button
                id="btn-confirm-delete-student"
                disabled={isDeleting}
                onClick={handleDeleteStudent}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeleting
                    ? (language === 'ta' ? 'நீக்கப்படுகிறது...' : language === 'si' ? 'ඉවත් කරමින්...' : 'Deleting...')
                    : (language === 'ta' ? 'ஆம், நீக்குக' : language === 'si' ? 'ඔව්, ඉවත් කරන්න' : 'Yes, Remove Candidate')}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Student Modal */}
      {studentToEdit && (
        <EditStudentModal
          isOpen={!!studentToEdit}
          onClose={() => setStudentToEdit(null)}
          student={studentToEdit}
          duplicateWarning={{
            isEmailDup: getDuplicateStatus(studentToEdit).isEmailDup,
            isPhoneDup: getDuplicateStatus(studentToEdit).isPhoneDup,
            emailCount: getDuplicateStatus(studentToEdit).emailClashCount,
            phoneCount: getDuplicateStatus(studentToEdit).phoneClashCount,
          }}
          onSave={handleSaveStudentEdit}
          language={language}
        />
      )}
    </div>
  );
};

