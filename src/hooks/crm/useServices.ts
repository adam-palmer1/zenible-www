import { useState, useCallback, useEffect } from 'react';
import { servicesAPI } from '../../services/api/crm';
import { removeItem, updateItem, addItem } from '../../utils/stateHelpers';

// Module-level cache for services (shared across all hook instances)
let servicesCache: unknown[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let pendingFetch: Promise<unknown> | null = null; // Prevent duplicate concurrent fetches

/**
 * Custom hook for managing services
 * Handles loading, creating, updating, and deleting services with caching
 */
export function useServices(options: Record<string, unknown> = {}) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if cache is valid
  const isCacheValid = (): boolean => {
    return servicesCache !== null &&
           cacheTimestamp !== null &&
           (Date.now() - cacheTimestamp) < CACHE_TTL;
  };

  // Fetch services with caching
  const fetchServices = useCallback(async (params: Record<string, unknown> = {}, forceRefresh: boolean = false): Promise<unknown> => {
    try {
      // Return cached data if valid and not forcing refresh (only for default params)
      const isDefaultParams = Object.keys(params).length === 0 && Object.keys(options).length === 0;
      if (!forceRefresh && isDefaultParams && isCacheValid()) {
        setServices(servicesCache || []);
        return servicesCache;
      }

      // If there's already a fetch in progress, wait for it
      if (isDefaultParams && pendingFetch) {
        const response = await pendingFetch as unknown[];
        setServices(response || []);
        return response;
      }

      setLoading(true);
      setError(null);

      const mergedParams = { ...options, ...params };

      // Create new fetch promise (only cache default params)
      if (isDefaultParams) {
        pendingFetch = servicesAPI.list(mergedParams);
        const response = await pendingFetch as unknown[];
        pendingFetch = null;

        // Update cache
        servicesCache = response;
        cacheTimestamp = Date.now();

        setServices(response || []);
        return response;
      } else {
        // Don't cache filtered requests
        const response = await servicesAPI.list(mergedParams) as unknown[];
        setServices(response || []);
        return response;
      }
    } catch (err: unknown) {
      pendingFetch = null;
      console.error('[useServices] Failed to fetch services:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Get single service
  const getService = useCallback(async (serviceId: string): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const service = await servicesAPI.get(serviceId);
      return service;
    } catch (err: unknown) {
      console.error('[useServices] Failed to get service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create service
  const createService = useCallback(async (data: Record<string, unknown>): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const newService = await servicesAPI.create(data);

      // Invalidate cache
      servicesCache = null;
      cacheTimestamp = null;

      // Add to local state
      setServices(prev => addItem(prev, newService));

      return newService;
    } catch (err: unknown) {
      console.error('[useServices] Failed to create service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update service
  const updateService = useCallback(async (serviceId: string, data: Record<string, unknown>): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const updatedService = await servicesAPI.update(serviceId, data);

      // Invalidate cache
      servicesCache = null;
      cacheTimestamp = null;

      // Update in local state
      setServices(prev => updateItem(prev, serviceId, updatedService));

      return updatedService;
    } catch (err: unknown) {
      console.error('[useServices] Failed to update service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete service
  const deleteService = useCallback(async (serviceId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await servicesAPI.delete(serviceId);

      // Invalidate cache
      servicesCache = null;
      cacheTimestamp = null;

      // Remove from local state
      setServices(prev => removeItem(prev, serviceId));

      return true;
    } catch (err: unknown) {
      console.error('[useServices] Failed to delete service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load services on mount
  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    services,
    loading,
    error,
    fetchServices,
    getService,
    createService,
    updateService,
    deleteService,
  };
}
