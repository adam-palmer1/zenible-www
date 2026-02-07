import React, { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currency';
import invoicesAPI from '../../../../services/api/finance/invoices';
import { PayPalLogo } from './PaymentLogos';

const invoicesAPITyped = invoicesAPI;

export interface PayPalPaymentSectionProps {
  shareCode: string;
  amount: number;
  currency: string;
  onBack: () => void;
}

/**
 * PayPal Payment Section
 */
const PayPalPaymentSection: React.FC<PayPalPaymentSectionProps> = ({ shareCode, amount, currency, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayPalClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?paypal=approved`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?paypal=cancelled`;

      const orderData = await invoicesAPITyped.createPayPalOrder(shareCode, {
        amount,
        return_url: returnUrl,
        cancel_url: cancelUrl,
      });

      // Store order_id for capture on return
      sessionStorage.setItem('paypal_order_id', orderData.order_id);
      sessionStorage.setItem('paypal_share_code', shareCode);

      // Redirect to PayPal
      window.location.href = orderData.approve_url;
    } catch (err: any) {
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

export default PayPalPaymentSection;
