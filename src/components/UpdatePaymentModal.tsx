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
import { useEscapeKey } from '../hooks/useEscapeKey';

interface UpdatePaymentFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: any) => void;
  onCancel: () => void;
  loading: boolean;
}

interface UpdatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentMethodId: string) => Promise<void>;
  onError: (error: any) => void;
}

// Import Figma SVG assets
import stripeLogo from '../assets/payment-modal-figma/stripe-logo-small.svg';
import safetyIconBackground from '../assets/payment-modal-figma/safety-icon-background.svg';
import safetyIcon from '../assets/payment-modal-figma/safety-icon.svg';
import closeIconPart1 from '../assets/payment-modal-figma/close-icon-part1.svg';
import closeIconPart2 from '../assets/payment-modal-figma/close-icon-part2.svg';
import visaLogo from '../assets/payment-modal-figma/visa-logo.svg';
import mastercardLogo from '../assets/payment-modal-figma/mastercard-logo.svg';
import amexLogo from '../assets/payment-modal-figma/amex-logo.svg';
import discoverLogo from '../assets/payment-modal-figma/discover-logo.svg';
import cardIcon from '../assets/payment-modal-figma/card-icon.svg';
import cardIconPart2 from '../assets/payment-modal-figma/card-icon-part2.svg';
import cardIconPart3 from '../assets/payment-modal-figma/card-icon-part3.svg';
import securityIconBackground from '../assets/payment-modal-figma/security-icon-background.svg';
import securityIcon from '../assets/payment-modal-figma/security-icon.svg';
import checkCirclePart1 from '../assets/payment-modal-figma/check-circle-part1.svg';
import checkCirclePart2 from '../assets/payment-modal-figma/check-circle-part2.svg';
import lockIcon from '../assets/payment-modal-figma/lock-icon.svg';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Card form component - Exact Figma implementation
function UpdatePaymentForm({ onSuccess, onError: _onError, onCancel, loading }: UpdatePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { darkMode: _darkMode } = usePreferences();
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
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
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
      color: '#71717a',
      fontFamily: 'Inter, sans-serif',
      '::placeholder': {
        color: '#a1a1aa',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  };

  const cardNumberStyles = {
    ...stripeElementStyles,
    base: {
      ...stripeElementStyles.base,
      '::placeholder': {
        content: '1234 1234 1234 1234',
        color: '#a1a1aa',
      },
    }
  };

  const expiryStyles = {
    ...stripeElementStyles,
    base: {
      ...stripeElementStyles.base,
      '::placeholder': {
        content: 'MM/YY',
        color: '#a1a1aa',
      },
    }
  };

  const cvcStyles = {
    ...stripeElementStyles,
    base: {
      ...stripeElementStyles.base,
      '::placeholder': {
        content: 'CVV',
        color: '#a1a1aa',
      },
    }
  };

  return (
    <div className="bg-white content-stretch flex flex-col items-start relative rounded-[12px] w-full max-w-md mx-auto">
      <div className="border border-neutral-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] inset-0 absolute pointer-events-none rounded-[12px]" />

      {/* Section Header */}
      <div className="box-border content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full">
        <div className="bg-violet-50 box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[8px] shrink-0 size-[26px]">
          <div className="overflow-clip relative shrink-0 size-[14px]">
            <div className="absolute bottom-[2.08%] left-0 right-0 top-[-2.08%]">
              <img alt="" className="block max-w-none size-full" src={safetyIconBackground} />
            </div>
            <div className="absolute inset-[8.33%_14%]">
              <div className="absolute bottom-[0.28%] left-0 right-0 top-[1.08%]">
                <img alt="" className="block max-w-none size-full" src={safetyIcon} />
              </div>
            </div>
          </div>
        </div>
        <div className="basis-0 font-['Inter'] font-semibold grow leading-[26px] min-h-px min-w-px not-italic relative shrink-0 text-[18px] text-zinc-950">
          Update Payment Method
        </div>
        <button
          onClick={onCancel}
          disabled={loading}
          className="overflow-clip relative shrink-0 size-[18px] disabled:opacity-50"
        >
          <div className="absolute inset-[21.875%]">
            <div className="absolute inset-[-5.56%]">
              <img alt="" className="block max-w-none size-full" src={closeIconPart1} />
            </div>
          </div>
          <div className="absolute inset-[21.875%]">
            <div className="absolute inset-[-5.56%]">
              <img alt="" className="block max-w-none size-full" src={closeIconPart2} />
            </div>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        {/* Payment information section */}
        <div className="box-border content-stretch flex flex-col gap-[8px] items-start px-[16px] pt-[16px] relative shrink-0 w-full mb-[24px]">
          <div className="box-border content-stretch flex gap-[10px] items-center px-[4px] py-0 relative shrink-0 w-full">
            <div className="basis-0 font-['Inter'] font-medium grow leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-zinc-950">
              Payment information
            </div>
            <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
              <div className="h-[16px] relative shrink-0 w-[23px]">
                <img alt="" className="block max-w-none size-full" src={visaLogo} />
              </div>
              <div className="h-[16px] relative shrink-0 w-[23px]">
                <div className="absolute bg-white inset-0 rounded-[2.5px]">
                  <div className="absolute border border-[#d9d9d9] border-solid inset-0 pointer-events-none rounded-[2.5px]" />
                </div>
                <div className="absolute inset-[18.7%_13.04%_19.51%_14.91%]">
                  <img alt="" className="block max-w-none size-full" src={mastercardLogo} />
                </div>
              </div>
              <div className="h-[16px] relative shrink-0 w-[23px]">
                <img alt="" className="block max-w-none size-full" src={amexLogo} />
              </div>
              <div className="h-[16px] relative shrink-0 w-[23px]">
                <div className="absolute bg-white inset-0 rounded-[2.5px]">
                  <div className="absolute border border-[#d9d9d9] border-solid inset-0 pointer-events-none rounded-[2.5px]" />
                </div>
                <div className="absolute inset-[37.5%_4.28%_6.04%_8.7%]">
                  <img alt="" className="block max-w-none size-full" src={discoverLogo} />
                </div>
              </div>
            </div>
          </div>

          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
            {/* Card Number Field */}
            <div className="bg-white relative rounded-[10px] shrink-0 w-full">
              <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[12px] relative w-full">
                <div className="overflow-clip relative shrink-0 size-[20px]">
                  <div className="absolute inset-[16.67%_8.33%]">
                    <img alt="" className="block max-w-none size-full" src={cardIcon} />
                  </div>
                  <div className="absolute bottom-[40.12%] flex items-center justify-center left-1/2 right-[26.04%] top-[59.88%]">
                    <div className="flex-none h-px rotate-[180deg] w-[4.792px]">
                      <div className="relative size-full">
                        <div className="absolute inset-[-0.63px_-13.04%]">
                          <img alt="" className="block max-w-none size-full" src={cardIconPart2} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-[2.08%] left-0 right-0 top-[-2.08%]">
                    <img alt="" className="block max-w-none size-full" src={cardIconPart3} />
                  </div>
                </div>
                <div className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
                  <CardNumberElement
                    options={{
                      style: cardNumberStyles,
                      placeholder: '1234 1234 1234 1234'
                    }}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="absolute border-[1.5px] border-neutral-200 border-solid inset-0 pointer-events-none rounded-[10px]" />
            </div>

            {/* Expiry and CVC Fields */}
            <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
              <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                <div className="bg-white relative rounded-[10px] w-full">
                  <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[12px] relative w-full">
                    <div className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
                      <CardExpiryElement
                        options={{
                          style: expiryStyles,
                          placeholder: 'MM/YY'
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="absolute border-[1.5px] border-neutral-200 border-solid inset-0 pointer-events-none rounded-[10px]" />
                </div>
              </div>
              <div className="basis-0 grow min-h-px min-w-px relative shrink-0">
                <div className="bg-white relative rounded-[10px] w-full">
                  <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[12px] relative w-full">
                    <div className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
                      <CardCvcElement
                        options={{
                          style: cvcStyles,
                          placeholder: 'CVV'
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="absolute border-[1.5px] border-neutral-200 border-solid inset-0 pointer-events-none rounded-[10px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="px-[16px] mb-[24px]">
          <div className="bg-green-100 box-border content-stretch flex gap-[8px] items-start p-[8px] relative rounded-[12px] shrink-0 w-full">
            <div className="absolute border border-[#00a63e] border-solid inset-0 pointer-events-none rounded-[12px]" />
            <div className="overflow-clip relative shrink-0 size-[24px]">
              <div className="absolute bottom-[2.08%] left-0 right-0 top-[-2.08%]">
                <img alt="" className="block max-w-none size-full" src={securityIconBackground} />
              </div>
              <div className="absolute inset-[8.33%_14%]">
                <div className="absolute bottom-[0.28%] left-0 right-0 top-[1.08%]">
                  <img alt="" className="block max-w-none size-full" src={securityIcon} />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[250px]">
              <div className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[#00a63e] text-[16px] w-full">
                Your payment is protected
              </div>
              <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-full">
                  <div className="overflow-clip relative shrink-0 size-[16px]">
                    <div className="absolute inset-[40.63%_34.38%_37.5%_34.38%]">
                      <div className="absolute inset-[-14.29%_-10%]">
                        <img alt="" className="block max-w-none size-full" src={checkCirclePart1} />
                      </div>
                    </div>
                    <div className="absolute inset-[12.5%]">
                      <div className="absolute inset-[-4.167%]">
                        <img alt="" className="block max-w-none size-full" src={checkCirclePart2} />
                      </div>
                    </div>
                  </div>
                  <div className="font-['Inter'] font-normal leading-[20px] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#00a63e] text-[12px] text-nowrap">
                    256-bit SSL encryption
                  </div>
                </div>
                <div className="content-stretch flex gap-[8px] items-center relative rounded-[8px] shrink-0 w-full">
                  <div className="overflow-clip relative shrink-0 size-[16px]">
                    <div className="absolute inset-[40.63%_34.38%_37.5%_34.38%]">
                      <div className="absolute inset-[-14.29%_-10%]">
                        <img alt="" className="block max-w-none size-full" src={checkCirclePart1} />
                      </div>
                    </div>
                    <div className="absolute inset-[12.5%]">
                      <div className="absolute inset-[-4.167%]">
                        <img alt="" className="block max-w-none size-full" src={checkCirclePart2} />
                      </div>
                    </div>
                  </div>
                  <div className="font-['Inter'] font-normal leading-[20px] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#00a63e] text-[12px] text-nowrap">
                    30-day money-back guarantee
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="px-[16px] mb-[16px]">
          <div className="font-['Inter'] font-normal leading-[20px] not-italic relative text-[12px] text-zinc-500 text-center">
            By subscribing, you agree to our{' '}
            <a href="https://www.zenible.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="font-['Inter'] font-medium not-italic text-[#8e51ff] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="https://www.zenible.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-['Inter'] font-medium not-italic text-[#8e51ff] hover:underline">Privacy Policy</a>
          </div>
        </div>

        {/* Update Button */}
        <div className="box-border content-stretch flex gap-[16px] items-start p-[16px] relative shrink-0 w-full">
          <button
            type="submit"
            disabled={!stripe || isProcessing || loading}
            className="basis-0 bg-[#8e51ff] box-border content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px overflow-clip p-[12px] relative rounded-[12px] shrink-0 disabled:opacity-50"
          >
            <div className="relative shrink-0 size-[24px]">
              <div className="absolute inset-[11.46%_18.85%_11.46%_17.71%]">
                <div className="absolute inset-[-4.05%_-4.93%]">
                  <img alt="" className="block max-w-none size-full" src={lockIcon} />
                </div>
              </div>
            </div>
            <div className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-white">
              {isProcessing || loading ? 'Processing...' : 'Update Payment Method'}
            </div>
          </button>
        </div>

        {/* Secured by Stripe */}
        <div className="box-border content-stretch flex flex-col gap-[16px] items-center justify-center p-[16px] relative shrink-0 w-full">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <div className="font-['Inter'] font-normal leading-[20px] not-italic relative shrink-0 text-[12px] text-nowrap text-zinc-500">
              Secured by{' '}
            </div>
            <div className="h-[24px] relative shrink-0 w-[35px]">
              <div className="absolute bg-white inset-0 rounded-[4px]">
                <div className="absolute border border-[#d9d9d9] border-solid inset-0 pointer-events-none rounded-[4px]" />
              </div>
              <div className="absolute inset-[27.95%_12.86%_27.95%_14.29%]">
                <img alt="" className="block max-w-none size-full" src={stripeLogo} />
              </div>
            </div>
          </div>
        </div>

        {cardError && (
          <div className="px-[16px] pb-[16px]">
            <p className="text-sm text-red-500 text-center">{cardError}</p>
          </div>
        )}
      </form>
    </div>
  );
}

// Main modal component - Exact Figma implementation
export default function UpdatePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onError
}: UpdatePaymentModalProps) {
  useEscapeKey(onClose, isOpen);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Elements stripe={stripePromise}>
        <UpdatePaymentForm
          onSuccess={handleSuccess}
          onError={handleError}
          onCancel={onClose}
          loading={loading}
        />
      </Elements>
    </div>
  );
}