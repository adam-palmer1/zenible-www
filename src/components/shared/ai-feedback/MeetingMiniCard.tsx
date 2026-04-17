import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LinkedMeeting } from './types';

interface MeetingMiniCardProps {
  meeting: LinkedMeeting;
  darkMode: boolean;
}

export default function MeetingMiniCard({ meeting, darkMode }: MeetingMiniCardProps) {
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const handleViewMeeting = () => {
    navigate(`/crm/meetings?meetingId=${meeting.meeting_id}`);
  };

  return (
    <div className={`mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs max-w-full ${
      darkMode
        ? 'bg-violet-900/20 border-violet-800/50 text-violet-300'
        : 'bg-violet-50 border-violet-200 text-violet-700'
    }`}>
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <span className="truncate font-medium">{meeting.title}</span>
      <span className="opacity-70 flex-shrink-0">{formatDate(meeting.start_time)}</span>
      {meeting.duration_ms && (
        <span className="opacity-70 flex-shrink-0">{formatDuration(meeting.duration_ms)}</span>
      )}
      <button
        onClick={handleViewMeeting}
        className={`flex-shrink-0 underline hover:no-underline ${
          darkMode ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-800'
        }`}
      >
        View
      </button>
    </div>
  );
}
