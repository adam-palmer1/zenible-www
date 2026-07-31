import React, { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import publicBookingAPI from '../../services/api/public/booking';
import logger from '../../utils/logger';

export interface BookingPaymentProof {
  method: 'stripe' | 'paypal';
  payment_intent_id?: string;
  paypal_order_id?: string;
}

interface BookingPaymentStepProps {
  username: string;
  shortcode: string;
  price: number;
  currency: string;
  availableMethods: string[];
  startDatetime: string;
  timezone: string;
  guestEmail?: string;
  /** Called with proof once the guest has paid; should finalize the booking. */
  onPaid: (proof: BookingPaymentProof) => void | Promise<void>;
  onBack: () => void;
  /** True while the parent is finalizing the booking after payment. */
  submitting?: boolean;
  /** Error surfaced by the parent's finalize step. */
  finalizeError?: string | null;
}

const formatAmount = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
};

// ---------------------------------------------------------------------------
// Stripe
// ---------------------------------------------------------------------------

const StripeCardForm: React.FC<{
  clientSecret: string;
  onPaid: (proof: BookingPaymentProof) => void | Promise<void>;
  disabled?: boolean;
}> = ({ clientSecret, onPaid, disabled }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });
      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        await onPaid({ method: 'stripe', payment_intent_id: paymentIntent.id });
      } else {
        throw new Error('Payment was not completed.');
      }
    } catch (err: any) {
      logger.error('[BookingPaymentStep] Stripe error', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white">
        <CardElement options={{ hidePostalCode: false }} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing || disabled}
        className="w-full px-4 py-2 bg-zenible-primary text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {processing || disabled ? 'Processing…' : 'Pay'}
      </button>
    </form>
  );
};

const StripeBookingForm: React.FC<{
  username: string;
  shortcode: string;
  startDatetime: string;
  timezone: string;
  guestEmail?: string;
  onPaid: (proof: BookingPaymentProof) => void | Promise<void>;
  disabled?: boolean;
}> = ({ username, shortcode, startDatetime, timezone, guestEmail, onPaid, disabled }) => {
  const [intent, setIntent] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIntent(null);
    setLoadError(null);
    publicBookingAPI
      .createStripeIntent(username, shortcode, { start_datetime: startDatetime, timezone, email: guestEmail })
      .then((res: any) => {
        if (active) setIntent(res);
      })
      .catch((e: any) => {
        if (active) setLoadError(e.message || 'Unable to start payment.');
      });
    return () => {
      active = false;
    };
  }, [username, shortcode, startDatetime, timezone, guestEmail]);

  const stripePromise = useMemo(
    () =>
      intent?.publishable_key
        ? loadStripe(
            intent.publishable_key,
            intent.stripe_account_id ? { stripeAccount: intent.stripe_account_id } : undefined,
          )
        : null,
    [intent?.publishable_key, intent?.stripe_account_id],
  );

  if (loadError) return <p className="text-sm text-red-500">{loadError}</p>;
  if (!intent || !stripePromise) {
    return <p className="text-sm text-gray-500">Preparing secure payment…</p>;
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm clientSecret={intent.client_secret} onPaid={onPaid} disabled={disabled} />
    </Elements>
  );
};

// ---------------------------------------------------------------------------
// PayPal
// ---------------------------------------------------------------------------

const PayPalBookingForm: React.FC<{
  username: string;
  shortcode: string;
  startDatetime: string;
  timezone: string;
  guestEmail?: string;
  currency: string;
  onPaid: (proof: BookingPaymentProof) => void | Promise<void>;
  disabled?: boolean;
}> = ({ username, shortcode, startDatetime, timezone, guestEmail, currency, onPaid, disabled }) => {
  const [order, setOrder] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setOrder(null);
    setLoadError(null);
    publicBookingAPI
      .createPayPalOrder(username, shortcode, { start_datetime: startDatetime, timezone, email: guestEmail })
      .then((res: any) => {
        if (active) setOrder(res);
      })
      .catch((e: any) => {
        if (active) setLoadError(e.message || 'Unable to start PayPal payment.');
      });
    return () => {
      active = false;
    };
  }, [username, shortcode, startDatetime, timezone, guestEmail]);

  if (loadError) return <p className="text-sm text-red-500">{loadError}</p>;
  if (!order || !order.paypal_client_id) {
    return <p className="text-sm text-gray-500">Preparing PayPal…</p>;
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: order.paypal_client_id,
        merchantId: order.merchant_id,
        currency: currency.toUpperCase(),
        intent: 'capture',
        components: 'buttons',
        'data-partner-attribution-id': order.bn_code,
      }}
    >
      <PayPalButtons
        style={{ layout: 'vertical' }}
        disabled={disabled}
        // Order is pre-created server-side; just hand its id to the SDK.
        createOrder={() => Promise.resolve(order.order_id)}
        onApprove={async (data) => {
          await onPaid({ method: 'paypal', paypal_order_id: data.orderID || order.order_id });
        }}
        onError={(err) => {
          logger.error('[BookingPaymentStep] PayPal error', err);
        }}
      />
    </PayPalScriptProvider>
  );
};

// ---------------------------------------------------------------------------
// Step container
// ---------------------------------------------------------------------------

const BookingPaymentStep: React.FC<BookingPaymentStepProps> = ({
  username,
  shortcode,
  price,
  currency,
  availableMethods,
  startDatetime,
  timezone,
  guestEmail,
  onPaid,
  onBack,
  submitting,
  finalizeError,
}) => {
  const methods = availableMethods.filter((m) => m === 'stripe' || m === 'paypal');
  const [selected, setSelected] = useState<string>(methods[0] || '');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Amount due</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatAmount(price, currency)}
          </span>
        </div>
      </div>

      {methods.length > 1 && (
        <div className="flex gap-2">
          {methods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelected(m)}
              className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selected === m
                  ? 'border-zenible-primary text-zenible-primary bg-zenible-primary/10'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {m === 'stripe' ? 'Card (Stripe)' : 'PayPal'}
            </button>
          ))}
        </div>
      )}

      {finalizeError && <p className="text-sm text-red-500">{finalizeError}</p>}

      {selected === 'stripe' && (
        <StripeBookingForm
          username={username}
          shortcode={shortcode}
          startDatetime={startDatetime}
          timezone={timezone}
          guestEmail={guestEmail}
          onPaid={onPaid}
          disabled={submitting}
        />
      )}

      {selected === 'paypal' && (
        <PayPalBookingForm
          username={username}
          shortcode={shortcode}
          startDatetime={startDatetime}
          timezone={timezone}
          guestEmail={guestEmail}
          currency={currency}
          onPaid={onPaid}
          disabled={submitting}
        />
      )}

      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
      >
        ← Back
      </button>
    </div>
  );
};

export default BookingPaymentStep;
