import { useState, useCallback, useEffect } from 'react';
import { statusesAPI } from '../../services/api/crm';
import { removeItem, updateItem, addItem } from '../../utils/stateHelpers';

// Module-level cache for statuses (shared across all hook instances)
let statusesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let pendingFetch = null; // Prevent duplicate concurrent fetches

/**
 * Custom hook for managing contact statuses
 * Handles loading global and custom statuses with caching
 *
 * @returns {Object} Status state and methods
 */
export function useContactStatuses() {
  const [globalStatuses, setGlobalStatuses] = useState([]);
  const [customStatuses, setCustomStatuses] = useState([]);
  const [allStatuses, setAllStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if cache is valid
  const isCacheValid = () => {
    return statusesCache !== null &&
           cacheTimestamp !== null &&
           (Date.now() - cacheTimestamp) < CACHE_TTL;
  };

  // Fetch all available statuses with caching
  const fetchStatuses = useCallback(async (forceRefresh = false) => {
    try {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid()) {
        setGlobalStatuses(statusesCache.global_statuses || []);
        setCustomStatuses(statusesCache.custom_statuses || []);
        setAllStatuses([
          ...(statusesCache.global_statuses || []),
          ...(statusesCache.custom_statuses || []),
        ]);
        return statusesCache;
      }

      // If there's already a fetch in progress, wait for it
      if (pendingFetch) {
        const response = await pendingFetch;
        setGlobalStatuses(response.global_statuses || []);
        setCustomStatuses(response.custom_statuses || []);
        setAllStatuses([
          ...(response.global_statuses || []),
          ...(response.custom_statuses || []),
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
      statusesCache = response;
      cacheTimestamp = Date.now();

      setGlobalStatuses(response.global_statuses || []);
      setCustomStatuses(response.custom_statuses || []);
      setAllStatuses([
        ...(response.global_statuses || []),
        ...(response.custom_statuses || []),
      ]);

      return response;
    } catch (err) {
      pendingFetch = null;
      console.error('[useContactStatuses] Failed to fetch statuses:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create custom status
  const createCustomStatus = useCallback(async (data) => {
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
    } catch (err) {
      console.error('[useContactStatuses] Failed to create custom status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update global status
  const updateGlobalStatus = useCallback(async (statusId, data) => {
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
    } catch (err) {
      console.error('[useContactStatuses] Failed to update global status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update custom status
  const updateCustomStatus = useCallback(async (statusId, data) => {
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
    } catch (err) {
      console.error('[useContactStatuses] Failed to update custom status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete custom status
  const deleteCustomStatus = useCallback(async (statusId) => {
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
    } catch (err) {
      console.error('[useContactStatuses] Failed to delete custom status:', err);
      setError(err.message);
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
