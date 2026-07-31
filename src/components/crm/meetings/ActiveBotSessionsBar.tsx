import React, { useEffect, useState } from 'react';
import BotStatusBadge from './BotStatusBadge';
import { usePreferences } from '../../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../../services/api/crm/meetingIntelligence';
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
  selectedObjective: string;
  customObjectiveText: string;
  insightsEnabled: boolean;
  insightsLoading: boolean;
  isRecording: boolean;
  recordingLoading: boolean;
  onObjectiveChange: (objectiveId: string) => void;
  onCustomObjectiveTextChange: (text: string) => void;
  onToggleTranscription: (sessionId: string) => void;
  onToggleInsights: () => void;
  onToggleRecording: () => void;
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
  selectedObjective,
  customObjectiveText,
  insightsEnabled,
  insightsLoading,
  isRecording,
  recordingLoading,
  onObjectiveChange,
  onCustomObjectiveTextChange,
  onToggleTranscription,
  onToggleInsights,
  onToggleRecording,
  onLeaveBot,
}) => {
  const { darkMode } = usePreferences();
  const [objectives, setObjectives] = useState<Array<{ id: string; label: string; description: string }>>([]);

  useEffect(() => {
    meetingIntelligenceAPI.getInsightObjectives().then(setObjectives).catch(() => {});
  }, []);

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
          <React.Fragment key={bs.session_id}>
          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${
              darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <BotStatusBadge status={bs.status} />
              {bs.meeting_title && (
                <span className={`text-xs font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {bs.meeting_title}
                </span>
              )}
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
              {/* Recording */}
              {isActive && (
                <button
                  onClick={onToggleRecording}
                  disabled={recordingLoading}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${
                    isRecording
                      ? darkMode
                        ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                      : darkMode
                        ? 'bg-zenible-primary/20 text-zenible-primary hover:bg-zenible-primary/30'
                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  } disabled:opacity-50`}
                >
                  {recordingLoading ? (
                    <span className="inline-flex h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isRecording ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>
                      Start Recording
                    </>
                  )}
                </button>
              )}
              {/* Insights */}
              {isActive && (
                <button
                  onClick={onToggleInsights}
                  disabled={insightsLoading}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${
                    insightsEnabled
                      ? darkMode
                        ? 'bg-zenible-primary/30 text-zenible-primary hover:bg-zenible-primary/40'
                        : 'bg-purple-100 text-zenible-primary hover:bg-purple-200'
                      : darkMode
                        ? 'bg-zenible-dark-border text-zenible-dark-text-secondary hover:text-white'
                        : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                  } disabled:opacity-50`}
                >
                  {insightsLoading ? (
                    <span className="inline-flex h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  {insightsEnabled ? 'Insights On' : 'Insights'}
                </button>
              )}
              {/* Transcription */}
              {isActive && (
                <button
                  onClick={() => onToggleTranscription(bs.session_id)}
                  className={`text-xs px-3 py-1.5 rounded ${
                    activeBotSession === bs.session_id
                      ? 'bg-zenible-primary text-white hover:opacity-90'
                      : darkMode
                        ? 'bg-zenible-dark-border text-zenible-dark-text-secondary hover:text-white'
                        : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {activeBotSession === bs.session_id ? 'Hide Transcription' : 'Transcription'}
                </button>
              )}
              {/* Remove Bot */}
              {!isLeaving && (
                <button
                  onClick={() => onLeaveBot(bs.session_id)}
                  className="text-xs px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Remove Bot
                </button>
              )}
            </div>
          </div>

          {/* Objective tiles */}
          {isActive && objectives.filter((o) => o.id !== 'unspecified').length > 0 && (
            <div className="flex flex-wrap items-start gap-2 mt-1">
              {objectives.filter((o) => o.id !== 'unspecified').map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => onObjectiveChange(selectedObjective === obj.id ? 'unspecified' : obj.id)}
                  style={{ width: '9rem' }}
                  className={`text-left px-3 py-2 rounded-lg border transition-all ${
                    selectedObjective === obj.id
                      ? darkMode
                        ? 'border-zenible-primary bg-zenible-primary/10 text-zenible-primary'
                        : 'border-zenible-primary bg-purple-50 text-zenible-primary'
                      : darkMode
                        ? 'border-zenible-dark-border bg-zenible-dark-card hover:border-zenible-primary/50 text-zenible-dark-text-secondary'
                        : 'border-gray-200 bg-white hover:border-zenible-primary/50 text-gray-600'
                  }`}
                >
                  <div className={`text-xs font-medium ${
                    selectedObjective === obj.id
                      ? 'text-zenible-primary'
                      : darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {obj.label}
                  </div>
                  {obj.description && (
                    <div className={`text-xs mt-0.5 ${
                      selectedObjective === obj.id
                        ? darkMode ? 'text-zenible-primary/70' : 'text-purple-500'
                        : darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'
                    }`}>
                      {obj.description}
                    </div>
                  )}
                </button>
              ))}
              {selectedObjective === 'other' && (
                <input
                  type="text"
                  value={customObjectiveText}
                  onChange={(e) => onCustomObjectiveTextChange(e.target.value)}
                  placeholder="Describe your objective..."
                  className={`text-xs px-3 py-2 rounded-lg border flex-1 min-w-[200px] ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400'
                  }`}
                />
              )}
            </div>
          )}
        </React.Fragment>
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
