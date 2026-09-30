import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, authReady } from '../config/firebase';
import {
  EMBEDDED_DEPARTMENTS,
  EMBEDDED_BUDGET_HEADS,
  EMBEDDED_BUDGET_ALLOCATIONS,
  EMBEDDED_PRS,
  EMBEDDED_INVOICES,
  EMBEDDED_USERS
} from '../data/embeddedMasterDataset';
import {
  SEED_MASTERS, SEED_QUOTATIONS, SEED_POS, SEED_GRNS, SEED_INVENTORY, SEED_STOCK_ISSUES,
  SEED_INVOICES as SEED_ERP_INVOICES, SEED_PAYMENTS, SEED_PART_PAYMENTS, SEED_DC_NOTES, SEED_PROJECTS
} from '../data/erpSeedData';
import { logAudit } from './auditService';
import { canTransition, EntityKind } from '../config/statusLifecycles';

let cacheDepts = [...EMBEDDED_DEPARTMENTS];
let cacheHeads = [...EMBEDDED_BUDGET_HEADS];
let cacheAllocs = [...EMBEDDED_BUDGET_ALLOCATIONS];
let cachePRs = [...EMBEDDED_PRS];
let cacheInvoices = [...EMBEDDED_INVOICES];
let cacheUsers = [...EMBEDDED_USERS];

// ERP Procure-to-Pay caches (seeded from erpSeedData, synced from Firestore).
let cacheErpMasters: Record<string, any[]> = {
  vendors: [], items: [], departments: [], costCenters: [], uoms: [], stores: []
};
let cacheQuotations: any[] = [];
let cacheErpPos: any[] = [];
let cacheGrns: any[] = [];
let cacheInventory: any[] = [];
let cacheStockIssues: any[] = [];
let cacheErpInvoices: any[] = [];
let cacheErpPayments: any[] = [];
let cachePartPayments: any[] = [];
let cacheDcNotes: any[] = [];
let cacheProjects: any[] = [];
let erpSeeded = false;

// Fresh-on-fetch sync control: re-read Firestore with a 60s TTL or immediately on mutation.
let lastSyncAt = 0;
const SYNC_TTL_MS = 60000; // 60 seconds TTL (writes trigger immediate markStale)
let syncInFlight: Promise<void> | null = null;

// Force the next read to re-sync from Firestore (call after any write).
function markStale() {
  lastSyncAt = 0;
}

// Next numeric id that will not collide with (and overwrite) an existing doc.
function nextId(arr: any[]): number {
  return arr.reduce((max, item) => Math.max(max, Number(item?.id) || 0), 0) + 1;
}

async function fetchFirestoreCollection(colName: string): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, colName));
    const docs: any[] = [];
    snap.forEach(d => {
      const data = d.data() as any;
      // The seed script stores the record's id as the Firestore document key and
      // strips the `id` field from the data. Restore it, and keep the real
      // document key (`_docId`) so writes/deletes target the correct document.
      docs.push({ ...data, id: data.id ?? d.id, _docId: d.id });
    });
    return docs;
  } catch (e) {
    return [];
  }
}

