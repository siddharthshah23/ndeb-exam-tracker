import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Subject, Chapter, Task, Note, ExamConfig, ProgressStats } from './types';

// Subjects
export async function getSubjects(): Promise<Subject[]> {
  const querySnapshot = await getDocs(collection(db, 'subjects'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Subject[];
}

export async function createSubject(name: string, totalChapters: number): Promise<string> {
  const docRef = await addDoc(collection(db, 'subjects'), {
    name,
    totalChapters,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateSubject(subjectId: string, data: Partial<Subject>): Promise<void> {
  await updateDoc(doc(db, 'subjects', subjectId), data);
}

export async function deleteSubject(subjectId: string): Promise<void> {
  // Delete all chapters in this subject first
  const chapters = await getChaptersBySubject(subjectId);
  for (const chapter of chapters) {
    await deleteDoc(doc(db, 'chapters', chapter.id));
  }
  // Then delete the subject
  await deleteDoc(doc(db, 'subjects', subjectId));
}

// Chapters
export async function getChaptersBySubject(subjectId: string): Promise<Chapter[]> {
  const q = query(collection(db, 'chapters'), where('subjectId', '==', subjectId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Chapter[];
}

export async function getAllChapters(): Promise<Chapter[]> {
  const querySnapshot = await getDocs(collection(db, 'chapters'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Chapter[];
}

export async function createChapter(chapter: Omit<Chapter, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'chapters'), {
    subjectId: chapter.subjectId,
    name: chapter.name,
    totalPages: chapter.totalPages,
    completedPages: chapter.completedPages || 0,
    revisionsCompleted: chapter.revisionsCompleted || 0,
  });
  return docRef.id;
}

export async function updateChapter(chapterId: string, data: Partial<Chapter>): Promise<void> {
  await updateDoc(doc(db, 'chapters', chapterId), data);
}

export async function deleteChapter(chapterId: string): Promise<void> {
  await deleteDoc(doc(db, 'chapters', chapterId));
}

// Tasks
export async function createTask(task: Omit<Task, 'id'>): Promise<string> {
  const taskData: any = {
    ...task,
    createdAt: Timestamp.fromDate(task.createdAt),
  };
  
  // Only add deadline if it exists
  if (task.deadline) {
    taskData.deadline = Timestamp.fromDate(task.deadline);
  }
  
  // Remove any undefined values
  Object.keys(taskData).forEach(key => {
    if (taskData[key] === undefined) {
      delete taskData[key];
    }
  });
  
  const docRef = await addDoc(collection(db, 'tasks'), taskData);
  return docRef.id;
}

export async function getTasks(userId: string): Promise<Task[]> {
  // Get tasks where user is assignedTo
  const q = query(
    collection(db, 'tasks'),
    where('assignedTo', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    deadline: doc.data().deadline?.toDate() || null,
  })) as Task[];
}

export async function getTasksCreatedBy(userId: string): Promise<Task[]> {
  // Get tasks created by partner
  const q = query(
    collection(db, 'tasks'),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    deadline: doc.data().deadline?.toDate() || null,
  })) as Task[];
}

export async function getAllTasks(): Promise<Task[]> {
  // Get ALL tasks (for partners to see everything)
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    deadline: doc.data().deadline?.toDate() || null,
  })) as Task[];
}

export async function getAllStudents(): Promise<{uid: string, name: string, email: string}[]> {
  const q = query(collection(db, 'users'), where('role', '==', 'student'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    uid: doc.id,
    name: doc.data().name,
    email: doc.data().email,
  }));
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, 'tasks', taskId), data);
}

export async function completeTask(taskId: string): Promise<void> {
  const taskDoc = await getDoc(doc(db, 'tasks', taskId));
  if (!taskDoc.exists()) return;
  
  const task = { id: taskDoc.id, ...taskDoc.data() } as Task;
  
  // Mark task as completed
  await updateDoc(doc(db, 'tasks', taskId), { completed: true });
  
  // If task has chapterId (By Chapter), update that specific chapter
  if (task.chapterId) {
    const chapterDoc = await getDoc(doc(db, 'chapters', task.chapterId));
    if (chapterDoc.exists()) {
      const chapter = chapterDoc.data() as Chapter;
      
      // Task was "By Chapter" - mark entire chapter as complete
      await updateDoc(doc(db, 'chapters', task.chapterId), {
        completedPages: chapter.totalPages,
      });
    }
  }
  // If task has page range (By Pages), detect which chapters are affected
  else if (task.startPage && task.endPage && task.subjectId) {
    const chaptersSnapshot = await getDocs(
      query(collection(db, 'chapters'), where('subjectId', '==', task.subjectId))
    );
    
    const chapters = chaptersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Chapter[];
    
    // Find all chapters that fall within the page range
    for (const chapter of chapters) {
      if (chapter.startPage && chapter.endPage) {
        // Check if chapter overlaps with task page range
        const chapterStart = chapter.startPage;
        const chapterEnd = chapter.endPage;
        const taskStart = task.startPage;
        const taskEnd = task.endPage;
        
        if (chapterStart <= taskEnd && chapterEnd >= taskStart) {
          // This chapter is affected by the task
          const overlapStart = Math.max(chapterStart, taskStart);
          const overlapEnd = Math.min(chapterEnd, taskEnd);
          const pagesCompleted = overlapEnd - overlapStart + 1;
          
          // Update chapter progress
          const newCompletedPages = Math.min(
            chapter.completedPages + pagesCompleted,
            chapter.totalPages
          );
          
          await updateDoc(doc(db, 'chapters', chapter.id), {
            completedPages: newCompletedPages,
          });
        }
      }
    }
  }
  
  // Update daily streak for the student assigned to the task
  if (task.assignedTo) {
    await updateDailyStreak(task.assignedTo);
  }
}

