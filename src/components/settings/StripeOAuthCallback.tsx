import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import paymentIntegrationsAPI from '../../services/api/finance/paymentIntegrations';

/**
 * Stripe OAuth Callback Handler
 * Handles the redirect back from Stripe OAuth authorization
 */
const StripeOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth error from Stripe
      if (errorParam) {
        setStatus('error');
        setError(errorDescription || errorParam || 'Authorization was denied');
        setTimeout(() => {
          navigate('/settings?tab=integrations&stripe_error=denied');
        }, 2000);
        return;
      }

      // Validate required params
      if (!code || !state) {
        setStatus('error');
        setError('Missing authorization code or state parameter');
        setTimeout(() => {
          navigate('/settings?tab=integrations&stripe_error=invalid');
        }, 2000);
        return;
      }

      try {
        // Exchange code for access token via backend
        await paymentIntegrationsAPI.handleStripeOAuthCallback(code, state);
        setStatus('success');

        // Redirect to settings with success indicator
        setTimeout(() => {
          navigate('/settings?tab=integrations&stripe_connected=true');
        }, 1500);
      } catch (err) {
        console.error('[StripeOAuthCallback] Error:', err);
        setStatus('error');
        setError(err.message || 'Failed to complete Stripe connection');

        // Redirect to settings with error
        setTimeout(() => {
          navigate('/settings?tab=integrations&stripe_error=failed');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md px-4">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-[#635bff] mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connecting your Stripe account...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we complete the authorization.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Stripe Connected!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting you back to settings...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting you back to settings...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default StripeOAuthCallback;
