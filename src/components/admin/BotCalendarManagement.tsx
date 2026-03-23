import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import logger from '../../utils/logger';

interface AdminOutletContext {
  darkMode: boolean;
}

interface BotCalendarStatus {
  connected: boolean;
  email?: string;
  last_sync_at?: string;
  is_active?: boolean;
}

export default function BotCalendarManagement() {
  const { darkMode } = useOutletContext<AdminOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [callbackProcessing, setCallbackProcessing] = useState(false);
  const [status, setStatus] = useState<BotCalendarStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check if this is an OAuth callback redirect
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError(`Google OAuth error: ${oauthError}`);
      setSearchParams({}, { replace: true });
      fetchStatus();
    } else if (code && state) {
      handleCallback(code, state);
    } else {
      fetchStatus();
    }
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getBotCalendarStatus() as BotCalendarStatus;
      setStatus(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to fetch bot calendar status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const data = await adminAPI.getBotCalendarConnectUrl() as { authorization_url: string; state: string };

      // Save state for CSRF validation
      sessionStorage.setItem('bot_calendar_oauth_state', data.state);

      // Redirect to Google OAuth
      window.location.href = data.authorization_url;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to generate authorization URL');
      setConnecting(false);
    }
  };

  const handleCallback = async (code: string, state: string) => {
    try {
      setCallbackProcessing(true);
      setLoading(true);

      // CSRF validation
      const savedState = sessionStorage.getItem('bot_calendar_oauth_state');
      if (state !== savedState) {
        setError('Invalid state token. Possible CSRF attack. Please try again.');
        logger.error('Bot calendar OAuth state mismatch', { received: state, expected: savedState });
        setSearchParams({}, { replace: true });
        await fetchStatus();
        return;
      }

      const result = await adminAPI.handleBotCalendarCallback(code, state) as { success: boolean; email: string };

      sessionStorage.removeItem('bot_calendar_oauth_state');
      setSearchParams({}, { replace: true });

      if (result.success) {
        setSuccess(`Successfully connected bot account: ${result.email}`);
      }

      await fetchStatus();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || 'Failed to complete OAuth connection');
      sessionStorage.removeItem('bot_calendar_oauth_state');
      setSearchParams({}, { replace: true });
      await fetchStatus();
    } finally {
      setCallbackProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Bot Calendar
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage the bot Google account used for calendar polling and invite handling
        </p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Messages */}
        {error && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1">
              <p className="text-sm">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Processing callback */}
        {callbackProcessing && (
          <div className={`p-6 rounded-xl border text-center ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
            <p className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-700'}`}>
              Connecting bot Google account...
            </p>
          </div>
        )}

        {/* Status Card */}
        {!callbackProcessing && (
          <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Connection Status
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                    Loading...
                  </span>
                </div>
              ) : status?.connected ? (
                <div className="space-y-4">
                  {/* Connected indicator */}
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                      Connected
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                        Email
                      </span>
                      <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'}`}>
                        {status.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                        Last Sync
                      </span>
                      <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'}`}>
                        {status.last_sync_at ? formatDate(status.last_sync_at) : 'Never'}
                      </span>
                    </div>
                  </div>

                  {/* Reconnect button */}
                  <div className={`pt-4 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                        darkMode
                          ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border'
                          : 'border-neutral-300 text-zinc-700 hover:bg-neutral-50'
                      } disabled:opacity-50`}
                    >
                      {connecting ? 'Redirecting...' : 'Reconnect Account'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Not connected indicator */}
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                      Not Connected
                    </span>
                  </div>

                  <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                    Connect the bot Google account to enable calendar polling and automatic invite handling.
                  </p>

                  {/* Connect button */}
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="bg-[#8B5CF6] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
                  >
                    {connecting ? 'Redirecting...' : 'Connect Google Account'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
