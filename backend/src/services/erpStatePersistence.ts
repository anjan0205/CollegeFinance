import { querySqlAsync, runSqlAsync, sqliteDb } from '../config/sqlDatabase';

/**
 * SQLite-backed aggregate persistence for the legacy ERP controller.  The
 * controller still exposes its established document shapes, while this service
 * makes the aggregate durable and keeps a write-audit record.  A later
 * normalized-table migration can be performed without changing the API.
 */
export interface ERPState {
  vendors: any[];
  items: any[];
  masterApprovals: any[];
  quotations: any[];
  prs: any[];
  pos: any[];
  grns: any[];
  inventory: any[];
  stockIssues: any[];
  invoices: any[];
  payments: any[];
  dcNotes: any[];
  projects: any[];
}

let initialized = false;
let hydrationPromise: Promise<void> | null = null;

async function ensureTable(): Promise<boolean> {
  if (!sqliteDb) return false;
  if (!initialized) {
    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS ERP_STATE (
        state_key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // The application can run in Firebase mode while still using SQLite for
    // local ERP durability. Create the audit table here as well instead of
    // depending on the fallback-only SQL bootstrap path.
    await runSqlAsync(`
      CREATE TABLE IF NOT EXISTS AUDIT_LOGS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    initialized = true;
  }
  return true;
}

export async function hydrateERPState(apply: (state: ERPState) => void): Promise<void> {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      if (!await ensureTable()) return;
      const rows = await querySqlAsync<{ payload: string }>('SELECT payload FROM ERP_STATE WHERE state_key = ?', ['erp-v1']);
      if (!rows[0]?.payload) return;
      const parsed = JSON.parse(rows[0].payload) as ERPState;
      apply(parsed);
    })().catch((error) => {
      hydrationPromise = null;
      throw error;
    });
  }
  await hydrationPromise;
}

export async function persistERPState(state: ERPState, actor: string, action: string): Promise<void> {
  if (!await ensureTable()) {
    throw new Error('ERP persistence is unavailable: SQLite is not initialized.');
  }

  const payload = JSON.stringify(state);
  await runSqlAsync(
    `INSERT INTO ERP_STATE (state_key, payload, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(state_key) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP`,
    ['erp-v1', payload]
  );
  await runSqlAsync(
    'INSERT INTO AUDIT_LOGS (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)',
    [action, 'ERP_STATE', 'erp-v1', JSON.stringify({ actor, persistedAt: new Date().toISOString() })]
  );
}