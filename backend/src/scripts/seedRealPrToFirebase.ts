import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { initializeFirebase, getFirestoreDb } from '../config/firebase';
import { loadSeedData, getSeedDepartments, getSeedBudgetHeads, getSeedBudgetAllocations, normalizeDeptCode, smartInferBudgetHead } from '../utils/seedData';
import { PRRecord, PRItem, BudgetAllocation } from '../types';

async function seedRealPrToFirebase() {
  console.log('\n============================================================');
  console.log('🚀 SEEDING REAL PR DATASET TO FIREBASE FIRESTORE');
  console.log('============================================================\n');

  // 1. Initialize Firebase
  const initialized = initializeFirebase();
  if (!initialized) {
    console.error('❌ Firebase failed to initialize. Check credentials or CLI auth.');
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

    console.log(`✅ Loaded ${departments.length} Departments and ${budgetHeads.length} Budget Heads.`);

    // 3. Read Real PR Excel File
    const excelPath = 'C:\\Users\\LENOVO\\Downloads\\PR data from apr to sep 6 (2).xlsx';
    console.log(`📊 Reading Real PR Excel workbook: ${excelPath}...`);
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ File not found at ${excelPath}`);
      process.exit(1);
    }

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets['Sheet1'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log(`📋 Found ${rows.length} total rows in Sheet1.`);

    // Helper map for allocations calculation
    const allocationMap = new Map<string, BudgetAllocation>();
    allocations.forEach((a: BudgetAllocation) => {
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
    let totalPrValue = 0;

    rows.forEach((r, idx) => {
      const rawPrNo = String(r['Pr No'] || '').trim();
      if (!rawPrNo || rawPrNo === 'undefined' || rawPrNo === 'NaN') return;

      const prId = idx + 1;
      const prNumber = rawPrNo;
      const docId = rawPrNo.replace(/\//g, '_');
      const prDate = String(r['PR Requested Date'] || '2026-04-01').trim();
      const remarks = String(r['Pr Remarks'] || 'Purchase Requisition').trim();
      const amount = Number(r['Sum of Total Value']) || 0;
      totalPrValue += amount;

      const rawDept = String(r['Dept'] || '').trim();
      const rawCode = String(r['Code'] || '').trim();

      // Resolve Dept
      const normCode = normalizeDeptCode(rawDept, remarks);
      let deptObj = departments.find((d: any) => d.code.toUpperCase() === normCode.toUpperCase()) || departments[0];

      // Resolve Budget Head
      const inferredHeadCode = smartInferBudgetHead(rawCode, deptObj.code, remarks, budgetHeads);
      let headObj = budgetHeads.find((h: any) => h.code === inferredHeadCode) || budgetHeads[0];

      const sourceBudgetCode = `${headObj.code}${deptObj.code}`;

      // Create PR Item
      const prItem: PRItem = {
        id: prId * 10,
        prId,
        productName: remarks.length > 250 ? remarks.substring(0, 247) + '...' : remarks,
        productCode: `PROD-2026-${String(prId).padStart(4, '0')}`,
        productType: 'goods',
        productDescription: remarks,
        unitTypeName: 'Numbers',
        quantity: 1,
        unitPrice: amount,
        totalValue: amount,
        currentStock: 0,
        preferredVendor: 'General Supplier',
        productRequiredBy: prDate,
        itemRemarks: remarks
      };

      const prRecord: PRRecord = {
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
        items: [prItem]
      };

      prRecords.push(prRecord);

      // Update Allocation Utilization
      const alloc = allocationMap.get(sourceBudgetCode.toUpperCase());
      if (alloc) {
        alloc.committedAmount += amount;
        alloc.remainingAmount = alloc.allocatedAmount - alloc.committedAmount;
        alloc.utilizationPercentage = Math.min(100, Math.round((alloc.committedAmount / (alloc.allocatedAmount || 1)) * 100));
        if (alloc.utilizationPercentage >= 90) alloc.alertStatus = 'Critical';
        else if (alloc.utilizationPercentage >= 75) alloc.alertStatus = 'Warning';
      }
    });

    console.log(`✅ Parsed ${prRecords.length} Real PR records.`);
    console.log(`💰 Total Real PR Financial Value: ₹${totalPrValue.toLocaleString('en-IN')}`);

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

      console.log(`✅ Collection "${collectionName}" write complete. Total documents: ${totalCount}`);
    };

    // 4. Clear old Firestore PRs
    console.log('\n🗑️ Clearing old PRs in Firestore...');
    const snapshot = await db.collection('prs').get();
    if (snapshot.size > 0) {
      let deleteBatch = db.batch();
      let delCount = 0;
      for (const doc of snapshot.docs) {
        deleteBatch.delete(doc.ref);
        delCount++;
        if (delCount === 400) {
          await deleteBatch.commit();
          deleteBatch = db.batch();
          delCount = 0;
        }
      }
      if (delCount > 0) {
        await deleteBatch.commit();
      }
      console.log(`   Deleted ${snapshot.size} existing PR documents from Firestore.`);
    }

    // 5. Seed Real PRs to Firestore
    console.log('\n⚙️ Writing 659 Real PR Records to Firestore "prs" collection...');
    await writeInBatches('prs', prRecords, (item) => item.prNumber.replace(/\//g, '_'));

    // 6. Update Firestore Budget Allocations
    console.log('⚙️ Updating Budget Allocations in Firestore with real PR utilization...');
    const updatedAllocations = Array.from(allocationMap.values());
    await writeInBatches('budgetAllocations', updatedAllocations, (item) => item.sourceBudgetCode);

    console.log('\n============================================================');
    console.log('🎉 REAL PR DATASET SUCCESSFULLY IMPORTED & SEEDED TO FIREBASE FIRESTORE!');
    console.log(`   Seeded: ${prRecords.length} Real PRs (Total Value: ₹${totalPrValue.toLocaleString('en-IN')})`);
    console.log('============================================================\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding real PR data failed with error:', error);
    process.exit(1);
  }
}

seedRealPrToFirebase();
