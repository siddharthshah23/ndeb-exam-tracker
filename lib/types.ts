export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'partner';
  dailyStreak?: number;
  lastActivityDate?: Date;
}

export interface Subject {
  id: string;
  name: string;
  totalChapters: number;
  createdAt: Date;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  totalPages: number;
  completedPages: number;
  revisionsCompleted: number; // 0, 1, 2, or 3
  startPage?: number; // Starting page number in the book
  endPage?: number; // Ending page number in the book
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  chapterId?: string;
  pages?: number;
  startPage?: number; // For page range tasks
  endPage?: number; // For page range tasks
  completed: boolean;
  userId: string; // Keep for backwards compatibility
  assignedTo: string; // Student who should complete the task
  createdBy: string; // Partner who created the task
  createdAt: Date;
  deadline?: Date; // Due date for the task
  completedAt?: Date; // When the task was actually completed
}

export interface Note {
  id: string;
  text: string;
  fromUser: string;
  fromUserName: string;
  createdAt: Date;
}

export interface ExamConfig {
  date: Date;
}

export interface ProgressStats {
  subjectProgress: {
    [subjectId: string]: {
      name: string;
      chaptersCompleted: number;
      totalChapters: number;
      pagesCompleted: number;
      totalPages: number;
      percentage: number;
    };
  };
  overallProgress: number; // Based on pages completed
  totalRevisions: number; // Sum of all revision cycles completed
  revisionProgress: number; // Average revision cycle progress (0-3)
  chaptersAt0Revisions: number;
  chaptersAt1Revision: number;
  chaptersAt2Revisions: number;
  chaptersAt3Revisions: number;
  totalChapters: number;
}

