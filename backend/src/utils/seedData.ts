import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Department, BudgetHead, BudgetAllocation, PRRecord, PRItem, User } from '../types';

let departments: Department[] = [];
let budgetHeads: BudgetHead[] = [];
let budgetAllocations: BudgetAllocation[] = [];
let prRecords: PRRecord[] = [];
let prItemsMap: Map<number, PRItem[]> = new Map();
let users: User[] = [];

let isInitialized = false;

// Department Mapping
const DEPT_NAME_MAP: Record<string, { name: string; category: string }> = {
  CE: { name: 'Civil Engineering', category: 'Academic' },
  CIVIL: { name: 'Civil Engineering', category: 'Academic' },
  EEE: { name: 'Electrical & Electronics Engineering', category: 'Academic' },
  ME: { name: 'Mechanical Engineering', category: 'Academic' },
  MECH: { name: 'Mechanical Engineering', category: 'Academic' },
  ECE: { name: 'Electronics & Communication Engineering', category: 'Academic' },
  ECM: { name: 'Electronics & Computer Engineering', category: 'Academic' },
  CSE: { name: 'Computer Science & Engineering', category: 'Academic' },
  AI: { name: 'Artificial Intelligence', category: 'Academic' },
  CS: { name: 'Cyber Security', category: 'Academic' },
  DS: { name: 'Data Science', category: 'Academic' },
  AIDS: { name: 'AI & Data Science', category: 'Academic' },
  IT: { name: 'Information Technology', category: 'Academic' },
  'BS&H': { name: 'Basic Sciences & Humanities', category: 'Academic' },
  MCA: { name: 'Master of Computer Applications', category: 'Academic' },
  MBA: { name: 'Master of Business Administration', category: 'Academic' },
  DOA: { name: 'Dean Administration', category: 'Administrative' },
  ADMIN: { name: 'Dean Administration', category: 'Administrative' },
  'ADMIN OFFICE': { name: 'Dean Administration', category: 'Administrative' },
  DAC: { name: 'Dean Academics', category: 'Dean' },
  ACADEMICS: { name: 'Dean Academics', category: 'Dean' },
  EC: { name: 'Examination Cell', category: 'Administrative' },
  'EXAM CELL': { name: 'Examination Cell', category: 'Administrative' },
  DRD: { name: 'Dean R&D', category: 'Dean' },
  'R&D': { name: 'Dean R&D', category: 'Dean' },
  DTP: { name: 'Dean Training & Placement', category: 'Dean' },
  T_P: { name: 'Dean Training & Placement', category: 'Dean' },
  'T&P': { name: 'Dean Training & Placement', category: 'Dean' },
  DSA: { name: 'Dean Student Affairs', category: 'Dean' },
  'STUDENT AFFAIRS': { name: 'Dean Student Affairs', category: 'Dean' },
  DAD: { name: 'Dean Admissions', category: 'Dean' },
  ADMISSION: { name: 'Dean Admissions', category: 'Dean' },
  DIQ: { name: 'Dean IQAC', category: 'Dean' },
  IQAC: { name: 'Dean IQAC', category: 'Dean' },
  DFA: { name: 'Dean Faculty Affairs', category: 'Dean' },
  'DEAN FA': { name: 'Dean Faculty Affairs', category: 'Dean' },
  'FACULTY AFFIARS': { name: 'Dean Faculty Affairs', category: 'Dean' },
  Dinf: { name: 'Dean Infrastructure', category: 'Administrative' },
  INFRA: { name: 'Dean Infrastructure', category: 'Administrative' },
  Disa: { name: 'Dean International Students', category: 'Dean' },
  VCIS: { name: 'VCIS Cell', category: 'Administrative' },
  SC: { name: 'System Cell', category: 'Central' },
  'I/C SYSTEM CELL': { name: 'System Cell', category: 'Central' },
  ELC: { name: 'I/c Electrical', category: 'Central' },
  'I/C ELECTRICAL': { name: 'I/c Electrical', category: 'Central' },
  Lib: { name: 'Library', category: 'Central' },
  'I/C LIBRARY': { name: 'Library', category: 'Central' },
  WPC: { name: 'Women Protection Cell', category: 'Administrative' },
  ATT: { name: 'I/c Attendance', category: 'Administrative' },
  'I/C ATTENDANCE': { name: 'I/c Attendance', category: 'Administrative' },
  MC: { name: 'Media Cell', category: 'Administrative' },
  'MEDIA CELL': { name: 'Media Cell', category: 'Administrative' },
  FINANCE: { name: 'Finance Office', category: 'Administrative' },
};

