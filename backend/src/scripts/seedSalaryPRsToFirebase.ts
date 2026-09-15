import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { initializeFirebase, getFirestoreDb } from '../config/firebase';
import { loadSeedData, getSeedDepartments, getSeedBudgetHeads, getSeedBudgetAllocations } from '../utils/seedData';
import { PRRecord, PRItem, BudgetAllocation } from '../types';

// Department Code Normalization
const DEPT_MAP: Record<string, string> = {
  'AI&DS': 'AIDS',
  'AIDS': 'AIDS',
  'CIVIL': 'CE',
  'CE': 'CE',
  'CSE': 'CSE',
  'ACSE': 'CSE',
  'CSE - AI': 'AI',
  'CSE - CS': 'CS',
  'CSE - DS': 'DS',
  'ECE': 'ECE',
  'ECM': 'ECM',
  'EEE': 'EEE',
  'IT': 'IT',
  'MBA': 'MBA',
  'MCA': 'MCA',
  'MECH': 'ME',
  'ME': 'ME',
  'BS&H': 'BS&H',
  'ADMIN': 'DOA',
  'ADMIN OFFICE': 'DOA',
  'DINF': 'Dinf',
  'INFRA': 'Dinf',
  'INFRASTRUCTURE': 'Dinf'
};

