import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;
let isPostgresAvailable = false;

export async function initializePostgres(): Promise<boolean> {
  const host = process.env.PG_HOST;
  const port = parseInt(process.env.PG_PORT || '5432', 10);
  const user = process.env.PG_USER;
  const password = process.env.PG_PASSWORD;
  const database = process.env.PG_DATABASE;

  if (!host || !user || !password || !database) {
    console.log('[PostgreSQL] Missing configuration variables in .env. Skipping PostgreSQL initialization.');
    isPostgresAvailable = false;
    return false;
  }

  try {
    pool = new Pool({
      host,
      port,
      user,
      password,
      database,
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Timeout after 5s to prevent hanging
    });

    // Test connection
    const client = await pool.connect();
    console.log(`[PostgreSQL] Connection successfully established with Google Cloud SQL instance: ${database}`);
    client.release();
    isPostgresAvailable = true;
    return true;
  } catch (err: any) {
    console.warn(`[PostgreSQL Connection Note] Could not connect to PostgreSQL DB (${err.message}). Using fallback data engine.`);
    isPostgresAvailable = false;
    pool = null;
    return false;
  }
}

export function getPgStatus(): boolean {
  return isPostgresAvailable;
}

export async function queryPgAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!pool || !isPostgresAvailable) {
    throw new Error('PostgreSQL is not initialized or available.');
  }
  
  try {
    const result = await pool.query(sql, params);
    return result.rows as T[];
  } catch (err) {
    console.error('[PostgreSQL Query Error]', err);
    throw err;
  }
}

export async function executePgQuery<T = any>(sql: string, params: any[] = []): Promise<QueryResult<any> | null> {
  if (!pool || !isPostgresAvailable) {
    return null;
  }

  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (err) {
    console.error('[PostgreSQL Execute Error]', err);
    throw err;
  }
}

export async function closePostgresPool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      console.log('[PostgreSQL] Connection pool closed.');
    } catch (err) {
      console.error('[PostgreSQL Pool Close Error]', err);
    }
  }
}
