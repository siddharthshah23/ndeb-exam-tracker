'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { getSubjects, calculateProgress } from '@/lib/firestoreHelpers';
import { Subject, ProgressStats } from '@/lib/types';
import { BookMarked, ChevronRight } from 'lucide-react';

export default function SubjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
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
          const [subjectsData, progressData] = await Promise.all([
            getSubjects(),
            calculateProgress(user.uid),
          ]);
          setSubjects(subjectsData);
          setProgress(progressData);
        } catch (error) {
          console.error('Error fetching subjects:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <BookMarked className="w-8 h-8 mr-3 text-primary-600" />
            Subjects
          </h1>
          <p className="text-gray-600">Track your progress across all subjects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const subjectProgress = progress?.subjectProgress[subject.id];
            return (
              <Link key={subject.id} href={`/subjects/${subject.id}`}>
                <div className="card hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {subject.totalChapters} chapters
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {subjectProgress && (
                    <>
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium text-gray-900">
                            {subjectProgress.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${subjectProgress.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Chapters: {subjectProgress.chaptersCompleted}/{subjectProgress.totalChapters}
                        </span>
                        <span className="text-gray-600">
                          Pages: {subjectProgress.pagesCompleted}/{subjectProgress.totalPages}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

