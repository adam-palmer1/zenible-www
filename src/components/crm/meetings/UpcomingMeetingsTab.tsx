import React, { useState } from 'react';
import BotStatusBadge from './BotStatusBadge';
import { usePreferences } from '../../../contexts/PreferencesContext';
import type { BotStatus, UpcomingMeeting } from '../../../types/meetingIntelligence';

const PLATFORM_ICONS: Record<string, string> = {
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
};

interface UpcomingMeetingsTabProps {
  loading: boolean;
  upcomingMeetings: UpcomingMeeting[];
  botStatuses: Record<string, BotStatus>;
  appointmentSessions: Record<string, string>;
  activeBotCount: number;
  maxActiveBots: number;
  loadingAppointment: string | null;
  dispatching: string | null;
  retrying: string | null;
  /** Called with the trimmed link; returns message to show (success/error) or null. */
  onQuickDispatch: (link: string) => Promise<{ ok: boolean; message: string }>;
  onMeetingClick: (meeting: UpcomingMeeting) => void;
  onDispatchBot: (appointmentId: string, instanceStartDatetime?: string) => void;
  onRetryBot: (appointmentId: string) => void;
}

const UpcomingMeetingsTab: React.FC<UpcomingMeetingsTabProps> = ({
  loading,
  upcomingMeetings,
  botStatuses,
  appointmentSessions,
  activeBotCount,
  maxActiveBots,
  loadingAppointment,
  dispatching,
  retrying,
  onQuickDispatch,
  onMeetingClick,
  onDispatchBot,
  onRetryBot,
}) => {
  const { darkMode } = usePreferences();
  const [quickLink, setQuickLink] = useState('');
  const [quickDispatching, setQuickDispatching] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);
  const [showOnlyWithLinks, setShowOnlyWithLinks] = useState(false);

  const handleQuickDispatch = async () => {
    const link = quickLink.trim();
    if (!link) return;
    if (activeBotCount >= maxActiveBots) {
      setQuickError(`Maximum ${maxActiveBots} active bots allowed. Stop an existing bot first.`);
      return;
    }
    setQuickDispatching(true);
    setQuickError(null);
    setQuickSuccess(null);
    const result = await onQuickDispatch(link);
    if (result.ok) {
      setQuickLink('');
      setQuickSuccess(result.message);
      setTimeout(() => setQuickSuccess(null), 3000);
    } else {
      setQuickError(result.message);
    }
    setQuickDispatching(false);
  };

  const filtered = showOnlyWithLinks ? upcomingMeetings.filter((m) => m.meeting_link) : upcomingMeetings;

  return (
    <div className="space-y-3">
      {/* Quick dispatch box */}
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
        <label className={`text-xs font-medium mb-2 block ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          Send bot to a meeting now
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={quickLink}
            onChange={(e) => { setQuickLink(e.target.value); setQuickError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickDispatch(); }}
            placeholder="Paste a meeting link (Teams, Zoom, Google Meet...)"
            aria-label="Meeting link to dispatch bot"
            className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
          <button
            onClick={handleQuickDispatch}
            disabled={quickDispatching || !quickLink.trim() || activeBotCount >= maxActiveBots}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              quickDispatching || !quickLink.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-zenible-primary text-white hover:opacity-90'
            }`}
          >
            {quickDispatching ? 'Sending...' : 'Send Bot'}
          </button>
        </div>
        {quickError && <p className="text-xs text-red-500 mt-1" role="alert">{quickError}</p>}
        {quickSuccess && <p className="text-xs text-green-500 mt-1" role="status">{quickSuccess}</p>}
      </div>

      {/* Filter toggle */}
      <label className={`flex items-center gap-2 text-sm cursor-pointer ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
        <input
          type="checkbox"
          checked={showOnlyWithLinks}
          onChange={(e) => setShowOnlyWithLinks(e.target.checked)}
          className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
        />
        Only show meetings with links
      </label>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          <p className="text-lg">{showOnlyWithLinks ? 'No meetings with links' : 'No upcoming meetings'}</p>
          <p className="text-sm mt-1">{showOnlyWithLinks ? 'Try disabling the filter above' : 'Create an appointment to get started'}</p>
        </div>
      ) : (
        filtered.map((meeting) => {
          const meetingSessionId = appointmentSessions[meeting.id] || meeting.bot_session_id;
          const sessionEntry = meetingSessionId ? botStatuses[meetingSessionId] : undefined;
          const activeSession = sessionEntry && sessionEntry.status !== 'ended' && sessionEntry.status !== 'error' ? sessionEntry : undefined;
          const meetingNotEnded = meeting.end_datetime && new Date(meeting.end_datetime) > new Date();
          const showResend = !activeSession && meetingNotEnded && meeting.meeting_link && (
            meeting.bot_dispatch_status === 'failed' ||
            (sessionEntry && ['ended', 'error'].includes(sessionEntry.status))
          );
          const showStartBot = meeting.meeting_link && !activeSession && !showResend && meeting.bot_dispatch_status !== 'failed';
          return (
            <div
              key={meeting.id}
              onClick={() => onMeetingClick(meeting)}
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                showStartBot
                  ? `border-2 ${darkMode ? 'border-zenible-primary/60 bg-zenible-dark-card hover:border-zenible-primary' : 'border-zenible-primary/40 bg-white hover:border-zenible-primary'}`
                  : `border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border hover:border-zenible-primary/50' : 'bg-white border-gray-200 hover:border-zenible-primary/50'}`
              } ${loadingAppointment === meeting.id ? 'opacity-60' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {meeting.title}
                  </h4>
                  {meeting.platform && (
                    <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-gray-100 text-gray-600'}`}>
                      {PLATFORM_ICONS[meeting.platform] || meeting.platform}
                    </span>
                  )}
                  {meeting.bot_dispatch_source === 'invited' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Invited &amp; Accepted</span>
                  )}
                  {meeting.bot_dispatch_source === 'auto' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Auto-joining</span>
                  )}
                  {meeting.bot_dispatch_status === 'pending' && !meeting.bot_dispatch_source && (
                    <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Bot scheduled</span>
                  )}
                  {meeting.bot_dispatch_status === 'skipped' && (
                    <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`} title={meeting.bot_dispatch_error || 'Skipped'}>
                      Skipped
                    </span>
                  )}
                  {meeting.bot_dispatch_status === 'failed' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700" title={meeting.bot_dispatch_error || 'Failed'}>
                      Failed
                    </span>
                  )}
                  {!meeting.bot_dispatch_status && !meeting.bot_dispatch_source && meeting.zmi_enabled !== false && meeting.zmi_enabled !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>Will auto-join</span>
                  )}
                  {meeting.zmi_enabled === false && !meeting.bot_dispatch_source && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">ZMI Off</span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  {(() => {
                    const start = new Date(meeting.start_datetime);
                    const end = new Date(meeting.end_datetime);
                    const sameDay = start.toDateString() === end.toDateString();
                    const startStr = start.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
                    if (sameDay) {
                      const endTime = end.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
                      return `${startStr} - ${endTime}`;
                    }
                    const endStr = end.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                    return `${startStr} - ${endStr}`;
                  })()}
                </p>
              </div>
              {meeting.meeting_link && (
                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  {activeSession ? (
                    <BotStatusBadge status={activeSession.status} />
                  ) : showResend ? (
                    <button
                      onClick={() => onRetryBot(meeting.id)}
                      disabled={retrying === meeting.id}
                      className={`text-xs px-3 py-1.5 rounded bg-orange-500 text-white hover:bg-orange-600 ${retrying === meeting.id ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {retrying === meeting.id ? 'Resending...' : 'Resend Bot'}
                    </button>
                  ) : showStartBot ? (
                    <button
                      onClick={() => onDispatchBot(
                        meeting.parent_appointment_id || meeting.id,
                        meeting.parent_appointment_id ? meeting.start_datetime : undefined,
                      )}
                      disabled={dispatching === meeting.id || meeting.zmi_enabled === false || activeBotCount >= maxActiveBots}
                      className={`text-xs px-3 py-1.5 rounded transition-colors ${
                        meeting.zmi_enabled === false
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-zenible-primary text-white hover:opacity-90'
                      } ${dispatching === meeting.id ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {dispatching === meeting.id ? 'Starting...' : 'Start Bot'}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default UpcomingMeetingsTab;
