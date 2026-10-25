import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PortalRole,
  AdminUser,
  StudentUser,
  SuperAdminUser,
  Competition,
  CompetitionResult,
  SystemAuditLog,
  PlatformSettings,
  CompetitionStatus,
  DbUser,
  DbAdmin,
  DbStudent,
  DbCompetition,
  DbResult,
  DbAttempt,
  DbPayment,
  DbVerificationPhoto,
  DbAnnouncement,
  DbMembership,
  DbMembershipPayment,
  MembershipSettings,
  MembershipStatus,
  DbLiveProctorSession,
  ProctorWarning,
  DbAdvertisement,
  DbStudentFeedback,
  FeedbackCategory,
  SubjectNotificationAlert,
} from '../types';
import {
  getDefaultSubjectsForGrade,
  isCompetitionInEnrolledSubjects,
  sendSubjectPublicationBrowserPush,
  isCompetitionAlreadyNotified,
  markCompetitionAsNotified,
  playSubjectPublicationChime,
} from '../utils/subjectNotificationUtils';
import {
  initialSuperAdmin,
  initialAdmins,
  initialStudents,
  initialCompetitions,
  initialResults,
  initialAuditLogs,
  initialSettings,
} from '../data/mockData';
import { getCompetitionQuestions } from '../data/questionPool';
import { getCompetitionScheduleStatus } from '../utils/competitionTimeUtils';
import { Language, translations } from '../i18n/translations';
import { StudentCurriculumPath, detectStudentCurriculumPath, isGradeEligible } from '../lib/gradeUtils';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import {
  logoutUserSession,
  createAdminAccountBySuperAdmin,
  toggleAdminStatusInFirestore,
  updateAdminDetailsInFirestore,
  deleteAdminInFirestore,
  saveCompetitionToFirestore,
  deleteCompetitionInFirestore,
  updateCompetitionStatusInFirestore,
  toggleResultPublishInFirestore,
  subscribeToCompetitions,
  subscribeToResults,
  subscribeToStudents,
  subscribeToAdmins,
  saveAttemptToFirestore,
  getStudentAttemptInFirestore,
  subscribeToStudentAttempts,
  saveResultToFirestore,
  savePaymentToFirestore,
  getStudentPaymentInFirestore,
  updatePaymentStatusInFirestore,
  subscribeToPayments,
  saveVerificationPhotoToFirestore,
  getStudentVerificationPhotoInFirestore,
  subscribeToVerificationPhotos,
  seedInitialDataIfEmpty,
  purgeLegacyDemoFirestoreData,
  purgeAllDemoCompetitions,
  deleteStudentAccountFromFirestore,
  updateStudentPasswordInFirestore,
  updateStudentDetailsInFirestore,
  deleteResultFromFirestore,
  getSavedActiveUser,
  saveActiveUser,
  awardSharePointsInFirestore,
  redeemPerkInFirestore,
  adjustStudentPointsInFirestore,
  recordStudentSpinWheelRewardInFirestore,
  saveAnnouncementToFirestore,
  updateAnnouncementInFirestore,
  deleteAnnouncementFromFirestore,
  purgeDemoAnnouncementsFromFirestore,
  seedOfficialAnnouncementsToFirestore,
  subscribeToAnnouncements,
  saveMembershipInFirestore,
  getMembershipInFirestore,
  getAllMembershipsInFirestore,
  submitMembershipPaymentInFirestore,
  getAllMembershipPaymentsInFirestore,
  reviewMembershipPaymentInFirestore,
  getMembershipSettingsInFirestore,
  saveMembershipSettingsInFirestore,
  upsertLiveProctorSession,
  subscribeToLiveProctorSessions,
  subscribeToSingleProctorSession,
  sendProctorWarningToSession,
  flagProctorSession,
  closeLiveProctorSession,
  subscribeToAdvertisements,
  saveAdvertisementToFirestore,
  deleteAdvertisementInFirestore,
  toggleAdvertisementStatusInFirestore,
  incrementAdClicksInFirestore,
  submitStudentFeedbackToFirestore,
  subscribeToAllFeedbacks,
  subscribeToStudentFeedbacks,
  updateFeedbackInFirestore,
  deleteFeedbackFromFirestore,
} from '../services/firebaseService';

export type SuperAdminNav = 
  | 'Dashboard' 
  | 'Admin Management' 
  | 'Student Management' 
  | 'Competition Management' 
  | 'Results' 
  | 'Announcements'
  | 'Sponsors & Ads'
  | 'Live Proctoring'
  | 'Feedback'
  | 'Leaderboards'
  | 'Audit Trail'
  | 'Settings';

export type AdminNav = 
  | 'Dashboard' 
  | 'Competition Management' 
  | 'Quiz'
  | 'Exam'
  | 'Competition'
  | 'Student Information' 
  | 'Results' 
  | 'Announcements'
  | 'Sponsors & Ads'
  | 'Live Proctoring'
  | 'Feedback'
  | 'Leaderboards'
  | 'Audit Trail'
  | 'Profile';

export type StudentNav = 
  | 'Dashboard' 
  | 'Competitions' 
  | 'Edu-Arena Quest'
  | 'Study Games Hub'
  | 'Leaderboards'
  | 'AI Study Timetable'
  | 'My Results' 
  | 'My Profile'
  | 'Referral & Points'
  | 'Announcements'
  | 'Feedback';

interface AppContextType {
  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;

  // Real Firebase Authentication State
  currentAuthUser: DbUser | null;
  setCurrentAuthUser: (user: DbUser | null) => void;
  authLoading: boolean;
  logout: () => Promise<void>;

  // Current active portal (strictly enforced by Firestore role)
  currentPortal: PortalRole;
  setCurrentPortal: (role: PortalRole) => void;

  // Active sub-navigation tabs per portal
  superAdminNav: SuperAdminNav;
  setSuperAdminNav: (tab: SuperAdminNav) => void;
  adminNav: AdminNav;
  setAdminNav: (tab: AdminNav) => void;
  studentNav: StudentNav;
  setStudentNav: (tab: StudentNav) => void;

  // Districts Quest & Study Gaming Studio State
  isDistrictsStudioOpen: boolean;
  setIsDistrictsStudioOpen: (open: boolean) => void;
  districtsStudioInitialAction: 'list' | 'create';
  setDistrictsStudioInitialAction: (action: 'list' | 'create') => void;
  openDistrictsStudio: (action?: 'list' | 'create') => void;

  // User identities mapped to current authenticated user
  superAdminUser: SuperAdminUser;
  currentAdmin: AdminUser;
  currentStudent: StudentUser;
  studentCurriculumPath: StudentCurriculumPath;

  // Data collections (Synced with Firebase Firestore)
  admins: AdminUser[];
  students: StudentUser[];
  competitions: Competition[];
  results: CompetitionResult[];
  announcements: DbAnnouncement[];
  auditLogs: SystemAuditLog[];
  settings: PlatformSettings;

  // State mutations backed by Firestore
  addAdmin: (adminData: {
    name: string;
    email: string;
    username?: string;
    password?: string;
    staffId: string;
    department: string;
    phone?: string;
    status: 'active' | 'inactive';
    adminType?: 'general' | 'subject_admin';
    assignedSubject?: string;
    assignedSubjects?: string[];
    assignedGrades?: string[];
  }) => Promise<void>;
  toggleAdminStatus: (adminId: string) => Promise<void>;
  deleteAdmin: (adminId: string) => Promise<void>;
  updateAdminDetails: (adminId: string, data: Partial<AdminUser>) => Promise<void>;
  addCompetition: (compData: Omit<Competition, 'id' | 'enrolledCount'>) => Promise<void>;
  saveCompetition: (compData: Partial<Competition> & { title: string }) => Promise<string>;
  deleteCompetition: (competitionId: string) => Promise<void>;
  updateCompetitionStatus: (id: string, status: CompetitionStatus) => Promise<void>;
  approveCompetitionBySuperAdmin: (competitionId: string, comment?: string) => Promise<void>;
  rejectCompetitionBySuperAdmin: (competitionId: string, reason: string) => Promise<void>;
  registerStudentForCompetition: (competitionId: string) => boolean;
  isStudentRegistered: (competitionId: string) => boolean;
  toggleResultPublish: (resultId: string) => Promise<void>;
  updateResultEvaluation: (resultId: string, updates: Partial<CompetitionResult>) => Promise<void>;
  deleteResult: (resultId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<PlatformSettings>) => void;
  updateStudentProfile: (profile: Partial<StudentUser>) => void;
  studentEnrolledSubjects: string[];
  updateStudentEnrolledSubjects: (subjects: string[]) => Promise<void>;
  subjectPublicationAlerts: SubjectNotificationAlert[];
  dismissSubjectPublicationAlert: (alertId: string) => void;
  triggerManualSubjectPushTest: () => Promise<boolean>;
  deleteStudentAccount: (studentUid: string) => Promise<void>;
  updateStudentPassword: (studentUid: string, newPassword: string) => Promise<void>;
  updateStudentByAdmin: (
    studentUid: string,
    updatedData: {
      fullName?: string;
      studentId?: string;
      username?: string;
      email?: string;
      phone?: string;
      grade?: string;
      school?: string;
      district?: string;
      address?: string;
      dateOfBirth?: string;
      guardianName?: string;
      status?: 'active' | 'inactive' | 'suspended';
      referralPoints?: number;
      referralCode?: string;
      newPassword?: string;
      oldStudentId?: string;
    }
  ) => Promise<void>;
  updateAdminProfile: (profile: Partial<AdminUser>) => void;

  // Phase 07: Monthly Membership & Payment System
  memberships: DbMembership[];
  currentMembership: DbMembership | null;
  membershipPayments: DbMembershipPayment[];
  membershipSettings: MembershipSettings;
  submitMembershipPayment: (paymentData: {
    amount: number;
    paymentReference: string;
    paymentMethod?: string;
    slipUrl?: string;
    slipName?: string;
    membershipPeriodDays?: number;
    notes?: string;
  }) => Promise<DbMembershipPayment>;
  reviewMembershipPayment: (paymentId: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
  updateMembershipSettings: (newSettings: Partial<MembershipSettings>) => Promise<void>;
  isMembershipActiveForStudent: (studentId?: string) => boolean;
  refreshMembershipData: () => Promise<void>;

  // Phase 4: Student Exam & Competition Experience
  studentAttempts: DbAttempt[];
  getStudentAttempt: (competitionId: string) => DbAttempt | undefined;
  hasStudentSubmitted: (competitionId: string) => boolean;
  startCompetitionAttempt: (comp: Competition) => Promise<DbAttempt>;
  saveAttemptAnswers: (attemptId: string, answers: Record<string, string>) => Promise<void>;
  submitCompetitionAttempt: (
    attemptId: string,
    competitionId: string,
    answers: Record<string, string>,
    isTimeout?: boolean
  ) => Promise<{ score: number; totalMarks: number; attempt: DbAttempt }>;
  activeExamComp: Competition | null;
  examSessionStage: 'details' | 'instructions' | 'taking' | 'submitted' | null;
  activeExamAttempt: DbAttempt | null;
  openCompetitionDetails: (comp: Competition) => void;
  openCompetitionInstructions: (comp: Competition) => void;
  startActiveExam: (comp: Competition) => Promise<void>;
  exitActiveExam: () => void;

  // Phase 5: Payment, Camera Verification & Prize Rankings
  payments: DbPayment[];
  verificationPhotos: DbVerificationPhoto[];
  processCompetitionPayment: (
    competitionId: string,
    amount: number,
    paymentMethod?: string,
    extraDetails?: {
      transactionReference?: string;
      slipUrl?: string;
      slipName?: string;
      bankName?: string;
      branchName?: string;
      walletNumber?: string;
      paymentNote?: string;
    }
  ) => Promise<DbPayment>;
  isCompetitionPaid: (competitionId: string) => boolean;
  updatePaymentStatus: (paymentId: string, status: 'completed' | 'pending' | 'rejected', notes?: string) => Promise<void>;
  saveExamVerificationPhoto: (
    competitionId: string,
    photoUrl: string,
    videoUrl?: string
  ) => Promise<DbVerificationPhoto>;
  isExamVerified: (competitionId: string) => boolean;
  getStudentVerificationPhoto: (competitionId: string) => DbVerificationPhoto | undefined;
  getCompetitionRankings: (competitionId: string) => Array<CompetitionResult & { computedRank: number; prizeStatus: string }>;
  purgeDemoCompetitions: () => Promise<{ competitionsDeleted: number }>;

  // Referral & Rewards
  awardSharePoints: () => Promise<{ newPoints: number; newShares: number }>;
  redeemStudentPerk: (perkId: string, pointsCost: number) => Promise<boolean>;

  // Announcements & Points Broadcasts
  createAnnouncement: (data: Omit<DbAnnouncement, 'id'>) => Promise<string>;
  updateAnnouncement: (id: string, updates: Partial<DbAnnouncement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  purgeDemoAnnouncements: () => Promise<number>;
  seedOfficialAnnouncements: () => Promise<void>;

  // Student Point Management (Admin / Super Admin)
  adjustStudentPoints: (studentUid: string, pointsDelta: number, reason?: string) => Promise<number>;

  // Real-time Live Exam Proctoring (Student video monitoring for Admin / Super Admin)
  liveProctorSessions: DbLiveProctorSession[];
  saveLiveProctorSession: (session: Partial<DbLiveProctorSession> & { sessionId: string }) => Promise<void>;
  sendProctorWarning: (sessionId: string, warning: ProctorWarning) => Promise<void>;
  flagCandidateSession: (sessionId: string, flagged: boolean, reason?: string) => Promise<void>;
  endProctorSession: (sessionId: string, status?: 'completed' | 'timeout') => Promise<void>;

  // Advertisement & Sponsor Billboard Management (Super Admin & Admin)
  advertisements: DbAdvertisement[];
  saveAdvertisement: (ad: DbAdvertisement) => Promise<void>;
  deleteAdvertisement: (adId: string) => Promise<void>;
  toggleAdvertisementStatus: (adId: string, status: 'active' | 'inactive') => Promise<void>;
  recordAdClick: (adId: string) => Promise<void>;
  isAdManagerOpen: boolean;
  setIsAdManagerOpen: (open: boolean) => void;

  // Student Feedback & Suggestions
  feedbacks: DbStudentFeedback[];
  submitFeedback: (data: {
    category: FeedbackCategory;
    rating: number;
    subject: string;
    message: string;
  }) => Promise<string>;
  updateFeedbackStatus: (
    feedbackId: string,
    status: 'pending' | 'reviewed' | 'resolved',
    adminResponse?: string
  ) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
  isFeedbackModalOpen: boolean;
  setIsFeedbackModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default language is English ('en') as requested, with support for Tamil ('ta') and Sinhala ('si')
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hnc_preferred_lang');
      if (saved === 'en' || saved === 'ta' || saved === 'si') {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hnc_preferred_lang', lang);
    }
  };
  
  // Real Firebase Auth user & loading status
  const [currentAuthUser, setCurrentAuthUserState] = useState<DbUser | null>(() => getSavedActiveUser());
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Portal role (strictly synchronized with currentAuthUser.role, default 'student' for safety)
  const [currentPortal, setInternalPortal] = useState<PortalRole>(() => getSavedActiveUser()?.role || 'student');

  // Navigation tab states
  const [superAdminNav, setSuperAdminNav] = useState<SuperAdminNav>('Dashboard');
  const [adminNav, setAdminNav] = useState<AdminNav>('Dashboard');
  const [studentNav, setStudentNav] = useState<StudentNav>('Dashboard');

  // Synchronized setter for authenticated user that immediately updates the active portal
  const setCurrentAuthUser = useCallback(
    (userOrUpdater: DbUser | null | ((prev: DbUser | null) => DbUser | null)) => {
      setCurrentAuthUserState((prev) => {
        const nextUser = typeof userOrUpdater === 'function' ? userOrUpdater(prev) : userOrUpdater;
        if (nextUser) {
          saveActiveUser(nextUser);
          setInternalPortal(nextUser.role);
          if (nextUser.role === 'student') {
            setStudentNav('Dashboard');
          } else if (nextUser.role === 'admin') {
            const isSubj = nextUser.adminType === 'subject_admin' || Boolean(nextUser.assignedSubject);
            setAdminNav(isSubj ? 'Quiz' : 'Dashboard');
          } else if (nextUser.role === 'super_admin') {
            setSuperAdminNav('Dashboard');
          }
        } else {
          logoutUserSession();
          setInternalPortal('student');
        }
        return nextUser;
      });
    },
    []
  );

  // Automatically enforce portal to match authenticated user role whenever auth changes
  useEffect(() => {
    if (currentAuthUser?.role) {
      if (currentAuthUser.role === 'student' && currentPortal !== 'student') {
        setInternalPortal('student');
        setStudentNav('Dashboard');
      } else if (currentAuthUser.role === 'admin' && currentPortal !== 'admin' && currentPortal !== 'student') {
        setInternalPortal('admin');
        const isSubj = currentAuthUser.adminType === 'subject_admin' || Boolean(currentAuthUser.assignedSubject);
        setAdminNav(isSubj ? 'Quiz' : 'Dashboard');
      }
    }
  }, [currentAuthUser?.uid, currentAuthUser?.role, currentPortal]);

  const t = (key: keyof typeof translations['en']): string => {
    return (translations[language] as Record<string, string>)[key] || translations['en'][key] || key;
  };

  // Base state collections
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [students, setStudents] = useState<StudentUser[]>(initialStudents);
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [results, setResults] = useState<CompetitionResult[]>(initialResults);
  const [announcements, setAnnouncements] = useState<DbAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(initialAuditLogs);
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);

