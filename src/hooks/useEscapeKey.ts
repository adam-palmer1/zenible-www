import { useEffect } from 'react';

/**
 * Hook to close a modal/dialog when the Escape key is pressed.
 * @param onEscape - Callback to invoke on Escape key press
 * @param enabled - Whether the listener is active (typically tied to isOpen state)
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, enabled]);
}
