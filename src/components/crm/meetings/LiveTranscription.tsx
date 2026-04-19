import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePreferences } from '../../../contexts/PreferencesContext';
import ZMIWebSocketService from '../../../services/ZMIWebSocketService';
import BotStatusBadge from './BotStatusBadge';
import meetingIntelligenceAPI from '../../../services/api/crm/meetingIntelligence';
import logger from '../../../utils/logger';
import type { TranscriptEntry } from '../../../types/meetingIntelligence';

interface LiveTranscriptionProps {
  sessionId: string;
  onClose?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const LiveTranscription: React.FC<LiveTranscriptionProps> = ({ sessionId, onClose }) => {
  const { darkMode } = usePreferences();
  const [connected, setConnected] = useState(false);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [botStatus, setBotStatus] = useState('connecting');
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<ZMIWebSocketService | null>(null);

  const getToken = useCallback(() => localStorage.getItem('access_token'), []);

  // Fetch real bot status immediately on mount (WebSocket only sends changes, not current state)
  useEffect(() => {
    meetingIntelligenceAPI.getBotStatus(sessionId).then((data: any) => {
      if (data?.status) setBotStatus(data.status);
    }).catch((err: unknown) => {
      // Initial poll fails when the session just started — WS will catch us up.
      logger.debug('[LiveTranscription] Initial bot status fetch failed:', err);
    });
  }, [sessionId]);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const ws = new ZMIWebSocketService({
      baseUrl: API_BASE_URL,
      getAccessToken: getToken,
      onConnectionChange: setConnected,
      onTranscript: (entry) => {
        retryCount = 0; // reset on successful transcript
        setEntries((prev) => {
          // Replace partial with final for same speaker
          if (entry.is_final && prev.length > 0) {
            const last = prev[prev.length - 1];
            if (!last.is_final && last.speaker === entry.speaker) {
              return [...prev.slice(0, -1), entry];
            }
          }
          return [...prev, entry];
        });
      },
      onBotStatus: (data) => {
        if (data.session_id === sessionId) {
          setBotStatus(data.status);
        }
      },
      onTranscriptionReady: () => {
        setBridgeReady(true);
      },
      onError: (data) => {
        // Retry subscription on transient bridge errors
        if (data.error === 'bot_not_in_meeting' && retryCount < MAX_RETRIES) {
          retryCount++;
          retryTimer = setTimeout(() => {
            ws.subscribeSession(sessionId);
          }, 5000);
          return;
        }
        setError(data.message || 'Transcription connection failed');
      },
    });

    wsRef.current = ws;

    ws.connect()
      .then(() => {
        ws.subscribeSession(sessionId);
      })
      .catch((err) => {
        setError(`Connection failed: ${err.message}`);
      });

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      ws.unsubscribeSession(sessionId);
      ws.disconnect();
    };
  }, [sessionId, getToken]);

  // Track when this component mounted (for joining timeout detection)
  const mountedAtRef = useRef(Date.now());

  // Poll REST status when WebSocket disconnects OR when stuck in connecting/joining
  useEffect(() => {
    const isStuckJoining = (botStatus === 'connecting' || botStatus === 'joining') &&
      (Date.now() - mountedAtRef.current) > 30_000;

    // Only poll if disconnected or stuck in joining state
    if (connected && !isStuckJoining) return;

    let cancelled = false;
    const checkStatus = async () => {
      try {
        const data = await meetingIntelligenceAPI.getBotStatus(sessionId) as { status?: string };
        if (cancelled) return;
        const status = data?.status;
        if (status) setBotStatus(status);
        if (status === 'ended' || status === 'error') {
          setTimeout(() => { if (!cancelled) onClose?.(); }, 2000);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        // 404 = session not found on bot, treat as error
        const is404 = err instanceof Error && err.message.includes('404');
        setBotStatus(is404 ? 'error' : 'ended');
        setTimeout(() => { if (!cancelled) onClose?.(); }, 2000);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [connected, botStatus, sessionId, onClose]);

  // Joining timeout: if stuck in connecting/joining for >60s with no transcription, auto-close
  useEffect(() => {
    if (botStatus !== 'connecting' && botStatus !== 'joining') return;
    const timer = setTimeout(() => {
      if (entries.length === 0) {
        setBotStatus('error');
        setError('Bot failed to join the meeting');
        setTimeout(() => onClose?.(), 3000);
      }
    }, 60_000);
    return () => clearTimeout(timer);
  }, [botStatus, entries.length, onClose]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries]);

  const handleStartRecording = async () => {
    setRecordingLoading(true);
    try {
      await meetingIntelligenceAPI.startRecording(sessionId);
      setIsRecording(true);
      setRecordingStartedAt(Date.now());
    } catch (err: any) {
      setError(`Failed to start recording: ${err.message || 'Unknown error'}`);
    } finally {
      setRecordingLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setRecordingLoading(true);
    try {
      await meetingIntelligenceAPI.stopRecording(sessionId);
      setIsRecording(false);
      setRecordingStartedAt(null);
    } catch (err: any) {
      setError(`Failed to stop recording: ${err.message || 'Unknown error'}`);
    } finally {
      setRecordingLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Live Transcription
          </h3>
          <BotStatusBadge status={botStatus} />
          {/* Connection indicator */}
          <span className={`inline-flex h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          {/* Recording indicator — isolated so the 1s tick doesn't re-render the transcript list. */}
          {isRecording && recordingStartedAt != null && (
            <RecordingIndicator startTime={recordingStartedAt} />
          )}
        </div>
        {/* Recording controls */}
        <div className="flex items-center gap-2">
          {botStatus === 'in_meeting' && (
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
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
          {onClose && (
            <button
              onClick={onClose}
              className={`text-sm px-2 py-1 rounded ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`px-4 py-2 text-sm ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Transcript entries */}
      <div ref={scrollRef} className="overflow-y-auto p-4 space-y-3" style={{ height: '20rem' }}>
        {entries.length === 0 && !error && (
          <p className={`text-sm text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
            {!connected
              ? 'Connecting to transcription service...'
              : !bridgeReady
                ? 'Establishing audio bridge...'
                : 'Listening — transcripts will appear when someone speaks'}
          </p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className={`text-sm ${!entry.is_final ? 'opacity-60' : ''}`}>
            {entry.speaker && (
              <span className={`font-medium ${darkMode ? 'text-zenible-primary' : 'text-purple-600'}`}>
                {entry.speaker}:{' '}
              </span>
            )}
            <span className={darkMode ? 'text-zenible-dark-text-primary' : 'text-gray-800'}>
              {entry.text}
            </span>
            {entry.timestamp && (
              <span className={`ml-2 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Localized 1-second ticker for the REC badge. Isolated from LiveTranscription so
 * per-second ticks only re-render this tiny component, not the transcript list.
 */
const RecordingIndicator: React.FC<{ startTime: number }> = ({ startTime }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startTime) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-red-500" role="status" aria-live="off">
      <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
      REC {m}:{s.toString().padStart(2, '0')}
    </span>
  );
};

export default LiveTranscription;