async function seedSalaryPRsToFirebase() {
  console.log('\n============================================================');
  console.log('🚀 SEEDING SALARIES (101 & 102) PR DATASET TO FIREBASE FIRESTORE');
  console.log('============================================================\n');

  // 1. Initialize Firebase
  const initialized = initializeFirebase();
  if (!initialized) {
    console.error('❌ Firebase failed to initialize.');
    process.exit(1);
  }

  const db = getFirestoreDb();
  if (!db) {
    console.error('❌ Firestore Database instance is not available.');
    process.exit(1);
  }

  try {
    // 2. Load Master Budget metadata
    console.log('📊 Loading Master Budget metadata from reference Excel...');
    loadSeedData(true);
    const departments = getSeedDepartments();
    const budgetHeads = getSeedBudgetHeads();
    const allocations = getSeedBudgetAllocations();

    console.log(`✅ Loaded ${departments.length} Departments, ${budgetHeads.length} Budget Heads, and ${allocations.length} Allocations.`);

    // Map for allocation updates
    const allocationMap = new Map<string, BudgetAllocation>();
    allocations.forEach((a: BudgetAllocation) => {
      allocationMap.set(a.sourceBudgetCode.toUpperCase(), { ...a });
    });

    // 3. Read Salaries Excel File
    const excelPath = 'C:\\Users\\LENOVO\\Downloads\\salaries (101 and 102)- April to August 26.xlsx';
    console.log(`📊 Reading Salaries Excel workbook: ${excelPath}...`);
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ File not found at ${excelPath}`);
      process.exit(1);
    }

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets['Sheet1'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length < 2) {
      console.error('❌ Invalid salary sheet structure.');
      process.exit(1);
    }

    // Row 0 has header mapping (__EMPTY_X -> Dept Name)
    const headerRow = rows[0];
    const columnToDept: Record<string, string> = {};

    Object.entries(headerRow).forEach(([colKey, deptName]) => {
      if (colKey !== 'Gross Earning' && deptName && deptName !== 'Total') {
        const rawDept = String(deptName).trim();
        const code = DEPT_MAP[rawDept.toUpperCase()] || rawDept.toUpperCase();
        columnToDept[colKey] = code;
      }
    });

    console.log('📋 Mapped Department Columns:', columnToDept);

    // 4. Existing Firestore PRs (Fetch so we retain existing 659 PRs)
    console.log('\n📥 Fetching existing PRs from Firestore to merge new Salary PRs...');
    const existingPrSnap = await db.collection('prs').get();
    const prRecords: PRRecord[] = [];
    if (!existingPrSnap.empty) {
      existingPrSnap.forEach(doc => prRecords.push(doc.data() as PRRecord));
    }
    console.log(`📋 Existing PR Count in Firestore: ${prRecords.length}`);

    // Compute existing PR committed amounts
    prRecords.forEach(pr => {
      const sourceCode = pr.sourceBudgetCode ? pr.sourceBudgetCode.toUpperCase() : `${pr.budgetHeadCode}${pr.departmentCode}`.toUpperCase();
      const alloc = allocationMap.get(sourceCode);
      if (alloc) {
        alloc.committedAmount += Number(pr.totalAmount) || 0;
      }
    });

    // 5. Generate Salary PR Records for Row 1 (Code 101) & Row 2 (Code 102)
    const salaryPRs: PRRecord[] = [];
    let totalSalaryValue = 0;
    let salaryPrIndex = 700;

    [rows[1], rows[2]].forEach(row => {
      if (!row) return;
      const budgetHeadCode = Number(row['Gross Earning']);
      if (isNaN(budgetHeadCode)) return;

      const headObj = budgetHeads.find(h => h.code === budgetHeadCode) || {
        id: budgetHeadCode === 101 ? 1 : 2,
        code: budgetHeadCode,
        name: budgetHeadCode === 101 ? 'Teaching Staff Salaries' : 'Non-Teaching Staff Salaries'
      };

      Object.entries(columnToDept).forEach(([colKey, deptCode]) => {
        const rawVal = row[colKey];
        const amount = Number(rawVal);
        if (isNaN(amount) || amount <= 0) return;

        const deptObj = departments.find(d => d.code.toUpperCase() === deptCode.toUpperCase()) || {
          id: 15,
          code: deptCode,
          name: deptCode
        };

        const sourceBudgetCode = `${budgetHeadCode}${deptCode}`;
        const prNumber = `PR/SAL26/${budgetHeadCode}-${deptCode}`;
        const prDate = '2026-08-31';
        const purpose = `${budgetHeadCode === 101 ? 'Teaching Staff Gross Salary Expenditure' : 'Non-Teaching Staff Gross Salary Expenditure'} (April - August 2026)`;

        salaryPrIndex++;
        totalSalaryValue += amount;

        const prItem: PRItem = {
          id: salaryPrIndex * 10,
          prId: salaryPrIndex,
          productName: purpose,
          productCode: `SAL-${budgetHeadCode}-${deptCode}`,
          productType: 'services',
          productDescription: `${purpose} for ${deptObj.name}`,
          unitTypeName: 'Months',
          quantity: 5,
          unitPrice: Math.round(amount / 5),
          totalValue: amount,
          currentStock: 0,
          preferredVendor: 'Internal Payroll',
          productRequiredBy: prDate,
          itemRemarks: 'Monthly Gross Salary Disbursement (Apr-Aug 2026)'
        };

        const prRecord: PRRecord = {
          id: salaryPrIndex,
          prNumber,
          prDate,
          departmentId: deptObj.id,
          departmentCode: deptCode,
          departmentName: deptObj.name,
          budgetHeadId: headObj.id,
          budgetHeadCode: budgetHeadCode,
          budgetHeadName: headObj.name,
          requestedBy: `Finance Office (${deptCode})`,
          purpose,
          totalAmount: amount,
          status: 'Approved',
          approvalStatus: 'Approved',
          prPoStatus: 'Closed',
          approval1: 'HOD Approved',
          approval2: 'Finance Approved',
          approval3: 'Admin Approved',
          sourceBudgetCode,
          items: [prItem]
        };

        salaryPRs.push(prRecord);
        prRecords.push(prRecord);

        // Update Allocation
        const alloc = allocationMap.get(sourceBudgetCode.toUpperCase());
        if (alloc) {
          alloc.committedAmount += amount;
        }
      });
    });

    // Recalculate remaining & utilization for all allocations
    allocationMap.forEach(alloc => {
      alloc.remainingAmount = alloc.allocatedAmount - alloc.committedAmount;
      alloc.utilizationPercentage = Math.min(100, Math.round((alloc.committedAmount / (alloc.allocatedAmount || 1)) * 100));
      if (alloc.utilizationPercentage >= 90) alloc.alertStatus = 'Critical';
      else if (alloc.utilizationPercentage >= 75) alloc.alertStatus = 'Warning';
      else alloc.alertStatus = 'Normal';
    });

    console.log(`\n✅ Generated ${salaryPRs.length} Salary PR records.`);
    console.log(`💰 Total New Salary PR Value: ₹${totalSalaryValue.toLocaleString('en-IN')}`);
    console.log(`📋 Total Merged PR Count: ${prRecords.length}`);

    // Helper for Firestore batch writes
    const writeInBatches = async (
      collectionName: string,
      items: any[],
      getId: (item: any) => string
    ) => {
      let batch = db.batch();
      let count = 0;
      let totalCount = 0;

      for (const item of items) {
        const cleanedItem = JSON.parse(JSON.stringify(item));
        const docRef = db.collection(collectionName).doc(getId(cleanedItem));
        batch.set(docRef, cleanedItem);
        count++;
        totalCount++;

        if (count === 400) {
          await batch.commit();
          console.log(`[Firebase] Committed batch of 400 for collection "${collectionName}" (${totalCount}/${items.length})`);
          batch = db.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        console.log(`[Firebase] Committed final batch of ${count} for collection "${collectionName}" (${totalCount}/${items.length})`);
      }
    };

    // 6. Write New Salary PRs to Firestore
    console.log('\n⚙️ Writing Salary PR Records to Firestore "prs" collection...');
    await writeInBatches('prs', salaryPRs, (item) => item.prNumber.replace(/\//g, '_'));

    // 7. Write Updated Budget Allocations to Firestore
    console.log('⚙️ Updating Budget Allocations in Firestore with Salary PR utilization...');
    const updatedAllocations = Array.from(allocationMap.values());
    await writeInBatches('budgetAllocations', updatedAllocations, (item) => item.sourceBudgetCode);

    console.log('\n============================================================');
    console.log('🎉 SALARY PR DATASET (101 & 102) SUCCESSFULLY SEEDED TO FIREBASE FIRESTORE!');
    console.log(`   Seeded: ${salaryPRs.length} New Salary PRs (Value: ₹${totalSalaryValue.toLocaleString('en-IN')})`);
    console.log(`   Total PRs in Firestore: ${prRecords.length}`);
    console.log('============================================================\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding Salary PR data failed:', error);
    process.exit(1);
  }
}

seedSalaryPRsToFirebase();
