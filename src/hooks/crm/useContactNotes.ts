import { useState, useCallback } from 'react';
import { contactsAPI } from '../../services/api/crm';

/**
 * Custom hook for managing contact notes
 * Handles loading, creating, updating, and deleting notes
 */
export function useContactNotes(contactId: string | undefined) {
  const [notes, setNotes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes for contact
  const fetchNotes = useCallback(async (): Promise<unknown> => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await contactsAPI.getNotes(contactId);
      setNotes((response as unknown[]) || []);

      return response;
    } catch (err: unknown) {
      console.error('[useContactNotes] Failed to fetch notes:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Create note
  const createNote = useCallback(async (data: any): Promise<unknown> => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      const newNote = await contactsAPI.createNote(contactId, data);

      // Add to local state
      setNotes((prev) => [newNote, ...prev]);

      return newNote;
    } catch (err: unknown) {
      console.error('[useContactNotes] Failed to create note:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Update note
  const updateNote = useCallback(async (noteId: string, data: Record<string, unknown>): Promise<unknown> => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      const updatedNote = await contactsAPI.updateNote(contactId, noteId, data);

      // Update in local state
      setNotes((prev) =>
        prev.map((n: unknown) => ((n as Record<string, unknown>).id === noteId ? updatedNote : n))
      );

      return updatedNote;
    } catch (err: unknown) {
      console.error('[useContactNotes] Failed to update note:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Delete note
  const deleteNote = useCallback(async (noteId: string): Promise<boolean | undefined> => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      await contactsAPI.deleteNote(contactId, noteId);

      // Remove from local state
      setNotes((prev) => prev.filter((n: unknown) => (n as Record<string, unknown>).id !== noteId));

      return true;
    } catch (err: unknown) {
      console.error('[useContactNotes] Failed to delete note:', err);
      setError((err as Error).message);
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
