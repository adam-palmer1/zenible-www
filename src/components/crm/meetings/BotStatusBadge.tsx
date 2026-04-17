import React from 'react';

interface BotStatusBadgeProps {
  status: string;
  leaveReason?: string | null;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse?: boolean; spin?: boolean }> = {
  scheduling: { label: 'Scheduling', color: 'bg-gray-400 text-white', pulse: true },
  joining: { label: 'Joining', color: 'bg-yellow-500 text-white', spin: true },
  waiting_room: { label: 'In Waiting Room', color: 'bg-amber-500 text-white', pulse: true },
  in_meeting: { label: 'In Meeting', color: 'bg-green-500 text-white' },
  listening: { label: 'Listening', color: 'bg-green-500 text-white' },
  leaving: { label: 'Leaving', color: 'bg-orange-500 text-white' },
  ended: { label: 'Ended', color: 'bg-gray-400 text-white' },
  error: { label: 'Error', color: 'bg-red-500 text-white' },
  disconnected: { label: 'Disconnected', color: 'bg-gray-500 text-white' },
};

const LEAVE_REASON_LABELS: Record<string, string> = {
  host_ended: 'Host ended',
  bot_removed: 'Removed by host',
  meeting_ended: 'Meeting ended',
  everyone_left: 'Everyone left',
  user_stopped: 'Stopped by user',
};

const BotStatusBadge: React.FC<BotStatusBadgeProps> = ({ status, leaveReason, className = '' }) => {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-400 text-white' };
  const reasonLabel = status === 'ended' && leaveReason ? LEAVE_REASON_LABELS[leaveReason] : null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}>
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      {config.spin && (
        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {config.label}{reasonLabel ? ` \u2014 ${reasonLabel}` : ''}
    </span>
  );
};

export default BotStatusBadge;
