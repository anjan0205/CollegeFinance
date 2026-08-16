import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import { Department, BudgetHead, BudgetAllocation, PRRecord, PRItem, User } from '../types';
import { getFirestoreDb, isFirebaseEnabled } from '../config/firebase';
import { getPgStatus, queryPgAsync, executePgQuery } from '../config/postgresDatabase';

let departments: Department[] = [];
let budgetHeads: BudgetHead[] = [];
let budgetAllocations: BudgetAllocation[] = [];
let prRecords: PRRecord[] = [];
let prItemsMap: Map<number, PRItem[]> = new Map();
let users: User[] = [];

let isInitialized = false;

// Department Mapping
export const DEPT_NAME_MAP: Record<string, { code: string; name: string; category: string }> = {
  'CE': { code: 'CE', name: 'Civil Engineering', category: 'Academic' },
  'CIVIL': { code: 'CE', name: 'Civil Engineering', category: 'Academic' },
  'EEE': { code: 'EEE', name: 'Electrical & Electronics Engineering', category: 'Academic' },
  'ME': { code: 'ME', name: 'Mechanical Engineering', category: 'Academic' },
  'MECH': { code: 'ME', name: 'Mechanical Engineering', category: 'Academic' },
  'ECE': { code: 'ECE', name: 'Electronics & Communication Engineering', category: 'Academic' },
  'ECM': { code: 'ECM', name: 'Electronics & Computer Engineering', category: 'Academic' },
  'CSE': { code: 'CSE', name: 'Computer Science & Engineering', category: 'Academic' },
  'AI': { code: 'AI', name: 'Artificial Intelligence', category: 'Academic' },
  'CS': { code: 'CS', name: 'Cyber Security', category: 'Academic' },
  'DS': { code: 'DS', name: 'Data Science', category: 'Academic' },
  'AIDS': { code: 'AIDS', name: 'AI & Data Science', category: 'Academic' },
  'IT': { code: 'IT', name: 'Information Technology', category: 'Academic' },
  'BS&H': { code: 'BS&H', name: 'Basic Sciences & Humanities', category: 'Academic' },
  'MCA': { code: 'MCA', name: 'Master of Computer Applications', category: 'Academic' },
  'MBA': { code: 'MBA', name: 'Master of Business Administration', category: 'Academic' },
  'DOA': { code: 'DOA', name: 'Dean Administration', category: 'Administrative' },
  'ADMIN': { code: 'DOA', name: 'Dean Administration', category: 'Administrative' },
  'ADMIN OFFICE': { code: 'DOA', name: 'Dean Administration', category: 'Administrative' },
  'DAC': { code: 'DAC', name: 'Dean Academics', category: 'Dean' },
  'ACADEMICS': { code: 'DAC', name: 'Dean Academics', category: 'Dean' },
  'EC': { code: 'EC', name: 'Examination Cell', category: 'Administrative' },
  'EXAM CELL': { code: 'EC', name: 'Examination Cell', category: 'Administrative' },
  'DRD': { code: 'DRD', name: 'Dean R&D', category: 'Dean' },
  'R&D': { code: 'DRD', name: 'Dean R&D', category: 'Dean' },
  'DTP': { code: 'DTP', name: 'Dean Training & Placement', category: 'Dean' },
  'T&P': { code: 'DTP', name: 'Dean Training & Placement', category: 'Dean' },
  'T_P': { code: 'DTP', name: 'Dean Training & Placement', category: 'Dean' },
  'PD': { code: 'DTP', name: 'Dean Training & Placement', category: 'Dean' },
  'DSA': { code: 'DSA', name: 'Dean Student Affairs', category: 'Dean' },
  'DEAN SA': { code: 'DSA', name: 'Dean Student Affairs', category: 'Dean' },
  'STUDENT AFFAIRS': { code: 'DSA', name: 'Dean Student Affairs', category: 'Dean' },
  'DAD': { code: 'DAD', name: 'Dean Admissions', category: 'Dean' },
  'ADMISSION': { code: 'DAD', name: 'Dean Admissions', category: 'Dean' },
  'DIQ': { code: 'DIQ', name: 'Dean IQAC', category: 'Dean' },
  'IQAC': { code: 'DIQ', name: 'Dean IQAC', category: 'Dean' },
  'DFA': { code: 'DFA', name: 'Dean Faculty Affairs', category: 'Dean' },
  'DEAN FA': { code: 'DFA', name: 'Dean Faculty Affairs', category: 'Dean' },
  'FACULTY AFFAIRS': { code: 'DFA', name: 'Dean Faculty Affairs', category: 'Dean' },
  'FACULTY AFFIARS': { code: 'DFA', name: 'Dean Faculty Affairs', category: 'Dean' },
  'DINF': { code: 'Dinf', name: 'Dean Infrastructure', category: 'Administrative' },
  'INFRA': { code: 'Dinf', name: 'Dean Infrastructure', category: 'Administrative' },
  'NEW BUIDLING': { code: 'Dinf', name: 'Dean Infrastructure', category: 'Administrative' },
  'NEW SCHOOL BUIDLING': { code: 'Dinf', name: 'Dean Infrastructure', category: 'Administrative' },
  'DISA': { code: 'Disa', name: 'Dean International Students', category: 'Dean' },
  'VCIS': { code: 'VCIS', name: 'VCIS Cell', category: 'Administrative' },
  'VCIS ': { code: 'VCIS', name: 'VCIS Cell', category: 'Administrative' },
  'SC': { code: 'SC', name: 'System Cell', category: 'Central' },
  'SYSTEM CELL': { code: 'SC', name: 'System Cell', category: 'Central' },
  'I/C SYSTEM CELL': { code: 'SC', name: 'System Cell', category: 'Central' },
  'ELC': { code: 'ELC', name: 'I/c Electrical', category: 'Central' },
  'I/C ELECTRICAL': { code: 'ELC', name: 'I/c Electrical', category: 'Central' },
  'LIB': { code: 'Lib', name: 'Library', category: 'Central' },
  'LIBRARY': { code: 'Lib', name: 'Library', category: 'Central' },
  'I/C LIBRARY': { code: 'Lib', name: 'Library', category: 'Central' },
  'WPC': { code: 'WPC', name: 'Women Protection Cell', category: 'Administrative' },
  'WOMEN PROTECTION CELL': { code: 'WPC', name: 'Women Protection Cell', category: 'Administrative' },
  'ATT': { code: 'ATT', name: 'I/c Attendance', category: 'Administrative' },
  'I/C ATTENDANCE': { code: 'ATT', name: 'I/c Attendance', category: 'Administrative' },
  'MC': { code: 'MC', name: 'Media Cell', category: 'Administrative' },
  'MEDIA CELL': { code: 'MC', name: 'Media Cell', category: 'Administrative' },
  'FINANCE': { code: 'FINANCE', name: 'Finance Office', category: 'Administrative' }
};

