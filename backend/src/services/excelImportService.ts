import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { PRRecord, ImportBatch, ImportErrorRecord, PRItem } from '../types';
import { getSeedPRRecords, getSeedBudgetAllocations, recalculateCommittedAmounts, getSeedDepartments, getSeedBudgetHeads, loadSeedData } from '../utils/seedData';
import { sqliteDb, runSqlAsync } from '../config/sqlDatabase';

export interface ImportResult {
  batch: ImportBatch;
  errors: ImportErrorRecord[];
}

let batchIdCounter = 2; // 1 is reserved for initial command-line seed import
let errorIdCounter = 1;
const importBatchesHistory: ImportBatch[] = [];
const importErrorsMap: Map<number, ImportErrorRecord[]> = new Map();

// Helper to normalize department codes
function normalizeDeptCode(raw: any, remarksHint?: string): string {
  const DEPT_MAP: Record<string, string> = {
    'CE': 'CE', 'CIVIL': 'CE', 'EEE': 'EEE', 'ME': 'ME', 'MECH': 'ME', 'ECE': 'ECE', 'ECM': 'ECM',
    'CSE': 'CSE', 'AI': 'AI', 'CS': 'CS', 'DS': 'DS', 'AIDS': 'AIDS', 'IT': 'IT', 'BS&H': 'BS&H',
    'MCA': 'MCA', 'MBA': 'MBA', 'DOA': 'DOA', 'ADMIN': 'DOA', 'ADMIN OFFICE': 'DOA', 'DAC': 'DAC',
    'ACADEMICS': 'DAC', 'EC': 'EC', 'EXAM CELL': 'EC', 'DRD': 'DRD', 'R&D': 'DRD', 'DTP': 'DTP',
    'T&P': 'DTP', 'T_P': 'DTP', 'PD': 'DTP', 'DSA': 'DSA', 'DEAN SA': 'DSA', 'STUDENT AFFAIRS': 'DSA',
    'DAD': 'DAD', 'ADMISSION': 'DAD', 'DIQ': 'DIQ', 'IQAC': 'DIQ', 'DFA': 'DFA', 'DEAN FA': 'DFA',
    'FACULTY AFFAIRS': 'DFA', 'FACULTY AFFIARS': 'DFA', 'DINF': 'Dinf', 'INFRA': 'Dinf',
    'NEW BUIDLING': 'Dinf', 'NEW SCHOOL BUIDLING': 'Dinf', 'DISA': 'Disa', 'VCIS': 'VCIS',
    'SC': 'SC', 'SYSTEM CELL': 'SC', 'I/C SYSTEM CELL': 'SC', 'ELC': 'ELC', 'I/C ELECTRICAL': 'ELC',
    'LIB': 'Lib', 'LIBRARY': 'Lib', 'I/C LIBRARY': 'Lib', 'WPC': 'WPC', 'WOMEN PROTECTION CELL': 'WPC',
    'ATT': 'ATT', 'I/C ATTENDANCE': 'ATT', 'MC': 'MC', 'MEDIA CELL': 'MC', 'FINANCE': 'FINANCE'
  };

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
  if (DEPT_MAP[cleaned]) return DEPT_MAP[cleaned];
  for (const key of Object.keys(DEPT_MAP)) {
    if (cleaned === key || cleaned.includes(key)) return DEPT_MAP[key];
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

export async function processPRExcelImport(filePath: string, filename: string, userId?: number): Promise<ImportResult> {
  const workbook = XLSX.readFile(filePath);

  // We check if it is a Master Budget file or a PR file.
  // If it's a Budget Proposal / contains 'budget' sheet, parse allocations.
  const isBudget = workbook.SheetNames.some(s => s.toLowerCase().includes('budget'));

  const departments = getSeedDepartments();
  const budgetHeads = getSeedBudgetHeads();
  const existingPRs = getSeedPRRecords();
  const allocations = getSeedBudgetAllocations();

  const batchId = batchIdCounter++;
  const errors: ImportErrorRecord[] = [];

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  if (isBudget) {
    // Parse Budget proposals
    const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('budget')) || workbook.SheetNames[0];
    const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    
    if (rows.length > 2) {
      const headerCodeRow = rows[0];
      const deptCols: { colIdx: number; code: string }[] = [];
      
      for (let c = 3; c < headerCodeRow.length; c++) {
        const rawCode = String(headerCodeRow[c] || '').trim();
        if (rawCode && rawCode !== 'NaN') {
          const norm = normalizeDeptCode(rawCode);
          deptCols.push({ colIdx: c, code: norm });
        }
      }

      for (let r = 2; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;
        const codeNum = parseInt(String(row[0]), 10);
        if (isNaN(codeNum)) continue;

        let bHead = budgetHeads.find(bh => bh.code === codeNum);
        if (!bHead) {
          bHead = {
            id: budgetHeads.length + 1,
            code: codeNum,
            name: String(row[1] || `Budget Head ${codeNum}`).trim(),
            category: String(row[2] || 'Recurring').trim()
          };
          budgetHeads.push(bHead);
        }

        for (const col of deptCols) {
          const deptObj = departments.find(d => d.code.toUpperCase() === col.code.toUpperCase());
          if (!deptObj) continue;

          const rawVal = parseFloat(String(row[col.colIdx] || 0));
          const allocatedAmount = isNaN(rawVal) ? 0 : rawVal;

          let alloc = allocations.find(a => a.departmentId === deptObj.id && a.budgetHeadId === bHead!.id);
          if (alloc) {
            alloc.allocatedAmount = allocatedAmount;
            updatedCount++;
            // Update SQLite
            await runSqlAsync(
              `UPDATE BUDGET_ALLOCATIONS SET allocated_amount = ? WHERE id = ?`,
              [allocatedAmount, alloc.id]
            );
          } else {
            const nextAllocId = allocations.length + 1;
            alloc = {
              id: nextAllocId,
              departmentId: deptObj.id,
              departmentCode: deptObj.code,
              departmentName: deptObj.name,
              budgetHeadId: bHead!.id,
              budgetHeadCode: bHead!.code,
              budgetHeadName: bHead!.name,
              sourceBudgetCode: `${codeNum}${deptObj.code}`,
              financialYear: '2026-27',
              allocatedAmount,
              committedAmount: 0,
              actualUtilizedAmount: 0,
              remainingAmount: allocatedAmount,
              utilizationPercentage: 0,
              alertStatus: 'Normal'
            };
            allocations.push(alloc);
            importedCount++;
            // Insert SQLite
            await runSqlAsync(
              `INSERT INTO BUDGET_ALLOCATIONS (id, department_id, budget_head_id, source_budget_code, financial_year, allocated_amount, committed_amount, actual_utilized_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [alloc.id, alloc.departmentId, alloc.budgetHeadId, alloc.sourceBudgetCode, alloc.financialYear, alloc.allocatedAmount, alloc.committedAmount, alloc.actualUtilizedAmount]
            );
          }
        }
      }
    }
  } else {
    // Parse PR files (supporting parent PR + line items format)
    const sheetName = workbook.SheetNames.find(
      s => s.toLowerCase().includes('pr') || s.toLowerCase().includes('sheet3') || s.toLowerCase().includes('data')
    ) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    let rowIdx = 2;

    const prMap = new Map<string, PRRecord>();
    existingPRs.forEach(p => prMap.set(p.prNumber.toUpperCase(), p));

    for (const row of rows) {
      const prNumberRaw = row['Pr No'] || row['PR No'] || row['PR Number'] || row['Pr Number'] || row['PR_NO'];
      const prNumber = String(prNumberRaw || '').trim();

      if (!prNumber || prNumber === 'undefined' || prNumber === 'NaN') {
        skippedCount++;
        rowIdx++;
        continue;
      }

      try {
        const prRemarks = String(row['Pr Remarks'] || row['Remarks'] || row['Purpose'] || 'Imported PR').trim();
        const rawDept = row['Dept'] || row['Department'] || row['DEPT'] || row['Cost Center'];
        const deptCodeNorm = normalizeDeptCode(rawDept, prRemarks);
        let deptObj = departments.find(d => d.code.toUpperCase() === deptCodeNorm.toUpperCase()) || departments[0];

        const codeVal = row['Code'] || row['Budget code'] || 101;
        const budgetCodeNum = parseInt(String(codeVal), 10) || 101;
        let headObj = budgetHeads.find(bh => bh.code === budgetCodeNum) || budgetHeads[0];

        const prDate = parseExcelDate(row['PR Requested Date'] || row['PR Date'] || row['Requested Date'], '2026-07-01');
        const requestedBy = String(row['Requested By'] || row['Requestor'] || 'Department Staff').trim();

        const totalAmount = parseFloat(String(row['Sum of Total Value'] || row['Grand Total'] || row['Total Value'] || row['Amount'] || 0));
        if (isNaN(totalAmount) || totalAmount < 0) {
          errors.push({
            id: errorIdCounter++,
            batchId,
            rowNumber: rowIdx,
            prNumber,
            errorMessage: 'Invalid total amount specified in row.',
            rawData: JSON.stringify(row)
          });
          errorCount++;
          rowIdx++;
          continue;
        }

        const key = prNumber.toUpperCase();
        if (prMap.has(key)) {
          const existing = prMap.get(key)!;
          existing.prDate = prDate;
          existing.totalAmount = totalAmount;
          existing.purpose = prRemarks;
          existing.requestedBy = requestedBy;
          updatedCount++;

          // Update SQLite
          await runSqlAsync(
            `UPDATE PRS SET pr_date = ?, total_amount = ?, purpose = ?, requested_by = ? WHERE id = ?`,
            [prDate, totalAmount, prRemarks, requestedBy, existing.id]
          );
        } else {
          const newRecord: PRRecord = {
            id: existingPRs.length + 1,
            prNumber,
            prDate,
            departmentId: deptObj.id,
            departmentCode: deptObj.code,
            departmentName: deptObj.name,
            budgetHeadId: headObj.id,
            budgetHeadCode: headObj.code,
            budgetHeadName: headObj.name,
            requestedBy,
            purpose: prRemarks,
            totalAmount,
            status: 'Open',
            approvalStatus: 'Approved',
            prPoStatus: 'Open',
            sourceBudgetCode: `${budgetCodeNum}${deptObj.code}`,
            items: []
          };
          existingPRs.push(newRecord);
          prMap.set(key, newRecord);
          importedCount++;

          // Insert SQLite PRS
          await runSqlAsync(
            `INSERT INTO PRS (id, pr_number, pr_date, department_id, budget_head_id, requested_by, purpose, total_amount, status, approval_status, pr_po_status, source_budget_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newRecord.id, newRecord.prNumber, newRecord.prDate, newRecord.departmentId, newRecord.budgetHeadId, newRecord.requestedBy, newRecord.purpose, newRecord.totalAmount, newRecord.status, newRecord.approvalStatus, newRecord.prPoStatus, newRecord.sourceBudgetCode]
          );

          // Add single item in SQLite
          const itemId = itemIdCounter++;
          await runSqlAsync(
            `INSERT INTO PR_ITEMS (id, pr_id, product_name, product_description, quantity, unit_price, total_value) VALUES (?, ?, ?, ?, 1, ?, ?)`,
            [itemId, newRecord.id, prRemarks, prRemarks, totalAmount, totalAmount]
          );
        }
      } catch (err: any) {
        errorCount++;
        errors.push({
          id: errorIdCounter++,
          batchId,
          rowNumber: rowIdx,
          prNumber,
          errorMessage: err.message || 'Row processing exception.',
          rawData: JSON.stringify(row)
        });
      }
      rowIdx++;
    }
  }

  // Recalculate utilization
  recalculateCommittedAmounts();

  const batchRecord: ImportBatch = {
    id: batchId,
    batchType: isBudget ? 'BUDGET' : 'PR',
    filename,
    totalRows: isBudget ? allocations.length : rows.length,
    importedCount,
    updatedCount,
    skippedCount,
    errorCount,
    importedBy: userId,
    createdAt: new Date().toISOString()
  };

  importBatchesHistory.unshift(batchRecord);
  importErrorsMap.set(batchId, errors);

  // Write Import Batch to SQLite database
  await runSqlAsync(
    `INSERT INTO IMPORT_BATCHES (id, batch_type, filename, total_rows, imported_count, updated_count, skipped_count, error_count, imported_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [batchRecord.id, batchRecord.batchType, batchRecord.filename, batchRecord.totalRows, batchRecord.importedCount, batchRecord.updatedCount, batchRecord.skippedCount, batchRecord.errorCount, batchRecord.importedBy || null]
  );

  for (const err of errors) {
    await runSqlAsync(
      `INSERT INTO IMPORT_ERRORS (id, batch_id, row_number, pr_number, error_message, raw_data) VALUES (?, ?, ?, ?, ?, ?)`,
      [err.id, err.batchId, err.rowNumber, err.prNumber || null, err.errorMessage, err.rawData]
    );
  }

  return { batch: batchRecord, errors };
}

export function getImportBatches(): ImportBatch[] {
  return importBatchesHistory;
}

export function getImportErrors(batchId: number): ImportErrorRecord[] {
  return importErrorsMap.get(batchId) || [];
}
