import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, CreditCard, Loader2, ArrowLeft, RefreshCw, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '../../../utils/currency';
import invoicesAPI from '../../../services/api/finance/invoices';

// Stripe logo SVG
const StripeLogo = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
  </svg>
);

// PayPal logo SVG
const PayPalLogo = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.773.773 0 0 1 .763-.651h6.154c2.047 0 3.674.474 4.836 1.408 1.203.967 1.777 2.412 1.705 4.3-.085 2.2-.89 4.017-2.39 5.395-1.476 1.358-3.48 2.047-5.955 2.047H7.927a.77.77 0 0 0-.76.653l-.995 5.214a.641.641 0 0 1-.633.54.297.297 0 0 1-.463-.786z" />
    <path d="M19.66 7.132c-.085 2.2-.89 4.017-2.39 5.395-1.476 1.358-3.48 2.047-5.955 2.047H9.186a.77.77 0 0 0-.76.653l-1.29 6.758a.424.424 0 0 0 .419.493h3.18a.67.67 0 0 0 .662-.567l.028-.145.527-3.344.034-.185a.67.67 0 0 1 .662-.567h.418c2.7 0 4.816-.549 6.1-2.136.546-.673.92-1.48 1.132-2.393.224-.962.273-1.898.162-2.76a4.17 4.17 0 0 0-.8-2.249z" />
  </svg>
);

// Card element styling
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
      color: '#ef4444',
    },
  },
  hidePostalCode: true, // We use a custom postal code field to support international formats
};

/**
 * Stripe Card Setup Form Component - For saving card for recurring payments
 */
