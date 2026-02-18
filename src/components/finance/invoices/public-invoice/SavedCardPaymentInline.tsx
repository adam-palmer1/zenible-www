import React, { useState } from 'react';
import { CheckCircle, CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currency';
import invoicesAPI from '../../../../services/api/finance/invoices';

const invoicesAPITyped = invoicesAPI;

export interface SavedCardPaymentInlineProps {
  shareCode: string;
  amountDue: number;
  currency: string;
  savedCard: any;
  onSuccess: () => void;
  onBack: () => void;
}

/**
 * Saved Card Payment Inline - For payment method selection flow
 */
const SavedCardPaymentInline: React.FC<SavedCardPaymentInlineProps> = ({ shareCode, amountDue, currency, savedCard, onSuccess, onBack }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayWithSavedCard = async () => {
    setProcessing(true);
    setError(null);

    try {
      const result = await invoicesAPITyped.payWithSavedCard(shareCode, { amount: amountDue });

      if (result.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment was not successful. Please try again.');
      }
    } catch (err: any) {
      console.error('[SavedCardPayment] Error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Format card brand for display
  const formatBrand = (brand: string) => {
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
                {formatBrand(savedCard.brand)} &bull;&bull;&bull;&bull; {savedCard.last4}
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
          ? `Payment will be charged to ${formatBrand(savedCard.brand)} \u2022\u2022\u2022\u2022 ${savedCard.last4}`
          : 'Payment will be charged to your saved card'}
      </p>
    </div>
  );
};

export default SavedCardPaymentInline;
