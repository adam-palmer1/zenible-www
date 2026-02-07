import { useState, useCallback, useEffect } from 'react';
import { statusesAPI } from '../../services/api/crm';
import { removeItem, updateItem, addItem } from '../../utils/stateHelpers';

// Module-level cache for statuses (shared across all hook instances)
let statusesCache: Record<string, unknown> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let pendingFetch: Promise<unknown> | null = null; // Prevent duplicate concurrent fetches

/**
 * Custom hook for managing contact statuses
 * Handles loading global and custom statuses with caching
 */
export function useContactStatuses() {
  const [globalStatuses, setGlobalStatuses] = useState<any[]>([]);
  const [customStatuses, setCustomStatuses] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if cache is valid
  const isCacheValid = (): boolean => {
    return statusesCache !== null &&
           cacheTimestamp !== null &&
           (Date.now() - cacheTimestamp) < CACHE_TTL;
  };

  // Fetch all available statuses with caching
  const fetchStatuses = useCallback(async (forceRefresh: boolean = false): Promise<unknown> => {
    try {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid()) {
        setGlobalStatuses((statusesCache as any).global_statuses || []);
        setCustomStatuses((statusesCache as any).custom_statuses || []);
        setAllStatuses([
          ...((statusesCache as any).global_statuses || []),
          ...((statusesCache as any).custom_statuses || []),
        ]);
        return statusesCache;
      }

      // If there's already a fetch in progress, wait for it
      if (pendingFetch) {
        const response = await pendingFetch;
        setGlobalStatuses((response as any).global_statuses || []);
        setCustomStatuses((response as any).custom_statuses || []);
        setAllStatuses([
          ...((response as any).global_statuses || []),
          ...((response as any).custom_statuses || []),
        ]);
        return response;
      }

      setLoading(true);
      setError(null);

      // Create new fetch promise
      pendingFetch = statusesAPI.getAvailable();
      const response = await pendingFetch;
      pendingFetch = null;

      // Update cache
      statusesCache = response as Record<string, unknown>;
      cacheTimestamp = Date.now();

      setGlobalStatuses((response as any).global_statuses || []);
      setCustomStatuses((response as any).custom_statuses || []);
      setAllStatuses([
        ...((response as any).global_statuses || []),
        ...((response as any).custom_statuses || []),
      ]);

      return response;
    } catch (err: unknown) {
      pendingFetch = null;
      console.error('[useContactStatuses] Failed to fetch statuses:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create custom status
  const createCustomStatus = useCallback(async (data: Record<string, unknown>): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const newStatus = await statusesAPI.createCustom(data);

      // Invalidate cache
      statusesCache = null;
      cacheTimestamp = null;

      // Add to local state
      setCustomStatuses(prev => addItem(prev, newStatus));
      setAllStatuses(prev => addItem(prev, newStatus));

      return newStatus;
    } catch (err: unknown) {
      console.error('[useContactStatuses] Failed to create custom status:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update global status
  const updateGlobalStatus = useCallback(async (statusId: string, data: Record<string, unknown>): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const updatedStatus = await statusesAPI.updateGlobal(statusId, data);

      // Invalidate cache
      statusesCache = null;
      cacheTimestamp = null;

      // Update in local state
      setGlobalStatuses(prev => updateItem(prev, statusId, updatedStatus));
      setAllStatuses(prev => updateItem(prev, statusId, updatedStatus));

      return updatedStatus;
    } catch (err: unknown) {
      console.error('[useContactStatuses] Failed to update global status:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update custom status
  const updateCustomStatus = useCallback(async (statusId: string, data: Record<string, unknown>): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const updatedStatus = await statusesAPI.updateCustom(statusId, data);

      // Invalidate cache
      statusesCache = null;
      cacheTimestamp = null;

      // Update in local state
      setCustomStatuses(prev => updateItem(prev, statusId, updatedStatus));
      setAllStatuses(prev => updateItem(prev, statusId, updatedStatus));

      return updatedStatus;
    } catch (err: unknown) {
      console.error('[useContactStatuses] Failed to update custom status:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete custom status
  const deleteCustomStatus = useCallback(async (statusId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await statusesAPI.deleteCustom(statusId);

      // Invalidate cache
      statusesCache = null;
      cacheTimestamp = null;

      // Remove from local state
      setCustomStatuses(prev => removeItem(prev, statusId));
      setAllStatuses(prev => removeItem(prev, statusId));

      return true;
    } catch (err: unknown) {
      console.error('[useContactStatuses] Failed to delete custom status:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load statuses on mount
  useEffect(() => {
    fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    globalStatuses,
    customStatuses,
    allStatuses,
    loading,
    error,
    fetchStatuses,
    updateGlobalStatus,
    createCustomStatus,
    updateCustomStatus,
    deleteCustomStatus,
  };
}
