import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import zoomAPI from '../../services/api/crm/zoom';

type CallbackStatus = 'processing' | 'success' | 'error';

const ZoomCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth error
      if (errorParam) {
        setStatus('error');
        setError(errorDescription || errorParam || 'Zoom authorization was denied');
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setError('Missing authorization code or state parameter');
        return;
      }

      // Validate state matches (CSRF protection)
      const storedState = sessionStorage.getItem('zoom_oauth_state');
      if (state !== storedState) {
        setStatus('error');
        setError('Invalid state parameter. Please try connecting again.');
        return;
      }

      // Clear stored state
      sessionStorage.removeItem('zoom_oauth_state');

      try {
        // Exchange code for tokens
        await (zoomAPI as any).handleCallback(code, state);
        setStatus('success');

        // Redirect to integrations tab after a short delay
        setTimeout(() => {
          navigate('/settings?tab=integrations', { replace: true });
        }, 2000);
      } catch (err: any) {
        console.error('Error handling Zoom callback:', err);
        setStatus('error');
        setError(err.message || 'Failed to connect Zoom account');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  // Processing state
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D8CFF] mx-auto mb-6"></div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connecting Zoom...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we complete the connection.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Zoom Connected!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your Zoom account has been successfully connected.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to settings...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connection Failed
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error}
        </p>
        <button
          onClick={() => navigate('/settings?tab=integrations', { replace: true })}
          className="inline-flex items-center px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Back to Settings
        </button>
      </div>
    </div>
  );
};

export default ZoomCallback;