export function loadSeedData() {
  if (isInitialized) return;

  const excelPath = path.resolve(__dirname, '../../../reference_excel.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.warn(`[Seed Warning] Excel reference file not found at ${excelPath}. Initializing mock defaults.`);
    initDefaultUsers();
    isInitialized = true;
    return;
  }

  try {
    console.log(`[Seed Engine] Reading reference Excel from ${excelPath}...`);
    const workbook = XLSX.readFile(excelPath);

    // 1. Initialize Users
    initDefaultUsers();

    // 2. Parse Master Budget Sheet
    const masterSheet = workbook.Sheets['Master Budget'];
    if (masterSheet) {
      const rows: any[][] = XLSX.utils.sheet_to_json(masterSheet, { header: 1 });
      if (rows.length > 2) {
        // Row 0 has headers (Budget Code, Item, Type, Dept codes...)
        const headerRow = rows[0];
        const deptCodesInHeader: string[] = [];
        
        for (let colIdx = 3; colIdx < headerRow.length - 1; colIdx++) {
          let rawCode = String(headerRow[colIdx] || '').trim();
          if (rawCode && rawCode !== 'NaN') {
            // Map header names to standard dept codes
            let normCode = rawCode.toUpperCase();
            if (normCode === 'CIVIL') normCode = 'CE';
            if (normCode === 'MECH') normCode = 'ME';
            if (normCode === 'DEAN-ADMIN') normCode = 'DOA';
            if (normCode === 'DEAN-ACADEMICS') normCode = 'DAC';
            if (normCode === 'EXAMINATION CELL') normCode = 'EC';
            if (normCode === 'DEAN-R&D') normCode = 'DRD';
            if (normCode === 'DEAN-T&P') normCode = 'DTP';
            if (normCode === 'DEAN-SA') normCode = 'DSA';
            if (normCode === 'DEAN-ADMISSIONS') normCode = 'DAD';
            if (normCode === 'DEAN-IQAC') normCode = 'DIQ';
            if (normCode === 'DEAN-FA') normCode = 'DFA';
            if (normCode === 'DEAN-INFRA') normCode = 'Dinf';
            if (normCode === 'DEAN-ISA') normCode = 'Disa';
            if (normCode === 'SYSTEM CELL') normCode = 'SC';
            if (normCode === 'I/C ELECTRICAL') normCode = 'ELC';
            if (normCode === 'LIBRARY') normCode = 'Lib';
            if (normCode === 'WOMEN PROTECTION CELL') normCode = 'WPC';
            if (normCode === 'I/C ATTENDANCE') normCode = 'ATT';
            if (normCode === 'MEDIA CELL') normCode = 'MC';

            deptCodesInHeader.push(normCode);
            
            if (!departments.some(d => d.code.toUpperCase() === normCode.toUpperCase())) {
              const deptMeta = DEPT_NAME_MAP[normCode] || { name: normCode, category: 'Academic' };
              departments.push({
                id: departments.length + 1,
                code: normCode,
                name: deptMeta.name,
                category: deptMeta.category
              });
            }
          }
        }

        // Parse Budget Heads & Allocations
        let allocId = 1;
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length < 3) continue;

          const rawCode = row[0];
          const rawName = row[1];
          const rawType = row[2];

          const codeNum = parseInt(String(rawCode), 10);
          if (isNaN(codeNum)) continue;

          const headName = String(rawName || `Budget Head ${codeNum}`).trim();
          const headCategory = String(rawType || 'Recurring').trim();

          let bHead = budgetHeads.find(bh => bh.code === codeNum);
          if (!bHead) {
            bHead = {
              id: budgetHeads.length + 1,
              code: codeNum,
              name: headName,
              category: headCategory
            };
            budgetHeads.push(bHead);
          }

          // Read Department allocations
          for (let colIdx = 3; colIdx < 3 + deptCodesInHeader.length; colIdx++) {
            const deptCode = deptCodesInHeader[colIdx - 3];
            const deptObj = departments.find(d => d.code.toUpperCase() === deptCode.toUpperCase());
            if (!deptObj) continue;

            const allocVal = parseFloat(String(row[colIdx] || 0));
            const allocatedAmt = isNaN(allocVal) ? 0 : allocVal;

            const sourceBudgetCode = `${codeNum}${deptCode}`;

            budgetAllocations.push({
              id: allocId++,
              departmentId: deptObj.id,
              departmentCode: deptObj.code,
              departmentName: deptObj.name,
              budgetHeadId: bHead.id,
              budgetHeadCode: bHead.code,
              budgetHeadName: bHead.name,
              sourceBudgetCode,
              financialYear: '2026-27',
              allocatedAmount: allocatedAmt,
              committedAmount: 0,
              actualUtilizedAmount: 0,
              remainingAmount: allocatedAmt,
              utilizationPercentage: 0,
              alertStatus: 'Normal'
            });
          }
        }
      }
    }

    // 3. Parse PR Data Source (`PR data - source file`)
    const prSourceSheet = workbook.Sheets['PR data - source file'];
    const prMap = new Map<string, PRRecord>();

    if (prSourceSheet) {
      const prSourceRows: any[] = XLSX.utils.sheet_to_json(prSourceSheet);
      let prIdCounter = 1;

      for (const row of prSourceRows) {
        const prNumber = String(row['Pr No'] || '').trim();
        if (!prNumber || prNumber === 'undefined') continue;

        let deptCode = String(row['Dept'] || '').trim();
        let budgetCodeVal = row['Code'] || row['Budget code'] || 101;
        let sourceCode = String(row['Budget code'] || row['Unnamed: 14'] || '').trim();

        // Extract budget code and dept code if available
        let budgetCodeNum = parseInt(String(budgetCodeVal), 10);
        if (isNaN(budgetCodeNum)) budgetCodeNum = 101;

        // Clean dept code
        if (!deptCode) {
          // try to infer from sourceCode e.g. 202AI -> AI
          deptCode = sourceCode.replace(/^[0-9]+/, '') || 'CSE';
        }

        let deptObj = departments.find(d => d.code.toUpperCase() === deptCode.toUpperCase());
        if (!deptObj) {
          deptObj = departments.find(d => d.code.toUpperCase() === 'CSE') || departments[0];
        }

        let headObj = budgetHeads.find(bh => bh.code === budgetCodeNum) || budgetHeads[0];

        const requestedDateRaw = row['PR Requested Date'];
        let prDate = '2026-04-01';
        if (requestedDateRaw) {
          if (typeof requestedDateRaw === 'string') {
            prDate = requestedDateRaw.substring(0, 10);
          } else if (typeof requestedDateRaw === 'number') {
            const dateObj = XLSX.SSF.parse_date_code(requestedDateRaw);
            prDate = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
          }
        }

        const prAmount = parseFloat(String(row['Sum of Total Value'] || 0)) || 0;
        const remarks = String(row['Pr Remarks'] || 'Purchase Requisition').trim();

        if (!prMap.has(prNumber)) {
          const prRecord: PRRecord = {
            id: prIdCounter++,
            prNumber,
            prDate,
            departmentId: deptObj ? deptObj.id : 1,
            departmentCode: deptObj ? deptObj.code : 'CSE',
            departmentName: deptObj ? deptObj.name : 'Computer Science',
            budgetHeadId: headObj ? headObj.id : 1,
            budgetHeadCode: headObj ? headObj.code : 101,
            budgetHeadName: headObj ? headObj.name : 'General',
            requestedBy: 'Department Faculty',
            purpose: remarks,
            totalAmount: prAmount,
            status: 'Open',
            approvalStatus: 'Approved',
            prPoStatus: 'Open',
            approval1: 'HOD Approved',
            approval2: 'Finance Approved',
            approval3: 'Principal Approved',
            sourceBudgetCode: sourceCode || `${budgetCodeNum}${deptCode}`,
            items: []
          };
          prMap.set(prNumber, prRecord);
        }
      }
    }

    // 4. Parse PR Report Details (`PR Report On - Sat Jan 03 2026`)
    const prDetailSheet = workbook.Sheets['PR Report On - Sat Jan 03 2026'];
    if (prDetailSheet) {
      const prDetailRows: any[] = XLSX.utils.sheet_to_json(prDetailSheet);
      let itemIdCounter = 1;

      for (const row of prDetailRows) {
        const prNumber = String(row['Pr No'] || '').trim();
        if (!prNumber || prNumber === 'undefined') continue;

        let prObj = prMap.get(prNumber);

        const requestedBy = String(row['Requested By'] || '').trim();
        const prStatusRaw = String(row['PR Status'] || 'Open').trim();
        const appStatusRaw = String(row['Pr Approval Status'] || 'Approved').trim();
        const poStatusRaw = String(row['PR-PO Status'] || 'Open').trim();
        const app1 = String(row['Approval 1'] || '-NA-').trim();
        const app2 = String(row['Approval 2'] || '-NA-').trim();
        const app3 = String(row['Approval 3'] || '-NA-').trim();

        let status: 'Open' | 'Approved' | 'Pending' | 'Rejected' | 'Closed' = 'Open';
        if (prStatusRaw === 'Closed' || poStatusRaw === 'Closed') status = 'Closed';
        else if (appStatusRaw === 'Rejected' || prStatusRaw === 'Rejected') status = 'Rejected';
        else if (appStatusRaw === 'Approved') status = 'Approved';
        else status = 'Pending';

        let approvalStatus: 'Approved' | 'Pending' | 'Rejected' = 'Approved';
        if (appStatusRaw === 'Rejected') approvalStatus = 'Rejected';
        else if (appStatusRaw === 'Pending') approvalStatus = 'Pending';

        let prPoStatus: 'Open' | 'Closed' | 'In-Process' = 'Open';
        if (poStatusRaw === 'Closed') prPoStatus = 'Closed';

        if (!prObj) {
          // If PR not in source file, create record from detail sheet
          const defaultDept = departments[0] || { id: 1, code: 'CSE', name: 'Computer Science' };
          const defaultHead = budgetHeads[0] || { id: 1, code: 101, name: 'General' };

          prObj = {
            id: prMap.size + 1,
            prNumber,
            prDate: String(row['PR Requested Date'] || '2026-07-01').substring(0, 10),
            departmentId: defaultDept.id,
            departmentCode: defaultDept.code,
            departmentName: defaultDept.name,
            budgetHeadId: defaultHead.id,
            budgetHeadCode: defaultHead.code,
            budgetHeadName: defaultHead.name,
            requestedBy: requestedBy || 'Faculty Member',
            purpose: String(row['Pr Remarks'] || 'Purchase Requisition').trim(),
            totalAmount: parseFloat(String(row['Grand Total'] || row['Total Value'] || 0)) || 0,
            status,
            approvalStatus,
            prPoStatus,
            approval1: app1,
            approval2: app2,
            approval3: app3,
            sourceBudgetCode: `${defaultHead.code}${defaultDept.code}`,
            items: []
          };
          prMap.set(prNumber, prObj);
        } else {
          // Update details on existing record
          if (requestedBy && requestedBy !== '-NA-') prObj.requestedBy = requestedBy;
          prObj.status = status;
          prObj.approvalStatus = approvalStatus;
          prObj.prPoStatus = prPoStatus;
          if (app1 !== '-NA-') prObj.approval1 = app1;
          if (app2 !== '-NA-') prObj.approval2 = app2;
          if (app3 !== '-NA-') prObj.approval3 = app3;
        }

        // Add line item
        const itemQty = parseFloat(String(row['Product Qty'] || 1)) || 1;
        const totalVal = parseFloat(String(row['Total Value'] || 0)) || 0;
        const unitPrice = itemQty > 0 ? totalVal / itemQty : totalVal;

        const prItem: PRItem = {
          id: itemIdCounter++,
          prId: prObj.id,
          productName: String(row['Product Name'] || 'Equipment / Service').trim(),
          productCode: String(row['Product Code'] || '').trim(),
          productType: String(row['Product Type'] || 'goods').trim(),
          productDescription: String(row['Product Description'] || '-NA-').trim(),
          unitTypeName: String(row['Unit Type Name'] || 'Numbers').trim(),
          quantity: itemQty,
          unitPrice,
          totalValue: totalVal,
          currentStock: parseFloat(String(row['Current Stock'] || 0)) || 0,
          preferredVendor: String(row['Preferred Vendor'] || '-NA-').trim(),
          productRequiredBy: String(row['Product Required By'] || '').substring(0, 10),
          itemRemarks: String(row['Product Remarks'] || '-NA-').trim()
        };

        if (!prItemsMap.has(prObj.id)) {
          prItemsMap.set(prObj.id, []);
        }
        prItemsMap.get(prObj.id)!.push(prItem);
      }
    }

    // Array of PRs
    prRecords = Array.from(prMap.values());
    prRecords.forEach(pr => {
      pr.items = prItemsMap.get(pr.id) || [];
    });

    // 5. Update Committed Amounts & Utilization in Allocations
    recalculateCommittedAmounts();

    console.log(`[Seed Engine Success] Loaded:
      - ${departments.length} Departments
      - ${budgetHeads.length} Budget Heads
      - ${budgetAllocations.length} Budget Allocations
      - ${prRecords.length} PR Records (${prItemsMap.size} PRs with items)`);

    isInitialized = true;
  } catch (err) {
    console.error('[Seed Engine Error] Failed to parse Excel file:', err);
    initDefaultUsers();
    isInitialized = true;
  }
}

