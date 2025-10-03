'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
        <div className="mb-6 sm:mb-8 animate-slide-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center flex-wrap">
            {user?.role === 'partner' 
              ? <><span>{studentName}&apos;s Progress Dashboard</span> <span className="ml-2">📊</span></> 
              : <><span>Welcome back, {user?.name}!</span> <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 ml-2 text-pink-500 dark:text-pink-400 animate-pulse" /></>}
          </h1>
          {user?.role === 'student' && (
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg animate-pulse">{quote}</p>
          )}
        </div>

        {/* Stats Grid - Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-3 sm:mb-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white rounded-lg shadow-lg dark:shadow-primary-500/20 p-4 sm:p-6 hover:shadow-xl hover:scale-105 transition-all transform animate-slide-in-up">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-primary-100 dark:text-primary-200 text-xs sm:text-sm font-medium mb-1">Exam Countdown</p>
                <p className="text-3xl sm:text-4xl font-bold">
                  {daysLeft !== null ? daysLeft : '--'}
                </p>
                <p className="text-primary-100 dark:text-primary-200 text-xs sm:text-sm mt-1">days left</p>
              </div>
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-primary-200 dark:text-primary-300 animate-pulse flex-shrink-0" />
            </div>
          </div>

          <div className={`card hover:shadow-lg hover:scale-105 transition-all transform animate-slide-in-up ${user?.role === 'student' && (progress?.overallProgress || 0) >= 75 ? 'animate-pulse-glow' : ''}`} style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1">Overall Progress</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {progress?.overallProgress || 0}%
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">pages + 3 revisions</p>
                {user?.role === 'student' && (progress?.overallProgress || 0) >= 25 && (
                  <p className="text-xs text-pink-500 dark:text-pink-400 mt-1 sm:mt-2 font-medium">
                    {(progress?.overallProgress || 0) >= 100 ? '🎉 Perfect!' : (progress?.overallProgress || 0) >= 75 ? '⭐ Amazing!' : (progress?.overallProgress || 0) >= 50 ? '🌟 Great!' : '🌱 Keep going!'}
                  </p>
                )}
              </div>
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 dark:text-green-400 animate-bounce flex-shrink-0" />
            </div>
          </div>

          <div className="card hover:shadow-lg hover:scale-105 transition-all transform animate-slide-in-up bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1">Revision Progress</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {progress?.revisionProgress?.toFixed(1) || '0.0'}/3
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">avg revisions</p>
                {user?.role === 'student' && progress && progress.revisionProgress >= 1 && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 sm:mt-2 font-medium">
                    {progress.revisionProgress >= 3 ? '🏆 Master!' : progress.revisionProgress >= 2 ? '🌟 Excellent!' : '📚 Good start!'}
                  </p>
                )}
              </div>
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 dark:text-purple-400 animate-wiggle flex-shrink-0" />
            </div>
          </div>

          <div className={`card hover:shadow-lg hover:scale-105 transition-all transform animate-slide-in-up ${user?.role === 'student' && dailyStreak >= 7 ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20' : ''}`} style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1">Daily Streak</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{dailyStreak}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">days</p>
                {user?.role === 'student' && dailyStreak >= 7 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 sm:mt-2 font-bold">🔥 On fire!</p>
                )}
              </div>
              <Flame className={`w-10 h-10 sm:w-12 sm:h-12 ${dailyStreak > 0 ? 'text-orange-500 dark:text-orange-400 animate-bounce' : 'text-gray-300 dark:text-gray-600'} flex-shrink-0`} />
            </div>
          </div>
        </div>

        {/* Revision Breakdown - Row 2 */}
        {progress && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="card bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Not Started</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {progress.chaptersAt0Revisions}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">chapters (0/3)</p>
                </div>
                <div className="text-2xl">⚪</div>
              </div>
            </div>

            <div className="card bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">1st Revision</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {progress.chaptersAt1Revision}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">chapters (1/3)</p>
                </div>
                <div className="text-2xl">🔵</div>
              </div>
            </div>

            <div className="card bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">2nd Revision</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {progress.chaptersAt2Revisions}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">chapters (2/3)</p>
                </div>
                <div className="text-2xl">🟡</div>
              </div>
            </div>

            <div className="card bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">3rd Revision</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {progress.chaptersAt3Revisions}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">chapters (3/3)</p>
                </div>
                <div className="text-2xl">🟢</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Tasks (Students Only) */}
        {user?.role === 'student' && currentTasks.length > 0 && (
          <div className="card mb-6 sm:mb-8 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-base sm:text-xl">Current Tasks</span>
              </h2>
              <Link href="/tasks" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs sm:text-sm font-medium whitespace-nowrap">
                View All →
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {currentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 truncate pr-2">
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-600 dark:text-gray-400">
                      {task.pages && <span className="flex-shrink-0">📄 {task.pages} pages</span>}
                      {task.deadline && (
                        <span className={`font-medium flex-shrink-0 ${
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
                    className="self-end sm:self-auto sm:ml-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs sm:text-sm font-medium whitespace-nowrap touch-manipulation"
                  >
                    Complete →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Chart - Percentage Based */}
        <div className="card mb-6 sm:mb-8 hover:shadow-lg transition-all">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600 dark:text-primary-400" />
            <span className="text-base sm:text-xl">Subject Progress</span>
          </h2>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="min-w-[300px] px-2 sm:px-0">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" stroke="#d1d5db" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    stroke="#6b7280" 
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(17 24 39)',
                      border: '1px solid rgb(55 65 81)',
                      borderRadius: '8px',
                      color: 'rgb(243 244 246)',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value}%`, 'Progress']}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill="#0ea5e9" 
                    radius={[8, 8, 0, 0]}
                    label={{ position: 'top', fill: '#6b7280', fontSize: 11, formatter: (value: number) => `${value}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center sm:hidden">
            Swipe to see all subjects →
          </p>
        </div>

        {/* Subject Breakdown */}
        <div className="card hover:shadow-lg transition-all">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 flex items-center">
            <span className="text-base sm:text-xl">Subject Breakdown</span>
            {user?.role === 'student' && <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-pink-500 dark:text-pink-400" />}
          </h2>
          <div className="space-y-4 sm:space-y-5">
            {progress &&
              Object.entries(progress.subjectProgress).map(([id, data], index) => (
                <div key={id} className="animate-slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0">
                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                        {data.name}
                      </span>
                      {user?.role === 'student' && data.percentage >= 25 && (
                        <span className="text-base sm:text-lg flex-shrink-0">
                          {data.percentage >= 100 ? '🏆' : data.percentage >= 75 ? '⭐' : data.percentage >= 50 ? '🌟' : '🌱'}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                        {data.percentage}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {data.pagesCompleted}/{data.totalPages} pages
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden">
                    <div
                      className={`h-2.5 sm:h-3 rounded-full transition-all duration-700 ease-out ${
                        user?.role === 'student' && data.percentage >= 75
                          ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-primary-500 dark:from-pink-600 dark:via-purple-600 dark:to-primary-600 animate-pulse'
                          : 'bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500'
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 sm:mt-2 gap-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {data.chaptersCompleted}/{data.totalChapters} chapters
                    </div>
                    {user?.role === 'student' && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <ProgressMilestone percentage={data.percentage} subjectName={data.name} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}

