import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import billableHoursAPI from '../../services/api/crm/billableHours';
import { queryKeys } from '../../lib/query-keys';

interface BillableHourEntry {
  id: string;
  project_id: string;
  hours: string;
  description?: string | null;
  notes?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_billable: boolean;
  hourly_rate?: string | null;
  currency_id?: string | null;
  invoice_id?: string | null;
  contact_service_id?: string | null;
  amount?: string | null;
  contact_service?: { id: string; name: string } | null;
  created_at: string;
  updated_at: string | null;
}

interface BillableHourListResponse {
  items: BillableHourEntry[];
  total: number;
  total_hours: string;
  total_amount: string;
  uninvoiced_hours: string;
  uninvoiced_amount: string;
}

interface BillableHoursSummary {
  total: number;
  total_hours: number;
  total_amount: number;
  uninvoiced_hours: number;
  uninvoiced_amount: number;
}

/**
 * Custom hook for managing billable hours for a project
 * Uses React Query for caching, deduplication, and automatic invalidation
 */
export function useBillableHours(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const projectQueryKey = queryKeys.billableHours.byProject(projectId!);

  // Billable hours query
  const entriesQuery = useQuery({
    queryKey: projectQueryKey,
    queryFn: async () => {
      const response = await billableHoursAPI.list(projectId!, {}) as BillableHourListResponse;
      return response;
    },
    enabled: !!projectId,
  });

  const entries = entriesQuery.data?.items || [];
  const summary: BillableHoursSummary = entriesQuery.data ? {
    total: entriesQuery.data.total || 0,
    total_hours: parseFloat(entriesQuery.data.total_hours) || 0,
    total_amount: parseFloat(entriesQuery.data.total_amount) || 0,
    uninvoiced_hours: parseFloat(entriesQuery.data.uninvoiced_hours) || 0,
    uninvoiced_amount: parseFloat(entriesQuery.data.uninvoiced_amount) || 0,
  } : { total: 0, total_hours: 0, total_amount: 0, uninvoiced_hours: 0, uninvoiced_amount: 0 };

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (!projectId) throw new Error('Project ID is required');
      return billableHoursAPI.create(projectId, data) as Promise<BillableHourEntry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
    },
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: Record<string, unknown> }) => {
      if (!projectId) throw new Error('Project ID is required');
      return billableHoursAPI.update(projectId, entryId, data) as Promise<BillableHourEntry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => {
      if (!projectId) throw new Error('Project ID is required');
      return billableHoursAPI.delete(projectId, entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
    },
  });

  // Backwards-compatible wrapper functions
  const fetchEntries = useCallback(async (filters: Record<string, unknown> = {}): Promise<unknown> => {
    if (!projectId) return;
    if (Object.keys(filters).length > 0) {
      // If specific filters provided, do a direct API call and return
      return billableHoursAPI.list(projectId, filters) as Promise<BillableHourListResponse>;
    }
    await queryClient.invalidateQueries({ queryKey: projectQueryKey });
    return entriesQuery.data;
  }, [projectId, queryClient, projectQueryKey, entriesQuery.data]);

  const createEntry = useCallback(async (data: Record<string, unknown>): Promise<unknown> => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateEntry = useCallback(async (entryId: string, data: Record<string, unknown>): Promise<unknown> => {
    return updateMutation.mutateAsync({ entryId, data });
  }, [updateMutation]);

  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    await deleteMutation.mutateAsync(entryId);
    return true;
  }, [deleteMutation]);

  const linkToInvoice = useCallback(async (entryId: string, invoiceId: string): Promise<unknown> => {
    return updateEntry(entryId, { invoice_id: invoiceId });
  }, [updateEntry]);

  const unlinkFromInvoice = useCallback(async (entryId: string): Promise<unknown> => {
    return updateEntry(entryId, { invoice_id: null });
  }, [updateEntry]);

  const duplicateEntry = useCallback(async (entryId: string): Promise<unknown> => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) throw new Error('Entry not found');

    const newData = {
      hours: entry.hours,
      description: entry.description,
      notes: entry.notes,
      start_time: entry.start_time,
      end_time: entry.end_time,
      is_billable: entry.is_billable,
      hourly_rate: entry.hourly_rate,
      currency_id: entry.currency_id,
      contact_service_id: entry.contact_service_id,
    };

    return createEntry(newData);
  }, [entries, createEntry]);

  return {
    entries,
    loading: entriesQuery.isLoading,
    error: entriesQuery.error?.message || null,
    summary,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    linkToInvoice,
    unlinkFromInvoice,
    duplicateEntry,
  };
}

export default useBillableHours;
