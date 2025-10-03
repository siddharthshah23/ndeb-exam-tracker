'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { getSubjects, getAllChapters, updateChapter, updateDailyStreak } from '@/lib/firestoreHelpers';
import { Subject, Chapter } from '@/lib/types';
import { BookOpen, ArrowLeft, Check, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function RevisionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [subjectFilters, setSubjectFilters] = useState<{[subjectId: string]: number | undefined}>({});

  const handleSubjectRevisionFilterClick = (subjectId: string, revisionLevel: number | undefined) => {
    setSubjectFilters(prev => ({
      ...prev,
      [subjectId]: revisionLevel
    }));
  };

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

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };


  const handleRevisionClick = async (chapterId: string, currentRevisions: number, revisionNumber: number) => {
    if (!user) return;
    
    // If clicking on a completed revision, undo it (only if it's the last one)
    if (currentRevisions >= revisionNumber) {
      // Can only undo the most recent revision
      if (revisionNumber === currentRevisions) {
        const newRevisions = currentRevisions - 1;
        await updateChapter(chapterId, { revisionsCompleted: newRevisions });
        setChapters((prev) =>
          prev.map((ch) =>
            ch.id === chapterId ? { ...ch, revisionsCompleted: newRevisions } : ch
          )
        );
        
        // Update daily streak for students
        if (user.role === 'student') {
          await updateDailyStreak(user.uid);
        }
      }
    }
    // If clicking on the next available revision, complete it
    else if (currentRevisions === revisionNumber - 1) {
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
      }
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  // Calculate revision statistics based on ALL chapters
  const assignableChapters = chapters.filter(ch => ch.completedPages >= ch.totalPages);
  const totalPossibleRevisions = chapters.length * 3; // All chapters * 3 revisions each
  const totalRevisions = chapters.reduce((sum, ch) => sum + ch.revisionsCompleted, 0); // All chapters
  const revisionProgress = totalPossibleRevisions > 0
    ? Math.round((totalRevisions / totalPossibleRevisions) * 100)
    : 0;

  const chaptersByRevision = {
    rev0: assignableChapters.filter(ch => ch.revisionsCompleted === 0),
    rev1: assignableChapters.filter(ch => ch.revisionsCompleted === 1),
    rev2: assignableChapters.filter(ch => ch.revisionsCompleted === 2),
    rev3: assignableChapters.filter(ch => ch.revisionsCompleted === 3),
  };

  // Group chapters by subject, but only show chapters that are fully read (can have revision tasks)
  const subjectsWithStats = subjects.map(subject => {
    const allSubjectChapters = chapters.filter(ch => ch.subjectId === subject.id);
    // Only include chapters that are fully read (can have revision tasks assigned)
    const subjectChapters = allSubjectChapters.filter(ch => ch.completedPages >= ch.totalPages);
    // Calculate progress based on ALL chapters in this subject
    const subjectRevisions = allSubjectChapters.reduce((sum, ch) => sum + ch.revisionsCompleted, 0);
    const subjectPossibleRevisions = allSubjectChapters.length * 3;
    const subjectProgress = subjectPossibleRevisions > 0 
      ? Math.round((subjectRevisions / subjectPossibleRevisions) * 100) 
      : 0;
    
    const chaptersByRevisionForSubject = {
      rev0: subjectChapters.filter(ch => ch.revisionsCompleted === 0),
      rev1: subjectChapters.filter(ch => ch.revisionsCompleted === 1),
      rev2: subjectChapters.filter(ch => ch.revisionsCompleted === 2),
      rev3: subjectChapters.filter(ch => ch.revisionsCompleted === 3),
    };

    return {
      ...subject,
      chapters: subjectChapters,
      allChapters: allSubjectChapters, // Keep track of all chapters for stats
      totalRevisions: subjectRevisions,
      totalPossibleRevisions: subjectPossibleRevisions,
      progress: subjectProgress,
      chaptersByRevision: chaptersByRevisionForSubject,
      hasAssignableChapters: subjectChapters.length > 0,
    };
  }).filter(subject => subject.hasAssignableChapters) // Only show subjects with assignable chapters
    .sort((a, b) => b.progress - a.progress); // Sort by progress descending

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
            <span>Revision Tasks</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Assign and track revision tasks for fully completed chapters
          </p>
        </div>

        {/* Overall Revision Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Chapters</p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {chapters.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              all chapters
            </p>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
            <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
              {chaptersByRevision.rev3.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              fully mastered
            </p>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
            <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
              {chaptersByRevision.rev1.length + chaptersByRevision.rev2.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              partially done
            </p>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Not Started</p>
            <p className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-400">
              {chaptersByRevision.rev0.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              ready to start
            </p>
          </div>

          <div className="card hover:shadow-lg transition-all p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Progress</p>
            <p className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
              {revisionProgress}%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              overall complete
            </p>
          </div>
        </div>

        {/* Subject-based Revision Breakdown */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
            <span>Available for Revision Tasks</span>
          </h2>
          
          {subjectsWithStats.length === 0 && (
            <div className="card text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Chapters Ready for Revision
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete reading all pages of chapters to unlock revision tasks
              </p>
              <Link 
                href="/subjects"
                className="btn-primary inline-flex items-center"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Go to Subjects
              </Link>
            </div>
          )}
          
          {subjectsWithStats.map((subject, index) => {
            const isExpanded = expandedSubjects.has(subject.id);
            
            return (
              <div key={subject.id} className="card hover:shadow-lg transition-all animate-slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                {/* Subject Header - Always Visible */}
                <div 
                  className="cursor-pointer p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={() => toggleSubject(subject.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">
                        {subject.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{subject.chapters.length} chapters</span>
                        <span>{subject.totalRevisions}/{subject.totalPossibleRevisions} revisions</span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {subject.progress}% complete
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      {/* Progress Circle */}
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200 dark:text-gray-700"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-primary-600 dark:text-primary-400"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${subject.progress}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                            {subject.progress}%
                          </span>
                        </div>
                      </div>
                      {/* Expand/Collapse Icon */}
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
                    {/* Subject-level Revision Filter Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div 
                        className={`text-center p-3 rounded-lg border transition-all cursor-pointer ${
                          subjectFilters[subject.id] === 3 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 ring-2 ring-green-500 dark:ring-green-400' 
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                        }`}
                        onClick={() => handleSubjectRevisionFilterClick(subject.id, 3)}
                      >
                        <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {subject.chaptersByRevision.rev3.length}
                        </div>
                        <div className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
                          Fully Mastered
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          3/3 revisions
                        </div>
                      </div>

                      <div 
                        className={`text-center p-3 rounded-lg border transition-all cursor-pointer ${
                          subjectFilters[subject.id] === 2 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500 dark:ring-blue-400' 
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        }`}
                        onClick={() => handleSubjectRevisionFilterClick(subject.id, 2)}
                      >
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {subject.chaptersByRevision.rev2.length}
                        </div>
                        <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
                          2 Revisions
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          2/3 revisions
                        </div>
                      </div>

                      <div 
                        className={`text-center p-3 rounded-lg border transition-all cursor-pointer ${
                          subjectFilters[subject.id] === 1 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 ring-2 ring-yellow-500 dark:ring-yellow-400' 
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                        }`}
                        onClick={() => handleSubjectRevisionFilterClick(subject.id, 1)}
                      >
                        <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                          {subject.chaptersByRevision.rev1.length}
                        </div>
                        <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                          1 Revision
                        </div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          1/3 revisions
                        </div>
                      </div>

                      <div 
                        className={`text-center p-3 rounded-lg border transition-all cursor-pointer ${
                          subjectFilters[subject.id] === 0 
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 ring-2 ring-orange-500 dark:ring-orange-400' 
                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                        }`}
                        onClick={() => handleSubjectRevisionFilterClick(subject.id, 0)}
                      >
                        <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                          {subject.chaptersByRevision.rev0.length}
                        </div>
                        <div className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 font-medium">
                          Not Started
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          0/3 revisions
                        </div>
                      </div>
                    </div>

                    {/* Chapter List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                          {subjectFilters[subject.id] === undefined ? 'All Chapters' :
                           subjectFilters[subject.id] === 3 ? 'Fully Mastered Chapters' :
                           subjectFilters[subject.id] === 2 ? 'Chapters with 2 Revisions' :
                           subjectFilters[subject.id] === 1 ? 'Chapters with 1 Revision' :
                           subjectFilters[subject.id] === 0 ? 'Chapters Not Started' :
                           'All Chapters'}
                        </h4>
                        {subjectFilters[subject.id] !== undefined && (
                          <button
                            onClick={() => handleSubjectRevisionFilterClick(subject.id, undefined)}
                            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            Clear Filter
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const filteredChapters = subject.chapters.filter((chapter) => {
                            // Apply subject-level filter if selected
                            if (subjectFilters[subject.id] !== undefined) {
                              return chapter.revisionsCompleted === subjectFilters[subject.id];
                            }
                            return true; // Show all chapters if no filter selected
                          });

                          if (filteredChapters.length === 0 && subjectFilters[subject.id] !== undefined) {
                            return (
                              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <span className="text-2xl">🦋</span>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">No Chapters Found</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                  {subjectFilters[subject.id] === 3 ? 'No chapters are fully mastered yet! 📚✨' :
                                   subjectFilters[subject.id] === 2 ? 'No chapters have 2 revisions completed! 📖💫' :
                                   subjectFilters[subject.id] === 1 ? 'No chapters have 1 revision completed! 📝🌟' :
                                   subjectFilters[subject.id] === 0 ? 'All chapters have started their revisions! 🎉✨' :
                                   'No chapters match this filter! 🦋'}
                                </p>
                                <button
                                  onClick={() => handleSubjectRevisionFilterClick(subject.id, undefined)}
                                  className="px-3 py-1 text-xs bg-primary-600 dark:bg-primary-500 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                                >
                                  Show All Chapters
                                </button>
                              </div>
                            );
                          }

                          return filteredChapters.map((chapter) => {
                          const getRevisionColor = (revisions: number) => {
                            if (revisions === 3) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
                            if (revisions === 2) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                            if (revisions === 1) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
                            return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
                          };

                          const nextRevision = chapter.revisionsCompleted + 1;
                          const isFullyMastered = chapter.revisionsCompleted >= 3;
                          
                          return (
                            <div
                              key={chapter.id}
                              className={`p-4 rounded-lg border transition-all ${getRevisionColor(chapter.revisionsCompleted)}`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center mb-1">
                                    {isFullyMastered ? (
                                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 mr-2 flex-shrink-0" />
                                    )}
                                    <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                      {chapter.name}
                                    </h5>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                                    {chapter.completedPages}/{chapter.totalPages} pages completed
                                    {chapter.startPage !== undefined && chapter.endPage !== undefined && (
                                      <span className="text-primary-600 dark:text-primary-400 ml-1">
                                        • Pages {chapter.startPage}-{chapter.endPage}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {!isFullyMastered && (
                                  <div className="ml-4">
                                    <Link
                                      href={`/tasks?type=revision&subject=${subject.id}&chapter=${chapter.id}&revision=${nextRevision}`}
                                      className="text-xs bg-primary-600 dark:bg-primary-500 text-white px-3 py-1 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                                    >
                                      Assign Task
                                    </Link>
                                  </div>
                                )}
                              </div>

                              {/* Revision Status */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Revision Progress: {chapter.revisionsCompleted}/3
                                  </p>
                                  {!isFullyMastered && (
                                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                      Next: Revision {nextRevision}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Revision Buttons */}
                                <div className="flex space-x-2">
                                  {[1, 2, 3].map((rev) => {
                                    const isCompleted = chapter.revisionsCompleted >= rev;
                                    const isNext = chapter.revisionsCompleted === rev - 1;
                                    const isLocked = chapter.revisionsCompleted < rev - 1;
                                    const canUndo = chapter.revisionsCompleted === rev;
                                    
                                    return (
                                      <button
                                        key={rev}
                                        onClick={() => handleRevisionClick(chapter.id, chapter.revisionsCompleted, rev)}
                                        disabled={isLocked}
                                        title={
                                          canUndo ? `Click to undo Rev ${rev}` :
                                          isNext ? `Click to complete Rev ${rev}` :
                                          isCompleted ? 'Complete previous revision first to undo' :
                                          'Complete previous revision first'
                                        }
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                          isCompleted
                                            ? canUndo
                                              ? 'bg-green-500 dark:bg-green-600 text-white hover:bg-yellow-500 dark:hover:bg-yellow-600 hover:scale-105 cursor-pointer'
                                              : 'bg-green-500 dark:bg-green-600 text-white opacity-75 cursor-default'
                                            : isNext
                                            ? 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 hover:scale-105'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        }`}
                                      >
                                        Rev {rev}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        });
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
