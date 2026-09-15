import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { loadSeedData, getSeedDepartments, getSeedBudgetHeads, getSeedBudgetAllocations, getSeedInvoices, getSeedUsers, normalizeDeptCode, smartInferBudgetHead } from '../utils/seedData';
import { Department, BudgetHead, BudgetAllocation, PRRecord, PRItem, InvoiceRecord, User } from '../types';

async function buildCompleteEmbeddedDataset() {
  console.log('[Build Complete Embedded Dataset] Starting...');

  // 1. Master Budget Setup
  loadSeedData(true);
  const departments = getSeedDepartments();
  const budgetHeads = getSeedBudgetHeads();
  const allocations = getSeedBudgetAllocations();
  const defaultUsers = getSeedUsers();
  const defaultInvoices: InvoiceRecord[] = [];

  const allocationMap = new Map<string, BudgetAllocation>();
  allocations.forEach(a => {
    allocationMap.set(a.sourceBudgetCode.toUpperCase(), {
      ...a,
      committedAmount: 0,
      actualUtilizedAmount: 0,
      remainingAmount: a.allocatedAmount,
      utilizationPercentage: 0,
      alertStatus: 'Normal'
    });
  });

  const prRecords: PRRecord[] = [];

  // 2. Read Real PR Excel File
  const prExcelPath = 'C:\\Users\\LENOVO\\Downloads\\PR data from apr to sep 6 (2).xlsx';
  if (fs.existsSync(prExcelPath)) {
    console.log(`Reading PR Excel file: ${prExcelPath}...`);
    const wb = XLSX.readFile(prExcelPath);
    const sheet = wb.Sheets['Sheet1'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    rows.forEach((r, idx) => {
      const rawPrNo = String(r['Pr No'] || '').trim();
      if (!rawPrNo || rawPrNo === 'undefined' || rawPrNo === 'NaN') return;

      const prId = idx + 1;
      const prNumber = rawPrNo;
      const prDate = String(r['PR Requested Date'] || '2026-04-01').trim();
      const remarks = String(r['Pr Remarks'] || 'Purchase Requisition').trim();
      const amount = Number(r['Sum of Total Value']) || 0;

      const rawDept = String(r['Dept'] || '').trim();
      const rawCode = String(r['Code'] || '').trim();

      const deptCodeNorm = normalizeDeptCode(rawDept, remarks);
      let deptObj = departments.find(d => d.code.toUpperCase() === deptCodeNorm.toUpperCase()) || departments[0];

      const inferredHeadCode = smartInferBudgetHead(rawCode, deptObj.code, remarks, budgetHeads);
      let headObj = budgetHeads.find(h => h.code === inferredHeadCode) || budgetHeads[0];

      const sourceBudgetCode = `${headObj.code}${deptObj.code}`;

      const item: PRItem = {
        id: 1000 + prId,
        prId,
        productName: remarks,
        productCode: `PROD-${1000 + prId}`,
        productType: 'goods',
        productDescription: remarks,
        unitTypeName: 'Numbers',
        quantity: 1,
        unitPrice: amount,
        totalValue: amount,
        currentStock: 0,
        preferredVendor: 'Vendor',
        productRequiredBy: prDate,
        itemRemarks: remarks
      };

      const pr: PRRecord = {
        id: prId,
        prNumber,
        prDate,
        departmentId: deptObj.id,
        departmentCode: deptObj.code,
        departmentName: deptObj.name,
        budgetHeadId: headObj.id,
        budgetHeadCode: headObj.code,
        budgetHeadName: headObj.name,
        requestedBy: `HOD ${deptObj.code}`,
        purpose: remarks,
        totalAmount: amount,
        status: 'Approved',
        approvalStatus: 'Approved',
        prPoStatus: 'Open',
        approval1: 'HOD Approved',
        approval2: 'Finance Approved',
        approval3: 'Admin Approved',
        sourceBudgetCode,
        items: [item]
      };

      prRecords.push(pr);

      const alloc = allocationMap.get(sourceBudgetCode.toUpperCase());
      if (alloc) {
        alloc.committedAmount += amount;
      }
    });
    console.log(`✅ Loaded ${prRecords.length} PRs from main PR Excel file.`);
  }

  // 3. Read Salaries Excel File
  const salaryExcelPath = 'C:\\Users\\LENOVO\\Downloads\\salaries (101 and 102)- April to August 26.xlsx';
  if (fs.existsSync(salaryExcelPath)) {
    console.log(`Reading Salaries Excel file: ${salaryExcelPath}...`);
    const wb = XLSX.readFile(salaryExcelPath);
    const sheet = wb.Sheets['Sheet1'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length >= 3) {
      const headerRow = rows[0];
      const columnToDept: Record<string, string> = {};

      Object.entries(headerRow).forEach(([colKey, deptName]) => {
        if (colKey !== 'Gross Earning' && deptName && deptName !== 'Total') {
          const rawDept = String(deptName).trim();
          const code = normalizeDeptCode(rawDept);
          columnToDept[colKey] = code;
        }
      });

      let salaryPrIndex = 700;

      [rows[1], rows[2]].forEach((row) => {
        const rawCode = row['Gross Earning'];
        const headCodeNum = parseInt(String(rawCode), 10) || 101;
        const headObj = budgetHeads.find(h => h.code === headCodeNum) || budgetHeads[0];

        Object.entries(columnToDept).forEach(([colKey, deptCode]) => {
          const rawAmount = row[colKey];
          const salaryVal = parseFloat(String(rawAmount).replace(/,/g, ''));

          if (!isNaN(salaryVal) && salaryVal > 0) {
            const deptObj = departments.find(d => d.code.toUpperCase() === deptCode.toUpperCase()) || departments[0];
            salaryPrIndex++;
            const prNumber = `PR-SALARY-2026-${String(salaryPrIndex).padStart(4, '0')}`;
            const sourceBudgetCode = `${headObj.code}${deptObj.code}`;

            const item: PRItem = {
              id: 10000 + salaryPrIndex,
              prId: salaryPrIndex,
              productName: `Cumulative Staff Salaries (Apr-Aug 2026) - ${headObj.name}`,
              productCode: `PROD-SALARY-${salaryPrIndex}`,
              productType: 'services',
              productDescription: `Aggregated Salary Expenditure for ${deptObj.name} under Code ${headObj.code}`,
              unitTypeName: 'Months',
              quantity: 5,
              unitPrice: salaryVal / 5,
              totalValue: salaryVal,
              currentStock: 0,
              preferredVendor: 'Payroll Department',
              productRequiredBy: '2026-08-31',
              itemRemarks: `Salary PR Code ${headObj.code} (${headObj.name})`
            };

            const pr: PRRecord = {
              id: salaryPrIndex,
              prNumber,
              prDate: '2026-08-26',
              departmentId: deptObj.id,
              departmentCode: deptObj.code,
              departmentName: deptObj.name,
              budgetHeadId: headObj.id,
              budgetHeadCode: headObj.code,
              budgetHeadName: headObj.name,
              requestedBy: `Finance / Payroll Officer`,
              purpose: `Staff Salaries (April - August 2026) for ${deptObj.name}`,
              totalAmount: salaryVal,
              status: 'Approved',
              approvalStatus: 'Approved',
              prPoStatus: 'Closed',
              approval1: 'Payroll Approved',
              approval2: 'Finance Approved',
              approval3: 'Admin Approved',
              sourceBudgetCode,
              items: [item]
            };

            prRecords.push(pr);

            const alloc = allocationMap.get(sourceBudgetCode.toUpperCase());
            if (alloc) {
              alloc.committedAmount += salaryVal;
            }
          }
        });
      });
    }
    console.log(`✅ Total PRs after adding Salary PRs: ${prRecords.length}`);
  }

  // 4. Update Final Allocations
  const finalAllocations: BudgetAllocation[] = Array.from(allocationMap.values()).map(alloc => {
    const committed = alloc.committedAmount;
    const allocated = alloc.allocatedAmount;
    const remaining = allocated - committed;
    const pct = allocated > 0 ? parseFloat(((committed / allocated) * 100).toFixed(2)) : 0;
    let alertStatus: 'Normal' | 'Warning' | 'Critical' | 'Exceeded' = 'Normal';
    if (pct > 100) alertStatus = 'Exceeded';
    else if (pct >= 85) alertStatus = 'Critical';
    else if (pct >= 70) alertStatus = 'Warning';

    return {
      ...alloc,
      committedAmount: committed,
      remainingAmount: remaining,
      utilizationPercentage: pct,
      alertStatus
    };
  });

  const totalAllocated = finalAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  const totalCommitted = finalAllocations.reduce((sum, a) => sum + a.committedAmount, 0);

  console.log(`\n📊 Complete Master Dataset Metrics:`);
  console.log(` - Departments: ${departments.length}`);
  console.log(` - Budget Heads: ${budgetHeads.length}`);
  console.log(` - Allocations: ${finalAllocations.length}`);
  console.log(` - Total Allocated: ₹${totalAllocated.toLocaleString('en-IN')}`);
  console.log(` - PR Records: ${prRecords.length}`);
  console.log(` - Total PR Committed: ₹${totalCommitted.toLocaleString('en-IN')}`);
  console.log(` - Overall Utilization: ${((totalCommitted / totalAllocated) * 100).toFixed(2)}%`);

  // 5. Generate TS file
  const content = `// Auto-generated complete master dataset fallback for Serverless / Edge Workers
import { Department, BudgetHead, BudgetAllocation, PRRecord, InvoiceRecord, User } from '../types';

export const EMBEDDED_DEPARTMENTS: Department[] = ${JSON.stringify(departments, null, 2)};
export const EMBEDDED_BUDGET_HEADS: BudgetHead[] = ${JSON.stringify(budgetHeads, null, 2)};
export const EMBEDDED_BUDGET_ALLOCATIONS: BudgetAllocation[] = ${JSON.stringify(finalAllocations, null, 2)};
export const EMBEDDED_PRS: PRRecord[] = ${JSON.stringify(prRecords, null, 2)};
export const EMBEDDED_INVOICES: InvoiceRecord[] = ${JSON.stringify(defaultInvoices, null, 2)};
export const EMBEDDED_USERS: User[] = ${JSON.stringify(defaultUsers, null, 2)};
`;

  const targetFile = path.resolve(__dirname, '../data/embeddedMasterDataset.ts');
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log(`\n✅ Successfully generated complete ${targetFile} (${(fs.statSync(targetFile).size / 1024 / 1024).toFixed(2)} MB)!`);
}

buildCompleteEmbeddedDataset().catch(console.error);
