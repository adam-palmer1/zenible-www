import React, { useState } from 'react';
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import invoicesAPI from '../../../../services/api/finance/invoices';
import { StripeLogo } from './PaymentLogos';
import { CARD_ELEMENT_OPTIONS } from './cardElementOptions';

const invoicesAPITyped = invoicesAPI;

export interface StripeCardSetupFormProps {
  clientSecret: string;
  setupIntentId: string;
  shareCode: string;
  onSuccess: () => void;
  onError?: (err: any) => void;
  onBack: () => void;
}

/**
 * Stripe Card Setup Form Component - For saving card for recurring payments
 */
const StripeCardSetupForm: React.FC<StripeCardSetupFormProps> = ({ clientSecret, setupIntentId, shareCode, onSuccess, onError, onBack }) => {
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
      // Confirm the SetupIntent to save the card
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
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

      if (setupIntent?.status === 'succeeded') {
        // Optionally verify with backend
        try {
          await invoicesAPITyped.confirmCardSetup(shareCode, setupIntentId);
        } catch (confirmErr) {
          console.warn('[StripeCardSetupForm] Backend confirmation failed:', confirmErr);
          // Continue anyway - card was saved successfully with Stripe
        }
        onSuccess();
      } else {
        throw new Error('Card setup did not complete. Please try again.');
      }
    } catch (err: any) {
      console.error('[StripeCardSetupForm] Setup error:', err);
      setError(err.message || 'Failed to save card. Please try again.');
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
        Back to payment options
      </button>

      <div className="p-3 bg-[#f5f0ff] border border-[#d4bfff] rounded-lg">
        <p className="text-sm text-[#5b21b6]">
          Your card will be saved securely for automatic payments on future invoices.
        </p>
      </div>

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
            Saving card...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Save Card for Automatic Payments
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

export default StripeCardSetupForm;
