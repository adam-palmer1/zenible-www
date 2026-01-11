import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCardIcon,
  CalendarIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import paymentIntegrationsAPI from '../../../../services/api/finance/paymentIntegrations';

// Stripe logo SVG component
const StripeLogo = ({ className = 'h-6 w-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
  </svg>
);

// PayPal logo SVG component
const PayPalLogo = ({ className = 'h-6 w-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.773.773 0 0 1 .763-.651h6.154c2.047 0 3.674.474 4.836 1.408 1.203.967 1.777 2.412 1.705 4.3-.085 2.2-.89 4.017-2.39 5.395-1.476 1.358-3.48 2.047-5.955 2.047H7.927a.77.77 0 0 0-.76.653l-.995 5.214a.641.641 0 0 1-.633.54.297.297 0 0 1-.463-.786z" />
    <path d="M19.66 7.132c-.085 2.2-.89 4.017-2.39 5.395-1.476 1.358-3.48 2.047-5.955 2.047H9.186a.77.77 0 0 0-.76.653l-1.29 6.758a.424.424 0 0 0 .419.493h3.18a.67.67 0 0 0 .662-.567l.028-.145.527-3.344.034-.185a.67.67 0 0 1 .662-.567h.418c2.7 0 4.816-.549 6.1-2.136.546-.673.92-1.48 1.132-2.393.224-.962.273-1.898.162-2.76a4.17 4.17 0 0 0-.8-2.249z" />
  </svg>
);

/**
 * Stripe Connect Card Component
 */
const StripeConnectCard = ({ onStatusChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Load Stripe status
  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentIntegrationsAPI.getStripeConnectStatus();
      setStatus(data);
      return data;
    } catch (err) {
      console.error('[StripeConnect] Error loading status:', err);
      // Not connected is a valid state
      if (err.status !== 404) {
        setError(err.message);
      }
      const fallbackStatus = { is_connected: false };
      setStatus(fallbackStatus);
      return fallbackStatus;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle return from Stripe OAuth
  useEffect(() => {
    const handleStripeCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (code && state) {
        try {
          setConnecting(true);
          await paymentIntegrationsAPI.handleStripeOAuthCallback(code, state);
          const data = await loadStatus();
          onStatusChange?.('stripe', data);
          // Clear query params
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('code');
          newParams.delete('state');
          setSearchParams(newParams, { replace: true });
        } catch (err) {
          setError('Failed to connect Stripe account. Please try again.');
        } finally {
          setConnecting(false);
        }
      }
    };

    handleStripeCallback();
  }, []); // Run once on mount

  // Initial load
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      loadStatus().then((data) => {
        onStatusChange?.('stripe', data);
      });
    }
  }, [initialized, loadStatus, onStatusChange]);

  // Start Stripe OAuth flow
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);

      // Get OAuth URL
      const { oauth_url } = await paymentIntegrationsAPI.initiateStripeOAuth();

      // Redirect to Stripe OAuth
      window.location.href = oauth_url;
    } catch (err) {
      console.error('[StripeConnect] Error connecting:', err);
      setError(err.message || 'Failed to start Stripe connection');
      setConnecting(false);
    }
  };

  // Open Stripe Dashboard
  const handleOpenDashboard = async () => {
    try {
      const { url } = await paymentIntegrationsAPI.getStripeDashboardLink();
      window.open(url, '_blank');
    } catch (err) {
      setError('Failed to open Stripe dashboard');
    }
  };

  // Disconnect Stripe
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Stripe? You will no longer be able to accept card payments.')) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);
      await paymentIntegrationsAPI.disconnectStripe();
      setStatus({ is_connected: false });
      onStatusChange?.('stripe', { is_connected: false });
    } catch (err) {
      setError('Failed to disconnect Stripe');
    } finally {
      setDisconnecting(false);
    }
  };

  // Determine connection state based on status fields
  const accountStatus = status?.status; // pending, onboarding, enabled, restricted, disabled
  const chargesEnabled = status?.charges_enabled === true;
  const stripeAccountId = status?.stripe_account_id;
  const isFullyConnected = accountStatus === 'enabled' && chargesEnabled;
  const isPending = accountStatus === 'pending' || stripeAccountId === 'pending';
  const isOnboarding = accountStatus === 'onboarding';
  const isRestricted = accountStatus === 'restricted';
  const isDisabled = accountStatus === 'disabled';

  // Loading state
  if (loading) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#635bff]/10 rounded-lg">
            <StripeLogo className="h-6 w-6 text-[#635bff]" />
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

  // Not connected / Disabled state - show connect button
  if (!status || !accountStatus || isDisabled) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#635bff]/10 rounded-lg">
            <StripeLogo className="h-6 w-6 text-[#635bff]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Stripe</h4>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                {isDisabled ? 'Disconnected' : 'Not Connected'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Accept credit card payments directly to your bank account with Stripe.
            </p>
            <ErrorDisplay />
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#635bff] hover:bg-[#5851db] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <StripeLogo className="h-4 w-4" />
                  {isDisabled ? 'Reconnect with Stripe' : 'Connect with Stripe'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending state - OAuth started but not completed
  if (isPending) {
    return (
      <div className="p-6 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#635bff]/10 rounded-lg">
            <StripeLogo className="h-6 w-6 text-[#635bff]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Stripe</h4>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Pending
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your Stripe connection was started but not completed. Please continue to authorize your account.
            </p>
            <ErrorDisplay />
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#635bff] hover:bg-[#5851db] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Continue Connection'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding state - OAuth done, Stripe onboarding in progress
  if (isOnboarding) {
    return (
      <div className="p-6 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#635bff]/10 rounded-lg">
            <StripeLogo className="h-6 w-6 text-[#635bff]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Stripe</h4>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                <ArrowPathIcon className="h-3 w-3" />
                Setup In Progress
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your Stripe account is connected but requires additional setup to accept payments.
            </p>
            <ErrorDisplay />
            <button
              onClick={handleOpenDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Complete Setup on Stripe
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Restricted state - needs attention
  if (isRestricted || (accountStatus === 'enabled' && !chargesEnabled)) {
    return (
      <div className="p-6 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#635bff]/10 rounded-lg">
            <StripeLogo className="h-6 w-6 text-[#635bff]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Stripe</h4>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Action Required
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Your Stripe account needs additional information before you can accept payments.
            </p>
            {status.currently_due?.length > 0 && (
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                Required: {status.currently_due.join(', ')}
              </p>
            )}
            <ErrorDisplay />
            <button
              onClick={handleOpenDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Complete Setup on Stripe
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fully connected state - enabled + charges_enabled
  if (isFullyConnected) {
    return (
      <div className="p-6 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#635bff]/10 rounded-lg">
            <StripeLogo className="h-6 w-6 text-[#635bff]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Stripe</h4>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                <CheckCircleIcon className="h-3 w-3" />
                Connected
              </span>
            </div>
            {status.business_name && (
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {status.business_name}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Currency: {status.default_currency?.toUpperCase() || 'USD'}
            </p>
            <ErrorDisplay />
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenDashboard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Open Dashboard
              </button>
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
      </div>
    );
  }

  // Fallback - unknown state, show connect button
  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-[#635bff]/10 rounded-lg">
          <StripeLogo className="h-6 w-6 text-[#635bff]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Stripe</h4>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
              Unknown Status
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Accept credit card payments directly to your bank account with Stripe.
          </p>
          <ErrorDisplay />
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#635bff] hover:bg-[#5851db] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <StripeLogo className="h-4 w-4" />
                Connect with Stripe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * PayPal Connect Card Component
 */
const PayPalConnectCard = ({ onStatusChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Load PayPal status
  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentIntegrationsAPI.getPayPalStatus();
      setStatus(data);
      return data;
    } catch (err) {
      console.error('[PayPalConnect] Error loading status:', err);
      if (err.status !== 404) {
        setError(err.message);
      }
      const fallbackStatus = { is_connected: false };
      setStatus(fallbackStatus);
      return fallbackStatus;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle return from PayPal onboarding
  useEffect(() => {
    const handlePayPalReturn = async () => {
      const paypalConnected = searchParams.get('paypal_connected');

      if (paypalConnected === 'true') {
        try {
          setRefreshing(true);
          await paymentIntegrationsAPI.refreshPayPalStatus();
          const data = await loadStatus();
          onStatusChange?.('paypal', data);
          // Clear query params
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('paypal_connected');
          setSearchParams(newParams, { replace: true });
        } catch (err) {
          setError('Failed to verify PayPal connection. Please try again.');
        } finally {
          setRefreshing(false);
        }
      }
    };

    handlePayPalReturn();
  }, []); // Run once on mount

  // Initial load
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      loadStatus().then((data) => {
        onStatusChange?.('paypal', data);
      });
    }
  }, [initialized, loadStatus, onStatusChange]);

  // Start PayPal Connect flow
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);

      const returnUrl = `${window.location.origin}${window.location.pathname}?paypal_connected=true`;

      const { action_url } = await paymentIntegrationsAPI.initiatePayPalConnect({
        return_url: returnUrl,
      });

      // Redirect to PayPal
      window.location.href = action_url;
    } catch (err) {
      console.error('[PayPalConnect] Error connecting:', err);
      setError(err.message || 'Failed to start PayPal connection');
      setConnecting(false);
    }
  };

  // Refresh PayPal status
  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await paymentIntegrationsAPI.refreshPayPalStatus();
      await loadStatus();
    } catch (err) {
      setError('Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };

  // Disconnect PayPal
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect PayPal? You will no longer be able to accept PayPal payments.')) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);
      await paymentIntegrationsAPI.disconnectPayPal({ confirm: true });
      setStatus({ is_connected: false });
      onStatusChange?.('paypal', { is_connected: false });
    } catch (err) {
      setError('Failed to disconnect PayPal');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#003087]/10 rounded-lg">
            <PayPalLogo className="h-6 w-6 text-[#003087]" />
          </div>
          <div className="flex-1">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!status?.is_connected) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#003087]/10 rounded-lg">
            <PayPalLogo className="h-6 w-6 text-[#003087]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">PayPal</h4>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                Not Connected
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Accept PayPal payments directly to your PayPal account.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070ba] hover:bg-[#005ea6] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <PayPalLogo className="h-4 w-4" />
                  Connect with PayPal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending/in-progress state
  if (status.onboarding_status === 'in_progress' || !status.is_ready_for_payments) {
    return (
      <div className="p-6 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#003087]/10 rounded-lg">
            <PayPalLogo className="h-6 w-6 text-[#003087]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">PayPal</h4>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Setup Incomplete
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Your PayPal account setup is not complete.
            </p>
            {!status.payments_receivable && (
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Payment receiving is not yet enabled.
              </p>
            )}
            {!status.primary_email_confirmed && (
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Please confirm your PayPal email address.
              </p>
            )}
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {refreshing ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4" />
                  Refresh Status
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
        <div className="p-3 bg-[#003087]/10 rounded-lg">
          <PayPalLogo className="h-6 w-6 text-[#003087]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">PayPal</h4>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
              <CheckCircleIcon className="h-3 w-3" />
              Connected
            </span>
          </div>
          {status.paypal_email && (
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {status.paypal_email}
            </p>
          )}
          {status.merchant_id && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Merchant ID: {status.merchant_id}
            </p>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {refreshing ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowPathIcon className="h-4 w-4" />
              )}
              Refresh
            </button>
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
    </div>
  );
};

/**
 * Coming Soon Integration Card Component
 */
const ComingSoonCard = ({ name, description, icon: Icon }) => (
  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg opacity-75">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
          <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
            Coming Soon
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  </div>
);

/**
 * Integrations Tab - Third-party service integrations
 */
const IntegrationsTab = () => {
  const [gatewayStatus, setGatewayStatus] = useState({
    stripe: null,
    paypal: null,
  });

  const handleStatusChange = (gateway, status) => {
    setGatewayStatus((prev) => ({ ...prev, [gateway]: status }));
  };

  const hasAnyPaymentGateway =
    gatewayStatus.stripe?.is_connected || gatewayStatus.paypal?.is_connected;

  return (
    <div className="space-y-6">
      {/* Payment Gateways Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Payment Gateways
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Connect payment gateways to accept payments from your customers directly to your account.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StripeConnectCard onStatusChange={handleStatusChange} />
          <PayPalConnectCard onStatusChange={handleStatusChange} />
        </div>

        {hasAnyPaymentGateway && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              You can accept payments! Configure payment options on individual invoices and quotes.
            </p>
          </div>
        )}
      </div>

      {/* Other Integrations Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Other Integrations
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Connect your favorite tools and services to enhance Zenible CRM
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ComingSoonCard
            name="Google Calendar"
            description="Sync meetings and appointments with Google Calendar"
            icon={CalendarIcon}
          />
          <ComingSoonCard
            name="Email Service"
            description="Configure email sending (SMTP, SendGrid, etc.)"
            icon={EnvelopeIcon}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          More integrations are coming soon! If you have a specific integration request, please
          contact support.
        </p>
      </div>
    </div>
  );
};

export default IntegrationsTab;
