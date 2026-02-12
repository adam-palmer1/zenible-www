import { useEffect } from 'react';

/**
 * Toggles `overflow: hidden` on `<body>` while `locked` is true.
 * Used to prevent background scroll when the mobile sidebar drawer is open.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
