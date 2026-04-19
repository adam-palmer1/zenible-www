import React, { useState, useEffect, useCallback, useRef } from 'react';
import meetingIntelligenceAPI from '../../services/api/crm/meetingIntelligence';
import logger from '../../utils/logger';
import type { MeetingListItem, MeetingDetail } from '../../types/meetingIntelligence';
import type { LinkedMeeting } from '../shared/ai-feedback/types';

interface MeetingContext {
  summary?: string;
  key_points?: string[];
  action_items?: string[];
  transcript?: string;
}

interface MeetingPickerModalProps {
  darkMode: boolean;
  onSelect: (meeting: LinkedMeeting, context: MeetingContext) => void;
  onClose: () => void;
}

export default function MeetingPickerModal({ darkMode, onSelect, onClose }: MeetingPickerModalProps) {
  const [search, setSearch] = useState('');
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMeetings = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await meetingIntelligenceAPI.listMeetings(
        searchQuery ? { search: searchQuery } : undefined
      );
      // Only show processed meetings (ones with transcripts)
      const items = (Array.isArray(result) ? result : (result as { items?: MeetingListItem[] }).items || []) as MeetingListItem[];
      setMeetings(items.filter(m => m.is_processed));
    } catch (err) {
      logger.error('[MeetingPicker] Failed to fetch meetings:', err);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchMeetings(value || undefined);
    }, 300);
  };

  const handleSelect = async (meeting: MeetingListItem) => {
    try {
      setLoadingDetail(meeting.id);
      const detail = await meetingIntelligenceAPI.getMeeting(meeting.id) as MeetingDetail;

      const linkedMeeting: LinkedMeeting = {
        meeting_id: detail.id,
        title: detail.title || 'Untitled Meeting',
        start_time: detail.start_time,
        duration_ms: detail.duration_ms,
      };

      const context: MeetingContext = {};
      if (detail.summary_json) {
        if (detail.summary_json.overview) context.summary = detail.summary_json.overview;
        if (detail.summary_json.keyPoints) context.key_points = detail.summary_json.keyPoints;
        if (detail.summary_json.actionItems) context.action_items = detail.summary_json.actionItems;
      }
      if (detail.transcripts?.length) {
        context.transcript = detail.transcripts
          .map(t => `[${t.speaker_display_name || t.speaker}]: ${t.content}`)
          .join('\n');
      }

      onSelect(linkedMeeting, context);
    } catch (err) {
      logger.error('[MeetingPicker] Failed to fetch meeting detail:', err);
      setError('Failed to load meeting details');
    } finally {
      setLoadingDetail(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '';
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-xl shadow-xl border flex flex-col max-h-[70vh] ${
        darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${
          darkMode ? 'border-[#333]' : 'border-gray-200'
        }`}>
          <h3 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Link a Meeting
          </h3>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'hover:bg-[#333] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 flex-shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search meetings..."
            autoFocus
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
              darkMode
                ? 'bg-[#2d2d2d] border-[#4a4a4a] text-white placeholder:text-gray-500 focus:border-violet-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-violet-500'
            }`}
          />
        </div>

        {/* Meeting list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {loading ? (
            <div className={`text-center py-8 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading meetings...
            </div>
          ) : error ? (
            <div className={`text-center py-8 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
              {error}
            </div>
          ) : meetings.length === 0 ? (
            <div className={`text-center py-8 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No processed meetings found
            </div>
          ) : (
            <div className="space-y-1">
              {meetings.map(meeting => (
                <button
                  key={meeting.id}
                  onClick={() => handleSelect(meeting)}
                  disabled={loadingDetail === meeting.id}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                    darkMode
                      ? 'hover:bg-[#2d2d2d] text-gray-200'
                      : 'hover:bg-gray-50 text-gray-800'
                  } ${loadingDetail === meeting.id ? 'opacity-60' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-600'
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {meeting.title || 'Untitled Meeting'}
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>{formatDate(meeting.start_time)}</span>
                      {meeting.duration_ms && <span>{formatDuration(meeting.duration_ms)}</span>}
                      <span>{meeting.transcript_count} segments</span>
                    </div>
                  </div>
                  {loadingDetail === meeting.id && (
                    <svg className="animate-spin w-4 h-4 text-violet-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
