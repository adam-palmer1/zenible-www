import React, { useEffect, useState } from 'react';
import BotStatusBadge from './BotStatusBadge';
import { usePreferences } from '../../../contexts/PreferencesContext';
import type { BotStatus } from '../../../types/meetingIntelligence';

const PLATFORM_ICONS: Record<string, string> = {
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
};

interface ActiveBotSessionsBarProps {
  botStatuses: Record<string, BotStatus>;
  dispatchedAt: Record<string, number>;
  activeBotSession: string | null;
  onToggleTranscription: (sessionId: string) => void;
  onLeaveBot: (sessionId: string) => void;
}

/**
 * Status bar for currently-active bot sessions. The per-second elapsed timer is
 * localized to <ElapsedTime> so it does not re-render the parent MeetingsPage tree.
 */
const ActiveBotSessionsBar: React.FC<ActiveBotSessionsBarProps> = ({
  botStatuses,
  dispatchedAt,
  activeBotSession,
  onToggleTranscription,
  onLeaveBot,
}) => {
  const { darkMode } = usePreferences();

  const activeSessions = Object.values(botStatuses).filter(
    (bs) => bs.status !== 'ended' && bs.status !== 'error',
  );

  if (activeSessions.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeSessions.map((bs) => {
        const isJoining = bs.status === 'joining' || bs.status === 'scheduling' || bs.status === 'waiting_room';
        const isLeaving = bs.status === 'leaving';
        const isActive = bs.status === 'in_meeting' || bs.status === 'listening';
        const durationSecs = bs.duration_s > 0 ? bs.duration_s : null;
        const durationStr = durationSecs != null
          ? `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`
          : null;
        const participants = bs.participant_count > 1 ? bs.participant_count - 1 : 0;
        const platformLabel = bs.platform ? (PLATFORM_ICONS[bs.platform] || bs.platform) : null;
        const startTime = dispatchedAt[bs.session_id] || (bs.joined_at ? new Date(bs.joined_at).getTime() : 0);

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
              {!isActive && startTime > 0 && (
                <ElapsedTime startTime={startTime} darkMode={darkMode} showWarnings={isJoining} />
              )}
              {isLeaving && (
                <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Bot is leaving the meeting...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isLeaving && (
                <button
                  onClick={() => onLeaveBot(bs.session_id)}
                  className="text-xs px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Remove Bot
                </button>
              )}
              {isActive && (
                <button
                  onClick={() => onToggleTranscription(bs.session_id)}
                  className="text-xs px-3 py-1.5 rounded bg-zenible-primary text-white hover:opacity-90"
                >
                  {activeBotSession === bs.session_id ? 'Hide Transcription' : 'Transcription'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface ElapsedTimeProps {
  startTime: number;
  darkMode: boolean;
  showWarnings: boolean;
}

/**
 * Localized per-second ticker. Isolated from the parent so the 1s interval
 * only re-renders this tiny component instead of the whole meetings page.
 */
const ElapsedTime: React.FC<ElapsedTimeProps> = ({ startTime, darkMode, showWarnings }) => {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startTime) / 1000));

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const elapsedStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <>
      <span className={`text-xs tabular-nums ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
        {elapsedStr}
      </span>
      {showWarnings && elapsed > 180 && (
        <span className="text-xs text-red-500">Bot may have failed to join. Try removing and re-dispatching.</span>
      )}
      {showWarnings && elapsed > 90 && elapsed <= 180 && (
        <span className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
          Taking longer than expected...
        </span>
      )}
    </>
  );
};

export default ActiveBotSessionsBar;
