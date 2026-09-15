import { initializeFirebase, getFirestoreDb } from '../config/firebase';

async function eraseFirebasePRs() {
  console.log('\n============================================================');
  console.log('🗑️  ERASING SYNTHETIC PR DATA FROM FIREBASE FIRESTORE');
  console.log('============================================================\n');

  const initialized = initializeFirebase();
  if (!initialized) {
    console.error('❌ Firebase failed to initialize. Check credentials or CLI auth.');
    process.exit(1);
  }

  const db = getFirestoreDb();
  if (!db) {
    console.error('❌ Firestore DB instance not available.');
    process.exit(1);
  }

  try {
    // 1. Delete documents from 'prs' collection
    const prsSnapshot = await db.collection('prs').get();
    console.log(`📋 Found ${prsSnapshot.size} documents in 'prs' collection.`);

    if (prsSnapshot.size > 0) {
      let batch = db.batch();
      let count = 0;
      let deletedTotal = 0;

      for (const doc of prsSnapshot.docs) {
        batch.delete(doc.ref);
        count++;
        deletedTotal++;

        if (count === 400) {
          await batch.commit();
          console.log(`[Firebase] Deleted batch of 400 PR records (${deletedTotal}/${prsSnapshot.size})`);
          batch = db.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        console.log(`[Firebase] Deleted final batch of ${count} PR records (${deletedTotal}/${prsSnapshot.size})`);
      }
      console.log(`✅ Successfully erased all ${deletedTotal} PR records from 'prs' collection.`);
    } else {
      console.log('ℹ️ No documents found in "prs" collection. Nothing to erase.');
    }

    // 2. Also check and clear synthetic 'invoices' if present (they are linked to sample PRs)
    const invoicesSnapshot = await db.collection('invoices').get();
    console.log(`📋 Found ${invoicesSnapshot.size} documents in 'invoices' collection.`);

    if (invoicesSnapshot.size > 0) {
      let batch = db.batch();
      let count = 0;
      let deletedTotal = 0;

      for (const doc of invoicesSnapshot.docs) {
        batch.delete(doc.ref);
        count++;
        deletedTotal++;

        if (count === 400) {
          await batch.commit();
          console.log(`[Firebase] Deleted batch of 400 invoice records (${deletedTotal}/${invoicesSnapshot.size})`);
          batch = db.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        console.log(`[Firebase] Deleted final batch of ${count} invoice records (${deletedTotal}/${invoicesSnapshot.size})`);
      }
      console.log(`✅ Successfully erased all ${deletedTotal} synthetic invoice records from 'invoices' collection.`);
    }

    console.log('\n============================================================');
    console.log('🎉 FIREBASE PR DATA ERASURE COMPLETE!');
    console.log('============================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error erasing PR data from Firebase:', error);
    process.exit(1);
  }
}

eraseFirebasePRs();
