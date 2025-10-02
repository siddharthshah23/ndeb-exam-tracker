import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Create Task
export const createTask = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { title, subjectId, chapterId, pages, userId } = data;

  try {
    const taskRef = await db.collection('tasks').add({
      title,
      subjectId,
      chapterId: chapterId || null,
      pages: pages || null,
      completed: false,
      userId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    return { id: taskRef.id, success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error creating task');
  }
});

// Update Task
export const updateTask = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { taskId, updates } = data;

  try {
    await db.collection('tasks').doc(taskId).update(updates);
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error updating task');
  }
});

// Delete Task
export const deleteTask = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { taskId } = data;

  try {
    await db.collection('tasks').doc(taskId).delete();
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error deleting task');
  }
});

// Get Progress Stats
export const getProgress = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Get all subjects
    const subjectsSnapshot = await db.collection('subjects').get();
    const subjects = subjectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Get all chapters
    const chaptersSnapshot = await db.collection('chapters').get();
    const chapters = chaptersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const subjectProgress: any = {};
    let totalChaptersCompleted = 0;
    let totalChapters = 0;
    let totalRevisions = 0;

    for (const subject of subjects) {
      const subjectChapters = chapters.filter((ch: any) => ch.subjectId === subject.id);
      const chaptersCompleted = subjectChapters.filter(
        (ch: any) => ch.completedPages >= ch.totalPages
      ).length;
      const totalPages = subjectChapters.reduce((sum: number, ch: any) => sum + ch.totalPages, 0);
      const pagesCompleted = subjectChapters.reduce((sum: number, ch: any) => sum + ch.completedPages, 0);

      totalChaptersCompleted += chaptersCompleted;
      totalChapters += subjectChapters.length;
      totalRevisions += subjectChapters.reduce((sum: number, ch: any) => sum + ch.revisionsCompleted, 0);

      const percentage = totalPages > 0 ? Math.round((pagesCompleted / totalPages) * 100) : 0;

      subjectProgress[subject.id] = {
        name: subject.name,
        chaptersCompleted,
        totalChapters: subjectChapters.length,
        pagesCompleted,
        totalPages,
        percentage,
      };
    }

    const overallProgress = totalChapters > 0 ? Math.round((totalChaptersCompleted / totalChapters) * 100) : 0;

    return {
      subjectProgress,
      overallProgress,
      totalRevisions,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error calculating progress');
  }
});

// Add Note
export const addNote = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { text, fromUser, fromUserName } = data;

  try {
    const noteRef = await db.collection('notes').add({
      text,
      fromUser,
      fromUserName,
      createdAt: admin.firestore.Timestamp.now(),
    });

    return { id: noteRef.id, success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error adding note');
  }
});

