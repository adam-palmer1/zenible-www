import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type { ContactNoteCreate } from '../../types';

/**
 * Custom hook for managing contact notes
 * Uses React Query for caching, deduplication, and automatic invalidation
 */
export function useContactNotes(contactId: string | undefined) {
  const queryClient = useQueryClient();

  // Notes list query
  const notesQuery = useQuery({
    queryKey: queryKeys.contactNotes.byContact(contactId!),
    queryFn: () => contactsAPI.getNotes(contactId!),
    enabled: !!contactId,
  });

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: (data: ContactNoteCreate) => contactsAPI.createNote(contactId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contactNotes.byContact(contactId!) });
    },
  });

  // Update note mutation
  const updateMutation = useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: Record<string, unknown> }) =>
      contactsAPI.updateNote(contactId!, noteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contactNotes.byContact(contactId!) });
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => contactsAPI.deleteNote(contactId!, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contactNotes.byContact(contactId!) });
    },
  });

  // Backwards-compatible wrapper functions
  const fetchNotes = useCallback(async (): Promise<unknown> => {
    if (!contactId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.contactNotes.byContact(contactId) });
    return notesQuery.data;
  }, [queryClient, contactId, notesQuery.data]);

  const createNote = useCallback(async (data: ContactNoteCreate): Promise<unknown> => {
    if (!contactId) return;
    return createMutation.mutateAsync(data);
  }, [contactId, createMutation]);

  const updateNote = useCallback(async (noteId: string, data: Record<string, unknown>): Promise<unknown> => {
    if (!contactId) return;
    return updateMutation.mutateAsync({ noteId, data });
  }, [contactId, updateMutation]);

  const deleteNote = useCallback(async (noteId: string): Promise<boolean | undefined> => {
    if (!contactId) return;
    await deleteMutation.mutateAsync(noteId);
    return true;
  }, [contactId, deleteMutation]);

  return {
    notes: (notesQuery.data as unknown[]) || [],
    loading: notesQuery.isLoading,
    error: notesQuery.error?.message || null,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
