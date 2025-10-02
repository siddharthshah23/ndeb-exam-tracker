'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { calculateProgress, getExamDate, getStudentUser, getUserStreak, getTasks } from '@/lib/firestoreHelpers';
import { ProgressStats, Task } from '@/lib/types';
import { getRandomQuote } from '@/lib/motivationalQuotes';
import { Calendar, TrendingUp, BookOpen, Award, Flame, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { differenceInDays } from 'date-fns';
import Link from 'next/link';

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

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [quote, setQuote] = useState('');
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [studentName, setStudentName] = useState<string>('');
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          let targetUserId = user.uid;
          let targetName = user.name;
          
          // If partner, get student's data instead
          if (user.role === 'partner') {
            const student = await getStudentUser();
            if (student) {
              targetUserId = student.uid;
              targetName = student.name;
              setStudentName(student.name);
            }
          }
          
          const [progressData, examDateData, streakData] = await Promise.all([
            calculateProgress(targetUserId),
            getExamDate(),
            getUserStreak(targetUserId),
          ]);
          
          setProgress(progressData);
          setExamDate(examDateData);
          setDailyStreak(streakData);
          
          if (examDateData) {
            setDaysLeft(differenceInDays(examDateData, new Date()));
          }
          
          // Only show quote and current tasks for students
          if (user.role === 'student') {
            setQuote(getRandomQuote());
            const tasksData = await getTasks(user.uid);
            setCurrentTasks(tasksData.filter(t => !t.completed).slice(0, 5));
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoadingData(false);
        }
      }
    }
    fetchData();
  }, [user]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const chartData = progress
    ? Object.entries(progress.subjectProgress).map(([id, data]) => ({
        name: data.name.length > 12 ? data.name.substring(0, 12) + '...' : data.name,
        progress: data.percentage,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.role === 'partner' 
              ? `${studentName}'s Progress Dashboard 📊` 
              : `Welcome back, ${user?.name}! 👋`}
          </h1>
          {user?.role === 'student' && <p className="text-gray-600">{quote}</p>}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-medium mb-1">Exam Countdown</p>
                <p className="text-4xl font-bold">
                  {daysLeft !== null ? daysLeft : '--'}
                </p>
                <p className="text-primary-100 text-sm mt-1">days left</p>
              </div>
              <Calendar className="w-12 h-12 text-primary-200" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Overall Progress</p>
                <p className="text-4xl font-bold text-gray-900">
                  {progress?.overallProgress || 0}%
                </p>
                <p className="text-gray-500 text-sm mt-1">completed</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Revisions</p>
                <p className="text-4xl font-bold text-gray-900">
                  {progress?.totalRevisions || 0}
                </p>
                <p className="text-gray-500 text-sm mt-1">cycles completed</p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Daily Streak</p>
                <p className="text-4xl font-bold text-gray-900">{dailyStreak}</p>
                <p className="text-gray-500 text-sm mt-1">days</p>
              </div>
              <Flame className={`w-12 h-12 ${dailyStreak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
            </div>
          </div>
        </div>

        {/* Current Tasks (Students Only) */}
        {user?.role === 'student' && currentTasks.length > 0 && (
          <div className="card mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <CheckSquare className="w-6 h-6 mr-2 text-primary-600" />
                Current Tasks
              </h2>
              <Link href="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {currentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                    <div className="flex gap-3 text-xs text-gray-600">
                      {task.pages && <span>📄 {task.pages} pages</span>}
                      {task.deadline && (
                        <span className={`font-medium ${
                          new Date(task.deadline) < new Date() 
                            ? 'text-red-600' 
                            : new Date(task.deadline).getTime() - new Date().getTime() < 86400000 * 3
                            ? 'text-orange-600'
                            : 'text-gray-600'
                        }`}>
                          📅 Due {formatDeadlineEST(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link 
                    href="/tasks" 
                    className="ml-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Complete →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Chart */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="w-6 h-6 mr-2 text-primary-600" />
            Subject Progress
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Breakdown */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Subject Breakdown</h2>
          <div className="space-y-4">
            {progress &&
              Object.entries(progress.subjectProgress).map(([id, data]) => (
                <div key={id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{data.name}</span>
                    <span className="text-sm text-gray-600">
                      {data.chaptersCompleted}/{data.totalChapters} chapters ({data.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}

