import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, CreditCard, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
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
  hidePostalCode: false,
};

/**
 * Stripe Card Form Component
 */
const StripeCardForm = ({ clientSecret, amount, currency, onSuccess, onError, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');

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
              email: email || undefined,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess();
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
        className="flex items-center gap-2 text-sm text-zenible-primary hover:text-zenible-primary/80 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payment methods
      </button>

      <div>
        <label className="block text-sm font-medium design-text-primary mb-1">
          Email (for receipt)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 design-text-primary focus:outline-none focus:ring-2 focus:ring-zenible-primary"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium design-text-primary mb-1">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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

      <div className="flex items-center justify-center gap-2 text-xs design-text-muted">
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
        setStripePromise(loadStripe(paymentData.publishable_key));
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
        <Loader2 className="h-8 w-8 animate-spin text-zenible-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={onBack}
          className="mt-2 text-sm text-zenible-primary hover:text-zenible-primary/80"
        >
          Back to payment methods
        </button>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Card payments are not available for this invoice.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm
        clientSecret={clientSecret}
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
        className="flex items-center gap-2 text-sm text-zenible-primary hover:text-zenible-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payment methods
      </button>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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

      <p className="text-xs text-center design-text-muted">
        You will be redirected to PayPal to complete your payment securely.
      </p>
    </div>
  );
};

/**
 * Poll for payment status
 */
