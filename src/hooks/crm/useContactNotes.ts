import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type { ContactNoteCreate, PaginatedResponse, ContactNoteResponse } from '../../types';

/** Default page size — covers virtually all contacts; consumers needing
 * real pagination can call the API directly.
 */
const DEFAULT_PER_PAGE = 100;

/**
 * Custom hook for managing contact notes.
 * Uses React Query for caching, deduplication, and automatic invalidation.
 * Exposes `notes` as an array for backward-compatibility; pagination
 * metadata is available via `pagination`.
 */
export function useContactNotes(contactId: string | undefined) {
  const queryClient = useQueryClient();

  // Notes list query (paginated; unwrap items for the main return)
  const notesQuery = useQuery({
    queryKey: queryKeys.contactNotes.byContact(contactId!),
    queryFn: () => contactsAPI.getNotes(contactId!, { per_page: DEFAULT_PER_PAGE }),
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
    return notesQuery.data?.items ?? [];
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

  const paginated = notesQuery.data as PaginatedResponse<ContactNoteResponse> | undefined;
  return {
    notes: paginated?.items ?? [],
    pagination: paginated
      ? {
          total: paginated.total,
          page: paginated.page,
          per_page: paginated.per_page,
          total_pages: paginated.total_pages,
          has_next: paginated.has_next,
          has_prev: paginated.has_prev,
        }
      : null,
    loading: notesQuery.isLoading,
    error: notesQuery.error?.message || null,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
