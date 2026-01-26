import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDataFetch - A reusable hook for data fetching with loading/error states
 *
 * Replaces the common pattern found in 70+ files:
 * - const [data, setData] = useState(null)
 * - const [loading, setLoading] = useState(true)
 * - const [error, setError] = useState(null)
 * - useEffect with try/catch/finally
 *
 * @param {Function} fetchFn - Async function that fetches data
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: true)
 * @param {*} options.initialData - Initial data value (default: null)
 * @param {Function} options.onError - Error callback
 * @param {Function} options.onSuccess - Success callback
 * @param {Array} options.dependencies - Additional dependencies for refetch
 *
 * @returns {Object} { data, loading, error, refetch, setData, reset }
 *
 * @example
 * // Basic usage
 * const { data: users, loading, error, refetch } = useDataFetch(
 *   () => usersAPI.getAll()
 * );
 *
 * @example
 * // With options
 * const { data, loading, refetch } = useDataFetch(
 *   () => invoicesAPI.getById(id),
 *   {
 *     autoFetch: !!id,
 *     onError: (err) => showError(err.message),
 *     dependencies: [id]
 *   }
 * );
 */
const useDataFetch = (fetchFn, options = {}) => {
  const {
    autoFetch = true,
    initialData = null,
    onError = null,
    onSuccess = null,
    dependencies = [],
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  // Use ref to track if component is mounted
  const isMounted = useRef(true);
  // Use ref to store latest fetchFn to avoid stale closures
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current();

      if (isMounted.current) {
        setData(result);
        if (onSuccess) {
          onSuccess(result);
        }
      }

      return result;
    } catch (err) {
      if (isMounted.current) {
        setError(err);
        if (onError) {
          onError(err);
        }
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [onError, onSuccess]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData().catch(() => {
        // Error already handled in fetchData
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset function to restore initial state
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
    reset,
  };
};

export default useDataFetch;

/**
 * useDataFetchLazy - Same as useDataFetch but doesn't auto-fetch
 * Convenience wrapper for manual fetching
 */
export const useDataFetchLazy = (fetchFn, options = {}) => {
  return useDataFetch(fetchFn, { ...options, autoFetch: false });
};
