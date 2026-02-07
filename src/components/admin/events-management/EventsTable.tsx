import React from 'react';
import { LoadingSpinner } from '../../shared';
import { EventItem, EventHost } from './types';
import eventsAPI from '../../../services/eventsAPI';

interface EventsTableProps {
  darkMode: boolean;
  loading: boolean;
  error: string | null;
  events: EventItem[];
  selectedEvents: string[];
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  toggleSelectAll: () => void;
  toggleSelectEvent: (eventId: string) => void;
  onEditEvent: (event: EventItem) => void;
  onCloneEvent: (event: EventItem) => void;
  onDeleteEvent: (event: EventItem) => void;
  onToggleActive: (event: EventItem) => void;
  onViewRegistrations: (event: EventItem) => void;
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  return eventsAPI.formatLocalDateTime(dateString);
};

const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getHostNames = (eventHosts: EventHost[] | undefined): string => {
  if (!eventHosts || eventHosts.length === 0) return 'No hosts';
  return eventHosts.map(h => h.name).join(', ');
};

export default function EventsTable({
  darkMode,
  loading,
  error,
  events,
  selectedEvents,
  page,
  totalPages,
  total,
  perPage,
  setPage,
  setPerPage,
  toggleSelectAll,
  toggleSelectEvent,
  onEditEvent,
  onCloneEvent,
  onDeleteEvent,
  onToggleActive,
  onViewRegistrations,
}: EventsTableProps) {
  return (
    <div className="px-6 pb-6">
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        {loading ? (
          <LoadingSpinner height="py-12" />
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
                          onClick={() => onViewRegistrations(event)}
                          className="text-sm text-blue-600 hover:text-blue-900 underline"
                        >
                          {event.registered_count || 0} / {event.guest_limit}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onToggleActive(event)}
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
                            onClick={() => onEditEvent(event)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onCloneEvent(event)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Clone
                          </button>
                          <button
                            onClick={() => onDeleteEvent(event)}
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
  );
}
