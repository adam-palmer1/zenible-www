import React, { useState, useEffect } from 'react';
import { loadStripe, type Stripe, type PaymentIntent } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePaymentIntegrations } from '../../../contexts/PaymentIntegrationsContext';
import invoicesAPI from '../../../services/api/finance/invoices';

/**
 * Stripe card element options
 */
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

interface StripePaymentFormInnerProps {
  amount: number;
  currency: string;
  invoiceId: string;
  onSuccess: (result: PaymentIntent) => void;
  onError: (err: Error) => void;
  isPublic?: boolean;
  publicToken?: string | null;
}

/**
 * Stripe Payment Form Component (Inner - with Stripe context)
 */
const StripePaymentFormInner: React.FC<StripePaymentFormInnerProps> = ({
  amount,
  currency,
  invoiceId,
  onSuccess,
  onError,
  isPublic = false,
  publicToken = null,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    country: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!billingDetails.name || !billingDetails.email) {
      setError('Please enter your name and email');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create payment intent on backend
      const { client_secret } = await invoicesAPI.createStripePaymentIntent({
        invoiceId,
        amount,
        currency,
        publicToken: isPublic ? publicToken : null,
      });

      // Step 2: Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            ...(billingDetails.country && { address: { country: billingDetails.country } }),
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Step 3: Confirm payment on backend
        await invoicesAPI.confirmPayment({
          invoiceId,
          paymentMethod: 'stripe',
          paymentIntentId: paymentIntent.id,
          publicToken: isPublic ? publicToken : null,
        });

        onSuccess(paymentIntent);
      }
    } catch (err: any) {
      console.error('[StripePaymentForm] Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      onError(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Billing Details */}
      <div className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-design-text-primary mb-1">
            Cardholder Name *
          </label>
          <input
            type="text"
            id="name"
            value={billingDetails.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-design-border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-design-text-primary mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={billingDetails.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-design-border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
            placeholder="john@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-design-text-primary mb-1">
            Country (optional)
          </label>
          <input
            type="text"
            id="country"
            value={billingDetails.country}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBillingDetails(prev => ({ ...prev, country: e.target.value }))}
            className="w-full px-3 py-2 border border-design-border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
            placeholder="US"
            maxLength={2}
          />
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-design-text-primary mb-1">
          Card Details *
        </label>
        <div className="p-3 border border-design-border-input rounded-lg">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full px-4 py-2 bg-zenible-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
      </button>

      {/* Stripe Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-design-text-muted">
        <span>Secured by</span>
        <span className="font-semibold">Stripe</span>
      </div>
    </form>
  );
};

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  invoiceId: string;
  onSuccess: (result: PaymentIntent) => void;
  onError: (err: Error) => void;
  isPublic?: boolean;
  publicToken?: string | null;
}

/**
 * Stripe Payment Form Component (Outer - with Elements provider)
 */
const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const { stripeIntegration } = usePaymentIntegrations();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (stripeIntegration?.publishable_key) {
      setStripePromise(loadStripe(stripeIntegration.publishable_key));
    }
  }, [stripeIntegration]);

  if (!stripePromise) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Stripe is not configured. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripePaymentFormInner {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
