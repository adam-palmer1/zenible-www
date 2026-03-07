import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePreferences } from '../../../contexts/PreferencesContext';
import ZMIWebSocketService from '../../../services/ZMIWebSocketService';
import BotStatusBadge from './BotStatusBadge';
import type { TranscriptEntry } from '../../../types/meetingIntelligence';

interface LiveTranscriptionProps {
  sessionId: string;
  onClose?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const LiveTranscription: React.FC<LiveTranscriptionProps> = ({ sessionId, onClose }) => {
  const { darkMode } = usePreferences();
  const [connected, setConnected] = useState(false);
  const [botStatus, setBotStatus] = useState('connecting');
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<ZMIWebSocketService | null>(null);

  const getToken = useCallback(() => localStorage.getItem('access_token'), []);

  useEffect(() => {
    const ws = new ZMIWebSocketService({
      baseUrl: API_BASE_URL,
      getAccessToken: getToken,
      onConnectionChange: setConnected,
      onTranscript: (entry) => {
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
      onError: (data) => {
        setError(data.message);
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
      ws.unsubscribeSession(sessionId);
      ws.disconnect();
    };
  }, [sessionId, getToken]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries]);

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
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`text-sm px-2 py-1 rounded ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Close
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className={`px-4 py-2 text-sm ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Transcript entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '400px' }}>
        {entries.length === 0 && !error && (
          <p className={`text-sm text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
            Waiting for transcription...
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

export default LiveTranscription;
