'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  getAllStudents,
} from '@/lib/firestoreHelpers';
import { Task, Subject, Chapter } from '@/lib/types';
import { CheckSquare, Plus, Trash2, Check, UserCheck, RotateCcw, Sparkles } from 'lucide-react';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [students, setStudents] = useState<{uid: string, name: string, email: string}[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [taskType, setTaskType] = useState<'chapter' | 'pages'>('chapter');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [taskStartPage, setTaskStartPage] = useState('');
  const [taskEndPage, setTaskEndPage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const isPartner = user?.role === 'partner';

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
      }
    }
    fetchChapters();
  }, [selectedSubject]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // For partners, student must be selected
    if (isPartner && !selectedStudent) {
      alert('Please select a student to assign the task to');
      return;
    }

    let title = taskTitle;
    if (!title) {
      const subject = subjects.find((s) => s.id === selectedSubject);
      if (taskType === 'chapter' && selectedChapter) {
        const chapter = chapters.find((c) => c.id === selectedChapter);
        title = `Study ${subject?.name} - ${chapter?.name}`;
      } else if (taskType === 'pages' && pageCount) {
        title = `Study ${subject?.name} - ${pageCount} pages`;
      }
    }

    // Combine date and time for deadline
    let deadlineDateTime = undefined;
    if (deadlineDate && deadlineTime) {
      deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}`);
    }

    const newTask: any = {
      title,
      subjectId: selectedSubject,
      completed: false,
      userId: isPartner ? selectedStudent : user.uid, // For backwards compatibility
      assignedTo: isPartner ? selectedStudent : user.uid,
      createdBy: user.uid,
      createdAt: new Date(),
    };

    // Only add optional fields if they have values
    if (taskType === 'chapter' && selectedChapter) {
      newTask.chapterId = selectedChapter;
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

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks(tasks.filter((t) => t.id !== taskId));
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                
                return (
                  <div
                    key={task.id}
                    className={`card hover:shadow-lg transition-all transform hover:scale-102 ${!isPartner ? 'animate-slide-in-up' : ''}`}
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
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                          title="Mark as incomplete"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setTaskType('chapter')}
                    className={`flex-1 px-4 py-2 rounded-md border-2 transition-colors ${
                      taskType === 'chapter'
                        ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    By Chapter
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('pages')}
                    className={`flex-1 px-4 py-2 rounded-md border-2 transition-colors ${
                      taskType === 'pages'
                        ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    By Pages
                  </button>
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
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <select
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="input-field"
                      disabled={!deadlineDate}
                    >
                      <option value="">Select time</option>
                      {timeOptions.map((time) => (
                        <option key={time.value} value={time.value}>
                          {time.display}
                        </option>
                      ))}
                    </select>
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
    </div>
  );
}