function initDefaultUsers() {
  users = [
    {
      id: 1,
      name: 'System Admin',
      email: 'admin@vignan.ac.in',
      role: 'ADMIN',
      departmentId: 1,
      departmentCode: 'ADMIN',
      departmentName: 'Administration'
    },
    {
      id: 2,
      name: 'Finance Officer',
      email: 'finance@vignan.ac.in',
      role: 'FINANCE',
      departmentId: 2,
      departmentCode: 'FINANCE',
      departmentName: 'Finance Office'
    },
    {
      id: 3,
      name: 'Dr. CSE HOD',
      email: 'hod.cse@vignan.ac.in',
      role: 'HOD',
      departmentId: 3,
      departmentCode: 'CSE',
      departmentName: 'Computer Science & Engineering'
    },
    {
      id: 4,
      name: 'Dr. ECE HOD',
      email: 'hod.ece@vignan.ac.in',
      role: 'HOD',
      departmentId: 4,
      departmentCode: 'ECE',
      departmentName: 'Electronics & Communication'
    },
    {
      id: 5,
      name: 'Faculty User',
      email: 'user.cse@vignan.ac.in',
      role: 'DEPARTMENT_USER',
      departmentId: 3,
      departmentCode: 'CSE',
      departmentName: 'Computer Science & Engineering'
    }
  ];
}

