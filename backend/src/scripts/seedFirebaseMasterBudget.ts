import path from 'path';
import { runFullImport } from './importExcelData';
import { initializeFirebase, getFirestoreDb } from '../config/firebase';
import { User, PRRecord, PRItem, InvoiceRecord } from '../types';

async function seedFirebaseMasterBudget() {
  console.log('\n============================================================');
  console.log('🚀 STARTING FIREBASE FIRESTORE MASTER BUDGET SEEDING PIPELINE');
  console.log('============================================================\n');

  // 1. Initialize Firebase
  const initialized = initializeFirebase();
  if (!initialized) {
    console.error('❌ Firebase failed to initialize. Please check credentials or CLI auth.');
    process.exit(1);
  }

  const db = getFirestoreDb();
  if (!db) {
    console.error('❌ Firestore Database instance is not available.');
    process.exit(1);
  }

  try {
    // 2. Run Excel Parsing Engine
    const excelPath = path.resolve(__dirname, '../../reference_excel.xlsx');
    console.log(`📊 Reading and parsing Master Budget Excel from: ${excelPath}`);
    const data = await runFullImport(excelPath);

    const { departments, budgetHeads, allocations } = data;

    // Helper for batch writes
    const writeInBatches = async (
      collectionName: string,
      items: any[],
      getId: (item: any) => string
    ) => {
      let batch = db.batch();
      let count = 0;
      let totalCount = 0;

      for (const item of items) {
        // Remove undefined properties to prevent Firestore errors
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

      console.log(`✅ Collection "${collectionName}" seed complete. Total documents: ${totalCount}`);
    };

    // 3. Clear existing Firestore collections safely
    console.log('\n🗑️ Clearing existing Firestore collections...');
    const collectionsToClear = ['departments', 'users', 'budgetHeads', 'budgetAllocations', 'prs', 'invoices'];
    for (const colName of collectionsToClear) {
      const snapshot = await db.collection(colName).get();
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
        console.log(`   Cleared ${snapshot.size} documents from collection "${colName}"`);
      }
    }

    // 4. Seed Departments
    console.log('\n⚙️ Seeding Departments to Firestore...');
    await writeInBatches('departments', departments, (item) => item.code);

    // 5. Seed Users
    console.log('👤 Seeding System Users to Firestore...');
    const financeDept = departments.find((d: any) => d.code === 'FINANCE') || departments[0];
    const cseDept = departments.find((d: any) => d.code === 'CSE') || departments[0];
    const eceDept = departments.find((d: any) => d.code === 'ECE') || departments[0];
    const doaDept = departments.find((d: any) => d.code === 'DOA') || departments[0];

    const defaultUsers: User[] = [
      { id: 1, name: 'System Admin', email: 'admin@vignan.ac.in', role: 'ADMIN', departmentId: doaDept.id, departmentCode: doaDept.code, departmentName: doaDept.name },
      { id: 2, name: 'Finance Officer', email: 'finance@vignan.ac.in', role: 'FINANCE', departmentId: financeDept.id, departmentCode: financeDept.code, departmentName: financeDept.name },
      { id: 3, name: 'Dr. CSE HOD', email: 'hod.cse@vignan.ac.in', role: 'HOD', departmentId: cseDept.id, departmentCode: cseDept.code, departmentName: cseDept.name },
      { id: 4, name: 'Dr. ECE HOD', email: 'hod.ece@vignan.ac.in', role: 'HOD', departmentId: eceDept.id, departmentCode: eceDept.code, departmentName: eceDept.name }
    ];
    await writeInBatches('users', defaultUsers, (item) => item.email);

    // 6. Seed Budget Heads
    console.log('⚙️ Seeding Budget Heads to Firestore...');
    await writeInBatches('budgetHeads', budgetHeads, (item) => String(item.code));

    // 7. Seed Budget Allocations
    console.log('⚙️ Seeding Budget Allocations to Firestore...');
    await writeInBatches('budgetAllocations', allocations, (item) => item.sourceBudgetCode);

    // 8. Seed Default Sample PRs
    console.log('⚙️ Seeding Initial Purchase Requests (PRs) to Firestore...');
    const samplePRData = [
      { deptCode: 'CSE', headCode: 103, title: 'NVIDIA RTX Workstations for AI Lab', vendor: 'Dell India Pvt Ltd', amount: 450000 },
      { deptCode: 'CSE', headCode: 101, title: 'A4 Paper Rims & Cartridges Q3', vendor: 'Stationery Mart', amount: 35000 },
      { deptCode: 'ECE', headCode: 104, title: 'VLSI Circuit Components & Breadboards', vendor: 'Pioneer Electronics', amount: 120000 },
      { deptCode: 'ECE', headCode: 102, title: 'Calibration of Oscilloscopes', vendor: 'Lab Equipments Co.', amount: 65000 },
      { deptCode: 'ME', headCode: 102, title: 'CNC Milling Machine Servicing', vendor: 'Siemens Electricals', amount: 210000 },
      { deptCode: 'CE', headCode: 104, title: 'Concrete Testing Mold & Samples', vendor: 'Supreme Hardware', amount: 85000 },
      { deptCode: 'EEE', headCode: 103, title: 'MATLAB Campus Network Licenses', vendor: 'MathWorks India', amount: 320000 },
      { deptCode: 'AIDS', headCode: 103, title: 'Cloud Infrastructure & AWS Vouchers', vendor: 'Amazon Web Services', amount: 180000 },
      { deptCode: 'DOA', headCode: 106, title: 'Ergonomic Office Chairs for Admin Block', vendor: 'Godrej Interio', amount: 140000 },
      { deptCode: 'FINANCE', headCode: 101, title: 'Annual Tax Audit Ledger Books', vendor: 'National Book House', amount: 28000 }
    ];

    const prRecords: PRRecord[] = [];
    const invoiceRecords: InvoiceRecord[] = [];

    samplePRData.forEach((sample, idx) => {
      const prId = idx + 1;
      const prNumber = `PR-2026-${String(prId).padStart(4, '0')}`;
      const dept = departments.find((d: any) => d.code === sample.deptCode) || departments[0];
      const head = budgetHeads.find((h: any) => h.code === sample.headCode) || budgetHeads[0];

      const prItem: PRItem = {
        id: 1000 + prId,
        prId,
        productName: sample.title,
        productCode: `PROD-${1000 + prId}`,
        productType: 'goods',
        productDescription: sample.title,
        unitTypeName: 'Set',
        quantity: 1,
        unitPrice: sample.amount,
        totalValue: sample.amount,
        currentStock: 0,
        preferredVendor: sample.vendor,
        productRequiredBy: '2026-06-30',
        itemRemarks: 'Required for department operations'
      };

      const pr: PRRecord = {
        id: prId,
        prNumber,
        prDate: '2026-05-10',
        departmentId: dept.id,
        departmentCode: dept.code,
        departmentName: dept.name,
        budgetHeadId: head.id,
        budgetHeadCode: head.code,
        budgetHeadName: head.name,
        requestedBy: `HOD ${dept.code}`,
        purpose: sample.title,
        totalAmount: sample.amount,
        status: 'Approved',
        approvalStatus: 'Approved',
        prPoStatus: 'Open',
        approval1: 'HOD Approved',
        approval2: 'Finance Approved',
        approval3: 'Admin Approved',
        sourceBudgetCode: `${head.code}${dept.code}`,
        items: [prItem]
      };
      prRecords.push(pr);

      // Create matching invoice
      invoiceRecords.push({
        id: prId,
        invoiceNumber: `INV-2026-${String(prId).padStart(3, '0')}`,
        invoiceDate: '2026-06-15',
        prId: pr.id,
        prNumber: pr.prNumber,
        departmentId: pr.departmentId,
        departmentCode: pr.departmentCode,
        departmentName: pr.departmentName,
        budgetHeadId: pr.budgetHeadId,
        budgetHeadCode: pr.budgetHeadCode,
        budgetHeadName: pr.budgetHeadName,
        vendorName: sample.vendor,
        totalAmount: sample.amount,
        taxAmount: Math.round(sample.amount * 0.18),
        status: 'Approved',
        paymentStatus: 'Paid',
        paymentDate: '2026-06-20',
        remarks: `Vendor bill for ${pr.purpose}`,
        submittedBy: 'Finance Officer',
        createdAt: '2026-06-15'
      });
    });

    await writeInBatches('prs', prRecords, (item) => item.prNumber);

    // 9. Seed Invoices
    console.log('⚙️ Seeding Default Invoices to Firestore...');
    await writeInBatches('invoices', invoiceRecords, (item) => item.invoiceNumber);

    console.log('\n============================================================');
    console.log('🎉 FIREBASE MASTER BUDGET SEEDING COMPLETED SUCCESSFULLY!');
    console.log('============================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seedFirebaseMasterBudget();
