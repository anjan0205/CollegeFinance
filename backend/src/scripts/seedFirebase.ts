import { runFullImport } from './importExcelData';
import { initializeFirebase, getFirestoreDb } from '../config/firebase';
import { User } from '../types';

async function seedFirebase() {
  console.log('🏁 Starting Firebase Seeding Script...');

  // Initialize Firebase Admin
  const initialized = initializeFirebase();
  if (!initialized) {
    console.error('❌ Firebase failed to initialize. Make sure you have setup credentials or running Emulator.');
    process.exit(1);
  }

  const db = getFirestoreDb();
  if (!db) {
    console.error('❌ Firestore Database instance is not available.');
    process.exit(1);
  }

  try {
    // 1. Run Excel parsing engine
    console.log('📊 Parsing Excel spreadsheet data...');
    const data = await runFullImport();
    
    const { departments, budgetHeads, allocations, prs } = data;

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

        if (count === 500) {
          await batch.commit();
          console.log(`[Firebase] Committed batch of 500 for collection "${collectionName}"`);
          batch = db.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        console.log(`[Firebase] Committed final batch of ${count} for collection "${collectionName}"`);
      }
      
      console.log(`✅ Collection "${collectionName}" seed complete. Total documents: ${totalCount}`);
    };

    // 2. Clear collections first (optional but recommended for clean seed)
    console.log('🗑️ Clearing existing Firestore collections...');
    const collectionsToClear = ['departments', 'users', 'budgetHeads', 'budgetAllocations', 'prs'];
    for (const colName of collectionsToClear) {
      const snapshot = await db.collection(colName).get();
      if (snapshot.size > 0) {
        const deleteBatch = db.batch();
        snapshot.docs.forEach((doc: any) => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        console.log(`   Deleted ${snapshot.size} documents from collection "${colName}"`);
      }
    }

    // 3. Seed Departments
    console.log('⚙️ Seeding Departments...');
    await writeInBatches('departments', departments, (item) => item.code);

    // 4. Seed Users
    console.log('👤 Seeding Default Users...');
    const financeDept = departments.find((d: any) => d.code === 'FINANCE');
    const cseDept = departments.find((d: any) => d.code === 'CSE');
    const eceDept = departments.find((d: any) => d.code === 'ECE');

    const defaultHash = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVym507x8z5S8d5Y9v2wzL8G';
    const defaultUsers: User[] = [
      { id: 1, name: 'System Admin', email: 'admin@vignan.ac.in', role: 'ADMIN', departmentId: 1, departmentCode: 'DOA', departmentName: 'Dean Administration' },
      { id: 2, name: 'Finance Officer', email: 'finance@vignan.ac.in', role: 'FINANCE', departmentId: financeDept?.id || 2, departmentCode: 'FINANCE', departmentName: 'Finance Office' },
      { id: 3, name: 'Dr. CSE HOD', email: 'hod.cse@vignan.ac.in', role: 'HOD', departmentId: cseDept?.id || 3, departmentCode: 'CSE', departmentName: 'Computer Science & Engineering' },
      { id: 4, name: 'Dr. ECE HOD', email: 'hod.ece@vignan.ac.in', role: 'HOD', departmentId: eceDept?.id || 4, departmentCode: 'ECE', departmentName: 'Electronics & Communication Engineering' }
    ];
    await writeInBatches('users', defaultUsers, (item) => item.email);

    // 5. Seed Budget Heads
    console.log('⚙️ Seeding Budget Heads...');
    await writeInBatches('budgetHeads', budgetHeads, (item) => String(item.code));

    // 6. Seed Budget Allocations
    console.log('⚙️ Seeding Budget Allocations...');
    await writeInBatches('budgetAllocations', allocations, (item) => item.sourceBudgetCode);

    // 7. Seed PRs (with nested items)
    console.log('⚙️ Seeding Purchase Requests (PRs)...');
    await writeInBatches('prs', prs, (item) => item.prNumber);

    console.log('\n============================================================');
    console.log('🎉 FIREBASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('============================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seedFirebase();
