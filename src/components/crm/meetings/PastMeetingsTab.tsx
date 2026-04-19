import React from 'react';
import { usePreferences } from '../../../contexts/PreferencesContext';
import ConfirmationModal from '../../shared/ConfirmationModal';
import type { MeetingListItem } from '../../../types/meetingIntelligence';

interface PastMeetingsTabProps {
  pastMeetings: MeetingListItem[];
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  onSearchQueryChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onTriggerSearch: () => void;

  selectedMeetingIds: Set<string>;
  onSelectedMeetingIdsChange: (next: Set<string>) => void;

  renamingMeetingId: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onRenameStart: (meeting: MeetingListItem) => void;
  onRenameSubmit: (meetingId: string) => void;
  onRenameCancel: () => void;

  actionMenuMeetingId: string | null;
  onActionMenuToggle: (meetingId: string | null) => void;

  onSelectMeeting: (meetingId: string) => void;
  onSendToBoardroom: (meeting: MeetingListItem) => void;
  onDeleteRequest: (meetingId: string) => void;

  deleteConfirmId: string | null;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;

  bulkDeleteConfirm: boolean;
  bulkDeleting: boolean;
  onBulkDeleteOpen: () => void;
  onBulkDeleteConfirm: () => void;
  onBulkDeleteCancel: () => void;

