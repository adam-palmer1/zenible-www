import React, { createContext, useCallback, useMemo, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import paymentIntegrationsAPI from '../services/api/finance/paymentIntegrations';
import { queryKeys } from '../lib/query-keys';

export interface PaymentIntegration {
  id: string;
  type?: string;
  gateway_type?: string;
  account_id?: string;
  merchant_id?: string;
  publishable_key?: string;
  client_id?: string;
  is_active?: boolean;
  is_connected?: boolean;
  last_sync_at?: string;
  [key: string]: unknown;
}

interface PaymentIntegrationsContextValue {
  integrations: PaymentIntegration[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  getIntegration: (type: string) => PaymentIntegration | undefined;
  stripeIntegration: PaymentIntegration | undefined;
  paypalIntegration: PaymentIntegration | undefined;
  isStripeConnected: boolean;
  isPayPalConnected: boolean;
  hasAnyGateway: boolean;
  loadIntegrations: () => Promise<void>;
  disconnectIntegration: (integrationId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const PaymentIntegrationsContext = createContext<PaymentIntegrationsContextValue | null>(null);

export const PaymentIntegrationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const integrationsQuery = useQuery({
    queryKey: queryKeys.paymentIntegrations.all,
    queryFn: async () => {
      const data = await paymentIntegrationsAPI.list();
      return (data as PaymentIntegration[]) || [];
    },
    enabled: !!user,
  });

  const integrations = integrationsQuery.data || [];

  const getIntegration = useCallback(
    (type: string) => integrations.find((int) => int.type === type && int.is_active),
    [integrations]
  );

  const isConnected = useCallback(
    (type: string) => {
      const integration = getIntegration(type);
      return !!integration && !!integration.is_active;
    },
    [getIntegration]
  );

  const stripeIntegration = useMemo(() => getIntegration('stripe'), [getIntegration]);
  const paypalIntegration = useMemo(() => getIntegration('paypal'), [getIntegration]);
  const isStripeConnected = useMemo(() => isConnected('stripe'), [isConnected]);
  const isPayPalConnected = useMemo(() => isConnected('paypal'), [isConnected]);
  const hasAnyGateway = useMemo(() => isStripeConnected || isPayPalConnected, [isStripeConnected, isPayPalConnected]);

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (integrationId: string) => paymentIntegrationsAPI.disconnect(integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentIntegrations.all });
    },
  });

  const disconnectIntegration = useCallback(async (integrationId: string) => {
    await disconnectMutation.mutateAsync(integrationId);
    return true;
  }, [disconnectMutation]);

  const loadIntegrations = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.paymentIntegrations.all });
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.paymentIntegrations.all });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      integrations,
      loading: integrationsQuery.isLoading,
      error: integrationsQuery.error?.message || null,
      initialized: !integrationsQuery.isLoading && integrationsQuery.isFetched,
      getIntegration,
      stripeIntegration,
      paypalIntegration,
      isStripeConnected,
      isPayPalConnected,
      hasAnyGateway,
      loadIntegrations,
      disconnectIntegration,
      refresh,
    }),
    [
      integrations,
      integrationsQuery.isLoading,
      integrationsQuery.error,
      integrationsQuery.isFetched,
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

export const usePaymentIntegrations = (): PaymentIntegrationsContextValue => {
  const context = useContext(PaymentIntegrationsContext);
  if (!context) {
    throw new Error('usePaymentIntegrations must be used within a PaymentIntegrationsProvider');
  }
  return context;
};
