'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { calculateProgress } from '@/lib/firestoreHelpers';
import { ProgressStats } from '@/lib/types';
import { BookOpen, Award, TrendingUp, Target, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ProgressOverviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressStats | null>(null);
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
          const progressData = await calculateProgress(user.uid);
          setProgress(progressData);
        } catch (error) {
          console.error('Error fetching progress:', error);
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

  // Calculate detailed statistics
  const totalSubjects = Object.keys(progress?.subjectProgress || {}).length;
  const totalChapters = Object.values(progress?.subjectProgress || {}).reduce(
    (sum, subj) => sum + subj.totalChapters,
    0
  );
  const chaptersFullyMastered = Object.values(progress?.subjectProgress || {}).reduce(
    (sum, subj) => sum + subj.chaptersCompleted,
    0
  );
  const totalPages = Object.values(progress?.subjectProgress || {}).reduce(
    (sum, subj) => sum + subj.totalPages,
    0
  );
  const pagesCompleted = Object.values(progress?.subjectProgress || {}).reduce(
    (sum, subj) => sum + subj.pagesCompleted,
    0
  );

  // Calculate reading vs revision progress
  const maxPossibleRevisions = totalChapters * 3;
  const revisionCompletion = maxPossibleRevisions > 0
    ? Math.round(((progress?.totalRevisions || 0) / maxPossibleRevisions) * 100)
    : 0;
  const readingCompletion = totalPages > 0
    ? Math.round((pagesCompleted / totalPages) * 100)
    : 0;

  // Chart data for subjects
  const subjectChartData = Object.entries(progress?.subjectProgress || {}).map(([id, data]) => ({
    name: data.name.length > 15 ? data.name.substring(0, 15) + '...' : data.name,
    progress: data.percentage,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="mb-8 animate-slide-in-up">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            <Target className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
            Progress Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed breakdown of your learning journey
          </p>
        </div>

        {/* Overall Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Overall Mastery
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {progress?.overallProgress || 0}%
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Reading + Revisions
                </p>
              </div>
              <Award className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <div className="card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Reading Progress
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {readingCompletion}%
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {pagesCompleted}/{totalPages} pages
                </p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Revision Progress
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {revisionCompletion}%
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {progress?.totalRevisions || 0}/{maxPossibleRevisions} revisions
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Fully Mastered
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {chaptersFullyMastered}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  of {totalChapters} chapters
                </p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>
        </div>

        {/* Progress Breakdown Chart */}
        <div className="card mb-8 hover:shadow-lg transition-all">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Subject Progress Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectChartData}>
              <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" stroke="#d1d5db" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                label={{ value: 'Mastery %', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(17 24 39)',
                  border: '1px solid rgb(55 65 81)',
                  borderRadius: '8px',
                  color: 'rgb(243 244 246)',
                }}
                formatter={(value) => [`${value}%`, 'Progress']}
              />
              <Bar dataKey="progress" radius={[8, 8, 0, 0]}>
                {subjectChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.progress >= 75
                        ? '#10b981'
                        : entry.progress >= 50
                        ? '#0ea5e9'
                        : entry.progress >= 25
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Subject Breakdown */}
        <div className="card hover:shadow-lg transition-all">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Detailed Subject Analysis
          </h2>
          <div className="space-y-6">
            {progress &&
              Object.entries(progress.subjectProgress).map(([id, data]) => (
                <div key={id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {data.name}
                    </h3>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {data.percentage}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pages Read</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {data.pagesCompleted}/{data.totalPages}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {data.totalPages > 0
                          ? Math.round((data.pagesCompleted / data.totalPages) * 100)
                          : 0}
                        % complete
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Chapters Mastered</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {data.chaptersCompleted}/{data.totalChapters}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        100% complete (all revisions)
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                      <p className="text-lg font-semibold">
                        {data.percentage >= 100 ? (
                          <span className="text-green-600 dark:text-green-400">✅ Complete</span>
                        ) : data.percentage >= 75 ? (
                          <span className="text-blue-600 dark:text-blue-400">🔥 Almost there!</span>
                        ) : data.percentage >= 50 ? (
                          <span className="text-yellow-600 dark:text-yellow-400">📚 In progress</span>
                        ) : data.percentage >= 25 ? (
                          <span className="text-orange-600 dark:text-orange-400">🌱 Started</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">⏸️ Not started</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500"
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Understanding Progress Calculation
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>Progressive Mastery System:</strong> Each chapter contributes to your overall progress based on reading AND revisions.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Reading (25%):</strong> Complete all pages in a chapter</li>
              <li><strong>Revision 1 (25%):</strong> First review of the material</li>
              <li><strong>Revision 2 (25%):</strong> Second review for reinforcement</li>
              <li><strong>Revision 3 (25%):</strong> Final mastery review</li>
            </ul>
            <p className="mt-3">
              <strong>Example:</strong> A chapter with all pages read but no revisions = 25% complete. 
              With all 3 revisions done = 100% fully mastered! 🎉
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
