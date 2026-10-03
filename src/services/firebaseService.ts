import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { auth, db, firebaseConfig } from '../lib/firebase';
import {
  DbUser,
  DbStudent,
  DbAdmin,
  DbCompetition,
  DbResult,
  DbAttempt,
  DbPayment,
  DbVerificationPhoto,
  DbAnnouncement,
  DbMembership,
  DbMembershipPayment,
  MembershipSettings,
  PortalRole,
  CompetitionStatus,
  DbLiveProctorSession,
  ProctorWarning,
  DbAdvertisement,
} from '../types';
import {
  storeMediaInIndexedDB,
  deleteMediaFromIndexedDB,
  estimateObjectByteSize,
} from '../utils/mediaStorage';

// -------------------------------------------------------------
// Authentication Functions & Resilient Security Helpers
// -------------------------------------------------------------

/**
 * Computes a secure SHA-256 hash with institutional salt for database-verified authentication
 */
async function hashCredential(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`hnc_eduhub_salt_2026_${password}`);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isAuthUnavailableError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const message = String(err.message || '');
  return (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/configuration-not-found' ||
    code === 'auth/admin-restricted-operation' ||
    code === 'auth/network-request-failed' ||
    code === 'auth/internal-error' ||
    code === 'auth/timeout' ||
    code === 'auth/too-many-requests' ||
    message.includes('network-request-failed') ||
    message.includes('operation-not-allowed') ||
    message.includes('OPERATION_NOT_ALLOWED') ||
    message.includes('PASSWORD_LOGIN_DISABLED') ||
    message.includes('Failed to fetch')
  );
}

export function saveActiveUser(user: DbUser | null): void {
  try {
    if (typeof window !== 'undefined') {
      if (user) {
        const serialized = JSON.stringify(user);
        window.localStorage?.setItem('hnc_eduhub_active_user', serialized);
        window.sessionStorage?.setItem('hnc_eduhub_active_user', serialized);
      } else {
        window.localStorage?.removeItem('hnc_eduhub_active_user');
        window.sessionStorage?.removeItem('hnc_eduhub_active_user');
      }
    }
  } catch {}
}

export function getSavedActiveUser(): DbUser | null {
  try {
    if (typeof window !== 'undefined') {
      const rawLocal = window.localStorage?.getItem('hnc_eduhub_active_user');
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (parsed && typeof parsed === 'object' && parsed.uid) return parsed;
      }
      const rawSession = window.sessionStorage?.getItem('hnc_eduhub_active_user');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed && typeof parsed === 'object' && parsed.uid) return parsed;
      }
    }
  } catch {}
  return null;
}

/**
 * Sign in existing user and verify active status and role from Firestore
 */
/**
 * Sign in existing user using Student ID, Username, or Email, and verify active status and role from Firestore
 */
export async function loginWithEmailPassword(
  identifierOrEmail: string,
  pass: string
): Promise<{ firebaseUser: FirebaseUser | null; userProfile: DbUser }> {
  const rawIdentifier = identifierOrEmail.trim();
  const trimmedPass = pass;
  const normalizedIdentifier = rawIdentifier.toLowerCase();
  let firebaseUser: FirebaseUser | null = null;

  // 1. Designated Institutional Super Admin flow (freedomedupu@gmail.com)
  if (normalizedIdentifier === 'freedomedupu@gmail.com') {
    let authUnavailable = false;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedIdentifier, trimmedPass);
      firebaseUser = userCredential.user;
    } catch (authErr: any) {
      if (isAuthUnavailableError(authErr)) {
        authUnavailable = true;
      } else if (
        authErr.code === 'auth/user-not-found' ||
        authErr.code === 'auth/invalid-credential'
      ) {
        // If not yet provisioned in Firebase Auth, attempt to register designated Super Admin
        try {
          const newCred = await createUserWithEmailAndPassword(auth, normalizedIdentifier, trimmedPass);
          firebaseUser = newCred.user;
        } catch (createErr: any) {
          if (isAuthUnavailableError(createErr)) {
            authUnavailable = true;
          } else if (createErr.code === 'auth/email-already-in-use') {
            throw new Error('Invalid password. Please check your credentials.');
          } else {
            authUnavailable = true;
          }
        }
      } else {
        // Any other network or provider issue defaults to resilient Firestore authentication
        authUnavailable = true;
      }
    }

    const saUid = firebaseUser ? firebaseUser.uid : 'sa_freedomedupu';
    const computedHash = await hashCredential(trimmedPass);
    let targetDocRef = doc(db, 'users', saUid);
    let userProfile: DbUser;

    try {
      const userSnap = await getDoc(targetDocRef);
      if (userSnap.exists()) {
        userProfile = userSnap.data() as DbUser;
      } else {
        // Search if super admin user document was stored under a different ID
        const saSnap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedIdentifier)));
        if (!saSnap.empty) {
          userProfile = saSnap.docs[0].data() as DbUser;
          targetDocRef = saSnap.docs[0].ref;
        } else {
          userProfile = {
            uid: saUid,
            fullName: 'Chief Academic Registrar (Super Admin)',
            email: normalizedIdentifier,
            phone: '+94 77 123 4567',
            role: 'super_admin',
            status: 'active',
            passwordHash: computedHash,
            createdAt: new Date().toISOString(),
          };
          await setDoc(targetDocRef, userProfile);
        }
      }

      // If logging in via Firestore fallback, check password hash
      if (authUnavailable && userProfile.passwordHash) {
        if (userProfile.passwordHash !== computedHash) {
          throw new Error('Invalid password. Please check your credentials.');
        }
      } else if (!userProfile.passwordHash) {
        try {
          await setDoc(targetDocRef, { passwordHash: computedHash }, { merge: true });
        } catch {}
      }
    } catch (firestoreErr: any) {
      if (firestoreErr?.message === 'Invalid password. Please check your credentials.') {
        throw firestoreErr;
      }
      console.warn('Super Admin Firestore profile fetch fallback:', firestoreErr);
      userProfile = {
        uid: saUid,
        fullName: 'Chief Academic Registrar (Super Admin)',
        email: normalizedIdentifier,
        phone: '+94 77 123 4567',
        role: 'super_admin',
        status: 'active',
        passwordHash: computedHash,
        createdAt: new Date().toISOString(),
      };
    }
    saveActiveUser(userProfile);
    return { firebaseUser, userProfile };
  }

  // 2. Candidate & Staff Look-up: Locate user account by Username, Student ID, Staff ID, or Email
  let targetUserDoc: DbUser | null = null;

  try {
    // A. Search by Username in 'users' collection
    let snap = await getDocs(query(collection(db, 'users'), where('username', '==', normalizedIdentifier)));
    if (!snap.empty) {
      targetUserDoc = snap.docs[0].data() as DbUser;
    }

    // B. Search by Student ID in 'users' collection (case-insensitive checks)
    if (!targetUserDoc) {
      snap = await getDocs(query(collection(db, 'users'), where('studentId', '==', rawIdentifier)));
      if (!snap.empty) targetUserDoc = snap.docs[0].data() as DbUser;
    }
    if (!targetUserDoc) {
      snap = await getDocs(query(collection(db, 'users'), where('studentId', '==', rawIdentifier.toUpperCase())));
      if (!snap.empty) targetUserDoc = snap.docs[0].data() as DbUser;
    }
    if (!targetUserDoc) {
      snap = await getDocs(query(collection(db, 'users'), where('studentId', '==', normalizedIdentifier)));
      if (!snap.empty) targetUserDoc = snap.docs[0].data() as DbUser;
    }

    // C. Search in 'students' collection if not yet found
    if (!targetUserDoc) {
      let snapStudent = await getDocs(query(collection(db, 'students'), where('studentId', '==', rawIdentifier)));
      if (snapStudent.empty) {
        snapStudent = await getDocs(query(collection(db, 'students'), where('studentId', '==', rawIdentifier.toUpperCase())));
      }
      if (snapStudent.empty) {
        snapStudent = await getDocs(query(collection(db, 'students'), where('username', '==', normalizedIdentifier)));
      }

      if (!snapStudent.empty) {
        const studentData = snapStudent.docs[0].data() as DbStudent;
        const uSnap = await getDoc(doc(db, 'users', studentData.uid));
        if (uSnap.exists()) {
          targetUserDoc = uSnap.data() as DbUser;
        }
      }
    }

    // D. Search in 'admins' collection if not yet found
    if (!targetUserDoc) {
      let snapAdmin = await getDocs(query(collection(db, 'admins'), where('staffId', '==', rawIdentifier)));
      if (snapAdmin.empty) {
        snapAdmin = await getDocs(query(collection(db, 'admins'), where('staffId', '==', rawIdentifier.toUpperCase())));
      }
      if (snapAdmin.empty) {
        snapAdmin = await getDocs(query(collection(db, 'admins'), where('username', '==', normalizedIdentifier)));
      }
      if (snapAdmin.empty) {
        snapAdmin = await getDocs(query(collection(db, 'admins'), where('email', '==', normalizedIdentifier)));
      }

      if (!snapAdmin.empty) {
        const adminData = snapAdmin.docs[0].data() as DbAdmin;
        const uSnap = await getDoc(doc(db, 'users', adminData.uid));
        if (uSnap.exists()) {
          targetUserDoc = uSnap.data() as DbUser;
        }
      }
    }

    // E. Search by Email in 'users' collection
    if (!targetUserDoc) {
      const snapEmail = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedIdentifier)));
      if (snapEmail.docs.length > 1) {
        // Multiple students in the same family share this parent email!
        throw new Error(
          'Multiple student accounts (siblings) are registered with this email address. Please sign in using your specific Student ID or Username.'
        );
      } else if (snapEmail.docs.length === 1) {
        targetUserDoc = snapEmail.docs[0].data() as DbUser;
      }
    }
  } catch (lookupErr: any) {
    if (lookupErr?.message?.includes('Multiple student accounts')) {
      throw lookupErr;
    }
    console.warn('User lookup connectivity warning:', lookupErr);
    const cachedUser = getSavedActiveUser();
    if (
      cachedUser &&
      (cachedUser.email?.toLowerCase() === normalizedIdentifier ||
        cachedUser.username?.toLowerCase() === normalizedIdentifier ||
        cachedUser.studentId?.toLowerCase() === normalizedIdentifier)
    ) {
      targetUserDoc = cachedUser;
    } else if (lookupErr?.code === 'unavailable' || String(lookupErr?.message || '').toLowerCase().includes('offline')) {
      throw new Error('Network offline. Please check your internet connection and try again.');
    } else {
      throw lookupErr;
    }
  }

  if (!targetUserDoc) {
    throw new Error('No user account found with this Student ID or Username. Please verify and try again.');
  }

  if (targetUserDoc.status !== 'active') {
    throw new Error('Your account is currently inactive or suspended. Please contact the administrator.');
  }

  // 3. Authenticate candidate credentials
  // Deterministic internal auth email for Firebase Auth
  const authEmailToUse =
    targetUserDoc.authEmail ||
    (targetUserDoc.username
      ? `${targetUserDoc.username.toLowerCase()}@student.hnceduhub.lk`
      : targetUserDoc.email);

  let authenticatedViaAuth = false;

  // Try Firebase Auth with internal auth email
  try {
    const cred = await signInWithEmailAndPassword(auth, authEmailToUse, trimmedPass);
    firebaseUser = cred.user;
    authenticatedViaAuth = true;
  } catch (authErr1: any) {
    // Also try direct email if account was created previously
    if (targetUserDoc.email && targetUserDoc.email !== authEmailToUse) {
      try {
        const cred2 = await signInWithEmailAndPassword(auth, targetUserDoc.email, trimmedPass);
        firebaseUser = cred2.user;
        authenticatedViaAuth = true;
      } catch {}
    }
  }

  if (authenticatedViaAuth && firebaseUser) {
    if (targetUserDoc.role === 'student') {
      try {
        const sDoc = await getDoc(doc(db, 'students', targetUserDoc.uid));
        if (sDoc.exists()) {
          const sData = sDoc.data() as DbStudent;
          targetUserDoc = {
            ...targetUserDoc,
            referralPoints: sData.referralPoints !== undefined ? sData.referralPoints : (targetUserDoc.referralPoints ?? 25),
            totalReferrals: sData.totalReferrals !== undefined ? sData.totalReferrals : (targetUserDoc.totalReferrals ?? 0),
            sharesCount: sData.sharesCount !== undefined ? sData.sharesCount : (targetUserDoc.sharesCount ?? 0),
            redeemedPerks: sData.redeemedPerks || targetUserDoc.redeemedPerks || [],
            referralCode: sData.referralCode || targetUserDoc.referralCode,
            grade: sData.grade || targetUserDoc.grade,
            school: sData.school || targetUserDoc.school,
            avatarUrl: sData.avatarUrl || targetUserDoc.avatarUrl || '',
          };
        }
      } catch {}
    }
    saveActiveUser(targetUserDoc);
    return { firebaseUser, userProfile: targetUserDoc };
  }

  // 4. Resilient Fallback: Verify password hash directly from Firestore
  const computedHash = await hashCredential(trimmedPass);
  if (targetUserDoc.passwordHash) {
    if (computedHash !== targetUserDoc.passwordHash) {
      throw new Error('Invalid password. Please check your credentials.');
    }
  } else {
    // Record password hash on initial successful check
    try {
      await updateDoc(doc(db, 'users', targetUserDoc.uid), { passwordHash: computedHash });
    } catch {}
  }

  if (targetUserDoc.role === 'student') {
    try {
      const sDoc = await getDoc(doc(db, 'students', targetUserDoc.uid));
      if (sDoc.exists()) {
        const sData = sDoc.data() as DbStudent;
        targetUserDoc = {
          ...targetUserDoc,
          referralPoints: sData.referralPoints !== undefined ? sData.referralPoints : (targetUserDoc.referralPoints ?? 25),
          totalReferrals: sData.totalReferrals !== undefined ? sData.totalReferrals : (targetUserDoc.totalReferrals ?? 0),
          sharesCount: sData.sharesCount !== undefined ? sData.sharesCount : (targetUserDoc.sharesCount ?? 0),
          redeemedPerks: sData.redeemedPerks || targetUserDoc.redeemedPerks || [],
          referralCode: sData.referralCode || targetUserDoc.referralCode,
          grade: sData.grade || targetUserDoc.grade,
          school: sData.school || targetUserDoc.school,
          avatarUrl: sData.avatarUrl || targetUserDoc.avatarUrl || '',
        };
      }
    } catch {}
  }

  saveActiveUser(targetUserDoc);
  return { firebaseUser: null, userProfile: targetUserDoc };
}

