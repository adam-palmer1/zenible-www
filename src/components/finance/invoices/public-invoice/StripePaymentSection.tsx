import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import invoicesAPI from '../../../../services/api/finance/invoices';
import StripeCardForm from './StripeCardForm';

const invoicesAPITyped = invoicesAPI;

export interface StripePaymentSectionProps {
  shareCode: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError?: (err: any) => void;
  onBack: () => void;
}

/**
 * Stripe Payment Wrapper with Elements
 */
const StripePaymentSection: React.FC<StripePaymentSectionProps> = ({ shareCode, amount, currency, onSuccess, onError, onBack }) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const initStripe = async () => {
      try {
        setInitialized(true);
        // Create payment intent and get publishable key
        const paymentData = await invoicesAPITyped.createStripePayment(shareCode, {
          amount,
        });
        setClientSecret(paymentData.client_secret);
        setPaymentId(paymentData.payment_id);

        // Initialize Stripe with connected account for Direct Charges
        // This ensures the payment is processed on the connected account
        // and the business name appears on customer bank statements
        const stripeOptions = paymentData.stripe_account_id
          ? { stripeAccount: paymentData.stripe_account_id }
          : undefined;
        setStripePromise(loadStripe(paymentData.publishable_key, stripeOptions));
      } catch (err: any) {
        console.error('[StripePayment] Init error:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initStripe();
  }, [shareCode, amount, initialized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#8e51ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={onBack}
          className="mt-2 text-sm text-[#8e51ff] hover:text-[#7a44db]"
        >
          Back to payment methods
        </button>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Card payments are not available for this invoice.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm
        clientSecret={clientSecret}
        paymentId={paymentId as string}
        shareCode={shareCode}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        onBack={onBack}
      />
    </Elements>
  );
};

export default StripePaymentSection;