function normalizeDeptCode(raw: any, remarksHint?: string): string {
  if (!raw || raw === 'N/A' || raw === 'undefined') {
    if (remarksHint) {
      const upper = remarksHint.toUpperCase();
      if (upper.includes('AIDS') || upper.includes('AI TOOLS')) return 'AIDS';
      if (upper.includes('ELECTRICAL') || upper.includes('STEVE JOBS LAB')) return 'ELC';
      if (upper.includes('ADMIN BUILDING') || upper.includes('ADMIN BLOCK') || upper.includes('WASHROOM')) return 'DOA';
      if (upper.includes('FLEXI') || upper.includes('VIZIANAGARAM')) return 'MC';
      if (upper.includes('YOGA DAY')) return 'DSA';
      if (upper.includes('GIFTS FOR HRS') || upper.includes('VISITING COMPANIES')) return 'DTP';
      if (upper.includes('ANRF') || upper.includes('GRANT RECEIVED')) return 'DRD';
      if (upper.includes('CIVIL')) return 'CE';
      if (upper.includes('MECHANICAL')) return 'ME';
      if (upper.includes('CSE')) return 'CSE';
      if (upper.includes('ECE')) return 'ECE';
    }
    return 'DOA';
  }
  const cleaned = String(raw).trim().toUpperCase();
  if (DEPT_NAME_MAP[cleaned]) return DEPT_NAME_MAP[cleaned].code;
  for (const key of Object.keys(DEPT_NAME_MAP)) {
    if (cleaned === key || cleaned.includes(key)) return DEPT_NAME_MAP[key].code;
  }
  return 'DOA';
}

function parseExcelDate(val: any, defaultDate: string = '2026-04-01'): string {
  if (!val) return defaultDate;
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d && d.y) {
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
  }
  const str = String(val).trim();
  if (str.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const parts = str.split(/[-/]/);
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
  }
  return defaultDate;
}

