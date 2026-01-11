import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useContactNotes } from '../../hooks/crm';

const NotesSection = ({ contactId }) => {
  const { notes, loading, fetchNotes, createNote, updateNote, deleteNote } = useContactNotes(contactId);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch notes on mount
  useEffect(() => {
    if (contactId) {
      fetchNotes();
    }
  }, [contactId, fetchNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      setSubmitting(true);

      if (editingNoteId) {
        await updateNote(editingNoteId, formData);
      } else {
        await createNote(formData);
      }

      // Reset form
      setFormData({ title: '', content: '' });
      setIsAddingNote(false);
      setEditingNoteId(null);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (note) => {
    setFormData({ title: note.title, content: note.content });
    setEditingNoteId(note.id);
    setIsAddingNote(true);
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', content: '' });
    setIsAddingNote(false);
    setEditingNoteId(null);
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notes</h3>
        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-zenible-primary hover:bg-purple-50 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Note
          </button>
        )}
      </div>

      {/* Add/Edit Note Form */}
      {isAddingNote && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <label htmlFor="note-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="note-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Note title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="note-content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="note-content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your note here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={submitting}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : editingNoteId ? 'Update Note' : 'Add Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-sm">No notes yet</p>
          <p className="text-gray-400 text-xs mt-1">Click "Add Note" to create your first note</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-medium text-gray-900 flex-1">{note.title}</h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(note)}
                    className="p-1.5 text-gray-400 hover:text-zenible-primary hover:bg-purple-50 rounded transition-colors"
                    title="Edit note"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete note"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
              {note.created_at && (
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(note.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesSection;
