import React, { useState } from 'react';
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '../../../../utils/currency';
import invoicesAPI from '../../../../services/api/finance/invoices';
import type { PaymentStatusResponse } from '../../../../types/finance';
import { StripeLogo } from './PaymentLogos';
import { CARD_ELEMENT_OPTIONS } from './cardElementOptions';

const invoicesAPITyped = invoicesAPI;

export interface StripeCardFormProps {
  clientSecret: string;
  paymentId: string;
  shareCode: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError?: (err: any) => void;
  onBack: () => void;
}

/**
 * Stripe Card Form Component
 */
const StripeCardForm: React.FC<StripeCardFormProps> = ({ clientSecret, paymentId, shareCode, amount, currency, onSuccess, onError, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm payment with the existing client_secret
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              address: {
                postal_code: postalCode || undefined,
              },
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Verify payment status with backend
        const statusResponse = await invoicesAPITyped.getStripePaymentStatus(shareCode, paymentId) as PaymentStatusResponse & { status?: string };
        if (statusResponse.status === 'succeeded' || statusResponse.status === 'completed') {
          onSuccess();
        } else {
          throw new Error('Payment verification failed. Please contact support.');
        }
      }
    } catch (err: any) {
      console.error('[StripeCardForm] Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#8e51ff] hover:text-[#7a44db] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payment methods
      </button>

      <div>
        <label className="block text-sm font-medium text-[#09090b] mb-1">
          Card Details
        </label>
        <div className="p-3 border border-[#e5e5e5] rounded-lg bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#09090b] mb-1">
          Postal Code
        </label>
        <input
          type="text"
          value={postalCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPostalCode(e.target.value.toUpperCase())}
          className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#09090b] focus:outline-none focus:ring-2 focus:ring-[#8e51ff]"
          placeholder="Postal / ZIP code"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full px-4 py-3 bg-[#635bff] hover:bg-[#5851db] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay {formatCurrency(amount, currency)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-[#71717a]">
        <span>Secured by</span>
        <StripeLogo className="h-4 w-4 text-[#635bff]" />
        <span className="font-semibold text-[#635bff]">Stripe</span>
      </div>
    </form>
  );
};

export default StripeCardForm;
