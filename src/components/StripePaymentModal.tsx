import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutFormProps {
  planName: string;
  price: string;
  billingCycle: string;
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: any) => void;
  onCancel: () => void;
  loading: boolean;
}

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planId: string;
  price: string;
  billingCycle: string;
  onSuccess: (paymentMethodId: string) => Promise<void>;
  onError: (error: any) => void;
}

// Import SVG assets
import shieldIcon from '../assets/payment-modal/shield-icon.svg';
import closeIcon from '../assets/payment-modal/close-icon.svg';
import cardIcon from '../assets/payment-modal/card-icon.svg';
import checkCircle from '../assets/payment-modal/check-circle.svg';
import lockIcon from '../assets/payment-modal/lock-icon.svg';
import stripeLogo from '../assets/payment-modal/stripe-logo.svg';
import visaLogo from '../assets/payment-modal/visa.svg';
import mastercardLogo from '../assets/payment-modal/mastercard.svg';
import amexLogo from '../assets/payment-modal/amex.svg';
import discoverLogo from '../assets/payment-modal/discover.svg';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Card form component with Figma design
function CheckoutForm({ planName, price, billingCycle, onSuccess, onError: _onError, onCancel: _onCancel, loading }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { darkMode } = usePreferences();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    const cardNumber = elements.getElement(CardNumberElement);

    if (!cardNumber) {
      setCardError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method using existing user data
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
        billing_details: {
          email: user?.email,
          name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.name,
        },
      });

      if (error) {
        setCardError(error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Call the success callback with the payment method
      onSuccess(paymentMethod!.id);
    } catch (_err) {
      setCardError('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  const stripeElementStyles: any = {
    base: {
      fontSize: '16px',
      color: darkMode ? '#ededf0' : '#71717a',
      fontFamily: 'Inter, sans-serif',
      '::placeholder': {
        color: darkMode ? '#85888e' : '#a1a1aa',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Plan Summary Section */}
        <div className={`p-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-zenible-dark-bg border border-zenible-dark-border' : 'bg-neutral-50 border border-neutral-200'}`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className={`font-medium text-base ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {planName}
                </h4>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                  {billingCycle === 'monthly' ? 'Monthly' : 'Annual'} billing • Cancel anytime
                </p>
              </div>
              <div className="text-right">
                <div className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  ${price}
                </div>
                <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information Section */}
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <label className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Payment information
              </label>
              <div className="flex gap-1">
                <img src={visaLogo} alt="Visa" className="h-4" />
                <img src={mastercardLogo} alt="Mastercard" className="h-4" />
                <img src={amexLogo} alt="American Express" className="h-4" />
                <img src={discoverLogo} alt="Discover" className="h-4" />
              </div>
            </div>

            <div className="space-y-4">
              {/* Card Number Field */}
              <div className={`flex items-center px-4 py-3 rounded-[10px] border-[1.5px] ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border'
                  : 'bg-white border-neutral-200'
              }`}>
                <img src={cardIcon} alt="Card" className="w-5 h-5 mr-3 opacity-60" />
                <div className="flex-1">
                  <CardNumberElement options={stripeElementStyles} />
                </div>
              </div>

              {/* Expiry and CVC Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`px-4 py-3 rounded-[10px] border-[1.5px] ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border'
                    : 'bg-white border-neutral-200'
                }`}>
                  <CardExpiryElement options={stripeElementStyles} />
                </div>
                <div className={`px-4 py-3 rounded-[10px] border-[1.5px] ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border'
                    : 'bg-white border-neutral-200'
                }`}>
                  <CardCvcElement options={stripeElementStyles} />
                </div>
              </div>
            </div>

            {cardError && (
              <p className="mt-2 text-sm text-red-500">{cardError}</p>
            )}
          </div>

          {/* Security Box */}
          <div className={`p-3 rounded-xl border ${
            darkMode
              ? 'bg-green-900/20 border-green-800'
              : 'bg-green-50 border-green-600'
          }`}>
            <div className="flex gap-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-green-800' : 'bg-green-100'
              }`}>
                <img src={shieldIcon} alt="Shield" className={`w-3.5 h-3.5 ${darkMode ? 'filter brightness-0 invert' : ''}`}
                     style={{ filter: darkMode ? 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' : 'none' }} />
              </div>
              <div className="flex-1">
                <p className={`font-medium text-base mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  Your payment is protected
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <img src={checkCircle} alt="Check" className="w-4 h-4" />
                    <span className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                      256-bit SSL encryption
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={checkCircle} alt="Check" className="w-4 h-4" />
                    <span className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                      PCI DSS Level 1 compliant
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={checkCircle} alt="Check" className="w-4 h-4" />
                    <span className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                      30-day money-back guarantee
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms Text */}
          <p className={`text-xs text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            By subscribing, you agree to our{' '}
            <a href="#" className="text-zenible-primary font-medium hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-zenible-primary font-medium hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div className={`border-t ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
        {/* Subscribe Button */}
        <div className="p-4">
          <button
            type="submit"
            disabled={!stripe || isProcessing || loading}
            className="w-full px-4 py-3 bg-zenible-primary text-white rounded-xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing || loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <img src={lockIcon} alt="Lock" className="w-5 h-5" />
                Subscribe for ${price}/{billingCycle === 'monthly' ? 'month' : 'year'}
              </>
            )}
          </button>
        </div>

        {/* Secured by Stripe */}
        <div className={`px-4 pb-4 flex items-center justify-center gap-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          <span className="text-xs">Secured by</span>
          <img src={stripeLogo} alt="Stripe" className="h-6" />
        </div>
      </div>
    </form>
  );
}

// Main modal component
export default function StripePaymentModal({
  isOpen,
  onClose,
  planName,
  planId: _planId,
  price,
  billingCycle,
  onSuccess,
  onError
}: StripePaymentModalProps) {
  const { darkMode } = usePreferences();
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (paymentMethodId: string) => {
    setLoading(true);
    try {
      await onSuccess(paymentMethodId);
      onClose();
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    onError(error);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className={`w-full max-w-md rounded-xl shadow-xl flex flex-col max-h-[90vh] ${
        darkMode ? 'bg-zenible-dark-card' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-4 py-4 border-b flex items-center gap-2 ${
          darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
        }`}>
          <div className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center ${
            darkMode ? 'bg-purple-900/30' : 'bg-violet-50'
          }`}>
            <img
              src={shieldIcon}
              alt="Shield"
              className="w-3.5 h-3.5"
              style={{ filter: 'brightness(0) saturate(100%) invert(33%) sepia(95%) saturate(1938%) hue-rotate(233deg) brightness(98%) contrast(101%)' }}
            />
          </div>
          <h3 className={`flex-1 text-lg font-semibold ${
            darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
          }`}>
            Complete Your Subscription
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className={`p-1 rounded-lg ${
              darkMode
                ? 'text-zenible-dark-text-secondary hover:bg-zenible-dark-bg'
                : 'text-zinc-500 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            <img
              src={closeIcon}
              alt="Close"
              className="w-[18px] h-[18px]"
              style={{ filter: darkMode ? 'brightness(0) saturate(100%) invert(48%) sepia(8%) saturate(309%) hue-rotate(201deg) brightness(94%) contrast(86%)' : 'none' }}
            />
          </button>
        </div>

        {/* Content */}
        <Elements stripe={stripePromise}>
          <CheckoutForm
            planName={planName}
            price={price}
            billingCycle={billingCycle}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={onClose}
            loading={loading}
          />
        </Elements>
      </div>
    </div>
  );
}