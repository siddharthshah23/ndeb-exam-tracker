'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Confetti from '@/components/Confetti';
import {
  getTasks,
  getAllTasks,
  createTask,
  completeTask,
  uncompleteTask,
  updateTask,
  deleteTask,
  getSubjects,
  getChaptersBySubject,
  getAllChapters,
  getAllStudents,
  getSmartChapterSuggestions,
  getSmartPageRangeSuggestions,
  canAssignRevisionTask,
} from '@/lib/firestoreHelpers';
import { Task, Subject, Chapter, SmartSuggestion } from '@/lib/types';
import { CheckSquare, Plus, Trash2, Check, UserCheck, RotateCcw, Sparkles, Lock } from 'lucide-react';
import ConfirmationDialog from '@/components/ConfirmationDialog';

// Helper function to format date in EST
const formatDeadlineEST = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export default function TasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [students, setStudents] = useState<{uid: string, name: string, email: string}[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [taskType, setTaskType] = useState<'chapter' | 'pages' | 'revision'>('chapter');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [revisionNumber, setRevisionNumber] = useState<number>(1);
  
  // Smart suggestions state
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SmartSuggestion | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [taskStartPage, setTaskStartPage] = useState('');
  const [taskEndPage, setTaskEndPage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const isPartner = user?.role === 'partner';

  // Helper function to check if user can delete a task
  const canDeleteTask = (task: Task): boolean => {
    if (!user) return false;
    
    // Partners can delete any task
    if (isPartner) return true;
    
    // Students can only delete tasks they created themselves
    return task.createdBy === user.uid;
  };

  // Helper function to get task permission info for UI
  const getTaskPermissionInfo = (task: Task) => {
    if (!user) return { canDelete: false, canEdit: false, reason: '' };
    
    const isTaskCreator = task.createdBy === user.uid;
    const isTaskAssignee = task.assignedTo === user.uid;
    
    if (isPartner) {
      return { canDelete: true, canEdit: true, reason: 'partner' };
    }
    
    if (isTaskCreator) {
      return { canDelete: true, canEdit: true, reason: 'creator' };
    }
    
    if (isTaskAssignee) {
      return { canDelete: false, canEdit: false, reason: 'assigned_by_partner' };
    }
    
    return { canDelete: false, canEdit: false, reason: 'no_permission' };
  };

  // Generate time options in 30-minute increments
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const minuteStr = minute.toString().padStart(2, '0');
      const displayTime = `${hour12}:${minuteStr} ${ampm}`;
      const valueTime = `${hour.toString().padStart(2, '0')}:${minuteStr}`;
      timeOptions.push({ value: valueTime, display: displayTime });
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          let tasksData;
          if (user.role === 'partner') {
            // Partners see ALL tasks (both created by them and by students)
            tasksData = await getAllTasks();
            // Also fetch students for assignment
            const studentsData = await getAllStudents();
            setStudents(studentsData);
          } else {
            // Students see tasks assigned to them
            tasksData = await getTasks(user.uid);
          }
          const subjectsData = await getSubjects();
          setTasks(tasksData);
          setSubjects(subjectsData);
        } catch (error) {
          console.error('Error fetching tasks:', error);
        } finally {
          setLoadingData(false);
        }
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    async function fetchChapters() {
      if (selectedSubject) {
        const chaptersData = await getChaptersBySubject(selectedSubject);
        setChapters(chaptersData);
      } else {
        // Load all chapters to check for available revision tasks
        const allChaptersData = await getAllChapters();
        setChapters(allChaptersData);
      }
    }
    fetchChapters();
  }, [selectedSubject]);

  // Load smart suggestions when subject is selected
  useEffect(() => {
    async function loadSmartSuggestions() {
      if (selectedSubject && user) {
        try {
          const targetUserId = isPartner ? selectedStudent : user.uid;
          if (targetUserId) {
            const suggestions = await getSmartChapterSuggestions(selectedSubject, targetUserId);
            setSmartSuggestions(suggestions);
          }
        } catch (error) {
          console.error('Error loading smart suggestions:', error);
        }
      }
    }
    loadSmartSuggestions();
  }, [selectedSubject, user, isPartner, selectedStudent]);

  // State for available revision chapters
  const [availableRevisionChapters, setAvailableRevisionChapters] = useState<Chapter[]>([]);

  // Get the next available revision number for selected chapter
  const getNextRevisionNumber = (chapterId: string) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter || chapter.completedPages < chapter.totalPages) return null;
    return chapter.revisionsCompleted + 1;
  };

  // Update available revision chapters when chapters change
  useEffect(() => {
    const fullyReadChapters = chapters.filter(chapter => 
      chapter.completedPages >= chapter.totalPages
    );
    setAvailableRevisionChapters(fullyReadChapters);
  }, [chapters]);

  // Reset task type if revision is selected but no chapters are available
  useEffect(() => {
    if (taskType === 'revision' && availableRevisionChapters.length === 0) {
      setTaskType('chapter');
      setSelectedChapter('');
      setRevisionNumber(1);
    }
  }, [availableRevisionChapters.length, taskType]);

  // Handle URL parameters for pre-filling form
  useEffect(() => {
    const type = searchParams.get('type');
    const subjectId = searchParams.get('subject');
    const chapterId = searchParams.get('chapter');
    const revision = searchParams.get('revision');

    if (type && subjectId && chapterId) {
      // Pre-fill the form based on URL parameters
      setTaskType(type as 'chapter' | 'pages' | 'revision');
      setSelectedSubject(subjectId);
      setSelectedChapter(chapterId);
      
      if (type === 'revision' && revision) {
        setRevisionNumber(parseInt(revision));
      }
      
      // Open the modal
      setShowCreateModal(true);
      
      // Clear URL parameters
      router.replace('/tasks');
    }
  }, [searchParams, router]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // For partners, student must be selected
    if (isPartner && !selectedStudent) {
      alert('Please select a student to assign the task to');
      return;
    }

    // Validate revision tasks
    if (taskType === 'revision' && selectedChapter) {
      const validation = await canAssignRevisionTask(selectedChapter, revisionNumber);
      if (!validation.canAssign) {
        alert(validation.reason);
        return;
      }
    }

    let title = taskTitle;
    if (!title) {
      const subject = subjects.find((s) => s.id === selectedSubject);
      if (taskType === 'chapter' && selectedChapter) {
        const chapter = chapters.find((c) => c.id === selectedChapter);
        title = `Study ${subject?.name} - ${chapter?.name}`;
      } else if (taskType === 'pages' && pageCount) {
        title = `Study ${subject?.name} - ${pageCount} pages`;
      } else if (taskType === 'revision' && selectedChapter) {
        const chapter = chapters.find((c) => c.id === selectedChapter);
        title = `Revision ${revisionNumber} - ${subject?.name} - ${chapter?.name}`;
      }
    }

    // Combine date and time for deadline (interpret as EST/EDT)
    let deadlineDateTime = undefined;
    if (deadlineDate) {
      const year = parseInt(deadlineDate.split('-')[0]);
      const month = parseInt(deadlineDate.split('-')[1]) - 1; // 0-indexed
      const day = parseInt(deadlineDate.split('-')[2]);
      
      // If no time selected, default to end of day (11:59 PM)
      const time = deadlineTime || '23:59';
      
      // Check if this date would be in Daylight Saving Time (EDT) or Standard Time (EST)
      const checkDate = new Date(year, month, day, 12, 0, 0);
      const jan = new Date(year, 0, 1);
      const jul = new Date(year, 6, 1);
      const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
      const isDST = checkDate.getTimezoneOffset() < stdTimezoneOffset;
      
      // EST is UTC-5, EDT (Daylight Saving) is UTC-4
      const offset = isDST ? '-04:00' : '-05:00';
      
      // Create ISO string with explicit timezone offset
      const isoString = `${deadlineDate}T${time}:00${offset}`;
      deadlineDateTime = new Date(isoString);
    }

    const newTask: any = {
      title,
      subjectId: selectedSubject,
      taskType,
      completed: false,
      userId: isPartner ? selectedStudent : user.uid, // For backwards compatibility
      assignedTo: isPartner ? selectedStudent : user.uid,
      createdBy: user.uid,
      createdAt: new Date(),
    };

    // Only add optional fields if they have values
    if (taskType === 'chapter' && selectedChapter) {
      newTask.chapterId = selectedChapter;
    } else if (taskType === 'revision' && selectedChapter) {
      newTask.chapterId = selectedChapter;
      newTask.revisionNumber = revisionNumber;
    }
    if (taskType === 'pages') {
      if (taskStartPage && taskEndPage) {
        newTask.startPage = parseInt(taskStartPage);
        newTask.endPage = parseInt(taskEndPage);
        newTask.pages = parseInt(taskEndPage) - parseInt(taskStartPage) + 1;
      } else if (pageCount) {
        newTask.pages = parseInt(pageCount);
      }
    }
    if (deadlineDateTime) {
      newTask.deadline = deadlineDateTime;
    }

    const taskId = await createTask(newTask);
    setTasks([{ ...newTask, id: taskId }, ...tasks]);
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setTaskType('chapter');
    setSelectedSubject('');
    setSelectedChapter('');
    setPageCount('');
    setTaskTitle('');
    setSelectedStudent('');
    setDeadlineDate('');
    setDeadlineTime('');
    setTaskStartPage('');
    setTaskEndPage('');
    setRevisionNumber(1);
    setSmartSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestion(null);
  };

  const handleSuggestionSelect = (suggestion: SmartSuggestion) => {
    setSelectedSuggestion(suggestion);
    setSelectedChapter(suggestion.id);
    
    if (suggestion.type === 'revision') {
      setTaskType('revision');
      setRevisionNumber(suggestion.revisionNumber || 1);
    } else if (suggestion.type === 'page_range') {
      setTaskType('pages');
      setTaskStartPage(suggestion.startPage?.toString() || '');
      setTaskEndPage(suggestion.endPage?.toString() || '');
    } else {
      setTaskType('chapter');
    }
    
    setShowSuggestions(false);
  };

  const handleToggleComplete = async (task: Task) => {
    // If completing, update progress
    if (!task.completed) {
      await completeTask(task.id);
      
      // Trigger confetti for students
      if (user?.role === 'student') {
        setShowConfetti(true);
      }
    } else {
      // If uncompleting, rollback progress
      await uncompleteTask(task.id);
    }
    
    setTasks(
      tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTaskClick = (task: Task) => {
    if (!canDeleteTask(task)) {
      return;
    }
    setTaskToDelete(task);
    setShowDeleteDialog(true);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    
    try {
      await deleteTask(taskToDelete.id);
      setTasks(tasks.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      // You might want to show an error message to the user here
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      {/* Confetti Effect for Students */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <CheckSquare className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
              {isPartner ? 'Assign Tasks' : 'My Tasks'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isPartner 
                ? 'Create and assign study tasks to students' 
                : 'Complete your assigned tasks to track progress'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {isPartner ? 'Assign Task' : 'Create Task'}
          </button>
        </div>

        {/* Pending Tasks */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            Pending Tasks ({pendingTasks.length})
            {!isPartner && pendingTasks.length > 0 && (
              <Sparkles className="w-5 h-5 ml-2 text-pink-500 dark:text-pink-400 animate-pulse" />
            )}
          </h2>
          {pendingTasks.length === 0 ? (
            <div className="card text-center py-12">
              <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">
                {!isPartner ? "Great job! All tasks completed! 🎉" : "No pending tasks"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((task, index) => {
                const subject = subjects.find((s) => s.id === task.subjectId);
                const chapter = task.chapterId
                  ? chapters.find((c) => c.id === task.chapterId)
                  : null;
                const assignedStudent = isPartner && students.find(s => s.uid === task.assignedTo);
                const permissionInfo = getTaskPermissionInfo(task);
                
                return (
                  <div
                    key={task.id}
                    className={`card hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all transform hover:scale-102 ${!isPartner ? 'animate-slide-in-up' : ''}`}
                    style={!isPartner ? { animationDelay: `${index * 0.1}s` } : {}}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="mt-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md p-1 transition-colors cursor-pointer"
                          title="Click to mark as complete"
                        >
                          <div className="w-6 h-6 border-2 border-current rounded-md"></div>
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>📚 {subject?.name}</span>
                            {chapter && <span>📖 {chapter.name}</span>}
                            {task.taskType === 'revision' && task.revisionNumber && (
                              <span className="text-purple-600 dark:text-purple-400 font-medium">
                                🔄 Revision {task.revisionNumber}
                              </span>
                            )}
                            {task.startPage && task.endPage ? (
                              <span>📄 Pages {task.startPage}-{task.endPage} ({task.pages} pages)</span>
                            ) : task.pages ? (
                              <span>📄 {task.pages} pages</span>
                            ) : null}
                            {task.deadline && (
                              <span className={`font-medium ${
                                new Date(task.deadline) < new Date() 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : new Date(task.deadline).getTime() - new Date().getTime() < 86400000 * 3
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                📅 {formatDeadlineEST(task.deadline)}
                              </span>
                            )}
                            {isPartner && assignedStudent && (
                              <span className="text-primary-600 dark:text-primary-400">
                                👤 {assignedStudent.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        {!permissionInfo.canDelete && permissionInfo.reason === 'assigned_by_partner' && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mr-2">
                            <Lock className="w-3 h-3 mr-1" />
                            <span>Assigned</span>
                          </div>
                        )}
                        {permissionInfo.canDelete ? (
                          <button
                            onClick={() => handleDeleteTaskClick(task)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed" title="Cannot delete this task">
                            <Trash2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Completed Tasks ({completedTasks.length})
          </h2>
          {completedTasks.length === 0 ? (
            <div className="card text-center py-12">
              <Check className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">No completed tasks yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTasks.map((task) => {
                const subject = subjects.find((s) => s.id === task.subjectId);
                const chapter = task.chapterId
                  ? chapters.find((c) => c.id === task.chapterId)
                  : null;
                const assignedStudent = isPartner && students.find(s => s.uid === task.assignedTo);
                const permissionInfo = getTaskPermissionInfo(task);
                
                return (
                  <div
                    key={task.id}
                    className="card bg-gray-50 dark:bg-gray-800/50 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="mt-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md p-1 transition-colors cursor-pointer"
                          title="Click to mark as incomplete"
                        >
                          <Check className="w-6 h-6" />
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-1 line-through">
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-500">
                            <span>📚 {subject?.name}</span>
                            {chapter && <span>📖 {chapter.name}</span>}
                            {task.taskType === 'revision' && task.revisionNumber && (
                              <span className="text-purple-600 dark:text-purple-400 font-medium">
                                🔄 Revision {task.revisionNumber}
                              </span>
                            )}
                            {task.startPage && task.endPage ? (
                              <span>📄 Pages {task.startPage}-{task.endPage} ({task.pages} pages)</span>
                            ) : task.pages ? (
                              <span>📄 {task.pages} pages</span>
                            ) : null}
                            {task.deadline && (
                              <span className="line-through">📅 {formatDeadlineEST(task.deadline)}</span>
                            )}
                            {isPartner && assignedStudent && (
                              <span className="text-primary-600 dark:text-primary-400">
                                👤 {assignedStudent.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!permissionInfo.canDelete && permissionInfo.reason === 'assigned_by_partner' && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mr-2">
                            <Lock className="w-3 h-3 mr-1" />
                            <span>Assigned</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                          title="Mark as incomplete"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        {permissionInfo.canDelete ? (
                          <button
                            onClick={() => handleDeleteTaskClick(task)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed" title="Cannot delete this task">
                            <Trash2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create/Assign Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {isPartner ? 'Assign Task' : 'Create Task'}
            </h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Student Selection (Partners only) */}
              {isPartner && (
                <div>
                  <label className="label">Assign to Student *</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.uid} value={student.uid}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Task Type */}
              <div>
                <label className="label">Task Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskType('chapter')}
                    className={`px-3 py-2 rounded-md border-2 transition-colors text-sm ${
                      taskType === 'chapter'
                        ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    Chapter
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('pages')}
                    className={`px-3 py-2 rounded-md border-2 transition-colors text-sm ${
                      taskType === 'pages'
                        ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    Pages
                  </button>
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setTaskType('revision')}
                      disabled={availableRevisionChapters.length === 0}
                      className={`px-3 py-2 rounded-md border-2 transition-colors text-sm ${
                        taskType === 'revision'
                          ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          : availableRevisionChapters.length === 0
                          ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      title={availableRevisionChapters.length === 0 ? 'No chapters available for revision tasks' : 'Assign revision tasks'}
                    >
                      Revision
                      {availableRevisionChapters.length === 0 && (
                        <span className="ml-1 text-xs">🔒</span>
                      )}
                    </button>
                    
                    {/* Hover tooltip for locked state */}
                    {availableRevisionChapters.length === 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-44 sm:w-52 md:w-60 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-sm">🦋</span>
                          <span className="font-medium">Revision Locked</span>
                        </div>
                        <p className="text-xs leading-relaxed">
                          Complete reading chapters first to unlock revisions! 📚✨
                        </p>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="label">Subject *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Smart Suggestions */}
              {selectedSubject && smartSuggestions.length > 0 && (
                <div>
                  <label className="label">Smart Suggestions</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {smartSuggestions
                      .filter(suggestion => {
                        // For revision tasks, only show revision suggestions
                        if (taskType === 'revision') {
                          return suggestion.type === 'revision';
                        }
                        // For other task types, show all suggestions
                        return true;
                      })
                      .map((suggestion) => (
                      <button
                        key={`${suggestion.id}-${suggestion.type}`}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          suggestion.priority === 'high'
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                            : suggestion.priority === 'medium'
                            ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {suggestion.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {suggestion.description}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {suggestion.priority === 'high' ? '🔥' : suggestion.priority === 'medium' ? '⚡' : '📝'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chapter (if type is chapter) */}
              {taskType === 'chapter' && (
                <div>
                  <label className="label">Chapter *</label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="input-field"
                    required
                    disabled={!selectedSubject}
                  >
                    <option value="">Select a chapter</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chapter for Revision (only if chapters are fully read) */}
              {taskType === 'revision' && (
                <div>
                  <label className="label">Chapter *</label>
                  {availableRevisionChapters.length === 0 ? (
                    <div className="input-field bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                      No chapters available for revision tasks
                    </div>
                  ) : (
                    <select
                      value={selectedChapter}
                      onChange={(e) => {
                        setSelectedChapter(e.target.value);
                        // Auto-set the next revision number when chapter changes
                        const nextRev = getNextRevisionNumber(e.target.value);
                        if (nextRev && nextRev <= 3) {
                          setRevisionNumber(nextRev);
                        }
                      }}
                      className="input-field"
                      required
                      disabled={!selectedSubject}
                    >
                      <option value="">Select a chapter</option>
                      {availableRevisionChapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.name} ({chapter.revisionsCompleted}/3 revisions)
                        </option>
                      ))}
                    </select>
                  )}
                  {availableRevisionChapters.length === 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Complete reading all pages of chapters to unlock revision tasks
                    </p>
                  )}
                </div>
              )}

              {/* Revision Number (if type is revision and chapter is selected) */}
              {taskType === 'revision' && selectedChapter && availableRevisionChapters.length > 0 && (() => {
                const nextRev = getNextRevisionNumber(selectedChapter);
                if (!nextRev || nextRev > 3) return null;
                
                return (
                  <div>
                    <label className="label">Revision Number *</label>
                    <select
                      value={revisionNumber}
                      onChange={(e) => setRevisionNumber(parseInt(e.target.value))}
                      className="input-field"
                      required
                    >
                      <option value={nextRev}>Revision {nextRev}</option>
                    </select>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Next available revision for this chapter
                    </p>
                  </div>
                );
              })()}

              {/* Page Range (if type is pages) */}
              {taskType === 'pages' && (
                <div>
                  <label className="label">Page Range *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={taskStartPage}
                      onChange={(e) => setTaskStartPage(e.target.value)}
                      className="input-field"
                      required
                      min="1"
                      placeholder="From (e.g., 66)"
                    />
                    <input
                      type="number"
                      value={taskEndPage}
                      onChange={(e) => setTaskEndPage(e.target.value)}
                      className="input-field"
                      required
                      min="1"
                      placeholder="To (e.g., 80)"
                    />
                  </div>
                  {taskStartPage && taskEndPage && parseInt(taskEndPage) >= parseInt(taskStartPage) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {parseInt(taskEndPage) - parseInt(taskStartPage) + 1} pages (Pages {taskStartPage}-{taskEndPage})
                    </p>
                  )}
                </div>
              )}

              {/* Custom Title (optional) */}
              <div>
                <label className="label">Custom Title (optional)</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="input-field"
                  placeholder="Leave empty for auto-generated title"
                />
              </div>

              {/* Deadline (optional) */}
              <div>
                <label className="label">Deadline (optional) - EST</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="input-field"
                      min={(() => {
                        // Get current date in EST timezone
                        const now = new Date();
                        const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                        const year = estDate.getFullYear();
                        const month = String(estDate.getMonth() + 1).padStart(2, '0');
                        const day = String(estDate.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()}
                    />
                  </div>
                  <div>
                    <select
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="input-field"
                      disabled={!deadlineDate}
                    >
                      <option value="">End of day (11:59 PM)</option>
                      {timeOptions.map((time) => (
                        <option key={time.value} value={time.value}>
                          {time.display}
                        </option>
                      ))}
                    </select>
                    {deadlineDate && !deadlineTime && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Defaults to 11:59 PM if not selected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {isPartner ? 'Assign Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteTaskConfirm}
        title="Delete Task"
        message={taskToDelete ? `Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
