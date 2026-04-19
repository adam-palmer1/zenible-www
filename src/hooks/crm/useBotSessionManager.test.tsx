import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

/*
 * The hook imports a REST API, a WebSocket service, and a logger.
 * We mock all three so the hook's behavior (state transitions, call wiring) can be
 * exercised in isolation without network or real timers.
 */

const { mockApi, MockWebSocketService } = vi.hoisted(() => {
  const api = {
    getActiveBotSessions: vi.fn(),
    getBotStatus: vi.fn(),
  };

  class WS {
    config: any;
    constructor(config: any) { this.config = config; WS.instances.push(this); }
    connect = vi.fn(() => Promise.resolve());
    disconnect = vi.fn();
    static instances: WS[] = [];
    /** Test-only helper to simulate a server-pushed bot status update. */
    emitBotStatus(data: { session_id: string; status: string }) {
      this.config.onBotStatus?.(data);
    }
  }

  return { mockApi: api, MockWebSocketService: WS };
});

vi.mock('../../services/api/crm/meetingIntelligence', () => ({ default: mockApi }));
vi.mock('../../services/ZMIWebSocketService', () => ({ default: MockWebSocketService }));
vi.mock('../../utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { useBotSessionManager, MAX_ACTIVE_BOTS } from './useBotSessionManager';

describe('useBotSessionManager', () => {
  beforeEach(() => {
    mockApi.getActiveBotSessions.mockReset();
    mockApi.getBotStatus.mockReset();
    MockWebSocketService.instances.length = 0;
    // Default: no active sessions at mount, status lookups succeed.
    mockApi.getActiveBotSessions.mockResolvedValue([]);
    mockApi.getBotStatus.mockResolvedValue({ session_id: 'x', status: 'in_meeting' });
    localStorage.setItem('access_token', 'test-token');
  });

  afterEach(() => {
    localStorage.removeItem('access_token');
  });

  it('exposes MAX_ACTIVE_BOTS=3', () => {
    expect(MAX_ACTIVE_BOTS).toBe(3);
  });

  it('starts empty and derives activeBotCount=0', () => {
    const { result } = renderHook(() => useBotSessionManager());
    expect(result.current.activeBotSession).toBeNull();
    expect(result.current.botStatuses).toEqual({});
    expect(result.current.dispatchedAt).toEqual({});
    expect(result.current.appointmentSessions).toEqual({});
    expect(result.current.activeBotCount).toBe(0);
  });

  it('seeds state from server-known active sessions on mount', async () => {
    mockApi.getActiveBotSessions.mockResolvedValue([
      { session_id: 's1', status: 'joining' },
      { session_id: 's2', status: 'in_meeting' },
    ]);

    const { result } = renderHook(() => useBotSessionManager());

    await waitFor(() => {
      expect(Object.keys(result.current.botStatuses).length).toBe(2);
    });
    expect(result.current.botStatuses.s1.status).toBe('joining');
    expect(result.current.botStatuses.s2.status).toBe('in_meeting');
    // Auto-opens the first in-meeting session for the transcription panel.
    expect(result.current.activeBotSession).toBe('s2');
  });

  it('addSession registers session state, dispatchedAt, and appointment mapping', () => {
    const { result } = renderHook(() => useBotSessionManager());

    act(() => {
      result.current.addSession('s1', 'joining', 'appt-1');
    });

    expect(result.current.botStatuses.s1).toEqual({ session_id: 's1', status: 'joining' });
    expect(result.current.dispatchedAt.s1).toBeGreaterThan(0);
    expect(result.current.appointmentSessions).toEqual({ 'appt-1': 's1' });
    expect(result.current.activeBotCount).toBe(1);
  });

  it('addSession without appointmentId leaves appointmentSessions empty', () => {
    const { result } = renderHook(() => useBotSessionManager());

    act(() => {
      result.current.addSession('s-standalone', 'joining');
    });

    expect(result.current.appointmentSessions).toEqual({});
    expect(result.current.botStatuses['s-standalone'].status).toBe('joining');
  });

  it('markEnded transitions status to "ended" and clears activeBotSession', () => {
    const { result } = renderHook(() => useBotSessionManager());

    act(() => {
      result.current.addSession('s1', 'in_meeting');
      result.current.setActiveBotSession('s1');
    });

    act(() => {
      result.current.markEnded('s1');
    });

    expect(result.current.botStatuses.s1.status).toBe('ended');
    expect(result.current.activeBotSession).toBeNull();
    // Ended sessions don't count toward the active cap.
    expect(result.current.activeBotCount).toBe(0);
  });

  it('activeBotCount excludes ended and error sessions', () => {
    const { result } = renderHook(() => useBotSessionManager());

    act(() => {
      result.current.addSession('alive', 'in_meeting');
      result.current.addSession('dead', 'in_meeting');
      result.current.markEnded('dead');
    });

    expect(result.current.activeBotCount).toBe(1);
  });

  it('seedFromUpcomingMeetings hydrates sessions for active bots', () => {
    const { result } = renderHook(() => useBotSessionManager());

    act(() => {
      result.current.seedFromUpcomingMeetings([
        {
          id: 'm1',
          title: 'Discovery call',
          start_datetime: '', end_datetime: '',
          meeting_link: 'https://meet',
          zmi_enabled: true,
          platform: 'zoom',
          bot_dispatch_status: 'pending',
          bot_dispatch_source: null,
          bot_session_id: 'seed-s1',
          bot_dispatch_error: null,
          bot_status: 'joining',
          parent_appointment_id: null,
        },
      ]);
    });

    expect(result.current.botStatuses['seed-s1']).toBeDefined();
    expect(result.current.botStatuses['seed-s1'].status).toBe('joining');
    expect(result.current.dispatchedAt['seed-s1']).toBeGreaterThan(0);
  });

  it('seedFromUpcomingMeetings skips terminal dispatch statuses', () => {
    const { result } = renderHook(() => useBotSessionManager());

    act(() => {
      result.current.seedFromUpcomingMeetings([
        { id: 'm1', title: '', start_datetime: '', end_datetime: '', meeting_link: null,
          zmi_enabled: true, platform: null, bot_dispatch_status: 'ended',
          bot_dispatch_source: null, bot_session_id: 'dead-s1',
          bot_dispatch_error: null, bot_status: 'ended', parent_appointment_id: null },
        { id: 'm2', title: '', start_datetime: '', end_datetime: '', meeting_link: null,
          zmi_enabled: true, platform: null, bot_dispatch_status: 'failed',
          bot_dispatch_source: null, bot_session_id: 'failed-s1',
          bot_dispatch_error: 'nope', bot_status: null, parent_appointment_id: null },
      ]);
    });

    expect(result.current.botStatuses['dead-s1']).toBeUndefined();
    expect(result.current.botStatuses['failed-s1']).toBeUndefined();
  });

  it('seedFromUpcomingMeetings does not overwrite existing session state', () => {
    const { result } = renderHook(() => useBotSessionManager());

    act(() => {
      result.current.addSession('live-s1', 'in_meeting');
    });

    act(() => {
      result.current.seedFromUpcomingMeetings([
        { id: 'm', title: '', start_datetime: '', end_datetime: '', meeting_link: null,
          zmi_enabled: true, platform: null, bot_dispatch_status: 'pending',
          bot_dispatch_source: null, bot_session_id: 'live-s1',
          bot_dispatch_error: null, bot_status: 'joining', parent_appointment_id: null },
      ]);
    });

    // Should preserve the "in_meeting" state, not regress to "joining".
    expect(result.current.botStatuses['live-s1'].status).toBe('in_meeting');
  });

  it('WebSocket onBotStatus updates botStatuses live', async () => {
    const onAnySessionEnded = vi.fn();
    const { result } = renderHook(() => useBotSessionManager({ onAnySessionEnded }));

    // Let the connect() promise resolve.
    await waitFor(() => expect(MockWebSocketService.instances.length).toBe(1));
    const ws = MockWebSocketService.instances[0];

    act(() => {
      ws.emitBotStatus({ session_id: 's-live', status: 'in_meeting' });
    });

    expect(result.current.botStatuses['s-live'].status).toBe('in_meeting');
  });

  it('WebSocket terminal status clears activeBotSession and fires onAnySessionEnded', async () => {
    const onAnySessionEnded = vi.fn();
    const { result } = renderHook(() => useBotSessionManager({ onAnySessionEnded }));

    await waitFor(() => expect(MockWebSocketService.instances.length).toBe(1));
    const ws = MockWebSocketService.instances[0];

    act(() => {
      result.current.addSession('s-goodbye', 'in_meeting');
      result.current.setActiveBotSession('s-goodbye');
    });

    act(() => {
      ws.emitBotStatus({ session_id: 's-goodbye', status: 'ended' });
    });

    expect(result.current.activeBotSession).toBeNull();
    expect(onAnySessionEnded).toHaveBeenCalledTimes(1);
  });

  it('disconnects the WebSocket on unmount', async () => {
    const { unmount } = renderHook(() => useBotSessionManager());
    await waitFor(() => expect(MockWebSocketService.instances.length).toBe(1));
    const ws = MockWebSocketService.instances[0];

    unmount();
    expect(ws.disconnect).toHaveBeenCalled();
  });
});
