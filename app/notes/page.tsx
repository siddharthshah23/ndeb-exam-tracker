'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { getNotes, createNote, deleteNote } from '@/lib/firestoreHelpers';
import { Note } from '@/lib/types';
import { Heart, Plus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          const notesData = await getNotes();
          setNotes(notesData);
        } catch (error) {
          console.error('Error fetching notes:', error);
        } finally {
          setLoadingData(false);
        }
      }
    }
    fetchData();
  }, [user]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !noteText.trim()) return;

    const newNote = {
      text: noteText,
      fromUser: user.uid,
      fromUserName: user.name,
      createdAt: new Date(),
    };

    const noteId = await createNote(newNote);
    setNotes([{ ...newNote, id: noteId }, ...notes]);
    setShowCreateModal(false);
    setNoteText('');
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    setNotes(notes.filter((n) => n.id !== noteId));
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <Heart className="w-8 h-8 mr-3 text-red-500 dark:text-red-400" />
              Motivational Notes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Words of encouragement to keep you going</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Note
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="card text-center text-gray-500 dark:text-gray-400 py-12">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No motivational notes yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="card bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-l-4 border-pink-500 dark:border-pink-400"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 text-pink-500 dark:text-pink-400 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{note.fromUserName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                    </span>
                    {user?.uid === note.fromUser && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">{note.text}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add Motivational Note</h2>
            <form onSubmit={handleCreateNote}>
              <div className="mb-6">
                <label className="label">Your Message</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="input-field"
                  rows={4}
                  required
                  placeholder="Write something encouraging..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNoteText('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

