import React, { useState } from 'react';
import { usePaymentIntegrations } from '../../../contexts/PaymentIntegrationsContext';
import paymentIntegrationsAPI from '../../../services/api/finance/paymentIntegrations';
import { format } from 'date-fns';

/**
 * Payment Integrations Management Component
 * Allows users to connect/disconnect Stripe and PayPal
 */
const PaymentIntegrations = () => {
  const {
    integrations,
    loading,
    isStripeConnected,
    isPayPalConnected,
    stripeIntegration,
    paypalIntegration,
    disconnectIntegration,
    refresh,
  } = usePaymentIntegrations();

  const [syncing, setSyncing] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  /**
   * Connect Stripe
   */
  const handleConnectStripe = async () => {
    try {
      const { oauth_url, state } = await paymentIntegrationsAPI.getStripeOAuthURL({
        redirect_uri: `${window.location.origin}/payment-callback`,
      });

      // Store state in session storage for verification
      sessionStorage.setItem('stripe_oauth_state', state);

      // Redirect to Stripe OAuth
      window.location.href = oauth_url;
    } catch (error) {
      console.error('Failed to initiate Stripe OAuth:', error);
      alert('Failed to connect Stripe. Please try again.');
    }
  };

  /**
   * Connect PayPal
   */
  const handleConnectPayPal = async () => {
    try {
      const { oauth_url, state } = await paymentIntegrationsAPI.getPayPalOAuthURL({
        redirect_uri: `${window.location.origin}/payment-callback`,
      });

      // Store state in session storage for verification
      sessionStorage.setItem('paypal_oauth_state', state);

      // Redirect to PayPal OAuth
      window.location.href = oauth_url;
    } catch (error) {
      console.error('Failed to initiate PayPal OAuth:', error);
      alert('Failed to connect PayPal. Please try again.');
    }
  };

  /**
   * Disconnect integration
   */
  const handleDisconnect = async (integrationId, provider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}? This will disable ${provider} payments for your invoices.`)) {
      return;
    }

    try {
      await disconnectIntegration(integrationId);
      alert(`${provider} disconnected successfully`);
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      alert(`Failed to disconnect ${provider}. Please try again.`);
    }
  };

  /**
   * Sync transactions
   */
  const handleSyncTransactions = async (integrationId, provider) => {
    try {
      setSyncing(integrationId);
      setSyncResult(null);

      const result = await paymentIntegrationsAPI.syncTransactions(integrationId, {
        days: 30, // Last 30 days
        limit: 100,
      });

      setSyncResult({
        provider,
        count: result.synced_count || 0,
        message: `Synced ${result.synced_count || 0} transactions from ${provider}`,
      });

      await refresh();
    } catch (error) {
      console.error(`Failed to sync ${provider} transactions:`, error);
      setSyncResult({
        provider,
        error: true,
        message: `Failed to sync ${provider} transactions`,
      });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-design-text-primary mb-2">Payment Gateway Integrations</h2>
        <p className="text-sm text-design-text-muted">
          Connect payment gateways to accept online payments on invoices
        </p>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className={`p-4 rounded-lg ${syncResult.error ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
          <p className={`text-sm ${syncResult.error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {syncResult.message}
          </p>
        </div>
      )}

      {/* Stripe Integration */}
      <div className="border border-design-border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-design-text-primary">Stripe</h3>
              <p className="text-sm text-design-text-muted">
                Accept credit cards and other payment methods
              </p>
              {isStripeConnected && stripeIntegration && (
                <div className="mt-2 space-y-1 text-xs text-design-text-muted">
                  <p>Last synced: {stripeIntegration.last_sync_at ? format(new Date(stripeIntegration.last_sync_at), 'MMM d, yyyy HH:mm') : 'Never'}</p>
                  {stripeIntegration.account_id && <p>Account: {stripeIntegration.account_id}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStripeConnected ? (
              <>
                <button
                  onClick={() => handleSyncTransactions(stripeIntegration.id, 'Stripe')}
                  disabled={syncing === stripeIntegration.id}
                  className="px-3 py-1.5 text-sm font-medium text-design-text-primary bg-white dark:bg-zenible-dark-card border border-design-border rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-hover transition-colors disabled:opacity-50"
                >
                  {syncing === stripeIntegration.id ? 'Syncing...' : 'Sync'}
                </button>
                <button
                  onClick={() => handleDisconnect(stripeIntegration.id, 'Stripe')}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-zenible-dark-card border border-design-border rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectStripe}
                className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Connect Stripe
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PayPal Integration */}
      <div className="border border-design-border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.116c-.317-.033-.66-.05-1.03-.05h-3.027a.996.996 0 0 0-.99.86L13.52 14.27l-.013.08v.117c.013.397.335.723.736.723h1.52c.512 0 .943-.373 1.023-.868l.885-5.642c.033-.17.092-.33.175-.476.315-.56.96-.897 1.717-.897.51 0 1.035.078 1.56.233a8.45 8.45 0 0 0 .099-1.544c0-1.295-.468-2.18-1.22-2.67z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-design-text-primary">PayPal</h3>
              <p className="text-sm text-design-text-muted">
                Accept PayPal and Venmo payments
              </p>
              {isPayPalConnected && paypalIntegration && (
                <div className="mt-2 space-y-1 text-xs text-design-text-muted">
                  <p>Last synced: {paypalIntegration.last_sync_at ? format(new Date(paypalIntegration.last_sync_at), 'MMM d, yyyy HH:mm') : 'Never'}</p>
                  {paypalIntegration.merchant_id && <p>Merchant ID: {paypalIntegration.merchant_id}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPayPalConnected ? (
              <>
                <button
                  onClick={() => handleSyncTransactions(paypalIntegration.id, 'PayPal')}
                  disabled={syncing === paypalIntegration.id}
                  className="px-3 py-1.5 text-sm font-medium text-design-text-primary bg-white dark:bg-zenible-dark-card border border-design-border rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-hover transition-colors disabled:opacity-50"
                >
                  {syncing === paypalIntegration.id ? 'Syncing...' : 'Sync'}
                </button>
                <button
                  onClick={() => handleDisconnect(paypalIntegration.id, 'PayPal')}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-zenible-dark-card border border-design-border rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectPayPal}
                className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Connect PayPal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> After connecting a payment gateway, you can enable it for individual invoices. Customers will be able to pay directly from the invoice view.
        </p>
      </div>
    </div>
  );
};

export default PaymentIntegrations;
