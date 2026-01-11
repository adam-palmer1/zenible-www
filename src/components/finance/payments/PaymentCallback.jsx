import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import paymentIntegrationsAPI from '../../../services/api/finance/paymentIntegrations';

/**
 * Payment Gateway OAuth Callback Handler
 * Handles OAuth redirects from Stripe and PayPal
 */
const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing payment gateway connection...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for errors from provider
      if (error) {
        setStatus('error');
        setMessage(errorDescription || `OAuth error: ${error}`);
        setTimeout(() => {
          navigate('/settings/payment-integrations');
        }, 3000);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters');
        setTimeout(() => {
          navigate('/settings/payment-integrations');
        }, 3000);
        return;
      }

      // Determine provider from state (stored in session storage)
      let provider = null;
      const stripeState = sessionStorage.getItem('stripe_oauth_state');
      const paypalState = sessionStorage.getItem('paypal_oauth_state');

      if (state === stripeState) {
        provider = 'stripe';
        sessionStorage.removeItem('stripe_oauth_state');
      } else if (state === paypalState) {
        provider = 'paypal';
        sessionStorage.removeItem('paypal_oauth_state');
      } else {
        setStatus('error');
        setMessage('Invalid OAuth state. Please try connecting again.');
        setTimeout(() => {
          navigate('/settings/payment-integrations');
        }, 3000);
        return;
      }

      // Complete OAuth flow with backend
      setMessage(`Connecting ${provider === 'stripe' ? 'Stripe' : 'PayPal'}...`);

      await paymentIntegrationsAPI.handleOAuthCallback({
        provider,
        code,
        state,
      });

      // Success!
      setStatus('success');
      setMessage(`${provider === 'stripe' ? 'Stripe' : 'PayPal'} connected successfully!`);

      // Redirect to settings after 2 seconds
      setTimeout(() => {
        navigate('/settings/payment-integrations');
      }, 2000);
    } catch (error) {
      console.error('[PaymentCallback] Error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect payment gateway. Please try again.');

      // Redirect to settings after 3 seconds
      setTimeout(() => {
        navigate('/settings/payment-integrations');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zenible-dark-bg">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-zenible-dark-card rounded-lg shadow-lg p-8 text-center">
          {/* Status Icon */}
          <div className="mb-4">
            {status === 'processing' && (
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-zenible-primary mx-auto"></div>
            )}
            {status === 'success' && (
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          {/* Message */}
          <h2 className="text-xl font-semibold text-design-text-primary mb-2">
            {status === 'processing' && 'Connecting Payment Gateway'}
            {status === 'success' && 'Connection Successful!'}
            {status === 'error' && 'Connection Failed'}
          </h2>
          <p className="text-design-text-muted">
            {message}
          </p>

          {/* Redirect Message */}
          {(status === 'success' || status === 'error') && (
            <p className="mt-4 text-sm text-design-text-muted">
              Redirecting to settings...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
