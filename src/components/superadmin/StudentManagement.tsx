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
  Users,
  CheckSquare,
  Square,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { EditStudentModal } from './EditStudentModal';

export const StudentManagement: React.FC = () => {
  const {
    students,
    competitions,
    results,
    deleteStudentAccount,
    deleteDuplicateStudentAccounts,
    updateStudentPassword,
    updateStudentByAdmin,
    adjustStudentPoints,
    language,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'any_dup' | 'email_dup' | 'phone_dup' | 'identity_dup'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'points_desc' | 'referrals_desc' | 'awards_desc' | 'name'>('default');
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<StudentUser | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editSuccessToast, setEditSuccessToast] = useState<string | null>(null);
  const [deleteErrorToast, setDeleteErrorToast] = useState<string | null>(null);

  // Bulk table selection & Duplicate Cleanup Manager states
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDupModalOpen, setIsDupModalOpen] = useState(false);
  const [dupRemovalSelectedIds, setDupRemovalSelectedIds] = useState<Set<string>>(new Set());
  const [dupKeepOverrides, setDupKeepOverrides] = useState<Record<string, string>>({});
  const [dupModalConfirming, setDupModalConfirming] = useState(false);

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
    setDeleteErrorToast(null);
    try {
      await deleteStudentAccount(studentToDelete.id);
      if (selectedStudent?.id === studentToDelete.id) {
        setSelectedStudent(null);
      }
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        next.delete(studentToDelete.id);
        return next;
      });
      setDupRemovalSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(studentToDelete.id);
        return next;
      });
      setEditSuccessToast(
        language === 'ta'
          ? `"${studentToDelete.name}" பதிவு வெற்றிகரமாக நீக்கப்பட்டது.`
          : `Removed registration for "${studentToDelete.name}".`
      );
      setTimeout(() => setEditSuccessToast(null), 4000);
      setStudentToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete student account:', err);
      setDeleteErrorToast(err?.message || 'Failed to delete student account.');
    } finally {
      setIsDeleting(false);
    }
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
        const existing = map.get(key) || ({ examCount: 0, medalsWon: 0, totalPct: 0 } as any);
        existing.examCount += 1;
        if (isMedal) existing.medalsWon += 1;
        existing.totalPct = (existing.totalPct || 0) + pct;
        existing.avgPct = Math.round(existing.totalPct / existing.examCount);
        map.set(key, existing);
      });
    });

    return map;
  }, [results]);

  // Pre-calculate duplicate maps & clustered duplicate groups
  const {
    emailMap,
    phoneMap,
    identityMap,
    studentIdDupMap,
    usernameDupMap,
    duplicateStudentsCount,
    emailDupCount,
    phoneDupCount,
    identityDupCount,
    duplicateGroups,
    totalExtraDuplicatesCount,
  } = useMemo(() => {
    const eMap = new Map<string, string[]>();
    const pMap = new Map<string, string[]>();
    const idnMap = new Map<string, string[]>();
    const sidMap = new Map<string, string[]>();
    const usrMap = new Map<string, string[]>();

    const normalizeName = (name?: string) =>
      (name || '').trim().toLowerCase().replace(/\s+/g, ' ');

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

      const normName = normalizeName(s.name);
      const normGrade = (s.gradeLevel || '').trim().toLowerCase();
      if (normName && normGrade) {
        const identityKey = `${normName}|${normGrade}`;
        const list = idnMap.get(identityKey) || [];
        list.push(s.id);
        idnMap.set(identityKey, list);
      }

      if (s.studentId && s.studentId.trim()) {
        const normSid = s.studentId.trim().toUpperCase();
        const list = sidMap.get(normSid) || [];
        list.push(s.id);
        sidMap.set(normSid, list);
      }

      if (s.username && s.username.trim()) {
        const normUsr = s.username.trim().toLowerCase();
        const list = usrMap.get(normUsr) || [];
        list.push(s.id);
        usrMap.set(normUsr, list);
      }
    });

    let dupTotal = 0;
    let eDupTotal = 0;
    let pDupTotal = 0;
    let idnDupTotal = 0;

    students.forEach((s) => {
      let isEmailDup = false;
      let isPhoneDup = false;
      let isIdentityDup = false;

      if (s.email && s.email.trim()) {
        const list = eMap.get(s.email.trim().toLowerCase());
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

      const normName = normalizeName(s.name);
      const normGrade = (s.gradeLevel || '').trim().toLowerCase();
      if (normName && normGrade) {
        const list = idnMap.get(`${normName}|${normGrade}`);
        if (list && list.length > 1) {
          isIdentityDup = true;
          idnDupTotal++;
        }
      }

      const sidDup = s.studentId ? (sidMap.get(s.studentId.trim().toUpperCase())?.length || 0) > 1 : false;
      const usrDup = s.username ? (usrMap.get(s.username.trim().toLowerCase())?.length || 0) > 1 : false;

      if (isEmailDup || isPhoneDup || isIdentityDup || sidDup || usrDup) {
        dupTotal++;
      }
    });

    // Build connected duplicate clusters via Union-Find
    const parent = new Map<string, string>();
    const find = (x: string): string => {
      let curr = x;
      while (parent.get(curr) !== curr) {
        curr = parent.get(curr) || curr;
      }
      return curr;
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(rb, ra);
    };

    students.forEach((s) => parent.set(s.id, s.id));

    const connectBuckets = (map: Map<string, string[]>) => {
      map.forEach((ids) => {
        if (ids.length > 1) {
          for (let i = 1; i < ids.length; i++) {
            union(ids[0], ids[i]);
          }
        }
      });
    };

    connectBuckets(eMap);
    connectBuckets(pMap);
    connectBuckets(idnMap);
    connectBuckets(sidMap);
    connectBuckets(usrMap);

    const clustersMap = new Map<string, StudentUser[]>();
    students.forEach((s) => {
      const root = find(s.id);
      const arr = clustersMap.get(root) || [];
      arr.push(s);
      clustersMap.set(root, arr);
    });

    const studentScore = (std: StudentUser) => {
      const resStats =
        studentResultsStatsMap.get(std.id) ||
        studentResultsStatsMap.get(std.studentId) ||
        { examCount: 0, medalsWon: 0, avgPct: 0 };
      const pts = std.referralPoints !== undefined ? std.referralPoints : 0;
      const activeScore = std.status === 'active' ? 500 : 0;
      const createdTs = std.createdAt ? new Date(std.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
      return {
        primaryScore: resStats.examCount * 10000 + activeScore + pts + (std.totalReferrals || 0) * 50,
        createdTs: isNaN(createdTs) ? Number.MAX_SAFE_INTEGER : createdTs,
      };
    };

    const groups: Array<{
      groupId: string;
      members: StudentUser[];
      recommendedKeepId: string;
      reasons: string[];
      isLikelySameStudent: boolean;
      matchSummary: string;
    }> = [];

    let extraCount = 0;

    clustersMap.forEach((members, root) => {
      if (members.length <= 1) return;

      // Sort members so best/primary candidate appears first
      const sorted = [...members].sort((a, b) => {
        const sa = studentScore(a);
        const sb = studentScore(b);
        if (sb.primaryScore !== sa.primaryScore) return sb.primaryScore - sa.primaryScore;
        return sa.createdTs - sb.createdTs;
      });

      const emails = new Set(members.map((m) => (m.email || '').trim().toLowerCase()).filter(Boolean));
      const phones = new Set(
        members
          .map((m) => {
            const d = (m.phone || '').replace(/\D/g, '');
            return d.length >= 7 ? (d.length >= 9 ? d.slice(-9) : d) : '';
          })
          .filter(Boolean)
      );
      const names = new Set(members.map((m) => normalizeName(m.name)).filter(Boolean));
      const identKeys = new Set(
        members.map((m) => `${normalizeName(m.name)}|${(m.gradeLevel || '').trim().toLowerCase()}`).filter((k) => !k.startsWith('|'))
      );
      const sids = new Set(members.map((m) => (m.studentId || '').trim().toUpperCase()).filter(Boolean));
      const usrs = new Set(members.map((m) => (m.username || '').trim().toLowerCase()).filter(Boolean));

      const reasons: string[] = [];
      if (identKeys.size < members.length) reasons.push('Same Name & Grade');
      else if (names.size < members.length) reasons.push('Same Name');
      if (emails.size < members.length) reasons.push('Shared Email');
      if (phones.size < members.length) reasons.push('Shared Phone');
      if (sids.size < members.length) reasons.push('Duplicate Student ID');
      if (usrs.size < members.length) reasons.push('Duplicate Username');

      const isLikelySameStudent =
        identKeys.size < members.length ||
        names.size < members.length ||
        sids.size < members.length ||
        usrs.size < members.length;

      const sampleEmail = members.find((m) => m.email)?.email || '';
      const samplePhone = members.find((m) => m.phone)?.phone || '';
      const matchSummary =
        reasons.includes('Same Name & Grade')
          ? `${sorted[0].name} (${sorted[0].gradeLevel})`
          : reasons.includes('Shared Email')
          ? sampleEmail
          : reasons.includes('Shared Phone')
          ? samplePhone
          : sorted[0].name;

      extraCount += sorted.length - 1;
      groups.push({
        groupId: root,
        members: sorted,
        recommendedKeepId: sorted[0].id,
        reasons: reasons.length > 0 ? reasons : ['Matching Details'],
        isLikelySameStudent,
        matchSummary,
      });
    });

    // Sort likely same-student duplicates to the top
    groups.sort((a, b) => Number(b.isLikelySameStudent) - Number(a.isLikelySameStudent));

    return {
      emailMap: eMap,
      phoneMap: pMap,
      identityMap: idnMap,
      studentIdDupMap: sidMap,
      usernameDupMap: usrMap,
      duplicateStudentsCount: dupTotal,
      emailDupCount: eDupTotal,
      phoneDupCount: pDupTotal,
      identityDupCount: idnDupTotal,
      duplicateGroups: groups,
      totalExtraDuplicatesCount: extraCount,
    };
  }, [students, studentResultsStatsMap]);

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

    let isIdentityDup = false;
    let identityClashCount = 0;
    const normName = (std.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const normGrade = (std.gradeLevel || '').trim().toLowerCase();
    if (normName && normGrade) {
      const list = identityMap.get(`${normName}|${normGrade}`);
      if (list && list.length > 1) {
        isIdentityDup = true;
        identityClashCount = list.length;
      }
    }

    const isStudentIdDup = std.studentId ? (studentIdDupMap.get(std.studentId.trim().toUpperCase())?.length || 0) > 1 : false;
    const isUsernameDup = std.username ? (usernameDupMap.get(std.username.trim().toLowerCase())?.length || 0) > 1 : false;

    return {
      isEmailDup,
      emailClashCount,
      isPhoneDup,
      phoneClashCount,
      isIdentityDup,
      identityClashCount,
      isStudentIdDup,
      isUsernameDup,
      isAnyDup: isEmailDup || isPhoneDup || isIdentityDup || isStudentIdDup || isUsernameDup,
    };
  };

  // Open Duplicate Removal Manager Modal and pre-select exact same-student duplicates
  const openDuplicateRemovalModal = (preselectMode: 'exact_only' | 'all_extras' = 'exact_only') => {
    const initialSelected = new Set<string>();
    const initialKeeps: Record<string, string> = {};

    duplicateGroups.forEach((grp) => {
      const keepId = dupKeepOverrides[grp.groupId] && grp.members.some((m) => m.id === dupKeepOverrides[grp.groupId])
        ? dupKeepOverrides[grp.groupId]
        : grp.recommendedKeepId;
      initialKeeps[grp.groupId] = keepId;

      if (preselectMode === 'all_extras' || grp.isLikelySameStudent) {
        grp.members.forEach((m) => {
          if (m.id !== keepId) {
            initialSelected.add(m.id);
          }
        });
      }
    });

    setDupKeepOverrides(initialKeeps);
    setDupRemovalSelectedIds(initialSelected);
    setDupModalConfirming(false);
    setIsDupModalOpen(true);
  };

  const handleAutoSelectDuplicatesInModal = (mode: 'exact_only' | 'all_extras') => {
    const next = new Set<string>();
    duplicateGroups.forEach((grp) => {
      const keepId = dupKeepOverrides[grp.groupId] || grp.recommendedKeepId;
      if (mode === 'all_extras' || grp.isLikelySameStudent) {
        grp.members.forEach((m) => {
          if (m.id !== keepId) {
            next.add(m.id);
          }
        });
      }
    });
    setDupRemovalSelectedIds(next);
    setDupModalConfirming(false);
  };

  const handleSetPrimaryKeepForGroup = (groupId: string, keepStudentId: string) => {
    setDupKeepOverrides((prev) => ({ ...prev, [groupId]: keepStudentId }));
    setDupRemovalSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(keepStudentId);
      const grp = duplicateGroups.find((g) => g.groupId === groupId);
      if (grp && grp.isLikelySameStudent) {
        grp.members.forEach((m) => {
          if (m.id !== keepStudentId) next.add(m.id);
        });
      }
      return next;
    });
    setDupModalConfirming(false);
  };

  const handleConfirmBulkRemove = async (uidsToRemove: string[], closeDupModalAfter = false) => {
    if (uidsToRemove.length === 0) return;
    setIsBulkDeleting(true);
    setDeleteErrorToast(null);
    try {
      const res = await deleteDuplicateStudentAccounts(uidsToRemove);
      if (res.deletedCount > 0) {
        setEditSuccessToast(
          language === 'ta'
            ? `${res.deletedCount} நகல் மாணவர் பதிவுகள் வெற்றிகரமாக நீக்கப்பட்டன!`
            : `Successfully removed ${res.deletedCount} duplicate student registration(s)!`
        );
        setTimeout(() => setEditSuccessToast(null), 5000);
      }
      if (res.failedCount > 0) {
        setDeleteErrorToast(
          res.error ||
            `Could not remove ${res.failedCount} account(s). Please verify Super Admin permissions.`
        );
      }
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        uidsToRemove.forEach((id) => next.delete(id));
        return next;
      });
      setDupRemovalSelectedIds((prev) => {
        const next = new Set(prev);
        uidsToRemove.forEach((id) => next.delete(id));
        return next;
      });
      setShowBulkDeleteConfirm(false);
      setDupModalConfirming(false);
      if (closeDupModalAfter && res.failedCount === 0) {
        setIsDupModalOpen(false);
      }
    } catch (err: any) {
      setDeleteErrorToast(err?.message || 'Bulk duplicate deletion failed.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter((std) => {
        const dup = getDuplicateStatus(std);

        // Apply duplicate filtering
        if (duplicateFilter === 'any_dup' && !dup.isAnyDup) return false;
        if (duplicateFilter === 'email_dup' && !dup.isEmailDup) return false;
        if (duplicateFilter === 'phone_dup' && !dup.isPhoneDup) return false;
        if (duplicateFilter === 'identity_dup' && !dup.isIdentityDup) return false;

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
        // If filtering by duplicates, group identical emails, phones, or names directly adjacent to each other!
        if (duplicateFilter !== 'all') {
          const aVal =
            duplicateFilter === 'email_dup'
              ? (a.email || '').toLowerCase()
              : duplicateFilter === 'phone_dup'
              ? (a.phone || a.email || '').toLowerCase()
              : duplicateFilter === 'identity_dup'
              ? (a.name || '').toLowerCase()
              : (a.email || a.phone || a.name || '').toLowerCase();
          const bVal =
            duplicateFilter === 'email_dup'
              ? (b.email || '').toLowerCase()
              : duplicateFilter === 'phone_dup'
              ? (b.phone || b.email || '').toLowerCase()
              : duplicateFilter === 'identity_dup'
              ? (b.name || '').toLowerCase()
              : (b.email || b.phone || b.name || '').toLowerCase();
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
  }, [students, duplicateFilter, searchTerm, gradeFilter, sortBy, emailMap, phoneMap, identityMap, studentIdDupMap, usernameDupMap]);

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

          {/* Dedicated Duplicate Registration Removal Manager Trigger */}
          <button
            id="btn-open-duplicate-cleanup"
            type="button"
            onClick={() => openDuplicateRemovalModal('exact_only')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              totalExtraDuplicatesCount > 0
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-rose-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={
              language === 'ta'
                ? 'நகல் மாணவர் பதிவுகளை ஆய்வு செய்து நீக்குக'
                : 'Review and remove duplicate student registrations'
            }
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {language === 'ta' ? 'நகல் பதிவுகளை நீக்கு' : 'Remove Duplicates'}
              {totalExtraDuplicatesCount > 0 ? ` (${totalExtraDuplicatesCount})` : ''}
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

      {deleteErrorToast && (
        <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{deleteErrorToast}</span>
          </div>
          <button
            onClick={() => setDeleteErrorToast(null)}
            className="text-red-700 hover:text-red-900 text-xs font-semibold"
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

            <button
              type="button"
              onClick={() => setDuplicateFilter('identity_dup')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                duplicateFilter === 'identity_dup'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : identityDupCount > 0
                  ? 'text-indigo-800 hover:bg-indigo-50'
                  : 'text-slate-400'
              }`}
            >
              <User className="w-3 h-3" />
              <span>{language === 'ta' ? 'பெயர் & வகுப்பு நகல்' : 'Same Name & Grade'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                duplicateFilter === 'identity_dup' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-900'
              }`}>
                {identityDupCount}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {duplicateFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setDuplicateFilter('all')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1"
            >
              <span>✕ {language === 'ta' ? 'வடிகட்டியை மீட்டமை' : 'Clear Filter'}</span>
            </button>
          )}
          {totalExtraDuplicatesCount > 0 && (
            <button
              type="button"
              onClick={() => openDuplicateRemovalModal('exact_only')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'நகல்களை அகற்று' : 'Clean Up Duplicates'} ({totalExtraDuplicatesCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Duplicate Filter Guidance Alert Banner */}
      {duplicateFilter !== 'all' && (
        <div className="p-3.5 bg-rose-50/90 border-2 border-rose-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950 shadow-2xs animate-in fade-in">
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
                  ? 'ஒரே மின்னஞ்சல், தொலைபேசி அல்லது பெயர்-வகுப்பைப் பகிர்ந்துகொள்ளும் மாணவர்கள் பக்கத்துப்பக்கமாக தொகுக்கப்பட்டுள்ளனர். தேர்ந்தெடுத்து மொத்தமாகவோ அல்லது ஒவ்வொன்றாகவோ நகல்களை நீக்கலாம்.'
                  : 'Candidates sharing identical emails, phone numbers, or name & grade are clustered together. Select checkboxes to bulk remove or open the Smart Duplicate Cleanup Tool.'}
              </span>
            </div>
          </div>

          {duplicateGroups.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openDuplicateRemovalModal('exact_only')}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'ஸ்மார்ட் நகல் நீக்கம்' : 'Smart Duplicate Remover'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Selection Action Bar */}
      {selectedRowIds.size > 0 && (
        <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-700 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black flex items-center justify-center">
              {selectedRowIds.size}
            </span>
            <span className="font-bold">
              {language === 'ta'
                ? `${selectedRowIds.size} மாணவர் பதிவுகள் தேர்ந்தெடுக்கப்பட்டுள்ளன`
                : `${selectedRowIds.size} registration(s) selected`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              {language === 'ta' ? 'தேர்வை நீக்கு' : 'Clear Selection'}
            </button>
            <button
              id="btn-bulk-remove-selected"
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {language === 'ta'
                  ? `தேர்ந்தெடுத்தவற்றை நீக்கு (${selectedRowIds.size})`
                  : `Remove Selected (${selectedRowIds.size})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Students Table with Total Points and Referral metrics */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="pl-4 pr-2 py-3.5 w-8">
                  <button
                    type="button"
                    onClick={() => {
                      const pageIds = paginatedStudents.map((s) => s.id);
                      const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedRowIds.has(id));
                      setSelectedRowIds((prev) => {
                        const next = new Set(prev);
                        if (allSelected) {
                          pageIds.forEach((id) => next.delete(id));
                        } else {
                          pageIds.forEach((id) => next.add(id));
                        }
                        return next;
                      });
                    }}
                    className="text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center cursor-pointer"
                    title="Select / Deselect all on current page"
                  >
                    {paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedRowIds.has(s.id)) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">Candidate & ID</th>
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
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    {duplicateFilter !== 'all'
                      ? (language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட வகைக்குரிய நகல் பதிவுகள் எதுவும் இல்லை.' : 'No duplicate records found for the selected filter.')
                      : 'No student records match your query.'}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => {
                  const points = std.referralPoints !== undefined ? std.referralPoints : 25;
                  const dup = getDuplicateStatus(std);
                  const isRowSelected = selectedRowIds.has(std.id);

                  return (
                    <tr
                      key={std.id}
                      className={`transition-colors ${
                        isRowSelected
                          ? 'bg-blue-50/70'
                          : dup.isAnyDup
                          ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="pl-4 pr-2 py-3.5 align-top">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRowIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(std.id)) next.delete(std.id);
                              else next.add(std.id);
                              return next;
                            });
                          }}
                          className="mt-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          aria-label={`Select ${std.name}`}
                        >
                          {isRowSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
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
                                  <span>{dup.isIdentityDup ? 'Same Name & Grade' : 'Duplicate Entry'}</span>
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

      {/* Bulk Remove Selected Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <Modal
          isOpen={showBulkDeleteConfirm}
          onClose={() => !isBulkDeleting && setShowBulkDeleteConfirm(false)}
          title={
            language === 'ta'
              ? `தேர்ந்தெடுக்கப்பட்ட ${selectedRowIds.size} பதிவுகளை நீக்குக`
              : `Remove ${selectedRowIds.size} Selected Registration(s)`
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-rose-950">
                  {language === 'ta'
                    ? `தேர்ந்தெடுக்கப்பட்ட ${selectedRowIds.size} மாணவர் பதிவுகளையும் நிரந்தரமாக நீக்க விரும்புகிறீர்களா?`
                    : `Are you sure you want to permanently remove ${selectedRowIds.size} selected student registration(s)?`}
                </p>
                <p className="text-[11px] text-rose-800">
                  {language === 'ta'
                    ? 'நீக்கப்படும் கணக்குகளின் தரவுகள், உள்நுழைவு மற்றும் பரீட்சை முயற்சிகள் தரவுத்தளத்திலிருந்து அகற்றப்படும்.'
                    : 'Selected accounts, login credentials, and related incomplete attempts will be permanently deleted from Firestore.'}
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50">
              {students
                .filter((s) => selectedRowIds.has(s.id))
                .map((s) => (
                  <div key={s.id} className="px-3 py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{s.name}</span>
                      <span className="ml-2 font-mono text-[10px] text-slate-500">{s.studentId}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{s.email || s.phone}</span>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                {language === 'ta' ? 'ரத்து செய்க' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => handleConfirmBulkRemove(Array.from(selectedRowIds), false)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                {isBulkDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>
                  {isBulkDeleting
                    ? language === 'ta'
                      ? 'நீக்கப்படுகிறது...'
                      : 'Removing...'
                    : language === 'ta'
                    ? `ஆம், ${selectedRowIds.size} பதிவுகளை நீக்குக`
                    : `Yes, Remove ${selectedRowIds.size} Account(s)`}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Smart Duplicate Registration Manager & Removal Modal */}
      {isDupModalOpen && (
        <Modal
          isOpen={isDupModalOpen}
          onClose={() => !isBulkDeleting && setIsDupModalOpen(false)}
          title={
            language === 'ta'
              ? 'நகல் பதிவுகள் மேலாளர் & நீக்கம் (Duplicate Registrations Remover)'
              : 'Duplicate Registrations Manager & Removal Tool'
          }
          subtitle={
            language === 'ta'
              ? 'ஒரே மின்னஞ்சல், தொலைபேசி அல்லது பெயர்-வகுப்பு கொண்ட கணக்குகளை ஒப்பிட்டு தேவையற்ற நகல்களை நீக்குக'
              : 'Compare clustered accounts by email, phone, or name & grade and remove duplicate registrations safely'
          }
          maxWidthClass="max-w-5xl"
        >
          <div className="space-y-4 text-xs">
            {/* Summary KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    {language === 'ta' ? 'நகல் தொகுப்புகள்' : 'Duplicate Clusters'}
                  </span>
                  <span className="text-base font-black text-slate-900">{duplicateGroups.length} Groups</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">
                    {language === 'ta' ? 'கூடுதல் நகல் கணக்குகள்' : 'Extra Registrations'}
                  </span>
                  <span className="text-base font-black text-amber-950">{totalExtraDuplicatesCount} Extra</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-rose-800 block">
                    {language === 'ta' ? 'நீக்கத் தேர்ந்தெடுக்கப்பட்டவை' : 'Marked for Removal'}
                  </span>
                  <span className="text-base font-black text-rose-950">{dupRemovalSelectedIds.size} Selected</span>
                </div>
              </div>
            </div>

            {duplicateGroups.length === 0 ? (
              <div className="p-10 text-center bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">
                  {language === 'ta'
                    ? 'நகல் மாணவர் பதிவுகள் எதுவும் இல்லை!'
                    : 'No Duplicate Registrations Found!'}
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  {language === 'ta'
                    ? 'அனைத்து மாணவர் பதிவுகளும் தனித்துவமான மின்னஞ்சல், தொலைபேசி மற்றும் பெயர்களுடன் சுத்தமாக உள்ளன.'
                    : 'All registered candidate accounts appear unique across email, phone, name & grade, and Student ID.'}
                </p>
              </div>
            ) : (
              <>
                {/* Smart Selection Controls */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAutoSelectDuplicatesInModal('exact_only')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {language === 'ta'
                          ? 'ஒரே மாணவர் நகல்களை மட்டும் தேர்ந்தெடு'
                          : 'Auto-Select Exact Duplicates (Same Student)'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoSelectDuplicatesInModal('all_extras')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>
                        {language === 'ta'
                          ? 'அனைத்து தொகுப்புகளிலும் 1 பிரதான கணக்கை மட்டும் வைத்து மற்றவற்றைத் தேர்ந்தெடு'
                          : 'Auto-Select All Extras (Keep 1 Best per Group)'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDupRemovalSelectedIds(new Set());
                        setDupModalConfirming(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] cursor-pointer"
                    >
                      {language === 'ta' ? 'தேர்வை அழி' : 'Clear Selection'}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {language === 'ta'
                      ? 'குறிப்பு: சகோதரர்கள் ஒரே பெற்றோர் மின்னஞ்சலைப் பகிரலாம்'
                      : 'Tip: Siblings may share parent email/phone; verify names before deleting'}
                  </span>
                </div>

                {/* Clustered Duplicate Groups */}
                <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
                  {duplicateGroups.map((grp, gIdx) => {
                    const keepId =
                      dupKeepOverrides[grp.groupId] && grp.members.some((m) => m.id === dupKeepOverrides[grp.groupId])
                        ? dupKeepOverrides[grp.groupId]
                        : grp.recommendedKeepId;

                    return (
                      <div
                        key={grp.groupId}
                        className={`rounded-2xl border-2 overflow-hidden ${
                          grp.isLikelySameStudent ? 'border-rose-300 bg-rose-50/30' : 'border-amber-200 bg-amber-50/20'
                        }`}
                      >
                        <div
                          className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${
                            grp.isLikelySameStudent
                              ? 'bg-rose-100/70 border-rose-200'
                              : 'bg-amber-100/60 border-amber-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px]">
                              #{gIdx + 1}
                            </span>
                            <span className="font-extrabold text-slate-900 text-xs">{grp.matchSummary}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                grp.isLikelySameStudent
                                  ? 'bg-rose-600 text-white border-rose-700'
                                  : 'bg-amber-200 text-amber-950 border-amber-300'
                              }`}
                            >
                              {grp.isLikelySameStudent
                                ? language === 'ta'
                                  ? 'ஒரே மாணவர் நகல்'
                                  : 'Likely Same Student'
                                : language === 'ta'
                                ? 'பகிரப்பட்ட தொடர்பு (சகோதரர்களாக இருக்கலாம்)'
                                : 'Shared Contact (Verify Names)'}
                            </span>
                            {grp.reasons.map((reason) => (
                              <span
                                key={reason}
                                className="px-2 py-0.5 rounded bg-white/90 border border-slate-200 text-[10px] font-semibold text-slate-700"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">
                            {grp.members.length} Accounts
                          </span>
                        </div>

                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {grp.members.map((m) => {
                            const isKept = m.id === keepId;
                            const isMarkedRemove = dupRemovalSelectedIds.has(m.id);
                            const mStats =
                              studentResultsStatsMap.get(m.id) ||
                              studentResultsStatsMap.get(m.studentId) || { examCount: 0, medalsWon: 0, avgPct: 0 };
                            const mPoints = m.referralPoints !== undefined ? m.referralPoints : 0;

                            return (
                              <div
                                key={m.id}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between gap-2.5 ${
                                  isMarkedRemove
                                    ? 'bg-rose-50 border-rose-500 shadow-xs'
                                    : isKept
                                    ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-slate-900 text-xs truncate">
                                        {m.name}
                                      </span>
                                      {isKept && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase">
                                          {language === 'ta' ? 'பிரதான கணக்கு (Keep)' : 'Primary Keep'}
                                        </span>
                                      )}
                                      {isMarkedRemove && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                                          {language === 'ta' ? 'நீக்கப்படும்' : 'Will Remove'}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                      {m.studentId} {m.username ? `• @${m.username}` : ''} • {m.gradeLevel}
                                    </p>
                                    <p className="text-[10px] text-slate-600 truncate mt-0.5">
                                      {m.institution}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {!isKept && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetPrimaryKeepForGroup(grp.groupId, m.id)}
                                        className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] border border-emerald-300 cursor-pointer"
                                        title="Keep this account as Primary"
                                      >
                                        Keep This
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDupRemovalSelectedIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(m.id)) next.delete(m.id);
                                          else next.add(m.id);
                                          return next;
                                        });
                                        setDupModalConfirming(false);
                                      }}
                                      className={`px-2 py-1 rounded-lg font-bold text-[10px] border flex items-center gap-1 cursor-pointer ${
                                        isMarkedRemove
                                          ? 'bg-rose-600 text-white border-rose-700'
                                          : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-300'
                                      }`}
                                    >
                                      {isMarkedRemove ? (
                                        <>
                                          <CheckSquare className="w-3 h-3" />
                                          <span>Selected</span>
                                        </>
                                      ) : (
                                        <>
                                          <Square className="w-3 h-3" />
                                          <span>Remove</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-[10px]">
                                  <div className="flex flex-wrap items-center gap-2 text-slate-600">
                                    {m.email && <span className="truncate max-w-[160px]">✉ {m.email}</span>}
                                    {m.phone && <span className="font-mono">📞 {m.phone}</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                                      {mStats.examCount} Exams
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                      {mPoints} pts
                                    </span>
                                    <span className="text-slate-400 font-mono">{m.createdAt}</span>
                                    <button
                                      type="button"
                                      disabled={isDeleting || isBulkDeleting}
                                      onClick={() => setStudentToDelete(m)}
                                      className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                                      title="Delete this single registration immediately"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => {
                  setIsDupModalOpen(false);
                  setDupModalConfirming(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                {language === 'ta' ? 'மூடு' : 'Close'}
              </button>

              {duplicateGroups.length > 0 && (
                <div className="flex items-center gap-2">
                  {dupModalConfirming ? (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-bold text-rose-900">
                        {language === 'ta'
                          ? `${dupRemovalSelectedIds.size} நகல் கணக்குகளை நிரந்தரமாக நீக்கவா?`
                          : `Permanently delete ${dupRemovalSelectedIds.size} duplicate(s)?`}
                      </span>
                      <button
                        type="button"
                        disabled={isBulkDeleting}
                        onClick={() => setDupModalConfirming(false)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-confirm-dup-cleanup"
                        type="button"
                        disabled={isBulkDeleting || dupRemovalSelectedIds.size === 0}
                        onClick={() =>
                          handleConfirmBulkRemove(Array.from(dupRemovalSelectedIds), true)
                        }
                        className="px-3.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        {isBulkDeleting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isBulkDeleting ? 'Removing...' : 'Confirm Remove'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-trigger-dup-cleanup"
                      type="button"
                      disabled={dupRemovalSelectedIds.size === 0 || isBulkDeleting}
                      onClick={() => setDupModalConfirming(true)}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {language === 'ta'
                          ? `தேர்ந்தெடுக்கப்பட்ட நகல்களை நீக்கு (${dupRemovalSelectedIds.size})`
                          : `Remove Selected Duplicates (${dupRemovalSelectedIds.size})`}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