  pastHasMore: boolean;
  pastLoadingMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

/** Auto-generated titles like "Meeting 2026-03-31 15:50" (UTC) → local-formatted. */
const getMeetingDisplayTitle = (meeting: MeetingListItem) => {
  if (!meeting.title) return 'Untitled Meeting';
  if (/^Meeting \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(meeting.title) && meeting.start_time) {
    return `Meeting ${new Date(meeting.start_time).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })}`;
  }
  return meeting.title;
};

const PastMeetingsTab: React.FC<PastMeetingsTabProps> = ({
  pastMeetings,
  searchQuery, dateFrom, dateTo,
  onSearchQueryChange, onDateFromChange, onDateToChange, onTriggerSearch,
  selectedMeetingIds, onSelectedMeetingIdsChange,
  renamingMeetingId, renameValue, onRenameValueChange,
  onRenameStart, onRenameSubmit, onRenameCancel,
  actionMenuMeetingId, onActionMenuToggle,
  onSelectMeeting, onSendToBoardroom, onDeleteRequest,
  deleteConfirmId, onDeleteConfirm, onDeleteCancel,
  bulkDeleteConfirm, bulkDeleting, onBulkDeleteOpen, onBulkDeleteConfirm, onBulkDeleteCancel,
  pastHasMore, pastLoadingMore, sentinelRef,
}) => {
  const { darkMode } = usePreferences();

  return (
    <div className="space-y-3">
      {/* Search, filter bar + refresh */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search meetings..."
          aria-label="Search past meetings"
          className={`flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border text-white placeholder-gray-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          }`}
        />
        <div className="flex items-center gap-2">
          <label className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`} htmlFor="past-date-from">From</label>
          <input
            id="past-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={`px-2 py-2 text-sm rounded-lg border ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <label className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`} htmlFor="past-date-to">To</label>
          <input
            id="past-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={`px-2 py-2 text-sm rounded-lg border ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          {(searchQuery || dateFrom || dateTo) && (
            <button
              onClick={() => { onSearchQueryChange(''); onDateFromChange(''); onDateToChange(''); }}
              className={`text-xs px-2 py-1 rounded ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Clear
            </button>
          )}
          <button
            onClick={onTriggerSearch}
            title="Refresh"
            aria-label="Refresh meeting list"
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
                onClick={onBulkDeleteOpen}
                className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => onSelectedMeetingIdsChange(new Set())}
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
              <caption className="sr-only">Past meetings — {pastMeetings.length} items</caption>
              <thead>
                <tr className={darkMode ? 'bg-zenible-dark-border/50' : 'bg-gray-50'}>
                  <th scope="col" className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={pastMeetings.length > 0 && selectedMeetingIds.size === pastMeetings.length}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedMeetingIds.size > 0 && selectedMeetingIds.size < pastMeetings.length;
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectedMeetingIdsChange(new Set(pastMeetings.map((m) => m.id)));
                        } else {
                          onSelectedMeetingIdsChange(new Set());
                        }
                      }}
                      aria-label="Select all meetings"
                      className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary cursor-pointer"
                    />
                  </th>
                  <th scope="col" className={`text-left text-xs font-medium px-4 py-2.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Time</th>
                  <th scope="col" className={`text-left text-xs font-medium px-4 py-2.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Meeting</th>
                  <th scope="col" className={`text-left text-xs font-medium px-4 py-2.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Duration</th>
                  <th scope="col" className={`text-right text-xs font-medium px-4 py-2.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-100'}`}>
                {pastMeetings.map((meeting) => (
                  <tr
                    key={meeting.id}
                    onClick={() => onSelectMeeting(meeting.id)}
                    className={`cursor-pointer transition-colors ${
                      darkMode ? 'bg-zenible-dark-card hover:bg-zenible-dark-border/30' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedMeetingIds.has(meeting.id)}
                        onChange={(e) => {
                          const next = new Set(selectedMeetingIds);
                          if (e.target.checked) next.add(meeting.id); else next.delete(meeting.id);
                          onSelectedMeetingIdsChange(next);
                        }}
                        aria-label={`Select meeting ${meeting.title || meeting.id}`}
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
                            onChange={(e) => onRenameValueChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onRenameSubmit(meeting.id);
                              if (e.key === 'Escape') onRenameCancel();
                            }}
                            onBlur={() => onRenameSubmit(meeting.id)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            aria-label="Rename meeting"
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
                            <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
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
                          onClick={() => onActionMenuToggle(actionMenuMeetingId === meeting.id ? null : meeting.id)}
                          aria-label="Meeting actions"
                          aria-haspopup="menu"
                          aria-expanded={actionMenuMeetingId === meeting.id}
                          className={`p-1 rounded hover:bg-opacity-20 ${
                            darkMode ? 'text-zenible-dark-text-secondary hover:bg-white' : 'text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <circle cx="10" cy="4" r="1.5" />
                            <circle cx="10" cy="10" r="1.5" />
                            <circle cx="10" cy="16" r="1.5" />
                          </svg>
                        </button>
                        {actionMenuMeetingId === meeting.id && (
                          <div
                            role="menu"
                            className={`absolute right-0 top-8 z-20 w-48 rounded-lg border shadow-lg py-1 ${
                              darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
                            }`}
                          >
                            <button
                              role="menuitem"
                              onClick={() => onRenameStart(meeting)}
                              className={`w-full text-left px-3 py-2 text-sm ${
                                darkMode ? 'text-white hover:bg-zenible-dark-border' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Rename
                            </button>
                            {meeting.is_processed && (
                              <button
                                role="menuitem"
                                onClick={() => onSendToBoardroom(meeting)}
                                className={`w-full text-left px-3 py-2 text-sm ${
                                  darkMode ? 'text-white hover:bg-zenible-dark-border' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                Send to Boardroom
                              </button>
                            )}
                            <button
                              role="menuitem"
                              onClick={() => onDeleteRequest(meeting.id)}
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
          {/* Infinite scroll sentinel + loading */}
          {pastHasMore && !searchQuery && !dateFrom && !dateTo && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {pastLoadingMore && (
                <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
                  Loading more meetings...
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        onClose={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={bulkDeleteConfirm}
        onClose={() => !bulkDeleting && onBulkDeleteCancel()}
        onConfirm={onBulkDeleteConfirm}
        title={`Delete ${selectedMeetingIds.size} Meeting${selectedMeetingIds.size !== 1 ? 's' : ''}`}
        message={`Are you sure you want to delete ${selectedMeetingIds.size} meeting${selectedMeetingIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={bulkDeleting ? 'Deleting...' : 'Delete'}
        variant="danger"
      />
    </div>
  );
};

export default PastMeetingsTab;
