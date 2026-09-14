import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Global guard for Firebase Auth internal assertion bug when popup is closed/blocked in iframe
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg =
      reason?.message ||
      (typeof reason === 'string' ? reason : '') ||
      String(reason || '');
    if (
      msg.includes('Pending promise was never set') ||
      msg.includes('auth/popup-closed-by-user') ||
      msg.includes('auth/cancelled-popup-request')
    ) {
      event.preventDefault();
      // Silently prevent internal assertion crash from bubbling to error logger
    }
  });
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the configured database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

let authInstance: ReturnType<typeof getAuth>;
try {
  // getAuth requires an apiKey if Auth is configured on the Firebase project
  authInstance = getAuth(app);
} catch (authInitError) {
  console.warn('Firebase Auth initialization fallback (no apiKey or auth disabled):', authInitError);
  authInstance = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
  } as unknown as ReturnType<typeof getAuth>;
}
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Connection verification test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // Expected to fail with permission denied on 'test/connection' due to strict default deny rules,
    // which proves the server is reachable and active.
    return true;
  }
}

// Error Handling Infrastructure conforming strictly to SKILL.md
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
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

// User Profile Record
export async function syncUserProfile(user: User, customEmail?: string): Promise<void> {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  const effectiveEmail = customEmail || user.email || '';
  try {
    await setDoc(
      userRef,
      {
        userId: user.uid,
        email: effectiveEmail,
        displayName: user.displayName || effectiveEmail.split('@')[0] || 'User',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sent Email persistence
export interface FirestoreSentMail {
  id: string;
  userId: string;
  email: string;
  subject: string;
  body: string;
  timestamp: string;
  isGmailSkipped: boolean;
  resumeName?: string;
  transcriptName?: string;
}

export async function saveSentMailToFirestore(
  userId: string,
  mail: Omit<FirestoreSentMail, 'userId'>
): Promise<void> {
  // CRITICAL: Only write to Firestore when an authenticated Firebase user matches the userId
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const sanitizedId = mail.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/sent_mails/${sanitizedId}`;
  try {
    const docRef = doc(db, 'users', userId, 'sent_mails', sanitizedId);
    await setDoc(docRef, {
      id: sanitizedId,
      userId,
      email: mail.email,
      subject: mail.subject,
      body: mail.body,
      timestamp: mail.timestamp,
      isGmailSkipped: !!mail.isGmailSkipped,
      resumeName: mail.resumeName || '',
      transcriptName: mail.transcriptName || '',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSentMailFromFirestore(
  userId: string,
  mailId: string
): Promise<void> {
  // CRITICAL: Only delete from Firestore when an authenticated Firebase user matches the userId
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `users/${userId}/sent_mails/${mailId}`;
  try {
    const docRef = doc(db, 'users', userId, 'sent_mails', mailId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllSentMailsFromFirestore(userId: string): Promise<void> {
  // CRITICAL: Only clear Firestore records when an authenticated Firebase user matches the userId
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `users/${userId}/sent_mails`;
  try {
    const colRef = collection(db, 'users', userId, 'sent_mails');
    const snap = await getDocs(colRef);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Campaign Settings & Pending Queue persistence
export interface FirestoreCampaignSetting {
  userId: string;
  subject: string;
  body: string;
  pendingEmails: string[];
  dontSendToGmail: boolean;
  updatedAt: string;
}

export async function saveCampaignSettingToFirestore(
  userId: string,
  setting: Omit<FirestoreCampaignSetting, 'userId' | 'updatedAt'>
): Promise<void> {
  // CRITICAL: Only write to Firestore when an authenticated Firebase user matches the userId
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `users/${userId}/settings/campaign`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'campaign');
    await setDoc(
      docRef,
      {
        userId,
        subject: setting.subject || '',
        body: setting.body || '',
        pendingEmails: setting.pendingEmails || [],
        dontSendToGmail: !!setting.dontSendToGmail,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Safe Google Sign-In with robust popup handling
export async function signInWithGoogleSafe(): Promise<{
  user: User | null;
  error?: string;
  isPopupCancelled?: boolean;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    if (
      errorObj?.code === 'auth/popup-closed-by-user' ||
      errorObj?.code === 'auth/cancelled-popup-request' ||
      errorObj?.message?.includes('popup-closed-by-user')
    ) {
      console.info('Google sign-in popup was dismissed by the user.');
      return { user: null, isPopupCancelled: true };
    }
    if (errorObj?.code === 'auth/popup-blocked') {
      return {
        user: null,
        error: 'Popup was blocked by your browser/iframe sandbox. Please use 1-click test sign-in below.',
      };
    }
    if (errorObj?.code === 'auth/invalid-api-key' || errorObj?.code === 'auth/operation-not-allowed') {
      return {
        user: null,
        error: 'Firebase Auth is pending activation for this project. Please use 1-click test sign-in below to continue immediately.',
      };
    }
    return {
      user: null,
      error: errorObj?.message || 'Google authentication encountered an unexpected error.',
    };
  }
}

// Authenticate via Anonymous session or linked profile for 1-click test emails
export async function signInWithPresetOrEmail(
  email: string,
  displayName?: string
): Promise<{ user: User | null; uid: string }> {
  try {
    let currentUser = auth?.currentUser;
    if (!currentUser && auth && typeof auth === 'object') {
      try {
        const cred = await signInAnonymously(auth);
        currentUser = cred.user;
      } catch (anonErr) {
        console.info('Firebase anonymous auth note:', anonErr);
      }
    }
    if (currentUser) {
      try {
        await updateProfile(currentUser, {
          displayName: displayName || email.split('@')[0] || 'User',
        });
      } catch {
        // non-blocking
      }
      await syncUserProfile(currentUser, email);
      return { user: currentUser, uid: currentUser.uid };
    }
  } catch (e) {
    console.info('Firebase local session note:', e);
  }
  // Fallback sanitized UID for offline/local-only mode
  const localUid = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  return { user: null, uid: localUid };
}

export { onAuthStateChanged, signInWithPopup, signInAnonymously, signOut };
