import { useState, useCallback } from 'react';
import billableHoursAPI from '../../services/api/crm/billableHours';

interface BillableHoursSummary {
  total: number;
  total_hours: number;
  total_amount: number;
  uninvoiced_hours: number;
  uninvoiced_amount: number;
}

/**
 * Custom hook for managing billable hours for a project
 */
export function useBillableHours(projectId: string | undefined) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BillableHoursSummary>({
    total: 0,
    total_hours: 0,
    total_amount: 0,
    uninvoiced_hours: 0,
    uninvoiced_amount: 0,
  });

  /**
   * Fetch billable hour entries with optional filters
   */
  const fetchEntries = useCallback(async (filters: Record<string, unknown> = {}): Promise<unknown> => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await billableHoursAPI.list(projectId, filters) as any;

      setEntries(response.items || []);
      // Parse all values to numbers to avoid mixing strings and numbers in arithmetic
      setSummary({
        total: response.total || 0,
        total_hours: parseFloat(response.total_hours) || 0,
        total_amount: parseFloat(response.total_amount) || 0,
        uninvoiced_hours: parseFloat(response.uninvoiced_hours) || 0,
        uninvoiced_amount: parseFloat(response.uninvoiced_amount) || 0,
      });

      return response;
    } catch (err: unknown) {
      console.error('[useBillableHours] Failed to fetch entries:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * Create a new billable hour entry
   */
  const createEntry = useCallback(async (data: Record<string, unknown>): Promise<unknown> => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      setError(null);
      const newEntry = await billableHoursAPI.create(projectId, data) as any;

      // Add to local state
      setEntries(prev => [newEntry, ...prev]);

      // Update summary - ensure all values are numbers to avoid string concatenation
      const hoursToAdd = parseFloat(newEntry.hours) || 0;
      const amountToAdd = parseFloat(newEntry.amount) || 0;
      setSummary(prev => ({
        ...prev,
        total: prev.total + 1,
        total_hours: (parseFloat(prev.total_hours as unknown as string) || 0) + hoursToAdd,
        total_amount: (parseFloat(prev.total_amount as unknown as string) || 0) + amountToAdd,
        uninvoiced_hours: newEntry.invoice_id
          ? (parseFloat(prev.uninvoiced_hours as unknown as string) || 0)
          : (parseFloat(prev.uninvoiced_hours as unknown as string) || 0) + hoursToAdd,
        uninvoiced_amount: newEntry.invoice_id
          ? (parseFloat(prev.uninvoiced_amount as unknown as string) || 0)
          : (parseFloat(prev.uninvoiced_amount as unknown as string) || 0) + amountToAdd,
      }));

      return newEntry;
    } catch (err: unknown) {
      console.error('[useBillableHours] Failed to create entry:', err);
      setError((err as Error).message);
      throw err;
    }
  }, [projectId]);

  /**
   * Update a billable hour entry
   */
  const updateEntry = useCallback(async (entryId: string, data: Record<string, unknown>): Promise<unknown> => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      setError(null);
      const updatedEntry = await billableHoursAPI.update(projectId, entryId, data) as any;

      // Update in local state
      setEntries(prev => prev.map((entry: any) =>
        entry.id === entryId ? updatedEntry : entry
      ));

      // Refetch to get accurate summary
      await fetchEntries();

      return updatedEntry;
    } catch (err: unknown) {
      console.error('[useBillableHours] Failed to update entry:', err);
      setError((err as Error).message);
      throw err;
    }
  }, [projectId, fetchEntries]);

  /**
   * Delete a billable hour entry
   */
  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      setError(null);

      // Find entry for summary update
      const entry = entries.find((e: any) => e.id === entryId) as any;

      await billableHoursAPI.delete(projectId, entryId);

      // Remove from local state
      setEntries(prev => prev.filter((e: any) => e.id !== entryId));

      // Update summary - ensure all values are numbers to avoid string concatenation
      if (entry) {
        const hoursToRemove = parseFloat(entry.hours) || 0;
        const amountToRemove = parseFloat(entry.amount) || 0;
        setSummary(prev => ({
          ...prev,
          total: prev.total - 1,
          total_hours: (parseFloat(prev.total_hours as unknown as string) || 0) - hoursToRemove,
          total_amount: (parseFloat(prev.total_amount as unknown as string) || 0) - amountToRemove,
          uninvoiced_hours: entry.invoice_id
            ? (parseFloat(prev.uninvoiced_hours as unknown as string) || 0)
            : (parseFloat(prev.uninvoiced_hours as unknown as string) || 0) - hoursToRemove,
          uninvoiced_amount: entry.invoice_id
            ? (parseFloat(prev.uninvoiced_amount as unknown as string) || 0)
            : (parseFloat(prev.uninvoiced_amount as unknown as string) || 0) - amountToRemove,
        }));
      }

      return true;
    } catch (err: unknown) {
      console.error('[useBillableHours] Failed to delete entry:', err);
      setError((err as Error).message);
      throw err;
    }
  }, [projectId, entries]);

  /**
   * Link entry to an invoice
   */
  const linkToInvoice = useCallback(async (entryId: string, invoiceId: string): Promise<unknown> => {
    return updateEntry(entryId, { invoice_id: invoiceId });
  }, [updateEntry]);

  /**
   * Unlink entry from invoice
   */
  const unlinkFromInvoice = useCallback(async (entryId: string): Promise<unknown> => {
    return updateEntry(entryId, { invoice_id: null });
  }, [updateEntry]);

  /**
   * Duplicate an entry (creates new entry with same data)
   */
  const duplicateEntry = useCallback(async (entryId: string): Promise<unknown> => {
    const entry = entries.find((e: any) => e.id === entryId) as any;
    if (!entry) throw new Error('Entry not found');

    // Create new entry with same data (without id, invoice_id, created_at, etc.)
    const newData = {
      hours: entry.hours,
      description: entry.description,
      notes: entry.notes,
      start_time: entry.start_time,
      end_time: entry.end_time,
      is_billable: entry.is_billable,
      hourly_rate: entry.hourly_rate,
      currency_id: entry.currency_id,
    };

    return createEntry(newData);
  }, [entries, createEntry]);

  return {
    entries,
    loading,
    error,
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
