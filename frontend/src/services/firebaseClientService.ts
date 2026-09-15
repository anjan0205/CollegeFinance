import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  EMBEDDED_DEPARTMENTS, 
  EMBEDDED_BUDGET_HEADS, 
  EMBEDDED_BUDGET_ALLOCATIONS, 
  EMBEDDED_PRS, 
  EMBEDDED_INVOICES, 
  EMBEDDED_USERS 
} from '../data/embeddedMasterDataset';

let cacheDepts = [...EMBEDDED_DEPARTMENTS];
let cacheHeads = [...EMBEDDED_BUDGET_HEADS];
let cacheAllocs = [...EMBEDDED_BUDGET_ALLOCATIONS];
let cachePRs = [...EMBEDDED_PRS];
let cacheInvoices = [...EMBEDDED_INVOICES];
let cacheUsers = [...EMBEDDED_USERS];

let isSyncedFromFirestore = false;

async function fetchFirestoreCollection(colName: string): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, colName));
    const docs: any[] = [];
    snap.forEach(d => {
      docs.push(d.data());
    });
    return docs;
  } catch (e) {
    return [];
  }
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

export async function syncClientWithFirestore() {
  if (isSyncedFromFirestore) return;
  try {
    const prDocs = await fetchFirestoreCollection('prs');
    if (prDocs.length >= 50) {
      cachePRs = prDocs.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }
    const deptDocs = await fetchFirestoreCollection('departments');
    if (deptDocs.length > 0) cacheDepts = deptDocs.sort((a, b) => Number(a.id) - Number(b.id));
    
    const headDocs = await fetchFirestoreCollection('budgetHeads');
    if (headDocs.length > 0) cacheHeads = headDocs.sort((a, b) => Number(a.id) - Number(b.id));
    
    const allocDocs = await fetchFirestoreCollection('budgetAllocations');
    if (allocDocs.length > 0) cacheAllocs = allocDocs.sort((a, b) => Number(a.id) - Number(b.id));

    const invDocs = await fetchFirestoreCollection('invoices');
    if (invDocs.length > 0) cacheInvoices = invDocs.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

    recalculateCommittedAmounts();
    isSyncedFromFirestore = true;
  } catch (err) {
    recalculateCommittedAmounts();
  }
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
        await setDoc(doc(db, 'budgetAllocations', String(alloc.id)), alloc, { merge: true });
      } catch (e) {}
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
      const newPR = {
        ...body,
        id: cachePRs.length + 1,
        prNumber: body.prNumber || `PR-2026-MANUAL-${cachePRs.length + 1}`,
        createdAt: new Date().toISOString(),
        approvalStatus: body.approvalStatus || 'Approved',
        status: body.status || 'Approved'
      };
      cachePRs.unshift(newPR);
      recalculateCommittedAmounts();
      try {
        await setDoc(doc(db, 'prs', String(newPR.id)), newPR);
      } catch (e) {}
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
      if (method === 'PATCH' && cleanUrl.endsWith('/status')) {
        pr.approvalStatus = body.approvalStatus || pr.approvalStatus;
        pr.status = body.status || pr.status;
        recalculateCommittedAmounts();
        try {
          await setDoc(doc(db, 'prs', String(pr.id)), pr, { merge: true });
        } catch (e) {}
        return { data: { success: true, data: pr } };
      }
      return { data: { success: true, data: pr } };
    }
  }

  // Invoices List & Management (/invoices)
  if (cleanUrl === '/invoices' || cleanUrl === '/invoices/') {
    if (method === 'POST') {
      const newInvoice = {
        ...body,
        id: cacheInvoices.length + 1,
        invoiceNumber: body.invoiceNumber || `INV-2026-${cacheInvoices.length + 1}`,
        createdAt: new Date().toISOString(),
        status: body.status || 'Paid'
      };
      cacheInvoices.unshift(newInvoice);
      recalculateCommittedAmounts();
      try {
        await setDoc(doc(db, 'invoices', String(newInvoice.id)), newInvoice);
      } catch (e) {}
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
          await setDoc(doc(db, 'invoices', String(inv.id)), inv, { merge: true });
        } catch (e) {}
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
        id: cacheUsers.length + 1,
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

  // Fallback default response
  return {
    data: {
      success: true,
      data: []
    }
  };
}
