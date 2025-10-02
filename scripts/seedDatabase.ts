import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { seedSubjects, seedChapters } from '../lib/seedData';

// Initialize Firebase Admin
// Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or place your service account key in the project root
const app = initializeApp({
  credential: cert(require('../serviceAccountKey.json')),
});

const db = getFirestore(app);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create subjects
    console.log('Creating subjects...');
    const subjectIds: { [key: string]: string } = {};
    
    for (const subject of seedSubjects) {
      const docRef = await db.collection('subjects').add({
        name: subject.name,
        totalChapters: subject.totalChapters,
        createdAt: Timestamp.now(),
      });
      subjectIds[subject.name] = docRef.id;
      console.log(`✓ Created subject: ${subject.name}`);
    }

    console.log('\nCreating chapters...');
    let totalChapters = 0;
    
    for (const [subjectName, chapters] of Object.entries(seedChapters)) {
      const subjectId = subjectIds[subjectName];
      if (!subjectId) continue;

      for (const chapter of chapters) {
        await db.collection('chapters').add({
          subjectId,
          name: chapter.name,
          totalPages: chapter.totalPages,
          completedPages: 0,
          revisionsCompleted: 0,
        });
        totalChapters++;
      }
      console.log(`✓ Created ${chapters.length} chapters for ${subjectName}`);
    }

    // Set exam date (6 months from now as example)
    console.log('\nSetting exam date...');
    const examDate = new Date();
    examDate.setMonth(examDate.getMonth() + 6);
    
    await db.collection('config').doc('exam').set({
      date: Timestamp.fromDate(examDate),
    });
    console.log(`✓ Exam date set to: ${examDate.toLocaleDateString()}`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Subjects: ${seedSubjects.length}`);
    console.log(`   - Chapters: ${totalChapters}`);
    console.log(`   - Exam date: ${examDate.toLocaleDateString()}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();

