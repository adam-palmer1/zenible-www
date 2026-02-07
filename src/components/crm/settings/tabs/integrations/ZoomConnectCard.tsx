import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import zoomAPI from '../../../../../services/api/crm/zoom';

interface ZoomConnectUrlResponse {
  authorization_url: string;
  state: string;
}

// Zoom logo SVG component
const ZoomLogo = ({ className = 'h-6 w-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.5 4.5C4.5 3.11929 5.61929 2 7 2H17C18.3807 2 19.5 3.11929 19.5 4.5V15C19.5 15.8284 18.8284 16.5 18 16.5H16.5L19.5 19.5V15H20.25C21.4926 15 22.5 13.9926 22.5 12.75V6.75C22.5 5.50736 21.4926 4.5 20.25 4.5H19.5V4.5ZM7 3.5C6.44772 3.5 6 3.94772 6 4.5V15C6 15.5523 6.44772 16 7 16H15C15.5523 16 16 15.5523 16 15V4.5C16 3.94772 15.5523 3.5 15 3.5H7ZM7 17.5C5.61929 17.5 4.5 16.3807 4.5 15V6H3.75C2.50736 6 1.5 7.00736 1.5 8.25V17.25C1.5 18.4926 2.50736 19.5 3.75 19.5H4.5V22.5L7.5 19.5H14.25C15.4926 19.5 16.5 18.4926 16.5 17.25V17.5H7Z" />
  </svg>
);

interface ZoomStatus {
  is_connected: boolean;
  account?: {
    zoom_email?: string;
  } | null;
}

const ZoomConnectCard = ({ onStatusChange }: { onStatusChange?: (gateway: string, status: any) => void }) => {
  const [status, setStatus] = useState<ZoomStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load Zoom status
  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await zoomAPI.getStatus() as ZoomStatus;
      setStatus(data);
      return data;
    } catch (err: any) {
      console.error('[ZoomConnect] Error loading status:', err);
      if (err.status !== 404) {
        setError(err.message);
      }
      const fallbackStatus = { is_connected: false, account: null };
      setStatus(fallbackStatus);
      return fallbackStatus;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      loadStatus().then((data) => {
        onStatusChange?.('zoom', data);
      });
    }
  }, [initialized, loadStatus, onStatusChange]);

  // Start Zoom OAuth flow
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);

      const { authorization_url, state } = await zoomAPI.getConnectUrl() as ZoomConnectUrlResponse;

      // Store state for validation
      sessionStorage.setItem('zoom_oauth_state', state);

      // Redirect to Zoom OAuth
      window.location.href = authorization_url;
    } catch (err: any) {
      console.error('[ZoomConnect] Error connecting:', err);
      setError(err.message || 'Failed to start Zoom connection');
      setConnecting(false);
    }
  };

  // Disconnect Zoom
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Zoom? Auto-generated meeting links will no longer work for new bookings.')) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);
      await zoomAPI.disconnect();
      const newStatus = { is_connected: false, account: null };
      setStatus(newStatus);
      onStatusChange?.('zoom', newStatus);
    } catch (_err) {
      setError('Failed to disconnect Zoom');
    } finally {
      setDisconnecting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#2D8CFF]/10 rounded-lg">
            <ZoomLogo className="h-6 w-6 text-[#2D8CFF]" />
          </div>
          <div className="flex-1">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
    );
  }

  // Error display helper
  const ErrorDisplay = () =>
    error ? (
      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    ) : null;

  // Not connected state
  if (!status?.is_connected) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#2D8CFF]/10 rounded-lg">
            <ZoomLogo className="h-6 w-6 text-[#2D8CFF]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Zoom</h4>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                Not Connected
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Connect Zoom to automatically generate meeting links for your call bookings.
            </p>
            <ErrorDisplay />
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D8CFF] hover:bg-[#2681F2] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ZoomLogo className="h-4 w-4" />
                  Connect with Zoom
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connected state
  return (
    <div className="p-6 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-[#2D8CFF]/10 rounded-lg">
          <ZoomLogo className="h-6 w-6 text-[#2D8CFF]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Zoom</h4>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
              <CheckCircleIcon className="h-3 w-3" />
              Connected
            </span>
          </div>
          {status.account?.zoom_email && (
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {status.account.zoom_email}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Zoom meeting links will be auto-generated for call bookings.
          </p>
          <ErrorDisplay />
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoomConnectCard;
