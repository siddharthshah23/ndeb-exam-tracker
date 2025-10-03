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
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { Subject, Chapter, Task, Note, ExamConfig, ProgressStats, SmartSuggestion } from './types';

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
    completedAt: doc.data().completedAt?.toDate() || null,
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
    completedAt: doc.data().completedAt?.toDate() || null,
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
    completedAt: doc.data().completedAt?.toDate() || null,
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

  // Mark task as completed with timestamp
  await updateDoc(doc(db, 'tasks', taskId), { 
    completed: true,
    completedAt: Timestamp.now()
  });
  
  // If task has chapterId (By Chapter or Revision), update that specific chapter
  if (task.chapterId) {
    const chapterDoc = await getDoc(doc(db, 'chapters', task.chapterId));
    if (chapterDoc.exists()) {
      const chapter = chapterDoc.data() as Chapter;
      
      if (task.taskType === 'revision' && task.revisionNumber) {
        // Task was "Revision" - update revision count
        const newRevisionCount = Math.max(chapter.revisionsCompleted, task.revisionNumber);
        await updateDoc(doc(db, 'chapters', task.chapterId), {
          revisionsCompleted: newRevisionCount,
        });
      } else {
        // Task was "By Chapter" - mark entire chapter as complete
        await updateDoc(doc(db, 'chapters', task.chapterId), {
          completedPages: chapter.totalPages,
        });
      }
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

  // Mark task as incomplete and remove completedAt timestamp
  await updateDoc(doc(db, 'tasks', taskId), { 
    completed: false,
    completedAt: deleteField()
  });
  
  // Rollback progress
    // If task has chapterId (By Chapter or Revision), handle accordingly
    if (task.chapterId) {
      const chapterDoc = await getDoc(doc(db, 'chapters', task.chapterId));
      if (chapterDoc.exists()) {
        const chapter = chapterDoc.data() as Chapter;
        
        if (task.taskType === 'revision' && task.revisionNumber) {
          // For revision tasks, rollback the revision count
          // Only rollback if this was the highest revision completed
          if (chapter.revisionsCompleted === task.revisionNumber) {
            const newRevisionCount = Math.max(0, task.revisionNumber - 1);
            await updateDoc(doc(db, 'chapters', task.chapterId), {
              revisionsCompleted: newRevisionCount,
            });
          }
        } else {
          // For chapter tasks, reset that chapter to 0
          await updateDoc(doc(db, 'chapters', task.chapterId), {
            completedPages: 0,
          });
        }
      }
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
  
  // Recalculate daily streak after uncompleting
  if (task.assignedTo) {
    await updateDailyStreak(task.assignedTo);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const taskDoc = await getDoc(doc(db, 'tasks', taskId));
  if (!taskDoc.exists()) return;
  
  const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

  // If task was completed, roll back the progress
  if (task.completed) {
    // If task has chapterId (By Chapter or Revision), handle accordingly
    if (task.chapterId) {
      const chapterDoc = await getDoc(doc(db, 'chapters', task.chapterId));
      if (chapterDoc.exists()) {
        const chapter = chapterDoc.data() as Chapter;
        
        if (task.taskType === 'revision' && task.revisionNumber) {
          // For revision tasks, rollback the revision count
          // Only rollback if this was the highest revision completed
          if (chapter.revisionsCompleted === task.revisionNumber) {
            await updateDoc(doc(db, 'chapters', task.chapterId), {
              revisionsCompleted: Math.max(0, task.revisionNumber - 1),
            });
          }
        } else {
          // For chapter tasks, reset that chapter to 0
          await updateDoc(doc(db, 'chapters', task.chapterId), {
            completedPages: 0,
          });
        }
      }
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
    
    // Recalculate daily streak after deleting completed task
    if (task.assignedTo) {
      await updateDailyStreak(task.assignedTo);
    }
  }
  
  // Delete the task
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

async function calculateStreakForUser(userId: string): Promise<number> {
  // Get all tasks for this user
  const tasksQuery = query(
    collection(db, 'tasks'),
    where('assignedTo', '==', userId)
  );
  const tasksSnapshot = await getDocs(tasksQuery);
  const tasks = tasksSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    deadline: doc.data().deadline?.toDate() || null,
    completedAt: doc.data().completedAt?.toDate() || null,
  })) as Task[];
  
  if (tasks.length === 0) return 0;
  
  // Helper function to get local date string (YYYY-MM-DD)
  const getLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Group tasks by COMPLETION date (not creation date)
  // This allows catching up - completing tasks on any day counts for that day
  const completionsByDay = new Map<string, number>();
  
  tasks.forEach(task => {
    // Only count completed tasks, using their completedAt timestamp
    if (task.completed && task.completedAt) {
      const completedDate = task.completedAt instanceof Date 
        ? task.completedAt 
        : new Date(task.completedAt);
      const dayKey = getLocalDateKey(completedDate);
      
      const currentCount = completionsByDay.get(dayKey) || 0;
      completionsByDay.set(dayKey, currentCount + 1);
    }
  });
  
  // Calculate streak going backwards from today
  // Streak continues as long as we keep completing tasks each day
  // Days with no task completions break the streak
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) { // Max 365 days lookback
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dayKey = getLocalDateKey(checkDate);
    
    const completionsOnDay = completionsByDay.get(dayKey) || 0;
    
    if (completionsOnDay > 0) {
      // At least one task completed on this day - streak continues
      streak += 1;
    } else {
      // No tasks completed on this day - streak breaks
      // (Even if tasks were assigned, not completing them breaks the streak)
      break;
    }
  }
  
  return streak;
}

export async function updateDailyStreak(userId: string): Promise<number> {
  const newStreak = await calculateStreakForUser(userId);
  
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    dailyStreak: newStreak,
    lastActivityDate: Timestamp.now(),
  });
  
  return newStreak;
}

