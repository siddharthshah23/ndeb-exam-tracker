'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import FloatingBackground from '@/components/FloatingBackground';
import Confetti from '@/components/Confetti';
import { getSubjects, getChaptersBySubject, updateChapter, updateDailyStreak } from '@/lib/firestoreHelpers';
import { Subject, Chapter } from '@/lib/types';
import { BookOpen, ArrowLeft, CheckCircle, Circle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SubjectDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      if (user && subjectId) {
        try {
          const subjects = await getSubjects();
          const foundSubject = subjects.find((s) => s.id === subjectId);
          setSubject(foundSubject || null);

          const chaptersData = await getChaptersBySubject(subjectId);
          setChapters(chaptersData);
        } catch (error) {
          console.error('Error fetching subject details:', error);
        } finally {
          setLoadingData(false);
        }
      }
    }
    fetchData();
  }, [user, subjectId]);

  const handleRevisionClick = async (chapterId: string, currentRevisions: number) => {
    if (currentRevisions < 3 && user) {
      const newRevisions = currentRevisions + 1;
      await updateChapter(chapterId, { revisionsCompleted: newRevisions });
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === chapterId ? { ...ch, revisionsCompleted: newRevisions } : ch
        )
      );
      
      // Update daily streak for students
      if (user.role === 'student') {
        await updateDailyStreak(user.uid);
        
        // Trigger confetti when completing revision 3
        if (newRevisions === 3) {
          setShowConfetti(true);
        }
      }
    }
  };

  const handlePageUpdate = async (chapterId: string, completedPages: number, totalPages: number) => {
    const newCompleted = Math.min(completedPages, totalPages);
    await updateChapter(chapterId, { completedPages: newCompleted });
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, completedPages: newCompleted } : ch))
    );
    
    // Update daily streak for students
    if (user && user.role === 'student') {
      await updateDailyStreak(user.uid);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-900 dark:text-gray-100">Subject not found</p>
        </main>
      </div>
    );
  }

  const totalCompleted = chapters.reduce((sum, ch) => sum + ch.completedPages, 0);
  const totalPages = chapters.reduce((sum, ch) => sum + ch.totalPages, 0);
  const overallProgress = totalPages > 0 ? Math.round((totalCompleted / totalPages) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
      <Navbar />
      {/* Floating Background - Only for Students */}
      {user?.role === 'student' && (
        <FloatingBackground density="low" progressPercentage={overallProgress} />
      )}
      {/* Confetti Effect for Students */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Link
          href="/subjects"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Subjects
        </Link>

        <div className="mb-8 animate-slide-in-up">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            <BookOpen className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
            {subject.name}
            {user?.role === 'student' && overallProgress >= 50 && (
              <Sparkles className="w-6 h-6 ml-2 text-pink-500 dark:text-pink-400 animate-pulse" />
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {chapters.length} chapters
            {user?.role === 'student' && overallProgress > 0 && (
              <span className="ml-2 text-sm font-medium text-pink-500 dark:text-pink-400">
                • {overallProgress}% complete {overallProgress >= 100 ? '🎉' : overallProgress >= 75 ? '⭐' : overallProgress >= 50 ? '🌟' : '🌱'}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {chapters.map((chapter) => {
            const progressPercentage =
              chapter.totalPages > 0
                ? Math.round((chapter.completedPages / chapter.totalPages) * 100)
                : 0;
            const isCompleted = chapter.completedPages >= chapter.totalPages;

            return (
              <div key={chapter.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 mr-2" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{chapter.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                      {chapter.completedPages}/{chapter.totalPages} pages
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Revision Tracking */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Revisions: {chapter.revisionsCompleted}/3
                  </p>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((rev) => (
                      <button
                        key={rev}
                        onClick={() => handleRevisionClick(chapter.id, chapter.revisionsCompleted)}
                        disabled={chapter.revisionsCompleted < rev - 1}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          chapter.revisionsCompleted >= rev
                            ? 'bg-green-500 dark:bg-green-600 text-white'
                            : chapter.revisionsCompleted === rev - 1
                            ? 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Rev {rev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Counter */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() =>
                      handlePageUpdate(chapter.id, chapter.completedPages - 10, chapter.totalPages)
                    }
                    disabled={chapter.completedPages === 0}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    -10
                  </button>
                  <button
                    onClick={() =>
                      handlePageUpdate(chapter.id, chapter.completedPages - 1, chapter.totalPages)
                    }
                    disabled={chapter.completedPages === 0}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    -1
                  </button>
                  <span className="px-4 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md text-sm font-medium">
                    {chapter.completedPages} pages
                  </span>
                  <button
                    onClick={() =>
                      handlePageUpdate(chapter.id, chapter.completedPages + 1, chapter.totalPages)
                    }
                    disabled={chapter.completedPages >= chapter.totalPages}
                    className="px-3 py-1 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    +1
                  </button>
                  <button
                    onClick={() =>
                      handlePageUpdate(chapter.id, chapter.completedPages + 10, chapter.totalPages)
                    }
                    disabled={chapter.completedPages >= chapter.totalPages}
                    className="px-3 py-1 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    +10
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

