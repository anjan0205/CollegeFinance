import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Full web app config
const firebaseConfig = {
  apiKey: 'AIzaSyC3du30zsCt2pclFhNPdV9lD2I_QR7-E3Y',
  authDomain: 'collegefinance-87409.firebaseapp.com',
  projectId: 'collegefinance-87409',
  storageBucket: 'collegefinance-87409.firebasestorage.app',
  messagingSenderId: '954060858433',
  appId: '1:954060858433:web:55c1fb92b2ce2612c752c0',
  measurementId: 'G-CMHJD4EDPZ',
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