export async function uncompleteTask(taskId: string): Promise<void> {
  const taskDoc = await getDoc(doc(db, 'tasks', taskId));
  if (!taskDoc.exists()) return;
  
  const task = { id: taskDoc.id, ...taskDoc.data() } as Task;
  
  // Mark task as incomplete
  await updateDoc(doc(db, 'tasks', taskId), { completed: false });
  
  // Rollback progress
  // If task has chapterId (By Chapter), reset that chapter to 0
  if (task.chapterId) {
    await updateDoc(doc(db, 'chapters', task.chapterId), {
      completedPages: 0,
    });
  }
  // If task has page range (By Pages), rollback all affected chapters
  else if (task.startPage && task.endPage && task.subjectId) {
    const chaptersSnapshot = await getDocs(
      query(collection(db, 'chapters'), where('subjectId', '==', task.subjectId))
    );
    
    const chapters = chaptersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Chapter[];
    
    // Find all chapters that fall within the page range and rollback
    for (const chapter of chapters) {
      if (chapter.startPage && chapter.endPage) {
        const chapterStart = chapter.startPage;
        const chapterEnd = chapter.endPage;
        const taskStart = task.startPage;
        const taskEnd = task.endPage;
        
        if (chapterStart <= taskEnd && chapterEnd >= taskStart) {
          // This chapter was affected by the task
          const overlapStart = Math.max(chapterStart, taskStart);
          const overlapEnd = Math.min(chapterEnd, taskEnd);
          const pagesToRollback = overlapEnd - overlapStart + 1;
          
          // Rollback chapter progress (don't go below 0)
          const newCompletedPages = Math.max(
            chapter.completedPages - pagesToRollback,
            0
          );
          
          await updateDoc(doc(db, 'chapters', chapter.id), {
            completedPages: newCompletedPages,
          });
        }
      }
    }
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, 'tasks', taskId));
}

// Notes
export async function createNote(note: Omit<Note, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'notes'), {
    ...note,
    createdAt: Timestamp.fromDate(note.createdAt),
  });
  return docRef.id;
}

export async function getNotes(): Promise<Note[]> {
  const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Note[];
}

export async function deleteNote(noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'notes', noteId));
}

// Exam Config
export async function getExamDate(): Promise<Date | null> {
  const docRef = doc(db, 'config', 'exam');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().date?.toDate() || null;
  }
  return null;
}

export async function setExamDate(date: Date): Promise<void> {
  await updateDoc(doc(db, 'config', 'exam'), {
    date: Timestamp.fromDate(date),
  });
}

// User Functions
export async function getStudentUser(): Promise<{uid: string, name: string, email: string, dailyStreak: number} | null> {
  const q = query(collection(db, 'users'), where('role', '==', 'student'));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    uid: doc.id,
    name: data.name,
    email: data.email,
    dailyStreak: data.dailyStreak || 0,
  };
}

export async function updateDailyStreak(userId: string): Promise<number> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return 0;
  
  const userData = userDoc.data();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = userData.lastActivityDate?.toDate();
  let newStreak = userData.dailyStreak || 0;
  
  if (lastActivity) {
    const lastActivityDay = new Date(lastActivity);
    lastActivityDay.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, don't increment
      return newStreak;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      newStreak += 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }
  } else {
    // First time
    newStreak = 1;
  }
  
  await updateDoc(userRef, {
    dailyStreak: newStreak,
    lastActivityDate: Timestamp.now(),
  });
  
  return newStreak;
}

export async function getUserStreak(userId: string): Promise<number> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return 0;
  
  const userData = userDoc.data();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = userData.lastActivityDate?.toDate();
  
  if (!lastActivity) return 0;
  
  const lastActivityDay = new Date(lastActivity);
  lastActivityDay.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24));
  
  // If more than 1 day has passed, streak is broken
  if (daysDiff > 1) {
    return 0;
  }
  
  return userData.dailyStreak || 0;
}

// Progress Calculation
export async function calculateProgress(userId: string): Promise<ProgressStats> {
  const subjects = await getSubjects();
  const chapters = await getAllChapters();
  // Note: tasks are not used in progress calculation, removed to avoid index issues

  const subjectProgress: ProgressStats['subjectProgress'] = {};
  let totalChaptersCompleted = 0;
  let totalChapters = 0;
  let totalRevisions = 0;

  for (const subject of subjects) {
    const subjectChapters = chapters.filter(ch => ch.subjectId === subject.id);
    const chaptersCompleted = subjectChapters.filter(
      ch => ch.completedPages >= ch.totalPages
    ).length;
    const totalPages = subjectChapters.reduce((sum, ch) => sum + ch.totalPages, 0);
    const pagesCompleted = subjectChapters.reduce((sum, ch) => sum + ch.completedPages, 0);

    totalChaptersCompleted += chaptersCompleted;
    totalChapters += subjectChapters.length;
    totalRevisions += subjectChapters.reduce((sum, ch) => sum + ch.revisionsCompleted, 0);

    const percentage = totalPages > 0 ? (pagesCompleted / totalPages) * 100 : 0;

    subjectProgress[subject.id] = {
      name: subject.name,
      chaptersCompleted,
      totalChapters: subjectChapters.length,
      pagesCompleted,
      totalPages,
      percentage: Math.round(percentage),
    };
  }

  const overallProgress = totalChapters > 0 
    ? Math.round((totalChaptersCompleted / totalChapters) * 100) 
    : 0;

  return {
    subjectProgress,
    overallProgress,
    totalRevisions,
  };
}

