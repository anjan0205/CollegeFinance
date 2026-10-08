import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { initializeDatabasePool, closeDatabasePool } from './config/database';
import { isFirebaseDatasetLoaded, loadSeedData, syncDataFromFirebase, syncDataFromPostgres } from './utils/seedData';
import { initializeFirebase, isFirebaseEnabled } from './config/firebase';
import { initializeSqlDatabase } from './config/sqlDatabase';
import { initializePostgres, closePostgresPool } from './config/postgresDatabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
try {
  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.log('[Uploads Dir] Skipping directory creation (read-only environment).');
}

// Security & Body Parsing Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Shared startup promise prevents the first HTTP request from starting a second
// full Firestore hydration while the server boot sequence is already syncing.
let serverInitPromise: Promise<void> | null = null;
async function ensureServerInitialized() {
  if (!serverInitPromise) {
    serverInitPromise = (async () => {
      console.log('[Server Initializer] Initializing master dataset and Firestore synchronization...');
      loadSeedData();
      if (isFirebaseEnabled() && !isFirebaseDatasetLoaded()) await syncDataFromFirebase();
    })();
  }
  return serverInitPromise;
}

// Request Initialization Middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureServerInitialized();
  } catch (err) {
    console.error('[Server Init Warning]', err);
  }
  // Do not report embedded seed values as live financial data when the
  // configured Firestore database failed to hydrate.
  if (
    req.path.startsWith('/api/') &&
    isFirebaseEnabled() &&
    !isFirebaseDatasetLoaded() &&
    req.path !== '/api/auth/login'
  ) {
    return res.status(503).json({
      success: false,
      code: 'FIREBASE_NOT_READY',
      message: 'Firebase is configured but its dataset could not be loaded. Check the backend Firebase credentials and Firestore access.'
    });
  }
  next();
});

// Request Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[HTTP Request] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  const firebaseReady = isFirebaseEnabled() && isFirebaseDatasetLoaded();
  res.status(isFirebaseEnabled() && !firebaseReady ? 503 : 200).json({
    status: isFirebaseEnabled() && !firebaseReady ? 'DEGRADED' : 'OK',
    system: 'College Budget & PR Management System Backend',
    storage: firebaseReady ? 'firebase' : isFirebaseEnabled() ? 'firebase-sync-pending' : 'local-fallback',
    firebaseConfigured: isFirebaseEnabled(),
    firebaseDatasetLoaded: isFirebaseDatasetLoaded(),
    time: new Date()
  });
});

// Serve frontend static build files (Unified local dev server only)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
const shouldServeFrontend = !process.env.CF_PAGES && !process.env.CLOUDFLARE_WORKER && fs.existsSync(frontendDistPath);
if (shouldServeFrontend) {
  console.log(`[Static Server] Serving frontend build from ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // BrowserRouter routes (for example, /prs/all) are client-side routes.
  // On a direct load or refresh, return the SPA entry point only for HTML
  // navigation requests so React Router can resolve the requested route.
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (!req.accepts('html')) {
      return next();
    }

    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error. Please contact administrator.'
  });
});

// Start Server
async function startServer() {
  console.log('[Seed Engine] Loading Master Budget & PR dataset from reference Excel...');
  loadSeedData(true);

  const firebaseInitialized = initializeFirebase();
  if (firebaseInitialized) {
    console.log('[Firebase Mode] Server operating in Direct Firebase Firestore Mode.');
    serverInitPromise = syncDataFromFirebase().then(() => undefined);
    await serverInitPromise;
  } else {
    const pgConnected = await initializePostgres();
    if (pgConnected) {
      await syncDataFromPostgres();
    } else {
      console.log('[Fallback Mode] Operating in Local SQLite fallback mode.');
      await initializeDatabasePool();
    }
    serverInitPromise = Promise.resolve();
  }

  // Excel import history and diagnostics still use local relational tables
  // as an operational journal, even when Firestore is the primary ERP store.
  await initializeSqlDatabase();

  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`==================================================`);
  });

  // Graceful Shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server gracefully...');
    await closeDatabasePool();
    await closePostgresPool();
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
}

startServer();

export default app;
