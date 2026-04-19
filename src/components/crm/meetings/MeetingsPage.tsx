import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePreferences } from '../../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../../services/api/crm/meetingIntelligence';
import appointmentsAPI from '../../../services/api/crm/appointments';
import ActiveBotSessionsBar from './ActiveBotSessionsBar';
import LiveTranscription from './LiveTranscription';
import UpcomingMeetingsTab from './UpcomingMeetingsTab';
import PastMeetingsTab from './PastMeetingsTab';
import MeetingIntelligenceSettingsTab from '../../user-settings/MeetingIntelligenceSettingsTab';
import MeetingDetailView from './MeetingDetailView';
import SendToBoardroomModal from './SendToBoardroomModal';
import AppointmentModal from '../../calendar/AppointmentModal';
import { useBotSessionManager, MAX_ACTIVE_BOTS } from '../../../hooks/crm/useBotSessionManager';
import logger from '../../../utils/logger';
import type { AppointmentResponse } from '../../../types';
import type { UpcomingMeeting, MeetingListItem } from '../../../types/meetingIntelligence';

type SubTab = 'upcoming' | 'past' | 'settings';

const MeetingsPage: React.FC = () => {
  const { darkMode } = usePreferences();
  const initialMeetingId = new URLSearchParams(window.location.search).get('meetingId');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(initialMeetingId ? 'past' : 'upcoming');
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  // WebSocket needs a way to refresh the upcoming list when a bot session ends.
  const fetchUpcomingRef = useRef<() => void>(undefined);
  const {
    activeBotSession,
    setActiveBotSession,
    botStatuses,
    dispatchedAt,
    appointmentSessions,
    activeBotCount,
    addSession,
    markEnded,
    seedFromUpcomingMeetings,
  } = useBotSessionManager({
    onAnySessionEnded: () => fetchUpcomingRef.current?.(),
  });

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

  // History actions
  const [actionMenuMeetingId, setActionMenuMeetingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renamingMeetingId, setRenamingMeetingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [boardroomMeeting, setBoardroomMeeting] = useState<{ id: string; title: string } | null>(null);

  // Infinite scroll state for past meetings
  const BATCH_DAYS = 30;
  const [pastHasMore, setPastHasMore] = useState(true);
  const [pastLoadingMore, setPastLoadingMore] = useState(false);
  const [pastBatchEnd, setPastBatchEnd] = useState<string | null>(null); // oldest date_from loaded so far
  const sentinelRef = useRef<HTMLDivElement>(null);

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
    // If user has manual filters, fetch with those exact params (no batching)
    if (params && Object.keys(params).length > 0) {
      try {
        const data = await meetingIntelligenceAPI.listMeetings(params) as MeetingListItem[];
        setPastMeetings(data);
        setPastHasMore(false); // manual filter = no infinite scroll
        setPastBatchEnd(null);
      } catch (err) {
        logger.error('[MeetingsPage] Failed to list filtered meetings:', err);
      }
      return;
    }

    // Default: load last 30 days
    const now = new Date();
    const batchStart = new Date(now);
    batchStart.setDate(batchStart.getDate() - BATCH_DAYS);
    const dateTo = now.toISOString().slice(0, 10);
    const dateFrom = batchStart.toISOString().slice(0, 10);
    try {
      const data = await meetingIntelligenceAPI.listMeetings({ date_from: dateFrom, date_to: dateTo }) as MeetingListItem[];
      setPastMeetings(data);
      setPastBatchEnd(dateFrom);
      setPastHasMore(true); // assume more until proven otherwise
    } catch (err) {
      logger.error('[MeetingsPage] Failed to list recent meetings:', err);
    }
  }, []);

  const fetchMorePast = useCallback(async () => {
    if (!pastBatchEnd || pastLoadingMore || !pastHasMore) return;
    setPastLoadingMore(true);
    try {
      const batchEndDate = new Date(pastBatchEnd);
      const newEnd = new Date(batchEndDate);
      newEnd.setDate(newEnd.getDate() - 1); // day before current batch start
      const newStart = new Date(newEnd);
      newStart.setDate(newStart.getDate() - BATCH_DAYS);
      const dateTo = newEnd.toISOString().slice(0, 10);
      const dateFrom = newStart.toISOString().slice(0, 10);
      const data = await meetingIntelligenceAPI.listMeetings({ date_from: dateFrom, date_to: dateTo }) as MeetingListItem[];
      if (data.length === 0) {
        setPastHasMore(false);
      } else {
        setPastMeetings((prev) => [...prev, ...data]);
        setPastBatchEnd(dateFrom);
      }
    } catch (err) {
      logger.error('[MeetingsPage] Failed to load more meetings:', err);
    }
    setPastLoadingMore(false);
  }, [pastBatchEnd, pastLoadingMore, pastHasMore]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUpcoming(), fetchPast()]).finally(() => setLoading(false));
  }, [fetchUpcoming, fetchPast]);

  // Seed botStatuses from server data so polling picks up already-dispatched sessions.
  useEffect(() => {
    seedFromUpcomingMeetings(upcomingMeetings);
  }, [upcomingMeetings, seedFromUpcomingMeetings]);

  // Debounced search
  const triggerSearch = useCallback(() => {
    const params: { search?: string; date_from?: string; date_to?: string } = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    fetchPast(Object.keys(params).length > 0 ? params : undefined);
    setSelectedMeetingIds(new Set());
  }, [searchQuery, dateFrom, dateTo, fetchPast]);

  // Infinite scroll observer for past meetings
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !pastHasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchMorePast(); },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pastHasMore, fetchMorePast]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(triggerSearch, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, triggerSearch]);

  // Date filters trigger immediate search
  useEffect(() => {
    triggerSearch();
  }, [dateFrom, dateTo]);

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
      addSession(result.session_id, result.status as never, appointmentId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch bot');
    } finally {
      setDispatching(null);
    }
  };

  const handleLeaveBot = async (sessionId: string) => {
    try {
      await meetingIntelligenceAPI.leaveBot(sessionId);
      markEnded(sessionId);
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
        addSession(result.session_id, result.status as never, appointmentId);
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

  // Dispatch a bot to a standalone meeting link (no appointment). Return shape
  // matches what UpcomingMeetingsTab expects so it can render its own status UI.
  const handleQuickDispatch = async (link: string): Promise<{ ok: boolean; message: string }> => {
    try {
      const result = await meetingIntelligenceAPI.dispatchBotToLink(link) as { session_id: string; status: string };
      setActiveBotSession(result.session_id);
      addSession(result.session_id, result.status as never);
      return { ok: true, message: 'Bot dispatched successfully' };
    } catch (err: unknown) {
      return { ok: false, message: err instanceof Error ? err.message : 'Failed to dispatch bot' };
    }
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

      <ActiveBotSessionsBar
        botStatuses={botStatuses}
        dispatchedAt={dispatchedAt}
        activeBotSession={activeBotSession}
        onToggleTranscription={(sid) => setActiveBotSession(activeBotSession === sid ? null : sid)}
        onLeaveBot={handleLeaveBot}
      />


      {/* Live transcription panel */}
      {activeBotSession && (
        <LiveTranscription
          sessionId={activeBotSession}
          onClose={() => setActiveBotSession(null)}
        />
      )}

      {/* Tab content */}
      {activeSubTab === 'upcoming' && (
        <UpcomingMeetingsTab
          loading={loading}
          upcomingMeetings={upcomingMeetings}
          botStatuses={botStatuses}
          appointmentSessions={appointmentSessions}
          activeBotCount={activeBotCount}
          maxActiveBots={MAX_ACTIVE_BOTS}
          loadingAppointment={loadingAppointment}
          dispatching={dispatching}
          retrying={retrying}
          onQuickDispatch={handleQuickDispatch}
          onMeetingClick={handleMeetingClick}
          onDispatchBot={handleDispatchBot}
          onRetryBot={handleRetryBot}
        />
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
          <PastMeetingsTab
            pastMeetings={pastMeetings}
            searchQuery={searchQuery}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onSearchQueryChange={setSearchQuery}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onTriggerSearch={triggerSearch}
            selectedMeetingIds={selectedMeetingIds}
            onSelectedMeetingIdsChange={setSelectedMeetingIds}
            renamingMeetingId={renamingMeetingId}
            renameValue={renameValue}
            onRenameValueChange={setRenameValue}
            onRenameStart={handleRenameStart}
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={() => setRenamingMeetingId(null)}
            actionMenuMeetingId={actionMenuMeetingId}
            onActionMenuToggle={setActionMenuMeetingId}
            onSelectMeeting={setSelectedMeetingId}
            onSendToBoardroom={(meeting) => {
              setBoardroomMeeting({ id: meeting.id, title: meeting.title || 'Untitled Meeting' });
              setActionMenuMeetingId(null);
            }}
            onDeleteRequest={(meetingId) => { setDeleteConfirmId(meetingId); setActionMenuMeetingId(null); }}
            deleteConfirmId={deleteConfirmId}
            onDeleteConfirm={() => deleteConfirmId && handleDeleteMeeting(deleteConfirmId)}
            onDeleteCancel={() => setDeleteConfirmId(null)}
            bulkDeleteConfirm={bulkDeleteConfirm}
            bulkDeleting={bulkDeleting}
            onBulkDeleteOpen={() => setBulkDeleteConfirm(true)}
            onBulkDeleteConfirm={handleBulkDelete}
            onBulkDeleteCancel={() => setBulkDeleteConfirm(false)}
            pastHasMore={pastHasMore}
            pastLoadingMore={pastLoadingMore}
            sentinelRef={sentinelRef}
          />
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