/**
 * Register a new Student using Firebase Auth and Firestore.
 * NOTE: Multiple children (siblings) can share the same parent email & phone number.
 * ONLY Username and Student ID must be unique across all students!
 */
export async function registerStudentAccount(data: {
  fullName: string;
  grade: string;
  dateOfBirth?: string;
  studentId: string;
  school: string;
  district?: string;
  address?: string;
  phone?: string;
  email: string;
  username: string;
  password: string;
  referralCode?: string;
}): Promise<{ firebaseUser: FirebaseUser | null; userProfile: DbUser }> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedUsername = data.username.trim().toLowerCase();
  const trimmedStudentId = data.studentId.trim();
  const computedHash = await hashCredential(data.password);
  const now = new Date().toISOString();
  let firebaseUser: FirebaseUser | null = null;
  let uid = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Check if Username is already taken (MUST be strictly unique per student)
  const usernameQuery = query(collection(db, 'users'), where('username', '==', normalizedUsername));
  const snapUsername = await getDocs(usernameQuery);
  if (!snapUsername.empty) {
    throw new Error(`Username "${data.username.trim()}" is already taken by another student. Please choose a different unique username.`);
  }

  // 2. Check if Student ID is already registered (MUST be strictly unique per student)
  let studentIdQuery = query(collection(db, 'students'), where('studentId', '==', trimmedStudentId));
  let snapStudentId = await getDocs(studentIdQuery);
  if (snapStudentId.empty) {
    studentIdQuery = query(collection(db, 'students'), where('studentId', '==', trimmedStudentId.toUpperCase()));
    snapStudentId = await getDocs(studentIdQuery);
  }
  if (snapStudentId.empty) {
    studentIdQuery = query(collection(db, 'users'), where('studentId', '==', trimmedStudentId));
    snapStudentId = await getDocs(studentIdQuery);
  }
  if (!snapStudentId.empty) {
    throw new Error(`Student ID "${trimmedStudentId}" is already registered. Please verify your Student ID or click Generate.`);
  }

  // 3. Create Firebase Auth account using a unique internal Auth email so siblings sharing the parent's email never collide!
  const internalAuthEmail = `${normalizedUsername}@student.hnceduhub.lk`;

  try {
    const cred = await createUserWithEmailAndPassword(auth, internalAuthEmail, data.password);
    firebaseUser = cred.user;
    uid = cred.user.uid;
  } catch (err: any) {
    if (isAuthUnavailableError(err)) {
      console.warn('Firebase Auth email/password provider not enabled in console; saving student directly to Firestore.');
    } else if (err.code === 'auth/email-already-in-use') {
      // Internal auth email collided - fall back to resilient Firestore document
      console.warn('Internal auth email already exists, continuing with resilient Firestore candidate record.');
    } else {
      console.warn('Firebase Auth registration warning, continuing with Firestore storage:', err);
    }
  }

  // 4. Referral points logic & generation
  const cleanId = trimmedStudentId.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const myReferralCode = cleanId.startsWith('HNC') ? cleanId : `HNC-${cleanId}`;
  let initialPoints = 0; // Standard registration without referral starts with 0 points
  let referredByCode: string | undefined = undefined;

  const rawEnteredRef = data.referralCode?.trim() || '';
  if (rawEnteredRef) {
    const refUpper = rawEnteredRef.toUpperCase();
    const refLower = rawEnteredRef.toLowerCase();
    const refClean = refUpper.replace(/[^A-Z0-9]/g, '');
    const refWithHnc = refUpper.startsWith('HNC-') ? refUpper : `HNC-${refClean}`;
    const refWithoutHnc = refUpper.replace(/^HNC-?/i, '');

    try {
      let referrerDocSnap: any = null;

      // 1. Search students collection
      const studentQueries = [
        query(collection(db, 'students'), where('referralCode', '==', refUpper)),
        query(collection(db, 'students'), where('referralCode', '==', refWithHnc)),
        query(collection(db, 'students'), where('referralCode', '==', `HNC-${refClean}`)),
        query(collection(db, 'students'), where('studentId', '==', refUpper)),
        query(collection(db, 'students'), where('studentId', '==', rawEnteredRef)),
        query(collection(db, 'students'), where('studentId', '==', refWithoutHnc)),
        query(collection(db, 'students'), where('username', '==', refLower)),
      ];

      for (const q of studentQueries) {
        const snap = await getDocs(q);
        if (!snap.empty) {
          referrerDocSnap = snap.docs[0];
          break;
        }
      }

      // 2. If not found in students, search users collection
      if (!referrerDocSnap) {
        const userQueries = [
          query(collection(db, 'users'), where('referralCode', '==', refUpper)),
          query(collection(db, 'users'), where('referralCode', '==', refWithHnc)),
          query(collection(db, 'users'), where('referralCode', '==', `HNC-${refClean}`)),
          query(collection(db, 'users'), where('studentId', '==', refUpper)),
          query(collection(db, 'users'), where('studentId', '==', rawEnteredRef)),
          query(collection(db, 'users'), where('studentId', '==', refWithoutHnc)),
          query(collection(db, 'users'), where('username', '==', refLower)),
        ];

        for (const q of userQueries) {
          const snap = await getDocs(q);
          if (!snap.empty) {
            referrerDocSnap = snap.docs[0];
            break;
          }
        }
      }

      if (referrerDocSnap) {
        const refId = referrerDocSnap.id;
        const refData = referrerDocSnap.data() as any;
        const currentPoints = typeof refData.referralPoints === 'number' ? refData.referralPoints : 0;
        const currentTotal = typeof refData.totalReferrals === 'number' ? refData.totalReferrals : 0;
        const updatedRefPoints = currentPoints + 25;
        const updatedRefTotal = currentTotal + 1;

        // Reward referrer with +25 points and increment total referrals
        try {
          await updateDoc(doc(db, 'students', refId), {
            referralPoints: updatedRefPoints,
            totalReferrals: updatedRefTotal,
          });
        } catch (e) {
          console.warn('Could not update referrer in students collection:', e);
        }

        try {
          await updateDoc(doc(db, 'users', refId), {
            referralPoints: updatedRefPoints,
            totalReferrals: updatedRefTotal,
          });
        } catch (e) {
          console.warn('Could not update referrer in users collection:', e);
        }

        // New student gets +25 Referral Bonus Points for using their friend's referral link!
        initialPoints = 25;
        referredByCode = refData.referralCode || refData.studentId || refUpper;
      } else {
        console.warn(`Referral code "${rawEnteredRef}" not found. Registering with 0 points.`);
      }
    } catch (e) {
      console.warn('Referral attribution notice:', e);
    }
  }

  // 5. Save to 'users' collection with parent's email & phone
  const userRecord: DbUser = {
    uid,
    fullName: data.fullName.trim(),
    email: normalizedEmail, // Parent's contact email
    authEmail: internalAuthEmail,
    phone: data.phone?.trim() || '', // Parent's contact phone
    role: 'student',
    status: 'active',
    createdAt: now,
    passwordHash: computedHash,
    grade: data.grade.trim(),
    school: data.school.trim(),
    studentId: trimmedStudentId,
    username: normalizedUsername,
    district: data.district?.trim() || '',
    address: data.address?.trim() || '',
    dateOfBirth: data.dateOfBirth?.trim() || '',
    referralCode: myReferralCode,
    referredBy: referredByCode,
    referralPoints: initialPoints,
    totalReferrals: 0,
    sharesCount: 0,
    redeemedPerks: [],
  };
  await setDoc(doc(db, 'users', uid), userRecord);

  // 6. Save to 'students' collection
  const studentRecord: DbStudent = {
    uid,
    studentId: trimmedStudentId,
    username: normalizedUsername,
    fullName: data.fullName.trim(),
    email: normalizedEmail,
    authEmail: internalAuthEmail,
    phone: data.phone?.trim() || '',
    grade: data.grade.trim(),
    school: data.school.trim(),
    district: data.district?.trim() || '',
    address: data.address?.trim() || '',
    dateOfBirth: data.dateOfBirth?.trim() || '',
    status: 'active',
    createdAt: now,
    referralCode: myReferralCode,
    referredBy: referredByCode,
    referralPoints: initialPoints,
    totalReferrals: 0,
    sharesCount: 0,
    redeemedPerks: [],
  };
  await setDoc(doc(db, 'students', uid), studentRecord);

  saveActiveUser(userRecord);
  return { firebaseUser, userProfile: userRecord };
}