export async function getUserStreak(userId: string): Promise<number> {
  // Always recalculate streak based on actual task completion
  return await calculateStreakForUser(userId);
}

// Progress Calculation
export async function calculateProgress(userId: string): Promise<ProgressStats> {
  const subjects = await getSubjects();
  const chapters = await getAllChapters();
  // Note: tasks are not used in progress calculation, removed to avoid index issues

  const subjectProgress: ProgressStats['subjectProgress'] = {};
  let totalProgressSum = 0; // Sum of all chapter progress percentages
  let totalChapters = 0;
  let totalRevisions = 0;

  for (const subject of subjects) {
    const subjectChapters = chapters.filter(ch => ch.subjectId === subject.id);
    const totalPages = subjectChapters.reduce((sum, ch) => sum + ch.totalPages, 0);
    const pagesCompleted = subjectChapters.reduce((sum, ch) => sum + ch.completedPages, 0);
    
    // Progressive Mastery: Calculate chapter progress including revisions
    // Each chapter: 25% for reading + 25% per revision (3 revisions = 75%)
    let subjectProgressSum = 0;
    let chaptersFullyMastered = 0; // 100% complete (all pages + 3 revisions)
    
    for (const chapter of subjectChapters) {
      // Reading progress: 0-25%
      const readingProgress = chapter.totalPages > 0 
        ? (chapter.completedPages / chapter.totalPages) * 25 
        : 0;
      
      // Revision progress: 0-75% (25% per revision × 3 revisions)
      const revisionProgress = chapter.revisionsCompleted * 25;
      
      // Total chapter progress: 0-100%
      const chapterProgress = readingProgress + revisionProgress;
      subjectProgressSum += chapterProgress;
      
      if (chapterProgress >= 100) {
        chaptersFullyMastered++;
      }
    }

    totalChapters += subjectChapters.length;
    // Only count revisions from fully read chapters
    totalRevisions += subjectChapters
      .filter(ch => ch.completedPages >= ch.totalPages)
      .reduce((sum, ch) => sum + ch.revisionsCompleted, 0);
    totalProgressSum += subjectProgressSum;

    // Subject percentage is average of all its chapters' progress
    const percentage = subjectChapters.length > 0 
      ? subjectProgressSum / subjectChapters.length 
      : 0;

    subjectProgress[subject.id] = {
      name: subject.name,
      chaptersCompleted: chaptersFullyMastered,
      totalChapters: subjectChapters.length,
      pagesCompleted,
      totalPages,
      percentage: Math.round(percentage),
    };
  }

  // Overall progress is average of all chapters' progress
  const overallProgress = totalChapters > 0 
    ? Math.round(totalProgressSum / totalChapters) 
    : 0;

  return {
    subjectProgress,
    overallProgress,
    totalRevisions,
  };
}

