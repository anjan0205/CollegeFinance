import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Firebase web app configuration loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'collegefinance-87409',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with IndexedDB Multi-Tab Persistent Cache for instant reads and offline resilience
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  // If already initialized in the runtime, reuse instance
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

// Firestore security rules require an authenticated request (request.auth != null).
// The app's own login is mocked, so we establish a Firebase Anonymous session for
// the SDK. `authReady` resolves once we have a user — or after a short timeout, so
// the app still falls back to embedded data if anonymous auth is unavailable.
export const authReady: Promise<void> = new Promise((resolve) => {
  let settled = false;
  const done = () => {
    if (!settled) {
      settled = true;
      resolve();
    }
  };

  onAuthStateChanged(auth, (user) => {
    if (user) done();
  });

  signInAnonymously(auth).catch((e) => {
    console.error(
      '[firebase] Anonymous sign-in failed. Enable the Anonymous provider under ' +
        'Firebase Console → Authentication → Sign-in method.',
      e
    );
    done();
  });

  // Short non-blocking timeout for initial auth settlement
  setTimeout(done, 1200);
});