  const [studentRegistrations, setStudentRegistrations] = useState<string[]>([]);

  // Phase 4: Student Exam & Attempts State
  const [studentAttempts, setStudentAttempts] = useState<DbAttempt[]>([]);
  const [activeExamComp, setActiveExamComp] = useState<Competition | null>(null);
  const [examSessionStage, setExamSessionStage] = useState<'details' | 'instructions' | 'taking' | 'submitted' | null>(null);
  const [activeExamAttempt, setActiveExamAttempt] = useState<DbAttempt | null>(null);

  // Phase 5: Payments and Verification Photos State
  const [payments, setPayments] = useState<DbPayment[]>([]);
  const [verificationPhotos, setVerificationPhotos] = useState<DbVerificationPhoto[]>([]);
  const [liveProctorSessions, setLiveProctorSessions] = useState<DbLiveProctorSession[]>([]);

  // Phase 07: Membership State
  const [memberships, setMemberships] = useState<DbMembership[]>([]);
  const [membershipPayments, setMembershipPayments] = useState<DbMembershipPayment[]>([]);
  const [membershipSettings, setMembershipSettings] = useState<MembershipSettings>({
    enabled: true,
    monthlyFeeLkr: 1500,
    durationDays: 30,
    accessRulesNote: 'Active monthly membership is required for premium competitions.',
  });

  // Phase 08: Advertisements & Sponsor Billboard State
  const [advertisements, setAdvertisements] = useState<DbAdvertisement[]>([]);
  const [isAdManagerOpen, setIsAdManagerOpen] = useState<boolean>(false);

