import React, { useState, useEffect, useCallback } from 'react';
import { usePreferences } from '../../../contexts/PreferencesContext';
import meetingIntelligenceAPI from '../../../services/api/crm/meetingIntelligence';
import BotStatusBadge from './BotStatusBadge';
import LiveTranscription from './LiveTranscription';
import MeetingIntelligenceSettingsTab from '../../user-settings/MeetingIntelligenceSettingsTab';
import type { UpcomingMeeting, MeetingListItem, BotStatus } from '../../../types/meetingIntelligence';

type SubTab = 'upcoming' | 'past' | 'settings';

const PLATFORM_ICONS: Record<string, string> = {
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
};

const MeetingsPage: React.FC = () => {
  const { darkMode } = usePreferences();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('upcoming');
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBotSession, setActiveBotSession] = useState<string | null>(null);
  const [botStatuses, setBotStatuses] = useState<Record<string, BotStatus>>({});
  const [dispatching, setDispatching] = useState<string | null>(null);

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

  const fetchPast = useCallback(async () => {
    try {
      const data = await meetingIntelligenceAPI.listMeetings() as MeetingListItem[];
      setPastMeetings(data);
    } catch {
      // Silently fail for past meetings
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUpcoming(), fetchPast()]).finally(() => setLoading(false));
  }, [fetchUpcoming, fetchPast]);

  const handleDispatchBot = async (appointmentId: string) => {
    try {
      setDispatching(appointmentId);
      setError(null);
      const result = await meetingIntelligenceAPI.dispatchBot(appointmentId) as { session_id: string; status: string };
      setActiveBotSession(result.session_id);
      setBotStatuses((prev) => ({
        ...prev,
        [result.session_id]: { session_id: result.session_id, status: result.status } as BotStatus,
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch bot');
    } finally {
      setDispatching(null);
    }
  };

  const handleLeaveBot = async (sessionId: string) => {
    try {
      await meetingIntelligenceAPI.leaveBot(sessionId);
      setBotStatuses((prev) => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], status: 'ended' } as BotStatus,
      }));
      if (activeBotSession === sessionId) {
        setActiveBotSession(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to stop bot');
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const subTabs: { id: SubTab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past Meetings' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className={`flex gap-1 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
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

      {/* Live transcription panel */}
      {activeBotSession && (
        <LiveTranscription
          sessionId={activeBotSession}
          onClose={() => setActiveBotSession(null)}
        />
      )}

      {/* Tab content */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary" />
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              <p className="text-lg">No upcoming meetings with video links</p>
              <p className="text-sm mt-1">Create an appointment with a meeting link to use Meeting Intelligence</p>
            </div>
          ) : (
            upcomingMeetings.map((meeting) => {
              const sessionEntry = Object.values(botStatuses).find(
                (bs) => bs.status !== 'ended' && bs.status !== 'error'
              );
              return (
                <div
                  key={meeting.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {meeting.title}
                      </h4>
                      {meeting.platform && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-gray-100 text-gray-600'}`}>
                          {PLATFORM_ICONS[meeting.platform] || meeting.platform}
                        </span>
                      )}
                      {meeting.zmi_enabled === true && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">ZMI On</span>
                      )}
                      {meeting.zmi_enabled === false && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">ZMI Off</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      {formatTime(meeting.start_datetime)} - {formatTime(meeting.end_datetime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {sessionEntry ? (
                      <>
                        <BotStatusBadge status={sessionEntry.status} />
                        <button
                          onClick={() => handleLeaveBot(sessionEntry.session_id)}
                          className="text-xs px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
                        >
                          Stop
                        </button>
                        <button
                          onClick={() => setActiveBotSession(sessionEntry.session_id)}
                          className="text-xs px-3 py-1.5 rounded bg-zenible-primary text-white hover:opacity-90"
                        >
                          View
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDispatchBot(meeting.id)}
                        disabled={dispatching === meeting.id || meeting.zmi_enabled === false}
                        className={`text-xs px-3 py-1.5 rounded transition-colors ${
                          meeting.zmi_enabled === false
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-zenible-primary text-white hover:opacity-90'
                        } ${dispatching === meeting.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {dispatching === meeting.id ? 'Starting...' : 'Start Bot'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeSubTab === 'past' && (
        <div className="space-y-2">
          {pastMeetings.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              <p>No past meetings recorded yet</p>
            </div>
          ) : (
            pastMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {meeting.title || 'Untitled Meeting'}
                    </h4>
                    {meeting.source && (
                      <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-gray-100 text-gray-600'}`}>
                        {meeting.source}
                      </span>
                    )}
                    {meeting.transcript_count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        {meeting.transcript_count} transcript{meeting.transcript_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-3 mt-1 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    {meeting.start_time && (
                      <span>{formatTime(meeting.start_time)}</span>
                    )}
                    {meeting.duration_ms != null && meeting.duration_ms > 0 && (
                      <span>{Math.round(meeting.duration_ms / 60000)} min</span>
                    )}
                  </div>
                </div>
                {meeting.is_processed && (
                  <span className={`text-xs px-2 py-0.5 rounded ml-4 ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
                    Processed
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'settings' && <MeetingIntelligenceSettingsTab />}
    </div>
  );
};

export default MeetingsPage;
