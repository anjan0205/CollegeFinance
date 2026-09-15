import path from 'path';
import { initializeFirebase, getFirestoreDb } from '../config/firebase';

const defaultUsers = [
  {
    id: 1,
    name: 'System Admin',
    email: 'admin@vignan.ac.in',
    role: 'ADMIN',
    departmentId: 9,
    departmentCode: 'DOA',
    departmentName: 'Dean Administration'
  },
  {
    id: 2,
    name: 'Finance Officer',
    email: 'finance@vignan.ac.in',
    role: 'FINANCE',
    departmentId: 10,
    departmentCode: 'FINANCE',
    departmentName: 'Finance Office'
  },
  {
    id: 3,
    name: 'Dr. CSE HOD',
    email: 'hod.cse@vignan.ac.in',
    role: 'HOD',
    departmentId: 1,
    departmentCode: 'CSE',
    departmentName: 'Computer Science & Engineering'
  },
  {
    id: 4,
    name: 'Dr. ECE HOD',
    email: 'hod.ece@vignan.ac.in',
    role: 'HOD',
    departmentId: 2,
    departmentCode: 'ECE',
    departmentName: 'Electronics & Communication Engineering'
  },
  {
    id: 5,
    name: 'Faculty User',
    email: 'user.cse@vignan.ac.in',
    role: 'DEPARTMENT_USER',
    departmentId: 1,
    departmentCode: 'CSE',
    departmentName: 'Computer Science & Engineering'
  }
];

async function seedUsers() {
  initializeFirebase();
  const db = getFirestoreDb();
  if (!db) {
    console.error('Firestore not available');
    process.exit(1);
  }

  const batch = db.batch();
  for (const u of defaultUsers) {
    const docRef = db.collection('users').doc(u.email);
    batch.set(docRef, u);
    console.log(`Adding user ${u.email} (${u.role})`);
  }
  await batch.commit();
  console.log('✅ Default users successfully seeded to Firestore!');
}

seedUsers().catch(err => {
  console.error('Error seeding users:', err);
  process.exit(1);
});
