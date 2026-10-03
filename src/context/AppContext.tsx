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
} from '../types';
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
import { Language, translations } from '../i18n/translations';
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
  deleteResultFromFirestore,
  getSavedActiveUser,
  saveActiveUser,
  awardSharePointsInFirestore,
  redeemPerkInFirestore,
  adjustStudentPointsInFirestore,
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
  | 'Audit Trail'
  | 'Settings';

export type AdminNav = 
  | 'Dashboard' 
  | 'Competition Management' 
  | 'Student Information' 
  | 'Results' 
  | 'Announcements'
  | 'Sponsors & Ads'
  | 'Live Proctoring'
  | 'Audit Trail'
  | 'Profile';

export type StudentNav = 
  | 'Dashboard' 
  | 'Competitions' 
  | 'My Results' 
  | 'My Profile'
  | 'Referral & Points'
  | 'Announcements';

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

  // User identities mapped to current authenticated user
  superAdminUser: SuperAdminUser;
  currentAdmin: AdminUser;
  currentStudent: StudentUser;

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
  }) => Promise<void>;
  toggleAdminStatus: (adminId: string) => Promise<void>;
  deleteAdmin: (adminId: string) => Promise<void>;
  updateAdminDetails: (adminId: string, data: Partial<AdminUser>) => Promise<void>;
  addCompetition: (compData: Omit<Competition, 'id' | 'enrolledCount'>) => Promise<void>;
  saveCompetition: (compData: Partial<Competition> & { title: string }) => Promise<string>;
  deleteCompetition: (competitionId: string) => Promise<void>;
  updateCompetitionStatus: (id: string, status: CompetitionStatus) => Promise<void>;
  registerStudentForCompetition: (competitionId: string) => boolean;
  isStudentRegistered: (competitionId: string) => boolean;
  toggleResultPublish: (resultId: string) => Promise<void>;
  updateResultEvaluation: (resultId: string, updates: Partial<CompetitionResult>) => Promise<void>;
  deleteResult: (resultId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<PlatformSettings>) => void;
  updateStudentProfile: (profile: Partial<StudentUser>) => void;
  deleteStudentAccount: (studentUid: string) => Promise<void>;
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
  const [currentAuthUser, setCurrentAuthUser] = useState<DbUser | null>(() => getSavedActiveUser());
  const [authLoading, setAuthLoading] = useState<boolean>(() => !getSavedActiveUser());

  // Portal role (strictly synchronized with currentAuthUser.role)
  const [currentPortal, setInternalPortal] = useState<PortalRole>(() => getSavedActiveUser()?.role || 'super_admin');

  // Navigation tab states
  const [superAdminNav, setSuperAdminNav] = useState<SuperAdminNav>('Dashboard');
  const [adminNav, setAdminNav] = useState<AdminNav>('Dashboard');
  const [studentNav, setStudentNav] = useState<StudentNav>('Dashboard');

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || key;
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
    // Run database hygiene in background without blocking initial auth / UI render
    const hygieneTimer = setTimeout(() => {
      seedInitialDataIfEmpty().catch(() => {});
      purgeLegacyDemoFirestoreData().catch(() => {});
    }, 400);

    // Safety timeout to prevent permanent loading freeze if network or Auth is delayed
    const authSafetyTimer = setTimeout(() => {
      setAuthLoading((prev) => {
        if (prev) {
          console.warn('Auth loading safety timeout fired: Unfreezing loading UI.');
          return false;
        }
        return false;
      });
    }, 2800);

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(authSafetyTimer);
      try {
        const saved = getSavedActiveUser();

        if (fbUser) {
          let resolvedUser: DbUser | null = null;

          // 1. Direct fetch by fbUser.uid in 'users' collection
          try {
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDoc.exists()) {
              resolvedUser = userDoc.data() as DbUser;
            }
          } catch (fetchErr) {
            console.warn('Doc fetch by fbUser.uid warning:', fetchErr);
          }

          // 2. If not found by fbUser.uid, check if saved active user matches fbUser
          if (!resolvedUser && saved) {
            const fbEmail = (fbUser.email || '').toLowerCase();
            const savedEmail = (saved.email || '').toLowerCase();
            const savedAuthEmail = (saved.authEmail || '').toLowerCase();
            if (
              (fbEmail && (savedEmail === fbEmail || savedAuthEmail === fbEmail)) ||
              saved.uid === fbUser.uid
            ) {
              resolvedUser = saved;
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

              // If student, enrich with latest data from 'students' collection if available
              if (resolvedUser.role === 'student') {
                try {
                  const stuDoc = await getDoc(doc(db, 'students', resolvedUser.uid));
                  if (stuDoc.exists()) {
                    const stuData = stuDoc.data();
                    resolvedUser = {
                      ...resolvedUser,
                      grade: stuData.grade || resolvedUser.grade || 'Grade 6',
                      school: stuData.school || resolvedUser.school,
                      referralPoints: stuData.referralPoints !== undefined ? stuData.referralPoints : (resolvedUser.referralPoints ?? 0),
                      totalReferrals: stuData.totalReferrals !== undefined ? stuData.totalReferrals : (resolvedUser.totalReferrals ?? 0),
                      sharesCount: stuData.sharesCount !== undefined ? stuData.sharesCount : (resolvedUser.sharesCount ?? 0),
                      redeemedPerks: stuData.redeemedPerks || resolvedUser.redeemedPerks || [],
                      referralCode: stuData.referralCode || resolvedUser.referralCode,
                      avatarUrl: stuData.avatarUrl || resolvedUser.avatarUrl || '',
                    };
                  }
                } catch {}
              }

              // Update session and persist to storage
              saveActiveUser(resolvedUser);
              setCurrentAuthUser(resolvedUser);
              setInternalPortal(resolvedUser.role);
            }
          } else {
            // Neither Firestore nor query resolved this fbUser.
            // DO NOT immediately log out if a valid saved session exists!
            if (saved && saved.role && saved.status !== 'inactive') {
              setCurrentAuthUser(saved);
              setInternalPortal(saved.role);
            } else {
              setCurrentAuthUser(null);
            }
          }
        } else {
          // fbUser is null (e.g. user logged in using Student ID, Username, or Staff ID with offline/direct auth)
          if (saved && saved.role && saved.status !== 'inactive') {
            setCurrentAuthUser(saved);
            setInternalPortal(saved.role);

            // Optional background check: verify account was not deactivated in Firestore
            if (saved.uid) {
              getDoc(doc(db, 'users', saved.uid))
                .then((docSnap) => {
                  if (docSnap.exists()) {
                    const latest = docSnap.data() as DbUser;
                    if (latest.status === 'inactive') {
                      logoutUserSession();
                      setCurrentAuthUser(null);
                    } else {
                      const merged = { ...saved, ...latest };
                      saveActiveUser(merged);
                      setCurrentAuthUser(merged);
                    }
                  }
                })
                .catch(() => {});
            }
          } else {
            setCurrentAuthUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth restoration resilience fallback note:', err);
        const saved = getSavedActiveUser();
        if (saved && saved.role && saved.status !== 'inactive') {
          setCurrentAuthUser(saved);
          setInternalPortal(saved.role);
        } else {
          setCurrentAuthUser(null);
        }
      } finally {
        setAuthLoading(false);
      }
    });

    return () => {
      clearTimeout(hygieneTimer);
      clearTimeout(authSafetyTimer);
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

      // Strictly exclude any demo/sample competitions so students will never see dummy records
      const realComps = dbComps.filter((c) => {
        if (knownDemoIds.has(c.competitionId)) return false;
        if (knownDemoCodes.has((c.code || '').toUpperCase())) return false;
        const title = (c.title || '').toLowerCase();
        if (
          title.includes('national academic mathematics & logic olympiad 2026') ||
          title.includes('all-island science & stem olympiad 2026') ||
          title.includes('junior mathematics challenge 2026 (grade 6)') ||
          title.includes('junior science & environment quiz 2026 (grade 7)') ||
          title.includes('demo competition') ||
          title.includes('sample competition') ||
          title.includes('test competition')
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
        };
      });
      setCompetitions(mapped);
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

              if (
                (prev.referralPoints ?? 0) === newPts &&
                (prev.totalReferrals ?? 0) === newRefs &&
                (prev.sharesCount ?? 0) === newShares &&
                (prev.redeemedPerks?.length || 0) === newPerks.length &&
                (prev.referralCode || '') === newCode &&
                (prev.avatarUrl || '') === newAvatar
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
          if (
            s.sessionId?.startsWith('sim-') ||
            s.studentId?.startsWith('sim-') ||
            s.studentName?.includes('Simulated') ||
            s.studentName?.includes('கவிநிலா')
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
    assignedCompetitionsCount: competitions.filter(
      (c) => c.leadAdminId === currentAuthUser?.uid || c.leadAdminName === currentAuthUser?.fullName
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
    competitions,
  ]);

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
    gradeLevel: currentAuthUser?.grade || 'Open Grade',
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
    referralPoints: currentAuthUser?.referralPoints !== undefined ? currentAuthUser.referralPoints : 0,
    totalReferrals: currentAuthUser?.totalReferrals || 0,
    sharesCount: currentAuthUser?.sharesCount || 0,
    redeemedPerks: currentAuthUser?.redeemedPerks || [],
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
    studentRegistrations.length,
    results,
  ]);

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
      try {
        await setDoc(
          doc(db, 'users', targetUid),
          { avatarUrl: newAvatar },
          { merge: true }
        );
      } catch (e) {
        console.warn('User doc avatar sync note:', e);
      }
      try {
        await setDoc(
          doc(db, 'students', targetUid),
          { avatarUrl: newAvatar },
          { merge: true }
        );
      } catch (e) {
        console.warn('Student doc avatar sync note:', e);
      }
      if (currentStudent.studentId && currentStudent.studentId !== targetUid) {
        try {
          await setDoc(
            doc(db, 'students', currentStudent.studentId),
            { avatarUrl: newAvatar },
            { merge: true }
          );
        } catch (e) {
          console.warn('Student ID doc avatar sync note:', e);
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
        competitionTitle: newResult.competitionTitle,
        studentId: newResult.studentId,
        studentName: newResult.studentName,
        studentInstitution: newResult.studentInstitution,
        score: newResult.score,
        maxScore: newResult.totalMarks,
        totalMarks: newResult.totalMarks,
        percentage: newResult.percentage,
        percentile: newResult.percentage,
        rank: newResult.rank,
        submittedAt: newResult.submittedAt,
        publishStatus: newResult.publishStatus,
        award: newResult.award,
        prizeStatus: newResult.prizeStatus,
        certificateId: newResult.certificateId,
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
    const res = await adjustStudentPointsInFirestore(studentUid, pointsDelta, reason);
    if (res.success) {
      setStudents((prev) =>
        prev.map((s) => (s.id === studentUid ? { ...s, referralPoints: res.newPoints } : s))
      );
      if (currentAuthUser?.uid === studentUid) {
        setCurrentAuthUser((prev) => {
          if (!prev) return null;
          const updated = { ...prev, referralPoints: res.newPoints };
          saveActiveUser(updated);
          return updated;
        });
      }
    }
    return res.newPoints;
  };

  // Phase 07: Membership helper methods
  const refreshMembershipData = useCallback(async () => {
    try {
      const userRole = currentAuthUser?.role;
      const targetUid = currentAuthUser?.uid || currentStudent.id;

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
      } else {
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
    } catch (err) {
      console.error('Error refreshing membership data:', err);
    }
  }, [currentAuthUser?.role, currentAuthUser?.uid, currentStudent.id]);

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
        registerStudentForCompetition,
        isStudentRegistered,
        toggleResultPublish,
        updateResultEvaluation,
        deleteResult,
        updateSettings,
        updateStudentProfile,
        deleteStudentAccount,
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
