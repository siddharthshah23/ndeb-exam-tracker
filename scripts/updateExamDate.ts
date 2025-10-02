import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(require('../serviceAccountKey.json')),
});

const db = getFirestore(app);

async function updateExamDate() {
  console.log('📅 Updating exam date...\n');

  // Get date from command line argument or default to 6 months from now
  const args = process.argv.slice(2);
  let examDate: Date;

  if (args.length > 0) {
    // Expected format: YYYY-MM-DD
    examDate = new Date(args[0]);
    if (isNaN(examDate.getTime())) {
      console.error('❌ Invalid date format. Please use YYYY-MM-DD');
      process.exit(1);
    }
  } else {
    examDate = new Date();
    examDate.setMonth(examDate.getMonth() + 6);
  }

  try {
    await db.collection('config').doc('exam').set({
      date: Timestamp.fromDate(examDate),
    });

    console.log(`✅ Exam date updated to: ${examDate.toLocaleDateString()}`);
    console.log(`📊 Days until exam: ${Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}`);
  } catch (error) {
    console.error('❌ Error updating exam date:', error);
  } finally {
    process.exit(0);
  }
}

updateExamDate();

