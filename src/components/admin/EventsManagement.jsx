import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import eventsAPI from '../../services/eventsAPI';
import adminAPI from '../../services/adminAPI';

export default function EventsManagement() {
  const { darkMode } = useOutletContext();

  // Main state
  const [events, setEvents] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const [availableTags, setAvailableTags] = useState([]);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);

  // Bulk selection
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('events'); // events, analytics

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  // Form state
  const [eventForm, setEventForm] = useState({
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

  // Tag input state
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

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

      const response = await eventsAPI.getAdminEvents(params);
      setEvents(response.events || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);

      // Extract unique tags from events
      const tags = eventsAPI.extractUniqueTags(response.events || []);
      setAvailableTags(tags);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHosts = async () => {
    try {
      const response = await eventsAPI.getAdminHosts({ is_active: true });
      setHosts(response.hosts || []);
    } catch (err) {
      console.error('Error fetching hosts:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await adminAPI.getPlans({ is_active: true });
      setPlans(response.plans || response.items || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await eventsAPI.getEventAnalytics({ days: analyticsDays });
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    setRegistrationsLoading(true);
    try {
      const response = await eventsAPI.getEventRegistrations(eventId, { page: 1, per_page: 100 });
      setRegistrations(response.registrations || []);
    } catch (err) {
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
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
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
    setShowEventModal(true);
  };

  const handleCloneEvent = (event) => {
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
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      console.log('[handleSaveEvent] Form state rating:', eventForm.rating);
      console.log('[handleSaveEvent] editingEvent:', editingEvent);

      const data = {
        title: eventForm.title,
        description: eventForm.description,
        start_datetime: eventsAPI.toISODateTime(eventForm.start_datetime),
        duration_minutes: parseInt(eventForm.duration_minutes),
        tags: eventForm.tags,
        is_active: eventForm.is_active,
        host_ids: eventForm.host_ids
      };

      // Add rating (or null to clear it when updating)
      if (editingEvent) {
        // When editing, always include rating field (null clears it)
        data.rating = eventForm.rating || null;
        console.log('[handleSaveEvent] EDITING - data.rating set to:', data.rating);
      } else {
        // When creating, only include if provided
        if (eventForm.rating) {
          data.rating = eventForm.rating;
          console.log('[handleSaveEvent] CREATING - data.rating set to:', data.rating);
        } else {
          console.log('[handleSaveEvent] CREATING - rating omitted (empty)');
        }
      }

      // Add optional fields only if they have values
      if (eventForm.guest_limit) {
        data.guest_limit = parseInt(eventForm.guest_limit);
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

      console.log('[handleSaveEvent] Final data object being sent:', data);

      if (editingEvent) {
        console.log('[handleSaveEvent] Calling updateEvent with ID:', editingEvent.id);
        await eventsAPI.updateEvent(editingEvent.id, data);
      } else {
        console.log('[handleSaveEvent] Calling createEvent');
        await eventsAPI.createEvent(data);
      }

      setShowEventModal(false);
      fetchEvents();
    } catch (err) {
      console.error('[handleSaveEvent] Error:', err);
      alert(`Error saving event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;

    try {
      await eventsAPI.deleteEvent(deletingEvent.id);
      setShowDeleteModal(false);
      setDeletingEvent(null);
      fetchEvents();
    } catch (err) {
      alert(`Error deleting event: ${err.message}`);
    }
  };

  const handleToggleActive = async (event) => {
    try {
      await eventsAPI.updateEvent(event.id, { is_active: !event.is_active });
      fetchEvents();
    } catch (err) {
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
      setShowBulkModal(false);
      setSelectedEvents([]);
      setBulkAction('');
      fetchEvents();
    } catch (err) {
      alert(`Error performing bulk action: ${err.message}`);
    }
  };

  const handleViewRegistrations = (event) => {
    setSelectedEventForRegistrations(event);
    setShowRegistrationsModal(true);
    fetchEventRegistrations(event.id);
  };

  const toggleSelectEvent = (eventId) => {
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

  const addTag = (tag) => {
    if (tag && !eventForm.tags.includes(tag)) {
      setEventForm({ ...eventForm, tags: [...eventForm.tags, tag] });
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setEventForm({
      ...eventForm,
      tags: eventForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagInputChange = (value) => {
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const filteredTagSuggestions = availableTags.filter(tag =>
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !eventForm.tags.includes(tag)
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return eventsAPI.formatLocalDate(dateString);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return eventsAPI.formatLocalDateTime(dateString);
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getHostNames = (eventHosts) => {
    if (!eventHosts || eventHosts.length === 0) return 'No hosts';
    return eventHosts.map(h => h.name).join(', ');
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
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
          {/* Filters and Actions */}
          <div className="p-6">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search in title and description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />

                <select
                  value={hostFilter}
                  onChange={(e) => {
                    setHostFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Hosts</option>
                  {hosts.map(host => (
                    <option key={host.id} value={host.id}>{host.name}</option>
                  ))}
                </select>

                <select
                  value={planFilter}
                  onChange={(e) => {
                    setPlanFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Plans</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filter by tags (comma separated)..."
                  value={tagsFilter}
                  onChange={(e) => {
                    setTagsFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />

                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateEvent}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                >
                  Create Event
                </button>

                {selectedEvents.length > 0 && (
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Bulk Actions ({selectedEvents.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Events Table */}
          <div className="px-6 pb-6">
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-12">Error: {error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            <input
                              type="checkbox"
                              checked={selectedEvents.length === events.length && events.length > 0}
                              onChange={toggleSelectAll}
                              className="rounded"
                            />
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Title
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Hosts
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Start Date
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Duration
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Registrations
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Status
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                        {events.map(event => (
                          <tr key={event.id}>
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedEvents.includes(event.id)}
                                onChange={() => toggleSelectEvent(event.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                  {event.title}
                                </div>
                                {event.event_url && (
                                  <span
                                    className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700 border border-green-300"
                                    title="Live event link configured"
                                  >
                                    🔗 Live
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                                {truncateText(event.description, 50)}
                              </div>
                              {event.tags && event.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {event.tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                      {tag}
                                    </span>
                                  ))}
                                  {event.tags.length > 3 && (
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                      +{event.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {getHostNames(event.hosts)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {formatDateTime(event.start_datetime)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {event.duration_minutes} min
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleViewRegistrations(event)}
                                className="text-sm text-blue-600 hover:text-blue-900 underline"
                              >
                                {event.registered_count || 0} / {event.guest_limit}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleActive(event)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  event.is_active ? 'bg-zenible-primary' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    event.is_active ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCloneEvent(event)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Clone
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletingEvent(event);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className={`px-6 py-3 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Page {page} of {totalPages} ({total} total)
                        </span>
                        <select
                          value={perPage}
                          onChange={(e) => {
                            setPerPage(parseInt(e.target.value));
                            setPage(1);
                          }}
                          className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                        >
                          <option value="10">10 per page</option>
                          <option value="20">20 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className={`px-3 py-1 text-sm rounded ${
                            page === 1
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-zenible-primary text-white hover:bg-opacity-90'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className={`px-3 py-1 text-sm rounded ${
                            page === totalPages
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-zenible-primary text-white hover:bg-opacity-90'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab - Continuing in next part due to length */}
      {activeTab === 'analytics' && (
        <div className="p-6">
          <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <select
              value={analyticsDays}
              onChange={(e) => setAnalyticsDays(parseInt(e.target.value))}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 365 days</option>
            </select>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Events</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.total_events || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Upcoming Events</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.upcoming_events || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Past Events</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.past_events || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Registrations</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.total_registrations || 0}
                  </div>
                </div>
              </div>

              {analytics.analytics && analytics.analytics.length > 0 && (
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className="p-4 border-b">
                    <h3 className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                      Event Performance
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Event
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Start Date
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Total Registrations
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Active Registrations
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Capacity
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                        {analytics.analytics.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4">
                              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {formatDateTime(item.start_datetime)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.total_registrations || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.active_registrations || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.capacity_utilization?.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              No analytics data available
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b sticky top-0 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {editingEvent ? 'Edit Event' : eventForm.title.includes('(Copy)') ? 'Clone Event' : 'Create Event'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Rating (e.g., 4.9)
                  </label>
                  <input
                    type="text"
                    value={eventForm.rating}
                    onChange={(e) => {
                      console.log('[Rating Input] onChange fired, new value:', e.target.value);
                      setEventForm({ ...eventForm, rating: e.target.value });
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                    placeholder="4.9"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Description *
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Event description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.start_datetime}
                    onChange={(e) => setEventForm({ ...eventForm, start_datetime: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={eventForm.duration_minutes}
                    onChange={(e) => setEventForm({ ...eventForm, duration_minutes: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Guest Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={eventForm.guest_limit}
                    onChange={(e) => setEventForm({ ...eventForm, guest_limit: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Tags
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                    placeholder="Type to add tags..."
                  />
                  {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                    <div className={`absolute z-10 w-full mt-1 rounded-lg border max-h-48 overflow-y-auto ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                      {filteredTagSuggestions.map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => addTag(tag)}
                          className={`w-full text-left px-3 py-2 hover:bg-opacity-90 ${darkMode ? 'hover:bg-zenible-dark-bg text-zenible-dark-text' : 'hover:bg-gray-100 text-gray-900'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {eventForm.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Hosts *
                </label>
                <select
                  multiple
                  value={eventForm.host_ids}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setEventForm({ ...eventForm, host_ids: selected });
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  size="5"
                >
                  {hosts.map(host => (
                    <option key={host.id} value={host.id}>
                      {host.name}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Hold Ctrl/Cmd to select multiple hosts
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Required Plans
                </label>
                <select
                  multiple
                  value={eventForm.required_plan_ids}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setEventForm({ ...eventForm, required_plan_ids: selected });
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  size="5"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Hold Ctrl/Cmd to select multiple plans. Leave empty for no plan requirement.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Event URL (Live Session Link)
                </label>
                <input
                  type="url"
                  value={eventForm.event_url}
                  onChange={(e) => setEventForm({ ...eventForm, event_url: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="https://zoom.us/... or https://meet.google.com/..."
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Link to live event (Zoom, Google Meet, etc.). Only visible to registered users.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Replay URL
                </label>
                <input
                  type="url"
                  value={eventForm.replay_url}
                  onChange={(e) => setEventForm({ ...eventForm, replay_url: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="https://..."
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Link to recorded session for past events.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Past Summary
                </label>
                <textarea
                  value={eventForm.past_summary}
                  onChange={(e) => setEventForm({ ...eventForm, past_summary: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Summary for past events..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={eventForm.is_active}
                  onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Active
                </label>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 sticky bottom-0 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <button
                onClick={handleSaveEvent}
                disabled={!eventForm.title || !eventForm.description || !eventForm.start_datetime || eventForm.host_ids.length === 0}
                className={`px-4 py-2 rounded-lg ${
                  eventForm.title && eventForm.description && eventForm.start_datetime && eventForm.host_ids.length > 0
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingEvent ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete this event?
              </p>
              <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                "{deletingEvent.title}"
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingEvent(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Bulk Actions
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Action
                </label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">Select action...</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="delete">Delete</option>
                </select>
              </div>

              <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                {selectedEvents.length} event(s) selected
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className={`px-4 py-2 rounded-lg ${
                  bulkAction
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Execute
              </button>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkAction('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrationsModal && selectedEventForRegistrations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Event Registrations: {selectedEventForRegistrations.title}
              </h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {registrationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          User Email
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Name
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Registered At
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Attending
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                      {registrations.map((reg, idx) => (
                        <tr key={idx}>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {reg.user_email}
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {reg.user_name || '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {formatDateTime(reg.registered_at)}
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {reg.is_attending ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Yes</span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  No registrations yet
                </div>
              )}
            </div>
            <div className={`px-6 py-4 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedEventForRegistrations(null);
                  setRegistrations([]);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