const StripeCardSetupForm = ({ clientSecret, setupIntentId, shareCode, onSuccess, onError, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [postalCode, setPostalCode] = useState('');

  const handleSubmit = async (e) => {
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
            card: elements.getElement(CardElement),
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

      if (setupIntent.status === 'succeeded') {
        // Optionally verify with backend
        try {
          await invoicesAPI.confirmCardSetup(shareCode, setupIntentId);
        } catch (confirmErr) {
          console.warn('[StripeCardSetupForm] Backend confirmation failed:', confirmErr);
          // Continue anyway - card was saved successfully with Stripe
        }
        onSuccess();
      } else {
        throw new Error('Card setup did not complete. Please try again.');
      }
    } catch (err) {
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
          Your card will be saved securely for automatic payments on this recurring invoice.
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
          onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
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

/**
 * Stripe Card Setup Wrapper with Elements - For recurring payments
 */
const StripeCardSetupSection = ({ shareCode, onSuccess, onError, onBack }) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [setupIntentId, setSetupIntentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const initStripeSetup = async () => {
      try {
        setInitialized(true);
        // Create setup intent for saving card
        const setupData = await invoicesAPI.createStripeSetupIntent(shareCode);
        setClientSecret(setupData.client_secret);
        setSetupIntentId(setupData.setup_intent_id);

        // Initialize Stripe with connected account if provided
        const stripeOptions = setupData.stripe_account_id
          ? { stripeAccount: setupData.stripe_account_id }
          : undefined;
        setStripePromise(loadStripe(setupData.publishable_key, stripeOptions));
      } catch (err) {
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
        setupIntentId={setupIntentId}
        shareCode={shareCode}
        onSuccess={onSuccess}
        onError={onError}
        onBack={onBack}
      />
    </Elements>
  );
};

/**
 * Stripe Card Form Component
 */
const StripeCardForm = ({ clientSecret, paymentId, shareCode, amount, currency, onSuccess, onError, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [postalCode, setPostalCode] = useState('');

  const handleSubmit = async (e) => {
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
            card: elements.getElement(CardElement),
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

      if (paymentIntent.status === 'succeeded') {
        // Verify payment status with backend
        const statusResponse = await invoicesAPI.getStripePaymentStatus(shareCode, paymentId);
        if (statusResponse.status === 'succeeded' || statusResponse.status === 'completed') {
          onSuccess();
        } else {
          throw new Error('Payment verification failed. Please contact support.');
        }
      }
    } catch (err) {
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
          onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
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

/**
 * Stripe Payment Wrapper with Elements
 */
const StripePaymentSection = ({ shareCode, amount, currency, onSuccess, onError, onBack }) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const initStripe = async () => {
      try {
        setInitialized(true);
        // Create payment intent and get publishable key
        const paymentData = await invoicesAPI.createStripePayment(shareCode, {
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
      } catch (err) {
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
        paymentId={paymentId}
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

/**
 * PayPal Payment Section
 */
const PayPalPaymentSection = ({ shareCode, amount, currency, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayPalClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?paypal=approved`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?paypal=cancelled`;

      const orderData = await invoicesAPI.createPayPalOrder(shareCode, {
        amount,
        return_url: returnUrl,
        cancel_url: cancelUrl,
      });

      // Store order_id for capture on return
      sessionStorage.setItem('paypal_order_id', orderData.order_id);
      sessionStorage.setItem('paypal_share_code', shareCode);

      // Redirect to PayPal
      window.location.href = orderData.approve_url;
    } catch (err) {
      console.error('[PayPalPayment] Error:', err);
      setError(err.message || 'Failed to initiate PayPal payment');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#8e51ff] hover:text-[#7a44db]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payment methods
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handlePayPalClick}
        disabled={loading}
        className="w-full px-4 py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirecting to PayPal...
          </>
        ) : (
          <>
            <PayPalLogo className="h-5 w-5" />
            Pay {formatCurrency(amount, currency)} with PayPal
          </>
        )}
      </button>

      <p className="text-xs text-center text-[#71717a]">
        You will be redirected to PayPal to complete your payment securely.
      </p>
    </div>
  );
};

/**
 * Saved Card Payment Inline - For payment method selection flow
 */
const SavedCardPaymentInline = ({ shareCode, amountDue, currency, savedCard, onSuccess, onBack }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePayWithSavedCard = async () => {
    setProcessing(true);
    setError(null);

    try {
      const result = await invoicesAPI.payWithSavedCard(shareCode, {});

      if (result.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment was not successful. Please try again.');
      }
    } catch (err) {
      console.error('[SavedCardPayment] Error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Format card brand for display
  const formatBrand = (brand) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#8e51ff] hover:text-[#7a44db]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payment options
      </button>

      <div className="p-3 bg-[#f0fdf4] border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm text-green-800">
              Pay using your saved card
            </p>
            {savedCard && (
              <p className="text-xs text-green-600 mt-0.5">
                {formatBrand(savedCard.brand)} •••• {savedCard.last4}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handlePayWithSavedCard}
        disabled={processing}
        className="w-full px-4 py-3 bg-[#8e51ff] hover:bg-[#7a44db] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay {formatCurrency(amountDue, currency)}
          </>
        )}
      </button>

      <p className="text-xs text-center text-[#71717a]">
        {savedCard
          ? `Payment will be charged to ${formatBrand(savedCard.brand)} •••• ${savedCard.last4}`
          : 'Payment will be charged to your saved card'}
      </p>
    </div>
  );
};

/**
 * Saved Card Payment Section - Pay with previously saved card (after card setup success)
 */
const SavedCardPaymentSection = ({ shareCode, amountDue, currency, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePayWithSavedCard = async () => {
    setProcessing(true);
    setError(null);

    try {
      const result = await invoicesAPI.payWithSavedCard(shareCode, {});

      if (result.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment was not successful. Please try again.');
      }
    } catch (err) {
      console.error('[SavedCardPayment] Error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="lg:w-[340px] lg:flex-shrink-0 bg-white border-2 border-green-500 rounded-[12px] p-6 h-fit">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-3 bg-green-100 rounded-full">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#09090b]">Card Saved Successfully</h3>
          <p className="text-sm text-[#71717a] mt-1">
            Your card has been saved for automatic payments on this recurring invoice.
          </p>
        </div>

        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {amountDue > 0 && (
          <button
            onClick={handlePayWithSavedCard}
            disabled={processing}
            className="w-full px-4 py-3 bg-[#8e51ff] hover:bg-[#7a44db] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Pay {formatCurrency(amountDue, currency)} Now
              </>
            )}
          </button>
        )}

        <p className="text-xs text-[#71717a]">
          Payment will be charged to your saved card
        </p>
      </div>
    </div>
  );
};

/**
 * Public Invoice View Component
 */
const PublicInvoiceView = () => {
  const { shareCode, token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardSetupSuccess, setCardSetupSuccess] = useState(false);
  const [capturingPayPal, setCapturingPayPal] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(false);
  const [deletingCard, setDeletingCard] = useState(null);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [deleteCardError, setDeleteCardError] = useState(null);

  // Use shareCode from URL or fall back to token for backwards compatibility
  const invoiceCode = shareCode || token;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  };

  // Load invoice
  const loadInvoice = useCallback(async () => {
    if (!invoiceCode) {
      setError('Invalid invoice link');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await invoicesAPI.getPublicByShareCode(invoiceCode);
      setInvoice(data);

      if (data.status === 'paid') {
        setPaymentSuccess(true);
      }
    } catch (err) {
      console.error('[PublicInvoiceView] Error loading invoice:', err);
      if (err.status === 404) {
        setError('Invoice not found or link has expired.');
      } else {
        setError(err.message || 'Failed to load invoice');
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceCode]);

  // Load saved cards
  const loadSavedCards = useCallback(async () => {
    if (!invoiceCode) return;

    try {
      setLoadingSavedCards(true);
      const data = await invoicesAPI.getSavedCards(invoiceCode);
      setSavedCards(data.payment_methods || []);
    } catch (err) {
      console.error('[PublicInvoiceView] Error loading saved cards:', err);
      // Don't show error to user - just means no cards saved
      setSavedCards([]);
    } finally {
      setLoadingSavedCards(false);
    }
  }, [invoiceCode]);

  // Show delete card confirmation modal
  const handleDeleteCard = (paymentMethodId) => {
    if (!invoiceCode || !paymentMethodId) return;
    const card = savedCards.find(c => c.id === paymentMethodId);
    setCardToDelete(card || { id: paymentMethodId });
    setDeleteCardError(null);
    setShowDeleteCardModal(true);
  };

  // Confirm delete card
  const confirmDeleteCard = async () => {
    if (!cardToDelete?.id) return;

    try {
      setDeletingCard(cardToDelete.id);
      setDeleteCardError(null);
      await invoicesAPI.deleteSavedCard(invoiceCode, cardToDelete.id);
      // Reload both saved cards and invoice to get updated has_saved_payment_method
      await Promise.all([loadSavedCards(), loadInvoice()]);
      setShowDeleteCardModal(false);
      setCardToDelete(null);
    } catch (err) {
      console.error('[PublicInvoiceView] Error deleting card:', err);
      setDeleteCardError(err.message || 'Failed to remove card. Please try again.');
    } finally {
      setDeletingCard(null);
    }
  };

  // Cancel delete card
  const cancelDeleteCard = () => {
    setShowDeleteCardModal(false);
    setCardToDelete(null);
    setDeleteCardError(null);
  };

  // Handle PayPal return - run once on mount
  useEffect(() => {
    const handlePayPalReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      const paypalStatus = params.get('paypal');

      if (paypalStatus === 'approved') {
        const orderId = sessionStorage.getItem('paypal_order_id');
        const storedShareCode = sessionStorage.getItem('paypal_share_code');

        if (orderId && storedShareCode) {
          setCapturingPayPal(true);

          try {
            const result = await invoicesAPI.capturePayPalOrder(storedShareCode, {
              order_id: orderId,
            });

            sessionStorage.removeItem('paypal_order_id');
            sessionStorage.removeItem('paypal_share_code');

            if (result.status === 'captured') {
              setPaymentSuccess(true);
            }
          } catch (err) {
            console.error('[PublicInvoiceView] PayPal capture error:', err);
            setError('Failed to complete PayPal payment. Please try again.');
          } finally {
            setCapturingPayPal(false);
          }
        }

        // Clear query params
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('paypal');
        setSearchParams(newParams, { replace: true });
      }

      if (paypalStatus === 'cancelled') {
        sessionStorage.removeItem('paypal_order_id');
        sessionStorage.removeItem('paypal_share_code');
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('paypal');
        setSearchParams(newParams, { replace: true });
      }
    };

    handlePayPalReturn();
  }, []); // Run once on mount

  // Initial load - run once
  useEffect(() => {
    loadInvoice();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load saved cards when invoice has card on file
  useEffect(() => {
    if (invoice?.has_saved_payment_method) {
      loadSavedCards();
    }
  }, [invoice?.has_saved_payment_method, loadSavedCards]);

  const handlePaymentSuccess = useCallback(async () => {
    // Refresh invoice data silently (without showing loading spinner)
    // so the updated amounts are displayed with the success message
    try {
      const data = await invoicesAPI.getPublicByShareCode(invoiceCode);
      setInvoice(data);
    } catch (err) {
      console.error('[PublicInvoiceView] Error refreshing invoice after payment:', err);
    }
    // Show success message after invoice data is updated
    setPaymentSuccess(true);
  }, [invoiceCode]);

  // Status badge colors matching InvoiceDetail design
  const getStatusBadgeClasses = (status) => {
    const statusColors = {
      draft: 'bg-[#f4f4f5] text-[#09090b]',
      sent: 'bg-[#dff2fe] text-[#09090b]',
      viewed: 'bg-[#e0f2fe] text-[#09090b]',
      partial: 'bg-[#fef3c7] text-[#09090b]',
      paid: 'bg-[#dcfce7] text-[#09090b]',
      overdue: 'bg-[#fee2e2] text-[#09090b]',
      cancelled: 'bg-[#f4f4f5] text-[#71717a]',
    };
    return statusColors[status] || 'bg-[#f4f4f5] text-[#09090b]';
  };

  // Loading state
  if (loading || capturingPayPal) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]"></div>
          <p className="mt-2 text-sm text-[#71717a]">
            {capturingPayPal ? 'Processing PayPal payment...' : 'Loading invoice...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#09090b] mb-2">Error</h1>
          <p className="text-[#71717a]">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const isPaid = invoice.status === 'paid';
  const isCancelled = invoice.status === 'cancelled';
  const amountDue = invoice.outstanding_balance || invoice.total - (invoice.paid_amount || 0);
  const canPayStripe = invoice.allow_stripe_payments && invoice.stripe_connected;
  const canPayPayPal = invoice.allow_paypal_payments && invoice.paypal_connected;
  const canPay = !isPaid && !isCancelled && amountDue > 0 && (canPayStripe || canPayPayPal);
  const items = invoice.invoice_items || invoice.items || [];

  // Recurring invoice detection
  const isRecurring = invoice.pricing_type === 'Recurring' || invoice.recurring_type;
  const automaticPaymentEnabled = invoice.automatic_payment_enabled === true;
  const canSetupAutomaticPayments = isRecurring && automaticPaymentEnabled && canPayStripe;
  const hasCardOnFile = invoice.has_saved_payment_method === true;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const itemLevelTax = items.reduce((sum, item) => {
    const itemTax = item.taxes?.reduce((t, tax) => t + (tax.tax_amount || 0), 0) || 0;
    return sum + itemTax;
  }, 0);
  const hasTax = itemLevelTax > 0 || (invoice.tax_total && invoice.tax_total > 0);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Content Section */}
      <div className="px-4 md:px-8 py-4">
        {/* Success Message */}
        {paymentSuccess && (
          <div className="max-w-[1200px] mx-auto mb-4 bg-white border-2 border-green-500 rounded-[12px] p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-[#09090b]">Payment Successful!</h3>
                <p className="text-sm text-[#71717a] mt-1">
                  Thank you for your payment. A confirmation email will be sent shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Invoice and Payment side by side */}
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-4">
          {/* Main Invoice Card */}
          <div className="flex-1 bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6 flex flex-col gap-6">
          {/* Header: Logo + Invoice Number | Dates + Status */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              {/* Company Logo */}
              {invoice.company_logo_url && (
                <img
                  src={invoice.company_logo_url}
                  alt={invoice.company_name || 'Company Logo'}
                  className="max-h-16 max-w-[200px] object-contain mb-4"
                />
              )}
              <h2 className="text-[32px] font-semibold leading-[40px] text-[#09090b]">
                {invoice.invoice_number}
              </h2>
            </div>
            <div className="flex flex-col gap-3 items-end">
              <div className="text-right">
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Invoice Date</p>
                <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                  {formatDate(invoice.issue_date || invoice.invoice_date)}
                </p>
              </div>
              {invoice.due_date && (
                <div className="text-right">
                  <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Due Date</p>
                  <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                    {formatDate(invoice.due_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e5e5e5] w-full" />

          {/* From / Billed To */}
          <div className="flex gap-8">
            {/* From */}
            <div className="flex-1 flex flex-col gap-[6px]">
              <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">From</p>
              <div className="flex flex-col gap-[2px]">
                {/* Company Name */}
                <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                  {invoice.company_name || 'Company'}
                </p>
                {/* Company Address */}
                {(invoice.company_address || invoice.company_city || invoice.company_state || invoice.company_postal_code || invoice.company_country) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {[
                      invoice.company_address,
                      [invoice.company_city, invoice.company_state, invoice.company_postal_code].filter(Boolean).join(', '),
                      invoice.company_country
                    ].filter(Boolean).join('\n')}
                  </p>
                )}
                {/* Company Email */}
                {invoice.company_email && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {invoice.company_email}
                  </p>
                )}
                {/* Company Phone */}
                {invoice.company_phone && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {invoice.company_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Billed To */}
            <div className="flex-1 flex flex-col gap-[6px]">
              <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Billed to</p>
              <div className="flex flex-col gap-[2px]">
                {/* Contact Name */}
                <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                  {invoice.contact_name || invoice.client_name || 'Client'}
                </p>
                {/* Business Name (if different from contact name) */}
                {invoice.contact_business_name && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {invoice.contact_business_name}
                  </p>
                )}
                {/* Contact Address */}
                {(invoice.contact_address || invoice.contact_city || invoice.contact_state || invoice.contact_postcode || invoice.contact_country) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {[
                      invoice.contact_address,
                      [invoice.contact_city, invoice.contact_state, invoice.contact_postcode].filter(Boolean).join(', '),
                      invoice.contact_country
                    ].filter(Boolean).join('\n')}
                  </p>
                )}
                {/* Contact Email */}
                {(invoice.contact_email || invoice.client_email) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {invoice.contact_email || invoice.client_email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e5e5e5] w-full" />

          {/* Lists of Items */}
          <div className="flex flex-col gap-3">
            <p className="text-[16px] font-bold leading-[24px] text-[#09090b]">
              Lists of Items
            </p>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[#e5e5e5]">
                    <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a]">
                      Description
                    </th>
                    <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                      Quantity
                    </th>
                    <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                      Price
                    </th>
                    <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[95px]">
                      Amount
                    </th>
                    {hasTax && (
                      <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                        Tax
                      </th>
                    )}
                    <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[95px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={hasTax ? 6 : 5} className="px-3 py-8 text-center text-[14px] text-[#71717a]">
                        No items
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const itemAmount = parseFloat(item.amount || 0);
                      const itemTaxAmount = item.taxes?.reduce((sum, t) => sum + (t.tax_amount || 0), 0) || 0;
                      const itemTotal = itemAmount + itemTaxAmount;

                      return (
                        <tr key={index} className="border-b border-[#e5e5e5] bg-white">
                          <td className="px-3 py-4">
                            <div>
                              <span className="text-[14px] font-normal leading-[22px] text-[#09090b]">
                                {item.description || item.name}
                              </span>
                              {item.subtext && (
                                <p className="text-[12px] text-[#71717a] mt-0.5">{item.subtext}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                            {parseFloat(item.quantity || 0)}
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                            {formatCurrency(parseFloat(item.price || item.unit_price || 0), invoice.currency_code)}
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                            {formatCurrency(itemAmount, invoice.currency_code)}
                          </td>
                          {hasTax && (
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {formatCurrency(itemTaxAmount, invoice.currency_code)}
                            </td>
                          )}
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                            {formatCurrency(itemTotal, invoice.currency_code)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Details */}
          <div className="flex flex-col items-end">
            {/* Sub Total */}
            <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
              <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                Sub Total:
              </span>
              <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                {formatCurrency(invoice.subtotal || subtotal, invoice.currency_code)}
              </span>
            </div>

            {/* Discount */}
            {parseFloat(invoice.discount_amount || 0) > 0 && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                  Discount{invoice.discount_percentage && parseFloat(invoice.discount_percentage) > 0 ? ` (${parseFloat(invoice.discount_percentage)}%)` : ''}:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-red-600">
                  - {formatCurrency(parseFloat(invoice.discount_amount), invoice.currency_code)}
                </span>
              </div>
            )}

            {/* Document Taxes - show each tax line */}
            {invoice.document_taxes?.length > 0 && invoice.document_taxes.map((tax, index) => (
              <div key={tax.id || index} className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                  {tax.tax_name || 'Tax'} ({parseFloat(tax.tax_rate)}%):
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                  + {formatCurrency(parseFloat(tax.tax_amount || 0), invoice.currency_code)}
                </span>
              </div>
            ))}

            {/* Fallback Tax display if no document_taxes but has tax totals */}
            {(!invoice.document_taxes || invoice.document_taxes.length === 0) &&
             (parseFloat(invoice.document_tax_total || 0) > 0 || parseFloat(invoice.tax_total || 0) > 0 || itemLevelTax > 0) && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                  Tax:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                  + {formatCurrency(
                    parseFloat(invoice.document_tax_total || 0) ||
                    parseFloat(invoice.tax_total || 0) ||
                    itemLevelTax,
                    invoice.currency_code
                  )}
                </span>
              </div>
            )}

            {/* Total Amount */}
            <div className="flex items-center gap-4 px-4 py-2 bg-[#ddd6ff] text-right">
              <span className="w-[150px] text-[16px] font-bold leading-[24px] text-[#09090b]">
                Total Amount:
              </span>
              <span className="w-[216px] text-[16px] font-bold leading-[24px] text-[#09090b]">
                {formatCurrency(invoice.total, invoice.currency_code)}
              </span>
            </div>

            {/* Deposit Requested - shown underneath Total Amount */}
            {parseFloat(invoice.deposit_amount || 0) > 0 && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                  Deposit Requested{invoice.deposit_percentage && parseFloat(invoice.deposit_percentage) > 0 ? ` (${parseFloat(invoice.deposit_percentage)}%)` : ''}:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                  {formatCurrency(parseFloat(invoice.deposit_amount), invoice.currency_code)}
                </span>
              </div>
            )}
          </div>

          {/* Payment Summary Card */}
          <div className="border-[1.5px] border-[#e5e5e5] rounded-[8px] p-4 flex flex-col gap-4">
            <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
              Payment Summary
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-normal leading-[22px] text-[#71717a]">Total Amount</span>
                <span className="text-[16px] font-normal leading-[24px] text-[#09090b]">
                  {formatCurrency(invoice.total, invoice.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-normal leading-[22px] text-[#71717a]">Amount Paid</span>
                <span className="text-[16px] font-normal leading-[24px] text-[#09090b]">
                  {formatCurrency(invoice.paid_amount || 0, invoice.currency_code)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e5e5e5] w-full" />

            {/* Outstanding Balance */}
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium leading-[22px] text-[#09090b]">
                Outstanding Balance
              </span>
              <span className={`text-[16px] font-bold leading-[24px] text-right w-[216px] ${
                amountDue > 0
                  ? 'text-[#fb2c36]'
                  : amountDue < 0
                    ? 'text-green-600'
                    : 'text-[#09090b]'
              }`}>
                {amountDue > 0
                  ? formatCurrency(amountDue, invoice.currency_code)
                  : amountDue < 0
                    ? `${formatCurrency(Math.abs(amountDue), invoice.currency_code)} Credit`
                    : 'Paid in Full'}
              </span>
            </div>
          </div>

          {/* Payment Instructions & Notes - Side by Side */}
          {(invoice.payment_instructions || invoice.notes) && (
            <div className="flex gap-8 pt-4 border-t border-[#e5e5e5]">
              {/* Payment Instructions */}
              {invoice.payment_instructions && (
                <div className="flex-1 flex flex-col gap-4">
                  <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
                    Payment Instructions
                  </p>
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                    {invoice.payment_instructions}
                  </p>
                </div>
              )}

              {/* Notes Section */}
              {invoice.notes && (
                <div className="flex-1 flex flex-col gap-4">
                  <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
                    Notes
                  </p>
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

          {/* Payment Section - Right Side */}
          {canPay && !paymentSuccess && !cardSetupSuccess && (
            <div className="lg:w-[340px] lg:flex-shrink-0 bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6 flex flex-col gap-6 h-fit lg:sticky lg:top-4">
              <p className="text-[16px] font-bold leading-[24px] text-[#09090b]">
                {isRecurring ? 'Recurring Invoice' : 'Make a Payment'}
              </p>

              {/* Recurring Invoice Banner */}
              {isRecurring && (
                <div className="p-3 bg-[#f5f0ff] border border-[#d4bfff] rounded-lg">
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-[#8e51ff] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-[#5b21b6]">
                        This is a recurring invoice
                      </p>
                      {invoice.recurring_type && (
                        <p className="text-[12px] text-[#7c3aed] mt-0.5">
                          Billed {invoice.recurring_type.toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-billing Failed Warning */}
              {invoice.auto_billing_failed && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-red-800">
                        Automatic Payment Failed
                      </p>
                      <p className="text-[12px] text-red-700 mt-0.5">
                        {invoice.auto_billing_failure_reason || 'Your payment could not be processed.'}
                      </p>
                      <p className="text-[11px] text-red-600 mt-1">
                        Please update your payment method or pay manually below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-billing Retry Scheduled Warning */}
              {!invoice.auto_billing_failed && invoice.next_auto_billing_retry_at && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-orange-800">
                        Payment Retry Scheduled
                      </p>
                      {invoice.auto_billing_failure_reason && (
                        <p className="text-[12px] text-orange-700 mt-0.5">
                          {invoice.auto_billing_failure_reason}
                        </p>
                      )}
                      <p className="text-[11px] text-orange-600 mt-1">
                        We'll automatically retry your payment. You can also pay manually below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Due Banner */}
              <div className="p-4 bg-[#f4f4f5] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#71717a]">Amount Due:</span>
                  <span className="text-[20px] font-bold text-[#09090b]">
                    {formatCurrency(amountDue, invoice.currency_code)}
                  </span>
                </div>
              </div>

              {/* Card on File Indicator */}
              {hasCardOnFile && (
                <div className="p-3 bg-[#f0fdf4] border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-[13px] text-green-800">
                          Card saved for automatic payments
                        </p>
                        {loadingSavedCards ? (
                          <p className="text-[11px] text-green-600 mt-0.5">Loading card details...</p>
                        ) : savedCards.length > 0 && (
                          <p className="text-[11px] text-green-600 mt-0.5">
                            {savedCards[0].brand?.charAt(0).toUpperCase() + savedCards[0].brand?.slice(1) || 'Card'} •••• {savedCards[0].last4}
                            {savedCards[0].exp_month && savedCards[0].exp_year && (
                              <span className="ml-1">
                                (expires {savedCards[0].exp_month}/{savedCards[0].exp_year.toString().slice(-2)})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    {savedCards.length > 0 && (
                      <button
                        onClick={() => handleDeleteCard(savedCards[0].id)}
                        disabled={deletingCard === savedCards[0].id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Remove card"
                      >
                        {deletingCard === savedCards[0].id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              {!paymentMethod && (
                <div className="space-y-4">
                  <p className="text-[14px] font-medium text-[#09090b]">
                    {hasCardOnFile ? 'Pay Now' : canSetupAutomaticPayments ? 'Payment Options' : 'Select Payment Method'}
                  </p>
                  <div className="flex flex-col gap-3">
                    {/* Pay with Saved Card - When card is already on file */}
                    {hasCardOnFile && canPayStripe && (
                      <button
                        onClick={() => setPaymentMethod('saved_card')}
                        className="p-4 bg-[#f0fdf4] rounded-lg border-2 border-green-300 hover:border-green-500 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CreditCard className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="text-left flex-1">
                            <span className="text-[14px] font-semibold text-[#09090b] block">
                              Pay with Saved Card
                            </span>
                            <p className="text-[11px] text-[#71717a]">
                              {savedCards.length > 0
                                ? `${savedCards[0].brand?.charAt(0).toUpperCase() + savedCards[0].brand?.slice(1) || 'Card'} •••• ${savedCards[0].last4}`
                                : 'Use your card on file'}
                            </p>
                          </div>
                          <span className="text-[10px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        </div>
                      </button>
                    )}

                    {/* Save Card for Automatic Payments - Only for recurring with auto-pay enabled */}
                    {canSetupAutomaticPayments && !hasCardOnFile && (
                      <button
                        onClick={() => setPaymentMethod('setup_card')}
                        className="p-4 bg-[#f5f0ff] rounded-lg border-2 border-[#d4bfff] hover:border-[#8e51ff] transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#ede9fe] rounded-lg">
                            <CreditCard className="h-5 w-5 text-[#8e51ff]" />
                          </div>
                          <div className="text-left flex-1">
                            <span className="text-[14px] font-semibold text-[#09090b] block">
                              Set Up Automatic Payments
                            </span>
                            <p className="text-[11px] text-[#71717a]">
                              Save card for future recurring charges
                            </p>
                          </div>
                          <span className="text-[10px] font-medium text-[#5b21b6] bg-[#ede9fe] px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        </div>
                      </button>
                    )}

                    {canPayStripe && (
                      <button
                        onClick={() => setPaymentMethod('stripe')}
                        className="p-4 bg-[#f4f4f5] rounded-lg border-2 border-transparent hover:border-[#8e51ff] transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#635bff]/10 rounded-lg">
                            <StripeLogo className="h-5 w-5 text-[#635bff]" />
                          </div>
                          <div className="text-left">
                            <span className="text-[14px] font-semibold text-[#09090b] block">
                              {isRecurring ? 'Pay This Invoice Only' : 'Credit Card'}
                            </span>
                            <p className="text-[11px] text-[#71717a]">
                              {isRecurring ? 'One-time payment' : 'Visa, Mastercard, Amex'}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                    {canPayPayPal && (
                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className="p-4 bg-[#f4f4f5] rounded-lg border-2 border-transparent hover:border-[#8e51ff] transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#003087]/10 rounded-lg">
                            <PayPalLogo className="h-5 w-5 text-[#003087]" />
                          </div>
                          <div className="text-left">
                            <span className="text-[14px] font-semibold text-[#09090b] block">PayPal</span>
                            <p className="text-[11px] text-[#71717a]">
                              Pay with PayPal account
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Stripe Card Setup Form - For recurring automatic payments */}
              {paymentMethod === 'setup_card' && canSetupAutomaticPayments && (
                <StripeCardSetupSection
                  shareCode={invoiceCode}
                  onSuccess={() => {
                    setCardSetupSuccess(true);
                    loadInvoice(); // Reload to get updated has_saved_payment_method
                  }}
                  onError={(err) => console.error(err)}
                  onBack={() => setPaymentMethod(null)}
                />
              )}

              {/* Pay with Saved Card */}
              {paymentMethod === 'saved_card' && hasCardOnFile && (
                <SavedCardPaymentInline
                  shareCode={invoiceCode}
                  amountDue={amountDue}
                  currency={invoice.currency_code}
                  savedCard={savedCards[0]}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setPaymentMethod(null)}
                />
              )}

              {/* Stripe Payment Form */}
              {paymentMethod === 'stripe' && canPayStripe && (
                <StripePaymentSection
                  shareCode={invoiceCode}
                  amount={amountDue}
                  currency={invoice.currency_code}
                  onSuccess={handlePaymentSuccess}
                  onError={(err) => console.error(err)}
                  onBack={() => setPaymentMethod(null)}
                />
              )}

              {/* PayPal Payment */}
              {paymentMethod === 'paypal' && canPayPayPal && (
                <PayPalPaymentSection
                  shareCode={invoiceCode}
                  amount={amountDue}
                  currency={invoice.currency_code}
                  onBack={() => setPaymentMethod(null)}
                />
              )}
            </div>
          )}

          {/* Card Setup Success - Right Side */}
          {cardSetupSuccess && !paymentSuccess && (
            <SavedCardPaymentSection
              shareCode={invoiceCode}
              amountDue={amountDue}
              currency={invoice.currency_code}
              onSuccess={handlePaymentSuccess}
            />
          )}

          {/* No payment methods available - Right Side */}
          {!canPay && !isPaid && !isCancelled && amountDue > 0 && !cardSetupSuccess && (
            <div className="lg:w-[340px] lg:flex-shrink-0 bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6 h-fit">
              <p className="text-[16px] font-bold leading-[24px] text-[#09090b] mb-4">Payment</p>
              {isRecurring && (
                <div className="p-3 bg-[#f5f0ff] border border-[#d4bfff] rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-[#8e51ff] mt-0.5" />
                    <p className="text-[12px] text-[#7c3aed]">
                      This is a recurring invoice
                    </p>
                  </div>
                </div>
              )}
              <p className="text-[14px] text-[#71717a]">
                Online payments are not available for this invoice.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Card Confirmation Modal */}
      {showDeleteCardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={cancelDeleteCard}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Remove Saved Card
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Are you sure you want to remove this card?
                      </p>
                      {cardToDelete && (cardToDelete.brand || cardToDelete.last4) && (
                        <p className="mt-2 text-sm font-medium text-gray-900">
                          {cardToDelete.brand?.charAt(0).toUpperCase() + cardToDelete.brand?.slice(1) || 'Card'} •••• {cardToDelete.last4}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        You will need to add a new card for future automatic payments.
                      </p>
                      {deleteCardError && (
                        <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                          {deleteCardError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDeleteCard}
                  disabled={deletingCard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCard}
                  disabled={deletingCard}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {deletingCard ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove Card'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicInvoiceView;
