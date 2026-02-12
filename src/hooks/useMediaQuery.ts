import { useSyncExternalStore } from 'react';

/**
 * Concurrent-safe media query hook using useSyncExternalStore.
 * Returns true when the query matches, false otherwise.
 *
 * @example
 * const isWide = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    // SSR fallback — assume narrow
    () => false,
  );
}