  // Student Feedback & Suggestions State
  const [feedbacks, setFeedbacks] = useState<DbStudentFeedback[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  // Enrolled Subjects & Publication Push Alerts State
  const [studentEnrolledSubjectsState, setStudentEnrolledSubjectsState] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('hnc_student_enrolled_subjects_active');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return ['Mathematics', 'Science', 'English', 'Information Technology (ICT)'];
  });
  const [subjectPublicationAlerts, setSubjectPublicationAlerts] = useState<SubjectNotificationAlert[]>([]);

  // Districts Quest & Study Gaming Studio State
  const [isDistrictsStudioOpen, setIsDistrictsStudioOpen] = useState<boolean>(false);
  const [districtsStudioInitialAction, setDistrictsStudioInitialAction] = useState<'list' | 'create'>('list');

  const openDistrictsStudio = (action: 'list' | 'create' = 'list') => {
    setDistrictsStudioInitialAction(action);
    if (currentPortal === 'student') {
      setStudentNav('Edu-Arena Quest');
    } else if (currentPortal === 'super_admin') {
      setSuperAdminNav('Competition Management');
      setIsDistrictsStudioOpen(true);
    } else {
      setAdminNav('Competition Management');
      setIsDistrictsStudioOpen(true);
    }
  };

  // Portal Setter: Allows Super Admin & Admins to switch/preview Student Portal view
  const setCurrentPortal = (targetRole: PortalRole) => {
    if (!currentAuthUser) {
      setInternalPortal(targetRole);
      return;
    }

    // Super Admin identity has full preview access across all portals
    if (currentAuthUser.role === 'super_admin') {
      setInternalPortal(targetRole);
      return;
    }

    // Admin identity can preview Student Portal
    if (currentAuthUser.role === 'admin' && (targetRole === 'admin' || targetRole === 'student')) {
      setInternalPortal(targetRole);
      return;
    }

    // Student identity
    setInternalPortal('student');
  };

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    // Run database hygiene once in background without blocking initial auth / UI render
    if (typeof window !== 'undefined' && !localStorage.getItem('hnc_seed_initialized_v2')) {
      seedInitialDataIfEmpty().then(() => {
        localStorage.setItem('hnc_seed_initialized_v2', 'true');
      }).catch(() => {});
    }

    // Immediately release loading screen if not already
    setAuthLoading(false);

    const handleForceReady = () => {
      setAuthLoading(false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('hnc_force_ready', handleForceReady);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setAuthLoading(false);
      try {
        const saved = getSavedActiveUser();

        // If a valid saved user exists, immediately end loading and present the portal UI
        if (saved && saved.role && saved.status !== 'inactive') {
          setAuthLoading(false);
        }

        if (fbUser) {
          let resolvedUser: DbUser | null = null;

          // 1. FAST-PATH: If saved user in localStorage matches fbUser, restore instantly with zero network delay!
          if (
            saved &&
            (saved.uid === fbUser.uid ||
              (fbUser.email &&
                (saved.email?.toLowerCase() === fbUser.email.toLowerCase() ||
                  saved.authEmail?.toLowerCase() === fbUser.email.toLowerCase())))
          ) {
            resolvedUser = saved;
          }

          // 2. Direct fetch by fbUser.uid in 'users' collection if not resolved
          if (!resolvedUser) {
            try {
              const fetchPromise = getDoc(doc(db, 'users', fbUser.uid));
              const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
              const userDoc: any = await Promise.race([fetchPromise, timeoutPromise]);
              if (userDoc && typeof userDoc.exists === 'function' && userDoc.exists()) {
                resolvedUser = userDoc.data() as DbUser;
              }
            } catch (fetchErr) {
              console.warn('Doc fetch by fbUser.uid warning:', fetchErr);
            }
          }

          // 3. If still not found, check by saved.uid in Firestore
          if (!resolvedUser && saved?.uid) {
            try {
              const savedDoc = await getDoc(doc(db, 'users', saved.uid));
              if (savedDoc.exists()) {
                resolvedUser = savedDoc.data() as DbUser;
              }
            } catch {}
          }

          // 4. If still not found, query 'users' by email or authEmail
          if (!resolvedUser && fbUser.email) {
            try {
              const fbEmail = fbUser.email.toLowerCase();
              const snap = await getDocs(query(collection(db, 'users'), where('email', '==', fbEmail)));
              if (!snap.empty) {
                resolvedUser = snap.docs[0].data() as DbUser;
              } else {
                const snapAuth = await getDocs(query(collection(db, 'users'), where('authEmail', '==', fbEmail)));
                if (!snapAuth.empty) {
                  resolvedUser = snapAuth.docs[0].data() as DbUser;
                }
              }
            } catch {}
          }

          // 5. Designated Super Admin identity synchronization
          if (!resolvedUser && fbUser.email?.toLowerCase() === 'freedomedupu@gmail.com') {
            resolvedUser = {
              uid: fbUser.uid,
              fullName: 'Chief Academic Registrar (Super Admin)',
              email: fbUser.email,
              phone: '+94 77 123 4567',
              role: 'super_admin',
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(doc(db, 'users', fbUser.uid), resolvedUser, { merge: true });
            } catch (e) {
              console.warn('Super Admin sync notice:', e);
            }
          }

          // 6. Process resolvedUser or maintain saved session
          if (resolvedUser) {
            const isInactive = resolvedUser.status === 'inactive';
            if (isInactive) {
              await logoutUserSession();
              setCurrentAuthUser(null);
            } else {
              if (!resolvedUser.status) resolvedUser.status = 'active';

              // If student, enrich in background without delaying portal readiness
              if (resolvedUser.role === 'student') {
                getDoc(doc(db, 'students', resolvedUser.uid))
                  .then((stuDoc) => {
                    if (stuDoc.exists()) {
                      const stuData = stuDoc.data();
                      setCurrentAuthUser((prev) => {
                        if (!prev) return prev;
                        const merged: DbUser = {
                          ...prev,
                          grade: stuData.grade || prev.grade || 'Grade 6',
                          school: stuData.school || prev.school,
                          referralPoints: Math.max(
                            stuData.referralPoints !== undefined ? stuData.referralPoints : 0,
                            prev.referralPoints ?? 0
                          ),
                          totalReferrals: stuData.totalReferrals !== undefined ? stuData.totalReferrals : (prev.totalReferrals ?? 0),
                          sharesCount: stuData.sharesCount !== undefined ? stuData.sharesCount : (prev.sharesCount ?? 0),
                          redeemedPerks: stuData.redeemedPerks || prev.redeemedPerks || [],
                          referralCode: stuData.referralCode || prev.referralCode,
                          avatarUrl: stuData.avatarUrl || prev.avatarUrl || '',
                          lastSpinDate:
                            stuData.lastSpinDate ||
                            prev.lastSpinDate ||
                            (typeof window !== 'undefined'
                              ? localStorage.getItem(`hnc_spin_date_${prev.uid}`) ||
                                localStorage.getItem(`hnc_spin_date_${prev.studentId}`) ||
                                localStorage.getItem('hnc_spin_date_last') ||
                                ''
                              : ''),
                        };
                        saveActiveUser(merged);
                        return merged;
                      });
                    }
                  })
                  .catch(() => {});
              }

              const preservedLastSpinDate =
                resolvedUser.lastSpinDate ||
                saved?.lastSpinDate ||
                (typeof window !== 'undefined'
                  ? localStorage.getItem(`hnc_spin_date_${resolvedUser.uid}`) ||
                    localStorage.getItem(`hnc_spin_date_${resolvedUser.studentId}`) ||
                    localStorage.getItem('hnc_spin_date_last') ||
                    ''
                  : '');

              const preservedPoints = Math.max(
                resolvedUser.referralPoints || 0,
                saved?.referralPoints || 0,
                typeof window !== 'undefined'
                  ? parseInt(
                      localStorage.getItem(`hnc_student_points_${resolvedUser.uid}`) ||
                      localStorage.getItem('hnc_student_points_active') ||
                      '0',
                      10
                    )
                  : 0
              );

              const mergedResolved: DbUser = {
                ...resolvedUser,
                lastSpinDate: preservedLastSpinDate,
                referralPoints: preservedPoints,
              };

              // Update session and persist to storage
              saveActiveUser(mergedResolved);
              setCurrentAuthUser(mergedResolved);
              setInternalPortal(mergedResolved.role);
            }
          } else {
            // Neither Firestore nor query resolved this fbUser.
            const freshSaved = getSavedActiveUser() || saved;
            if (freshSaved && freshSaved.role && freshSaved.status !== 'inactive') {
              saveActiveUser(freshSaved);
              setCurrentAuthUser(freshSaved);
              setInternalPortal(freshSaved.role);
            } else {
              setCurrentAuthUserState((prev) => (prev && prev.status !== 'inactive' ? prev : null));
            }
          }
        } else {
          // fbUser is null (e.g. user logged in using Student ID, Username, or Staff ID with offline/direct auth)
          const freshSaved = getSavedActiveUser();
          if (freshSaved && freshSaved.role && freshSaved.status !== 'inactive') {
            saveActiveUser(freshSaved);
            setCurrentAuthUser(freshSaved);
            setInternalPortal(freshSaved.role);
          } else {
            setCurrentAuthUserState((prev) => (prev && prev.status !== 'inactive' ? prev : null));
          }
        }
      } catch (err) {
        console.warn('Auth restoration resilience fallback note:', err);
        const freshSaved = getSavedActiveUser();
        if (freshSaved && freshSaved.role && freshSaved.status !== 'inactive') {
          saveActiveUser(freshSaved);
          setCurrentAuthUser(freshSaved);
          setInternalPortal(freshSaved.role);
        } else {
          setCurrentAuthUserState((prev) => (prev && prev.status !== 'inactive' ? prev : null));
        }
      } finally {
        setAuthLoading(false);
      }
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hnc_force_ready', handleForceReady);
      }
      unsubscribeAuth();
    };
  }, []);

  // Listen to real-time collections when authenticated
  useEffect(() => {
    if (!currentAuthUser) return;

    // 1. Competitions subscription (All authenticated users)
    const unsubComp = subscribeToCompetitions((dbComps) => {
      const knownDemoIds = new Set([
        'comp-nat-math-olympiad-2026',
        'comp-sci-national-challenge-2026',
        'comp-gr6-math-challenge-2026',
        'comp-gr7-science-quiz-2026',
        'comp-101',
        'comp-102',
        'comp-103',
        'comp-104',
        'comp-105',
        'feat-math-2026',
        'feat-sci-2026',
        'feat-eng-2026',
        'feat-env-2026',
      ]);
      const knownDemoCodes = new Set([
        'HNC-MATH-2026',
        'HNC-STEM-2026',
        'HNC-GR6-MATH-2026',
        'HNC-GR7-SCI-2026',
      ]);

      // Strictly exclude test/dummy sample competitions so students will never see test dummy records
      const realComps = dbComps.filter((c) => {
        const validId = c.competitionId || (c as any).id;
        const code = (c.code || '').toUpperCase();
        const title = (c.title || '').toLowerCase();
        if (
          knownDemoIds.has(validId) ||
          knownDemoCodes.has(code) ||
          title.includes('demo competition') ||
          title.includes('sample competition') ||
          title.includes('test competition') ||
          title.includes('demo')
        ) {
          return false;
        }
        return true;
      });

      const mapped: Competition[] = realComps.map((c) => {
        const validId = c.competitionId || (c as any).id;
        return {
          id: validId,
          competitionId: validId,
          title: c.title || 'Untitled Exam / Competition',
          code: c.code || `HNC-${(validId || 'EXAM').slice(-4).toUpperCase()}`,
          category: c.category as any,
          description: c.description || '',
          competitionType: (c.competitionType as any) || 'Quiz',
          grade: c.grade || 'Open',
          language: (c.language as any) || 'English',
          duration: c.duration ?? 60,
          entryType: (c.entryType as any) || 'Free',
          entryFee: c.entryFee ?? 0,
          prizesEnabled: c.prizesEnabled ?? true,
          prizeDetails: c.prizeDetails || {
            firstPrize: '1st Prize Trophy & Gold Medal',
            secondPrize: '2nd Prize Silver Medal',
            thirdPrize: '3rd Prize Bronze Medal',
            participationCertificate: 'E-Certificate of Participation',
          },
          registrationStart: c.registrationStart || c.registrationDeadline || '2026-03-01',
          registrationEnd: c.registrationEnd || c.registrationDeadline || '2026-04-15',
          competitionStart: c.competitionStart || c.startDate || '2026-04-20',
          competitionEnd: c.competitionEnd || c.endDate || '2026-04-22',
          competitionStartTime: c.competitionStartTime || '09:00',
          competitionEndTime: c.competitionEndTime || '23:59',
          status: c.status,
          questions: c.questions || [],
          questionsCount: c.questionsCount ?? c.questions?.length ?? 0,
          totalMarks: c.totalMarks ?? c.questions?.reduce((acc, q) => acc + (q.marks || 0), 0) ?? 0,
          participants: c.participants || [],
          registrationDeadline: c.registrationDeadline || c.registrationEnd || '2026-04-15',
          startDate: c.startDate || c.competitionStart || '2026-04-20',
          endDate: c.endDate || c.competitionEnd || '2026-04-22',
          maxParticipants: c.maxParticipants || 500,
          enrolledCount: c.enrolledCount || c.participants?.length || 0,
          leadAdminId: c.leadAdminId,
          leadAdminName: c.leadAdminName,
          eligibility: c.eligibility || 'All eligible students',
          prizePool: c.prizePool || 'Medals, Awards and Certificates',
          evaluationMode: c.evaluationMode || 'Automated',
          requireCameraVerification: c.requireCameraVerification,
          membershipRequired: c.membershipRequired,
          roundsCount: c.roundsCount || 1,
          createdAt: c.createdAt,
          district: c.district,
          province: c.province,
          scope: c.scope,
          gamingMode: c.gamingMode,
          approvalStatus: (c as any).approvalStatus || ((c.status === 'Draft' || (c.status as string) === 'Pending Approval') ? ((c as any).approvalStatus || 'pending_approval') : 'approved'),
          approvalComment: (c as any).approvalComment,
          approvedBy: (c as any).approvedBy,
          approvedByName: (c as any).approvedByName,
          approvedAt: (c as any).approvedAt,
          isAiGenerated: (c as any).isAiGenerated,
          aiMode: (c as any).aiMode,
        };
      });

      setCompetitions(mapped);

      // Trigger browser and in-app push notifications if a competition/quiz was published in student's enrolled subjects
      if (currentAuthUser && (currentAuthUser.role === 'student' || currentPortal === 'student')) {
        const studentGrade = currentAuthUser.grade || (currentAuthUser as any).gradeLevel || 'Grade 6';
        const studentSubjects = currentAuthUser.enrolledSubjects && currentAuthUser.enrolledSubjects.length > 0
          ? currentAuthUser.enrolledSubjects
          : (studentEnrolledSubjectsState && studentEnrolledSubjectsState.length > 0
              ? studentEnrolledSubjectsState
              : getDefaultSubjectsForGrade(studentGrade));

        const newAlerts: SubjectNotificationAlert[] = [];

        mapped.forEach((c) => {
          const s = (c.status || '').toLowerCase();
          const isPending = c.approvalStatus === 'pending_approval' || (c.status as string) === 'Pending Approval' || c.approvalStatus === 'rejected';
          const isLive = !isPending && (s.includes('publish') || s.includes('open') || s.includes('ongoing'));
          if (isLive) {
            // STRICT GRADE FILTER:
            // "குறிப்பிட்ட மாணவருடைய தரங்களுக்கு மட்டுமே அவரவர் டாஸ் போர்டுல மற்றும் நோட்டிபிகேஷன்ல பரீட்சைகள் டிஸ்ப்ளே ஆக வேண்டும் ஓபன் அண்ட் கொடுத்தா மட்டும் தான் எல்லா மாணவர்களும் டிஸ்ப்ளே ஆகணும்"
            if (!isGradeEligible(c.grade, studentGrade)) {
              return;
            }

            const { matches, matchedSubject } = isCompetitionInEnrolledSubjects(c, studentSubjects);
            if (matches) {
              const alreadyNotified = isCompetitionAlreadyNotified(currentAuthUser.uid, c.id);
              if (!alreadyNotified) {
                markCompetitionAsNotified(currentAuthUser.uid, c.id);
                sendSubjectPublicationBrowserPush(c, matchedSubject, language);

                newAlerts.push({
                  id: `alert-sub-${c.id}`,
                  competitionId: c.id,
                  competitionTitle: c.title,
                  competitionType: c.competitionType || 'Quiz',
                  subject: matchedSubject,
                  grade: c.grade || 'Open',
                  publishedAt: c.createdAt || new Date().toISOString(),
                  read: false,
                  entryType: c.entryType,
                  entryFee: c.entryFee,
                  duration: c.duration,
                  code: c.code,
                });
              }
            }
          }
        });

        if (newAlerts.length > 0) {
          setSubjectPublicationAlerts((prev) => {
            const existingIds = new Set(prev.map((a) => a.competitionId));
            const filteredNew = newAlerts.filter((a) => !existingIds.has(a.competitionId));
            return [...filteredNew, ...prev];
          });
        }
      }
    });

    // 2. Results subscription (Students only receive their own results as per rules)
    const unsubResults = subscribeToResults(
      currentAuthUser.role,
      currentAuthUser.uid,
      (dbResults) => {
        const mapped: CompetitionResult[] = dbResults.map((r) => ({
          id: r.resultId,
          competitionId: r.competitionId,
          competitionTitle: r.competitionTitle || 'Academic Competition',
          studentId: r.studentId,
          studentName: r.studentName || 'Candidate',
          studentInstitution: r.studentInstitution || 'Participating Institution',
          score: r.score,
          maxScore: r.totalMarks,
          rank: r.rank,
          percentile: r.percentage,
          award: (r.award as any) || 'Participation',
          publishStatus: r.publishStatus || 'published',
          certificateId: r.certificateId || `CERT-${r.resultId}`,
          publishedAt: r.submittedAt,
        }));
        setResults(mapped);
      }
    );

    // 3. Students subscription (Admins and Super Admins only)
    let unsubStudents: (() => void) | undefined;
    if (currentAuthUser.role === 'super_admin' || currentAuthUser.role === 'admin') {
      unsubStudents = subscribeToStudents((dbStudents) => {
        const unique = new Map<string, DbStudent>();
        dbStudents.forEach((s) => {
          if (s.uid) unique.set(s.uid, s);
        });
        const mapped: StudentUser[] = Array.from(unique.values()).map((s, idx) => ({
          id: s.uid,
          name: s.fullName,
          email: s.email,
          role: 'student',
          status: s.status,
          createdAt: s.createdAt ? s.createdAt.split('T')[0] : '2026-01-01',
          studentId: s.studentId || `HNC-STD-${202600 + idx}`,
          username: s.username || '',
          institution: s.school,
          district: s.district || '',
          address: s.address || '',
          dateOfBirth: s.dateOfBirth || '',
          gradeLevel: s.grade,
          competitionsEnrolled: 0,
          awardsCount: 0,
          phone: s.phone,
          referralCode: s.referralCode || `HNC-${(s.studentId || s.username || s.uid.slice(0, 5)).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
          referredBy: s.referredBy || '',
          referralPoints: s.referralPoints !== undefined ? s.referralPoints : 0,
          totalReferrals: s.totalReferrals || 0,
          sharesCount: s.sharesCount || 0,
          redeemedPerks: s.redeemedPerks || [],
          lastSpinDate: s.lastSpinDate || '',
        }));
        setStudents(mapped);
      });
    }

    // 4. Admins subscription (Super Admin only)
    let unsubAdmins: (() => void) | undefined;
    if (currentAuthUser.role === 'super_admin') {
      unsubAdmins = subscribeToAdmins((dbAdmins) => {
        const unique = new Map<string, DbAdmin>();
        dbAdmins.forEach((a) => {
          if (a.uid) unique.set(a.uid, a);
        });
        const mapped: AdminUser[] = Array.from(unique.values()).map((a) => ({
          id: a.uid,
          name: a.fullName,
          email: a.email,
          username: a.username || a.staffId || a.email.split('@')[0],
          initialPassword: a.initialPassword,
          role: 'admin',
          status: a.status,
          createdAt: a.createdAt ? a.createdAt.split('T')[0] : '2026-01-01',
          department: a.department || 'Academic Affairs',
          staffId: a.staffId || `ADM-${a.uid.slice(0, 5)}`,
          adminType: (a.adminType as any) || 'general',
          assignedSubject: a.assignedSubject || '',
          assignedSubjects: a.assignedSubjects || (a.assignedSubject ? [a.assignedSubject] : []),
          assignedGrades: a.assignedGrades || [],
          assignedCompetitionsCount: 0,
          phone: a.phone,
        }));
        setAdmins(mapped);
      });
    }

    // 5. Student Attempts subscription (realtime sync from Firestore)
    let unsubAttempts: (() => void) | undefined;
    if (currentAuthUser) {
      unsubAttempts = subscribeToStudentAttempts(currentAuthUser.uid, (dbAttempts) => {
        setStudentAttempts(dbAttempts);
      });
    }

    // 6. Payments subscription (realtime sync from Firestore)
    let unsubPayments: (() => void) | undefined;
    if (currentAuthUser) {
      unsubPayments = subscribeToPayments(currentAuthUser.role, currentAuthUser.uid, (dbPayments) => {
        setPayments(dbPayments);
      });
    }

    // 7. Exam Verification Photos subscription (realtime sync from Firestore)
    let unsubPhotos: (() => void) | undefined;
    if (currentAuthUser) {
      unsubPhotos = subscribeToVerificationPhotos(currentAuthUser.role, currentAuthUser.uid, (dbPhotos) => {
        setVerificationPhotos(dbPhotos);
      });
    }

    // 8. Announcements subscription (realtime sync from Firestore)
    const unsubAnnouncements = subscribeToAnnouncements((data) => {
      setAnnouncements(data);
    });

    // 9. Real-time sync of logged-in student's referral points & perks
    let unsubStudentProfile: (() => void) | undefined;
    if (currentAuthUser && currentAuthUser.role === 'student') {
      try {
        unsubStudentProfile = onSnapshot(doc(db, 'students', currentAuthUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const stuData = docSnap.data() as DbStudent;
            setCurrentAuthUser((prev) => {
              if (!prev || prev.uid !== currentAuthUser.uid) return prev;
              const newPts = stuData.referralPoints !== undefined ? stuData.referralPoints : (prev.referralPoints ?? 0);
              const newRefs = stuData.totalReferrals !== undefined ? stuData.totalReferrals : (prev.totalReferrals ?? 0);
              const newShares = stuData.sharesCount !== undefined ? stuData.sharesCount : (prev.sharesCount ?? 0);
              const newPerks = stuData.redeemedPerks || prev.redeemedPerks || [];
              const newCode = stuData.referralCode || prev.referralCode || '';
              const newAvatar = stuData.avatarUrl || prev.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem(`hnc_student_avatar_${currentAuthUser.uid}`) : '') || '';
              const newSpinDate = stuData.lastSpinDate || prev.lastSpinDate || '';

              if (
                (prev.referralPoints ?? 0) === newPts &&
                (prev.totalReferrals ?? 0) === newRefs &&
                (prev.sharesCount ?? 0) === newShares &&
                (prev.redeemedPerks?.length || 0) === newPerks.length &&
                (prev.referralCode || '') === newCode &&
                (prev.avatarUrl || '') === newAvatar &&
                (prev.lastSpinDate || '') === newSpinDate
              ) {
                return prev;
              }

              const updated: DbUser = {
                ...prev,
                referralPoints: newPts,
                totalReferrals: newRefs,
                sharesCount: newShares,
                redeemedPerks: newPerks,
                referralCode: newCode,
                avatarUrl: newAvatar,
                lastSpinDate: newSpinDate,
              };
              saveActiveUser(updated);
              return updated;
            });
          }
        });
      } catch (err) {
        console.warn('Real-time student points sync notice:', err);
      }
    }

    // 10. Real-time Live Exam Proctoring sessions subscription (Admin & Super Admin)
    let unsubProctor: (() => void) | undefined;
    if (currentAuthUser && (currentAuthUser.role === 'admin' || currentAuthUser.role === 'super_admin')) {
      unsubProctor = subscribeToLiveProctorSessions((sessions) => {
        const realSessions = sessions.filter((s) => {
          const sName = (s.studentName || '').toLowerCase();
          const sId = (s.sessionId || '').toLowerCase();
          if (
            sId.startsWith('sim-') ||
            sId.startsWith('mock_') ||
            s.studentId?.startsWith('sim-') ||
            sName.includes('simulated') ||
            sName.includes('kavishka silva') ||
            sName.includes('tharindu perera') ||
            sName.includes('priya ramanathan') ||
            sName.includes('ahmad rizwan') ||
            sName.includes('கவிநிலா')
          ) {
            return false;
          }
          return true;
        });
        setLiveProctorSessions(realSessions);
      });
    }

    // 11. Real-time Advertisements & Sponsor Billboard subscription
    const unsubAds = subscribeToAdvertisements((adsList) => {
      setAdvertisements(adsList);
    });

    // 12. Real-time Student Feedback subscription
    let unsubFeedbacks: (() => void) | undefined;
    const activeStudentId = currentAuthUser?.uid || currentStudent?.id;
    if (currentAuthUser && (currentAuthUser.role === 'admin' || currentAuthUser.role === 'super_admin')) {
      unsubFeedbacks = subscribeToAllFeedbacks((allList) => {
        setFeedbacks(allList);
      });
    } else if (activeStudentId) {
      unsubFeedbacks = subscribeToStudentFeedbacks(activeStudentId, (myList) => {
        setFeedbacks(myList);
      });
    }

    return () => {
      unsubComp();
      unsubResults();
      if (unsubStudents) unsubStudents();
      if (unsubAdmins) unsubAdmins();
      if (unsubAttempts) unsubAttempts();
      if (unsubPayments) unsubPayments();
      if (unsubPhotos) unsubPhotos();
      unsubAnnouncements();
      if (unsubStudentProfile) unsubStudentProfile();
      if (unsubProctor) unsubProctor();
      unsubAds();
      if (unsubFeedbacks) unsubFeedbacks();
    };
  }, [currentAuthUser?.uid, currentAuthUser?.role]);

  // Active identities derived from authenticated user (memoized to prevent child re-renders)
  const superAdminUser: SuperAdminUser = useMemo(() => ({
    ...initialSuperAdmin,
    id: currentAuthUser?.uid || initialSuperAdmin.id,
    name: currentAuthUser?.role === 'super_admin' ? currentAuthUser.fullName : initialSuperAdmin.name,
    email: currentAuthUser?.role === 'super_admin' ? currentAuthUser.email : initialSuperAdmin.email,
  }), [currentAuthUser?.uid, currentAuthUser?.role, currentAuthUser?.fullName, currentAuthUser?.email]);

  const currentAdmin: AdminUser = useMemo(() => ({
    id: currentAuthUser?.uid || '',
    name: currentAuthUser?.fullName || 'Academic Lead',
    email: currentAuthUser?.email || '',
    role: 'admin',
    department: currentAuthUser?.department || 'Academic Affairs',
    staffId: currentAuthUser?.staffId || 'HNC-ADM',
    adminType: (currentAuthUser?.adminType as any) || 'general',
    assignedSubject: currentAuthUser?.assignedSubject || '',
    assignedSubjects: currentAuthUser?.assignedSubjects || (currentAuthUser?.assignedSubject ? [currentAuthUser.assignedSubject] : []),
    assignedGrades: currentAuthUser?.assignedGrades || [],
    assignedCompetitionsCount: competitions.filter(
      (c) =>
        c.leadAdminId === currentAuthUser?.uid ||
        c.leadAdminName === currentAuthUser?.fullName ||
        (currentAuthUser?.assignedSubject && c.category?.toLowerCase() === currentAuthUser.assignedSubject.toLowerCase())
    ).length,
    phone: currentAuthUser?.phone || '',
    createdAt: currentAuthUser?.createdAt ? currentAuthUser.createdAt.split('T')[0] : '2026-01-01',
    status: (currentAuthUser?.status as any) || 'active',
  }), [
    currentAuthUser?.uid,
    currentAuthUser?.fullName,
    currentAuthUser?.email,
    currentAuthUser?.department,
    currentAuthUser?.staffId,
    currentAuthUser?.phone,
    currentAuthUser?.createdAt,
    currentAuthUser?.status,
    currentAuthUser?.adminType,
    currentAuthUser?.assignedSubject,
    currentAuthUser?.assignedSubjects,
    currentAuthUser?.assignedGrades,
    competitions,
  ]);

  const studentEnrolledGrade = currentAuthUser?.grade || (currentAuthUser as any)?.gradeLevel || 'Grade 11 (O/L)';

  const studentCurriculumPath = useMemo(() => {
    return detectStudentCurriculumPath(studentEnrolledGrade);
  }, [studentEnrolledGrade]);

  const currentStudent: StudentUser = useMemo(() => ({
    id: currentAuthUser?.uid || '',
    avatarUrl:
      currentAuthUser?.avatarUrl ||
      (typeof window !== 'undefined'
        ? localStorage.getItem(`hnc_student_avatar_${currentAuthUser?.uid}`) ||
          localStorage.getItem(`hnc_student_avatar_${currentAuthUser?.studentId}`) ||
          localStorage.getItem('hnc_student_avatar_active') ||
          ''
        : ''),
    name: currentAuthUser?.fullName || 'Student',
    email: currentAuthUser?.email || '',
    role: 'student',
    studentId: currentAuthUser?.studentId || (currentAuthUser?.uid ? `HNC-STD-${currentAuthUser.uid.slice(0, 5).toUpperCase()}` : 'HNC-STD-0000'),
    username: currentAuthUser?.username || '',
    institution: currentAuthUser?.school || 'Participating Institution',
    gradeLevel: studentEnrolledGrade,
    curriculumPathId: studentCurriculumPath.id,
    curriculumPathTitle: studentCurriculumPath.titleTa,
    district: currentAuthUser?.district || '',
    address: currentAuthUser?.address || '',
    dateOfBirth: currentAuthUser?.dateOfBirth || '',
    competitionsEnrolled: studentRegistrations.length,
    awardsCount: results.filter(
      (r) =>
        (r.studentId === currentAuthUser?.uid || r.studentName === currentAuthUser?.fullName) &&
        (r.rank === 1 || r.rank === 2 || r.rank === 3)
    ).length,
    phone: currentAuthUser?.phone || '',
    guardianName: currentAuthUser?.guardianName || '',
    bio: currentAuthUser?.bio || '',
    createdAt: currentAuthUser?.createdAt ? currentAuthUser.createdAt.split('T')[0] : '2026-01-01',
    status: (currentAuthUser?.status as any) || 'active',
    referralCode:
      currentAuthUser?.referralCode ||
      `HNC-${(currentAuthUser?.studentId || currentAuthUser?.username || currentAuthUser?.uid?.slice(0, 5) || 'STUDENT')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')}`,
    referredBy: currentAuthUser?.referredBy,
    referralPoints:
      currentAuthUser?.referralPoints !== undefined
        ? currentAuthUser.referralPoints
        : (typeof window !== 'undefined'
            ? parseInt(
                localStorage.getItem(`hnc_student_points_${currentAuthUser?.uid}`) ||
                localStorage.getItem(`hnc_student_points_${currentAuthUser?.studentId}`) ||
                localStorage.getItem('hnc_student_points_active') ||
                '0',
                10
              )
            : 0),
    totalReferrals: currentAuthUser?.totalReferrals || 0,
    sharesCount: currentAuthUser?.sharesCount || 0,
    redeemedPerks: currentAuthUser?.redeemedPerks || [],
    lastSpinDate:
      currentAuthUser?.lastSpinDate ||
      (typeof window !== 'undefined'
        ? localStorage.getItem(`hnc_spin_date_${currentAuthUser?.uid}`) ||
          localStorage.getItem(`hnc_spin_date_${currentAuthUser?.studentId}`) ||
          localStorage.getItem('hnc_spin_date_last') ||
          ''
        : ''),
    enrolledSubjects:
      currentAuthUser?.enrolledSubjects ||
      (typeof window !== 'undefined'
        ? (() => {
            try {
              const raw =
                localStorage.getItem(`hnc_student_enrolled_subjects_${currentAuthUser?.uid}`) ||
                localStorage.getItem('hnc_student_enrolled_subjects_active');
              return raw ? JSON.parse(raw) : undefined;
            } catch {
              return undefined;
            }
          })()
        : undefined) ||
      studentCurriculumPath.coreSubjectsEn,
  }), [
    currentAuthUser?.uid,
    currentAuthUser?.avatarUrl,
    currentAuthUser?.fullName,
    currentAuthUser?.email,
    currentAuthUser?.studentId,
    currentAuthUser?.username,
    currentAuthUser?.school,
    currentAuthUser?.grade,
    currentAuthUser?.district,
    currentAuthUser?.address,
    currentAuthUser?.dateOfBirth,
    currentAuthUser?.phone,
    currentAuthUser?.createdAt,
    currentAuthUser?.status,
    currentAuthUser?.referralCode,
    currentAuthUser?.referredBy,
    currentAuthUser?.referralPoints,
    currentAuthUser?.totalReferrals,
    currentAuthUser?.sharesCount,
    currentAuthUser?.redeemedPerks,
    currentAuthUser?.lastSpinDate,
    currentAuthUser?.enrolledSubjects,
    studentRegistrations.length,
    results,
    studentCurriculumPath.coreSubjectsEn,
  ]);

  const studentEnrolledSubjects = useMemo(() => {
    if (currentAuthUser?.enrolledSubjects && currentAuthUser.enrolledSubjects.length > 0) {
      return currentAuthUser.enrolledSubjects;
    }
    if (studentEnrolledSubjectsState && studentEnrolledSubjectsState.length > 0) {
      return studentEnrolledSubjectsState;
    }
    return getDefaultSubjectsForGrade(currentStudent?.gradeLevel || 'Grade 6');
  }, [currentAuthUser?.enrolledSubjects, currentStudent?.gradeLevel, studentEnrolledSubjectsState]);

  const updateStudentEnrolledSubjects = async (subjects: string[]) => {
    setStudentEnrolledSubjectsState(subjects);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hnc_student_enrolled_subjects_active', JSON.stringify(subjects));
        if (currentAuthUser?.uid) {
          localStorage.setItem(`hnc_student_enrolled_subjects_${currentAuthUser.uid}`, JSON.stringify(subjects));
        }
      } catch {}
    }

    if (currentAuthUser) {
      const updatedUser: DbUser = {
        ...currentAuthUser,
        enrolledSubjects: subjects,
      };
      setCurrentAuthUser(updatedUser);
      saveActiveUser(updatedUser);

      try {
        await setDoc(doc(db, 'users', currentAuthUser.uid), { enrolledSubjects: subjects }, { merge: true });
        await setDoc(doc(db, 'students', currentAuthUser.uid), { enrolledSubjects: subjects }, { merge: true });
      } catch (err) {
        console.warn('Firestore enrolledSubjects sync note:', err);
      }
    }
  };

  const dismissSubjectPublicationAlert = (alertId: string) => {
    setSubjectPublicationAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const triggerManualSubjectPushTest = async (): Promise<boolean> => {
    const studentGrade = currentAuthUser?.grade || (currentAuthUser as any)?.gradeLevel || 'Grade 6';
    const targetComp = competitions.find((c) => isGradeEligible(c.grade, studentGrade)) || competitions[0] || {
      id: 'comp-test-manual',
      title: 'Sri Lanka Junior Science & Mathematics Contest 2026',
      competitionType: 'Quiz',
      category: studentEnrolledSubjects[0] || 'Mathematics',
      grade: studentGrade,
    };
    const targetSubject = studentEnrolledSubjects[0] || 'Mathematics';
    playSubjectPublicationChime();
    const sent = sendSubjectPublicationBrowserPush(targetComp as any, targetSubject, language);
    setSubjectPublicationAlerts((prev) => [
      {
        id: `alert-test-${Date.now()}`,
        competitionId: targetComp.id,
        competitionTitle: targetComp.title,
        competitionType: targetComp.competitionType || 'Quiz',
        subject: targetSubject,
        grade: targetComp.grade || studentGrade,
        publishedAt: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
    return sent;
  };

  const logout = useCallback(async () => {
    await logoutUserSession();
    setCurrentAuthUser(null);
  }, []);

  // State mutations backed by Firebase Firestore
  const addAdmin = async (adminData: {
    name: string;
    email: string;
    username?: string;
    password?: string;
    staffId: string;
    department: string;
    phone?: string;
    status: 'active' | 'inactive';
    adminType?: 'general' | 'subject_admin';
    assignedSubject?: string;
    assignedSubjects?: string[];
    assignedGrades?: string[];
  }) => {
    try {
      const securePassword = adminData.password || `Admin@${Math.floor(100000 + Math.random() * 900000)}`;
      const normalizedUsername = (adminData.username || adminData.staffId || adminData.email.split('@')[0]).trim();
      const createdAdmin = await createAdminAccountBySuperAdmin({
        fullName: adminData.name,
        email: adminData.email,
        username: normalizedUsername,
        password: securePassword,
        phone: adminData.phone,
        department: adminData.department,
        staffId: adminData.staffId,
        adminType: adminData.adminType || 'general',
        assignedSubject: adminData.assignedSubject?.trim() || '',
        assignedSubjects: adminData.assignedSubjects || (adminData.assignedSubject ? [adminData.assignedSubject.trim()] : []),
        assignedGrades: adminData.assignedGrades || [],
      });

      const newAdmin: AdminUser = {
        id: createdAdmin.uid,
        name: createdAdmin.fullName,
        email: createdAdmin.email,
        username: normalizedUsername,
        initialPassword: securePassword,
        role: 'admin',
        department: createdAdmin.department || adminData.department,
        staffId: createdAdmin.staffId || adminData.staffId,
        adminType: createdAdmin.adminType as any || adminData.adminType || 'general',
        assignedSubject: createdAdmin.assignedSubject || adminData.assignedSubject || '',
        assignedSubjects: createdAdmin.assignedSubjects || adminData.assignedSubjects || [],
        assignedGrades: createdAdmin.assignedGrades || adminData.assignedGrades || [],
        assignedCompetitionsCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        status: createdAdmin.status,
        phone: createdAdmin.phone,
      };

      setAdmins((prev) => [newAdmin, ...prev.filter((a) => a.id !== newAdmin.id)]);

      const log: SystemAuditLog = {
        id: `log-${Date.now()}`,
        actorName: superAdminUser.name,
        actorRole: 'Super Admin',
        action: `Provisioned admin credentials and Firestore accreditation for ${newAdmin.name}`,
        target: `Staff ID: ${newAdmin.staffId}`,
        timestamp: 'Just now',
        ipAddress: '192.168.1.104',
      };
      setAuditLogs((prev) => [log, ...prev]);
    } catch (err: any) {
      console.error('Error creating admin:', err);
      throw err;
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!adminId) return;
    const target = admins.find((a) => a.id === adminId);
    setAdmins((prev) => prev.filter((a) => a.id !== adminId));
    try {
      await deleteAdminInFirestore(adminId);
    } catch (err) {
      console.error('Error deleting admin from Firestore:', err);
    }

    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: superAdminUser.name,
      actorRole: 'Super Admin',
      action: `Deleted administrator account and revoked access for ${target?.name || adminId}`,
      target: `Staff ID: ${target?.staffId || adminId}`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const toggleAdminStatus = async (adminId: string) => {
    const existing = admins.find((a) => a.id === adminId);
    if (!existing) return;

    try {
      const nextStatus = await toggleAdminStatusInFirestore(adminId, existing.status as any);
      setAdmins((prev) =>
        prev.map((adm) => (adm.id === adminId ? { ...adm, status: nextStatus } : adm))
      );
    } catch (err) {
      console.error('Error toggling admin status:', err);
      // Fallback local update if offline
      setAdmins((prev) =>
        prev.map((adm) => {
          if (adm.id === adminId) {
            const nextStatus = adm.status === 'active' ? 'inactive' : 'active';
            return { ...adm, status: nextStatus };
          }
          return adm;
        })
      );
    }
  };

  const updateAdminDetails = async (adminId: string, data: Partial<AdminUser>) => {
    try {
      await updateAdminDetailsInFirestore(adminId, {
        fullName: data.name,
        phone: data.phone,
        department: data.department,
        status: data.status as any,
        adminType: data.adminType as any,
        assignedSubject: data.assignedSubject,
        assignedSubjects: data.assignedSubjects,
        assignedGrades: data.assignedGrades,
      });
      setAdmins((prev) =>
        prev.map((adm) => (adm.id === adminId ? { ...adm, ...data } : adm))
      );
    } catch (err) {
      console.error('Error updating admin details:', err);
    }
  };

  const saveCompetition = async (compData: Partial<Competition> & { title: string }): Promise<string> => {
    const compId = compData.id || (compData as any).competitionId || `comp-${Date.now()}`;
    const now = new Date().toISOString();

    const existing = competitions.find((c) => c.id === compId || (c as any).competitionId === compId);
    const questions = compData.questions || existing?.questions || [];
    const questionsCount = compData.questionsCount ?? questions.length;
    const totalMarks = compData.totalMarks ?? questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const enrolledCount = compData.enrolledCount ?? existing?.enrolledCount ?? (compData.participants?.length || 0);

    const updatedComp: Competition = {
      id: compId,
      title: compData.title.trim(),
      description: compData.description !== undefined ? compData.description : (existing?.description || ''),
      competitionType: compData.competitionType || existing?.competitionType || 'Quiz',
      category: compData.category || existing?.category || 'Mathematics',
      grade: compData.grade || existing?.grade || 'Open',
      language: compData.language || existing?.language || 'English',
      duration: compData.duration !== undefined ? Number(compData.duration) : (existing?.duration ?? 60),
      entryType: compData.entryType || existing?.entryType || 'Free',
      entryFee: compData.entryFee !== undefined ? Number(compData.entryFee) : (existing?.entryFee ?? 0),
      prizesEnabled: compData.prizesEnabled !== undefined ? compData.prizesEnabled : (existing?.prizesEnabled ?? true),
      prizeDetails: compData.prizeDetails || existing?.prizeDetails || {
        firstPrize: '1st Prize Trophy & Cash Award',
        secondPrize: '2nd Prize Silver Medal',
        thirdPrize: '3rd Prize Bronze Medal',
        participationCertificate: 'Digital Certificate of Participation',
      },
      registrationStart: compData.registrationStart || existing?.registrationStart || now.split('T')[0],
      registrationEnd: compData.registrationEnd || existing?.registrationEnd || now.split('T')[0],
      competitionStart: compData.competitionStart || existing?.competitionStart || now.split('T')[0],
      competitionEnd: compData.competitionEnd || existing?.competitionEnd || now.split('T')[0],
      competitionStartTime: compData.competitionStartTime || existing?.competitionStartTime || '09:00',
      competitionEndTime: compData.competitionEndTime || existing?.competitionEndTime || '23:59',
      status: compData.status || existing?.status || 'Draft',
      questions,
      questionsCount,
      totalMarks,
      participants: compData.participants || existing?.participants || [],
      enrolledCount,
      code: compData.code || existing?.code || `HNC-${compId.slice(-4).toUpperCase()}`,
      leadAdminId: compData.leadAdminId || existing?.leadAdminId || (currentAuthUser?.uid || 'adm-system'),
      leadAdminName: compData.leadAdminName || existing?.leadAdminName || (currentAuthUser?.fullName || 'Academic Staff'),
      registrationDeadline: compData.registrationEnd || existing?.registrationDeadline || now.split('T')[0],
      startDate: compData.competitionStart || existing?.startDate || now.split('T')[0],
      endDate: compData.competitionEnd || existing?.endDate || now.split('T')[0],
      maxParticipants: compData.maxParticipants || existing?.maxParticipants || 500,
      eligibility: compData.eligibility || existing?.eligibility || 'Registered secondary school students',
      prizePool: compData.prizePool || existing?.prizePool || 'Academic Merit Medals & Honors',
      evaluationMode: compData.evaluationMode || existing?.evaluationMode || 'Automated',
      requireCameraVerification: compData.requireCameraVerification !== undefined ? compData.requireCameraVerification : existing?.requireCameraVerification,
      membershipRequired: compData.membershipRequired !== undefined ? compData.membershipRequired : existing?.membershipRequired,
      roundsCount: compData.roundsCount || existing?.roundsCount || 1,
      createdAt: existing?.createdAt || now,
      district: compData.district ?? existing?.district ?? '',
      province: compData.province ?? existing?.province ?? '',
      scope: compData.scope ?? existing?.scope ?? 'all_island',
      gamingMode: compData.gamingMode ?? existing?.gamingMode ?? 'standard',
      approvalStatus: compData.approvalStatus ?? existing?.approvalStatus ?? ((compData.status === 'Draft' || compData.status === 'Pending Approval') ? 'pending_approval' : 'approved'),
      approvalComment: compData.approvalComment ?? existing?.approvalComment ?? '',
      approvedBy: compData.approvedBy ?? existing?.approvedBy ?? '',
      approvedByName: compData.approvedByName ?? existing?.approvedByName ?? '',
      approvedAt: compData.approvedAt ?? existing?.approvedAt ?? '',
      isAiGenerated: compData.isAiGenerated ?? existing?.isAiGenerated ?? false,
      aiMode: compData.aiMode ?? existing?.aiMode ?? 'quiz',
    };

    setCompetitions((prev) => {
      const idx = prev.findIndex((c) => c.id === compId || (c as any).competitionId === compId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedComp;
        return next;
      }
      return [updatedComp, ...prev];
    });

    try {
      await saveCompetitionToFirestore({
        competitionId: compId,
        title: updatedComp.title,
        description: updatedComp.description,
        competitionType: updatedComp.competitionType,
        category: updatedComp.category,
        grade: updatedComp.grade,
        language: updatedComp.language,
        duration: updatedComp.duration,
        entryType: updatedComp.entryType,
        entryFee: updatedComp.entryFee,
        prizesEnabled: updatedComp.prizesEnabled,
        prizeDetails: updatedComp.prizeDetails,
        registrationStart: updatedComp.registrationStart,
        registrationEnd: updatedComp.registrationEnd,
        competitionStart: updatedComp.competitionStart,
        competitionEnd: updatedComp.competitionEnd,
        competitionStartTime: updatedComp.competitionStartTime,
        competitionEndTime: updatedComp.competitionEndTime,
        status: updatedComp.status,
        questions: updatedComp.questions,
        questionsCount: updatedComp.questionsCount,
        totalMarks: updatedComp.totalMarks,
        participants: updatedComp.participants,
        enrolledCount: updatedComp.enrolledCount,
        code: updatedComp.code,
        leadAdminId: updatedComp.leadAdminId,
        leadAdminName: updatedComp.leadAdminName,
        registrationDeadline: updatedComp.registrationDeadline,
        startDate: updatedComp.startDate,
        endDate: updatedComp.endDate,
        maxParticipants: updatedComp.maxParticipants,
        eligibility: updatedComp.eligibility,
        prizePool: updatedComp.prizePool,
        evaluationMode: updatedComp.evaluationMode,
        requireCameraVerification: updatedComp.requireCameraVerification,
        membershipRequired: updatedComp.membershipRequired,
        roundsCount: updatedComp.roundsCount,
        district: updatedComp.district,
        province: updatedComp.province,
        scope: updatedComp.scope,
        gamingMode: updatedComp.gamingMode,
        approvalStatus: updatedComp.approvalStatus,
        approvalComment: updatedComp.approvalComment,
        approvedBy: updatedComp.approvedBy,
        approvedByName: updatedComp.approvedByName,
        approvedAt: updatedComp.approvedAt,
        isAiGenerated: updatedComp.isAiGenerated,
        aiMode: updatedComp.aiMode,
      });
    } catch (err) {
      console.warn('Firestore competition sync notice:', err);
    }

    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: currentAuthUser?.fullName || 'Academic Staff',
      actorRole: currentPortal === 'super_admin' ? 'Super Admin' : 'Admin',
      action: `${existing ? 'Updated' : 'Created'} competition in Firestore: ${updatedComp.title} [${updatedComp.status}]`,
      target: `ID: ${compId} | Code: ${updatedComp.code}`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [log, ...prev]);

    return compId;
  };

  const deleteCompetition = async (competitionId: string) => {
    if (!competitionId) return;
    const comp = competitions.find((c) => c.id === competitionId || (c as any).competitionId === competitionId);
    setCompetitions((prev) => prev.filter((c) => c.id !== competitionId && (c as any).competitionId !== competitionId));
    try {
      await deleteCompetitionInFirestore(competitionId);
    } catch (err) {
      console.warn('Firestore delete competition notice:', err);
    }

    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: currentAuthUser?.fullName || 'Academic Staff',
      actorRole: currentPortal === 'super_admin' ? 'Super Admin' : 'Admin',
      action: `Deleted competition from Firestore: ${comp?.title || competitionId}`,
      target: `ID: ${competitionId}`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const addCompetition = async (compData: Omit<Competition, 'id' | 'enrolledCount'>) => {
    await saveCompetition({
      ...compData,
      title: compData.title,
    });
  };

  const updateCompetitionStatus = async (id: string, status: CompetitionStatus) => {
    if (!id) return;
    setCompetitions((prev) =>
      prev.map((c) => (c.id === id || (c as any).competitionId === id ? { ...c, status } : c))
    );
    try {
      await updateCompetitionStatusInFirestore(id, status);
    } catch (err) {
      console.warn('Firestore competition status sync note:', err);
    }
  };

  const approveCompetitionBySuperAdmin = async (competitionId: string, comment?: string) => {
    if (!competitionId) return;
    const now = new Date().toISOString();
    const adminName = currentAuthUser?.fullName || superAdminUser.name || 'Super Admin';
    const adminUid = currentAuthUser?.uid || 'super-admin-uid';

    let approvedTitle = '';
    setCompetitions((prev) =>
      prev.map((c) => {
        if (c.id === competitionId || (c as any).competitionId === competitionId) {
          approvedTitle = c.title;
          return {
            ...c,
            approvalStatus: 'approved',
            status: 'Registration Open',
            approvedBy: adminUid,
            approvedByName: adminName,
            approvedAt: now,
            approvalComment: comment || 'Approved by Super Admin',
          };
        }
        return c;
      })
    );

    try {
      await saveCompetitionToFirestore({
        competitionId,
        approvalStatus: 'approved',
        status: 'Registration Open',
        approvedBy: adminUid,
        approvedByName: adminName,
        approvedAt: now,
        approvalComment: comment || 'Approved by Super Admin',
      });
    } catch (err) {
      console.warn('Firestore competition approval sync note:', err);
    }

    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: adminName,
      actorRole: 'Super Admin',
      action: `Approved & Published competition to National Arena: ${approvedTitle || competitionId}`,
      target: `ID: ${competitionId}`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const rejectCompetitionBySuperAdmin = async (competitionId: string, reason: string) => {
    if (!competitionId) return;
    const adminName = currentAuthUser?.fullName || superAdminUser.name || 'Super Admin';
    let rejectedTitle = '';

    setCompetitions((prev) =>
      prev.map((c) => {
        if (c.id === competitionId || (c as any).competitionId === competitionId) {
          rejectedTitle = c.title;
          return {
            ...c,
            approvalStatus: 'rejected',
            status: 'Rejected',
            approvalComment: reason,
          };
        }
        return c;
      })
    );

    try {
      await saveCompetitionToFirestore({
        competitionId,
        approvalStatus: 'rejected',
        status: 'Rejected',
        approvalComment: reason,
      });
    } catch (err) {
      console.warn('Firestore competition rejection sync note:', err);
    }

    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: adminName,
      actorRole: 'Super Admin',
      action: `Rejected competition: ${rejectedTitle || competitionId} - Reason: ${reason}`,
      target: `ID: ${competitionId}`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const isStudentRegistered = (competitionId: string) => {
    if (studentRegistrations.includes(competitionId)) return true;
    const comp = competitions.find((c) => c.id === competitionId);
    if (!comp || !comp.participants) return false;
    const uid = currentAuthUser?.uid;
    const email = currentAuthUser?.email;
    return comp.participants.some(
      (p) => (uid && p.studentId === uid) || (email && p.email?.toLowerCase() === email.toLowerCase())
    );
  };

  const registerStudentForCompetition = (competitionId: string): boolean => {
    if (studentRegistrations.includes(competitionId)) {
      return false;
    }

    const comp = competitions.find((c) => c.id === competitionId);
    if (comp) {
      const sched = getCompetitionScheduleStatus(comp);
      if (sched.isRegistrationClosed) {
        alert(`⚠️ Registration deadline (${sched.formattedRegEnd}) for this competition has passed.`);
        return false;
      }
    }

    setStudentRegistrations((prev) => [...prev, competitionId]);

    const studentRecord = {
      studentId: currentAuthUser?.uid || `std-${Date.now()}`,
      studentName: currentAuthUser?.fullName || currentStudent?.name || 'Student',
      email: currentAuthUser?.email || currentStudent?.email || '',
      school: currentAuthUser?.school || currentStudent?.institution || '',
      grade: currentAuthUser?.grade || currentStudent?.gradeLevel || '',
      registeredAt: new Date().toISOString(),
    };

    setCompetitions((prev) =>
      prev.map((c) => {
        if (c.id === competitionId) {
          const nextParticipants = [...(c.participants || []), studentRecord];
          const nextCount = (c.enrolledCount || 0) + 1;
          saveCompetitionToFirestore({
            competitionId: c.id,
            status: c.status,
            registrationStart: c.registrationStart,
            registrationEnd: c.registrationEnd,
            competitionStart: c.competitionStart,
            competitionEnd: c.competitionEnd,
            competitionStartTime: c.competitionStartTime,
            competitionEndTime: c.competitionEndTime,
            participants: nextParticipants,
            enrolledCount: nextCount,
          }).catch((err) => console.warn('Sync participant note:', err));
          return {
            ...c,
            enrolledCount: nextCount,
            participants: nextParticipants,
          };
        }
        return c;
      })
    );
    return true;
  };

  const toggleResultPublish = async (resultId: string) => {
    const target = results.find((r) => r.id === resultId);
    if (!target) return;

    const nextStatus = target.publishStatus === 'published' ? 'draft' : 'published';
    setResults((prev) =>
      prev.map((r) =>
        r.id === resultId
          ? {
              ...r,
              publishStatus: nextStatus,
              publishedAt: nextStatus === 'published' ? new Date().toISOString().split('T')[0] : undefined,
            }
          : r
      )
    );

    try {
      await toggleResultPublishInFirestore(resultId, target.publishStatus);
    } catch (err) {
      console.warn('Result publish toggle sync notice:', err);
    }
  };

  const updateResultEvaluation = async (resultId: string, updates: Partial<CompetitionResult>) => {
    setResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, ...updates } : r))
    );
    const existing = results.find((r) => r.id === resultId);
    if (existing) {
      const merged: DbResult = {
        resultId,
        competitionId: existing.competitionId,
        studentId: existing.studentId,
        score: updates.score !== undefined ? updates.score : existing.score,
        totalMarks: updates.totalMarks !== undefined ? updates.totalMarks : (existing.totalMarks || existing.maxScore || 100),
        percentage: updates.percentage !== undefined ? updates.percentage : (existing.percentage || 0),
        rank: updates.rank !== undefined ? updates.rank : existing.rank,
        submittedAt: existing.submittedAt || new Date().toISOString(),
        publishStatus: updates.publishStatus || existing.publishStatus || 'published',
        award: updates.award || existing.award,
        prizeStatus: updates.prizeStatus || existing.prizeStatus,
        certificateId: existing.certificateId,
        studentName: existing.studentName,
        studentInstitution: existing.studentInstitution,
        competitionTitle: existing.competitionTitle,
      };
      try {
        await saveResultToFirestore(merged);
      } catch (err) {
        console.warn('Error persisting evaluated result to Firestore:', err);
      }
    }
  };

  const deleteResult = async (resultId: string) => {
    try {
      await deleteResultFromFirestore(resultId);
      setResults((prev) => prev.filter((r) => r.id !== resultId));
    } catch (err) {
      console.error('Failed to delete result:', err);
    }
  };

  const updateSettings = (newSettings: Partial<PlatformSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateStudentProfile = async (profile: Partial<StudentUser>) => {
    const targetUid = currentAuthUser?.uid || currentStudent.id || 'std_current';
    const newAvatar = profile.avatarUrl !== undefined ? profile.avatarUrl : (currentAuthUser?.avatarUrl || '');

    const updated: DbUser = currentAuthUser
      ? {
          ...currentAuthUser,
          fullName: profile.name || currentAuthUser.fullName,
          grade: profile.gradeLevel || currentAuthUser.grade,
          school: profile.institution || currentAuthUser.school,
          phone: profile.phone || currentAuthUser.phone,
          district: profile.district !== undefined ? profile.district : currentAuthUser.district,
          address: profile.address !== undefined ? profile.address : currentAuthUser.address,
          dateOfBirth: profile.dateOfBirth !== undefined ? profile.dateOfBirth : currentAuthUser.dateOfBirth,
          avatarUrl: newAvatar,
        }
      : {
          uid: targetUid,
          fullName: currentStudent.name || 'Student',
          email: currentStudent.email || '',
          role: 'student',
          status: 'active',
          avatarUrl: newAvatar,
          studentId: currentStudent.studentId,
          createdAt: new Date().toISOString(),
        };

    // Immediate reactive local state updates
    setCurrentAuthUser(updated);
    saveActiveUser(updated);

    // Update students list state
    setStudents((prev) =>
      prev.map((s) => (s.id === targetUid || s.studentId === currentStudent.studentId ? { ...s, avatarUrl: newAvatar } : s))
    );

    // Resilient Firestore persistence
    if (targetUid) {
      const firestorePayload: any = { avatarUrl: newAvatar };
      if (profile.name) firestorePayload.fullName = profile.name;
      if (profile.gradeLevel) firestorePayload.grade = profile.gradeLevel;
      if (profile.institution) firestorePayload.school = profile.institution;
      if (profile.phone !== undefined) firestorePayload.phone = profile.phone;
      if (profile.district !== undefined) firestorePayload.district = profile.district;
      if (profile.address !== undefined) firestorePayload.address = profile.address;
      if (profile.dateOfBirth !== undefined) firestorePayload.dateOfBirth = profile.dateOfBirth;
      if (profile.bio !== undefined) firestorePayload.bio = profile.bio;
      if (profile.enrolledSubjects !== undefined) firestorePayload.enrolledSubjects = profile.enrolledSubjects;

      try {
        await setDoc(doc(db, 'users', targetUid), firestorePayload, { merge: true });
      } catch (e) {
        console.warn('User doc profile sync note:', e);
      }
      try {
        await setDoc(doc(db, 'students', targetUid), firestorePayload, { merge: true });
      } catch (e) {
        console.warn('Student doc profile sync note:', e);
      }
      if (currentStudent.studentId && currentStudent.studentId !== targetUid) {
        try {
          await setDoc(doc(db, 'students', currentStudent.studentId), firestorePayload, { merge: true });
        } catch (e) {
          console.warn('Student ID doc profile sync note:', e);
        }
      }
    }
  };

  const updateAdminProfile = (profile: Partial<AdminUser>) => {
    // updates local admin view
    console.log('Admin profile updated');
  };

  const deleteStudentAccount = async (studentUid: string) => {
    try {
      await deleteStudentAccountFromFirestore(studentUid);
      setStudents((prev) => prev.filter((s) => s.id !== studentUid));
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  const updateStudentPassword = async (studentUid: string, newPassword: string) => {
    try {
      await updateStudentPasswordInFirestore(studentUid, newPassword);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentUid ? { ...s, initialPassword: newPassword } : s))
      );
    } catch (err) {
      console.error('Failed to update student password:', err);
      throw err;
    }
  };

  const updateStudentByAdmin = async (
    studentUid: string,
    updatedData: {
      fullName?: string;
      studentId?: string;
      username?: string;
      email?: string;
      phone?: string;
      grade?: string;
      school?: string;
      district?: string;
      address?: string;
      dateOfBirth?: string;
      guardianName?: string;
      status?: 'active' | 'inactive' | 'suspended';
      referralPoints?: number;
      referralCode?: string;
      newPassword?: string;
      oldStudentId?: string;
    }
  ) => {
    try {
      await updateStudentDetailsInFirestore(studentUid, updatedData);

      setStudents((prev) =>
        prev.map((s) => {
          if (
            s.id === studentUid ||
            s.studentId === studentUid ||
            (updatedData.oldStudentId && s.studentId === updatedData.oldStudentId)
          ) {
            const nextName = updatedData.fullName?.trim() || s.name;
            const nextSchool = updatedData.school?.trim() || s.institution;
            const nextGrade = updatedData.grade?.trim() || s.gradeLevel;
            return {
              ...s,
              name: nextName,
              fullName: nextName,
              studentId: updatedData.studentId?.trim() || s.studentId,
              username: updatedData.username !== undefined ? updatedData.username.trim().toLowerCase() : s.username,
              email: updatedData.email !== undefined ? updatedData.email.trim().toLowerCase() : s.email,
              phone: updatedData.phone !== undefined ? updatedData.phone.trim() : s.phone,
              institution: nextSchool,
              school: nextSchool,
              gradeLevel: nextGrade,
              grade: nextGrade,
              district: updatedData.district !== undefined ? updatedData.district.trim() : s.district,
              address: updatedData.address !== undefined ? updatedData.address.trim() : s.address,
              dateOfBirth: updatedData.dateOfBirth !== undefined ? updatedData.dateOfBirth.trim() : s.dateOfBirth,
              guardianName: updatedData.guardianName !== undefined ? updatedData.guardianName.trim() : s.guardianName,
              status: (updatedData.status as any) || s.status,
              referralPoints: updatedData.referralPoints !== undefined ? updatedData.referralPoints : s.referralPoints,
              referralCode: updatedData.referralCode !== undefined ? updatedData.referralCode.trim().toUpperCase() : s.referralCode,
              initialPassword: updatedData.newPassword?.trim() || s.initialPassword,
            };
          }
          return s;
        })
      );

      if (updatedData.fullName || updatedData.school) {
        setResults((prev) =>
          prev.map((r) => {
            if (
              r.studentId === studentUid ||
              (updatedData.oldStudentId && r.studentId === updatedData.oldStudentId) ||
              (updatedData.studentId && r.studentId === updatedData.studentId)
            ) {
              return {
                ...r,
                studentName: updatedData.fullName?.trim() || r.studentName,
                studentInstitution: updatedData.school?.trim() || r.studentInstitution,
                studentId: updatedData.studentId?.trim() || r.studentId,
              };
            }
            return r;
          })
        );
      }

      if (currentAuthUser && currentAuthUser.uid === studentUid) {
        const updatedAuth: DbUser = {
          ...currentAuthUser,
          fullName: updatedData.fullName?.trim() || currentAuthUser.fullName,
          studentId: updatedData.studentId?.trim() || currentAuthUser.studentId,
          username: updatedData.username !== undefined ? updatedData.username.trim().toLowerCase() : currentAuthUser.username,
          email: updatedData.email !== undefined ? updatedData.email.trim().toLowerCase() : currentAuthUser.email,
          phone: updatedData.phone !== undefined ? updatedData.phone.trim() : currentAuthUser.phone,
          school: updatedData.school?.trim() || currentAuthUser.school,
          grade: updatedData.grade?.trim() || currentAuthUser.grade,
          district: updatedData.district !== undefined ? updatedData.district.trim() : currentAuthUser.district,
          address: updatedData.address !== undefined ? updatedData.address.trim() : currentAuthUser.address,
          dateOfBirth: updatedData.dateOfBirth !== undefined ? updatedData.dateOfBirth.trim() : currentAuthUser.dateOfBirth,
          referralPoints: updatedData.referralPoints !== undefined ? updatedData.referralPoints : currentAuthUser.referralPoints,
          referralCode: updatedData.referralCode !== undefined ? updatedData.referralCode.trim().toUpperCase() : currentAuthUser.referralCode,
          status: (updatedData.status as any) || currentAuthUser.status,
        };
        setCurrentAuthUser(updatedAuth);
        saveActiveUser(updatedAuth);
      }
    } catch (err) {
      console.error('Failed to update student by admin:', err);
      throw err;
    }
  };

  // -------------------------------------------------------------
  // Phase 4: Student Exam & Competition Attempt Handlers
  // -------------------------------------------------------------

  const getStudentAttempt = (competitionId: string): DbAttempt | undefined => {
    const studentUid = currentAuthUser?.uid || currentStudent.id;
    return studentAttempts.find(
      (a) => a.competitionId === competitionId && (a.studentId === studentUid || a.studentId === currentStudent.id)
    );
  };

  const hasStudentSubmitted = (competitionId: string): boolean => {
    const attempt = getStudentAttempt(competitionId);
    return !!attempt && (attempt.status === 'submitted' || attempt.status === 'completed' || attempt.status === 'timeout');
  };

  const openCompetitionDetails = (comp: Competition) => {
    setActiveExamComp(comp);
    setExamSessionStage('details');
  };

  const openCompetitionInstructions = (comp: Competition) => {
    // Auto register if not already
    if (!isStudentRegistered(comp.id)) {
      registerStudentForCompetition(comp.id);
    }
    setActiveExamComp(comp);
    setExamSessionStage('instructions');
  };

  const startCompetitionAttempt = async (comp: Competition): Promise<DbAttempt> => {
    const studentUid = currentAuthUser?.uid || currentStudent.id || `std-${Date.now()}`;
    const studentName = currentAuthUser?.fullName || currentStudent.name || 'Candidate Student';

    // Verify if an attempt already exists
    const existing = getStudentAttempt(comp.id);
    if (existing) {
      setActiveExamAttempt(existing);
      return existing;
    }

    const questions = getCompetitionQuestions(comp);
    const totalMarks = comp.totalMarks || questions.reduce((sum, q) => sum + (q.marks || 0), 0) || 100;

    const newAttempt: DbAttempt = {
      attemptId: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      competitionId: comp.id,
      competitionTitle: comp.title,
      studentId: studentUid,
      studentName: studentName,
      answers: {},
      startedAt: new Date().toISOString(),
      status: 'in-progress',
      score: 0,
      totalMarks: totalMarks,
      duration: comp.duration || 60,
    };

    setStudentAttempts((prev) => [...prev, newAttempt]);
    setActiveExamAttempt(newAttempt);

    try {
      await saveAttemptToFirestore(newAttempt);
    } catch (err) {
      console.warn('Initial attempt Firestore save note:', err);
    }

    return newAttempt;
  };

  const startActiveExam = async (comp: Competition) => {
    if (hasStudentSubmitted(comp.id)) {
      console.warn('Student has already submitted this competition. Multiple attempts prohibited.');
      return;
    }

    // Strict Schedule & Time Window Access Control:
    const sched = getCompetitionScheduleStatus(comp);
    if (sched.isUpcoming) {
      alert(`⚠️ This exam has not started yet! Opens automatically on ${sched.formattedStart}.`);
      return;
    }
    if (sched.isEnded) {
      alert('⚠️ This competition examination window has ended.');
      return;
    }

    // Registration Deadline Enforcement:
    const isRegistered = isStudentRegistered(comp.id);
    if (!isRegistered && sched.isRegistrationClosed) {
      alert(`⚠️ Registration closed on ${sched.formattedRegEnd}. You cannot join this exam now.`);
      return;
    }

    // Defense-in-depth: Block unauthorized exam access if membership is required and inactive
    if (comp.membershipRequired && !isMembershipActiveForStudent(currentAuthUser?.uid || currentStudent.id)) {
      console.warn('Membership is required and not active for this student.');
      return;
    }
    const attempt = await startCompetitionAttempt(comp);
    setActiveExamComp(comp);
    setActiveExamAttempt(attempt);
    setExamSessionStage('taking');
  };

  const saveAttemptAnswers = async (attemptId: string, answers: Record<string, string>) => {
    setStudentAttempts((prev) =>
      prev.map((a) => (a.attemptId === attemptId ? { ...a, answers } : a))
    );
    if (activeExamAttempt && activeExamAttempt.attemptId === attemptId) {
      setActiveExamAttempt((prev) => (prev ? { ...prev, answers } : null));
    }
    try {
      const current = studentAttempts.find((a) => a.attemptId === attemptId) || activeExamAttempt;
      if (current) {
        await saveAttemptToFirestore({ ...current, answers });
      }
    } catch (err) {
      console.warn('Attempt auto-save note:', err);
    }
  };

  const submitCompetitionAttempt = async (
    attemptId: string,
    competitionId: string,
    answers: Record<string, string>,
    isTimeout: boolean = false
  ): Promise<{ score: number; totalMarks: number; attempt: DbAttempt }> => {
    const comp = competitions.find((c) => c.id === competitionId) || activeExamComp;
    const questions = comp ? getCompetitionQuestions(comp) : [];
    
    let calculatedScore = 0;
    let totalPossibleMarks = 0;

    questions.forEach((q) => {
      const marks = q.marks || 10;
      totalPossibleMarks += marks;
      const studentAns = (answers[q.id] || '').trim();
      const correctAns = (q.correctAnswer || '').trim();

      if (q.type === 'short_answer') {
        if (studentAns.toLowerCase() === correctAns.toLowerCase()) {
          calculatedScore += marks;
        }
      } else {
        const normStudent = studentAns.toLowerCase();
        const normCorrect = correctAns.toLowerCase();
        if (studentAns === correctAns || (studentAns && correctAns && normStudent === normCorrect)) {
          calculatedScore += marks;
        }
      }
    });

    if (totalPossibleMarks === 0) {
      totalPossibleMarks = comp?.totalMarks || 100;
    }

    const submissionTime = new Date().toISOString();
    const finalStatus = isTimeout ? 'timeout' : 'submitted';

    const current = studentAttempts.find((a) => a.attemptId === attemptId) || activeExamAttempt;
    const updatedAttempt: DbAttempt = {
      ...(current || {
        attemptId,
        competitionId,
        studentId: currentAuthUser?.uid || currentStudent.id,
      }),
      startedAt: current?.startedAt || new Date().toISOString(),
      answers,
      submittedAt: submissionTime,
      status: finalStatus,
      score: calculatedScore,
      totalMarks: totalPossibleMarks,
      competitionTitle: comp?.title || current?.competitionTitle,
      studentName: currentAuthUser?.fullName || currentStudent.name,
      duration: comp?.duration || 60,
    };

    setStudentAttempts((prev) => {
      const exists = prev.some((a) => a.attemptId === attemptId);
      if (exists) {
        return prev.map((a) => (a.attemptId === attemptId ? updatedAttempt : a));
      }
      return [...prev, updatedAttempt];
    });
    setActiveExamAttempt(updatedAttempt);
    setExamSessionStage('submitted');

    // Persist to Firestore attempts collection
    try {
      await saveAttemptToFirestore(updatedAttempt);
    } catch (err) {
      console.warn('Firestore attempt submission note:', err);
    }

    // Auto-record to Results collection
    const percentage = Math.round((calculatedScore / totalPossibleMarks) * 100);
    const awardType =
      percentage >= 85
        ? 'Gold Medal'
        : percentage >= 65
        ? 'Silver Medal'
        : percentage >= 45
        ? 'Bronze Medal'
        : 'Participation';

    // Rank students based on:
    // 1. Higher score
    // 2. If scores are equal, earlier valid submission time
    const existingCompResults = results.filter(
      (r) => r.competitionId === competitionId && r.studentId !== (currentAuthUser?.uid || currentStudent.id)
    );
    const allCompCandidates = [
      ...existingCompResults.map((r) => ({
        id: r.studentId,
        score: r.score,
        time: r.submittedAt || r.publishedAt ? new Date(r.submittedAt || r.publishedAt || '').getTime() : 0,
      })),
      {
        id: currentAuthUser?.uid || currentStudent.id,
        score: calculatedScore,
        time: new Date(submissionTime).getTime(),
      },
    ];

    allCompCandidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time - b.time;
    });

    const studentRankIndex = allCompCandidates.findIndex(
      (c) => c.id === (currentAuthUser?.uid || currentStudent.id)
    );
    const computedRank = studentRankIndex !== -1 ? studentRankIndex + 1 : 1;

    // Competition prizes configured by Admin:
    // Support:
    // - 1st Prize
    // - 2nd Prize
    // - 3rd Prize
    // - Participation Certificate / Gift
    // After results are finalized:
    // - Rank 1 → 1st Prize
    // - Rank 2 → 2nd Prize
    // - Rank 3 → 3rd Prize
    let calculatedPrizeStatus: string = comp?.prizeDetails?.participationCertificate || 'Participation Certificate';
    if (computedRank === 1) {
      calculatedPrizeStatus = comp?.prizeDetails?.firstPrize || '1st Prize (Gold Trophy)';
    } else if (computedRank === 2) {
      calculatedPrizeStatus = comp?.prizeDetails?.secondPrize || '2nd Prize (Silver Medal)';
    } else if (computedRank === 3) {
      calculatedPrizeStatus = comp?.prizeDetails?.thirdPrize || '3rd Prize (Bronze Medal)';
    }

    const newResult: DbResult = {
      resultId: `res-${attemptId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
      competitionId,
      competitionTitle: comp?.title || 'Academic Competition',
      studentId: currentAuthUser?.uid || currentStudent.id,
      studentName: currentAuthUser?.fullName || currentStudent.name,
      studentInstitution: currentStudent.institution,
      score: calculatedScore,
      totalMarks: totalPossibleMarks,
      percentage,
      rank: computedRank,
      submittedAt: submissionTime,
      publishStatus: 'published',
      award: awardType,
      prizeStatus: calculatedPrizeStatus,
      certificateId: `HNC-EXAM-${Date.now().toString().slice(-6)}`,
    };

    setResults((prev) => {
      const converted: CompetitionResult = {
        id: newResult.resultId,
        competitionId: newResult.competitionId,
        competitionTitle: newResult.competitionTitle || 'Academic Competition',
        studentId: newResult.studentId,
        studentName: newResult.studentName || 'Candidate',
        studentInstitution: newResult.studentInstitution || 'Participating Institution',
        score: newResult.score,
        maxScore: newResult.totalMarks,
        totalMarks: newResult.totalMarks,
        percentage: newResult.percentage,
        percentile: newResult.percentage,
        rank: newResult.rank,
        submittedAt: newResult.submittedAt,
        publishStatus: (newResult.publishStatus as any) || 'published',
        award: (newResult.award as any) || 'Participation',
        prizeStatus: newResult.prizeStatus,
        certificateId: newResult.certificateId || `CERT-${newResult.resultId}`,
      };
      const exists = prev.some((r) => r.id === newResult.resultId);
      if (exists) {
        return prev.map((r) => (r.id === newResult.resultId ? converted : r));
      }
      return [converted, ...prev];
    });

    try {
      await saveResultToFirestore(newResult);
    } catch (err) {
      console.warn('Firestore result recording note:', err);
    }

    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: currentAuthUser?.fullName || currentStudent.name,
      actorRole: 'Student Candidate',
      action: `Submitted exam for: ${comp?.title || competitionId} (${calculatedScore}/${totalPossibleMarks} Marks) [${finalStatus}]`,
      target: `Attempt: ${attemptId}`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.108',
    };
    setAuditLogs((prev) => [log, ...prev]);

    return { score: calculatedScore, totalMarks: totalPossibleMarks, attempt: updatedAttempt };
  };

  // Phase 5: Payment and Verification methods
  const processCompetitionPayment = async (
    competitionId: string,
    amount: number,
    paymentMethod: string = 'Sri Lankan Payment Gateway (IPG)',
    extraDetails?: {
      transactionReference?: string;
      slipUrl?: string;
      slipName?: string;
      bankName?: string;
      branchName?: string;
      walletNumber?: string;
      paymentNote?: string;
    }
  ): Promise<DbPayment> => {
    const comp = competitions.find((c) => c.id === competitionId);
    const studentUid = currentAuthUser?.uid || currentStudent.id;
    const studentName = currentAuthUser?.fullName || currentStudent.name;

    const paymentRecord: DbPayment = {
      paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      studentId: studentUid,
      competitionId,
      amount,
      status: 'completed',
      createdAt: new Date().toISOString(),
      studentName,
      competitionTitle: comp?.title || 'Academic Competition',
      currency: 'LKR',
      paymentMethod,
      transactionReference: extraDetails?.transactionReference || `TXN-LKR-${Date.now().toString().slice(-6)}`,
      slipUrl: extraDetails?.slipUrl,
      slipName: extraDetails?.slipName,
      bankName: extraDetails?.bankName,
      branchName: extraDetails?.branchName,
      walletNumber: extraDetails?.walletNumber,
      paymentNote: extraDetails?.paymentNote,
    };

    setPayments((prev) => [paymentRecord, ...prev.filter((p) => p.paymentId !== paymentRecord.paymentId)]);

    if (!studentRegistrations.includes(competitionId)) {
      setStudentRegistrations((prev) => [...prev, competitionId]);
    }

    try {
      await savePaymentToFirestore(paymentRecord);
    } catch (err) {
      console.warn('Firestore payment save error:', err);
    }

    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: studentName,
      actorRole: 'Student Candidate',
      action: `Processed entry fee payment: LKR ${amount.toLocaleString()} for ${comp?.title || competitionId} [Completed]`,
      target: `Payment: ${paymentRecord.paymentId}`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.108',
    };
    setAuditLogs((prev) => [log, ...prev]);

    return paymentRecord;
  };

  const isCompetitionPaid = (competitionId: string): boolean => {
    const comp = competitions.find((c) => c.id === competitionId);
    if (!comp) return false;
    // Free competitions do not require payment
    if (comp.entryType === 'Free' || !comp.entryFee || comp.entryFee === 0) {
      return true;
    }
    const studentUid = currentAuthUser?.uid || currentStudent.id;
    return payments.some(
      (p) => p.competitionId === competitionId && p.studentId === studentUid && p.status === 'completed'
    );
  };

  const updatePaymentStatus = async (
    paymentId: string,
    status: 'completed' | 'pending' | 'rejected',
    notes?: string
  ): Promise<void> => {
    setPayments((prev) =>
      prev.map((p) =>
        p.paymentId === paymentId ? { ...p, status, paymentNote: notes || p.paymentNote } : p
      )
    );
    try {
      await updatePaymentStatusInFirestore(paymentId, status, notes);
    } catch (err) {
      console.warn('Firestore payment status update error:', err);
    }

    const targetPayment = payments.find((p) => p.paymentId === paymentId);
    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: currentAuthUser?.fullName || 'Academic Officer',
      actorRole: currentAuthUser?.role === 'super_admin' ? 'Super Admin' : 'Academic Admin',
      action: `Payment verification: ${status.toUpperCase()} for ${targetPayment?.competitionTitle || 'Competition'}`,
      target: `Payment ID: ${paymentId} (Candidate: ${targetPayment?.studentName || 'Student'})`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.108',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const saveExamVerificationPhoto = async (
    competitionId: string,
    photoUrl: string,
    videoUrl?: string
  ): Promise<DbVerificationPhoto> => {
    const comp = competitions.find((c) => c.id === competitionId);
    const studentUid = currentAuthUser?.uid || currentStudent.id;
    const studentName = currentAuthUser?.fullName || currentStudent.name;

    const photoRecord: DbVerificationPhoto = {
      verificationId: `VER-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      studentId: studentUid,
      competitionId,
      photoUrl,
      videoUrl: videoUrl || '',
      verificationType: videoUrl ? 'both' : 'photo',
      createdAt: new Date().toISOString(),
      studentName,
      competitionTitle: comp?.title || 'Academic Exam',
    };

    setVerificationPhotos((prev) => [photoRecord, ...prev.filter((p) => p.verificationId !== photoRecord.verificationId)]);

    try {
      await saveVerificationPhotoToFirestore(photoRecord);
    } catch (err) {
      console.warn('Firestore verification photo save error:', err);
    }

    const log: SystemAuditLog = {
      id: `log-${Date.now()}`,
      actorName: studentName,
      actorRole: 'Student Candidate',
      action: `Completed exam photo verification for ${comp?.title || competitionId}`,
      target: `Verification: ${photoRecord.verificationId}`,
      timestamp: 'Just now',
      ipAddress: '192.168.1.108',
    };
    setAuditLogs((prev) => [log, ...prev]);

    return photoRecord;
  };

  const isExamVerified = (competitionId: string): boolean => {
    const comp = competitions.find((c) => c.id === competitionId);
    if (!comp) return true;
    
    // Check if camera verification is required (explicit toggle or legacy Exam default)
    const isRequired = typeof comp.requireCameraVerification === 'boolean'
      ? comp.requireCameraVerification
      : comp.competitionType === 'Exam';

    if (!isRequired) {
      return true;
    }
    const studentUid = currentAuthUser?.uid || currentStudent.id;
    return verificationPhotos.some(
      (v) => v.competitionId === competitionId && v.studentId === studentUid
    );
  };

  const getStudentVerificationPhoto = (competitionId: string): DbVerificationPhoto | undefined => {
    const studentUid = currentAuthUser?.uid || currentStudent.id;
    return verificationPhotos.find(
      (v) => v.competitionId === competitionId && v.studentId === studentUid
    );
  };

  const getCompetitionRankings = (competitionId: string) => {
    const comp = competitions.find((c) => c.id === competitionId);
    const compResults = results.filter((r) => r.competitionId === competitionId);

    // Sort: 1. Higher score, 2. If equal score, earlier valid submission time
    const sorted = [...compResults].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const timeA = a.submittedAt || a.publishedAt ? new Date(a.submittedAt || a.publishedAt || '').getTime() : 0;
      const timeB = b.submittedAt || b.publishedAt ? new Date(b.submittedAt || b.publishedAt || '').getTime() : 0;
      return timeA - timeB;
    });

    return sorted.map((res, index) => {
      const computedRank = index + 1;
      let prizeStatus = res.prizeStatus;
      if (!prizeStatus) {
        if (computedRank === 1) {
          prizeStatus = comp?.prizeDetails?.firstPrize || '1st Prize (Gold Trophy)';
        } else if (computedRank === 2) {
          prizeStatus = comp?.prizeDetails?.secondPrize || '2nd Prize (Silver Medal)';
        } else if (computedRank === 3) {
          prizeStatus = comp?.prizeDetails?.thirdPrize || '3rd Prize (Bronze Medal)';
        } else {
          prizeStatus = comp?.prizeDetails?.participationCertificate || 'Participation Certificate';
        }
      }
      return {
        ...res,
        computedRank,
        prizeStatus,
      };
    });
  };

  const exitActiveExam = () => {
    setActiveExamComp(null);
    setActiveExamAttempt(null);
    setExamSessionStage(null);
  };

  const awardSharePoints = async (): Promise<{ newPoints: number; newShares: number }> => {
    if (!currentAuthUser?.uid) return { newPoints: 0, newShares: 0 };
    const res = await awardSharePointsInFirestore(currentAuthUser.uid);
    setCurrentAuthUser((prev) => {
      if (!prev) return null;
      const updated: DbUser = {
        ...prev,
        referralPoints: res.newPoints,
        sharesCount: res.newShares,
      };
      saveActiveUser(updated);
      return updated;
    });
    return res;
  };

  const redeemStudentPerk = async (perkId: string, pointsCost: number): Promise<boolean> => {
    if (!currentAuthUser?.uid) return false;
    const res = await redeemPerkInFirestore(currentAuthUser.uid, perkId, pointsCost);
    if (res.success) {
      setCurrentAuthUser((prev) => {
        if (!prev) return null;
        const updated: DbUser = {
          ...prev,
          referralPoints: res.newPoints,
          redeemedPerks: [...(prev.redeemedPerks || []), perkId],
        };
        saveActiveUser(updated);
        return updated;
      });
      return true;
    }
    return false;
  };

  const createAnnouncement = async (data: Omit<DbAnnouncement, 'id'>): Promise<string> => {
    return await saveAnnouncementToFirestore(data);
  };

  const updateAnnouncement = async (id: string, updates: Partial<DbAnnouncement>): Promise<void> => {
    await updateAnnouncementInFirestore(id, updates);
  };

  const deleteAnnouncement = async (id: string): Promise<void> => {
    await deleteAnnouncementFromFirestore(id);
  };

  const purgeDemoAnnouncements = async (): Promise<number> => {
    return await purgeDemoAnnouncementsFromFirestore();
  };

  const seedOfficialAnnouncements = async (): Promise<void> => {
    await seedOfficialAnnouncementsToFirestore();
  };

  const adjustStudentPoints = async (
    studentUid: string,
    pointsDelta: number,
    reason?: string
  ): Promise<number> => {
    // Determine local date string (YYYY-MM-DD)
    const localNow = new Date();
    const todayDateStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
    const isSpin = Boolean(reason?.toLowerCase().includes('spin'));

    const isTargetCurrentUser =
      !studentUid ||
      studentUid === 'guest' ||
      currentAuthUser?.uid === studentUid ||
      currentStudent?.id === studentUid ||
      currentAuthUser?.studentId === studentUid ||
      currentStudent?.studentId === studentUid;

    let optimisticPoints = 0;
    if (isTargetCurrentUser && currentAuthUser) {
      optimisticPoints = Math.max(0, (currentAuthUser.referralPoints || 0) + pointsDelta);
      setCurrentAuthUser((prev) => {
        if (!prev) return null;
        const updated: DbUser = {
          ...prev,
          referralPoints: optimisticPoints,
          ...(isSpin ? { lastSpinDate: todayDateStr } : {}),
        };
        saveActiveUser(updated);
        return updated;
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.id === currentAuthUser.uid || s.studentId === currentAuthUser.studentId
            ? { ...s, referralPoints: optimisticPoints, ...(isSpin ? { lastSpinDate: todayDateStr } : {}) }
            : s
        )
      );
    }

    const targetUid = currentAuthUser?.uid || studentUid || 'guest';

    if (typeof window !== 'undefined') {
      localStorage.setItem(`hnc_student_points_${targetUid}`, String(optimisticPoints));
      localStorage.setItem('hnc_student_points_active', String(optimisticPoints));
      if (isSpin) {
        localStorage.setItem(`hnc_spin_date_${targetUid}`, todayDateStr);
        localStorage.setItem('hnc_spin_date_last', todayDateStr);
        localStorage.setItem('hnc_spin_last_timestamp', String(Date.now()));
      }
    }

    const res = await adjustStudentPointsInFirestore(
      targetUid,
      pointsDelta,
      reason,
      isSpin ? { lastSpinDate: todayDateStr } : undefined
    );

    const finalPoints = res.success ? res.newPoints : (optimisticPoints || pointsDelta);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`hnc_student_points_${targetUid}`, String(finalPoints));
      localStorage.setItem('hnc_student_points_active', String(finalPoints));
      if (isSpin) {
        localStorage.setItem(`hnc_spin_date_${targetUid}`, todayDateStr);
        localStorage.setItem('hnc_spin_date_last', todayDateStr);
        localStorage.setItem('hnc_spin_last_timestamp', String(Date.now()));
      }
      try {
        window.dispatchEvent(new CustomEvent('hnc_points_updated', { detail: { points: finalPoints } }));
      } catch {}
    }

    if (isTargetCurrentUser && currentAuthUser) {
      setCurrentAuthUser((prev) => {
        if (!prev) return null;
        const updated: DbUser = {
          ...prev,
          referralPoints: finalPoints,
          ...(isSpin ? { lastSpinDate: todayDateStr } : {}),
        };
        saveActiveUser(updated);
        return updated;
      });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === currentAuthUser.uid || s.studentId === currentAuthUser.studentId
            ? { ...s, referralPoints: finalPoints, ...(isSpin ? { lastSpinDate: todayDateStr } : {}) }
            : s
        )
      );
    }

    return finalPoints;
  };

  // Phase 07: Membership helper methods
  const refreshMembershipData = useCallback(async () => {
    try {
      const userRole = currentAuthUser?.role;
      const targetUid = currentAuthUser?.uid || currentStudent?.id;

      if (!targetUid) return;

      if (userRole === 'student') {
        // Students only load their own membership and the platform settings (Item 13)
        const [myMem, sets] = await Promise.all([
          getMembershipInFirestore(targetUid),
          getMembershipSettingsInFirestore(),
        ]);
        if (myMem) {
          setMemberships([myMem]);
        } else {
          setMemberships([]);
        }
        setMembershipSettings(sets);
      } else if (userRole === 'super_admin' || userRole === 'admin') {
        // Super Admin & Admin load all memberships and payments for institutional oversight
        const [mems, pays, sets] = await Promise.all([
          getAllMembershipsInFirestore(),
          getAllMembershipPaymentsInFirestore(),
          getMembershipSettingsInFirestore(),
        ]);
        setMemberships(mems);
        setMembershipPayments(pays);
        setMembershipSettings(sets);
      }
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (err?.code === 'unavailable' || msg.includes('offline')) {
        console.warn('Membership data sync deferred: client is offline or reconnecting.');
      } else {
        console.warn('Notice refreshing membership data:', err?.message || err);
      }
    }
  }, [currentAuthUser?.role, currentAuthUser?.uid, currentStudent?.id]);

  useEffect(() => {
    if (currentAuthUser) {
      refreshMembershipData();
    }
  }, [currentAuthUser, refreshMembershipData]);

  const studentUid = currentAuthUser?.uid || currentStudent.id;

  const currentMembership = useMemo(() => {
    const raw = memberships.find((m) => m.studentId === studentUid);
    if (!raw) return null;

    const now = new Date();
    if (raw.expiryDate) {
      const exp = new Date(raw.expiryDate);
      if (now.getTime() > exp.getTime()) {
        return {
          ...raw,
          status: 'expired' as MembershipStatus,
          paymentStatus: 'expired' as const,
        };
      }
      const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3 && raw.status === 'active') {
        return {
          ...raw,
          status: 'expiring_soon' as MembershipStatus,
        };
      }
    }
    return raw;
  }, [memberships, studentUid]);

  const isMembershipActiveForStudent = useCallback(
    (studentIdToCheck?: string): boolean => {
      if (!membershipSettings.enabled) return true;
      const targetId = studentIdToCheck || currentAuthUser?.uid || currentStudent.id;
      const mem = memberships.find((m) => m.studentId === targetId);
      if (!mem) return false;

      if (!mem.expiryDate) return false;
      const now = new Date();
      const exp = new Date(mem.expiryDate);
      if (now.getTime() > exp.getTime()) return false;

      return mem.status === 'active' || mem.status === 'expiring_soon';
    },
    [memberships, membershipSettings.enabled, currentAuthUser?.uid, currentStudent.id]
  );

  const submitMembershipPayment = async (paymentData: {
    amount: number;
    paymentReference: string;
    paymentMethod?: string;
    slipUrl?: string;
    slipName?: string;
    membershipPeriodDays?: number;
    notes?: string;
  }): Promise<DbMembershipPayment> => {
    const sId = currentAuthUser?.uid || currentStudent.id;
    const sName = currentAuthUser?.fullName || currentStudent.name;
    const sEmail = currentAuthUser?.email || currentStudent.email;

    // Prevent duplicate active or pending memberships (Item 12)
    const existing = memberships.find((m) => m.studentId === sId);
    if (existing?.status === 'pending') {
      throw new Error('A membership payment request is already pending review by the Super Admin.');
    }
    if (existing?.status === 'active' && existing.expiryDate && new Date(existing.expiryDate).getTime() > Date.now()) {
      const daysLeft = Math.ceil((new Date(existing.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 3) {
        throw new Error(`You already possess an active membership valid until ${new Date(existing.expiryDate).toLocaleDateString()}. Renewal is available 3 days before expiry.`);
      }
    }

    const newPayment: DbMembershipPayment = {
      id: `mpay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: sId,
      studentName: sName,
      studentEmail: sEmail,
      amount: paymentData.amount || membershipSettings.monthlyFeeLkr || 1500,
      paymentReference: paymentData.paymentReference,
      paymentMethod: paymentData.paymentMethod || 'Bank Transfer',
      slipUrl: paymentData.slipUrl,
      slipName: paymentData.slipName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      membershipPeriodDays: paymentData.membershipPeriodDays || membershipSettings.durationDays || 30,
      notes: paymentData.notes,
    };

    const saved = await submitMembershipPaymentInFirestore(newPayment);
    await refreshMembershipData();
    return saved;
  };

  const reviewMembershipPayment = async (
    paymentId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> => {
    const reviewerName = currentAuthUser?.fullName || superAdminUser.name || 'Super Admin';
    await reviewMembershipPaymentInFirestore(paymentId, status, reviewerName, notes);
    await refreshMembershipData();
  };

  const updateMembershipSettings = async (newSettings: Partial<MembershipSettings>): Promise<void> => {
    const merged = { ...membershipSettings, ...newSettings };
    setMembershipSettings(merged);
    await saveMembershipSettingsInFirestore(merged);
  };

  // Real-time Live Exam Proctoring helpers
  const saveLiveProctorSession = async (
    session: Partial<DbLiveProctorSession> & { sessionId: string }
  ) => {
    setLiveProctorSessions((prev) => {
      const idx = prev.findIndex((s) => s.sessionId === session.sessionId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...session };
        return updated;
      }
      return [session as DbLiveProctorSession, ...prev];
    });
    await upsertLiveProctorSession(session);
  };

  const sendProctorWarning = async (sessionId: string, warning: ProctorWarning) => {
    await sendProctorWarningToSession(sessionId, warning);
    setLiveProctorSessions((prev) =>
      prev.map((s) =>
        s.sessionId === sessionId
          ? { ...s, warningsSent: [...(s.warningsSent || []), warning] }
          : s
      )
    );
  };

  const flagCandidateSession = async (sessionId: string, isFlagged: boolean, reason?: string) => {
    await flagProctorSession(sessionId, isFlagged, reason);
    setLiveProctorSessions((prev) =>
      prev.map((s) =>
        s.sessionId === sessionId
          ? { ...s, isFlagged, flagReason: reason || '', status: isFlagged ? 'flagged' : 'active' }
          : s
      )
    );
  };

  const endProctorSession = async (sessionId: string, status: 'completed' | 'timeout' = 'completed') => {
    await closeLiveProctorSession(sessionId, status);
    setLiveProctorSessions((prev) =>
      prev.map((s) => (s.sessionId === sessionId ? { ...s, status, cameraActive: false } : s))
    );
  };

  // Advertisement & Sponsor Billboard helpers
  const saveAdvertisement = async (ad: DbAdvertisement) => {
    await saveAdvertisementToFirestore(ad);
  };

  const deleteAdvertisement = async (adId: string) => {
    await deleteAdvertisementInFirestore(adId);
  };

  const toggleAdvertisementStatus = async (adId: string, status: 'active' | 'inactive') => {
    await toggleAdvertisementStatusInFirestore(adId, status);
  };

  const recordAdClick = async (adId: string) => {
    await incrementAdClicksInFirestore(adId);
  };

  // Student Feedback & Suggestions helpers
  const submitFeedback = async (data: {
    category: FeedbackCategory;
    rating: number;
    subject: string;
    message: string;
  }): Promise<string> => {
    const studentId = currentAuthUser?.uid || currentStudent.id || 'anonymous_student';
    const studentName = currentAuthUser?.fullName || currentStudent.name || 'Student Candidate';
    const studentEmail = currentAuthUser?.email || currentStudent.email || '';
    const studentSchool = currentStudent.institution || currentAuthUser?.school || '';
    const studentGrade = currentStudent.gradeLevel || currentAuthUser?.grade || '';
    const district = currentAuthUser?.district || currentStudent.district || '';

    return await submitStudentFeedbackToFirestore({
      studentId,
      studentName,
      studentEmail,
      studentSchool,
      studentGrade,
      district,
      category: data.category,
      rating: data.rating,
      subject: data.subject,
      message: data.message,
    });
  };

  const updateFeedbackStatus = async (
    feedbackId: string,
    status: 'pending' | 'reviewed' | 'resolved',
    adminResponse?: string
  ): Promise<void> => {
    await updateFeedbackInFirestore(feedbackId, {
      status,
      adminResponse: adminResponse !== undefined ? adminResponse : undefined,
      adminRepliedBy: currentAuthUser?.fullName || 'Exam Admin',
      repliedAt: new Date().toISOString(),
    });
  };

  const deleteFeedback = async (feedbackId: string): Promise<void> => {
    await deleteFeedbackFromFirestore(feedbackId);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentAuthUser,
        setCurrentAuthUser,
        authLoading,
        logout,
        currentPortal,
        setCurrentPortal,
        superAdminNav,
        setSuperAdminNav,
        adminNav,
        setAdminNav,
        studentNav,
        setStudentNav,
        superAdminUser,
        currentAdmin,
        currentStudent,
        studentCurriculumPath,
        admins,
        students,
        competitions,
        results,
        announcements,
        auditLogs,
        settings,
        addAdmin,
        toggleAdminStatus,
        deleteAdmin,
        updateAdminDetails,
        addCompetition,
        saveCompetition,
        deleteCompetition,
        updateCompetitionStatus,
        approveCompetitionBySuperAdmin,
        rejectCompetitionBySuperAdmin,
        registerStudentForCompetition,
        isStudentRegistered,
        toggleResultPublish,
        updateResultEvaluation,
        deleteResult,
        updateSettings,
        updateStudentProfile,
        studentEnrolledSubjects,
        updateStudentEnrolledSubjects,
        subjectPublicationAlerts,
        dismissSubjectPublicationAlert,
        triggerManualSubjectPushTest,
        deleteStudentAccount,
        updateStudentPassword,
        updateStudentByAdmin,
        updateAdminProfile,
        memberships,
        currentMembership,
        membershipPayments,
        membershipSettings,
        submitMembershipPayment,
        reviewMembershipPayment,
        updateMembershipSettings,
        isMembershipActiveForStudent,
        refreshMembershipData,
        studentAttempts,
        getStudentAttempt,
        hasStudentSubmitted,
        startCompetitionAttempt,
        saveAttemptAnswers,
        submitCompetitionAttempt,
        activeExamComp,
        examSessionStage,
        activeExamAttempt,
        openCompetitionDetails,
        openCompetitionInstructions,
        startActiveExam,
        exitActiveExam,
        payments,
        verificationPhotos,
        processCompetitionPayment,
        isCompetitionPaid,
        updatePaymentStatus,
        saveExamVerificationPhoto,
        isExamVerified,
        getStudentVerificationPhoto,
        getCompetitionRankings,
        awardSharePoints,
        redeemStudentPerk,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        purgeDemoAnnouncements,
        seedOfficialAnnouncements,
        adjustStudentPoints,
        liveProctorSessions,
        saveLiveProctorSession,
        sendProctorWarning,
        flagCandidateSession,
        endProctorSession,
        advertisements,
        saveAdvertisement,
        deleteAdvertisement,
        toggleAdvertisementStatus,
        recordAdClick,
        isAdManagerOpen,
        setIsAdManagerOpen,
        isDistrictsStudioOpen,
        setIsDistrictsStudioOpen,
        districtsStudioInitialAction,
        setDistrictsStudioInitialAction,
        openDistrictsStudio,
        feedbacks,
        submitFeedback,
        updateFeedbackStatus,
        deleteFeedback,
        isFeedbackModalOpen,
        setIsFeedbackModalOpen,
        purgeDemoCompetitions: async () => {
          return await purgeAllDemoCompetitions();
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
