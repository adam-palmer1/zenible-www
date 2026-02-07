import React, { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { usePaymentIntegrations } from '../../../contexts/PaymentIntegrationsContext';
import invoicesAPI from '../../../services/api/finance/invoices';

interface PayPalPaymentFormProps {
  amount: number;
  currency: string;
  invoiceId: string;
  onSuccess: (result: any) => void;
  onError: (err: any) => void;
  isPublic?: boolean;
  publicToken?: string | null;
}

/**
 * PayPal Payment Form Component
 */
const PayPalPaymentForm: React.FC<PayPalPaymentFormProps> = ({
  amount,
  currency,
  invoiceId,
  onSuccess,
  onError,
  isPublic = false,
  publicToken = null,
}) => {
  const { paypalIntegration } = usePaymentIntegrations() as any;
  const [error, setError] = useState<string | null>(null);

  // PayPal SDK options
  const initialOptions: any = {
    'client-id': paypalIntegration?.client_id || '',
    currency: currency,
    intent: 'capture',
  };

  /**
   * Create PayPal order
   */
  const createOrder = async (data: any, actions: any) => {
    try {
      setError(null);

      // Create order on backend
      const { order_id } = await (invoicesAPI as any).createPayPalOrder({
        invoiceId,
        amount,
        currency,
        publicToken: isPublic ? publicToken : null,
      });

      return order_id;
    } catch (err: any) {
      console.error('[PayPalPaymentForm] Create order error:', err);
      setError(err.message || 'Failed to create PayPal order');
      throw err;
    }
  };

  /**
   * Capture PayPal order (after approval)
   */
  const onApprove = async (data: any, actions: any) => {
    try {
      setError(null);

      // Confirm payment on backend
      const result = await (invoicesAPI as any).confirmPayment({
        invoiceId,
        paymentMethod: 'paypal',
        paypalOrderId: data.orderID,
        publicToken: isPublic ? publicToken : null,
      });

      onSuccess(result);
      return result;
    } catch (err: any) {
      console.error('[PayPalPaymentForm] Payment confirmation error:', err);
      setError(err.message || 'Payment confirmation failed');
      onError(err);
      throw err;
    }
  };

  /**
   * Handle errors
   */
  const onErrorHandler = (err: any) => {
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
