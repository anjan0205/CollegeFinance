import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const projectId = 'collegefinance-87409';
let isInitialized = false;
let db: Firestore | null = null;

export function initializeFirebase(): boolean {
  if (isInitialized) return true;

  try {
    let serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      const doubleExtPath = path.resolve(__dirname, '../../serviceAccountKey.json.json');
      if (fs.existsSync(doubleExtPath)) {
        serviceAccountPath = doubleExtPath;
      }
    }
    const hasServiceAccount = fs.existsSync(serviceAccountPath);
    const hasEnvJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const hasEnvBase64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const hasGoogleCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

    const cliConfigPath = path.join(process.env.USERPROFILE || 'C:\\Users\\LENOVO', '.config', 'configstore', 'firebase-tools.json');
    const hasCliAuth = fs.existsSync(cliConfigPath);

    const isFirebaseEnv = !!(process.env.FIREBASE_CONFIG || process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.GCP_PROJECT);

    if (isFirebaseEnv) {
      console.log(`[Firebase] Initializing in Cloud Function / Firebase Cloud environment...`);
      initializeApp();
      db = getFirestore();
      isInitialized = true;
      if (db) {
        db.settings({ ignoreUndefinedProperties: true });
      }
      return true;
    }

    if (!hasServiceAccount && !hasEnvJson && !hasEnvBase64 && !hasGoogleCreds && !hasEmulator && !hasCliAuth) {
      console.log('[Firebase] No credentials found (serviceAccountKey.json, FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, or CLI tokens) and FIRESTORE_EMULATOR_HOST is not set.');
      console.log('[Firebase] Skipping Firebase initialization. Running in Fallback Mode (Local Excel / SQLite).');
      isInitialized = false;
      db = null;
      return false;
    }

    if (hasServiceAccount) {
      console.log(`[Firebase] Initializing with service account key: ${serviceAccountPath}`);
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      const actualProjectId = serviceAccount.project_id || projectId;
      console.log(`[Firebase] Detected project ID: ${actualProjectId}`);
      initializeApp({
        credential: cert(serviceAccountPath),
        projectId: actualProjectId
      });
      db = getFirestore();
      isInitialized = true;
    } else if (hasEnvJson) {
      console.log(`[Firebase] Initializing with FIREBASE_SERVICE_ACCOUNT_JSON environment variable...`);
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
      const actualProjectId = serviceAccount.project_id || projectId;
      initializeApp({
        credential: cert(serviceAccount),
        projectId: actualProjectId
      });
      db = getFirestore();
      isInitialized = true;
    } else if (hasEnvBase64) {
      console.log(`[Firebase] Initializing with FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable...`);
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(decoded);
      const actualProjectId = serviceAccount.project_id || projectId;
      initializeApp({
        credential: cert(serviceAccount),
        projectId: actualProjectId
      });
      db = getFirestore();
      isInitialized = true;
    } else if (hasGoogleCreds) {
      console.log(`[Firebase] Initializing with GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
      initializeApp({
        credential: applicationDefault(),
        projectId
      });
      db = getFirestore();
      isInitialized = true;
    } else if (hasEmulator) {
      console.log(`[Firebase] Initializing in Emulator Mode (Host: ${process.env.FIRESTORE_EMULATOR_HOST})`);
      initializeApp({
        projectId
      });
      db = getFirestore();
      isInitialized = true;
    } else if (hasCliAuth) {
      console.log(`[Firebase] Initializing with Firebase CLI OAuth tokens from ${cliConfigPath}...`);
      const cliConfig = JSON.parse(fs.readFileSync(cliConfigPath, 'utf8'));
      const { OAuth2Client } = require('google-auth-library');
      const FIREBASE_CLIENT_ID = process.env.FIREBASE_CLI_CLIENT_ID || '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
      const FIREBASE_CLIENT_SECRET = process.env.FIREBASE_CLI_CLIENT_SECRET || 'eA_rDFbc3VQzn1hvWx08172c';

      const oauthClient = new OAuth2Client(FIREBASE_CLIENT_ID, FIREBASE_CLIENT_SECRET);
      oauthClient.setCredentials({
        refresh_token: cliConfig.tokens?.refresh_token,
        access_token: cliConfig.tokens?.access_token
      });

      db = new Firestore({
        projectId,
        authClient: oauthClient
      });
      isInitialized = true;
    }

    if (db) {
      db.settings({ ignoreUndefinedProperties: true });
    }
    
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