/**
 * Super Admin creates an Admin account without logging out of Super Admin session
 */
export async function createAdminAccountBySuperAdmin(data: {
  fullName: string;
  email: string;
  password: string;
  username?: string;
  phone?: string;
  department?: string;
  staffId?: string;
}): Promise<DbAdmin> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedUsername = (data.username || data.staffId || normalizedEmail.split('@')[0]).trim();
  const computedHash = await hashCredential(data.password);
  const now = new Date().toISOString();
  let newUid = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Check if admin email already registered in Firestore
  const existingQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail));
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    throw new Error(`An account with email "${normalizedEmail}" is already registered.`);
  }

  const secondaryAppName = `AdminCreator-${Date.now()}`;
  let secondaryApp: any = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, data.password);
    newUid = cred.user.uid;
    await fbSignOut(secondaryAuth);
  } catch (err: any) {
    if (isAuthUnavailableError(err)) {
      console.warn('Firebase Auth email/password provider not enabled in console; saving admin to Firestore.');
    } else {
      console.warn('Firebase Auth secondary creation notice:', err.message);
    }
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch {}
    }
  }

  // Save in users collection with role: 'admin'
  const userDoc: DbUser = {
    uid: newUid,
    fullName: data.fullName.trim(),
    email: normalizedEmail,
    username: normalizedUsername,
    phone: data.phone?.trim() || '',
    role: 'admin',
    status: 'active',
    createdAt: now,
    passwordHash: computedHash,
    initialPassword: data.password,
  };
  await setDoc(doc(db, 'users', newUid), userDoc);

  // Save in admins collection
  const adminDoc: DbAdmin = {
    uid: newUid,
    fullName: data.fullName.trim(),
    email: normalizedEmail,
    username: normalizedUsername,
    initialPassword: data.password,
    phone: data.phone?.trim() || '',
    department: data.department?.trim() || 'General Academics',
    staffId: data.staffId?.trim() || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'active',
    createdAt: now,
  };
  await setDoc(doc(db, 'admins', newUid), adminDoc);

  return adminDoc;
}

export async function deleteAdminInFirestore(adminUid: string): Promise<void> {
  if (!adminUid) return;
  try {
    await deleteDoc(doc(db, 'admins', adminUid));
  } catch (e) {
    console.warn('Delete admin from admins collection notice:', e);
  }
  try {
    await deleteDoc(doc(db, 'users', adminUid));
  } catch (e) {
    console.warn('Delete admin from users collection notice:', e);
  }
}

/**
 * Bootstrap or register Super Admin on first project run if not yet existing
 */
export async function setupSuperAdminInitialAccount(
  fullName: string,
  email: string,
  pass: string
): Promise<{ firebaseUser: FirebaseUser | null; userProfile: DbUser }> {
  const normalizedEmail = email.trim().toLowerCase();
  const computedHash = await hashCredential(pass);
  const now = new Date().toISOString();
  let firebaseUser: FirebaseUser | null = null;
  let targetUid = 'sa_freedomedupu';

  try {
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
    firebaseUser = cred.user;
    targetUid = cred.user.uid;
  } catch (err: any) {
    if (isAuthUnavailableError(err)) {
      console.warn('Firebase Auth email/password provider is not enabled in Firebase Console. Using persistent Firestore authentication layer.');
    } else if (err.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        firebaseUser = cred.user;
        targetUid = cred.user.uid;
      } catch {
        // Continue with Firestore setup
      }
    } else {
      throw err;
    }
  }

  const superAdminProfile: DbUser = {
    uid: targetUid,
    fullName: fullName.trim() || 'Chief Academic Registrar',
    email: normalizedEmail,
    phone: '+94 77 123 4567',
    role: 'super_admin',
    status: 'active',
    createdAt: now,
    passwordHash: computedHash,
  };

  await setDoc(doc(db, 'users', targetUid), superAdminProfile);
  saveActiveUser(superAdminProfile);
  return { firebaseUser, userProfile: superAdminProfile };
}

