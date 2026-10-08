import { querySqlAsync, runSqlAsync, sqliteDb } from '../config/sqlDatabase';
import { getFirestoreDb, isFirebaseEnabled } from '../config/firebase';

/** Mutable ERP aggregate persisted to Firestore when configured, with SQLite fallback. */
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

type StateKey = keyof ERPState;
const STATE_KEYS: StateKey[] = [
  'vendors', 'items', 'masterApprovals', 'quotations', 'prs', 'pos', 'grns',
  'inventory', 'stockIssues', 'invoices', 'payments', 'dcNotes', 'projects'
];

let sqliteInitialized = false;
let hydrationPromise: Promise<void> | null = null;
let lastPersisted: ERPState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function ensureSqliteTable(): Promise<boolean> {
  if (!sqliteDb) return false;
  if (!sqliteInitialized) {
    await runSqlAsync(`CREATE TABLE IF NOT EXISTS ERP_STATE (
      state_key TEXT PRIMARY KEY, payload TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await runSqlAsync(`CREATE TABLE IF NOT EXISTS AUDIT_LOGS (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT NOT NULL,
      entity_type TEXT NOT NULL, entity_id TEXT, details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    sqliteInitialized = true;
  }
  return true;
}

function cloneState(state: ERPState): ERPState {
  return JSON.parse(JSON.stringify(state)) as ERPState;
}

function firestoreId(record: any): string {
  const id = record?.id ?? record?.code ?? record?.refNumber;
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error('ERP record is missing a stable id and cannot be saved.');
  }
  // Firestore document ids cannot contain a slash.
  return Buffer.from(String(id)).toString('base64url');
}

async function hydrateFirestore(apply: (state: ERPState) => void): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is marked enabled, but Firestore is unavailable.');

  const state = {} as ERPState;
  const snapshots = await Promise.all(STATE_KEYS.map(key =>
    db.collection('erpState').doc('current').collection(key).get()
  ));
  let hasRemoteRecords = false;
  snapshots.forEach((snapshot, index) => {
    const key = STATE_KEYS[index];
    state[key] = snapshot.docs.map((record: any) => record.data());
    if (state[key].length) hasRemoteRecords = true;
  });

  if (hasRemoteRecords) {
    apply(state);
    lastPersisted = cloneState(state);
  } else {
    // Preserve the app's initial ERP seed records on first connection, then
    // write them to Firestore so later requests share the same source of truth.
    lastPersisted = STATE_KEYS.reduce((out, key) => {
      out[key] = [];
      return out;
    }, {} as ERPState);
  }
}

export async function hydrateERPState(apply: (state: ERPState) => void): Promise<void> {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      if (isFirebaseEnabled()) {
        await hydrateFirestore(apply);
        return;
      }
      if (!await ensureSqliteTable()) return;
      const rows = await querySqlAsync<{ payload: string }>(
        'SELECT payload FROM ERP_STATE WHERE state_key = ?', ['erp-v1']
      );
      if (rows[0]?.payload) {
        const state = JSON.parse(rows[0].payload) as ERPState;
        apply(state);
        lastPersisted = cloneState(state);
      }
    })().catch(error => {
      hydrationPromise = null;
      throw error;
    });
  }
  await hydrationPromise;
}

async function persistFirestore(state: ERPState, actor: string, action: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is marked enabled, but Firestore is unavailable.');

  const previous = lastPersisted || ({} as ERPState);
  const batches: any[] = [];
  let batch = db.batch();
  let operationCount = 0;
  const commitIfFull = async () => {
    if (operationCount >= 450) {
      batches.push(batch.commit());
      batch = db.batch();
      operationCount = 0;
    }
  };

  for (const key of STATE_KEYS) {
    const before = new Map((previous[key] || []).map(record => [firestoreId(record), record]));
    const after = new Map((state[key] || []).map(record => [firestoreId(record), record]));
    const collection = db.collection('erpState').doc('current').collection(key);
    for (const [id, record] of after) {
      const oldRecord = before.get(id);
      if (!oldRecord || JSON.stringify(oldRecord) !== JSON.stringify(record)) {
        batch.set(collection.doc(id), record);
        operationCount += 1;
        await commitIfFull();
      }
    }
    for (const id of before.keys()) {
      if (!after.has(id)) {
        batch.delete(collection.doc(id));
        operationCount += 1;
        await commitIfFull();
      }
    }
  }

  const auditRef = db.collection('auditLogs').doc();
  batch.set(auditRef, {
    action,
    entityType: 'ERP_STATE',
    entityId: 'current',
    actor,
    channel: 'PORTAL',
    createdAt: new Date().toISOString()
  });
  operationCount += 1;
  if (operationCount) batches.push(batch.commit());
  await Promise.all(batches);
  lastPersisted = cloneState(state);
}

export async function persistERPState(state: ERPState, actor: string, action: string): Promise<void> {
  // Serialize writes from this process to prevent overlapping snapshots from
  // applying out of order. Changes are acknowledged only after durable commit.
  const persist = async () => {
    if (isFirebaseEnabled()) {
      await persistFirestore(state, actor, action);
      return;
    }
    if (!await ensureSqliteTable()) {
      throw new Error('ERP persistence is unavailable: neither Firebase nor SQLite is ready.');
    }
    await runSqlAsync(
      `INSERT INTO ERP_STATE (state_key, payload, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(state_key) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP`,
      ['erp-v1', JSON.stringify(state)]
    );
    await runSqlAsync(
      'INSERT INTO AUDIT_LOGS (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)',
      [action, 'ERP_STATE', 'erp-v1', JSON.stringify({ actor, persistedAt: new Date().toISOString() })]
    );
    lastPersisted = cloneState(state);
  };

  const queued = writeQueue.then(persist, persist);
  writeQueue = queued.then(() => undefined, () => undefined);
  return queued;
}