export function recalculateCommittedAmounts() {
  // Clear committed amounts
  budgetAllocations.forEach(alloc => {
    alloc.committedAmount = 0;
    alloc.actualUtilizedAmount = 0;
  });

  // Calculate from active PRs
  prRecords.forEach(pr => {
    if (pr.status !== 'Rejected' && pr.approvalStatus !== 'Rejected') {
      const alloc = budgetAllocations.find(
        ba => ba.departmentId === pr.departmentId && ba.budgetHeadId === pr.budgetHeadId
      );
      if (alloc) {
        alloc.committedAmount += pr.totalAmount;
        if (pr.status === 'Closed' || pr.prPoStatus === 'Closed') {
          alloc.actualUtilizedAmount += pr.totalAmount;
        }
      }
    }
  });

  // Calculate remaining & utilization % & alerts
  budgetAllocations.forEach(alloc => {
    const totalCommittedOrUtilized = alloc.committedAmount;
    alloc.remainingAmount = alloc.allocatedAmount - totalCommittedOrUtilized;
    
    if (alloc.allocatedAmount > 0) {
      alloc.utilizationPercentage = parseFloat(
        ((totalCommittedOrUtilized / alloc.allocatedAmount) * 100).toFixed(2)
      );
    } else {
      alloc.utilizationPercentage = totalCommittedOrUtilized > 0 ? 100 : 0;
    }

    const pct = alloc.utilizationPercentage;
    if (pct > 100) alloc.alertStatus = 'Exceeded';
    else if (pct >= 85) alloc.alertStatus = 'Critical';
    else if (pct >= 70) alloc.alertStatus = 'Warning';
    else alloc.alertStatus = 'Normal';
  });
}

