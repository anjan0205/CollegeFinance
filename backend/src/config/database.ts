import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Enable auto-commit by default for Oracle operations
oracledb.autoCommit = true;
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool: oracledb.Pool | null = null;
let isOracleAvailable = false;

export async function initializeDatabasePool(): Promise<boolean> {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;

  if (!user || !password || !connectString) {
    console.log('[Oracle DB] Missing credentials in .env. Running in Fallback Data Mode.');
    return false;
  }

  try {
    pool = await oracledb.createPool({
      user,
      password,
      connectString,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
      poolTimeout: 60,
    });
    isOracleAvailable = true;
    console.log('[Oracle DB] Connection pool successfully initialized!');
    return true;
  } catch (err: any) {
    console.warn(`[Oracle DB Pool Note] Could not connect to Oracle DB (${err.message}). Using Fallback Data Engine.`);
    isOracleAvailable = false;
    return false;
  }
}

export function getOracleStatus(): boolean {
  return isOracleAvailable;
}

export async function executeOracleQuery<T = any>(
  sql: string,
  binds: oracledb.BindParameters = {},
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<T> | null> {
  if (!pool || !isOracleAvailable) {
    return null;
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    });
    return result;
  } catch (err) {
    console.error('[Oracle Query Error]', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[Oracle Connection Close Error]', err);
      }
    }
  }
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    try {
      await pool.close(10);
      console.log('[Oracle DB] Connection pool closed.');
    } catch (err) {
      console.error('[Oracle DB Pool Close Error]', err);
    }
  }
}
