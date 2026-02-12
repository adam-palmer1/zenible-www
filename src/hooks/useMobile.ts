import { BREAKPOINTS } from '../constants/breakpoints';
import { useMediaQuery } from './useMediaQuery';

/**
 * Returns true when the viewport is below `lg` (1024px).
 * Chosen because the 280px sidebar leaves only 488px at `md`.
 */
export function useMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.lg - 1}px)`);
}

/** Returns true when viewport is `lg` or wider. */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}