// Generate a fresh string id/document-number pair for a new ERP record.
function erpNewId(prefix: string): string {
  return `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}
function erpNewNumber(prefix: string): string {
  return `${prefix}/2026/${Math.floor(1000 + Math.random() * 9000)}`;
}

// The uid of the acting user, read from the cached session (see AuthContext).
function actingUid(): string {
  try {
    const raw = localStorage.getItem('college_budget_user');
    if (raw) {
      const u = JSON.parse(raw);
      return String(u?.email || u?.name || u?.id || 'system');
    }
  } catch { /* ignore */ }
  return 'system';
}

// Stamp the standard transactional document fields required by
// docs/architecture.md §3 (refNumber/createdBy/timestamps/history). Idempotent —
// only fills fields the caller has not already set.
function stampCreate(rec: any, refNumber?: string): any {
  const now = new Date().toISOString();
  const by = actingUid();
  if (refNumber && !rec.refNumber) rec.refNumber = refNumber;
  if (!rec.createdBy) rec.createdBy = by;
  if (!rec.createdAt) rec.createdAt = now;
  rec.updatedAt = now;
  if (!Array.isArray(rec.history)) rec.history = [];
  rec.history.push({ by, action: 'CREATE', at: now });
  return rec;
}

// Append a history entry + bump updatedAt on a mutation (§3).
function appendHistory(rec: Record<string, any>, action: string, note?: string): void {
  const now = new Date().toISOString();
  rec.updatedAt = now;
  if (!Array.isArray(rec.history)) rec.history = [];
  rec.history.push({ by: actingUid(), action, at: now, ...(note ? { note } : {}) });
}

function recalculateCommittedAmounts() {
  cacheAllocs.forEach(alloc => {
    alloc.committedAmount = 0;
    alloc.actualUtilizedAmount = 0;
  });

  const allocMap = new Map<string, any>();
  cacheAllocs.forEach(a => {
    if (a.sourceBudgetCode) {
      allocMap.set(a.sourceBudgetCode.toUpperCase(), a);
    }
    const altKey = `${a.budgetHeadCode}${a.departmentCode}`.toUpperCase();
    allocMap.set(altKey, a);
  });

  // Calculate invoice utilized amounts on PRs & allocations
  const invoiceUtilMap = new Map<string, number>();
  cacheInvoices.forEach(inv => {
    if (inv.status === 'Paid' || inv.status === 'Approved' || (inv.status as string) === 'Processing') {
      const prKey = inv.prNumber.toUpperCase();
      invoiceUtilMap.set(prKey, (invoiceUtilMap.get(prKey) || 0) + (inv.totalAmount || 0));
    }
  });

  cachePRs.forEach(pr => {
    const util = invoiceUtilMap.get(pr.prNumber.toUpperCase()) || 0;
    pr.utilizedAmount = util;
    if (util >= pr.totalAmount && pr.totalAmount > 0) {
      pr.invoiceStatus = 'FULLY_INVOICED';
    } else if (util > 0) {
      pr.invoiceStatus = 'PARTIAL';
    } else {
      pr.invoiceStatus = 'UNINVOICED';
    }

    if (pr.approvalStatus === 'Approved' || pr.status === 'Approved' || pr.status === 'Closed' || pr.prPoStatus === 'Closed') {
      const key = (pr.sourceBudgetCode || `${pr.budgetHeadCode}${pr.departmentCode}`).toUpperCase();
      let alloc = allocMap.get(key);
      if (!alloc) {
        alloc = cacheAllocs.find(a => 
          (a.departmentCode && pr.departmentCode && a.departmentCode.trim().toUpperCase() === pr.departmentCode.trim().toUpperCase()) &&
          (a.budgetHeadCode === pr.budgetHeadCode)
        );
      }
      if (alloc) {
        alloc.committedAmount += (pr.totalAmount || 0);
        alloc.actualUtilizedAmount += util;
      }
    }
  });

  cacheAllocs.forEach(alloc => {
    alloc.remainingAmount = alloc.allocatedAmount - alloc.committedAmount - alloc.actualUtilizedAmount;
    if (alloc.allocatedAmount > 0) {
      alloc.utilizationPercentage = parseFloat((((alloc.committedAmount + alloc.actualUtilizedAmount) / alloc.allocatedAmount) * 100).toFixed(2));
    } else {
      alloc.utilizationPercentage = (alloc.committedAmount + alloc.actualUtilizedAmount) > 0 ? 100 : 0;
    }

    const pct = alloc.utilizationPercentage;
    if (pct > 100) alloc.alertStatus = 'Exceeded';
    else if (pct >= 85) alloc.alertStatus = 'Critical';
    else if (pct >= 70) alloc.alertStatus = 'Warning';
    else alloc.alertStatus = 'Normal';
  });
}

async function pullFromFirestore() {
  // Ensure the anonymous Firebase session is established before reading, so the
  // request carries an auth token that satisfies the security rules.
  await authReady;

  const [
    prDocs,
    deptDocs,
    headDocs,
    allocDocs,
    invDocs,
    erpMastersDocs,
    quotationsDocs,
    erpPosDocs,
    grnsDocs,
    inventoryDocs,
    stockIssuesDocs,
    erpInvoicesDocs,
    paymentsDocs,
    partPaymentsDocs,
    dcNotesDocs,
    projectsDocs,
  ] = await Promise.all([
    fetchFirestoreCollection('prs'),
    fetchFirestoreCollection('departments'),
    fetchFirestoreCollection('budgetHeads'),
    fetchFirestoreCollection('budgetAllocations'),
    fetchFirestoreCollection('invoices'),
    fetchFirestoreCollection('erpMasters'),
    fetchFirestoreCollection('quotations'),
    fetchFirestoreCollection('erpPos'),
    fetchFirestoreCollection('grns'),
    fetchFirestoreCollection('inventory'),
    fetchFirestoreCollection('stockIssues'),
    fetchFirestoreCollection('erpInvoices'),
    fetchFirestoreCollection('payments'),
    fetchFirestoreCollection('partPayments'),
    fetchFirestoreCollection('dcNotes'),
    fetchFirestoreCollection('projects'),
  ]);

  if (prDocs.length > 0) {
    cachePRs = prDocs.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }
  if (deptDocs.length > 0) cacheDepts = deptDocs.sort((a, b) => Number(a.id) - Number(b.id));
  if (headDocs.length > 0) cacheHeads = headDocs.sort((a, b) => Number(a.id) - Number(b.id));
  if (allocDocs.length > 0) cacheAllocs = allocDocs.sort((a, b) => Number(a.id) - Number(b.id));
  if (invDocs.length > 0) cacheInvoices = invDocs.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  // Process ERP Masters
  let mastersList = erpMastersDocs;
  if (mastersList.length === 0) {
    const all: any[] = [];
    Object.entries(SEED_MASTERS).forEach(([type, items]) => {
      (items as any[]).forEach(it => all.push({ ...it, masterType: type }));
    });
    Promise.all(all.map(it => setDoc(doc(db, 'erpMasters', String(it.id)), it).catch(() => {})));
    mastersList = all.map(it => ({ ...it, _docId: String(it.id) }));
  }
  const grouped: Record<string, any[]> = { vendors: [], items: [], departments: [], costCenters: [], uoms: [], stores: [] };
  mastersList.forEach(d => {
    if (grouped[d.masterType]) grouped[d.masterType].push(d);
  });
  cacheErpMasters = grouped;

  // Process ERP collections with fallback
  const processCol = (docs: any[], seed: any[], colName: string) => {
    if (docs.length > 0) return docs;
    if (seed.length > 0) {
      Promise.all(seed.map(item => setDoc(doc(db, colName, String(item.id)), item).catch(() => {})));
      return seed.map(s => ({ ...s, _docId: String(s.id) }));
    }
    return [];
  };

  cacheQuotations = processCol(quotationsDocs, SEED_QUOTATIONS, 'quotations');
  cacheErpPos = processCol(erpPosDocs, SEED_POS, 'erpPos');
  cacheGrns = processCol(grnsDocs, SEED_GRNS, 'grns');
  cacheInventory = processCol(inventoryDocs, SEED_INVENTORY, 'inventory');
  cacheStockIssues = processCol(stockIssuesDocs, SEED_STOCK_ISSUES, 'stockIssues');
  cacheErpInvoices = processCol(erpInvoicesDocs, SEED_ERP_INVOICES, 'erpInvoices');
  cacheErpPayments = processCol(paymentsDocs, SEED_PAYMENTS, 'payments');
  cachePartPayments = processCol(partPaymentsDocs, SEED_PART_PAYMENTS, 'partPayments');
  cacheDcNotes = processCol(dcNotesDocs, SEED_DC_NOTES, 'dcNotes');
  cacheProjects = processCol(projectsDocs, SEED_PROJECTS, 'projects');
  erpSeeded = true;

  recalculateCommittedAmounts();
}

export async function syncClientWithFirestore() {
  // Fresh-on-fetch: re-read the DB when the cache is stale (TTL) or has never
  // been loaded. Concurrent callers (e.g. a page firing several requests at
  // once) share a single in-flight pull instead of each hitting Firestore.
  const isFresh = lastSyncAt !== 0 && Date.now() - lastSyncAt < SYNC_TTL_MS;
  if (isFresh) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      await pullFromFirestore();
      lastSyncAt = Date.now();
    } catch (err) {
      recalculateCommittedAmounts();
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

// Client Handlers
export async function handleClientRequest(url: string, method: string = 'GET', params: any = {}, body: any = {}) {
  await syncClientWithFirestore();

  const cleanUrl = url.split('?')[0];

  // Auth login
  if (cleanUrl === '/auth/login' || cleanUrl === '/auth/login/') {
    const user = cacheUsers.find(u => u.email.toLowerCase() === (body.email || '').toLowerCase()) || cacheUsers[0];
    return {
      data: {
        success: true,
        token: 'mock-jwt-firebase-token',
        user
      }
    };
  }

  // Auth me / profile
  if (cleanUrl === '/auth/me' || cleanUrl === '/auth/me/' || cleanUrl === '/auth/profile') {
    return {
      data: {
        success: true,
        user: cacheUsers[0]
      }
    };
  }

  // Budget Heads list
  if (cleanUrl === '/budget-heads' || cleanUrl === '/budget-heads/') {
    return {
      data: {
        success: true,
        data: cacheHeads
      }
    };
  }

  // Master Budget (/budgets)
  if (cleanUrl === '/budgets' || cleanUrl === '/budgets/') {
    const { search, category, page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc' } = params;

    // Group allocations by budget head
    const headSummaryMap: Record<number, {
      id: number | string;
      code: number;
      name: string;
      category: string;
      totalAllocated: number;
      totalCommitted: number;
      totalActualUtilized: number;
      totalRemaining: number;
      utilizationPct: number;
      departmentCount: number;
    }> = {};

    cacheHeads.forEach(bh => {
      headSummaryMap[bh.code] = {
        id: bh.id,
        code: bh.code,
        name: bh.name,
        category: bh.category,
        totalAllocated: 0,
        totalCommitted: 0,
        totalActualUtilized: 0,
        totalRemaining: 0,
        utilizationPct: 0,
        departmentCount: 0
      };
    });

    cacheAllocs.forEach(a => {
      if (headSummaryMap[a.budgetHeadCode]) {
        headSummaryMap[a.budgetHeadCode].totalAllocated += a.allocatedAmount;
        headSummaryMap[a.budgetHeadCode].totalCommitted += a.committedAmount;
        headSummaryMap[a.budgetHeadCode].totalActualUtilized += (a.actualUtilizedAmount || 0);
        if (a.allocatedAmount > 0 || a.committedAmount > 0) {
          headSummaryMap[a.budgetHeadCode].departmentCount += 1;
        }
      }
    });

    let items = Object.values(headSummaryMap).map(h => ({
      ...h,
      totalRemaining: h.totalAllocated - h.totalCommitted - h.totalActualUtilized,
      utilizationPct: h.totalAllocated > 0 
        ? parseFloat((((h.totalCommitted + h.totalActualUtilized) / h.totalAllocated) * 100).toFixed(2)) 
        : 0
    }));

    // Filter by search
    if (search) {
      const q = String(search).toLowerCase();
      items = items.filter(i => 
        String(i.code).includes(q) || 
        i.name.toLowerCase().includes(q) || 
        i.category.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category) {
      items = items.filter(i => i.category.toLowerCase() === String(category).toLowerCase());
    }

    // Sort
    items.sort((a: any, b: any) => {
      let valA = a[String(sortBy)];
      let valB = b[String(sortBy)];
      if (typeof valA === 'string') {
        return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    // Pagination
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(startIndex, startIndex + limitNum);

    const totalAllocatedAll = items.reduce((sum, i) => sum + i.totalAllocated, 0);
    const totalCommittedAll = items.reduce((sum, i) => sum + i.totalCommitted, 0);
    const totalActualUtilizedAll = items.reduce((sum, i) => sum + (i.totalActualUtilized || 0), 0);
    const totalRemainingAll = totalAllocatedAll - totalCommittedAll - totalActualUtilizedAll;
    const overallUtilizationPct = totalAllocatedAll > 0 
      ? parseFloat((((totalCommittedAll + totalActualUtilizedAll) / totalAllocatedAll) * 100).toFixed(2)) 
      : 0;

    return {
      data: {
        success: true,
        data: paginatedItems,
        pagination: {
          total: items.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(items.length / limitNum) || 1
        },
        totals: {
          totalAllocated: totalAllocatedAll,
          totalCommitted: totalCommittedAll,
          totalActualUtilized: totalActualUtilizedAll,
          totalRemaining: totalRemainingAll,
          overallUtilizationPct
        }
      }
    };
  }

  // Budget Head Details (/budgets/:id)
  if (cleanUrl.startsWith('/budgets/') && !cleanUrl.includes('/allocation')) {
    const idStr = cleanUrl.replace('/budgets/', '');
    const budgetHeadId = parseInt(idStr, 10);

    const head = cacheHeads.find(bh => bh.id === budgetHeadId || bh.code === budgetHeadId);
    if (!head) {
      return { data: { success: false, message: 'Budget head not found.' } };
    }

    const headAllocations = cacheAllocs.filter(a => a.budgetHeadId === head.id || a.budgetHeadCode === head.code);
    const totalAllocated = headAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const totalCommitted = headAllocations.reduce((sum, a) => sum + a.committedAmount, 0);
    const totalActualUtilized = headAllocations.reduce((sum, a) => sum + (a.actualUtilizedAmount || 0), 0);
    const totalRemaining = totalAllocated - totalCommitted - totalActualUtilized;
    const utilizationPct = totalAllocated > 0 
      ? parseFloat((((totalCommitted + totalActualUtilized) / totalAllocated) * 100).toFixed(2)) 
      : 0;

    return {
      data: {
        success: true,
        budgetHead: head,
        summary: {
          totalAllocated,
          totalCommitted,
          totalActualUtilized,
          totalRemaining,
          utilizationPct
        },
        departmentBreakdown: headAllocations
      }
    };
  }

  // Budget Allocation Update (PUT /budgets/allocation)
  if (cleanUrl === '/budgets/allocation' && method === 'PUT') {
    const { allocationId, allocatedAmount } = body;
    const alloc = cacheAllocs.find(a => a.id === Number(allocationId));
    if (alloc) {
      alloc.allocatedAmount = Number(allocatedAmount);
      recalculateCommittedAmounts();
      try {
        await setDoc(doc(db, 'budgetAllocations', String(alloc._docId || alloc.id)), alloc, { merge: true });
        markStale();
      } catch (e) {}
      void logAudit('UPDATE', 'BudgetAllocation', String(alloc.sourceBudgetCode || alloc.id), `Allocation set to ₹${alloc.allocatedAmount} (${alloc.departmentCode})`);
      return { data: { success: true, data: alloc } };
    }
    return { data: { success: false, message: 'Allocation not found' } };
  }

  // Departments List (/departments)
  if (cleanUrl === '/departments' || cleanUrl === '/departments/') {
    const deptSummaries = cacheDepts.map(dept => {
      const deptAllocations = cacheAllocs.filter(a => a.departmentId === dept.id || a.departmentCode.toUpperCase() === dept.code.toUpperCase());
      const deptPRs = cachePRs.filter(p => p.departmentId === dept.id || p.departmentCode.toUpperCase() === dept.code.toUpperCase());

      const allocatedBudget = deptAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const prCommittedAmount = deptAllocations.reduce((sum, a) => sum + a.committedAmount, 0);
      const actualUtilized = deptAllocations.reduce((sum, a) => sum + (a.actualUtilizedAmount || 0), 0);
      const remainingBudget = allocatedBudget - prCommittedAmount;
      const utilizationPct = allocatedBudget > 0 
        ? parseFloat(((prCommittedAmount / allocatedBudget) * 100).toFixed(2)) 
        : 0;

      let statusTag: 'Normal' | 'Warning' | 'Critical' | 'Exceeded' = 'Normal';
      if (utilizationPct > 100) statusTag = 'Exceeded';
      else if (utilizationPct >= 85) statusTag = 'Critical';
      else if (utilizationPct >= 70) statusTag = 'Warning';

      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        category: dept.category,
        allocatedBudget,
        prCommittedAmount,
        actualUtilized,
        remainingBudget,
        utilizationPct,
        statusTag,
        prCount: deptPRs.length
      };
    });

    return {
      data: {
        success: true,
        data: deptSummaries
      }
    };
  }

  // Department Detail (/departments/:id)
  if (cleanUrl.startsWith('/departments/')) {
    const idStr = cleanUrl.replace('/departments/', '').split('/')[0];
    const deptId = parseInt(idStr, 10);
    const dept = cacheDepts.find(d => d.id === deptId || d.code.toLowerCase() === idStr.toLowerCase());

    if (dept) {
      if (cleanUrl.endsWith('/budget')) {
        const deptAllocations = cacheAllocs.filter(a => a.departmentId === dept.id || a.departmentCode.toUpperCase() === dept.code.toUpperCase());
        return { data: { success: true, data: deptAllocations } };
      }
      if (cleanUrl.endsWith('/prs')) {
        const deptPRs = cachePRs.filter(p => p.departmentId === dept.id || p.departmentCode.toUpperCase() === dept.code.toUpperCase());
        return { data: { success: true, data: deptPRs } };
      }

      const deptAllocations = cacheAllocs.filter(a => a.departmentId === dept.id || a.departmentCode.toUpperCase() === dept.code.toUpperCase());
      const deptPRs = cachePRs.filter(p => p.departmentId === dept.id || p.departmentCode.toUpperCase() === dept.code.toUpperCase());

      const allocatedBudget = deptAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const prCommittedAmount = deptAllocations.reduce((sum, a) => sum + a.committedAmount, 0);
      const actualUtilized = deptAllocations.reduce((sum, a) => sum + (a.actualUtilizedAmount || 0), 0);
      const remainingBudget = allocatedBudget - prCommittedAmount;
      const utilizationPct = allocatedBudget > 0 
        ? parseFloat(((prCommittedAmount / allocatedBudget) * 100).toFixed(2)) 
        : 0;

      return {
        data: {
          success: true,
          department: dept,
          overview: {
            allocatedBudget,
            prCommittedAmount,
            actualUtilized,
            remainingBudget,
            utilizationPct,
            prCount: deptPRs.length
          },
          budgetBreakdown: deptAllocations,
          prs: deptPRs
        }
      };
    }
  }

  // PR List (/prs)
  if (cleanUrl === '/prs' || cleanUrl === '/prs/') {
    if (method === 'POST') {
      const newId = nextId(cachePRs);
      const newPR = stampCreate({
        ...body,
        id: newId,
        prNumber: body.prNumber || `PR-2026-MANUAL-${newId}`,
        approvalStatus: body.approvalStatus || 'Approved',
        status: body.status || 'Approved'
      }, body.prNumber || `PR-2026-MANUAL-${newId}`);
      cachePRs.unshift(newPR);
      recalculateCommittedAmounts();
      try {
        await setDoc(doc(db, 'prs', String(newPR.id)), newPR);
        markStale(); // ensure the next fetch reflects the persisted record
      } catch (e) {}
      void logAudit('CREATE', 'PR', newPR.prNumber, `Created PR for ${newPR.departmentName || newPR.departmentCode || 'department'} — ₹${newPR.totalAmount || 0}`);
      return { data: { success: true, data: newPR } };
    }

    let prs = [...cachePRs];

    const {
      search,
      department,
      budgetCode,
      status,
      approvalStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 15,
      sortBy = 'prDate',
      sortOrder = 'desc'
    } = params;

    if (search) {
      const q = String(search).toLowerCase();
      prs = prs.filter(p =>
        (p.prNumber || '').toLowerCase().includes(q) ||
        (p.requestedBy || '').toLowerCase().includes(q) ||
        (p.departmentCode || '').toLowerCase().includes(q) ||
        (p.departmentName || '').toLowerCase().includes(q) ||
        (p.purpose && p.purpose.toLowerCase().includes(q)) ||
        (p.budgetHeadName && p.budgetHeadName.toLowerCase().includes(q)) ||
        (p.budgetHeadCode && String(p.budgetHeadCode).includes(q)) ||
        p.items?.some((i: any) => (i.productName || '').toLowerCase().includes(q))
      );
    }

    if (department && department !== 'ALL') {
      const deptStr = String(department).toUpperCase();
      prs = prs.filter(p =>
        (p.departmentCode || '').toUpperCase() === deptStr ||
        String(p.departmentId) === deptStr
      );
    }

    if (budgetCode && budgetCode !== 'ALL') {
      prs = prs.filter(p =>
        String(p.budgetHeadCode) === String(budgetCode) ||
        (p.sourceBudgetCode && p.sourceBudgetCode.includes(String(budgetCode)))
      );
    }

    if (status && status !== 'ALL') {
      prs = prs.filter(p => (p.status || '').toLowerCase() === String(status).toLowerCase());
    }

    if (approvalStatus && approvalStatus !== 'ALL') {
      prs = prs.filter(p => (p.approvalStatus || '').toLowerCase() === String(approvalStatus).toLowerCase());
    }

    if (startDate) {
      prs = prs.filter(p => (p.prDate || '') >= String(startDate));
    }
    if (endDate) {
      prs = prs.filter(p => (p.prDate || '') <= String(endDate));
    }

    if (minAmount) {
      prs = prs.filter(p => (p.totalAmount || 0) >= parseFloat(String(minAmount)));
    }
    if (maxAmount) {
      prs = prs.filter(p => (p.totalAmount || 0) <= parseFloat(String(maxAmount)));
    }

    prs.sort((a: any, b: any) => {
      let valA = a[String(sortBy)] ?? '';
      let valB = b[String(sortBy)] ?? '';
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = prs.slice(startIndex, startIndex + limitNum);

    const totalAmountSum = prs.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    return {
      data: {
        success: true,
        data: paginatedItems,
        pagination: {
          total: prs.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(prs.length / limitNum) || 1
        },
        summary: {
          totalFilteredPRs: prs.length,
          totalAmount: totalAmountSum
        }
      }
    };
  }

  // Single PR details (/prs/:id)
  if (cleanUrl.startsWith('/prs/')) {
    const prId = cleanUrl.replace('/prs/', '').split('/')[0];
    const pr = cachePRs.find(p => String(p.id) === prId || p.prNumber.toLowerCase() === prId.toLowerCase());
    if (pr) {
      if (method === 'DELETE') {
        cachePRs = cachePRs.filter(p => p.id !== pr.id);
        recalculateCommittedAmounts();
        try {
          await deleteDoc(doc(db, 'prs', String(pr._docId || pr.id)));
          markStale();
        } catch (e) {}
        void logAudit('DELETE', 'PR', pr.prNumber, `Deleted PR (₹${pr.totalAmount || 0})`);
        return { data: { success: true, data: { id: pr.id, prNumber: pr.prNumber } } };
      }
      if (method === 'PATCH' && cleanUrl.endsWith('/status')) {
        const prevApproval = pr.approvalStatus;
        const nextApproval = body.approvalStatus || pr.approvalStatus;
        // Validate against the PR lifecycle governance layer (§4). Legacy approval
        // values not in the canonical map are permitted (canTransition returns ok).
        const check = canTransition('PR', prevApproval, nextApproval, body.actorRole);
        if (!check.ok) {
          return { data: { success: false, message: check.reason } };
        }
        pr.approvalStatus = nextApproval;
        pr.status = body.status || pr.status;
        appendHistory(pr, `STATUS ${prevApproval} → ${nextApproval}`, body.remarks);
        recalculateCommittedAmounts();
        try {
          await setDoc(doc(db, 'prs', String(pr._docId || pr.id)), pr, { merge: true });
          markStale();
        } catch (e) {}
        void logAudit('UPDATE', 'PR', pr.prNumber, `Status ${prevApproval} → ${pr.approvalStatus}`);
        return { data: { success: true, data: pr } };
      }
      return { data: { success: true, data: pr } };
    }
  }

  // Invoices List & Management (/invoices)
  if (cleanUrl === '/invoices' || cleanUrl === '/invoices/') {
    if (method === 'POST') {
      const newId = nextId(cacheInvoices);
      const newInvoice = stampCreate({
        ...body,
        id: newId,
        invoiceNumber: body.invoiceNumber || `INV-2026-${newId}`,
        status: body.status || 'Paid'
      }, body.invoiceNumber || `INV-2026-${newId}`);
      cacheInvoices.unshift(newInvoice);
      recalculateCommittedAmounts();
      try {
        await setDoc(doc(db, 'invoices', String(newInvoice.id)), newInvoice);
        markStale();
      } catch (e) {}
      void logAudit('CREATE', 'Invoice', newInvoice.invoiceNumber, `Invoice for ${newInvoice.vendorName || 'vendor'} — ₹${newInvoice.totalAmount || 0}`);
      return { data: { success: true, data: newInvoice } };
    }

    let invoices = [...cacheInvoices];
    const { search, department, status, startDate, endDate, page = 1, limit = 20 } = params;

    if (search) {
      const q = String(search).toLowerCase();
      invoices = invoices.filter(inv =>
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.vendorName || '').toLowerCase().includes(q) ||
        (inv.prNumber || '').toLowerCase().includes(q) ||
        (inv.departmentCode || '').toLowerCase().includes(q) ||
        (inv.departmentName || '').toLowerCase().includes(q) ||
        (inv.remarks && inv.remarks.toLowerCase().includes(q))
      );
    }

    if (department && department !== 'ALL') {
      const deptStr = String(department).toUpperCase();
      invoices = invoices.filter(inv =>
        (inv.departmentCode || '').toUpperCase() === deptStr ||
        String(inv.departmentId) === deptStr
      );
    }

    if (status && status !== 'ALL') {
      invoices = invoices.filter(inv => (inv.status || '').toLowerCase() === String(status).toLowerCase());
    }

    if (startDate) {
      invoices = invoices.filter(inv => (inv.invoiceDate || '') >= String(startDate));
    }
    if (endDate) {
      invoices = invoices.filter(inv => (inv.invoiceDate || '') <= String(endDate));
    }

    invoices.sort((a, b) => new Date(b.invoiceDate || 0).getTime() - new Date(a.invoiceDate || 0).getTime());

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = invoices.slice(startIndex, startIndex + limitNum);
    const totalAmountSum = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return {
      data: {
        success: true,
        data: paginatedItems,
        pagination: {
          total: invoices.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(invoices.length / limitNum) || 1
        },
        summary: {
          totalFilteredInvoices: invoices.length,
          totalAmount: totalAmountSum
        }
      }
    };
  }

  // Single Invoice (/invoices/:id)
  if (cleanUrl.startsWith('/invoices/')) {
    const invId = cleanUrl.replace('/invoices/', '').split('/')[0];
    const inv = cacheInvoices.find(i => String(i.id) === invId || (i.invoiceNumber && i.invoiceNumber.toLowerCase() === invId.toLowerCase()));
    if (inv) {
      if (method === 'PATCH' && cleanUrl.endsWith('/status')) {
        inv.status = body.status || inv.status;
        recalculateCommittedAmounts();
        try {
          await setDoc(doc(db, 'invoices', String(inv._docId || inv.id)), inv, { merge: true });
          markStale();
        } catch (e) {}
        void logAudit('UPDATE', 'Invoice', inv.invoiceNumber, `Status → ${inv.status}`);
        return { data: { success: true, data: inv } };
      }
      return { data: { success: true, data: inv } };
    }
  }

  // Reports
  if (cleanUrl === '/reports/departments') {
    const result = cacheDepts.map(dept => {
      const deptAlloc = cacheAllocs.filter(a => a.departmentId === dept.id || a.departmentCode.toUpperCase() === dept.code.toUpperCase());
      const deptPRs = cachePRs.filter(p => p.departmentId === dept.id || p.departmentCode.toUpperCase() === dept.code.toUpperCase());

      const allocated = deptAlloc.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const prCommitted = deptAlloc.reduce((sum, a) => sum + a.committedAmount, 0);
      const actualUtilized = deptAlloc.reduce((sum, a) => sum + (a.actualUtilizedAmount || 0), 0);
      const remaining = allocated - prCommitted - actualUtilized;
      const utilizationPct = allocated > 0 ? parseFloat((((prCommitted + actualUtilized) / allocated) * 100).toFixed(2)) : 0;

      return {
        departmentCode: dept.code,
        departmentName: dept.name,
        category: dept.category,
        allocatedBudget: allocated,
        prCommittedAmount: prCommitted,
        actualUtilizedAmount: actualUtilized,
        remainingBudget: remaining,
        utilizationPercentage: utilizationPct,
        prCount: deptPRs.length
      };
    });

    return { data: { success: true, data: result } };
  }

  if (cleanUrl === '/reports/budget-heads') {
    const result = cacheHeads.map(head => {
      const headAlloc = cacheAllocs.filter(a => a.budgetHeadId === head.id || a.budgetHeadCode === head.code);

      const allocated = headAlloc.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const prCommitted = headAlloc.reduce((sum, a) => sum + a.committedAmount, 0);
      const actualUtilized = headAlloc.reduce((sum, a) => sum + (a.actualUtilizedAmount || 0), 0);
      const remaining = allocated - prCommitted - actualUtilized;
      const utilizationPct = allocated > 0 ? parseFloat((((prCommitted + actualUtilized) / allocated) * 100).toFixed(2)) : 0;

      return {
        budgetCode: head.code,
        budgetHeadName: head.name,
        category: head.category,
        allocatedBudget: allocated,
        prCommittedAmount: prCommitted,
        actualUtilizedAmount: actualUtilized,
        remainingBudget: remaining,
        utilizationPercentage: utilizationPct
      };
    });

    return { data: { success: true, data: result } };
  }

  if (cleanUrl === '/reports/monthly') {
    const monthMap: Record<string, { month: string; prCount: number; totalPRValue: number }> = {};
    cachePRs.forEach(pr => {
      if (!pr.prDate) return;
      const monthKey = pr.prDate.substring(0, 7);
      if (!monthMap[monthKey]) {
        const parts = monthKey.split('-');
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthMap[monthKey] = { month: monthName, prCount: 0, totalPRValue: 0 };
      }
      monthMap[monthKey].prCount += 1;
      monthMap[monthKey].totalPRValue += (pr.totalAmount || 0);
    });

    return { data: { success: true, data: Object.values(monthMap) } };
  }

  if (cleanUrl === '/reports/pr-status') {
    const summary = {
      approved: { count: 0, totalValue: 0 },
      pending: { count: 0, totalValue: 0 },
      rejected: { count: 0, totalValue: 0 },
      open: { count: 0, totalValue: 0 },
      closed: { count: 0, totalValue: 0 }
    };

    cachePRs.forEach(p => {
      const amt = p.totalAmount || 0;
      if (p.approvalStatus === 'Approved') {
        summary.approved.count += 1;
        summary.approved.totalValue += amt;
      } else if (p.approvalStatus === 'Pending') {
        summary.pending.count += 1;
        summary.pending.totalValue += amt;
      } else if (p.approvalStatus === 'Rejected') {
        summary.rejected.count += 1;
        summary.rejected.totalValue += amt;
      }

      if (p.status === 'Closed' || p.prPoStatus === 'Closed') {
        summary.closed.count += 1;
        summary.closed.totalValue += amt;
      } else {
        summary.open.count += 1;
        summary.open.totalValue += amt;
      }
    });

    return { data: { success: true, data: summary } };
  }

  // Users Management (/users)
  if (cleanUrl === '/users' || cleanUrl === '/users/') {
    if (method === 'POST') {
      const newUser = {
        ...body,
        id: nextId(cacheUsers),
        createdAt: new Date().toISOString()
      };
      cacheUsers.push(newUser);
      return { data: { success: true, data: newUser } };
    }
    return { data: { success: true, data: cacheUsers } };
  }

  // Dashboard Summary
  if (cleanUrl === '/dashboard/summary') {
    const totalAllocated = cacheAllocs.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0);
    const totalCommitted = cacheAllocs.reduce((sum, a) => sum + (a.committedAmount || 0), 0);
    const totalActualUtilized = cacheAllocs.reduce((sum, a) => sum + (a.actualUtilizedAmount || 0), 0);
    const totalRemaining = totalAllocated - totalCommitted - totalActualUtilized;
    const utilizationPct = totalAllocated > 0 ? parseFloat((((totalCommitted + totalActualUtilized) / totalAllocated) * 100).toFixed(2)) : 0;

    const approvedPRs = cachePRs.filter(p => p.approvalStatus === 'Approved').length;
    const pendingPRs = cachePRs.filter(p => p.approvalStatus === 'Pending').length;
    const rejectedPRs = cachePRs.filter(p => p.approvalStatus === 'Rejected').length;

    return {
      data: {
        success: true,
        data: {
          totalAllocated,
          totalCommitted,
          totalActualUtilized,
          totalRemaining,
          utilizationPct,
          totalPRs: cachePRs.length,
          approvedPRs,
          pendingPRs,
          rejectedPRs
        }
      }
    };
  }

  // Dashboard Monthly PR
  if (cleanUrl === '/dashboard/monthly-pr') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap: Record<string, { monthKey: string; month: string; prCount: number; prAmount: number }> = {};

    ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].forEach(key => {
      const parts = key.split('-');
      const monthName = monthNames[parseInt(parts[1], 10) - 1];
      monthMap[key] = { monthKey: key, month: `${monthName} ${parts[0]}`, prCount: 0, prAmount: 0 };
    });

    cachePRs.forEach(pr => {
      if (!pr.prDate) return;
      const monthKey = pr.prDate.substring(0, 7);
      if (!monthMap[monthKey]) {
        const parts = monthKey.split('-');
        const monthIndex = parseInt(parts[1], 10) - 1;
        const monthName = monthNames[monthIndex] || parts[1];
        monthMap[monthKey] = { monthKey, month: `${monthName} ${parts[0]}`, prCount: 0, prAmount: 0 };
      }
      monthMap[monthKey].prCount += 1;
      monthMap[monthKey].prAmount += (pr.totalAmount || 0);
    });

    const result = Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    return {
      data: {
        success: true,
        data: result
      }
    };
  }

  // Department Utilization
  if (cleanUrl === '/dashboard/department-utilization') {
    const deptMap: Record<string, { code: string; name: string; allocated: number; committed: number; actualUtilized: number; remaining: number }> = {};

    cacheAllocs.forEach(a => {
      if (!deptMap[a.departmentCode]) {
        deptMap[a.departmentCode] = { code: a.departmentCode, name: a.departmentName, allocated: 0, committed: 0, actualUtilized: 0, remaining: 0 };
      }
      deptMap[a.departmentCode].allocated += a.allocatedAmount;
      deptMap[a.departmentCode].committed += a.committedAmount;
      deptMap[a.departmentCode].actualUtilized += a.actualUtilizedAmount || 0;
    });

    const result = Object.values(deptMap)
      .filter(d => d.allocated > 0 || d.committed > 0 || d.actualUtilized > 0)
      .map(d => ({
        ...d,
        remaining: d.allocated - d.committed - d.actualUtilized,
        utilizationPct: d.allocated > 0 ? parseFloat((((d.committed + d.actualUtilized) / d.allocated) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.allocated - a.allocated);

    return {
      data: {
        success: true,
        data: result
      }
    };
  }

  // Top Spenders
  if (cleanUrl === '/dashboard/top-spenders') {
    const deptMap: Record<string, { code: string; name: string; committedAmount: number; allocatedAmount: number; actualUtilized: number; utilizationPct: number }> = {};

    cacheAllocs.forEach(a => {
      if (!deptMap[a.departmentCode]) {
        deptMap[a.departmentCode] = { code: a.departmentCode, name: a.departmentName, committedAmount: 0, allocatedAmount: 0, actualUtilized: 0, utilizationPct: 0 };
      }
      deptMap[a.departmentCode].committedAmount += a.committedAmount;
      deptMap[a.departmentCode].allocatedAmount += a.allocatedAmount;
      deptMap[a.departmentCode].actualUtilized += a.actualUtilizedAmount || 0;
    });

    const result = Object.values(deptMap)
      .map(d => ({
        ...d,
        utilizationPct: d.allocatedAmount > 0 ? parseFloat((((d.committedAmount + d.actualUtilized) / d.allocatedAmount) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.committedAmount - a.committedAmount)
      .slice(0, 10);

    return {
      data: {
        success: true,
        data: result
      }
    };
  }

  // Budget Alerts
  if (cleanUrl === '/dashboard/budget-alerts') {
    const alerts = {
      normal: cacheAllocs.filter(a => a.alertStatus === 'Normal'),
      warning: cacheAllocs.filter(a => a.alertStatus === 'Warning'),
      critical: cacheAllocs.filter(a => a.alertStatus === 'Critical'),
      exceeded: cacheAllocs.filter(a => a.alertStatus === 'Exceeded')
    };

    return {
      data: {
        success: true,
        summary: {
          normalCount: alerts.normal.length,
          warningCount: alerts.warning.length,
          criticalCount: alerts.critical.length,
          exceededCount: alerts.exceeded.length
        },
        flagged: [
          ...alerts.exceeded,
          ...alerts.critical,
          ...alerts.warning
        ].slice(0, 50)
      }
    };
  }

  // ===========================================================================
  // ERP Procure-to-Pay module endpoints (vendors, quotations, POs, GRNs,
  // inventory, stock issues, invoices, payments, part-payments, DC notes,
  // projects). Backed by their own Firestore collections, seeded on first use.
  // ===========================================================================

  // Master data list / create (GET|POST /erp/master)
  if (cleanUrl === '/erp/master') {
    if (method === 'POST') {
      const type = body.type as string;
      const prefix = (type || 'MSTR').toUpperCase().slice(0, 4);
      const newItem = stampCreate({ ...body.data, id: erpNewId(prefix), masterType: type, status: 'PENDING_APPROVAL' });
      if (!cacheErpMasters[type]) cacheErpMasters[type] = [];
      cacheErpMasters[type].unshift(newItem);
      try {
        await setDoc(doc(db, 'erpMasters', String(newItem.id)), newItem);
        markStale();
      } catch (e) {}
      void logAudit('CREATE', `Master:${type}`, newItem.id, `Added ${newItem.name || newItem.code || 'record'}`);
      return { data: { success: true, data: newItem } };
    }
    const type = String(params.type || 'vendors');
    return { data: { success: true, data: cacheErpMasters[type] || [] } };
  }

  // Pending master approvals (GET /erp/master/approvals)
  if (cleanUrl === '/erp/master/approvals') {
    const pending: any[] = [];
    Object.entries(cacheErpMasters).forEach(([type, items]) => {
      items.forEach(item => {
        if (item.status === 'PENDING_APPROVAL') pending.push({ type, record: item });
      });
    });
    return { data: { success: true, data: pending } };
  }

  // Approve / reject master (POST /erp/master/approve)
  if (cleanUrl === '/erp/master/approve' && method === 'POST') {
    const { type, id, action, remarks } = body;
    const target = (cacheErpMasters[type] || []).find((item: any) => item.id === id);
    if (target) {
      target.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      try {
        await setDoc(doc(db, 'erpMasters', String(target._docId || target.id)), target, { merge: true });
        markStale();
      } catch (e) {}
      void logAudit(action === 'APPROVE' ? 'APPROVE' : 'REJECT', `Master:${type}`, id, remarks || '');
    }
    return { data: { success: true, data: target } };
  }

  // Quotations (GET|POST /erp/quotations, POST /erp/quotations/:id/select-winner)
  if (cleanUrl === '/erp/quotations') {
    if (method === 'POST') {
      const rec = stampCreate({ ...body, id: erpNewId('QUOTE'), status: body.status || 'SUBMITTED' }, body.quoteNumber);
      cacheQuotations.unshift(rec);
      try { await setDoc(doc(db, 'quotations', String(rec.id)), rec); markStale(); } catch (e) {}
      void logAudit('CREATE', 'Quotation', rec.quoteNumber || rec.id, `Quote from ${rec.vendorName || 'vendor'}`);
      return { data: { success: true, data: rec } };
    }
    return { data: { success: true, data: cacheQuotations } };
  }
  if (cleanUrl.startsWith('/erp/quotations/') && cleanUrl.endsWith('/select-winner') && method === 'POST') {
    const qId = cleanUrl.replace('/erp/quotations/', '').replace('/select-winner', '');
    const q = cacheQuotations.find(x => String(x.id) === qId);
    if (q) {
      q.status = 'SELECTED';
      try { await setDoc(doc(db, 'quotations', String(q._docId || q.id)), q, { merge: true }); markStale(); } catch (e) {}
      void logAudit('APPROVE', 'Quotation', q.quoteNumber || q.id, `Selected as winning vendor: ${q.vendorName || ''}`);
    }
    return { data: { success: true, data: q } };
  }

  // Generic ERP collections: list + create
  const ERP_COLLECTIONS: Record<string, { cache: any[]; col: string; idPrefix: string; numberField?: string; numberPrefix?: string; defaultStatus?: string; dateField?: string; entity: string }> = {
    '/erp/pos': { cache: cacheErpPos, col: 'erpPos', idPrefix: 'PO', numberField: 'poNumber', numberPrefix: 'PO', defaultStatus: 'APPROVED', dateField: 'poDate', entity: 'PurchaseOrder' },
    '/erp/grns': { cache: cacheGrns, col: 'grns', idPrefix: 'GRN', numberField: 'grnNumber', numberPrefix: 'GRN', defaultStatus: 'VERIFIED', dateField: 'receivedDate', entity: 'GRN' },
    '/erp/inventory': { cache: cacheInventory, col: 'inventory', idPrefix: 'INV', entity: 'Inventory' },
    '/erp/stock-issues': { cache: cacheStockIssues, col: 'stockIssues', idPrefix: 'ISS', numberField: 'issueNumber', numberPrefix: 'ISS', defaultStatus: 'ISSUED', dateField: 'issueDate', entity: 'StockIssue' },
    '/erp/invoices': { cache: cacheErpInvoices, col: 'erpInvoices', idPrefix: 'INV', numberField: 'invoiceNumber', numberPrefix: 'INV', defaultStatus: 'PENDING_APPROVAL', entity: 'ERPInvoice' },
    '/erp/payments': { cache: cacheErpPayments, col: 'payments', idPrefix: 'PAY', numberField: 'paymentNumber', numberPrefix: 'PAY', defaultStatus: 'PROCESSED', dateField: 'paymentDate', entity: 'Payment' },
    '/erp/part-payments': { cache: cachePartPayments, col: 'partPayments', idPrefix: 'PP', defaultStatus: 'PENDING_APPROVAL', entity: 'PartPayment' },
    '/erp/dc-notes': { cache: cacheDcNotes, col: 'dcNotes', idPrefix: 'DC', numberField: 'noteNumber', numberPrefix: 'DC', defaultStatus: 'APPROVED', dateField: 'noteDate', entity: 'DCNote' },
    '/erp/projects': { cache: cacheProjects, col: 'projects', idPrefix: 'PROJ', defaultStatus: 'PLANNED', entity: 'Project' }
  };
  if (ERP_COLLECTIONS[cleanUrl]) {
    const cfg = ERP_COLLECTIONS[cleanUrl];
    if (method === 'POST') {
      const rec: any = { ...body, id: erpNewId(cfg.idPrefix) };
      if (cfg.numberField && !rec[cfg.numberField]) rec[cfg.numberField] = erpNewNumber(cfg.numberPrefix || cfg.idPrefix);
      if (cfg.defaultStatus && !rec.status) rec.status = cfg.defaultStatus;
      if (cfg.dateField && !rec[cfg.dateField]) rec[cfg.dateField] = new Date().toISOString().split('T')[0];
      if (cfg.entity === 'Project') { rec.committedAmount = rec.committedAmount || 0; rec.actualSpent = rec.actualSpent || 0; }
      if (cfg.entity === 'ERPInvoice') rec.matched3Way = rec.matched3Way ?? true;
      stampCreate(rec, cfg.numberField ? rec[cfg.numberField] : undefined);
      cfg.cache.unshift(rec);
      try { await setDoc(doc(db, cfg.col, String(rec.id)), rec); markStale(); } catch (e) {}
      void logAudit('CREATE', cfg.entity, rec[cfg.numberField || 'id'] || rec.id, '');
      return { data: { success: true, data: rec } };
    }
    return { data: { success: true, data: cfg.cache } };
  }

  // Generic status transition (POST /erp/:collection/:id/transition, body {to, role, note})
  // Central governance point per §4/§7: validates the transition against the
  // lifecycle map + role, appends history, then persists. Never sets status blindly.
  if (cleanUrl.startsWith('/erp/') && cleanUrl.endsWith('/transition') && method === 'POST') {
    const parts = cleanUrl.replace('/erp/', '').replace('/transition', '').split('/');
    const colKey = parts[0];
    const recId = parts[1];
    const TRANSITION_MAP: Record<string, { cache: any[]; col: string; entity: EntityKind }> = {
      pos: { cache: cacheErpPos, col: 'erpPos', entity: 'PO' },
      grns: { cache: cacheGrns, col: 'grns', entity: 'GRN' },
      invoices: { cache: cacheErpInvoices, col: 'erpInvoices', entity: 'INVOICE' },
      payments: { cache: cacheErpPayments, col: 'payments', entity: 'PAYMENT' },
      'dc-notes': { cache: cacheDcNotes, col: 'dcNotes', entity: 'DC_NOTE' },
      'stock-issues': { cache: cacheStockIssues, col: 'stockIssues', entity: 'STOCK_ISSUE' }
    };
    const cfg = TRANSITION_MAP[colKey];
    if (cfg) {
      const rec = cfg.cache.find(r => String(r.id) === recId);
      if (!rec) return { data: { success: false, message: 'Record not found' } };
      const to = body.to as string;
      const check = canTransition(cfg.entity, rec.status, to, body.role);
      if (!check.ok) return { data: { success: false, message: check.reason } };
      const prev = rec.status;
      rec.status = to;
      appendHistory(rec, `STATUS ${prev} → ${to}`, body.note);
      try { await setDoc(doc(db, cfg.col, String(rec._docId || rec.id)), rec, { merge: true }); markStale(); } catch (e) {}
      void logAudit('UPDATE', cfg.entity, rec.refNumber || rec.id, `Status ${prev} → ${to}`);
      return { data: { success: true, data: rec } };
    }
  }

  // ERP summary metrics (GET /erp/summary)
  if (cleanUrl === '/erp/summary') {
    return {
      data: {
        success: true,
        data: {
          totalPRs: cachePRs.length,
          totalPOs: cacheErpPos.length,
          totalGRNs: cacheGrns.length,
          totalInvoices: cacheErpInvoices.length,
          pendingApprovalsCount:
            cachePRs.filter(p => p.approvalStatus === 'Pending').length +
            (cacheErpMasters.vendors || []).filter((v: any) => v.status === 'PENDING_APPROVAL').length,
          totalInventoryValue: cacheInventory.reduce((sum, i) => sum + (i.totalValue || 0), 0),
          activeProjectsCount: cacheProjects.filter(p => p.status === 'ACTIVE').length,
          totalPaymentsProcessed: cacheErpPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
        }
      }
    };
  }

  // Global search across PRs, POs, vendors and invoices (GET /search?q=)
  if (cleanUrl === '/search') {
    const q = String(params.q || params.search || '').toLowerCase().trim();
    if (!q) return { data: { success: true, data: [] } };
    const results: Array<{ type: string; label: string; sublabel: string; route: string }> = [];
    cachePRs.forEach(p => {
      if ((p.prNumber || '').toLowerCase().includes(q) || (p.departmentName || '').toLowerCase().includes(q) || (p.purpose || '').toLowerCase().includes(q)) {
        results.push({ type: 'PR', label: p.prNumber, sublabel: `${p.departmentName || p.departmentCode} · ₹${p.totalAmount || 0}`, route: '/prs/all' });
      }
    });
    cacheErpPos.forEach(p => {
      if ((p.poNumber || '').toLowerCase().includes(q) || (p.vendorName || '').toLowerCase().includes(q)) {
        results.push({ type: 'PO', label: p.poNumber, sublabel: `${p.vendorName || ''} · ₹${p.netAmount || p.totalAmount || 0}`, route: '/pos/my-pos' });
      }
    });
    (cacheErpMasters.vendors || []).forEach((v: any) => {
      if ((v.name || '').toLowerCase().includes(q) || (v.code || '').toLowerCase().includes(q) || (v.gstNo || '').toLowerCase().includes(q)) {
        results.push({ type: 'Vendor', label: v.name, sublabel: `${v.code} · ${v.category || ''}`, route: '/erp/master-data' });
      }
    });
    cacheInvoices.forEach(inv => {
      if ((inv.invoiceNumber || '').toLowerCase().includes(q) || (inv.vendorName || '').toLowerCase().includes(q)) {
        results.push({ type: 'Invoice', label: inv.invoiceNumber, sublabel: `${inv.vendorName || ''} · ₹${inv.totalAmount || 0}`, route: '/invoices' });
      }
    });
    return { data: { success: true, data: results.slice(0, 20) } };
  }

  // Fallback default response
  return {
    data: {
      success: true,
      data: []
    }
  };
}
