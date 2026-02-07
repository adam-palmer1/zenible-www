import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import invoicesAPI from '../../../../services/api/finance/invoices';
import StripeCardSetupForm from './StripeCardSetupForm';

const invoicesAPITyped = invoicesAPI;

export interface StripeCardSetupSectionProps {
  shareCode: string;
  onSuccess: () => void;
  onError?: (err: any) => void;
  onBack: () => void;
}

/**
 * Stripe Card Setup Wrapper with Elements - For recurring payments
 */
const StripeCardSetupSection: React.FC<StripeCardSetupSectionProps> = ({ shareCode, onSuccess, onError, onBack }) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const initStripeSetup = async () => {
      try {
        setInitialized(true);
        // Create setup intent for saving card
        const setupData = await invoicesAPITyped.createStripeSetupIntent(shareCode);
        setClientSecret(setupData.client_secret);
        setSetupIntentId(setupData.setup_intent_id);

        // Initialize Stripe with connected account if provided
        const stripeOptions = setupData.stripe_account_id
          ? { stripeAccount: setupData.stripe_account_id }
          : undefined;
        setStripePromise(loadStripe(setupData.publishable_key, stripeOptions));
      } catch (err: any) {
        console.error('[StripeCardSetup] Init error:', err);
        setError(err.message || 'Failed to initialize card setup');
      } finally {
        setLoading(false);
      }
    };

    initStripeSetup();
  }, [shareCode, initialized]);

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
          Back to payment options
        </button>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Card setup is not available for this invoice.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardSetupForm
        clientSecret={clientSecret}
        setupIntentId={setupIntentId as string}
        shareCode={shareCode}
        onSuccess={onSuccess}
        onError={onError}
        onBack={onBack}
      />
    </Elements>
  );
};

export default StripeCardSetupSection;
