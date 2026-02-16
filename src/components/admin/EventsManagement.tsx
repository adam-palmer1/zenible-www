import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import eventsAPI from '../../services/eventsAPI';
import adminAPI from '../../services/adminAPI';
import { useModalState } from '../../hooks/useModalState';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import {
  AdminOutletContext,
  EventItem,
  EventHost,
  PlanItem,
  EventRegistration,
  EventsResponse,
  HostsResponse,
  PlansResponse,
  RegistrationsResponse,
  EventAnalytics,
  EventFormData,
} from './events-management/types';
import EventsFilterBar from './events-management/EventsFilterBar';
import EventsTable from './events-management/EventsTable';
import EventFormModal from './events-management/EventFormModal';
import EventAnalyticsTab from './events-management/EventAnalyticsTab';
import DeleteEventModal from './events-management/DeleteEventModal';
import BulkActionsModal from './events-management/BulkActionsModal';
import RegistrationsModal from './events-management/RegistrationsModal';

export default function EventsManagement() {
  const { darkMode } = useOutletContext<AdminOutletContext>();

  // Main state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [hosts, setHosts] = useState<EventHost[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [hostFilter, setHostFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState('');

  // Available tags for autocomplete
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Modal states
  const eventModal = useModalState();
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const deleteConfirmation = useDeleteConfirmation<EventItem>();
  const bulkModal = useModalState();
  const registrationsModal = useModalState<EventItem>();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState<boolean>(false);

  // Bulk selection
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('events'); // events, analytics

  // Analytics state
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  // Form state
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: '',
    description: '',
    rating: '',
    start_datetime: '',
    duration_minutes: 60,
    guest_limit: '',
    tags: [],
    required_plan_ids: [],
    event_url: '',
    replay_url: '',
    past_summary: '',
    is_active: true,
    host_ids: []
  });

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchEvents();
  }, [page, perPage, search, hostFilter, planFilter, activeFilter, tagsFilter]);

  useEffect(() => {
    fetchHosts();
    fetchPlans();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, analyticsDays]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(hostFilter && { host_id: hostFilter }),
        ...(planFilter && { required_plan_id: planFilter }),
        ...(activeFilter !== '' && { is_active: activeFilter === 'true' }),
        ...(tagsFilter && { tags: tagsFilter })
      };

      const params_str: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          params_str[key] = String(value);
        }
      }
      const response = await eventsAPI.getAdminEvents(params_str) as EventsResponse;
      setEvents(response.items || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);

      // Extract unique tags from events
      const tags = eventsAPI.extractUniqueTags(response.items || []);
      setAvailableTags(tags);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHosts = async () => {
    try {
      const response = await eventsAPI.getAdminHosts({ is_active: 'true' }) as HostsResponse;
      setHosts(response.hosts || []);
    } catch (err: any) {
      console.error('Error fetching hosts:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await adminAPI.getPlans({ is_active: 'true' }) as PlansResponse;
      setPlans(response.items || []);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await eventsAPI.getEventAnalytics({ days: String(analyticsDays) }) as EventAnalytics;
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchEventRegistrations = async (eventId: string) => {
    setRegistrationsLoading(true);
    try {
      const response = await eventsAPI.getEventRegistrations(eventId, { page: '1', per_page: '100' }) as RegistrationsResponse;
      setRegistrations(response.registrations || []);
    } catch (err: any) {
      console.error('Error fetching registrations:', err);
      alert(`Error fetching registrations: ${err.message}`);
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      rating: '',
      start_datetime: '',
      duration_minutes: 60,
      guest_limit: '',
      tags: [],
      required_plan_ids: [],
      event_url: '',
      replay_url: '',
      past_summary: '',
      is_active: true,
      host_ids: []
    });
    eventModal.open();
  };

  const handleEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      rating: event.rating || '',
      start_datetime: eventsAPI.toLocalInputDateTime(event.start_datetime),
      duration_minutes: event.duration_minutes,
      guest_limit: event.guest_limit || '',
      tags: event.tags || [],
      required_plan_ids: event.required_plan_ids || (event.required_plan_id ? [event.required_plan_id] : []),
      event_url: event.event_url || '',
      replay_url: event.replay_url || '',
      past_summary: event.past_summary || '',
      is_active: event.is_active,
      host_ids: event.hosts?.map(h => h.id) || []
    });
    eventModal.open();
  };

  const handleCloneEvent = (event: EventItem) => {
    // Clone event - set editingEvent to null so it creates a new event
    setEditingEvent(null);
    setEventForm({
      title: `${event.title} (Copy)`,
      description: event.description,
      rating: event.rating || '',
      start_datetime: '', // Clear datetime for cloned event
      duration_minutes: event.duration_minutes,
      guest_limit: event.guest_limit || '',
      tags: event.tags || [],
      required_plan_ids: event.required_plan_ids || (event.required_plan_id ? [event.required_plan_id] : []),
      event_url: event.event_url || '',
      replay_url: event.replay_url || '',
      past_summary: event.past_summary || '',
      is_active: event.is_active,
      host_ids: event.hosts?.map(h => h.id) || []
    });
    eventModal.open();
  };

  const handleSaveEvent = async () => {
    try {
      const data: Record<string, unknown> = {
        title: eventForm.title,
        description: eventForm.description,
        start_datetime: eventsAPI.toISODateTime(eventForm.start_datetime),
        duration_minutes: parseInt(String(eventForm.duration_minutes)),
        tags: eventForm.tags,
        is_active: eventForm.is_active,
        host_ids: eventForm.host_ids
      };

      // Add rating (or null to clear it when updating)
      if (editingEvent) {
        // When editing, always include rating field (null clears it)
        data.rating = eventForm.rating || null;
      } else {
        // When creating, only include if provided
        if (eventForm.rating) {
          data.rating = eventForm.rating;
        }
      }

      // Add optional fields only if they have values
      if (eventForm.guest_limit) {
        data.guest_limit = parseInt(String(eventForm.guest_limit));
      }

      if (eventForm.required_plan_ids.length > 0) {
        data.required_plan_ids = eventForm.required_plan_ids;
      }

      if (eventForm.event_url) {
        data.event_url = eventForm.event_url;
      }

      if (eventForm.replay_url) {
        data.replay_url = eventForm.replay_url;
      }

      if (eventForm.past_summary) {
        data.past_summary = eventForm.past_summary;
      }

      if (editingEvent) {
        await eventsAPI.updateEvent(editingEvent.id, data);
      } else {
        await eventsAPI.createEvent(data);
      }

      eventModal.close();
      fetchEvents();
    } catch (err: any) {
      console.error('[handleSaveEvent] Error:', err);
      alert(`Error saving event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async () => {
    await deleteConfirmation.confirmDelete(async (event) => {
      try {
        await eventsAPI.deleteEvent(event.id);
        fetchEvents();
      } catch (err: any) {
        alert(`Error deleting event: ${err.message}`);
        throw err;
      }
    });
  };

  const handleToggleActive = async (event: EventItem) => {
    try {
      await eventsAPI.updateEvent(event.id, { is_active: !event.is_active });
      fetchEvents();
    } catch (err: any) {
      alert(`Error updating event: ${err.message}`);
    }
  };

  const handleBulkAction = async () => {
    if (selectedEvents.length === 0 || !bulkAction) return;

    try {
      await eventsAPI.bulkActionEvents({
        event_ids: selectedEvents,
        action: bulkAction
      });
      bulkModal.close();
      setSelectedEvents([]);
      setBulkAction('');
      fetchEvents();
    } catch (err: any) {
      alert(`Error performing bulk action: ${err.message}`);
    }
  };

  const handleViewRegistrations = (event: EventItem) => {
    registrationsModal.open(event);
    fetchEventRegistrations(event.id);
  };

  const toggleSelectEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEvents.length === events.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(events.map(e => e.id));
    }
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Events Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage events, registrations, and analytics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <div className="px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('events')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Events List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Events List Tab */}
      {activeTab === 'events' && (
        <>
          <EventsFilterBar
            darkMode={darkMode}
            search={search}
            setSearch={setSearch}
            hostFilter={hostFilter}
            setHostFilter={setHostFilter}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            tagsFilter={tagsFilter}
            setTagsFilter={setTagsFilter}
            setPage={setPage}
            hosts={hosts}
            plans={plans}
            selectedEventsCount={selectedEvents.length}
            onCreateEvent={handleCreateEvent}
            onBulkAction={() => bulkModal.open()}
          />

          <EventsTable
            darkMode={darkMode}
            loading={loading}
            error={error}
            events={events}
            selectedEvents={selectedEvents}
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            setPage={setPage}
            setPerPage={setPerPage}
            toggleSelectAll={toggleSelectAll}
            toggleSelectEvent={toggleSelectEvent}
            onEditEvent={handleEditEvent}
            onCloneEvent={handleCloneEvent}
            onDeleteEvent={(event) => deleteConfirmation.requestDelete(event)}
            onToggleActive={handleToggleActive}
            onViewRegistrations={handleViewRegistrations}
          />
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <EventAnalyticsTab
          darkMode={darkMode}
          analytics={analytics}
          analyticsLoading={analyticsLoading}
          analyticsDays={analyticsDays}
          setAnalyticsDays={setAnalyticsDays}
        />
      )}

      {/* Create/Edit Event Modal */}
      {eventModal.isOpen && (
        <EventFormModal
          darkMode={darkMode}
          editingEvent={editingEvent}
          eventForm={eventForm}
          setEventForm={setEventForm}
          hosts={hosts}
          plans={plans}
          availableTags={availableTags}
          onSave={handleSaveEvent}
          onClose={() => eventModal.close()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.item && (
        <DeleteEventModal
          darkMode={darkMode}
          event={deleteConfirmation.item}
          onConfirm={handleDeleteEvent}
          onCancel={deleteConfirmation.cancelDelete}
        />
      )}

      {/* Bulk Actions Modal */}
      {bulkModal.isOpen && (
        <BulkActionsModal
          darkMode={darkMode}
          selectedEventsCount={selectedEvents.length}
          bulkAction={bulkAction}
          setBulkAction={setBulkAction}
          onExecute={handleBulkAction}
          onClose={() => {
            bulkModal.close();
            setBulkAction('');
          }}
        />
      )}

      {/* Registrations Modal */}
      {registrationsModal.isOpen && registrationsModal.data && (
        <RegistrationsModal
          darkMode={darkMode}
          event={registrationsModal.data}
          registrations={registrations}
          registrationsLoading={registrationsLoading}
          onClose={() => {
            registrationsModal.close();
            setRegistrations([]);
          }}
        />
      )}
    </div>
  );
}
