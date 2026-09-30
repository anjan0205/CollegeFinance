// Canonical status lifecycles — mirrors docs/architecture.md §4 (adapted from the
// target architecture.md). These are the source of truth for which status
// transitions are legal for each transactional entity. The client engine's
// `transitionStatus` (services/firebaseClientService.ts) validates every status
// change against these maps and appends a history entry — status is never set
// blindly. Section 9 of the target doc allows this "equivalent server-side logic"
// in place of Cloud Functions.

export type EntityKind =
  | 'PR'
  | 'PO'
  | 'GRN'
  | 'INVOICE'
  | 'PAYMENT'
  | 'DC_NOTE'
  | 'STOCK_ISSUE';

// Allowed forward transitions per entity. A status may transition only to a value
// listed in its array. Terminal states map to [].
export const LIFECYCLES: Record<EntityKind, Record<string, string[]>> = {
  PR: {
    Draft: ['PendingApproval', 'Rejected'],
    PendingApproval: ['Approved', 'Rejected'],
    Approved: ['PartiallyOrdered', 'FullyOrdered'],
    PartiallyOrdered: ['FullyOrdered'],
    FullyOrdered: [],
    Rejected: []
  },
  PO: {
    Draft: ['Approved', 'Cancelled'],
    Approved: ['Sent', 'Cancelled'],
    Sent: ['PartiallyReceived', 'FullyReceived', 'Cancelled'],
    PartiallyReceived: ['FullyReceived', 'Cancelled'],
    FullyReceived: ['Closed'],
    Closed: [],
    Cancelled: []
  },
  GRN: {
    Draft: ['Verified'],
    Verified: ['Posted'],
    Posted: []
  },
  INVOICE: {
    Received: ['Verified', 'Disputed'],
    Verified: ['ApprovedForPayment', 'Disputed'],
    ApprovedForPayment: ['PartiallyPaid', 'Paid', 'Disputed'],
    PartiallyPaid: ['Paid', 'Disputed'],
    Paid: [],
    Disputed: ['Verified']
  },
  PAYMENT: {
    Scheduled: ['Processed'],
    Processed: ['Reconciled'],
    Reconciled: []
  },
  DC_NOTE: {
    Draft: ['Approved'],
    Approved: ['Posted'],
    Posted: []
  },
  STOCK_ISSUE: {
    Requested: ['Approved', 'Rejected'],
    Approved: ['Issued'],
    Issued: [],
    Rejected: []
  }
};

// Which roles may drive a status change for each entity. Kept permissive for the
// 7-role model already in use (see config/permissions.ts). ADMIN & FINANCE can
// always transition; module owners get their own entities.
const TRANSITION_ROLES: Record<EntityKind, string[]> = {
  PR: ['ADMIN', 'FINANCE', 'HOD', 'PRINCIPAL', 'CEO'],
  PO: ['ADMIN', 'FINANCE', 'HOD'],
  GRN: ['ADMIN', 'FINANCE', 'STORE'],
  INVOICE: ['ADMIN', 'FINANCE'],
  PAYMENT: ['ADMIN', 'FINANCE'],
  DC_NOTE: ['ADMIN', 'FINANCE'],
  STOCK_ISSUE: ['ADMIN', 'FINANCE', 'HOD', 'STORE']
};

export interface TransitionCheck {
  ok: boolean;
  reason?: string;
}

// Validate a status change. Unknown/legacy status strings (not present in the
// lifecycle map) are allowed through so pre-existing records and the legacy
// approval flow keep working — only recognized canonical statuses are enforced.
export function canTransition(
  entity: EntityKind,
  from: string | undefined,
  to: string,
  role?: string
): TransitionCheck {
  const map = LIFECYCLES[entity];
  if (role && !TRANSITION_ROLES[entity].includes(String(role).toUpperCase())) {
    return { ok: false, reason: `Role ${role} may not change ${entity} status` };
  }
  if (!from || !(from in map)) return { ok: true }; // legacy/unknown source — permit
  if (from === to) return { ok: true };
  if (map[from].includes(to)) return { ok: true };
  return { ok: false, reason: `Illegal ${entity} transition: ${from} → ${to}` };
}

export function isTerminal(entity: EntityKind, status: string): boolean {
  const map = LIFECYCLES[entity];
  return status in map && map[status].length === 0;
}