export function loadSeedData(forceReload: boolean = false) {
  if (isInitialized && !forceReload) return;

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

    departments = [];
    budgetHeads = [];
    budgetAllocations = [];
    prRecords = [];
    prItemsMap = new Map();

    // 1. Initialize Users
    initDefaultUsers();

    // 2. Parse Master Budget Sheet
    const masterSheet = workbook.Sheets['Master Budget'];
    const mb26Sheet = workbook.Sheets['Master Budget 2026-27'];

    const headMetaMap = new Map<number, { costElement: string; type: string; respPerson: string }>();
    if (mb26Sheet) {
      const mb26Rows: any[][] = XLSX.utils.sheet_to_json(mb26Sheet, { header: 1 });
      for (let r = 3; r < mb26Rows.length; r++) {
        const row = mb26Rows[r];
        if (!row || row.length < 2) continue;
        const code = parseInt(String(row[0]), 10);
        if (!isNaN(code)) {
          headMetaMap.set(code, {
            costElement: String(row[1] || '').trim(),
            type: String(row[2] || 'Recurring').trim(),
            respPerson: String(row[3] || '').trim()
          });
        }
      }
    }

    const deptCodeToIdMap = new Map<string, number>();
    const deptColumns: { colIndex: number; code: string; label: string }[] = [];

    if (masterSheet) {
      const rows: any[][] = XLSX.utils.sheet_to_json(masterSheet, { header: 1 });
      if (rows.length > 2) {
        const headerCodeRow = rows[0];
        const headerNameRow = rows[1];

        let deptId = 1;
        for (let c = 3; c < headerCodeRow.length; c++) {
          const rawCode = String(headerCodeRow[c] || '').trim();
          if (rawCode && rawCode !== 'NaN') {
            const normCode = normalizeDeptCode(rawCode);
            const meta = DEPT_NAME_MAP[normCode.toUpperCase()] || { code: normCode, name: normCode, category: 'Academic' };

            if (!deptCodeToIdMap.has(normCode.toUpperCase())) {
              const deptObj: Department = {
                id: deptId++,
                code: normCode,
                name: meta.name,
                category: meta.category as any
              };
              departments.push(deptObj);
              deptCodeToIdMap.set(normCode.toUpperCase(), deptObj.id);
            }

            deptColumns.push({
              colIndex: c,
              code: normCode,
              label: String(headerNameRow[c] || rawCode).trim()
            });
          }
        }

        // Add FINANCE department if missing
        if (!deptCodeToIdMap.has('FINANCE')) {
          const finDept: Department = {
            id: deptId++,
            code: 'FINANCE',
            name: 'Finance Office',
            category: 'Administrative'
          };
          departments.push(finDept);
          deptCodeToIdMap.set('FINANCE', finDept.id);
        }

        // Parse Budget Heads & Allocations
        let headId = 1;
        let allocId = 1;
        const headCodeToIdMap = new Map<number, number>();

        for (let r = 2; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length < 2) continue;

          const rawCode = row[0];
          const rawName = row[1];
          const rawType = row[2];

          const codeNum = parseInt(String(rawCode), 10);
          if (isNaN(codeNum)) continue;

          let bHead = budgetHeads.find(bh => bh.code === codeNum);
          if (!bHead) {
            const meta = headMetaMap.get(codeNum);
            bHead = {
              id: headId++,
              code: codeNum,
              name: String(rawName || meta?.costElement || `Budget Head ${codeNum}`).trim(),
              category: String(rawType || meta?.type || 'Recurring').trim(),
              description: meta?.respPerson ? `Responsible Person: ${meta.respPerson}` : undefined
            };
            budgetHeads.push(bHead);
            headCodeToIdMap.set(codeNum, bHead.id);
          }

          // Department Allocations
          for (const col of deptColumns) {
            const deptObjId = deptCodeToIdMap.get(col.code.toUpperCase());
            const deptObj = departments.find(d => d.id === deptObjId);
            if (!deptObj) continue;

            const allocVal = parseFloat(String(row[col.colIndex] || 0));
            const allocatedAmt = isNaN(allocVal) ? 0 : allocVal;

            budgetAllocations.push({
              id: allocId++,
              departmentId: deptObj.id,
              departmentCode: deptObj.code,
              departmentName: deptObj.name,
              budgetHeadId: bHead.id,
              budgetHeadCode: bHead.code,
              budgetHeadName: bHead.name,
              sourceBudgetCode: `${codeNum}${deptObj.code}`,
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

    // 3. Parse PR Data Source & Details
    const prReportSheet = workbook.Sheets['PR Report On - Sat Jan 03 2026'];
    const prSourceSheet = workbook.Sheets['PR data - source file'];
    const sheet3 = workbook.Sheets['Sheet3'];

    const prLookupMap = new Map<string, { rawDept: any; rawCode: any; rawSourceCode: any; totalValue: number; remarks: string; requestedDate: string }>();
    const allSourceRows: any[] = [
      ...(prSourceSheet ? XLSX.utils.sheet_to_json(prSourceSheet) : []),
      ...(sheet3 ? XLSX.utils.sheet_to_json(sheet3) : [])
    ];

    for (const row of allSourceRows) {
      const prNo = String(row['Pr No'] || '').trim();
      if (!prNo || prNo === 'undefined' || prNo === 'NaN') continue;
      const key = prNo.toUpperCase();
      if (!prLookupMap.has(key)) {
        prLookupMap.set(key, {
          rawDept: row['Dept'] || row['Department'],
          rawCode: row['Code'] || row['Budget code'],
          rawSourceCode: row['Budget code'] || row['Unnamed: 14'] || '',
          totalValue: parseFloat(String(row['Sum of Total Value'] || row['Total Value'] || 0)) || 0,
          remarks: String(row['Pr Remarks'] || row['Remarks'] || '').trim(),
          requestedDate: parseExcelDate(row['PR Requested Date'] || row['PR Date'])
        });
      }
    }

    const prMap = new Map<string, PRRecord>();
    let prIdCounter = 1;
    let itemIdCounter = 1;

    if (prReportSheet) {
      const prReportRows: any[] = XLSX.utils.sheet_to_json(prReportSheet);

      for (const row of prReportRows) {
        const prNumber = String(row['Pr No'] || '').trim();
        if (!prNumber || prNumber === 'undefined' || prNumber === 'NaN') continue;

        const key = prNumber.toUpperCase();
        const meta = prLookupMap.get(key);

        const prRemarks = String(row['Pr Remarks'] || meta?.remarks || 'Purchase Requisition').trim();
        const rawDept = meta?.rawDept || row['Dept'] || row['Department'] || row['Cost Center'];
        const deptCodeNorm = normalizeDeptCode(rawDept, prRemarks);

        let deptId = deptCodeToIdMap.get(deptCodeNorm.toUpperCase()) || 1;
        let deptObj = departments.find(d => d.id === deptId) || departments[0];

        let budgetCodeNum = 101;
        if (meta?.rawCode) {
          const parsed = parseInt(String(meta.rawCode), 10);
          if (!isNaN(parsed) && budgetHeads.some(bh => bh.code === parsed)) {
            budgetCodeNum = parsed;
          }
        }
        if (budgetCodeNum === 101 && meta?.rawSourceCode) {
          const match = String(meta.rawSourceCode).match(/^([0-9]+)/);
          if (match) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && budgetHeads.some(bh => bh.code === parsed)) {
              budgetCodeNum = parsed;
            }
          }
        }

        let headObj = budgetHeads.find(bh => bh.code === budgetCodeNum) || budgetHeads[0];

        const prDate = parseExcelDate(row['PR Requested Date'] || meta?.requestedDate, '2026-07-01');
        const requestedBy = String(row['Requested By'] || 'Department Staff').trim();
        const prStatusRaw = String(row['PR Status'] || 'Open').trim();
        const appStatusRaw = String(row['Pr Approval Status'] || 'Approved').trim();
        const poStatusRaw = String(row['PR-PO Status'] || 'Open').trim();
        const app1 = String(row['Approval 1'] || 'Approved').trim();
        const app2 = String(row['Approval 2'] || 'Approved').trim();
        const app3 = String(row['Approval 3'] || 'Approved').trim();

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

        let prRecord = prMap.get(key);
        if (!prRecord) {
          prRecord = {
            id: prIdCounter++,
            prNumber,
            prDate,
            departmentId: deptObj.id,
            departmentCode: deptObj.code,
            departmentName: deptObj.name,
            budgetHeadId: headObj.id,
            budgetHeadCode: headObj.code,
            budgetHeadName: headObj.name,
            requestedBy: requestedBy !== '-NA-' ? requestedBy : 'Faculty Member',
            purpose: prRemarks,
            totalAmount: 0,
            status,
            approvalStatus,
            prPoStatus,
            approval1: app1 !== '-NA-' ? app1 : 'Approved',
            approval2: app2 !== '-NA-' ? app2 : 'Approved',
            approval3: app3 !== '-NA-' ? app3 : 'Approved',
            sourceBudgetCode: `${headObj.code}${deptObj.code}`,
            items: []
          };
          prMap.set(key, prRecord);
        }

        const itemQty = parseFloat(String(row['Product Qty'] || 1)) || 1;
        const totalVal = parseFloat(String(row['Total Value'] || 0)) || 0;
        const unitPrice = itemQty > 0 ? totalVal / itemQty : totalVal;

        const item: PRItem = {
          id: itemIdCounter++,
          prId: prRecord.id,
          productName: String(row['Product Name'] || 'Equipment / Material').trim(),
          productCode: String(row['Product Code'] || '').trim(),
          productType: String(row['Product Type'] || 'goods').trim(),
          productDescription: String(row['Product Description'] || '-NA-').trim(),
          unitTypeName: String(row['Unit Type Name'] || 'Numbers').trim(),
          quantity: itemQty,
          unitPrice,
          totalValue: totalVal,
          currentStock: parseFloat(String(row['Current Stock'] || 0)) || 0,
          preferredVendor: String(row['Preferred Vendor'] || '-NA-').trim(),
          productRequiredBy: parseExcelDate(row['Product Required By'], prDate),
          itemRemarks: String(row['Product Remarks'] || '-NA-').trim()
        };

        if (!prItemsMap.has(prRecord.id)) {
          prItemsMap.set(prRecord.id, []);
        }
        prItemsMap.get(prRecord.id)!.push(item);
        prRecord.totalAmount += totalVal;
      }
    }

    // Add remaining PRs from sources
    for (const [key, meta] of prLookupMap.entries()) {
      if (!prMap.has(key)) {
        const deptCodeNorm = normalizeDeptCode(meta.rawDept, meta.remarks);
        let deptId = deptCodeToIdMap.get(deptCodeNorm.toUpperCase()) || 1;
        let deptObj = departments.find(d => d.id === deptId) || departments[0];

        let budgetCodeNum = 101;
        if (meta.rawCode) {
          const parsed = parseInt(String(meta.rawCode), 10);
          if (!isNaN(parsed) && budgetHeads.some(bh => bh.code === parsed)) {
            budgetCodeNum = parsed;
          }
        }
        let headObj = budgetHeads.find(bh => bh.code === budgetCodeNum) || budgetHeads[0];

        const prRecord: PRRecord = {
          id: prIdCounter++,
          prNumber: key,
          prDate: meta.requestedDate || '2026-04-01',
          departmentId: deptObj.id,
          departmentCode: deptObj.code,
          departmentName: deptObj.name,
          budgetHeadId: headObj.id,
          budgetHeadCode: headObj.code,
          budgetHeadName: headObj.name,
          requestedBy: 'Department Staff',
          purpose: meta.remarks || 'Purchase Requisition',
          totalAmount: meta.totalValue || 0,
          status: 'Open',
          approvalStatus: 'Approved',
          prPoStatus: 'Open',
          approval1: 'HOD Approved',
          approval2: 'Finance Approved',
          approval3: 'Principal Approved',
          sourceBudgetCode: `${headObj.code}${deptObj.code}`,
          items: []
        };

        const item: PRItem = {
          id: itemIdCounter++,
          prId: prRecord.id,
          productName: meta.remarks || 'Purchase Item',
          productCode: '',
          productType: 'goods',
          productDescription: meta.remarks,
          unitTypeName: 'Numbers',
          quantity: 1,
          unitPrice: meta.totalValue,
          totalValue: meta.totalValue,
          currentStock: 0,
          preferredVendor: '-NA-',
          productRequiredBy: meta.requestedDate,
          itemRemarks: meta.remarks
        };

        prItemsMap.set(prRecord.id, [item]);
        prMap.set(key, prRecord);
      }
    }

    prRecords = Array.from(prMap.values());
    prRecords.forEach(pr => {
      pr.items = prItemsMap.get(pr.id) || [];
    });

    // 4. Update Committed Amounts & Utilization in Allocations
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
  budgetAllocations.forEach(alloc => {
    alloc.committedAmount = 0;
    alloc.actualUtilizedAmount = 0;
  });

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

  budgetAllocations.forEach(alloc => {
    alloc.remainingAmount = alloc.allocatedAmount - alloc.committedAmount;
    if (alloc.allocatedAmount > 0) {
      alloc.utilizationPercentage = parseFloat(((alloc.committedAmount / alloc.allocatedAmount) * 100).toFixed(2));
    } else {
      alloc.utilizationPercentage = alloc.committedAmount > 0 ? 100 : 0;
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
    syncAllocationToFirestore(alloc.departmentId, alloc.budgetHeadId);
    return alloc;
  }
  return null;
}

export function updateBudgetHeadAllocation(departmentId: number, budgetHeadId: number, newAllocatedAmount: number): BudgetAllocation | null {
  let alloc = budgetAllocations.find(a => a.departmentId === departmentId && a.budgetHeadId === budgetHeadId);
  if (alloc) {
    alloc.allocatedAmount = newAllocatedAmount;
    recalculateCommittedAmounts();
    syncAllocationToFirestore(departmentId, budgetHeadId);
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
  syncPRToFirestore(pr);
  syncAllocationToFirestore(pr.departmentId, pr.budgetHeadId);
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

  const nextId = getPgStatus() ? crypto.randomUUID() : (prRecords.length > 0 ? Math.max(...prRecords.map(p => Number(p.id) || 0)) + 1 : 1);
  const prNumber = `PR-2026-${String(prRecords.length + 1).padStart(4, '0')}`;
  const prDate = prInput.prDate || new Date().toISOString().substring(0, 10);
 
  const approvalStatus = prInput.approvalStatus || 'Approved';
  const status = prInput.status || (approvalStatus === 'Approved' ? 'Approved' : 'Pending');
 
  let totalAmount = 0;
  let itemIdCounter = typeof nextId === 'number' ? (1000 + nextId * 10) : 0;
  const createdItems: PRItem[] = (prInput.items || []).map(item => {
    const qty = Math.max(1, item.quantity || 1);
    const price = Math.max(0, item.unitPrice || 0);
    const itemTotal = qty * price;
    totalAmount += itemTotal;
 
    return {
      id: typeof nextId === 'number' ? itemIdCounter++ : crypto.randomUUID(),
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
  syncPRToFirestore(newPR);
  syncAllocationToFirestore(newPR.departmentId, newPR.budgetHeadId);
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
    const nextId = getPgStatus() ? crypto.randomUUID() : (budgetAllocations.length > 0 ? Math.max(...budgetAllocations.map(a => Number(a.id) || 0)) + 1 : 1);
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
  syncAllocationToFirestore(alloc.departmentId, alloc.budgetHeadId);
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

// ============================================================================
// Firebase Firestore Sync Helpers
// ============================================================================

export async function syncAllocationToFirestore(departmentId: number, budgetHeadId: number) {
  // Sync to Postgres in background
  await syncAllocationToPostgres(departmentId, budgetHeadId);

  if (!isFirebaseEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  const alloc = budgetAllocations.find(a => a.departmentId === departmentId && a.budgetHeadId === budgetHeadId);
  if (alloc) {
    try {
      const cleaned = JSON.parse(JSON.stringify(alloc));
      await db.collection('budgetAllocations').doc(alloc.sourceBudgetCode).set(cleaned);
      console.log(`[Firebase] Synced budget allocation ${alloc.sourceBudgetCode} to Firestore.`);
    } catch (err: any) {
      console.error(`[Firebase Error] Failed to sync allocation: ${err.message}`);
    }
  }
}

export async function syncPRToFirestore(pr: PRRecord) {
  // Sync to Postgres in background
  await syncPRToPostgres(pr);

  if (!isFirebaseEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  try {
    const cleaned = JSON.parse(JSON.stringify(pr));
    await db.collection('prs').doc(pr.prNumber).set(cleaned);
    console.log(`[Firebase] Synced PR ${pr.prNumber} to Firestore.`);
  } catch (err: any) {
    console.error(`[Firebase Error] Failed to sync PR: ${err.message}`);
  }
}

export async function syncDataFromFirebase(): Promise<boolean> {
  if (!isFirebaseEnabled()) {
    console.log('[Firebase] Not enabled. Skipping Firestore synchronization.');
    return false;
  }

  const db = getFirestoreDb();
  if (!db) {
    console.log('[Firebase] Firestore DB not initialized. Skipping Firestore synchronization.');
    return false;
  }

  try {
    console.log('[Firebase] Syncing data from Firestore to memory...');
    
    // Fetch departments
    const deptSnap = await db.collection('departments').get();
    if (deptSnap.empty) {
      console.log('[Firebase] Firestore is empty. Initializing with local Excel data...');
      loadSeedData(true);
      await seedFirebaseFromLocalData();
      return true;
    }

    const fetchedDepts: Department[] = [];
    deptSnap.forEach((doc: any) => fetchedDepts.push(doc.data() as Department));
    departments = fetchedDepts.sort((a, b) => a.id - b.id);

    // Fetch users
    const userSnap = await db.collection('users').get();
    const fetchedUsers: User[] = [];
    userSnap.forEach((doc: any) => fetchedUsers.push(doc.data() as User));
    users = fetchedUsers.sort((a, b) => a.id - b.id);

    // Fetch budgetHeads
    const bhSnap = await db.collection('budgetHeads').get();
    const fetchedHeads: BudgetHead[] = [];
    bhSnap.forEach((doc: any) => fetchedHeads.push(doc.data() as BudgetHead));
    budgetHeads = fetchedHeads.sort((a, b) => a.id - b.id);

    // Fetch budgetAllocations
    const allocSnap = await db.collection('budgetAllocations').get();
    const fetchedAllocs: BudgetAllocation[] = [];
    allocSnap.forEach((doc: any) => fetchedAllocs.push(doc.data() as BudgetAllocation));
    budgetAllocations = fetchedAllocs.sort((a, b) => a.id - b.id);

    // Fetch prs
    const prSnap = await db.collection('prs').get();
    const fetchedPRs: PRRecord[] = [];
    prSnap.forEach((doc: any) => {
      const pr = doc.data() as PRRecord;
      fetchedPRs.push(pr);
      if (pr.items) {
        prItemsMap.set(pr.id, pr.items);
      }
    });
    prRecords = fetchedPRs.sort((a, b) => b.id - a.id);

    isInitialized = true;
    console.log(`[Firebase] Successfully synced from Firestore: ${departments.length} departments, ${users.length} users, ${budgetHeads.length} budget heads, ${budgetAllocations.length} allocations, ${prRecords.length} PRs.`);
    return true;
  } catch (error: any) {
    console.error(`[Firebase Sync Error] Failed to sync from Firestore: ${error.message}`);
    console.log('[Firebase] Falling back to local data modes.');
    return false;
  }
}

async function seedFirebaseFromLocalData() {
  if (!isFirebaseEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  try {
    console.log('[Firebase] Seeding Firestore with local Excel data...');
    const writeInBatches = async (collectionName: string, items: any[], getId: (item: any) => string) => {
      let batch = db.batch();
      let count = 0;
      for (const item of items) {
        const cleaned = JSON.parse(JSON.stringify(item));
        const docRef = db.collection(collectionName).doc(getId(cleaned));
        batch.set(docRef, cleaned);
        count++;
        if (count === 500) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    };

    await writeInBatches('departments', departments, (item) => item.code);
    await writeInBatches('users', users, (item) => item.email);
    await writeInBatches('budgetHeads', budgetHeads, (item) => String(item.code));
    await writeInBatches('budgetAllocations', budgetAllocations, (item) => item.sourceBudgetCode);
    await writeInBatches('prs', prRecords, (item) => item.prNumber);
    console.log('[Firebase] Firestore seeding complete.');
  } catch (err: any) {
    console.error(`[Firebase Error] Failed to seed Firestore: ${err.message}`);
  }
}

// ============================================================================
// PostgreSQL Sync Helpers
// ============================================================================

export async function syncAllocationToPostgres(departmentId: number | string, budgetHeadId: number | string) {
  if (!getPgStatus()) return;

  const alloc = budgetAllocations.find(a => a.departmentId === departmentId && a.budgetHeadId === budgetHeadId);
  if (alloc) {
    try {
      await executePgQuery(
        `INSERT INTO budget_allocation 
          (id, department_id, budget_head_id, source_budget_code, financial_year, 
           allocated_amount, committed_amount, actual_utilized_amount, remaining_amount, 
           utilization_percentage, alert_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (source_budget_code) DO UPDATE SET
           allocated_amount = EXCLUDED.allocated_amount,
           committed_amount = EXCLUDED.committed_amount,
           actual_utilized_amount = EXCLUDED.actual_utilized_amount,
           remaining_amount = EXCLUDED.remaining_amount,
           utilization_percentage = EXCLUDED.utilization_percentage,
           alert_status = EXCLUDED.alert_status`,
        [
          alloc.id, alloc.departmentId, alloc.budgetHeadId, alloc.sourceBudgetCode, alloc.financialYear,
          alloc.allocatedAmount, alloc.committedAmount, alloc.actualUtilizedAmount,
          alloc.remainingAmount, alloc.utilizationPercentage, alloc.alertStatus
        ]
      );
      console.log(`[PostgreSQL] Synced budget allocation ${alloc.sourceBudgetCode} to Cloud SQL.`);
    } catch (err: any) {
      console.error(`[PostgreSQL Error] Failed to sync allocation: ${err.message}`);
    }
  }
}

export async function syncPRToPostgres(pr: PRRecord) {
  if (!getPgStatus()) return;

  try {
    // 1. Upsert PR Record
    await executePgQuery(
      `INSERT INTO purchase_request 
        (id, pr_number, pr_date, department_id, budget_head_id, requested_by, 
         purpose, total_amount, status, approval_status, pr_po_status, 
         approval1, approval2, approval3, source_budget_code) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (pr_number) DO UPDATE SET
         pr_date = EXCLUDED.pr_date,
         purpose = EXCLUDED.purpose,
         total_amount = EXCLUDED.total_amount,
         status = EXCLUDED.status,
         approval_status = EXCLUDED.approval_status,
         pr_po_status = EXCLUDED.pr_po_status,
         approval1 = EXCLUDED.approval1,
         approval2 = EXCLUDED.approval2,
         approval3 = EXCLUDED.approval3`,
      [
        pr.id, pr.prNumber, pr.prDate, pr.departmentId, pr.budgetHeadId, pr.requestedBy,
        pr.purpose || '', pr.totalAmount, pr.status, pr.approvalStatus, pr.prPoStatus,
        pr.approval1 || '', pr.approval2 || '', pr.approval3 || '', pr.sourceBudgetCode
      ]
    );

    // 2. Clear old PR Items
    await executePgQuery('DELETE FROM purchase_request_item WHERE purchase_request_id = $1', [pr.id]);

    // 3. Re-insert items
    const items = prItemsMap.get(pr.id) || [];
    for (const item of items) {
      const itemUuid = crypto.randomUUID();
      await executePgQuery(
        `INSERT INTO purchase_request_item 
          (id, purchase_request_id, product_name, product_code, product_type, product_description, 
           unit_type_name, quantity, unit_price, total_value, current_stock, 
           preferred_vendor, product_required_by, item_remarks) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          itemUuid, pr.id, item.productName, item.productCode || '', item.productType || 'goods',
          item.productDescription || '', item.unitTypeName || 'Numbers', item.quantity,
          item.unitPrice, item.totalValue, item.currentStock || 0, item.preferredVendor || '',
          item.productRequiredBy || '', item.itemRemarks || ''
        ]
      );
    }

    console.log(`[PostgreSQL] Synced PR ${pr.prNumber} and ${items.length} items to Cloud SQL.`);
  } catch (err: any) {
    console.error(`[PostgreSQL Error] Failed to sync PR: ${err.message}`);
  }
}

export async function syncDataFromPostgres(): Promise<boolean> {
  if (!getPgStatus()) {
    console.log('[PostgreSQL] Not enabled. Skipping PostgreSQL synchronization.');
    return false;
  }

  try {
    console.log('[PostgreSQL] Syncing data from Cloud SQL to memory...');
    
    // Fetch departments
    const dbDepts = await queryPgAsync<any>('SELECT id, dept_code as code, dept_name as name, category FROM department');
    if (dbDepts.length === 0) {
      console.log('[PostgreSQL] Database is empty. Seeding with local Excel data...');
      loadSeedData(true);
      return true;
    }
    departments = dbDepts.map((d: any) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      category: d.category
    })).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    // Fetch users
    const dbUsers = await queryPgAsync<any>('SELECT id, name, email, role, department_id as "departmentId" FROM "user"');
    users = dbUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId
    })).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    // Fetch budget heads
    const dbHeads = await queryPgAsync<any>('SELECT id, budget_head_code as code, name, category, description FROM budget_head');
    budgetHeads = dbHeads.map((h: any) => ({
      id: h.id,
      code: Number(h.code),
      name: h.name,
      category: h.category,
      description: h.description
    })).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    // Fetch allocations
    const dbAllocations = await queryPgAsync<any>(`
      SELECT id, department_id as "departmentId", budget_head_id as "budgetHeadId", source_budget_code as "sourceBudgetCode", financial_year as "financialYear",
             allocated_amount as "allocatedAmount", committed_amount as "committedAmount", actual_utilized_amount as "actualUtilizedAmount", remaining_amount as "remainingAmount",
             utilization_percentage as "utilizationPercentage", alert_status as "alertStatus"
      FROM budget_allocation
    `);
    
    const deptMap = new Map(departments.map(d => [d.id, d]));
    const headMap = new Map(budgetHeads.map(h => [h.id, h]));

    budgetAllocations = dbAllocations.map((a: any) => {
      const dept = deptMap.get(a.departmentId);
      const head = headMap.get(a.budgetHeadId);
      return {
        id: a.id,
        departmentId: a.departmentId,
        departmentCode: dept ? dept.code : '',
        departmentName: dept ? dept.name : '',
        budgetHeadId: a.budgetHeadId,
        budgetHeadCode: head ? head.code : 0,
        budgetHeadName: head ? head.name : '',
        sourceBudgetCode: a.sourceBudgetCode,
        financialYear: a.financialYear,
        allocatedAmount: Number(a.allocatedAmount),
        committedAmount: Number(a.committedAmount),
        actualUtilizedAmount: Number(a.actualUtilizedAmount),
        remainingAmount: Number(a.remainingAmount),
        utilizationPercentage: Number(a.utilizationPercentage),
        alertStatus: a.alertStatus as any
      };
    }).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    // Fetch PRs
    const dbPRs = await queryPgAsync<any>(`
      SELECT id, pr_number as "prNumber", to_char(pr_date, 'YYYY-MM-DD') as "prDate", department_id as "departmentId", budget_head_id as "budgetHeadId", requested_by as "requestedBy",
             purpose, total_amount as "totalAmount", status, approval_status as "approvalStatus", pr_po_status as "prPoStatus",
             approval1, approval2, approval3, source_budget_code as "sourceBudgetCode"
      FROM purchase_request
    `);

    // Fetch PR Items
    const dbPRItems = await queryPgAsync<any>(`
      SELECT id, purchase_request_id as "prId", product_name as "productName", product_code as "productCode", product_type as "productType", product_description as "productDescription",
             unit_type_name as "unitTypeName", quantity, unit_price as "unitPrice", total_value as "totalValue", current_stock as "currentStock",
             preferred_vendor as "preferredVendor", product_required_by as "productRequiredBy", item_remarks as "itemRemarks"
      FROM purchase_request_item
    `);

    // Group items by prId
    const itemsByPrId = new Map<string, PRItem[]>();
    dbPRItems.forEach((item: any) => {
      const mappedItem: PRItem = {
        id: item.id,
        prId: item.prId,
        productName: item.productName,
        productCode: item.productCode,
        productType: item.productType,
        productDescription: item.productDescription,
        unitTypeName: item.unitTypeName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalValue: Number(item.totalValue),
        currentStock: Number(item.currentStock),
        preferredVendor: item.preferredVendor,
        productRequiredBy: item.productRequiredBy,
        itemRemarks: item.itemRemarks
      };
      if (!itemsByPrId.has(item.prId)) {
        itemsByPrId.set(item.prId, []);
      }
      itemsByPrId.get(item.prId)!.push(mappedItem);
    });

    prRecords = dbPRs.map((p: any) => {
      const dept = deptMap.get(p.departmentId);
      const head = headMap.get(p.budgetHeadId);
      const items = itemsByPrId.get(p.id) || [];
      prItemsMap.set(p.id, items);
      
      return {
        id: p.id,
        prNumber: p.prNumber,
        prDate: p.prDate,
        departmentId: p.departmentId,
        departmentCode: dept ? dept.code : '',
        departmentName: dept ? dept.name : '',
        budgetHeadId: p.budgetHeadId,
        budgetHeadCode: head ? head.code : 0,
        budgetHeadName: head ? head.name : '',
        requestedBy: p.requestedBy,
        purpose: p.purpose,
        totalAmount: Number(p.totalAmount),
        status: p.status as any,
        approvalStatus: p.approvalStatus as any,
        prPoStatus: p.prPoStatus as any,
        approval1: p.approval1,
        approval2: p.approval2,
        approval3: p.approval3,
        sourceBudgetCode: p.sourceBudgetCode,
        items
      };
    }).sort((a: any, b: any) => String(b.id).localeCompare(String(a.id)));

    isInitialized = true;
    console.log(`[PostgreSQL] Successfully synced from Cloud SQL: ${departments.length} departments, ${users.length} users, ${budgetHeads.length} budget heads, ${budgetAllocations.length} allocations, ${prRecords.length} PRs.`);
    return true;
  } catch (error: any) {
    console.error(`[PostgreSQL Sync Error] Failed to sync from Cloud SQL: ${error.message}`);
    return false;
  }
}

async function seedPostgresFromLocalData() {
  console.log('[PostgreSQL] Database seeding is handled by seedPostgres script.');
}

