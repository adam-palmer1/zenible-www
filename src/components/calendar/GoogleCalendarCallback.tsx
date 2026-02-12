import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import appointmentsAPI from '../../services/api/crm/appointments';
import logger from '../../utils/logger';

/**
 * Google Calendar OAuth callback handler page
 * Route: /auth/calendar/callback
 */
const GoogleCalendarCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Extract parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // Check for errors from Google
      if (errorParam) {
        setStatus('error');
        setMessage(`OAuth error: ${errorParam}`);
        setTimeout(() => navigate('/calendar'), 3000);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code or state parameter');
        setTimeout(() => navigate('/calendar'), 3000);
        return;
      }

      // CSRF Protection: Validate state token
      const savedState = sessionStorage.getItem('google_calendar_oauth_state');
      if (state !== savedState) {
        setStatus('error');
        setMessage('Invalid state token. Possible CSRF attack.');
        logger.error('State mismatch:', { received: state, expected: savedState });
        setTimeout(() => navigate('/calendar'), 3000);
        return;
      }

      setMessage('Connecting to Google Calendar...');

      // Exchange code for tokens via backend
      const response = await appointmentsAPI.handleGoogleCallback<{ success: boolean }>(code, state);

      if (response.success) {
        // Clean up state token
        sessionStorage.removeItem('google_calendar_oauth_state');

        setStatus('success');
        setMessage('Successfully connected to Google Calendar!');

        // Redirect to calendar page after 2 seconds
        setTimeout(() => {
          navigate('/calendar', {
            state: { message: 'Google Calendar connected successfully' }
          });
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Failed to complete Google Calendar connection');
        setTimeout(() => navigate('/calendar'), 3000);
      }

    } catch (error: unknown) {
      logger.error('OAuth callback error:', error);
      setStatus('error');
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      setMessage(
        err.response?.data?.detail ||
        err.message ||
        'An error occurred while connecting to Google Calendar'
      );

      // Clean up state token even on error
      sessionStorage.removeItem('google_calendar_oauth_state');

      setTimeout(() => navigate('/calendar'), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-4 md:p-8 rounded-lg shadow-md max-w-md w-full">
        {status === 'processing' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
              Connecting...
            </h2>
            <p className="text-center text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
              Success!
            </h2>
            <p className="text-center text-gray-600">{message}</p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Redirecting to calendar...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
              Connection Failed
            </h2>
            <p className="text-center text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/calendar')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Return to Calendar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;
