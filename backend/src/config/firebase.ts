import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const projectId = 'collegefinance-87409-service';
let isInitialized = false;
let db: Firestore | null = null;

export function initializeFirebase(): boolean {
  if (isInitialized) return true;

  try {
    const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
    const hasServiceAccount = fs.existsSync(serviceAccountPath);
    const hasGoogleCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

    if (!hasServiceAccount && !hasGoogleCreds && !hasEmulator) {
      console.log('[Firebase] No credentials found (serviceAccountKey.json or GOOGLE_APPLICATION_CREDENTIALS) and FIRESTORE_EMULATOR_HOST is not set.');
      console.log('[Firebase] Skipping Firebase initialization. Running in Fallback Mode (Local Excel / SQLite).');
      isInitialized = false;
      db = null;
      return false;
    }

    if (hasServiceAccount) {
      console.log(`[Firebase] Initializing with service account key: ${serviceAccountPath}`);
      initializeApp({
        credential: cert(serviceAccountPath),
        projectId
      });
      isInitialized = true;
    } else if (hasGoogleCreds) {
      console.log(`[Firebase] Initializing with GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
      initializeApp({
        credential: applicationDefault(),
        projectId
      });
      isInitialized = true;
    } else if (hasEmulator) {
      console.log(`[Firebase] Initializing in Emulator Mode (Host: ${process.env.FIRESTORE_EMULATOR_HOST})`);
      initializeApp({
        projectId
      });
      isInitialized = true;
    }

    db = getFirestore();
    db.settings({ ignoreUndefinedProperties: true });
    
    console.log(`[Firebase] Successfully connected to project: ${projectId}`);
    return true;
  } catch (error: any) {
    console.error(`[Firebase Initialization Error] Failed to initialize Firebase: ${error.message}`);
    console.log('[Firebase] Running in Fallback Mode (Local Excel / SQLite).');
    isInitialized = false;
    db = null;
    return false;
  }
}

export function getFirestoreDb(): Firestore | null {
  if (!isInitialized) {
    initializeFirebase();
  }
  return db;
}

export function isFirebaseEnabled(): boolean {
  return isInitialized && db !== null;
}
