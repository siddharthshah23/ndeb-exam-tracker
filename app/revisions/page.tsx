'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { getSubjects, getAllChapters } from '@/lib/firestoreHelpers';
import { Subject, Chapter } from '@/lib/types';
import { BookOpen, ArrowLeft, Check, Circle } from 'lucide-react';
import Link from 'next/link';

export default function RevisionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
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
          const [subjectsData, chaptersData] = await Promise.all([
            getSubjects(),
            getAllChapters(),
          ]);
          setSubjects(subjectsData);
          setChapters(chaptersData);
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

  // Calculate revision statistics
  const totalChapters = chapters.length;
  const totalPossibleRevisions = totalChapters * 3;
  const totalRevisions = chapters.reduce((sum, ch) => sum + ch.revisionsCompleted, 0);
  const revisionProgress = totalPossibleRevisions > 0
    ? Math.round((totalRevisions / totalPossibleRevisions) * 100)
    : 0;

  const chaptersByRevision = {
    rev0: chapters.filter(ch => ch.revisionsCompleted === 0),
    rev1: chapters.filter(ch => ch.revisionsCompleted === 1),
    rev2: chapters.filter(ch => ch.revisionsCompleted === 2),
    rev3: chapters.filter(ch => ch.revisionsCompleted === 3),
  };

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
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            <span>Revision Progress</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Track your revision cycles across all chapters
          </p>
        </div>

        {/* Overall Revision Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revisions</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {totalRevisions}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              of {totalPossibleRevisions}
            </p>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Progress</p>
            <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
              {revisionProgress}%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              complete
            </p>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Fully Mastered</p>
            <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
              {chaptersByRevision.rev3.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              3/3 revisions
            </p>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Not Started</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-600 dark:text-gray-400">
              {chaptersByRevision.rev0.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              0 revisions
            </p>
          </div>
        </div>

        {/* Revision Breakdown by Level */}
        <div className="space-y-4 sm:space-y-6">
          {/* Revision 3 - Fully Mastered */}
          <div className="card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Fully Mastered ({chaptersByRevision.rev3.length})</span>
              </h2>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">3/3 revisions</span>
            </div>
            {chaptersByRevision.rev3.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {chaptersByRevision.rev3.map((chapter) => {
                  const subject = subjects.find(s => s.id === chapter.subjectId);
                  return (
                    <div
                      key={chapter.id}
                      className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1 truncate">
                        {chapter.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {subject?.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No chapters fully mastered yet. Keep going! 💪
              </p>
            )}
          </div>

          {/* Revision 2 - In Progress */}
          <div className="card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>2 Revisions Done ({chaptersByRevision.rev2.length})</span>
              </h2>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">2/3 revisions</span>
            </div>
            {chaptersByRevision.rev2.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {chaptersByRevision.rev2.map((chapter) => {
                  const subject = subjects.find(s => s.id === chapter.subjectId);
                  return (
                    <div
                      key={chapter.id}
                      className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1 truncate">
                        {chapter.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {subject?.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No chapters at this level
              </p>
            )}
          </div>

          {/* Revision 1 - Started */}
          <div className="card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>1 Revision Done ({chaptersByRevision.rev1.length})</span>
              </h2>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">1/3 revisions</span>
            </div>
            {chaptersByRevision.rev1.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {chaptersByRevision.rev1.map((chapter) => {
                  const subject = subjects.find(s => s.id === chapter.subjectId);
                  return (
                    <div
                      key={chapter.id}
                      className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1 truncate">
                        {chapter.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {subject?.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No chapters at this level
              </p>
            )}
          </div>

          {/* Revision 0 - Not Started */}
          <div className="card hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>No Revisions ({chaptersByRevision.rev0.length})</span>
              </h2>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">0/3 revisions</span>
            </div>
            {chaptersByRevision.rev0.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {chaptersByRevision.rev0.map((chapter) => {
                  const subject = subjects.find(s => s.id === chapter.subjectId);
                  return (
                    <div
                      key={chapter.id}
                      className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1 truncate">
                        {chapter.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {subject?.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Great! All chapters have at least one revision! 🎉
              </p>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 sm:mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>About Revisions</span>
          </h3>
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
            Revisions are crucial for long-term retention. Each revision cycle helps reinforce what you've learned.
            Complete all 3 revisions to fully master each chapter!
          </p>
        </div>
      </main>
    </div>
  );
}
