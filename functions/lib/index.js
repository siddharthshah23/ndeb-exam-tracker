"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNote = exports.getProgress = exports.deleteTask = exports.updateTask = exports.createTask = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// Create Task
exports.createTask = functions.https.onCall(async (data, context) => {
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
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Error creating task');
    }
});
// Update Task
exports.updateTask = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { taskId, updates } = data;
    try {
        await db.collection('tasks').doc(taskId).update(updates);
        return { success: true };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Error updating task');
    }
});
// Delete Task
exports.deleteTask = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { taskId } = data;
    try {
        await db.collection('tasks').doc(taskId).delete();
        return { success: true };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Error deleting task');
    }
});
// Get Progress Stats
exports.getProgress = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        // Get all subjects
        const subjectsSnapshot = await db.collection('subjects').get();
        const subjects = subjectsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Get all chapters
        const chaptersSnapshot = await db.collection('chapters').get();
        const chapters = chaptersSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const subjectProgress = {};
        let totalChaptersCompleted = 0;
        let totalChapters = 0;
        let totalRevisions = 0;
        for (const subject of subjects) {
            const subjectChapters = chapters.filter((ch) => ch.subjectId === subject.id);
            const chaptersCompleted = subjectChapters.filter((ch) => ch.completedPages >= ch.totalPages).length;
            const totalPages = subjectChapters.reduce((sum, ch) => sum + ch.totalPages, 0);
            const pagesCompleted = subjectChapters.reduce((sum, ch) => sum + ch.completedPages, 0);
            totalChaptersCompleted += chaptersCompleted;
            totalChapters += subjectChapters.length;
            totalRevisions += subjectChapters.reduce((sum, ch) => sum + ch.revisionsCompleted, 0);
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
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Error calculating progress');
    }
});
// Add Note
exports.addNote = functions.https.onCall(async (data, context) => {
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
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Error adding note');
    }
});
//# sourceMappingURL=index.js.map