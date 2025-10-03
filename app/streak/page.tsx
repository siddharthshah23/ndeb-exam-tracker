'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { getTasks, getUserStreak } from '@/lib/firestoreHelpers';
import { Task } from '@/lib/types';
import { Flame, ArrowLeft, Calendar, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import { format, subDays, startOfDay } from 'date-fns';

export default function StreakPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dailyStreak, setDailyStreak] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
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
          const [streak, tasksData] = await Promise.all([
            getUserStreak(user.uid),
            getTasks(user.uid),
          ]);
          setDailyStreak(streak);
          setTasks(tasksData);
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

  // Calculate task completion stats for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
    const tasksOnDay = tasks.filter(task => {
      if (!task.completedAt) return false;
      try {
        // Handle both Date objects and Firestore Timestamps
        const completedDate = task.completedAt instanceof Date 
          ? task.completedAt 
          : new Date(task.completedAt);
        const taskDate = format(startOfDay(completedDate), 'yyyy-MM-dd');
        return taskDate === dateKey;
      } catch (error) {
        console.error('Error parsing completedAt:', error);
        return false;
      }
    });
    return {
      date: format(date, 'MMM dd'),
      day: format(date, 'EEE'),
      completed: tasksOnDay.length,
      isToday: i === 0,
    };
  }).reverse();

  const totalTasksCompleted = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((totalTasksCompleted / totalTasks) * 100) : 0;

  // Streak milestones
  const nextMilestone = dailyStreak < 7 ? 7 : dailyStreak < 14 ? 14 : dailyStreak < 30 ? 30 : dailyStreak < 60 ? 60 : dailyStreak < 100 ? 100 : dailyStreak + 50;
  const daysToMilestone = nextMilestone - dailyStreak;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="mb-6 sm:mb-8 animate-slide-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center flex-wrap gap-2">
            <Flame className={`w-7 h-7 sm:w-8 sm:h-8 ${dailyStreak > 0 ? 'text-orange-500 dark:text-orange-400 animate-bounce' : 'text-gray-400 dark:text-gray-600'}`} />
            <span>Daily Streak</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Your consistency and dedication tracker
          </p>
        </div>

        {/* Current Streak Card */}
        <div className={`card mb-6 sm:mb-8 ${dailyStreak >= 7 ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800' : ''}`}>
          <div className="text-center p-4 sm:p-8">
            <Flame className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 ${dailyStreak > 0 ? 'text-orange-500 dark:text-orange-400 animate-bounce' : 'text-gray-300 dark:text-gray-600'}`} />
            <p className="text-5xl sm:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {dailyStreak}
            </p>
            <p className="text-lg sm:text-2xl text-gray-600 dark:text-gray-400 mb-4">
              {dailyStreak === 1 ? 'Day Streak' : 'Days Streak'}
            </p>
            {dailyStreak >= 7 && (
              <p className="text-base sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                🔥 {dailyStreak >= 30 ? "You're unstoppable!" : dailyStreak >= 14 ? "On fire!" : "Great work!"}
              </p>
            )}
            {dailyStreak === 0 && user?.role === 'student' && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Complete a task today to start your streak! 🌱
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Next Milestone</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {nextMilestone}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {daysToMilestone} days to go
                </p>
              </div>
              <Award className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Tasks Completed</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {totalTasksCompleted}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  of {totalTasks} total
                </p>
              </div>
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Rate</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {completionRate}%
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  overall
                </p>
              </div>
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500 dark:text-primary-400" />
            </div>
          </div>
        </div>

        {/* Last 7 Days Activity */}
        <div className="card mb-6 sm:mb-8 hover:shadow-lg transition-all">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
            Last 7 Days Activity
          </h2>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {last7Days.map((day, index) => (
              <div
                key={index}
                className={`flex flex-col items-center p-2 sm:p-3 rounded-lg transition-all ${
                  day.completed > 0
                    ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600'
                    : day.isToday
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {day.day}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mb-1 sm:mb-2">
                  {day.date}
                </p>
                <p className={`text-xl sm:text-2xl font-bold ${
                  day.completed > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}>
                  {day.completed > 0 ? day.completed : '·'}
                </p>
                {day.isToday && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                    Today
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="card hover:shadow-lg transition-all">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
            Streak Milestones
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { 
                days: 7, 
                title: 'Budding Flower', 
                emoji: '🌸', 
                reward: 'First seeds planted!',
                story: 'As the Queen of Knowledge, you\'ve planted the first magical seeds in your enchanted garden. Tiny buds are beginning to sprout!'
              },
              { 
                days: 14, 
                title: 'Blooming Beauty', 
                emoji: '🌺', 
                reward: 'Flowers in full bloom!',
                story: 'Your dedication has brought forth beautiful flowers! The garden is alive with color and the butterflies are starting to notice your magical realm.'
              },
              { 
                days: 30, 
                title: 'Butterfly Emerging', 
                emoji: '🦋', 
                reward: 'Transformation begins!',
                story: 'A butterfly has emerged from its cocoon, drawn by your beautiful garden! Your consistent care is creating a sanctuary for transformation and growth.'
              },
              { 
                days: 60, 
                title: 'Graceful Butterfly', 
                emoji: '✨', 
                reward: 'Flying with confidence!',
                story: 'The butterfly dances gracefully among your flowers, spreading magic throughout the garden. You\'ve become the guardian of a thriving paradise!'
              },
              { 
                days: 100, 
                title: 'Garden Goddess', 
                emoji: '🌻', 
                reward: 'A legendary garden!',
                story: 'You are now the legendary Garden Goddess! Hundreds of butterflies fill your magical realm, and your garden has become a beacon of beauty and wisdom. You\'ve saved an entire ecosystem!'
              },
            ].map((milestone) => {
              const achieved = dailyStreak >= milestone.days;
              const current = dailyStreak < milestone.days && dailyStreak >= (milestone.days - 7);
              
              return (
                <div
                  key={milestone.days}
                  className={`p-3 sm:p-4 rounded-lg ${
                    achieved
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 dark:border-green-600'
                      : current
                      ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <span className="text-3xl sm:text-4xl flex-shrink-0">{milestone.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm sm:text-base ${
                          achieved ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {milestone.title}
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-primary-600 dark:text-primary-400">
                          {milestone.reward}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm sm:text-base ${
                        achieved ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {milestone.days} days
                      </p>
                      {achieved ? (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Achieved</p>
                      ) : current ? (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Almost there!</p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-500">Locked</p>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs sm:text-sm italic leading-relaxed ${
                    achieved 
                      ? 'text-green-700 dark:text-green-300' 
                      : current
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {milestone.story}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-pink-900 dark:text-pink-100 mb-3 flex items-center gap-2">
            <span className="text-xl">👑</span>
            <span>Your Royal Quest</span>
          </h3>
          <p className="text-xs sm:text-sm text-pink-800 dark:text-pink-200 mb-3 leading-relaxed">
            <strong>You are the Queen of Knowledge</strong>, guardian of an enchanted garden. Each day you study, 
            you nurture magical flowers and help butterflies emerge from their cocoons. 🌸🦋
          </p>
          <p className="text-xs sm:text-sm text-pink-800 dark:text-pink-200 mb-3 leading-relaxed">
            Your streak grows with every completed task. But be careful - if you miss a day with assigned tasks, 
            the garden magic fades and you must start anew.
          </p>
          <p className="text-xs sm:text-sm text-pink-900 dark:text-pink-100 font-semibold">
            ✨ Keep studying every day to save the butterflies and build your legendary garden! ✨
          </p>
        </div>
      </main>
    </div>
  );
}
