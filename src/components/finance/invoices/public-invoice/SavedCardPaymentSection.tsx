import React, { useState } from 'react';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currency';
import invoicesAPI from '../../../../services/api/finance/invoices';

const invoicesAPITyped = invoicesAPI;

export interface SavedCardPaymentSectionProps {
  shareCode: string;
  amountDue: number;
  currency: string;
  onSuccess: () => void;
}

/**
 * Saved Card Payment Section - Pay with previously saved card (after card setup success)
 */
const SavedCardPaymentSection: React.FC<SavedCardPaymentSectionProps> = ({ shareCode, amountDue, currency, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayWithSavedCard = async () => {
    setProcessing(true);
    setError(null);

    try {
      const result = await invoicesAPITyped.payWithSavedCard(shareCode, {});

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

  return (
    <div className="lg:w-[340px] lg:flex-shrink-0 bg-white border-2 border-green-500 rounded-[12px] p-6 h-fit">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-3 bg-green-100 rounded-full">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#09090b]">Card Saved Successfully</h3>
          <p className="text-sm text-[#71717a] mt-1">
            Your card has been saved for automatic payments.
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

export default SavedCardPaymentSection;
