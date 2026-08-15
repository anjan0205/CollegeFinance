import * as XLSX from 'xlsx';
import { getSeedPRRecords, getSeedBudgetAllocations, recalculateCommittedAmounts, getSeedDepartments, getSeedBudgetHeads } from '../utils/seedData';
import { PRRecord, ImportBatch, ImportErrorRecord } from '../types';

export interface ImportResult {
  batch: ImportBatch;
  errors: ImportErrorRecord[];
}

let batchIdCounter = 1;
let errorIdCounter = 1;
const importBatchesHistory: ImportBatch[] = [];
const importErrorsMap: Map<number, ImportErrorRecord[]> = new Map();

export async function processPRExcelImport(filePath: string, filename: string, userId?: number): Promise<ImportResult> {
  const workbook = XLSX.readFile(filePath);

  // Find target sheet
  const sheetName = workbook.SheetNames.find(
    s => s.toLowerCase().includes('pr') || s.toLowerCase().includes('sheet3') || s.toLowerCase().includes('data')
  ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  const existingPRs = getSeedPRRecords();
  const prMap = new Map<string, PRRecord>();
  existingPRs.forEach(p => prMap.set(p.prNumber.toUpperCase(), p));

  const departments = getSeedDepartments();
  const budgetHeads = getSeedBudgetHeads();

  const batchId = batchIdCounter++;
  const errors: ImportErrorRecord[] = [];

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  let rowIdx = 2; // header is row 1
  for (const row of rows) {
    const prNumberRaw = row['Pr No'] || row['PR No'] || row['PR Number'] || row['Pr Number'] || row['PR_NO'];
    const prNumber = String(prNumberRaw || '').trim();

    if (!prNumber || prNumber === 'undefined' || prNumber === 'NaN') {
      skippedCount++;
      rowIdx++;
      continue;
    }

    try {
      const prDateRaw = row['PR Requested Date'] || row['PR Date'] || row['Requested Date'];
      let prDate = '2026-07-01';
      if (prDateRaw) {
        if (typeof prDateRaw === 'string') {
          prDate = prDateRaw.substring(0, 10);
        } else if (typeof prDateRaw === 'number') {
          const d = XLSX.SSF.parse_date_code(prDateRaw);
          prDate = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        }
      }

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

      const deptCodeRaw = String(row['Dept'] || row['Department'] || row['DEPT'] || 'CSE').trim();
      let deptObj = departments.find(d => d.code.toUpperCase() === deptCodeRaw.toUpperCase());
      if (!deptObj) {
        deptObj = departments[0];
      }

      const codeVal = row['Code'] || row['Budget code'] || 101;
      const budgetCodeNum = parseInt(String(codeVal), 10) || 101;
      let headObj = budgetHeads.find(bh => bh.code === budgetCodeNum);
      if (!headObj) {
        headObj = budgetHeads[0];
      }

      const remarks = String(row['Pr Remarks'] || row['Remarks'] || row['Purpose'] || 'Imported PR').trim();
      const requestedBy = String(row['Requested By'] || row['Requestor'] || 'Department Staff').trim();

      const key = prNumber.toUpperCase();
      if (prMap.has(key)) {
        // Update existing PR record
        const existing = prMap.get(key)!;
        existing.prDate = prDate;
        existing.totalAmount = totalAmount;
        existing.purpose = remarks;
        existing.requestedBy = requestedBy;
        updatedCount++;
      } else {
        // Insert new PR record
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
          purpose: remarks,
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

  // Recalculate utilization
  recalculateCommittedAmounts();

  const batchRecord: ImportBatch = {
    id: batchId,
    batchType: 'PR',
    filename,
    totalRows: rows.length,
    importedCount,
    updatedCount,
    skippedCount,
    errorCount,
    importedBy: userId,
    createdAt: new Date().toISOString()
  };

  importBatchesHistory.unshift(batchRecord);
  importErrorsMap.set(batchId, errors);

  return { batch: batchRecord, errors };
}

export function getImportBatches(): ImportBatch[] {
  return importBatchesHistory;
}

export function getImportErrors(batchId: number): ImportErrorRecord[] {
  return importErrorsMap.get(batchId) || [];
}
