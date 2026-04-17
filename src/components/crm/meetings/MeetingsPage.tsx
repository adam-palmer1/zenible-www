import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePreferences } from '../../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../../services/api/crm/meetingIntelligence';
import appointmentsAPI from '../../../services/api/crm/appointments';
import BotStatusBadge from './BotStatusBadge';
import LiveTranscription from './LiveTranscription';
import MeetingIntelligenceSettingsTab from '../../user-settings/MeetingIntelligenceSettingsTab';
import MeetingDetailView from './MeetingDetailView';
import SendToBoardroomModal from './SendToBoardroomModal';
import AppointmentModal from '../../calendar/AppointmentModal';
import ZMIWebSocketService from '../../../services/ZMIWebSocketService';
import type { AppointmentResponse } from '../../../types';
import type { UpcomingMeeting, MeetingListItem, BotStatus } from '../../../types/meetingIntelligence';

type SubTab = 'upcoming' | 'past' | 'settings';

const PLATFORM_ICONS: Record<string, string> = {
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
};

const MeetingsPage: React.FC = () => {
  const { darkMode } = usePreferences();
  const initialMeetingId = new URLSearchParams(window.location.search).get('meetingId');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(initialMeetingId ? 'past' : 'upcoming');
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBotSession, setActiveBotSession] = useState<string | null>(null);
  const [botStatuses, setBotStatuses] = useState<Record<string, BotStatus>>({});
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [dispatchedAt, setDispatchedAt] = useState<Record<string, number>>({});
  const [joiningElapsed, setJoiningElapsed] = useState<Record<string, number>>({});
  // Map appointment ID → session ID for scoped bot status lookups
  const [appointmentSessions, setAppointmentSessions] = useState<Record<string, string>>({});

  // Fetch active bot sessions from backend on mount so they survive page reload
  useEffect(() => {
    meetingIntelligenceAPI.getActiveBotSessions().then((sessions) => {
      if (sessions.length > 0) {
        setBotStatuses((prev) => {
          const next = { ...prev };
          for (const s of sessions) {
            if (!next[s.session_id]) {
              next[s.session_id] = { session_id: s.session_id, status: s.status } as BotStatus;
            }
          }
          return next;
        });
        // Auto-open transcription panel for the first active in-meeting session
        const inMeeting = sessions.find((s) => s.status === 'in_meeting' || s.status === 'listening');
        if (inMeeting) {
          setActiveBotSession(inMeeting.session_id);
        }
      }
    }).catch(() => { /* active sessions endpoint unavailable */ });
  }, []);

  // Track elapsed time for all active (non-terminal) sessions
  // Also triggers per-second re-renders so live duration (from joined_at) ticks
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setJoiningElapsed((prev) => {
        const next: Record<string, number> = {};
        for (const [sid, bs] of Object.entries(botStatuses)) {
          if (bs.status === 'ended' || bs.status === 'error') continue;
          const startTime = dispatchedAt[sid] || (bs.joined_at ? new Date(bs.joined_at).getTime() : 0);
          if (startTime) {
            next[sid] = Math.floor((now - startTime) / 1000);
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dispatchedAt, botStatuses]);

  // Ref for polling to avoid re-triggering useEffect on every status update
  const botStatusesRef = useRef(botStatuses);
  botStatusesRef.current = botStatuses;
  const dispatchedAtRef = useRef(dispatchedAt);
  dispatchedAtRef.current = dispatchedAt;

  // Track consecutive poll failures per session
  const pollFailuresRef = useRef<Record<string, number>>({});

  // Poll bot status for active (non-terminal) sessions
  useEffect(() => {
    const getActiveSessionIds = () =>
      Object.entries(botStatusesRef.current)
        .filter(([, bs]) => bs.status !== 'ended' && bs.status !== 'error')
        .map(([sid]) => sid);

    const poll = async () => {
      const activeSessionIds = getActiveSessionIds();
      if (activeSessionIds.length === 0) return;
      const now = Date.now();

      for (const sessionId of activeSessionIds) {
        try {
          const status = await meetingIntelligenceAPI.getBotStatus(sessionId) as BotStatus;
          setBotStatuses((prev) => ({ ...prev, [sessionId]: status }));
          pollFailuresRef.current[sessionId] = 0; // reset on success

          // If backend already marked it terminal, clear active session
          if (status.status === 'ended' || status.status === 'error') {
            setActiveBotSession((prev) => prev === sessionId ? null : prev);
          }
        } catch {
          const failures = (pollFailuresRef.current[sessionId] || 0) + 1;
          pollFailuresRef.current[sessionId] = failures;
          // After 3 consecutive failures, mark session as error
          if (failures >= 3) {
            setBotStatuses((prev) => ({
              ...prev,
              [sessionId]: { ...prev[sessionId], status: 'error', error_message: 'Lost contact with bot' } as BotStatus,
            }));
            setActiveBotSession((prev) => prev === sessionId ? null : prev);
            delete pollFailuresRef.current[sessionId];
          }
        }
      }
    };

    // Poll immediately on mount, then every 30s (Socket.IO is primary, polling is fallback)
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time bot status via Socket.IO
  const fetchUpcomingRef = useRef<() => void>(undefined);
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
        if (['ended', 'error'].includes(data.status)) {
          setActiveBotSession((prev) => prev === data.session_id ? null : prev);
          fetchUpcomingRef.current?.();
        }
      },
    });
    ws.connect().catch(() => {});
    return () => ws.disconnect();
  }, []);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Meeting detail view — support deep-link via ?meetingId= query param
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMeetingId, _setSelectedMeetingId] = useState<string | null>(
    searchParams.get('meetingId')
  );
  const setSelectedMeetingId = useCallback((id: string | null) => {
    _setSelectedMeetingId(id);
    // Keep URL in sync: add or remove meetingId param
    setSearchParams(prev => {
      if (id) {
        prev.set('meetingId', id);
      } else {
        prev.delete('meetingId');
      }
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  // Edit appointment modal
  const [editAppointment, setEditAppointment] = useState<AppointmentResponse | null>(null);
  const [editOccurrenceDate, setEditOccurrenceDate] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingAppointment, setLoadingAppointment] = useState<string | null>(null);

  // Quick dispatch
  const [quickLink, setQuickLink] = useState('');
  const [quickDispatching, setQuickDispatching] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  // History actions
  const [actionMenuMeetingId, setActionMenuMeetingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renamingMeetingId, setRenamingMeetingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showOnlyWithLinks, setShowOnlyWithLinks] = useState(false);
  const [boardroomMeeting, setBoardroomMeeting] = useState<{ id: string; title: string } | null>(null);

  const fetchUpcoming = useCallback(async () => {
    try {
      const data = await meetingIntelligenceAPI.getUpcoming() as UpcomingMeeting[];
      setUpcomingMeetings(data);
    } catch (err: unknown) {
      // Feature may not be available
      if (!(err instanceof Error && (err.message.includes('402') || err.message.includes('not included')))) {
        setError(err instanceof Error ? err.message : 'Failed to load meetings');
      }
    }
  }, []);
  fetchUpcomingRef.current = fetchUpcoming;

  const fetchPast = useCallback(async (params?: { search?: string; date_from?: string; date_to?: string }) => {
    try {
      const data = await meetingIntelligenceAPI.listMeetings(params) as MeetingListItem[];
      setPastMeetings(data);
    } catch {
      // Silently fail for past meetings
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUpcoming(), fetchPast()]).finally(() => setLoading(false));
  }, [fetchUpcoming, fetchPast]);

  // Seed botStatuses from server data so polling picks up already-dispatched sessions
  useEffect(() => {
    for (const meeting of upcomingMeetings) {
      if (meeting.bot_session_id && meeting.bot_dispatch_status && !['ended', 'error', 'failed', 'completed'].includes(meeting.bot_dispatch_status)) {
        const sid = meeting.bot_session_id;
        if (!botStatuses[sid]) {
          const seedStatus = meeting.bot_status || 'joining';
          setBotStatuses((prev) => {
            if (prev[sid]) return prev;
            return { ...prev, [sid]: { session_id: sid, status: seedStatus } as BotStatus };
          });
          setDispatchedAt((prev) => {
            if (prev[sid]) return prev;
            return { ...prev, [sid]: Date.now() };
          });
        }
      }
    }
  }, [upcomingMeetings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const triggerSearch = useCallback(() => {
    const params: { search?: string; date_from?: string; date_to?: string } = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    fetchPast(Object.keys(params).length > 0 ? params : undefined);
    setSelectedMeetingIds(new Set());
  }, [searchQuery, dateFrom, dateTo, fetchPast]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(triggerSearch, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, triggerSearch]);

  // Date filters trigger immediate search
  useEffect(() => {
    triggerSearch();
  }, [dateFrom, dateTo]);

  const MAX_ACTIVE_BOTS = 3;
  const activeBotCount = Object.values(botStatuses).filter(
    (bs) => bs.status !== 'ended' && bs.status !== 'error'
  ).length;

  const handleDispatchBot = async (appointmentId: string, instanceStartDatetime?: string) => {
    if (activeBotCount >= MAX_ACTIVE_BOTS) {
      setError(`Maximum ${MAX_ACTIVE_BOTS} active bots allowed. Stop an existing bot first.`);
      return;
    }
    try {
      setDispatching(appointmentId);
      setError(null);
      const result = await meetingIntelligenceAPI.dispatchBot(appointmentId, instanceStartDatetime) as { session_id: string; status: string };
      setActiveBotSession(result.session_id);
      setDispatchedAt((prev) => ({ ...prev, [result.session_id]: Date.now() }));
      setBotStatuses((prev) => ({
        ...prev,
        [result.session_id]: { session_id: result.session_id, status: result.status } as BotStatus,
      }));
      setAppointmentSessions((prev) => ({ ...prev, [appointmentId]: result.session_id }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch bot');
    } finally {
      setDispatching(null);
    }
  };

  const handleLeaveBot = async (sessionId: string) => {
    try {
      await meetingIntelligenceAPI.leaveBot(sessionId);
      setBotStatuses((prev) => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], status: 'ended' } as BotStatus,
      }));
      if (activeBotSession === sessionId) {
        setActiveBotSession(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to stop bot');
    }
  };

  const handleRetryBot = async (appointmentId: string) => {
    try {
      setRetrying(appointmentId);
      setError(null);
      const result = await meetingIntelligenceAPI.retryBot(appointmentId) as { session_id: string; status: string };
      if (result.session_id) {
        setActiveBotSession(result.session_id);
        setBotStatuses((prev) => ({
          ...prev,
          [result.session_id]: { session_id: result.session_id, status: result.status } as BotStatus,
        }));
        setAppointmentSessions((prev) => ({ ...prev, [appointmentId]: result.session_id }));
      }
      fetchUpcoming();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retry bot');
    } finally {
      setRetrying(null);
    }
  };

  // Open edit modal for an upcoming meeting
  const handleMeetingClick = async (meeting: UpcomingMeeting) => {
    try {
      setLoadingAppointment(meeting.id);
      const appointmentId = meeting.parent_appointment_id || meeting.id;
      const queryParams: Record<string, string> = meeting.parent_appointment_id
        ? { occurrence_date: meeting.start_datetime }
        : {};
      const appointment = await appointmentsAPI.get<AppointmentResponse>(appointmentId, queryParams);
      setEditAppointment(appointment);
      setEditOccurrenceDate(meeting.parent_appointment_id ? meeting.start_datetime : null);
      setShowEditModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment');
    } finally {
      setLoadingAppointment(null);
    }
  };

  const handleEditSave = async (data: Record<string, unknown>) => {
    if (!editAppointment) return;
    const queryParams: Record<string, string> = editOccurrenceDate ? { occurrence_date: editOccurrenceDate } : {};
    await appointmentsAPI.update(editAppointment.id, data, queryParams);
    setShowEditModal(false);
    setEditAppointment(null);
    setEditOccurrenceDate(null);
    fetchUpcoming();
  };

  const handleEditDelete = (appointment: { id: string }) => {
    const queryParams: Record<string, string> = editOccurrenceDate ? { occurrence_date: editOccurrenceDate } : {};
    appointmentsAPI.delete(appointment.id, queryParams).then(() => {
      setShowEditModal(false);
      setEditAppointment(null);
      setEditOccurrenceDate(null);
      fetchUpcoming();
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
    });
  };

  // Close action menu on outside click
  useEffect(() => {
    if (!actionMenuMeetingId) return;
    const handleClick = () => setActionMenuMeetingId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [actionMenuMeetingId]);

  // History actions
  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await meetingIntelligenceAPI.deleteMeeting(meetingId);
      setPastMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete meeting');
      setDeleteConfirmId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMeetingIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await meetingIntelligenceAPI.bulkDeleteMeetings(Array.from(selectedMeetingIds));
      setPastMeetings((prev) => prev.filter((m) => !selectedMeetingIds.has(m.id)));
      setSelectedMeetingIds(new Set());
      setBulkDeleteConfirm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete meetings');
      setBulkDeleteConfirm(false);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleRenameStart = (meeting: MeetingListItem) => {
    setRenamingMeetingId(meeting.id);
    setRenameValue(meeting.title || '');
    setActionMenuMeetingId(null);
  };

  const handleRenameSubmit = async (meetingId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingMeetingId(null);
      return;
    }
    try {
      await meetingIntelligenceAPI.renameMeeting(meetingId, trimmed);
      setPastMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, title: trimmed } : m))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to rename meeting');
    }
    setRenamingMeetingId(null);
  };

  // Quick dispatch bot to a meeting link
  const handleQuickDispatch = async () => {
    const link = quickLink.trim();
    if (!link) return;

    if (activeBotCount >= MAX_ACTIVE_BOTS) {
      setQuickError(`Maximum ${MAX_ACTIVE_BOTS} active bots allowed. Stop an existing bot first.`);
      return;
    }

    setQuickDispatching(true);
    setQuickError(null);
    setQuickSuccess(null);

    try {
      // Dispatch bot directly to the meeting link (no appointment created)
      const result = await meetingIntelligenceAPI.dispatchBotToLink(link) as { session_id: string; status: string };
      setActiveBotSession(result.session_id);
      setDispatchedAt((prev) => ({ ...prev, [result.session_id]: Date.now() }));
      setBotStatuses((prev) => ({
        ...prev,
        [result.session_id]: { session_id: result.session_id, status: result.status } as BotStatus,
      }));
      setQuickLink('');
      setQuickSuccess('Bot dispatched successfully');
      setTimeout(() => setQuickSuccess(null), 3000);
    } catch (err: unknown) {
      setQuickError(err instanceof Error ? err.message : 'Failed to dispatch bot');
    } finally {
      setQuickDispatching(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  /** If the title is auto-generated (e.g. "Meeting 2026-03-31 15:50" in UTC),
   *  replace it with local-time formatting from start_time. */
  const getMeetingDisplayTitle = (meeting: MeetingListItem) => {
    if (!meeting.title) return 'Untitled Meeting';
    // Detect auto-generated titles: "Meeting YYYY-MM-DD HH:MM"
    if (/^Meeting \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(meeting.title) && meeting.start_time) {
      return `Meeting ${new Date(meeting.start_time).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }
    return meeting.title;
  };

  const subTabs: { id: SubTab; label: string }[] = [
    { id: 'upcoming', label: 'Your Meetings' },
    { id: 'past', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className={`flex gap-1 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id);
              if (tab.id !== 'past') setSelectedMeetingId(null);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === tab.id
                ? 'border-zenible-primary text-zenible-primary'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Active bot sessions status bar */}
      {activeBotCount > 0 && (
        <div className="space-y-2">
          {Object.values(botStatuses)
            .filter((bs) => bs.status !== 'ended' && bs.status !== 'error')
            .map((bs) => {
              const elapsed = joiningElapsed[bs.session_id];
              const isJoining = bs.status === 'joining' || bs.status === 'scheduling' || bs.status === 'waiting_room';
              const isLeaving = bs.status === 'leaving';
              const isActive = bs.status === 'in_meeting' || bs.status === 'listening';
              const elapsedStr = elapsed != null
                ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
                : null;
              const durationSecs = bs.duration_s > 0 ? bs.duration_s : null;
              const durationStr = durationSecs != null
                ? `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`
                : null;
              const participants = bs.participant_count > 1 ? bs.participant_count - 1 : 0;
              const platformLabel = bs.platform ? (PLATFORM_ICONS[bs.platform] || bs.platform) : null;
              return (
                <div
                  key={bs.session_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BotStatusBadge status={bs.status} />
                    {isActive && platformLabel && (
                      <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        {platformLabel}
                      </span>
                    )}
                    {isActive && participants > 0 && (
                      <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        {participants} participant{participants !== 1 ? 's' : ''}
                      </span>
                    )}
                    {isActive && durationStr && (
                      <span className={`text-xs tabular-nums ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        {durationStr}
                      </span>
                    )}
                    {elapsedStr && !isActive && (
                      <span className={`text-xs tabular-nums ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        {elapsedStr}
                      </span>
                    )}
                    {/* Contextual messages — only during joining */}
                    {isJoining && elapsed != null && elapsed > 180 && (
                      <span className="text-xs text-red-500">Bot may have failed to join. Try removing and re-dispatching.</span>
                    )}
                    {isJoining && elapsed != null && elapsed > 90 && elapsed <= 180 && (
                      <span className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Taking longer than expected...</span>
                    )}
                    {isLeaving && (
                      <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Bot is leaving the meeting...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isLeaving && (
                      <button
                        onClick={() => handleLeaveBot(bs.session_id)}
                        className="text-xs px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        Remove Bot
                      </button>
                    )}
                    {isActive && (
                      <button
                        onClick={() => setActiveBotSession(
                          activeBotSession === bs.session_id ? null : bs.session_id
                        )}
                        className="text-xs px-3 py-1.5 rounded bg-zenible-primary text-white hover:opacity-90"
                      >
                        Transcription
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Live transcription panel */}
      {activeBotSession && (
        <LiveTranscription
          sessionId={activeBotSession}
          onClose={() => setActiveBotSession(null)}
        />
      )}

      {/* Tab content */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-3">
          {/* Quick dispatch box */}
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
            <label className={`text-xs font-medium mb-2 block ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Send bot to a meeting now
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickLink}
                onChange={(e) => { setQuickLink(e.target.value); setQuickError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickDispatch(); }}
                placeholder="Paste a meeting link (Teams, Zoom, Google Meet...)"
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              <button
                onClick={handleQuickDispatch}
                disabled={quickDispatching || !quickLink.trim() || activeBotCount >= MAX_ACTIVE_BOTS}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  quickDispatching || !quickLink.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-zenible-primary text-white hover:opacity-90'
                }`}
              >
                {quickDispatching ? 'Sending...' : 'Send Bot'}
              </button>
            </div>
            {quickError && (
              <p className="text-xs text-red-500 mt-1">{quickError}</p>
            )}
            {quickSuccess && (
              <p className="text-xs text-green-500 mt-1">{quickSuccess}</p>
            )}
          </div>

          {/* Filter toggle */}
          <label className={`flex items-center gap-2 text-sm cursor-pointer ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
            <input
              type="checkbox"
              checked={showOnlyWithLinks}
              onChange={(e) => setShowOnlyWithLinks(e.target.checked)}
              className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
            />
            Only show meetings with links
          </label>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary" />
            </div>
          ) : (() => {
            const filtered = showOnlyWithLinks ? upcomingMeetings.filter(m => m.meeting_link) : upcomingMeetings;
            return filtered.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              <p className="text-lg">{showOnlyWithLinks ? 'No meetings with links' : 'No upcoming meetings'}</p>
              <p className="text-sm mt-1">{showOnlyWithLinks ? 'Try disabling the filter above' : 'Create an appointment to get started'}</p>
            </div>
          ) : (
            filtered.map((meeting) => {
              // Look up bot session scoped to THIS meeting
              const meetingSessionId = appointmentSessions[meeting.id] || meeting.bot_session_id;
              const sessionEntry = meetingSessionId ? botStatuses[meetingSessionId] : undefined;
              const activeSession = sessionEntry && sessionEntry.status !== 'ended' && sessionEntry.status !== 'error' ? sessionEntry : undefined;
              const meetingNotEnded = meeting.end_datetime && new Date(meeting.end_datetime) > new Date();
              const showResend = !activeSession && meetingNotEnded && meeting.meeting_link && (
                meeting.bot_dispatch_status === 'failed' ||
                (sessionEntry && ['ended', 'error'].includes(sessionEntry.status))
              );
              const showStartBot = meeting.meeting_link && !activeSession && !showResend && meeting.bot_dispatch_status !== 'failed';
              return (
                <div
                  key={meeting.id}
                  onClick={() => handleMeetingClick(meeting)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                    showStartBot
                      ? `border-2 ${darkMode ? 'border-zenible-primary/60 bg-zenible-dark-card hover:border-zenible-primary' : 'border-zenible-primary/40 bg-white hover:border-zenible-primary'}`
                      : `border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border hover:border-zenible-primary/50' : 'bg-white border-gray-200 hover:border-zenible-primary/50'}`
                  } ${loadingAppointment === meeting.id ? 'opacity-60' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {meeting.title}
                      </h4>
                      {meeting.platform && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-gray-100 text-gray-600'}`}>
                          {PLATFORM_ICONS[meeting.platform] || meeting.platform}
                        </span>
                      )}
                      {/* Bot dispatch source badges */}
                      {meeting.bot_dispatch_source === 'invited' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Invited &amp; Accepted</span>
                      )}
                      {meeting.bot_dispatch_source === 'auto' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Auto-joining</span>
                      )}
                      {/* Bot dispatch status badges */}
                      {meeting.bot_dispatch_status === 'pending' && !meeting.bot_dispatch_source && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Bot scheduled</span>
                      )}
                      {meeting.bot_dispatch_status === 'skipped' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`} title={meeting.bot_dispatch_error || 'Skipped'}>
                          Skipped
                        </span>
                      )}
                      {meeting.bot_dispatch_status === 'failed' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700" title={meeting.bot_dispatch_error || 'Failed'}>
                          Failed
                        </span>
                      )}
                      {/* Subtle auto-join indicator when no dispatch yet but ZMI enabled */}
                      {!meeting.bot_dispatch_status && !meeting.bot_dispatch_source && meeting.zmi_enabled !== false && meeting.zmi_enabled !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>Will auto-join</span>
                      )}
                      {meeting.zmi_enabled === false && !meeting.bot_dispatch_source && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">ZMI Off</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      {(() => {
                        const start = new Date(meeting.start_datetime);
                        const end = new Date(meeting.end_datetime);
                        const sameDay = start.toDateString() === end.toDateString();
                        const startStr = start.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
                        if (sameDay) {
                          const endTime = end.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
                          return `${startStr} - ${endTime}`;
                        }
                        return `${startStr} - ${formatTime(meeting.end_datetime)}`;
                      })()}
                    </p>
                  </div>
                  {meeting.meeting_link && (
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {activeSession ? (
                      <BotStatusBadge status={activeSession.status} />
                    ) : showResend ? (
                      <button
                        onClick={() => handleRetryBot(meeting.id)}
                        disabled={retrying === meeting.id}
                        className={`text-xs px-3 py-1.5 rounded bg-orange-500 text-white hover:bg-orange-600 ${retrying === meeting.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {retrying === meeting.id ? 'Resending...' : 'Resend Bot'}
                      </button>
                    ) : showStartBot ? (
                      <button
                        onClick={() => handleDispatchBot(
                          meeting.parent_appointment_id || meeting.id,
                          meeting.parent_appointment_id ? meeting.start_datetime : undefined,
                        )}
                        disabled={dispatching === meeting.id || meeting.zmi_enabled === false || activeBotCount >= MAX_ACTIVE_BOTS}
                        className={`text-xs px-3 py-1.5 rounded transition-colors ${
                          meeting.zmi_enabled === false
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-zenible-primary text-white hover:opacity-90'
                        } ${dispatching === meeting.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {dispatching === meeting.id ? 'Starting...' : 'Start Bot'}
                      </button>
                    ) : null}
                  </div>
                  )}
                </div>
              );
            })
          );
          })()}
        </div>
      )}

      {activeSubTab === 'past' && (
        selectedMeetingId ? (
          <MeetingDetailView
            meetingId={selectedMeetingId}
            onBack={() => {
              setSelectedMeetingId(null);
              triggerSearch();
            }}
          />
        ) : (
          <div className="space-y-3">
            {/* Search, filter bar + refresh */}
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meetings..."
                className={`flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border ${
                  darkMode
                    ? 'bg-zenible-dark-card border-zenible-dark-border text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              <div className="flex items-center gap-2">
                <label className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`px-2 py-2 text-sm rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-card border-zenible-dark-border text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <label className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`px-2 py-2 text-sm rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-card border-zenible-dark-border text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                {(searchQuery || dateFrom || dateTo) && (
                  <button
                    onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); }}
                    className={`text-xs px-2 py-1 rounded ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={triggerSearch}
                  title="Refresh"
                  className={`p-2 rounded-lg border transition-colors ${
                    darkMode
                      ? 'border-zenible-dark-border text-zenible-dark-text-secondary hover:text-white hover:border-zenible-primary/50'
                      : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:border-zenible-primary/50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Past meetings table */}
            {pastMeetings.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                <p>{searchQuery || dateFrom || dateTo ? 'No meetings match your search' : 'No past meetings recorded yet'}</p>
              </div>
            ) : (
              <>
              {selectedMeetingIds.size > 0 && (
                <div className={`flex items-center gap-3 mb-2 px-3 py-2 rounded-lg border ${
                  darkMode ? 'bg-zenible-dark-border/30 border-zenible-dark-border' : 'bg-blue-50 border-blue-200'
                }`}>
                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    {selectedMeetingIds.size} selected
                  </span>
                  <button
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedMeetingIds(new Set())}
                    className={`text-sm px-3 py-1 rounded border ${
                      darkMode ? 'border-zenible-dark-border text-zenible-dark-text-secondary hover:text-white' : 'border-gray-300 text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className={`rounded-lg border ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                <table className="w-full">
                  <thead>
                    <tr className={darkMode ? 'bg-zenible-dark-border/50' : 'bg-gray-50'}>
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={pastMeetings.length > 0 && selectedMeetingIds.size === pastMeetings.length}
                          ref={(el) => { if (el) el.indeterminate = selectedMeetingIds.size > 0 && selectedMeetingIds.size < pastMeetings.length; }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMeetingIds(new Set(pastMeetings.map((m) => m.id)));
                            } else {
                              setSelectedMeetingIds(new Set());
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary cursor-pointer"
                        />
                      </th>
                      <th className={`text-left text-xs font-medium px-4 py-2.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Time</th>
                      <th className={`text-left text-xs font-medium px-4 py-2.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Meeting</th>
                      <th className={`text-left text-xs font-medium px-4 py-2.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Duration</th>
                      <th className={`text-right text-xs font-medium px-4 py-2.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-100'}`}>
                    {pastMeetings.map((meeting) => (
                      <tr
                        key={meeting.id}
                        onClick={() => setSelectedMeetingId(meeting.id)}
                        className={`cursor-pointer transition-colors ${
                          darkMode
                            ? 'bg-zenible-dark-card hover:bg-zenible-dark-border/30'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedMeetingIds.has(meeting.id)}
                            onChange={(e) => {
                              setSelectedMeetingIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) {
                                  next.add(meeting.id);
                                } else {
                                  next.delete(meeting.id);
                                }
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary cursor-pointer"
                          />
                        </td>
                        <td className={`px-4 py-3 text-xs whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          {meeting.start_time ? formatTime(meeting.start_time) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {renamingMeetingId === meeting.id ? (
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameSubmit(meeting.id);
                                  if (e.key === 'Escape') setRenamingMeetingId(null);
                                }}
                                onBlur={() => handleRenameSubmit(meeting.id)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className={`px-2 py-0.5 text-sm rounded border w-full max-w-xs ${
                                  darkMode
                                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            ) : (
                              getMeetingDisplayTitle(meeting)
                            )}
                            {meeting.has_video_recording && (
                              <span className={`ml-2 inline-flex items-center text-xs px-1.5 py-0.5 rounded ${
                                darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'
                              }`} title="Has video recording">
                                <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                              </span>
                            )}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          {meeting.duration_ms != null && meeting.duration_ms > 0
                            ? `${Math.round(meeting.duration_ms / 60000)} min`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setActionMenuMeetingId(actionMenuMeetingId === meeting.id ? null : meeting.id)}
                              className={`p-1 rounded hover:bg-opacity-20 ${
                                darkMode ? 'text-zenible-dark-text-secondary hover:bg-white' : 'text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="4" r="1.5" />
                                <circle cx="10" cy="10" r="1.5" />
                                <circle cx="10" cy="16" r="1.5" />
                              </svg>
                            </button>
                            {actionMenuMeetingId === meeting.id && (
                              <div className={`absolute right-0 top-8 z-20 w-48 rounded-lg border shadow-lg py-1 ${
                                darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
                              }`}>
                                <button
                                  onClick={() => handleRenameStart(meeting)}
                                  className={`w-full text-left px-3 py-2 text-sm ${
                                    darkMode ? 'text-white hover:bg-zenible-dark-border' : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  Rename
                                </button>
                                {meeting.is_processed && (
                                  <button
                                    onClick={() => {
                                      setBoardroomMeeting({ id: meeting.id, title: meeting.title || 'Untitled Meeting' });
                                      setActionMenuMeetingId(null);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm ${
                                      darkMode ? 'text-white hover:bg-zenible-dark-border' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    Send to Boardroom
                                  </button>
                                )}
                                <button
                                  onClick={() => { setDeleteConfirmId(meeting.id); setActionMenuMeetingId(null); }}
                                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}

            {/* Delete confirmation modal */}
            {deleteConfirmId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className={`rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete Meeting</h3>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Are you sure you want to delete this meeting? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className={`px-3 py-1.5 text-sm rounded-lg border ${
                        darkMode ? 'border-zenible-dark-border text-zenible-dark-text-secondary hover:text-white' : 'border-gray-300 text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteMeeting(deleteConfirmId)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk delete confirmation modal */}
            {bulkDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className={`rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete {selectedMeetingIds.size} Meeting{selectedMeetingIds.size !== 1 ? 's' : ''}</h3>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Are you sure you want to delete {selectedMeetingIds.size} meeting{selectedMeetingIds.size !== 1 ? 's' : ''}? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setBulkDeleteConfirm(false)}
                      disabled={bulkDeleting}
                      className={`px-3 py-1.5 text-sm rounded-lg border ${
                        darkMode ? 'border-zenible-dark-border text-zenible-dark-text-secondary hover:text-white' : 'border-gray-300 text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className={`px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 ${bulkDeleting ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {bulkDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {activeSubTab === 'settings' && <MeetingIntelligenceSettingsTab />}

      {/* Send to Boardroom Modal */}
      {boardroomMeeting && (
        <SendToBoardroomModal
          meetingId={boardroomMeeting.id}
          meetingTitle={boardroomMeeting.title}
          onClose={() => setBoardroomMeeting(null)}
        />
      )}

      {/* Edit Appointment Modal */}
      <AppointmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditAppointment(null);
          setEditOccurrenceDate(null);
        }}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        appointment={editAppointment}
      />
    </div>
  );
};

export default MeetingsPage;
