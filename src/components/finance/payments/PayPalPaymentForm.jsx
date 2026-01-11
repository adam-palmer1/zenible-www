import React, { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { usePaymentIntegrations } from '../../../contexts/PaymentIntegrationsContext';

/**
 * PayPal Payment Form Component
 */
const PayPalPaymentForm = ({
  amount,
  currency,
  invoiceId,
  onSuccess,
  onError,
  isPublic = false,
  publicToken = null,
}) => {
  const { paypalIntegration } = usePaymentIntegrations();
  const [error, setError] = useState(null);

  // PayPal SDK options
  const initialOptions = {
    'client-id': paypalIntegration?.client_id || '',
    currency: currency,
    intent: 'capture',
  };

  /**
   * Create PayPal order
   */
  const createOrder = async (data, actions) => {
    try {
      setError(null);

      // Create order on backend
      const response = await fetch('/api/v1/invoices/payment-order/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isPublic && publicToken ? {} : { Authorization: `Bearer ${localStorage.getItem('access_token')}` }),
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: amount,
          currency: currency,
          ...(isPublic && publicToken ? { token: publicToken } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const { order_id } = await response.json();
      return order_id;
    } catch (err) {
      console.error('[PayPalPaymentForm] Create order error:', err);
      setError(err.message || 'Failed to create PayPal order');
      throw err;
    }
  };

  /**
   * Capture PayPal order (after approval)
   */
  const onApprove = async (data, actions) => {
    try {
      setError(null);

      // Confirm payment on backend
      const response = await fetch('/api/v1/invoices/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isPublic && publicToken ? {} : { Authorization: `Bearer ${localStorage.getItem('access_token')}` }),
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          payment_method: 'paypal',
          paypal_order_id: data.orderID,
          ...(isPublic && publicToken ? { token: publicToken } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      const result = await response.json();
      onSuccess(result);

      return result;
    } catch (err) {
      console.error('[PayPalPaymentForm] Payment confirmation error:', err);
      setError(err.message || 'Payment confirmation failed');
      onError(err);
      throw err;
    }
  };

  /**
   * Handle errors
   */
  const onErrorHandler = (err) => {
    console.error('[PayPalPaymentForm] PayPal error:', err);
    setError('PayPal payment failed. Please try again.');
    onError(err);
  };

  if (!paypalIntegration?.client_id) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          PayPal is not configured. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* PayPal Buttons */}
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={() => {
            setError('Payment was cancelled');
          }}
        />
      </PayPalScriptProvider>

      {/* Amount Display */}
      <div className="text-center">
        <p className="text-sm text-design-text-muted">
          Amount: <span className="font-semibold text-design-text-primary">{currency} {amount.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
};

export default PayPalPaymentForm;
