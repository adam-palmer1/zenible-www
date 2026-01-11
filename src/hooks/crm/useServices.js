import { useState, useCallback, useEffect } from 'react';
import { servicesAPI } from '../../services/api/crm';
import { removeItem, updateItem, addItem } from '../../utils/stateHelpers';

// Module-level cache for services (shared across all hook instances)
let servicesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let pendingFetch = null; // Prevent duplicate concurrent fetches

/**
 * Custom hook for managing services
 * Handles loading, creating, updating, and deleting services with caching
 *
 * @param {Object} options - Options for filtering services
 * @returns {Object} Services state and methods
 */
export function useServices(options = {}) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if cache is valid
  const isCacheValid = () => {
    return servicesCache !== null &&
           cacheTimestamp !== null &&
           (Date.now() - cacheTimestamp) < CACHE_TTL;
  };

  // Fetch services with caching
  const fetchServices = useCallback(async (params = {}, forceRefresh = false) => {
    try {
      // Return cached data if valid and not forcing refresh (only for default params)
      const isDefaultParams = Object.keys(params).length === 0 && Object.keys(options).length === 0;
      if (!forceRefresh && isDefaultParams && isCacheValid()) {
        setServices(servicesCache || []);
        return servicesCache;
      }

      // If there's already a fetch in progress, wait for it
      if (isDefaultParams && pendingFetch) {
        const response = await pendingFetch;
        setServices(response || []);
        return response;
      }

      setLoading(true);
      setError(null);

      const mergedParams = { ...options, ...params };

      // Create new fetch promise (only cache default params)
      if (isDefaultParams) {
        pendingFetch = servicesAPI.list(mergedParams);
        const response = await pendingFetch;
        pendingFetch = null;

        // Update cache
        servicesCache = response;
        cacheTimestamp = Date.now();

        setServices(response || []);
        return response;
      } else {
        // Don't cache filtered requests
        const response = await servicesAPI.list(mergedParams);
        setServices(response || []);
        return response;
      }
    } catch (err) {
      pendingFetch = null;
      console.error('[useServices] Failed to fetch services:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Get single service
  const getService = useCallback(async (serviceId) => {
    try {
      setLoading(true);
      setError(null);
      const service = await servicesAPI.get(serviceId);
      return service;
    } catch (err) {
      console.error('[useServices] Failed to get service:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create service
  const createService = useCallback(async (data) => {
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
    } catch (err) {
      console.error('[useServices] Failed to create service:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update service
  const updateService = useCallback(async (serviceId, data) => {
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
    } catch (err) {
      console.error('[useServices] Failed to update service:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete service
  const deleteService = useCallback(async (serviceId) => {
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
    } catch (err) {
      console.error('[useServices] Failed to delete service:', err);
      setError(err.message);
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
