import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { initializeDatabasePool, closeDatabasePool } from './config/database';
import { loadSeedData } from './utils/seedData';

import { initializeSqlDatabase } from './config/sqlDatabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Seed Data from reference Excel
loadSeedData();

// API Routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', system: 'College Budget & PR Management System Backend', time: new Date() });
});

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
  await initializeDatabasePool();
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
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });
}

startServer();

export default app;
