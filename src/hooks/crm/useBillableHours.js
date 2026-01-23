import { useState, useCallback } from 'react';
import billableHoursAPI from '../../services/api/crm/billableHours';

/**
 * Custom hook for managing billable hours for a project
 * @param {string} projectId - Project UUID
 * @returns {Object} Billable hours state and methods
 */
export function useBillableHours(projectId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    total_hours: 0,
    total_amount: 0,
    uninvoiced_hours: 0,
    uninvoiced_amount: 0,
  });

  /**
   * Fetch billable hour entries with optional filters
   * @param {Object} filters - Optional filters
   * @param {boolean} filters.is_billable - Filter by billable status
   * @param {string} filters.invoice_id - Filter by linked invoice
   * @param {boolean} filters.uninvoiced_only - Show only uninvoiced entries
   * @param {string} filters.start_date - Filter entries with start_time >= date
   * @param {string} filters.end_date - Filter entries with start_time <= date
   */
  const fetchEntries = useCallback(async (filters = {}) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await billableHoursAPI.list(projectId, filters);

      setEntries(response.items || []);
      setSummary({
        total: response.total || 0,
        total_hours: response.total_hours || 0,
        total_amount: response.total_amount || 0,
        uninvoiced_hours: response.uninvoiced_hours || 0,
        uninvoiced_amount: response.uninvoiced_amount || 0,
      });

      return response;
    } catch (err) {
      console.error('[useBillableHours] Failed to fetch entries:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * Create a new billable hour entry
   * @param {Object} data - Entry data
   */
  const createEntry = useCallback(async (data) => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      setError(null);
      const newEntry = await billableHoursAPI.create(projectId, data);

      // Add to local state
      setEntries(prev => [newEntry, ...prev]);

      // Update summary
      setSummary(prev => ({
        ...prev,
        total: prev.total + 1,
        total_hours: prev.total_hours + (parseFloat(newEntry.hours) || 0),
        total_amount: prev.total_amount + (parseFloat(newEntry.amount) || 0),
        uninvoiced_hours: newEntry.invoice_id ? prev.uninvoiced_hours : prev.uninvoiced_hours + (parseFloat(newEntry.hours) || 0),
        uninvoiced_amount: newEntry.invoice_id ? prev.uninvoiced_amount : prev.uninvoiced_amount + (parseFloat(newEntry.amount) || 0),
      }));

      return newEntry;
    } catch (err) {
      console.error('[useBillableHours] Failed to create entry:', err);
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  /**
   * Update a billable hour entry
   * @param {string} entryId - Entry UUID
   * @param {Object} data - Fields to update
   */
  const updateEntry = useCallback(async (entryId, data) => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      setError(null);
      const updatedEntry = await billableHoursAPI.update(projectId, entryId, data);

      // Update in local state
      setEntries(prev => prev.map(entry =>
        entry.id === entryId ? updatedEntry : entry
      ));

      // Refetch to get accurate summary
      await fetchEntries();

      return updatedEntry;
    } catch (err) {
      console.error('[useBillableHours] Failed to update entry:', err);
      setError(err.message);
      throw err;
    }
  }, [projectId, fetchEntries]);

  /**
   * Delete a billable hour entry
   * @param {string} entryId - Entry UUID
   */
  const deleteEntry = useCallback(async (entryId) => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      setError(null);

      // Find entry for summary update
      const entry = entries.find(e => e.id === entryId);

      await billableHoursAPI.delete(projectId, entryId);

      // Remove from local state
      setEntries(prev => prev.filter(e => e.id !== entryId));

      // Update summary
      if (entry) {
        setSummary(prev => ({
          ...prev,
          total: prev.total - 1,
          total_hours: prev.total_hours - (parseFloat(entry.hours) || 0),
          total_amount: prev.total_amount - (parseFloat(entry.amount) || 0),
          uninvoiced_hours: entry.invoice_id ? prev.uninvoiced_hours : prev.uninvoiced_hours - (parseFloat(entry.hours) || 0),
          uninvoiced_amount: entry.invoice_id ? prev.uninvoiced_amount : prev.uninvoiced_amount - (parseFloat(entry.amount) || 0),
        }));
      }

      return true;
    } catch (err) {
      console.error('[useBillableHours] Failed to delete entry:', err);
      setError(err.message);
      throw err;
    }
  }, [projectId, entries]);

  /**
   * Link entry to an invoice
   * @param {string} entryId - Entry UUID
   * @param {string} invoiceId - Invoice UUID
   */
  const linkToInvoice = useCallback(async (entryId, invoiceId) => {
    return updateEntry(entryId, { invoice_id: invoiceId });
  }, [updateEntry]);

  /**
   * Unlink entry from invoice
   * @param {string} entryId - Entry UUID
   */
  const unlinkFromInvoice = useCallback(async (entryId) => {
    return updateEntry(entryId, { invoice_id: null });
  }, [updateEntry]);

  /**
   * Duplicate an entry (creates new entry with same data)
   * @param {string} entryId - Entry UUID to duplicate
   */
  const duplicateEntry = useCallback(async (entryId) => {
    const entry = entries.find(e => e.id === entryId);
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
