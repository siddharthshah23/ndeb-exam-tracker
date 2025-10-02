'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getChaptersBySubject,
  createChapter,
  updateChapter,
  deleteChapter,
} from '@/lib/firestoreHelpers';
import { Subject, Chapter } from '@/lib/types';
import { Settings, Plus, Edit2, Trash2, BookOpen, Save, X } from 'lucide-react';

export default function ManagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Subject modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  
  // Chapter modal
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterName, setChapterName] = useState('');
  const [chapterPages, setChapterPages] = useState('');
  const [chapterStartPage, setChapterStartPage] = useState('');
  const [chapterEndPage, setChapterEndPage] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'partner') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      if (user && user.role === 'partner') {
        try {
          const subjectsData = await getSubjects();
          setSubjects(subjectsData);
        } catch (error) {
          console.error('Error fetching data:', error);
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

  const handleCreateSubject = async () => {
    if (!subjectName.trim()) return;
    const subjectId = await createSubject(subjectName, 0);
    const newSubject: Subject = {
      id: subjectId,
      name: subjectName,
      totalChapters: 0,
      createdAt: new Date(),
    };
    setSubjects([...subjects, newSubject]);
    setShowSubjectModal(false);
    setSubjectName('');
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject || !subjectName.trim()) return;
    await updateSubject(editingSubject.id, { name: subjectName });
    setSubjects(subjects.map(s => s.id === editingSubject.id ? { ...s, name: subjectName } : s));
    setShowSubjectModal(false);
    setEditingSubject(null);
    setSubjectName('');
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure? This will delete all chapters in this subject.')) return;
    await deleteSubject(subjectId);
    setSubjects(subjects.filter(s => s.id !== subjectId));
    if (selectedSubject === subjectId) {
      setSelectedSubject(null);
      setChapters([]);
    }
  };

  const handleCreateChapter = async () => {
    if (!chapterName.trim() || !selectedSubject) return;
    
    const startPage = parseInt(chapterStartPage) || undefined;
    const endPage = parseInt(chapterEndPage) || undefined;
    const totalPages = startPage && endPage ? endPage - startPage + 1 : parseInt(chapterPages) || 0;
    
    const newChapter: Omit<Chapter, 'id'> = {
      subjectId: selectedSubject,
      name: chapterName,
      totalPages,
      completedPages: 0,
      revisionsCompleted: 0,
      startPage,
      endPage,
    };
    const chapterId = await createChapter(newChapter);
    setChapters([...chapters, { ...newChapter, id: chapterId }]);
    
    // Update subject totalChapters
    const subject = subjects.find(s => s.id === selectedSubject);
    if (subject) {
      await updateSubject(selectedSubject, { totalChapters: subject.totalChapters + 1 });
      setSubjects(subjects.map(s => s.id === selectedSubject ? { ...s, totalChapters: s.totalChapters + 1 } : s));
    }
    
    setShowChapterModal(false);
    setChapterName('');
    setChapterPages('');
    setChapterStartPage('');
    setChapterEndPage('');
  };

  const handleUpdateChapter = async () => {
    if (!editingChapter || !chapterName.trim()) return;
    
    const startPage = parseInt(chapterStartPage) || undefined;
    const endPage = parseInt(chapterEndPage) || undefined;
    const totalPages = startPage && endPage ? endPage - startPage + 1 : parseInt(chapterPages) || 0;
    
    await updateChapter(editingChapter.id, {
      name: chapterName,
      totalPages,
      startPage,
      endPage,
    });
    setChapters(chapters.map(c => 
      c.id === editingChapter.id 
        ? { ...c, name: chapterName, totalPages, startPage, endPage }
        : c
    ));
    setShowChapterModal(false);
    setEditingChapter(null);
    setChapterName('');
    setChapterPages('');
    setChapterStartPage('');
    setChapterEndPage('');
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    await deleteChapter(chapterId);
    setChapters(chapters.filter(c => c.id !== chapterId));
    
    // Update subject totalChapters
    if (selectedSubject) {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (subject) {
        await updateSubject(selectedSubject, { totalChapters: Math.max(0, subject.totalChapters - 1) });
        setSubjects(subjects.map(s => s.id === selectedSubject ? { ...s, totalChapters: Math.max(0, s.totalChapters - 1) } : s));
      }
    }
  };

  if (loading || loadingData || user?.role !== 'partner') {
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
            <Settings className="w-8 h-8 mr-3 text-primary-600" />
            Manage Subjects & Chapters
          </h1>
          <p className="text-gray-600">Add, edit, or delete subjects and chapters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subjects Panel */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Subjects</h2>
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectName('');
                  setShowSubjectModal(true);
                }}
                className="btn-primary flex items-center text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </button>
            </div>

            <div className="space-y-2">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSubject === subject.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setSelectedSubject(subject.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-600">{subject.totalChapters} chapters</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubject(subject);
                          setSubjectName(subject.name);
                          setShowSubjectModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapters Panel */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedSubject ? subjects.find(s => s.id === selectedSubject)?.name : 'Select a Subject'}
              </h2>
              {selectedSubject && (
                <button
                  onClick={() => {
                    setEditingChapter(null);
                    setChapterName('');
                    setChapterPages('');
                    setChapterStartPage('');
                    setChapterEndPage('');
                    setShowChapterModal(true);
                  }}
                  className="btn-primary flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Chapter
                </button>
              )}
            </div>

            {!selectedSubject ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a subject to manage its chapters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{chapter.name}</h3>
                        <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                          {chapter.startPage && chapter.endPage ? (
                            <span>📖 Pages {chapter.startPage}-{chapter.endPage} ({chapter.totalPages} pages)</span>
                          ) : (
                            <span>{chapter.totalPages} pages</span>
                          )}
                          <span>{chapter.completedPages} completed</span>
                          <span>{chapter.revisionsCompleted} revisions</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingChapter(chapter);
                            setChapterName(chapter.name);
                            setChapterPages(chapter.totalPages.toString());
                            setChapterStartPage(chapter.startPage?.toString() || '');
                            setChapterEndPage(chapter.endPage?.toString() || '');
                            setShowChapterModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingSubject ? 'Edit Subject' : 'Add Subject'}
            </h2>
            <div className="mb-4">
              <label className="label">Subject Name</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="input-field"
                placeholder="e.g., Pharmacology"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSubjectModal(false);
                  setEditingSubject(null);
                  setSubjectName('');
                }}
                className="flex-1 btn-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={editingSubject ? handleUpdateSubject : handleCreateSubject}
                className="flex-1 btn-primary flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingSubject ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingChapter ? 'Edit Chapter' : 'Add Chapter'}
            </h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="label">Chapter Name</label>
                <input
                  type="text"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., General Principles"
                />
              </div>
              <div>
                <label className="label">Total Pages (auto-calculated from page range if provided)</label>
                <input
                  type="number"
                  value={chapterPages}
                  onChange={(e) => setChapterPages(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 45"
                  min="0"
                  disabled={!!(chapterStartPage && chapterEndPage)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Page (optional)</label>
                  <input
                    type="number"
                    value={chapterStartPage}
                    onChange={(e) => setChapterStartPage(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 6"
                    min="1"
                  />
                </div>
                <div>
                  <label className="label">End Page (optional)</label>
                  <input
                    type="number"
                    value={chapterEndPage}
                    onChange={(e) => setChapterEndPage(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 18"
                    min="1"
                  />
                </div>
              </div>
              {chapterStartPage && chapterEndPage && (
                <p className="text-sm text-gray-600">
                  Page range: {chapterStartPage}-{chapterEndPage} = {parseInt(chapterEndPage) - parseInt(chapterStartPage) + 1} pages
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowChapterModal(false);
                  setEditingChapter(null);
                  setChapterName('');
                  setChapterPages('');
                  setChapterStartPage('');
                  setChapterEndPage('');
                }}
                className="flex-1 btn-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={editingChapter ? handleUpdateChapter : handleCreateChapter}
                className="flex-1 btn-primary flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingChapter ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