const pollPaymentStatus = async (shareCode, paymentId, gateway, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const status =
        gateway === 'stripe'
          ? await invoicesAPI.getStripePaymentStatus(shareCode, paymentId)
          : await invoicesAPI.getPayPalOrderStatus(shareCode, paymentId);

      if (status.status === 'succeeded' || status.status === 'captured') {
        return { success: true, status };
      }

      if (status.status === 'failed' || status.status === 'canceled') {
        return { success: false, status };
      }
    } catch (err) {
      console.error('[pollPaymentStatus] Error:', err);
    }
  }

  return { success: false, timeout: true };
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
  const [capturingPayPal, setCapturingPayPal] = useState(false);

  // Use shareCode from URL or fall back to token for backwards compatibility
  const invoiceCode = shareCode || token;

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

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    loadInvoice();
  };

  // Loading state
  if (loading || capturingPayPal) {
    return (
      <div className="min-h-screen flex items-center justify-center design-bg-secondary">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-zenible-primary mx-auto" />
          <p className="mt-4 text-lg design-text-secondary">
            {capturingPayPal ? 'Processing PayPal payment...' : 'Loading invoice...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center design-bg-secondary">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold design-text-primary mb-2">Error</h1>
          <p className="design-text-secondary">{error}</p>
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

  return (
    <div className="min-h-screen design-bg-secondary py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        {paymentSuccess && (
          <div className="mb-6 design-bg-primary rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold design-text-primary">Payment Successful!</h3>
                <p className="text-sm design-text-secondary mt-1">
                  Thank you for your payment. A confirmation email will be sent shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Card */}
        <div className="design-bg-primary rounded-lg shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 pb-8 border-b design-border">
            <div>
              {invoice.company_logo_url && (
                <img
                  src={invoice.company_logo_url}
                  alt={invoice.company_name}
                  className="h-12 mb-4 object-contain"
                />
              )}
              <h1 className="text-2xl md:text-3xl font-bold design-text-primary mb-2">
                Invoice {invoice.invoice_number}
              </h1>
              <span
                className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                  isPaid
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : isCancelled
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
              </span>
            </div>
            <div className="text-left md:text-right">
              <div className="text-sm design-text-secondary">Issue Date</div>
              <div className="text-lg font-medium design-text-primary">
                {new Date(invoice.issue_date).toLocaleDateString()}
              </div>
              {invoice.due_date && (
                <>
                  <div className="text-sm design-text-secondary mt-2">Due Date</div>
                  <div className="text-lg font-medium design-text-primary">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* From/To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
            <div>
              <div className="text-sm design-text-secondary mb-2">From</div>
              <div className="text-lg font-medium design-text-primary">
                {invoice.company_name || 'Company'}
              </div>
              {invoice.company_email && (
                <div className="design-text-secondary">{invoice.company_email}</div>
              )}
              {invoice.company_phone && (
                <div className="design-text-secondary">{invoice.company_phone}</div>
              )}
              {invoice.company_address && (
                <div className="design-text-secondary whitespace-pre-line">
                  {invoice.company_address}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm design-text-secondary mb-2">Bill To</div>
              <div className="text-lg font-medium design-text-primary">
                {invoice.client_name || 'Client'}
              </div>
              {invoice.client_email && (
                <div className="design-text-secondary">{invoice.client_email}</div>
              )}
            </div>
          </div>

          {/* Line Items */}
          {invoice.items && invoice.items.length > 0 && (
            <div className="mb-8 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b design-border">
                    <th className="text-left py-3 text-sm font-medium design-text-secondary">
                      Item
                    </th>
                    <th className="text-right py-3 text-sm font-medium design-text-secondary">
                      Qty
                    </th>
                    <th className="text-right py-3 text-sm font-medium design-text-secondary">
                      Price
                    </th>
                    <th className="text-right py-3 text-sm font-medium design-text-secondary">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b design-border">
                      <td className="py-3">
                        <div className="font-medium design-text-primary">{item.name}</div>
                        {item.description && (
                          <div className="text-sm design-text-secondary">{item.description}</div>
                        )}
                      </td>
                      <td className="text-right py-3 design-text-primary">{item.quantity}</td>
                      <td className="text-right py-3 design-text-primary">
                        {formatCurrency(item.price, invoice.currency_code)}
                      </td>
                      <td className="text-right py-3 font-medium design-text-primary">
                        {formatCurrency(item.amount, invoice.currency_code)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between design-text-secondary">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency_code)}</span>
              </div>
              {invoice.tax_total > 0 && (
                <div className="flex justify-between design-text-secondary">
                  <span>Tax</span>
                  <span>{formatCurrency(invoice.tax_total, invoice.currency_code)}</span>
                </div>
              )}
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discount_amount, invoice.currency_code)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold design-text-primary pt-2 border-t design-border">
                <span>Total</span>
                <span>{formatCurrency(invoice.total, invoice.currency_code)}</span>
              </div>
              {invoice.paid_amount > 0 && (
                <div className="flex justify-between design-text-secondary">
                  <span>Paid</span>
                  <span>{formatCurrency(invoice.paid_amount, invoice.currency_code)}</span>
                </div>
              )}
              {amountDue > 0 && !isPaid && (
                <div className="flex justify-between text-lg font-bold text-zenible-primary pt-2 border-t design-border">
                  <span>Amount Due</span>
                  <span>{formatCurrency(amountDue, invoice.currency_code)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-6 border-t design-border">
              <h3 className="text-sm font-medium design-text-primary mb-2">Notes</h3>
              <p className="text-sm design-text-secondary whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Instructions */}
          {invoice.payment_instructions && (
            <div className="pt-6 border-t design-border">
              <h3 className="text-sm font-medium design-text-primary mb-2">Payment Instructions</h3>
              <p className="text-sm design-text-secondary whitespace-pre-wrap">
                {invoice.payment_instructions}
              </p>
            </div>
          )}
        </div>

        {/* Payment Section */}
        {canPay && !paymentSuccess && (
          <div className="mt-6 design-bg-primary rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold design-text-primary mb-6">
              Make a Payment
            </h2>

            {/* Amount Due Banner */}
            <div className="mb-6 p-4 design-bg-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg design-text-secondary">Amount Due:</span>
                <span className="text-2xl font-bold design-text-primary">
                  {formatCurrency(amountDue, invoice.currency_code)}
                </span>
              </div>
            </div>

            {/* Payment Method Selection */}
            {!paymentMethod && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold design-text-primary">Select Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {canPayStripe && (
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className="p-6 design-bg-secondary rounded-lg border-2 border-transparent hover:border-zenible-primary transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#635bff]/10 rounded-lg">
                          <StripeLogo className="h-6 w-6 text-[#635bff]" />
                        </div>
                        <span className="text-lg font-semibold design-text-primary">
                          Credit Card
                        </span>
                      </div>
                      <p className="text-sm design-text-secondary text-left">
                        Pay securely with Visa, Mastercard, or American Express
                      </p>
                    </button>
                  )}
                  {canPayPayPal && (
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className="p-6 design-bg-secondary rounded-lg border-2 border-transparent hover:border-zenible-primary transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#003087]/10 rounded-lg">
                          <PayPalLogo className="h-6 w-6 text-[#003087]" />
                        </div>
                        <span className="text-lg font-semibold design-text-primary">PayPal</span>
                      </div>
                      <p className="text-sm design-text-secondary text-left">
                        Pay with your PayPal account or debit card
                      </p>
                    </button>
                  )}
                </div>
              </div>
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

        {/* No payment methods available */}
        {!canPay && !isPaid && !isCancelled && amountDue > 0 && (
          <div className="mt-6 design-bg-primary rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold design-text-primary mb-4">Payment</h2>
            <p className="design-text-secondary">
              Online payments are not available for this invoice. Please contact{' '}
              {invoice.company_email || 'the sender'} for payment instructions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicInvoiceView;