/**
 * Sign out current user
 */
export async function logoutUserSession(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('Firebase Auth logout notice:', err);
  }
  saveActiveUser(null);
}

// -------------------------------------------------------------
// Admin & Student Management
// -------------------------------------------------------------

export async function toggleAdminStatusInFirestore(
  adminUid: string,
  currentStatus: 'active' | 'inactive'
): Promise<'active' | 'inactive'> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  await updateDoc(doc(db, 'users', adminUid), { status: newStatus });
  await updateDoc(doc(db, 'admins', adminUid), { status: newStatus });
  return newStatus;
}

export async function updateAdminDetailsInFirestore(
  adminUid: string,
  data: Partial<DbAdmin>
): Promise<void> {
  await updateDoc(doc(db, 'admins', adminUid), data);
  if (data.fullName || data.phone) {
    const userUpdates: Partial<DbUser> = {};
    if (data.fullName) userUpdates.fullName = data.fullName;
    if (data.phone) userUpdates.phone = data.phone;
    await updateDoc(doc(db, 'users', adminUid), userUpdates);
  }
}

// -------------------------------------------------------------
// Competitions Operations
// -------------------------------------------------------------

export async function saveCompetitionToFirestore(
  competition: Partial<DbCompetition> & { competitionId?: string; id?: string }
): Promise<void> {
  const targetId = competition.competitionId || competition.id;
  if (!targetId) {
    throw new Error('Missing competitionId for Firestore save operation');
  }
  const compRef = doc(db, 'competitions', targetId);
  const existingSnap = await getDoc(compRef);
  const now = new Date().toISOString();

  // Clean and sanitize all questions to ensure Firestore compatibility (no undefined values)
  const sanitizedQuestions = (competition.questions || []).map((q, idx) => ({
    id: q.id || `q-${idx + 1}`,
    type: q.type || 'multiple_choice',
    questionText: (q.questionText || '').trim(),
    options: Array.isArray(q.options) ? q.options.map((o) => String(o || '').trim()).filter(Boolean) : [],
    correctAnswer: String(q.correctAnswer || '').trim(),
    marks: typeof q.marks === 'number' && !isNaN(q.marks) ? q.marks : 1,
    order: typeof q.order === 'number' ? q.order : idx + 1,
    imageUrl: q.imageUrl || '',
    explanation: q.explanation || '',
  }));

  const calculatedTotalMarks =
    typeof competition.totalMarks === 'number' && !isNaN(competition.totalMarks)
      ? competition.totalMarks
      : sanitizedQuestions.reduce((acc, q) => acc + (q.marks || 0), 0);

  const record: DbCompetition = {
    competitionId: targetId,
    title: (competition.title || 'Untitled Competition').trim(),
    description: (competition.description || '').trim(),
    competitionType: competition.competitionType || 'Quiz',
    category: competition.category || 'General Knowledge',
    grade: competition.grade || 'Open',
    language: competition.language || 'English',
    duration: typeof competition.duration === 'number' ? competition.duration : 60,
    entryType: competition.entryType || 'Free',
    entryFee: typeof competition.entryFee === 'number' ? competition.entryFee : 0,
    prizesEnabled: competition.prizesEnabled ?? true,
    prizeDetails: competition.prizeDetails || {
      firstPrize: 'Gold Medal & Trophy',
      secondPrize: 'Silver Medal',
      thirdPrize: 'Bronze Medal',
      participationCertificate: 'E-Certificate of Participation',
    },
    registrationStart: competition.registrationStart || now,
    registrationEnd: competition.registrationEnd || now,
    competitionStart: competition.competitionStart || now,
    competitionEnd: competition.competitionEnd || now,
    competitionStartTime: competition.competitionStartTime || '09:00',
    competitionEndTime: competition.competitionEndTime || '18:00',
    status: competition.status || 'Draft',
    questions: sanitizedQuestions,
    questionsCount: sanitizedQuestions.length,
    totalMarks: calculatedTotalMarks,
    participants: competition.participants || [],
    enrolledCount: competition.enrolledCount || competition.participants?.length || 0,
    createdAt: existingSnap.exists()
      ? (existingSnap.data().createdAt || now)
      : now,
    code: competition.code || `HNC-${targetId.slice(0, 6).toUpperCase()}`,
    leadAdminId: competition.leadAdminId || 'adm-system',
    leadAdminName: competition.leadAdminName || 'Academic Staff',
    requireCameraVerification: Boolean(competition.requireCameraVerification),
    evaluationMode: competition.evaluationMode || 'Automated',
    membershipRequired: Boolean(competition.membershipRequired),
  };

  await setDoc(compRef, record, { merge: true });
}

export async function deleteCompetitionInFirestore(
  competitionId: string
): Promise<void> {
  if (!competitionId) return;
  const compRef = doc(db, 'competitions', competitionId);
  await deleteDoc(compRef);
}

export async function updateCompetitionStatusInFirestore(
  competitionId: string,
  status: CompetitionStatus
): Promise<void> {
  if (!competitionId) {
    console.warn('Cannot update status: missing competitionId');
    return;
  }
  const compRef = doc(db, 'competitions', competitionId);
  await updateDoc(compRef, { status });
}

// -------------------------------------------------------------
// Results Operations
// -------------------------------------------------------------

export async function saveResultToFirestore(
  result: DbResult
): Promise<void> {
  const resultRef = doc(db, 'results', result.resultId);
  await setDoc(resultRef, result, { merge: true });
}

export async function toggleResultPublishInFirestore(
  resultId: string,
  currentPublishStatus: string
): Promise<void> {
  const resultRef = doc(db, 'results', resultId);
  const newStatus = currentPublishStatus === 'published' ? 'draft' : 'published';
  await updateDoc(resultRef, { publishStatus: newStatus });
}

// -------------------------------------------------------------
// Realtime Subscriptions
// -------------------------------------------------------------

export function subscribeToCompetitions(
  callback: (competitions: DbCompetition[]) => void
): Unsubscribe {
  const compCol = collection(db, 'competitions');
  return onSnapshot(
    compCol,
    (snapshot) => {
      const items: DbCompetition[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as any;
        const validDocId = raw.competitionId || raw.id || docSnap.id;
        items.push({
          ...raw,
          competitionId: validDocId,
          id: validDocId,
        } as DbCompetition);
      });
      callback(items);
    },
    (error) => {
      console.warn('Competitions subscription notice:', error);
    }
  );
}

export function subscribeToResults(
  userRole: PortalRole,
  studentUid: string | undefined,
  callback: (results: DbResult[]) => void
): Unsubscribe {
  const resultsCol = collection(db, 'results');

  // If Student, enforce client-side matching query as required by security rules
  const q =
    userRole === 'student' && studentUid
      ? query(resultsCol, where('studentId', '==', studentUid))
      : resultsCol;

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DbResult[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DbResult);
      });
      callback(items);
    },
    (error) => {
      console.warn('Results subscription notice:', error);
    }
  );
}

export function subscribeToStudents(
  callback: (students: DbStudent[]) => void
): Unsubscribe {
  const studentsCol = collection(db, 'students');
  return onSnapshot(
    studentsCol,
    (snapshot) => {
      const items: DbStudent[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DbStudent);
      });
      callback(items);
    },
    (error) => {
      console.warn('Students subscription notice:', error);
    }
  );
}

export function subscribeToAdmins(
  callback: (admins: DbAdmin[]) => void
): Unsubscribe {
  const adminsCol = collection(db, 'admins');
  return onSnapshot(
    adminsCol,
    (snapshot) => {
      const items: DbAdmin[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DbAdmin);
      });
      callback(items);
    },
    (error) => {
      console.warn('Admins subscription notice:', error);
    }
  );
}

// -------------------------------------------------------------
// Student Attempts Operations (Phase 4)
// -------------------------------------------------------------

export async function saveAttemptToFirestore(attempt: DbAttempt): Promise<void> {
  const attemptRef = doc(db, 'attempts', attempt.attemptId);
  await setDoc(attemptRef, attempt, { merge: true });
}

export async function getStudentAttemptInFirestore(
  competitionId: string,
  studentId: string
): Promise<DbAttempt | null> {
  try {
    const attemptsCol = collection(db, 'attempts');
    const q = query(
      attemptsCol,
      where('competitionId', '==', competitionId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as DbAttempt;
    }
  } catch (err) {
    console.warn('Get student attempt error:', err);
  }
  return null;
}

export function subscribeToStudentAttempts(
  studentId: string,
  callback: (attempts: DbAttempt[]) => void
): Unsubscribe {
  const attemptsCol = collection(db, 'attempts');
  const q = query(attemptsCol, where('studentId', '==', studentId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DbAttempt[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DbAttempt);
      });
      callback(items);
    },
    (error) => {
      console.warn('Student attempts subscription notice:', error);
    }
  );
}

// -------------------------------------------------------------
// Competition Payments Operations (Phase 5)
// -------------------------------------------------------------

