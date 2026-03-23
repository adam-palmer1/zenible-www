import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePreferences } from '../../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../../services/api/crm/meetingIntelligence';
import appointmentsAPI from '../../../services/api/crm/appointments';
import BotStatusBadge from './BotStatusBadge';
import LiveTranscription from './LiveTranscription';
import MeetingIntelligenceSettingsTab from '../../user-settings/MeetingIntelligenceSettingsTab';
import MeetingDetailView from './MeetingDetailView';
import AppointmentModal from '../../calendar/AppointmentModal';
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
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('upcoming');
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

  // Track elapsed time for all active (non-terminal) sessions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setJoiningElapsed((prev) => {
        const next: Record<string, number> = {};
        for (const [sid, startTime] of Object.entries(dispatchedAt)) {
          const status = botStatuses[sid]?.status;
          if (status && status !== 'ended' && status !== 'error') {
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

  // Poll bot status for active (non-terminal) sessions
  useEffect(() => {
    const getActiveSessionIds = () =>
      Object.entries(botStatusesRef.current)
        .filter(([, bs]) => bs.status !== 'ended' && bs.status !== 'error')
        .map(([sid]) => sid);

    const poll = async () => {
      const activeSessionIds = getActiveSessionIds();
      if (activeSessionIds.length === 0) return;
      for (const sessionId of activeSessionIds) {
        try {
          const status = await meetingIntelligenceAPI.getBotStatus(sessionId) as BotStatus;
          setBotStatuses((prev) => ({ ...prev, [sessionId]: status }));
        } catch {
          // Don't immediately mark as error — could be a transient network issue.
          // Keep the last known status; the backend stale-session detection handles real failures.
        }
      }
    };

    // Poll immediately on mount, then every 5s
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Meeting detail view
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  // Edit appointment modal
  const [editAppointment, setEditAppointment] = useState<AppointmentResponse | null>(null);
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
  const [showOnlyWithLinks, setShowOnlyWithLinks] = useState(false);

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
      if (meeting.bot_dispatch_status === 'dispatched' && meeting.bot_session_id) {
        const sid = meeting.bot_session_id;
        if (!botStatuses[sid]) {
          setBotStatuses((prev) => {
            if (prev[sid]) return prev;
            return { ...prev, [sid]: { session_id: sid, status: 'joining' } as BotStatus };
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

  const handleDispatchBot = async (appointmentId: string) => {
    if (activeBotCount >= MAX_ACTIVE_BOTS) {
      setError(`Maximum ${MAX_ACTIVE_BOTS} active bots allowed. Stop an existing bot first.`);
      return;
    }
    try {
      setDispatching(appointmentId);
      setError(null);
      const result = await meetingIntelligenceAPI.dispatchBot(appointmentId) as { session_id: string; status: string };
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
      const appointment = await appointmentsAPI.get<AppointmentResponse>(meeting.id);
      setEditAppointment(appointment);
      setShowEditModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment');
    } finally {
      setLoadingAppointment(null);
    }
  };

  const handleEditSave = async (data: Record<string, unknown>) => {
    if (!editAppointment) return;
    await appointmentsAPI.update(editAppointment.id, data);
    setShowEditModal(false);
    setEditAppointment(null);
    fetchUpcoming();
  };

  const handleEditDelete = (appointment: { id: string }) => {
    appointmentsAPI.delete(appointment.id).then(() => {
      setShowEditModal(false);
      setEditAppointment(null);
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
              const isJoining = bs.status === 'joining' || bs.status === 'scheduling';
              const isLeaving = bs.status === 'leaving';
              const isActive = bs.status === 'in_meeting' || bs.status === 'listening';
              const elapsedStr = elapsed != null
                ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
                : null;
              return (
                <div
                  key={bs.session_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BotStatusBadge status={bs.status} />
                    {elapsedStr && (
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
              const showStartBot = meeting.meeting_link && !activeSession && meeting.bot_dispatch_status !== 'failed';
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
                      {formatTime(meeting.start_datetime)} - {formatTime(meeting.end_datetime)}
                    </p>
                  </div>
                  {meeting.meeting_link && (
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {activeSession ? (
                      <BotStatusBadge status={activeSession.status} />
                    ) : meeting.bot_dispatch_status === 'failed' ? (
                      <button
                        onClick={() => handleRetryBot(meeting.id)}
                        disabled={retrying === meeting.id}
                        className={`text-xs px-3 py-1.5 rounded bg-orange-500 text-white hover:bg-orange-600 ${retrying === meeting.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {retrying === meeting.id ? 'Retrying...' : 'Retry'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDispatchBot(meeting.id)}
                        disabled={dispatching === meeting.id || meeting.zmi_enabled === false || activeBotCount >= MAX_ACTIVE_BOTS}
                        className={`text-xs px-3 py-1.5 rounded transition-colors ${
                          meeting.zmi_enabled === false
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-zenible-primary text-white hover:opacity-90'
                        } ${dispatching === meeting.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {dispatching === meeting.id ? 'Starting...' : 'Start Bot'}
                      </button>
                    )}
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
              <div className={`rounded-lg border overflow-hidden ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                <table className="w-full">
                  <thead>
                    <tr className={darkMode ? 'bg-zenible-dark-border/50' : 'bg-gray-50'}>
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
                              meeting.title || 'Untitled Meeting'
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
                              <div className={`absolute right-0 top-8 z-20 w-36 rounded-lg border shadow-lg py-1 ${
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
          </div>
        )
      )}

      {activeSubTab === 'settings' && <MeetingIntelligenceSettingsTab />}

      {/* Edit Appointment Modal */}
      <AppointmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditAppointment(null);
        }}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        appointment={editAppointment}
      />
    </div>
  );
};

export default MeetingsPage;
