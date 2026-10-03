import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, setLogLevel } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence internal offline/retry warnings from logging unhandled errors to console
try {
  setLogLevel('silent');
} catch {
  // Ignored if already configured
}

// Initialize the primary Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore with resilient auto-detect long-polling
let firestoreInstance: Firestore;
const configDbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-hnceduhub-87cf124f-0cc7-41e5-bd50-84681e12383b';
try {
  const settings = {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  };
  firestoreInstance = configDbId
    ? initializeFirestore(app, settings, configDbId)
    : initializeFirestore(app, settings);
} catch {
  firestoreInstance = configDbId
    ? getFirestore(app, configDbId)
    : getFirestore(app);
}

export const db = firestoreInstance;
let storageInstance: FirebaseStorage | null = null;
try {
  storageInstance = getStorage(app);
} catch (e) {
  console.warn('Firebase storage initialization note:', e);
}
export const storage = storageInstance;
export { firebaseConfig, app };
