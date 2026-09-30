import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, authReady } from '../config/firebase';

// Immutable, timestamped audit entry (see docs/architecture.md §5.3 Audit Trails).
export interface AuditEntry {
  id: string;
  actor: string;
  actorRole?: string;
  action: string;      // e.g. CREATE, UPDATE, DELETE, APPROVE, REJECT
  entity: string;      // e.g. PR, Invoice, PurchaseOrder, Vendor
  entityId: string;
  channel: 'PORTAL' | 'EMAIL' | 'SYSTEM';
  details?: string;
  timestamp: string;
}

function currentActor(): { actor: string; actorRole?: string } {
  try {
    const raw = localStorage.getItem('college_budget_user');
    if (raw) {
      const u = JSON.parse(raw);
      return { actor: u?.name || u?.email || 'Unknown', actorRole: u?.role };
    }
  } catch {
    /* ignore */
  }
  return { actor: 'System' };
}

// Fire-and-forget append. Never throws — auditing must not break the action it records.
export async function logAudit(
  action: string,
  entity: string,
  entityId: string,
  details?: string,
  channel: AuditEntry['channel'] = 'PORTAL'
): Promise<void> {
  try {
    const { actor, actorRole } = currentActor();
    const id = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const entry: AuditEntry = {
      id,
      actor,
      actorRole,
      action,
      entity,
      entityId: String(entityId),
      channel,
      details,
      timestamp: new Date().toISOString()
    };
    await authReady;
    await setDoc(doc(db, 'auditLogs', id), entry);
  } catch {
    /* auditing is best-effort */
  }
}

export async function fetchAuditLogs(): Promise<AuditEntry[]> {
  try {
    await authReady;
    const snap = await getDocs(collection(db, 'auditLogs'));
    const entries: AuditEntry[] = [];
    snap.forEach(d => entries.push(d.data() as AuditEntry));
    return entries.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  } catch {
    return [];
  }
}