export function updateAllocationAmount(allocationId: number, newAllocatedAmount: number): BudgetAllocation | null {
  const alloc = budgetAllocations.find(a => a.id === allocationId);
  if (alloc) {
    alloc.allocatedAmount = newAllocatedAmount;
    recalculateCommittedAmounts();
    return alloc;
  }
  return null;
}

export function updateBudgetHeadAllocation(departmentId: number, budgetHeadId: number, newAllocatedAmount: number): BudgetAllocation | null {
  let alloc = budgetAllocations.find(a => a.departmentId === departmentId && a.budgetHeadId === budgetHeadId);
  if (alloc) {
    alloc.allocatedAmount = newAllocatedAmount;
    recalculateCommittedAmounts();
    return alloc;
  }
  return null;
}

export function updatePRStatusRecord(
  id: number,
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected',
  status?: 'Open' | 'Approved' | 'Pending' | 'Rejected' | 'Closed'
): PRRecord | null {
  loadSeedData();
  const pr = prRecords.find(p => p.id === id);
  if (!pr) return null;

  if (approvalStatus) {
    pr.approvalStatus = approvalStatus;
    if (approvalStatus === 'Approved') {
      pr.approval1 = 'HOD Approved';
      pr.approval2 = 'Finance Approved';
      pr.approval3 = 'Admin Approved';
      if (!status) pr.status = 'Approved';
    } else if (approvalStatus === 'Rejected') {
      pr.approval1 = 'Rejected by Admin';
      if (!status) pr.status = 'Rejected';
    } else if (approvalStatus === 'Pending') {
      pr.approval1 = 'Pending Admin Review';
      if (!status) pr.status = 'Pending';
    }
  }

  if (status) {
    pr.status = status;
  }

  recalculateCommittedAmounts();
  return pr;
}

