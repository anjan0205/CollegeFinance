import dotenv from 'dotenv';
dotenv.config();
import { initializeFirebase } from '../config/firebase';
import { loadSeedData, seedFirebaseFromLocalData, getSeedDepartments, getSeedBudgetHeads, getSeedBudgetAllocations, getSeedPRRecords } from '../utils/seedData';

async function run() {
  console.log('🏁 Initializing Firebase connection...');
  initializeFirebase();

  console.log('📊 Parsing original Excel file (APR 26 to AUG 26 PR Report)...');
  loadSeedData(true);

  const depts = getSeedDepartments();
  const heads = getSeedBudgetHeads();
  const allocs = getSeedBudgetAllocations();
  const prs = getSeedPRRecords();

  console.log(`============================================================`);
  console.log(`🎉 PARSED EXCEL SUMMARY:`);
  console.log(`   - Departments: ${depts.length}`);
  console.log(`   - Budget Heads: ${heads.length}`);
  console.log(`   - Budget Allocations: ${allocs.length}`);
  console.log(`   - Purchase Requisitions (PRs): ${prs.length}`);
  console.log(`============================================================`);

  console.log('🚀 Uploading data to Firebase Firestore Cloud Database...');
  await seedFirebaseFromLocalData();

  console.log('\n✅ ORIGINAL_DATA_UPLOAD_SUCCESSFUL!');
}

run().catch(err => console.error('❌ Upload error:', err));