// Smart Task Suggestions

export async function getSmartChapterSuggestions(
  subjectId: string, 
  userId: string
): Promise<SmartSuggestion[]> {
  const chapters = await getChaptersBySubject(subjectId);
  const userTasks = await getTasks(userId);
  
  const suggestions: SmartSuggestion[] = [];
  
  for (const chapter of chapters) {
    const isFullyRead = chapter.completedPages >= chapter.totalPages;
    const isFullyMastered = isFullyRead && chapter.revisionsCompleted >= 3;
    
    // Suggest completing partially read chapters
    if (!isFullyRead && chapter.completedPages > 0) {
      suggestions.push({
        id: chapter.id,
        name: chapter.name,
        type: 'chapter',
        priority: 'high',
        description: `Complete remaining ${chapter.totalPages - chapter.completedPages} pages`,
        isUnlocked: true
      });
    }
    
    // Suggest starting unread chapters
    if (chapter.completedPages === 0) {
      suggestions.push({
        id: chapter.id,
        name: chapter.name,
        type: 'chapter',
        priority: 'medium',
        description: `Start reading (${chapter.totalPages} pages)`,
        isUnlocked: true
      });
    }
    
    // Suggest revisions (only if chapter is fully read)
    if (isFullyRead && !isFullyMastered) {
      const nextRevision = chapter.revisionsCompleted + 1;
      suggestions.push({
        id: chapter.id,
        name: chapter.name,
        type: 'revision',
        priority: 'high',
        description: `Revision ${nextRevision} (${chapter.revisionsCompleted}/3 completed)`,
        revisionNumber: nextRevision,
        isUnlocked: true
      });
    }
  }
  
  // Sort by priority and completion status
  return suggestions.sort((a, b) => {
    const priorityOrder: { [key: string]: number } = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export async function getSmartPageRangeSuggestions(
  subjectId: string,
  userId: string
): Promise<SmartSuggestion[]> {
  const chapters = await getChaptersBySubject(subjectId);
  const suggestions: SmartSuggestion[] = [];
  
  for (const chapter of chapters) {
    if (chapter.completedPages < chapter.totalPages) {
      const remainingPages = chapter.totalPages - chapter.completedPages;
      const nextPageStart = chapter.completedPages + 1;
      const nextPageEnd = Math.min(nextPageStart + 10, chapter.totalPages); // Suggest 10 pages or remaining
      
      suggestions.push({
        id: chapter.id,
        name: chapter.name,
        type: 'page_range',
        priority: remainingPages <= 20 ? 'high' : 'medium',
        description: `Pages ${nextPageStart}-${nextPageEnd} (${nextPageEnd - nextPageStart + 1} pages)`,
        startPage: nextPageStart,
        endPage: nextPageEnd,
        isUnlocked: true
      });
    }
  }
  
  return suggestions.sort((a, b) => {
    const priorityOrder: { [key: string]: number } = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export async function canAssignRevisionTask(
  chapterId: string,
  revisionNumber: number
): Promise<{ canAssign: boolean; reason?: string }> {
  const chapter = await getChapter(chapterId);
  
  if (!chapter) {
    return { canAssign: false, reason: 'Chapter not found' };
  }
  
  // Check if chapter is fully read
  if (chapter.completedPages < chapter.totalPages) {
    return { 
      canAssign: false, 
      reason: `Chapter must be fully read first (${chapter.completedPages}/${chapter.totalPages} pages completed)` 
    };
  }
  
  // Check if this revision is the next one in sequence
  if (revisionNumber !== chapter.revisionsCompleted + 1) {
    return { 
      canAssign: false, 
      reason: `Must complete revision ${chapter.revisionsCompleted + 1} first` 
    };
  }
  
  // Check if all revisions are already completed
  if (chapter.revisionsCompleted >= 3) {
    return { 
      canAssign: false, 
      reason: 'All revisions for this chapter are already completed' 
    };
  }
  
  return { canAssign: true };
}

async function getChapter(chapterId: string): Promise<Chapter | null> {
  try {
    const docRef = doc(db, 'chapters', chapterId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Chapter;
    }
    return null;
  } catch (error) {
    console.error('Error getting chapter:', error);
    return null;
  }
}