export async function savePaymentToFirestore(payment: DbPayment): Promise<void> {
  const payRef = doc(db, 'payments', payment.paymentId);
  await setDoc(payRef, payment, { merge: true });
}

export async function getStudentPaymentInFirestore(
  competitionId: string,
  studentId: string
): Promise<DbPayment | null> {
  try {
    const payCol = collection(db, 'payments');
    const q = query(
      payCol,
      where('competitionId', '==', competitionId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as DbPayment;
    }
  } catch (err) {
    console.warn('Get student payment error:', err);
  }
  return null;
}

export async function updatePaymentStatusInFirestore(
  paymentId: string,
  status: 'completed' | 'pending' | 'rejected',
  notes?: string
): Promise<void> {
  const q = query(collection(db, 'payments'), where('paymentId', '==', paymentId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docRef = snap.docs[0].ref;
    await updateDoc(docRef, { status, ...(notes ? { adminNotes: notes } : {}) });
  }
}

export function subscribeToPayments(
  userRole: PortalRole,
  studentUid: string | undefined,
  callback: (payments: DbPayment[]) => void
): Unsubscribe {
  const payCol = collection(db, 'payments');
  const q =
    userRole === 'student' && studentUid
      ? query(payCol, where('studentId', '==', studentUid))
      : payCol;

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DbPayment[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DbPayment);
      });
      callback(items);
    },
    (error) => {
      console.warn('Payments subscription notice:', error);
    }
  );
}

// -------------------------------------------------------------
// Exam Camera Verification Operations (Phase 5)
// -------------------------------------------------------------

export async function saveVerificationPhotoToFirestore(
  photo: DbVerificationPhoto
): Promise<void> {
  const photoRef = doc(db, 'verificationPhotos', photo.verificationId);
  await setDoc(photoRef, photo, { merge: true });
}

export async function getStudentVerificationPhotoInFirestore(
  competitionId: string,
  studentId: string
): Promise<DbVerificationPhoto | null> {
  try {
    const photoCol = collection(db, 'verificationPhotos');
    const q = query(
      photoCol,
      where('competitionId', '==', competitionId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as DbVerificationPhoto;
    }
  } catch (err) {
    console.warn('Get verification photo error:', err);
  }
  return null;
}

export function subscribeToVerificationPhotos(
  userRole: PortalRole,
  studentUid: string | undefined,
  callback: (photos: DbVerificationPhoto[]) => void
): Unsubscribe {
  const photoCol = collection(db, 'verificationPhotos');
  const q =
    userRole === 'student' && studentUid
      ? query(photoCol, where('studentId', '==', studentUid))
      : photoCol;

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DbVerificationPhoto[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DbVerificationPhoto);
      });
      callback(items);
    },
    (error) => {
      console.warn('Verification photos subscription notice:', error);
    }
  );
}

// -------------------------------------------------------------
// Live Exam Proctoring Functions
// -------------------------------------------------------------

export async function upsertLiveProctorSession(
  session: Partial<DbLiveProctorSession> & { sessionId: string }
): Promise<void> {
  try {
    const sessionRef = doc(db, 'liveProctorSessions', session.sessionId);
    await setDoc(sessionRef, {
      ...session,
      lastPingAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Live proctor session update note:', err);
  }
}

export function subscribeToLiveProctorSessions(
  callback: (sessions: DbLiveProctorSession[]) => void
): () => void {
  const colRef = collection(db, 'liveProctorSessions');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: DbLiveProctorSession[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DbLiveProctorSession);
      });
      items.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        return new Date(b.lastPingAt || b.startedAt).getTime() - new Date(a.lastPingAt || a.startedAt).getTime();
      });
      callback(items);
    },
    (error) => {
      console.warn('Live proctor sessions subscription notice:', error);
    }
  );
}

export function subscribeToSingleProctorSession(
  sessionId: string,
  callback: (session: DbLiveProctorSession | null) => void
): () => void {
  const docRef = doc(db, 'liveProctorSessions', sessionId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as DbLiveProctorSession);
      } else {
        callback(null);
      }
    },
    (err) => console.warn('Single proctor session subscription notice:', err)
  );
}

