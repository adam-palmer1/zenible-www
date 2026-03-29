import { useEffect, useRef } from 'react';
import { authAPI, tokenStorage } from '../utils/auth';
import logger from '../utils/logger';

const IDLE_TIMEOUT_MS = Number(import.meta.env.VITE_IDLE_TIMEOUT_MS) || 3_600_000;
const AUTH_POLL_INTERVAL_MS = Number(import.meta.env.VITE_AUTH_POLL_INTERVAL_MS) || 60_000;
const THROTTLE_MS = 30_000;
const IDLE_CHECK_INTERVAL_MS = 30_000;

/**
 * Handles idle timeout (auto-logout after inactivity) and
 * session polling (periodic /auth/me check for server-side invalidation).
 *
 * Uses a timestamp-based idle deadline with multiple fallback checks
 * to remain reliable when the browser throttles/freezes background tabs
 * or the device sleeps.
 *
 * Inert when isAuthenticated is false — no listeners or timers are active.
 */
export function useSessionGuard(
  isAuthenticated: boolean,
  logout: () => Promise<void>
): void {
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    if (!isAuthenticated) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    let idleCheckInterval: ReturnType<typeof setInterval>;
    let pollInterval: ReturnType<typeof setInterval>;
    let lastActivity = Date.now();
    let idleDeadline = Date.now() + IDLE_TIMEOUT_MS;
    let logoutTriggered = false;

    // --- Idle timeout ---

    const triggerLogout = () => {
      if (logoutTriggered) return;
      logoutTriggered = true;
      clearTimeout(idleTimer);
      clearInterval(idleCheckInterval);
      clearInterval(pollInterval);
      logger.info('Session idle timeout reached, logging out');
      logoutRef.current().then(() => {
        window.location.href = '/signin?reason=idle';
      });
    };

    const resetIdleTimer = () => {
      idleDeadline = Date.now() + IDLE_TIMEOUT_MS;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(triggerLogout, IDLE_TIMEOUT_MS);
    };

    // Throttled activity handler
    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivity < THROTTLE_MS) return;
      lastActivity = now;
      resetIdleTimer();
    };

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'keydown',
      'mousedown',
      'scroll',
      'touchstart',
    ];

    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    resetIdleTimer(); // start the initial timer

    // Fallback: periodic check catches frozen/throttled timers
    idleCheckInterval = setInterval(() => {
      if (Date.now() >= idleDeadline) triggerLogout();
    }, IDLE_CHECK_INTERVAL_MS);

    // Fallback: check immediately when tab regains focus
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() >= idleDeadline) {
        triggerLogout();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // --- Session poll ---

    pollInterval = setInterval(async () => {
      // If token was removed externally (e.g. another tab logged out), clean up
      if (!tokenStorage.getAccessToken()) {
        logger.info('Access token missing, logging out');
        await logoutRef.current();
        return;
      }

      try {
        await authAPI.getCurrentUser();
      } catch {
        // makeAuthenticatedRequest already handles 401 → refresh → redirect,
        // so if we reach here the session is truly invalid and the redirect
        // has already been initiated. No extra action needed.
        logger.warn('Session poll failed');
      }
    }, AUTH_POLL_INTERVAL_MS);

    // --- Cleanup ---

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimeout(idleTimer);
      clearInterval(idleCheckInterval);
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]);
}