export function createPRRecord(prInput: {
  departmentId: number;
  budgetHeadId: number;
  requestedBy: string;
  purpose: string;
  items: Array<{
    productName: string;
    productDescription?: string;
    quantity: number;
    unitPrice: number;
    preferredVendor?: string;
    itemRemarks?: string;
  }>;
  prDate?: string;
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected';
  status?: 'Open' | 'Approved' | 'Pending' | 'Rejected' | 'Closed';
}): PRRecord {
  loadSeedData();

  const deptObj = departments.find(d => d.id === prInput.departmentId) || departments[0];
  const headObj = budgetHeads.find(bh => bh.id === prInput.budgetHeadId) || budgetHeads[0];

  const nextId = prRecords.length > 0 ? Math.max(...prRecords.map(p => p.id)) + 1 : 1;
  const prNumber = `PR-2026-${String(nextId).padStart(4, '0')}`;
  const prDate = prInput.prDate || new Date().toISOString().substring(0, 10);

  const approvalStatus = prInput.approvalStatus || 'Approved';
  const status = prInput.status || (approvalStatus === 'Approved' ? 'Approved' : 'Pending');

  let totalAmount = 0;
  let itemIdCounter = 1000 + nextId * 10;
  const createdItems: PRItem[] = (prInput.items || []).map(item => {
    const qty = Math.max(1, item.quantity || 1);
    const price = Math.max(0, item.unitPrice || 0);
    const itemTotal = qty * price;
    totalAmount += itemTotal;

    return {
      id: itemIdCounter++,
      prId: nextId,
      productName: item.productName || 'Equipment / Service Item',
      productCode: `PROD-${itemIdCounter}`,
      productType: 'goods',
      productDescription: item.productDescription || '-NA-',
      unitTypeName: 'Numbers',
      quantity: qty,
      unitPrice: price,
      totalValue: itemTotal,
      currentStock: 0,
      preferredVendor: item.preferredVendor || '-NA-',
      productRequiredBy: prDate,
      itemRemarks: item.itemRemarks || '-NA-'
    };
  });

  const newPR: PRRecord = {
    id: nextId,
    prNumber,
    prDate,
    departmentId: deptObj.id,
    departmentCode: deptObj.code,
    departmentName: deptObj.name,
    budgetHeadId: headObj.id,
    budgetHeadCode: headObj.code,
    budgetHeadName: headObj.name,
    requestedBy: prInput.requestedBy || 'Admin Applied PR',
    purpose: prInput.purpose || 'Manual Department Purchase Request',
    totalAmount,
    status,
    approvalStatus,
    prPoStatus: 'Open',
    approval1: approvalStatus === 'Approved' ? 'Admin Approved' : 'Pending Review',
    approval2: approvalStatus === 'Approved' ? 'Finance Approved' : '-NA-',
    approval3: approvalStatus === 'Approved' ? 'Principal Approved' : '-NA-',
    sourceBudgetCode: `${headObj.code}${deptObj.code}`,
    items: createdItems
  };

  prRecords.unshift(newPR);
  prItemsMap.set(nextId, createdItems);

  recalculateCommittedAmounts();
  return newPR;
}

