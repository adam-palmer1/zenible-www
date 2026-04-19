import { useCallback, useEffect, useRef, useState } from 'react';
import meetingIntelligenceAPI from '../../services/api/crm/meetingIntelligence';
import ZMIWebSocketService from '../../services/ZMIWebSocketService';
import logger from '../../utils/logger';
import type { BotStatus, UpcomingMeeting } from '../../types/meetingIntelligence';

export const MAX_ACTIVE_BOTS = 3;

interface UseBotSessionManagerOptions {
  /**
   * Called whenever a bot session transitions to a terminal state (ended/error) via
   * the WebSocket channel. Lets the parent refresh the upcoming-meetings list so
   * ended sessions stop appearing as "bot active".
   */
  onAnySessionEnded?: () => void;
}

interface UseBotSessionManagerResult {
  activeBotSession: string | null;
  setActiveBotSession: React.Dispatch<React.SetStateAction<string | null>>;
  botStatuses: Record<string, BotStatus>;
  dispatchedAt: Record<string, number>;
  appointmentSessions: Record<string, string>;
  activeBotCount: number;
  /** Register a new session just dispatched from the UI. */
  addSession: (sessionId: string, status: BotStatus['status'], appointmentId?: string) => void;
  /** Mark a session as ended locally (used after optimistic leave). */
  markEnded: (sessionId: string) => void;
  /** Seed server-known active sessions from an upcoming-meetings payload. */
  seedFromUpcomingMeetings: (meetings: UpcomingMeeting[]) => void;
}

/**
 * Encapsulates all bot-session state, polling, and WebSocket logic for the
 * Meetings page. Extracted from MeetingsPage.tsx so the component can focus on
 * rendering and so the polling lifecycle is independently testable.
 */
export function useBotSessionManager({
  onAnySessionEnded,
}: UseBotSessionManagerOptions = {}): UseBotSessionManagerResult {
  const [activeBotSession, setActiveBotSession] = useState<string | null>(null);
  const [botStatuses, setBotStatuses] = useState<Record<string, BotStatus>>({});
  const [dispatchedAt, setDispatchedAt] = useState<Record<string, number>>({});
  const [appointmentSessions, setAppointmentSessions] = useState<Record<string, string>>({});

  const botStatusesRef = useRef(botStatuses);
  botStatusesRef.current = botStatuses;
  const pollFailuresRef = useRef<Record<string, number>>({});
  const onAnySessionEndedRef = useRef(onAnySessionEnded);
  onAnySessionEndedRef.current = onAnySessionEnded;

  // One-time fetch of already-running sessions so they survive a page reload.
  useEffect(() => {
    meetingIntelligenceAPI
      .getActiveBotSessions()
      .then((sessions) => {
        if (sessions.length === 0) return;
        setBotStatuses((prev) => {
          const next = { ...prev };
          for (const s of sessions) {
            if (!next[s.session_id]) {
              next[s.session_id] = { session_id: s.session_id, status: s.status } as BotStatus;
            }
          }
          return next;
        });
        const inMeeting = sessions.find((s) => s.status === 'in_meeting' || s.status === 'listening');
        if (inMeeting) {
          setActiveBotSession(inMeeting.session_id);
        }
      })
      .catch((err: unknown) => {
        logger.warn('[useBotSessionManager] Active sessions endpoint unavailable:', err);
      });
  }, []);

  // Fallback polling for bot status. Socket.IO is primary; this catches any
  // updates missed when the socket is disconnected or lags.
  useEffect(() => {
    const poll = async () => {
      const activeSessionIds = Object.entries(botStatusesRef.current)
        .filter(([, bs]) => bs.status !== 'ended' && bs.status !== 'error')
        .map(([sid]) => sid);
      if (activeSessionIds.length === 0) return;

      for (const sessionId of activeSessionIds) {
        try {
          const status = (await meetingIntelligenceAPI.getBotStatus(sessionId)) as BotStatus;
          setBotStatuses((prev) => ({ ...prev, [sessionId]: status }));
          pollFailuresRef.current[sessionId] = 0;
          if (status.status === 'ended' || status.status === 'error') {
            setActiveBotSession((prev) => (prev === sessionId ? null : prev));
          }
        } catch (err) {
          const failures = (pollFailuresRef.current[sessionId] || 0) + 1;
          pollFailuresRef.current[sessionId] = failures;
          // After 3 consecutive failures, surface as error so UI shows lost-contact state.
          if (failures >= 3) {
            logger.warn(`[useBotSessionManager] Lost contact with bot ${sessionId} after 3 failed polls:`, err);
            setBotStatuses((prev) => ({
              ...prev,
              [sessionId]: { ...prev[sessionId], status: 'error', error_message: 'Lost contact with bot' } as BotStatus,
            }));
            setActiveBotSession((prev) => (prev === sessionId ? null : prev));
            delete pollFailuresRef.current[sessionId];
          }
        }
      }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time bot status via Socket.IO (primary channel).
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    const ws = new ZMIWebSocketService({
      baseUrl: apiBaseUrl,
      getAccessToken: () => localStorage.getItem('access_token'),
      onBotStatus: (data) => {
        setBotStatuses((prev) => ({
          ...prev,
          [data.session_id]: { ...prev[data.session_id], ...data } as BotStatus,
        }));
        if (data.status === 'ended' || data.status === 'error') {
          setActiveBotSession((prev) => (prev === data.session_id ? null : prev));
          onAnySessionEndedRef.current?.();
        }
      },
    });
    ws.connect().catch((err: unknown) => {
      logger.warn('[useBotSessionManager] ZMI WebSocket failed to connect:', err);
    });
    return () => ws.disconnect();
  }, []);

  const addSession = useCallback(
    (sessionId: string, status: BotStatus['status'], appointmentId?: string) => {
      setDispatchedAt((prev) => ({ ...prev, [sessionId]: Date.now() }));
      setBotStatuses((prev) => ({
        ...prev,
        [sessionId]: { session_id: sessionId, status } as BotStatus,
      }));
      if (appointmentId) {
        setAppointmentSessions((prev) => ({ ...prev, [appointmentId]: sessionId }));
      }
    },
    [],
  );

  const markEnded = useCallback((sessionId: string) => {
    setBotStatuses((prev) => ({
      ...prev,
      [sessionId]: { ...prev[sessionId], status: 'ended' } as BotStatus,
    }));
    setActiveBotSession((prev) => (prev === sessionId ? null : prev));
  }, []);

  const seedFromUpcomingMeetings = useCallback((meetings: UpcomingMeeting[]) => {
    for (const meeting of meetings) {
      const sid = meeting.bot_session_id;
      if (!sid) continue;
      const status = meeting.bot_dispatch_status;
      if (!status || ['ended', 'error', 'failed', 'completed'].includes(status)) continue;
      setBotStatuses((prev) => {
        if (prev[sid]) return prev;
        const seedStatus = (meeting.bot_status || 'joining') as BotStatus['status'];
        return { ...prev, [sid]: { session_id: sid, status: seedStatus } as BotStatus };
      });
      setDispatchedAt((prev) => (prev[sid] ? prev : { ...prev, [sid]: Date.now() }));
    }
  }, []);

  const activeBotCount = Object.values(botStatuses).filter(
    (bs) => bs.status !== 'ended' && bs.status !== 'error',
  ).length;

  return {
    activeBotSession,
    setActiveBotSession,
    botStatuses,
    dispatchedAt,
    appointmentSessions,
    activeBotCount,
    addSession,
    markEnded,
    seedFromUpcomingMeetings,
  };
}
