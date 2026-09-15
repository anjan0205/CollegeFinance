import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { initializeDatabasePool, closeDatabasePool } from './config/database';
import { loadSeedData, syncDataFromFirebase, syncDataFromPostgres } from './utils/seedData';
import { initializeFirebase } from './config/firebase';
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

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use((req: any, res, next) => {
  if (req.headers['content-type']?.includes('application/json')) {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        req.body = data ? JSON.parse(data) : {};
        next();
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON body' });
      }
    });
  } else if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        const params = new URLSearchParams(data);
        const parsed: any = {};
        for (const [key, value] of params.entries()) {
          parsed[key] = value;
        }
        req.body = parsed;
        next();
      } catch (e) {
        next();
      }
    });
  } else {
    next();
  }
});

// Firebase configuration is initialized and synchronized asynchronously in startServer()

// Server Initialization Logic for Serverless / Worker / Container environments
let serverInitPromise: Promise<void> | null = null;
async function ensureServerInitialized() {
  if (!serverInitPromise) {
    serverInitPromise = (async () => {
      console.log('[Server Initializer] Initializing master dataset and Firestore synchronization...');
      loadSeedData(true);
      await syncDataFromFirebase();
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
  res.json({ status: 'OK', system: 'College Budget & PR Management System Backend', time: new Date() });
});

// Serve frontend static build files (Unified local dev server only)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (!process.env.CF_PAGES && !process.env.CLOUDFLARE_WORKER && fs.existsSync(frontendDistPath)) {
  console.log(`[Static Server] Serving frontend build from ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
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
  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`==================================================`);
  });

  console.log('[Seed Engine] Loading Master Budget & PR dataset from reference Excel...');
  loadSeedData(true);

  const firebaseInitialized = initializeFirebase();
  if (firebaseInitialized) {
    console.log('[Firebase Mode] Server operating in Direct Firebase Firestore Mode.');
    await syncDataFromFirebase();
  } else {
    const pgConnected = await initializePostgres();
    if (pgConnected) {
      await syncDataFromPostgres();
    } else {
      console.log('[Fallback Mode] Operating in Local SQLite fallback mode.');
      await initializeDatabasePool();
      await initializeSqlDatabase();
    }
  }

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
