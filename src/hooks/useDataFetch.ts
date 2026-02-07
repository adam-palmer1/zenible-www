import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseDataFetchOptions<T> {
  autoFetch?: boolean;
  initialData?: T | null;
  onError?: ((err: unknown) => void) | null;
  onSuccess?: ((data: T) => void) | null;
  dependencies?: unknown[];
}

export interface UseDataFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  refetch: () => Promise<T | undefined>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  reset: () => void;
}

/**
 * useDataFetch - A reusable hook for data fetching with loading/error states
 *
 * Replaces the common pattern found in 70+ files:
 * - const [data, setData] = useState(null)
 * - const [loading, setLoading] = useState(true)
 * - const [error, setError] = useState(null)
 * - useEffect with try/catch/finally
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
const useDataFetch = <T = unknown>(
  fetchFn: () => Promise<T>,
  options: UseDataFetchOptions<T> = {}
): UseDataFetchReturn<T> => {
  const {
    autoFetch = true,
    initialData = null,
    onError = null,
    onSuccess = null,
    dependencies = [],
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<unknown>(null);

  // Use ref to track if component is mounted
  const isMounted = useRef<boolean>(true);
  // Use ref to store latest fetchFn to avoid stale closures
  const fetchFnRef = useRef<() => Promise<T>>(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async (): Promise<T | undefined> => {
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
  const reset = useCallback((): void => {
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
export const useDataFetchLazy = <T = unknown>(
  fetchFn: () => Promise<T>,
  options: UseDataFetchOptions<T> = {}
): UseDataFetchReturn<T> => {
  return useDataFetch<T>(fetchFn, { ...options, autoFetch: false });
};
