'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import FloatingBackground from '@/components/FloatingBackground';
import ProgressMilestone from '@/components/ProgressMilestone';
import { calculateProgress, getExamDate, getStudentUser, getUserStreak, getTasks } from '@/lib/firestoreHelpers';
import { ProgressStats, Task } from '@/lib/types';
import { getRandomQuote } from '@/lib/motivationalQuotes';
import { Calendar, TrendingUp, BookOpen, Award, Flame, CheckSquare, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
      <Navbar />
      {/* Floating Background - Only for Students */}
      {user?.role === 'student' && (
        <FloatingBackground density="medium" progressPercentage={progress?.overallProgress || 0} />
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 animate-slide-in-up">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            {user?.role === 'partner' 
              ? <><span>{studentName}'s Progress Dashboard</span> <span className="ml-2">📊</span></> 
              : <><span>Welcome back, {user?.name}!</span> <Sparkles className="w-8 h-8 ml-2 text-pink-500 dark:text-pink-400 animate-pulse" /></>}
          </h1>
          {user?.role === 'student' && (
            <p className="text-gray-600 dark:text-gray-400 text-lg animate-pulse">{quote}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white rounded-lg shadow-lg dark:shadow-primary-500/20 p-6 hover:shadow-xl hover:scale-105 transition-all transform animate-slide-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 dark:text-primary-200 text-sm font-medium mb-1">Exam Countdown</p>
                <p className="text-4xl font-bold">
                  {daysLeft !== null ? daysLeft : '--'}
                </p>
                <p className="text-primary-100 dark:text-primary-200 text-sm mt-1">days left</p>
              </div>
              <Calendar className="w-12 h-12 text-primary-200 dark:text-primary-300 animate-pulse" />
            </div>
          </div>

          <div className={`card hover:shadow-lg hover:scale-105 transition-all transform animate-slide-in-up ${user?.role === 'student' && (progress?.overallProgress || 0) >= 75 ? 'animate-pulse-glow' : ''}`} style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Overall Progress</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {progress?.overallProgress || 0}%
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">completed</p>
                {user?.role === 'student' && (progress?.overallProgress || 0) >= 25 && (
                  <p className="text-xs text-pink-500 dark:text-pink-400 mt-2 font-medium">
                    {(progress?.overallProgress || 0) >= 100 ? '🎉 Perfect!' : (progress?.overallProgress || 0) >= 75 ? '⭐ Amazing!' : (progress?.overallProgress || 0) >= 50 ? '🌟 Great!' : '🌱 Keep going!'}
                  </p>
                )}
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 dark:text-green-400 animate-bounce" />
            </div>
          </div>

          <div className="card hover:shadow-lg hover:scale-105 transition-all transform animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Revisions</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {progress?.totalRevisions || 0}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">cycles completed</p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-500 dark:text-blue-400 animate-wiggle" />
            </div>
          </div>

          <div className={`card hover:shadow-lg hover:scale-105 transition-all transform animate-slide-in-up ${user?.role === 'student' && dailyStreak >= 7 ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20' : ''}`} style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Daily Streak</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{dailyStreak}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">days</p>
                {user?.role === 'student' && dailyStreak >= 7 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-bold">🔥 On fire!</p>
                )}
              </div>
              <Flame className={`w-12 h-12 ${dailyStreak > 0 ? 'text-orange-500 dark:text-orange-400 animate-bounce' : 'text-gray-300 dark:text-gray-600'}`} />
            </div>
          </div>
        </div>

        {/* Current Tasks (Students Only) */}
        {user?.role === 'student' && currentTasks.length > 0 && (
          <div className="card mb-8 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <CheckSquare className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
                Current Tasks
              </h2>
              <Link href="/tasks" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {currentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{task.title}</h3>
                    <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                      {task.pages && <span>📄 {task.pages} pages</span>}
                      {task.deadline && (
                        <span className={`font-medium ${
                          new Date(task.deadline) < new Date() 
                            ? 'text-red-600 dark:text-red-400' 
                            : new Date(task.deadline).getTime() - new Date().getTime() < 86400000 * 3
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          📅 Due {formatDeadlineEST(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link 
                    href="/tasks" 
                    className="ml-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    Complete →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Chart */}
        <div className="card mb-8 hover:shadow-lg transition-all">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <Award className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
            Subject Progress
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" stroke="#d1d5db" />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(17 24 39)',
                  border: '1px solid rgb(55 65 81)',
                  borderRadius: '8px',
                  color: 'rgb(243 244 246)'
                }}
              />
              <Bar dataKey="progress" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Breakdown */}
        <div className="card hover:shadow-lg transition-all">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            Subject Breakdown
            {user?.role === 'student' && <Sparkles className="w-5 h-5 ml-2 text-pink-500 dark:text-pink-400" />}
          </h2>
          <div className="space-y-5">
            {progress &&
              Object.entries(progress.subjectProgress).map(([id, data], index) => (
                <div key={id} className="animate-slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{data.name}</span>
                      {user?.role === 'student' && data.percentage >= 25 && (
                        <span className="text-lg">
                          {data.percentage >= 100 ? '🏆' : data.percentage >= 75 ? '⭐' : data.percentage >= 50 ? '🌟' : '🌱'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {data.chaptersCompleted}/{data.totalChapters} chapters ({data.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ease-out ${
                        user?.role === 'student' && data.percentage >= 75
                          ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-primary-500 dark:from-pink-600 dark:via-purple-600 dark:to-primary-600 animate-pulse'
                          : 'bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500'
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  {user?.role === 'student' && (
                    <div className="mt-2">
                      <ProgressMilestone percentage={data.percentage} subjectName={data.name} />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}

