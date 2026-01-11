import React, { createContext, useState, useCallback, useMemo, useContext } from 'react';
import { useAuth } from './AuthContext';
import paymentIntegrationsAPI from '../services/api/finance/paymentIntegrations';

export const PaymentIntegrationsContext = createContext(null);

/**
 * Payment Integrations Provider
 * Manages payment gateway integrations (Stripe, PayPal)
 */
export const PaymentIntegrationsProvider = ({ children }) => {
  const { user } = useAuth();

  // State
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  /**
   * Load payment integrations
   */
  const loadIntegrations = useCallback(async () => {
    if (!user) {
      setIntegrations([]);
      setInitialized(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await paymentIntegrationsAPI.list();
      setIntegrations(data || []);
      setInitialized(true);
    } catch (err) {
      console.error('[PaymentIntegrationsContext] Error loading integrations:', err);
      setError(err.message);
      setIntegrations([]);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Get integration by type (stripe or paypal)
   */
  const getIntegration = useCallback(
    (type) => {
      return integrations.find((int) => int.type === type && int.is_active);
    },
    [integrations]
  );

  /**
   * Check if a gateway is connected
   */
  const isConnected = useCallback(
    (type) => {
      const integration = getIntegration(type);
      return integration && integration.is_active;
    },
    [getIntegration]
  );

  /**
   * Get Stripe integration
   */
  const stripeIntegration = useMemo(() => {
    return getIntegration('stripe');
  }, [getIntegration]);

  /**
   * Get PayPal integration
   */
  const paypalIntegration = useMemo(() => {
    return getIntegration('paypal');
  }, [getIntegration]);

  /**
   * Check if Stripe is connected
   */
  const isStripeConnected = useMemo(() => {
    return isConnected('stripe');
  }, [isConnected]);

  /**
   * Check if PayPal is connected
   */
  const isPayPalConnected = useMemo(() => {
    return isConnected('paypal');
  }, [isConnected]);

  /**
   * Check if any payment gateway is connected
   */
  const hasAnyGateway = useMemo(() => {
    return isStripeConnected || isPayPalConnected;
  }, [isStripeConnected, isPayPalConnected]);

  /**
   * Disconnect an integration
   */
  const disconnectIntegration = useCallback(async (integrationId) => {
    try {
      setLoading(true);
      setError(null);

      await paymentIntegrationsAPI.disconnect(integrationId);

      // Remove from local state
      setIntegrations((prev) => prev.filter((int) => int.id !== integrationId));

      return true;
    } catch (err) {
      console.error('[PaymentIntegrationsContext] Error disconnecting integration:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh integrations
   */
  const refresh = useCallback(() => {
    return loadIntegrations();
  }, [loadIntegrations]);

  // Load integrations when user changes
  React.useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Context value
  const value = useMemo(
    () => ({
      // State
      integrations,
      loading,
      error,
      initialized,

      // Getters
      getIntegration,
      stripeIntegration,
      paypalIntegration,
      isStripeConnected,
      isPayPalConnected,
      hasAnyGateway,

      // Methods
      loadIntegrations,
      disconnectIntegration,
      refresh,
    }),
    [
      integrations,
      loading,
      error,
      initialized,
      getIntegration,
      stripeIntegration,
      paypalIntegration,
      isStripeConnected,
      isPayPalConnected,
      hasAnyGateway,
      loadIntegrations,
      disconnectIntegration,
      refresh,
    ]
  );

  return (
    <PaymentIntegrationsContext.Provider value={value}>
      {children}
    </PaymentIntegrationsContext.Provider>
  );
};

/**
 * Hook to use payment integrations context
 */
export const usePaymentIntegrations = () => {
  const context = useContext(PaymentIntegrationsContext);
  if (!context) {
    throw new Error('usePaymentIntegrations must be used within a PaymentIntegrationsProvider');
  }
  return context;
};
