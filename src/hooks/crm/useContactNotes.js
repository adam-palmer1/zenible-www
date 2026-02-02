import { useState, useCallback } from 'react';
import { contactsAPI } from '../../services/api/crm';

/**
 * Custom hook for managing contact notes
 * Handles loading, creating, updating, and deleting notes
 *
 * @param {string} contactId - The contact ID
 * @returns {Object} Notes state and methods
 */
export function useContactNotes(contactId) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notes for contact
  const fetchNotes = useCallback(async () => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await contactsAPI.getNotes(contactId);
      setNotes(response || []);

      return response;
    } catch (err) {
      console.error('[useContactNotes] Failed to fetch notes:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Create note
  const createNote = useCallback(async (data) => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      const newNote = await contactsAPI.createNote(contactId, data);

      // Add to local state
      setNotes((prev) => [newNote, ...prev]);

      return newNote;
    } catch (err) {
      console.error('[useContactNotes] Failed to create note:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Update note
  const updateNote = useCallback(async (noteId, data) => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      const updatedNote = await contactsAPI.updateNote(contactId, noteId, data);

      // Update in local state
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? updatedNote : n))
      );

      return updatedNote;
    } catch (err) {
      console.error('[useContactNotes] Failed to update note:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Delete note
  const deleteNote = useCallback(async (noteId) => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      await contactsAPI.deleteNote(contactId, noteId);

      // Remove from local state
      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      return true;
    } catch (err) {
      console.error('[useContactNotes] Failed to delete note:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
