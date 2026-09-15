import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'collegefinance-87409',
  authDomain: 'collegefinance-87409.firebaseapp.com',
  storageBucket: 'collegefinance-87409.appspot.com',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