export async function sendProctorWarningToSession(
  sessionId: string,
  warning: ProctorWarning
): Promise<void> {
  try {
    const docRef = doc(db, 'liveProctorSessions', sessionId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const existing = (snap.data() as DbLiveProctorSession).warningsSent || [];
      await updateDoc(docRef, {
        warningsSent: [...existing, warning],
        lastPingAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Error sending proctor warning:', err);
  }
}

export async function flagProctorSession(
  sessionId: string,
  isFlagged: boolean,
  flagReason?: string
): Promise<void> {
  try {
    const docRef = doc(db, 'liveProctorSessions', sessionId);
    await updateDoc(docRef, {
      isFlagged,
      flagReason: flagReason || '',
      status: isFlagged ? 'flagged' : 'active',
      lastPingAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error flagging proctor session:', err);
  }
}

export async function closeLiveProctorSession(
  sessionId: string,
  finalStatus: 'completed' | 'timeout' = 'completed'
): Promise<void> {
  try {
    const docRef = doc(db, 'liveProctorSessions', sessionId);
    await updateDoc(docRef, {
      status: finalStatus,
      cameraActive: false,
      lastPingAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error closing proctor session:', err);
  }
}

// -------------------------------------------------------------
// Production Data Verification & Initial Accounts Seeding
// -------------------------------------------------------------

/**
 * Ensures standard test accounts (Super Admin, Academic Admin, Student Candidate)
 * and initial academic competitions exist in Cloud Firestore.
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const adminPassHash = await hashCredential('Admin@123456');

    // 1. Super Admin: freedomedupu@gmail.com
    const saDocRef = doc(db, 'users', 'sa_freedomedupu');
    const saSnap = await getDoc(saDocRef);
    if (!saSnap.exists() || !saSnap.data()?.passwordHash) {
      const saRecord: DbUser = {
        uid: 'sa_freedomedupu',
        fullName: 'Chief Academic Registrar (Super Admin)',
        email: 'freedomedupu@gmail.com',
        username: 'superadmin',
        phone: '+94 77 123 4567',
        role: 'super_admin',
        status: 'active',
        createdAt: now,
        passwordHash: adminPassHash,
      };
      await setDoc(saDocRef, saRecord, { merge: true });
    }

    // Purge legacy and sample demo data from Firestore (including demo ads)
    await purgeLegacyDemoFirestoreData();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hnc_seed_initialized', 'true');
    }
  } catch (err) {
    console.warn('Production initialization note:', err);
  }
}

/**
 * Removes all demo/sample competition IDs and test records from Firestore
 * so that students only see authentic competitions created by real administrators.
 */
export async function purgeLegacyDemoFirestoreData(): Promise<{ competitionsDeleted: number }> {
  // Always perform direct purge of student_kavitha_selvam, demo admins, and legacy demo records
  try {
    const kRef = doc(db, 'users', 'student_kavitha_selvam');
    await deleteDoc(kRef);
  } catch (_) {}
  try {
    const kSref = doc(db, 'students', 'student_kavitha_selvam');
    await deleteDoc(kSref);
  } catch (_) {}
  try {
    const adminDoc = doc(db, 'users', 'admin_dr_ananthi');
    await deleteDoc(adminDoc);
    const adminProf = doc(db, 'admins', 'admin_dr_ananthi');
    await deleteDoc(adminProf);
  } catch (_) {}

  // Purge demo advertisements from Firestore
  try {
    const demoAdIds = [
      'ad-ponder-sip-official',
      'ad-pondersip-official',
      'ad-hnc-scholarship',
      'ad-demo-1',
      'ad-demo-2',
    ];
    for (const adId of demoAdIds) {
      try {
        await deleteDoc(doc(db, 'advertisements', adId));
      } catch (_) {}
    }
  } catch (_) {}

  let competitionsDeleted = 0;
  try {
    const knownDemoCompIds = [
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
    ];

    const knownDemoCodes = new Set([
      'HNC-MATH-2026',
      'HNC-STEM-2026',
      'HNC-GR6-MATH-2026',
      'HNC-GR7-SCI-2026',
    ]);

    // 1. Direct document deletion for known demo IDs
    for (const id of knownDemoCompIds) {
      try {
        const compRef = doc(db, 'competitions', id);
        const snap = await getDoc(compRef);
        if (snap.exists()) {
          await deleteDoc(compRef);
          competitionsDeleted++;
        }
      } catch (_) {}
    }

    // 2. Scan competitions collection to delete any remaining demo competitions by code or title
    try {
      const compColRef = collection(db, 'competitions');
      const compSnap = await getDocs(compColRef);
      for (const d of compSnap.docs) {
        const data = d.data();
        const code = (data.code || '').toUpperCase();
        const title = (data.title || '').toLowerCase();
        const isDemoDoc =
          knownDemoCompIds.includes(d.id) ||
          knownDemoCodes.has(code) ||
          title.includes('national academic mathematics & logic olympiad 2026') ||
          title.includes('all-island science & stem olympiad 2026') ||
          title.includes('junior mathematics challenge 2026 (grade 6)') ||
          title.includes('junior science & environment quiz 2026 (grade 7)') ||
          title.includes('demo competition') ||
          title.includes('sample competition') ||
          title.includes('test competition');

        if (isDemoDoc) {
          await deleteDoc(d.ref);
          competitionsDeleted++;
        } else if (Array.isArray(data.questions)) {
          // Strip sample demo questions from real/user competitions in Firestore
          const cleaned = data.questions.filter((q: any) => {
            const text = (q?.questionText || '').toLowerCase();
            const qId = (q?.id || '').toLowerCase();
            const isSample =
              text.includes('red planet') ||
              text.includes('interior angles') ||
              text.includes('atomic number 6') ||
              text.includes('sound travels faster') ||
              text.includes('value of (2³') ||
              qId.startsWith('q-sample-') ||
              qId.startsWith('gk-q') ||
              qId.startsWith('math-q') ||
              qId.startsWith('sci-q');
            return !isSample;
          });
          if (cleaned.length !== data.questions.length) {
            await updateDoc(d.ref, {
              questions: cleaned,
              questionsCount: cleaned.length,
              totalMarks: cleaned.reduce((sum: number, item: any) => sum + (Number(item?.marks) || 0), 0),
            });
          }
        }
      }
    } catch (_) {}

    // 3. Purge legacy test results
    const legacyResIds = ['res-1', 'res-2', 'res-3', 'res-4', 'res-5', 'res-6', 'res-801', 'res-802', 'res-803', 'res-804'];
    for (const id of legacyResIds) {
      try {
        const resRef = doc(db, 'results', id);
        const snap = await getDoc(resRef);
        if (snap.exists()) {
          await deleteDoc(resRef);
        }
      } catch (_) {}
    }

    try {
      const resultsColRef = collection(db, 'results');
      const resultsSnap = await getDocs(resultsColRef);
      for (const d of resultsSnap.docs) {
        const rData = d.data();
        if (
          rData.studentId?.startsWith('std-') ||
          rData.studentId?.startsWith('sim-') ||
          rData.studentName?.includes('Alexander') ||
          rData.studentName?.includes('Elena Rostova') ||
          rData.studentName?.includes('David Oluwaseun') ||
          rData.studentName?.includes('Sophia Mei Lin') ||
          rData.studentName?.includes('Simulated')
        ) {
          await deleteDoc(d.ref);
        }
      }
    } catch (_) {}

    // 4. Purge legacy demo payments
    const legacyPaymentIds = ['PAY-SAMPLE-103'];
    for (const id of legacyPaymentIds) {
      try {
        const payRef = doc(db, 'payments', id);
        const snap = await getDoc(payRef);
        if (snap.exists()) {
          await deleteDoc(payRef);
        }
      } catch (_) {}
    }

    // 5. Purge demo student accounts
    const legacyUserIds = ['student_vimalan', 'student_kavitha_selvam'];
    for (const uid of legacyUserIds) {
      try {
        const uRef = doc(db, 'users', uid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          await deleteDoc(uRef);
        }
        const sRef = doc(db, 'students', uid);
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          await deleteDoc(sRef);
        }
      } catch (_) {}
    }

    try {
      const qUser = query(collection(db, 'users'), where('studentId', '==', 'STU-2026-1001'));
      const snapU = await getDocs(qUser);
      for (const d of snapU.docs) {
        await deleteDoc(d.ref);
      }
      const qStudent = query(collection(db, 'students'), where('studentId', '==', 'STU-2026-1001'));
      const snapS = await getDocs(qStudent);
      for (const d of snapS.docs) {
        await deleteDoc(d.ref);
      }
    } catch (_) {}

    // 6. Purge simulated live proctoring feeds
    try {
      const proctorColRef = collection(db, 'live_proctor_sessions');
      const proctorSnap = await getDocs(proctorColRef);
      for (const d of proctorSnap.docs) {
        const data = d.data();
        const sId = (data.sessionId || '').toLowerCase();
        const candId = (data.studentId || '').toLowerCase();
        const sName = (data.studentName || '').toLowerCase();
        if (
          d.id.startsWith('sim-') ||
          sId.startsWith('sim-') ||
          candId.startsWith('sim-') ||
          sName.includes('simulated') ||
          sName.includes('கவிநிலா') ||
          candId.includes('sim-cand')
        ) {
          await deleteDoc(d.ref);
        }
      }
    } catch (_) {}

    // 7. Purge demo announcements
    try {
      await purgeDemoAnnouncementsFromFirestore();
    } catch (_) {}

    // 8. Purge demo audit trail events
    try {
      const auditColRef = collection(db, 'audit_logs');
      const auditSnap = await getDocs(auditColRef);
      for (const d of auditSnap.docs) {
        const aData = d.data();
        if (
          d.id.startsWith('log-sys-') ||
          aData.actorName?.includes('Sivalingam') ||
          aData.actorName?.includes('Dr. T. Rajan') ||
          aData.target?.includes('comp-math-2026') ||
          aData.target?.includes('res-sci-2026')
        ) {
          await deleteDoc(d.ref);
        }
      }
    } catch (_) {}
  } catch (err) {
    console.warn('Demo purge note:', err);
  }
  return { competitionsDeleted };
}

/**
 * Public alias to purge demo data, invoked directly or from the admin panel
 */
export async function purgeAllDemoCompetitions(): Promise<{ competitionsDeleted: number }> {
  return await purgeLegacyDemoFirestoreData();
}

/**
 * Delete a student account and related records from Firestore
 */
export async function deleteStudentAccountFromFirestore(studentUid: string): Promise<void> {
  try {
    const sRef = doc(db, 'students', studentUid);
    await deleteDoc(sRef);
  } catch (err) {
    console.warn('Error deleting student record:', err);
  }

  try {
    const uRef = doc(db, 'users', studentUid);
    await deleteDoc(uRef);
  } catch (err) {
    console.warn('Error deleting user record:', err);
  }

  try {
    const attemptsCol = collection(db, 'attempts');
    const q = query(attemptsCol, where('studentId', '==', studentUid));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (_) {}
}

/**
 * Delete a competition result from Firestore
 */
export async function deleteResultFromFirestore(resultId: string): Promise<void> {
  try {
    const resRef = doc(db, 'results', resultId);
    await deleteDoc(resRef);
  } catch (err) {
    console.error('Error deleting result:', err);
    throw err;
  }
}

/**
 * Award points to student when sharing referral link or contest on WhatsApp/Social media
 */
export async function awardSharePointsInFirestore(studentUid: string): Promise<{ newPoints: number; newShares: number }> {
  try {
    const uRef = doc(db, 'users', studentUid);
    const uSnap = await getDoc(uRef);
    let pts = 0;
    let shares = 0;

    if (uSnap.exists()) {
      const uData = uSnap.data() as DbUser;
      pts = (uData.referralPoints || 0) + 10;
      shares = (uData.sharesCount || 0) + 1;
      await updateDoc(uRef, {
        referralPoints: pts,
        sharesCount: shares,
      });
    }

    try {
      const sRef = doc(db, 'students', studentUid);
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) {
        const sData = sSnap.data() as DbStudent;
        const sPts = (sData.referralPoints || 0) + 10;
        const sShares = (sData.sharesCount || 0) + 1;
        await updateDoc(sRef, {
          referralPoints: sPts,
          sharesCount: sShares,
        });
        pts = sPts;
        shares = sShares;
      }
    } catch {}

    return { newPoints: pts, newShares: shares };
  } catch (err) {
    console.warn('awardSharePoints error:', err);
    return { newPoints: 0, newShares: 0 };
  }
}

/**
 * Redeem referral points for perks (e.g. Free Competition Entry, Ambassador Certificate)
 */
export async function redeemPerkInFirestore(
  studentUid: string,
  perkId: string,
  cost: number
): Promise<{ success: boolean; newPoints: number; message?: string }> {
  try {
    const uRef = doc(db, 'users', studentUid);
    const uSnap = await getDoc(uRef);
    if (!uSnap.exists()) {
      return { success: false, newPoints: 0, message: 'User not found' };
    }
    const uData = uSnap.data() as DbUser;
    const currentPts = uData.referralPoints || 0;
    if (currentPts < cost) {
      return { success: false, newPoints: currentPts, message: 'Insufficient points' };
    }

    const currentPerks = uData.redeemedPerks || [];
    const newPerks = [...currentPerks, perkId];
    const newPts = currentPts - cost;

    await updateDoc(uRef, {
      referralPoints: newPts,
      redeemedPerks: newPerks,
    });

    try {
      const sRef = doc(db, 'students', studentUid);
      await updateDoc(sRef, {
        referralPoints: newPts,
        redeemedPerks: newPerks,
      });
    } catch {}

    return { success: true, newPoints: newPts };
  } catch (err: any) {
    return { success: false, newPoints: 0, message: err.message };
  }
}

/**
 * Adjust student reward points (Super Admin / Admin point management)
 */
export async function adjustStudentPointsInFirestore(
  studentUid: string,
  pointsDelta: number,
  _reason?: string
): Promise<{ success: boolean; newPoints: number }> {
  try {
    const uRef = doc(db, 'users', studentUid);
    const uSnap = await getDoc(uRef);
    let pts = 0;
    if (uSnap.exists()) {
      const uData = uSnap.data() as DbUser;
      pts = Math.max(0, (uData.referralPoints || 0) + pointsDelta);
      await updateDoc(uRef, { referralPoints: pts });
    }

    try {
      const sRef = doc(db, 'students', studentUid);
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) {
        const sData = sSnap.data() as DbStudent;
        const sPts = Math.max(0, (sData.referralPoints || 0) + pointsDelta);
        await updateDoc(sRef, { referralPoints: sPts });
        pts = sPts;
      }
    } catch {}

    return { success: true, newPoints: pts };
  } catch (err) {
    console.error('adjustStudentPoints error:', err);
    return { success: false, newPoints: 0 };
  }
}

// -------------------------------------------------------------
// Announcements & Points/Referral Broadcasts
// -------------------------------------------------------------

export const DEFAULT_ANNOUNCEMENTS: DbAnnouncement[] = [];

// -------------------------------------------------------------
// Firestore Error Handling (Structured JSON for Security Diagnostics)
// -------------------------------------------------------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Save new announcement to Firestore
 */
export async function saveAnnouncementToFirestore(
  data: Omit<DbAnnouncement, 'id'>
): Promise<string> {
  const path = 'announcements';
  try {
    const annCol = collection(db, 'announcements');
    const annDoc = doc(annCol);
    const annObj: DbAnnouncement = {
      ...data,
      id: annDoc.id,
    };
    await setDoc(annDoc, annObj);
    return annDoc.id;
  } catch (err: any) {
    console.error('saveAnnouncement error:', err);
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    throw err;
  }
}

/**
 * Update an existing announcement in Firestore
 */
export async function updateAnnouncementInFirestore(
  annId: string,
  updates: Partial<DbAnnouncement>
): Promise<void> {
  const path = `announcements/${annId}`;
  try {
    const annRef = doc(db, 'announcements', annId);
    await updateDoc(annRef, updates);
  } catch (err: any) {
    console.error('updateAnnouncement error:', err);
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
    throw err;
  }
}

/**
 * Delete an announcement from Firestore
 */
export async function deleteAnnouncementFromFirestore(annId: string): Promise<void> {
  const path = `announcements/${annId}`;
  try {
    const annRef = doc(db, 'announcements', annId);
    await deleteDoc(annRef);
  } catch (err: any) {
    console.error('deleteAnnouncement error:', err);
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
    throw err;
  }
}

/**
 * Realtime subscription to announcements - purely listens to Firestore (no dummy/demo data)
 */
export function subscribeToAnnouncements(
  callback: (announcements: DbAnnouncement[]) => void
): Unsubscribe {
  const annCol = collection(db, 'announcements');
  const q = query(annCol, orderBy('publishedAt', 'desc'));

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const list: DbAnnouncement[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          titleTa: data.titleTa,
          titleSi: data.titleSi,
          content: data.content || '',
          contentTa: data.contentTa,
          contentSi: data.contentSi,
          category: data.category || 'general',
          targetAudience: data.targetAudience || 'all',
          pointsReward: data.pointsReward,
          badgeText: data.badgeText,
          badgeTextTa: data.badgeTextTa,
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          actionLabelTa: data.actionLabelTa,
          isPinned: !!data.isPinned,
          publishedAt: data.publishedAt || new Date().toISOString(),
          publishedBy: data.publishedBy || 'system',
          authorName: data.authorName || 'HNC Administration',
          expiresAt: data.expiresAt,
        };
      });

      callback(list);
    },
    (err) => {
      console.warn('Announcements subscription error:', err);
      callback([]);
    }
  );

  return unsub;
}

/**
 * Delete demo announcements from Firestore so only real official announcements remain
 */
export async function purgeDemoAnnouncementsFromFirestore(): Promise<number> {
  const path = 'announcements';
  try {
    const annCol = collection(db, 'announcements');
    const snapshot = await getDocs(annCol);
    let deletedCount = 0;

    const demoPatterns = [
      'ann-double-points-bonus',
      'ann-redeem-free-entry',
      'ann-ref-points-welcome',
      'ann-referral-launch',
      'ann-milestone-',
      'demo',
      'sample',
      'test',
    ];

    for (const d of snapshot.docs) {
      const data = d.data();
      const id = d.id.toLowerCase();
      const title = (data.title || '').toLowerCase();

      const isDemo =
        demoPatterns.some((pattern) => id.includes(pattern)) ||
        title.includes('double points') ||
        title.includes('demo') ||
        title.includes('sample') ||
        title.includes('test announcement') ||
        (id === 'ann-ref-points-welcome' && data.pointsReward === 50);

      if (isDemo) {
        await deleteDoc(doc(db, 'announcements', d.id));
        deletedCount++;
      }
    }
    return deletedCount;
  } catch (err: any) {
    console.error('purgeDemoAnnouncements error:', err);
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
    throw err;
  }
}

/**
 * Seed or replace official announcements if requested
 */
export async function seedOfficialAnnouncementsToFirestore(): Promise<void> {
  return;
}

// =============================================================
// PHASE 07: MONTHLY MEMBERSHIP & PAYMENT FIRESTORE SERVICES
// =============================================================

/**
 * Save or update a student membership document in Firestore
 */
export async function saveMembershipInFirestore(membership: DbMembership): Promise<void> {
  const path = `memberships/${membership.studentId}`;
  try {
    const memRef = doc(db, 'memberships', membership.studentId);
    await setDoc(memRef, {
      ...membership,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err: any) {
    console.error('Error saving membership:', err);
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    throw err;
  }
}

/**
 * Fetch a student's membership record from Firestore
 */
export async function getMembershipInFirestore(studentId: string): Promise<DbMembership | null> {
  try {
    const memRef = doc(db, 'memberships', studentId);
    const snap = await getDoc(memRef);
    if (snap.exists()) {
      return snap.data() as DbMembership;
    }
    return null;
  } catch (err) {
    console.error('Error fetching membership:', err);
    return null;
  }
}

/**
 * Fetch all memberships for Super Admin overview
 */
export async function getAllMembershipsInFirestore(): Promise<DbMembership[]> {
  try {
    const memCol = collection(db, 'memberships');
    const snap = await getDocs(memCol);
    return snap.docs.map((d) => d.data() as DbMembership);
  } catch (err) {
    console.error('Error fetching all memberships:', err);
    return [];
  }
}

/**
 * Submit a student membership payment request
 */
export async function submitMembershipPaymentInFirestore(payment: DbMembershipPayment): Promise<DbMembershipPayment> {
  const path = `membershipPayments/${payment.id}`;
  try {
    const payRef = doc(db, 'membershipPayments', payment.id);
    await setDoc(payRef, payment);

    // Also update student's membership status to 'pending'
    const memRef = doc(db, 'memberships', payment.studentId);
    const memSnap = await getDoc(memRef);
    const nowIso = new Date().toISOString();

    if (memSnap.exists()) {
      await updateDoc(memRef, {
        status: 'pending',
        paymentStatus: 'pending',
        paymentReference: payment.paymentReference,
        updatedAt: nowIso,
      });
    } else {
      const newMem: DbMembership = {
        id: payment.studentId,
        studentId: payment.studentId,
        studentName: payment.studentName,
        studentEmail: payment.studentEmail,
        status: 'pending',
        planName: 'Monthly Membership',
        monthlyFee: payment.amount,
        paymentStatus: 'pending',
        paymentReference: payment.paymentReference,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await setDoc(memRef, newMem);
    }

    return payment;
  } catch (err: any) {
    console.error('Error submitting membership payment:', err);
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    throw err;
  }
}

/**
 * Get all membership payment records
 */
export async function getAllMembershipPaymentsInFirestore(): Promise<DbMembershipPayment[]> {
  try {
    const payCol = collection(db, 'membershipPayments');
    const snap = await getDocs(payCol);
    const payments = snap.docs.map((d) => d.data() as DbMembershipPayment);
    return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching membership payments:', err);
    return [];
  }
}

/**
 * Review (Approve or Reject) a membership payment request by Super Admin
 */
export async function reviewMembershipPaymentInFirestore(
  paymentId: string,
  status: 'approved' | 'rejected',
  reviewerName: string,
  notes?: string
): Promise<void> {
  const path = `membershipPayments/${paymentId}`;
  try {
    const payRef = doc(db, 'membershipPayments', paymentId);
    const paySnap = await getDoc(payRef);
    if (!paySnap.exists()) {
      throw new Error('Payment record not found');
    }

    const payData = paySnap.data() as DbMembershipPayment;
    const now = new Date();
    const nowIso = now.toISOString();

    await updateDoc(payRef, {
      status,
      reviewedBy: reviewerName,
      reviewedAt: nowIso,
      notes: notes || '',
    });

    const memRef = doc(db, 'memberships', payData.studentId);
    const memSnap = await getDoc(memRef);

    if (status === 'approved') {
      // Calculate start and expiry dates (default 30 days)
      const durationDays = payData.membershipPeriodDays || 30;
      let startDate = now;

      // If existing membership is active and not expired, extend from existing expiry date
      if (memSnap.exists()) {
        const existingMem = memSnap.data() as DbMembership;
        if (existingMem.expiryDate && new Date(existingMem.expiryDate).getTime() > now.getTime()) {
          startDate = new Date(existingMem.expiryDate);
        }
      }

      const expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const historyItem = {
        id: `m-hist-${Date.now()}`,
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        amount: payData.amount,
        paymentReference: payData.paymentReference,
        approvedAt: nowIso,
      };

      const existingHistory = memSnap.exists() ? (memSnap.data().history || []) : [];

      await setDoc(
        memRef,
        {
          id: payData.studentId,
          studentId: payData.studentId,
          studentName: payData.studentName,
          studentEmail: payData.studentEmail,
          status: 'active',
          planName: 'Monthly Membership',
          monthlyFee: payData.amount,
          startDate: startDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          paymentStatus: 'active',
          paymentReference: payData.paymentReference,
          updatedAt: nowIso,
          history: [historyItem, ...existingHistory],
        },
        { merge: true }
      );
    } else {
      // If rejected, set status back to inactive or keep expired
      if (memSnap.exists()) {
        const existingMem = memSnap.data() as DbMembership;
        const isCurrentlyActive =
          existingMem.expiryDate && new Date(existingMem.expiryDate).getTime() > now.getTime();
        await updateDoc(memRef, {
          status: isCurrentlyActive ? 'active' : 'inactive',
          paymentStatus: 'rejected',
          updatedAt: nowIso,
        });
      }
    }
  } catch (err: any) {
    console.error('Error reviewing membership payment:', err);
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    throw err;
  }
}

/**
 * Get Membership Settings from Firestore platform document
 */
export async function getMembershipSettingsInFirestore(): Promise<MembershipSettings> {
  const defaultSettings: MembershipSettings = {
    enabled: true,
    monthlyFeeLkr: 1500,
    durationDays: 30,
    accessRulesNote: 'Active monthly membership is required for premium competitions.',
  };

  try {
    const setRef = doc(db, 'settings', 'platform');
    const snap = await getDoc(setRef);
    if (snap.exists() && snap.data().membershipSettings) {
      return { ...defaultSettings, ...snap.data().membershipSettings };
    }
    return defaultSettings;
  } catch (err: any) {
    if (err?.code === 'unavailable' || String(err?.message || '').toLowerCase().includes('offline')) {
      console.warn('Firestore offline or reconnecting, applying default membership settings.');
    } else {
      console.error('Error fetching membership settings:', err);
    }
    return defaultSettings;
  }
}

/**
 * Save Membership Settings in Firestore platform document
 */
export async function saveMembershipSettingsInFirestore(settings: MembershipSettings): Promise<void> {
  const path = 'settings/platform';
  try {
    const setRef = doc(db, 'settings', 'platform');
    await setDoc(
      setRef,
      {
        membershipSettings: settings,
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error('Error saving membership settings:', err);
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    throw err;
  }
}

/**
 * -------------------------------------------------------------
 * Advertisement & Sponsor Billboard Management
 * Super Admin & Admin managed sponsor campaigns
 * -------------------------------------------------------------
 */

export function subscribeToAdvertisements(
  callback: (ads: DbAdvertisement[]) => void
): Unsubscribe {
  const adCol = collection(db, 'advertisements');

  // Fetch all documents from 'advertisements' collection without composite index constraint
  const unsub = onSnapshot(
    adCol,
    (snapshot) => {
      const list: DbAdvertisement[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          brandName: data.brandName || 'Sponsor',
          title: data.title || '',
          tagline: data.tagline || '',
          description: data.description || '',
          badgeText: data.badgeText || 'SPONSORED',
          category: data.category || 'General',
          imageUrl: data.imageUrl || '',
          videoUrl: data.videoUrl || '',
          mediaType: data.mediaType || (data.videoUrl ? 'video' : 'image'),
          promoCode: data.promoCode || '',
          discountPercentage: data.discountPercentage,
          actionButtonText: data.actionButtonText || 'Explore Offer',
          actionUrl: data.actionUrl || '',
          menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
          targetAudience: data.targetAudience || 'all',
          status: data.status || 'active',
          priority: data.priority ?? 1,
          startDate: data.startDate,
          endDate: data.endDate,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          clicksCount: data.clicksCount || 0,
        };
      });

      // Sort by createdAt descending in memory
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      console.log(
        `[AD_DIAGNOSTIC_LOG] [${new Date().toISOString()}] Firestore 'advertisements' sync active. Total docs: ${list.length}. Active docs: ${list.filter((x) => x.status === 'active').length}`,
        list.map((ad) => ({ id: ad.id, brand: ad.brandName, status: ad.status, mediaType: ad.mediaType }))
      );

      callback(list);
    },
    (err) => {
      console.warn('[AD_DIAGNOSTIC_LOG] Advertisements subscription error:', err);
      callback([]);
    }
  );

  return unsub;
}

export async function saveAdvertisementToFirestore(ad: DbAdvertisement): Promise<void> {
  const path = 'advertisements';
  try {
    const adId = ad.id || `ad-${Date.now()}`;

    // 1. Offload large media data (videos or heavy images) to IndexedDB cache
    if (ad.videoUrl && ad.videoUrl.length > 50_000) {
      await storeMediaInIndexedDB(`ad_video_${adId}`, ad.videoUrl);
    }
    if (ad.imageUrl && ad.imageUrl.length > 400_000) {
      await storeMediaInIndexedDB(`ad_image_${adId}`, ad.imageUrl);
    }

    const cleanAd: DbAdvertisement = {
      ...ad,
      id: adId,
      updatedAt: new Date().toISOString(),
      createdAt: ad.createdAt || new Date().toISOString(),
    };

    // 2. Safeguard: Measure serialized payload size to never exceed Firestore 1MB limit (1,048,576 bytes)
    let payloadSize = estimateObjectByteSize(cleanAd);
    let docToWrite: DbAdvertisement = { ...cleanAd };

    // If payload exceeds 700KB, strip large Base64 media from cloud document
    if (payloadSize > 700_000) {
      if (docToWrite.videoUrl && docToWrite.videoUrl.length > 50_000) {
        docToWrite.videoUrl = `local-media:${adId}`;
      }
      payloadSize = estimateObjectByteSize(docToWrite);

      if (payloadSize > 700_000 && docToWrite.imageUrl && docToWrite.imageUrl.length > 100_000) {
        docToWrite.imageUrl = `local-media:${adId}`;
      }
    }

    try {
      await setDoc(doc(db, 'advertisements', adId), docToWrite, { merge: true });
    } catch (writeErr: any) {
      const msg = String(writeErr?.message || '');
      // Resilient fallback: If document size is still flagged by Firestore backend, strip heavy fields completely
      if (msg.includes('exceeds the maximum allowed size') || msg.includes('1,048,576 bytes')) {
        console.warn('Document payload exceeded Firestore 1MB limit. Offloading media to local vault...');
        const leanDoc: DbAdvertisement = {
          ...docToWrite,
          videoUrl: docToWrite.videoUrl?.startsWith('http') ? docToWrite.videoUrl : `local-media:${adId}`,
          imageUrl: docToWrite.imageUrl?.startsWith('http') ? docToWrite.imageUrl : `local-media:${adId}`,
        };
        await setDoc(doc(db, 'advertisements', adId), leanDoc, { merge: true });
      } else {
        throw writeErr;
      }
    }
  } catch (err: any) {
    console.error('saveAdvertisement error:', err);
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    throw err;
  }
}

export async function deleteAdvertisementInFirestore(adId: string): Promise<void> {
  const path = `advertisements/${adId}`;
  try {
    await deleteDoc(doc(db, 'advertisements', adId));
    // Also clean up any cached local media
    await deleteMediaFromIndexedDB(`ad_video_${adId}`);
    await deleteMediaFromIndexedDB(`ad_image_${adId}`);
  } catch (err: any) {
    console.error('deleteAdvertisement error:', err);
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
    throw err;
  }
}

export async function toggleAdvertisementStatusInFirestore(
  adId: string,
  newStatus: 'active' | 'inactive'
): Promise<void> {
  const path = `advertisements/${adId}`;
  try {
    await updateDoc(doc(db, 'advertisements', adId), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('toggleAdvertisementStatus error:', err);
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
    throw err;
  }
}

export async function incrementAdClicksInFirestore(adId: string): Promise<void> {
  try {
    const adRef = doc(db, 'advertisements', adId);
    const snap = await getDoc(adRef);
    if (snap.exists()) {
      const currentClicks = snap.data().clicksCount || 0;
      await updateDoc(adRef, { clicksCount: currentClicks + 1 });
    }
  } catch (err) {
    console.warn('incrementAdClicks error:', err);
  }
}





