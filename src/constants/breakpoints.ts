/**
 * Responsive breakpoints matching Tailwind CSS defaults.
 * Used by custom hooks (useMobile, useMediaQuery) to keep
 * breakpoint values in sync with the utility-class layer.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
