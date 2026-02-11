import { useState, useCallback, useEffect } from 'react';
import { statusesAPI } from '../../services/api/crm';
import { removeItem, updateItem, addItem } from '../../utils/stateHelpers';
import type { AvailableStatuses, SimpleStatusResponse } from '../../types';

// Module-level cache for statuses (shared across all hook instances)
let statusesCache: AvailableStatuses | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let pendingFetch: Promise<unknown> | null = null; // Prevent duplicate concurrent fetches

/**
 * Custom hook for managing contact statuses
 * Handles loading global and custom statuses with caching
 */
interface StatusRoles {
  lead_status_id?: string | null;
  call_booked_status_id?: string | null;
  lost_status_id?: string | null;
  won_status_id?: string | null;
}

export function useContactStatuses() {
  const [globalStatuses, setGlobalStatuses] = useState<SimpleStatusResponse[]>([]);
  const [customStatuses, setCustomStatuses] = useState<SimpleStatusResponse[]>([]);
  const [allStatuses, setAllStatuses] = useState<SimpleStatusResponse[]>([]);
  const [statusRoles, setStatusRoles] = useState<StatusRoles>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if cache is valid
  const isCacheValid = (): boolean => {
    return statusesCache !== null &&
           cacheTimestamp !== null &&
           (Date.now() - cacheTimestamp) < CACHE_TTL;
  };

  // Fetch all available statuses with caching
  const fetchStatuses = useCallback(async (forceRefresh: boolean = false): Promise<AvailableStatuses | unknown> => {
    try {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid()) {
        setGlobalStatuses(statusesCache!.global_statuses || []);
        setCustomStatuses(statusesCache!.custom_statuses || []);
        setAllStatuses([
          ...(statusesCache!.global_statuses || []),
          ...(statusesCache!.custom_statuses || []),
        ]);
        setStatusRoles((statusesCache as any)?.roles || {});
        return statusesCache;
      }

      // If there's already a fetch in progress, wait for it
      if (pendingFetch) {
        const response = await pendingFetch;
        const typed = response as AvailableStatuses;
        setGlobalStatuses(typed.global_statuses || []);
        setCustomStatuses(typed.custom_statuses || []);
        setAllStatuses([
          ...(typed.global_statuses || []),
          ...(typed.custom_statuses || []),
        ]);
        setStatusRoles((typed as any)?.roles || {});
        return response;
      }

      setLoading(true);
      setError(null);

      // Create new fetch promise
      pendingFetch = statusesAPI.getAvailable();
      const response = await pendingFetch;
      pendingFetch = null;

      // Update cache
      const typed = response as AvailableStatuses;
      statusesCache = typed;
      cacheTimestamp = Date.now();

      setGlobalStatuses(typed.global_statuses || []);
      setCustomStatuses(typed.custom_statuses || []);
      setAllStatuses([
        ...(typed.global_statuses || []),
        ...(typed.custom_statuses || []),
      ]);
      setStatusRoles((typed as any)?.roles || {});

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
      setCustomStatuses(prev => addItem(prev, newStatus as SimpleStatusResponse));
      setAllStatuses(prev => addItem(prev, newStatus as SimpleStatusResponse));

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
      setGlobalStatuses(prev => updateItem(prev, statusId, updatedStatus as SimpleStatusResponse));
      setAllStatuses(prev => updateItem(prev, statusId, updatedStatus as SimpleStatusResponse));

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
      setCustomStatuses(prev => updateItem(prev, statusId, updatedStatus as SimpleStatusResponse));
      setAllStatuses(prev => updateItem(prev, statusId, updatedStatus as SimpleStatusResponse));

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
    statusRoles,
    loading,
    error,
    fetchStatuses,
    updateGlobalStatus,
    createCustomStatus,
    updateCustomStatus,
    deleteCustomStatus,
  };
}