export function createOrUpdateBudgetAllocation(
  departmentId: number,
  budgetHeadId: number,
  allocatedAmount: number,
  financialYear: string = '2026-27'
): BudgetAllocation {
  loadSeedData();

  let alloc = budgetAllocations.find(a => a.departmentId === departmentId && a.budgetHeadId === budgetHeadId);
  const deptObj = departments.find(d => d.id === departmentId);
  const headObj = budgetHeads.find(bh => bh.id === budgetHeadId);

  if (alloc) {
    alloc.allocatedAmount = allocatedAmount;
  } else {
    const nextId = budgetAllocations.length > 0 ? Math.max(...budgetAllocations.map(a => a.id)) + 1 : 1;
    alloc = {
      id: nextId,
      departmentId: deptObj ? deptObj.id : departmentId,
      departmentCode: deptObj ? deptObj.code : `DEPT${departmentId}`,
      departmentName: deptObj ? deptObj.name : `Department ${departmentId}`,
      budgetHeadId: headObj ? headObj.id : budgetHeadId,
      budgetHeadCode: headObj ? headObj.code : budgetHeadId,
      budgetHeadName: headObj ? headObj.name : `Budget Head ${budgetHeadId}`,
      sourceBudgetCode: `${headObj ? headObj.code : budgetHeadId}${deptObj ? deptObj.code : departmentId}`,
      financialYear,
      allocatedAmount,
      committedAmount: 0,
      actualUtilizedAmount: 0,
      remainingAmount: allocatedAmount,
      utilizationPercentage: 0,
      alertStatus: 'Normal'
    };
    budgetAllocations.push(alloc);
  }

  recalculateCommittedAmounts();
  return alloc;
}

// Data Accessors
export function getSeedDepartments(): Department[] {
  loadSeedData();
  return departments;
}

export function getSeedBudgetHeads(): BudgetHead[] {
  loadSeedData();
  return budgetHeads;
}

export function getSeedBudgetAllocations(): BudgetAllocation[] {
  loadSeedData();
  return budgetAllocations;
}

export function getSeedPRRecords(): PRRecord[] {
  loadSeedData();
  return prRecords;
}

export function getSeedUsers(): User[] {
  loadSeedData();
  return users;
}

