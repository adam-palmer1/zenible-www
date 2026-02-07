import React from 'react';
import { CheckCircle, CreditCard, Loader2, RefreshCw, AlertTriangle, Clock, Download, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currency';
import { StripeLogo, PayPalLogo } from './PaymentLogos';
import StripeCardSetupSection from './StripeCardSetupSection';
import StripePaymentSection from './StripePaymentSection';
import PayPalPaymentSection from './PayPalPaymentSection';
import SavedCardPaymentInline from './SavedCardPaymentInline';
import SavedCardPaymentSection from './SavedCardPaymentSection';

export interface InvoiceSidebarProps {
  invoice: any;
  invoiceCode: string;
  amountDue: number;
  isPaid: boolean;
  isCancelled: boolean;
  canPay: boolean;
  canPayStripe: boolean;
  canPayPayPal: boolean;
  isRecurring: boolean;
  canSetupAutomaticPayments: boolean;
  hasCardOnFile: boolean;
  paymentMethod: string | null;
  setPaymentMethod: (method: string | null) => void;
  paymentSuccess: boolean;
  cardSetupSuccess: boolean;
  setCardSetupSuccess: (value: boolean) => void;
  savedCards: any[];
  loadingSavedCards: boolean;
  deletingCard: string | null;
  handleDeleteCard: (paymentMethodId: string) => void;
  handlePaymentSuccess: () => void;
  loadInvoice: () => void;
  downloadingPdf: boolean;
  handleDownloadPdf: () => void;
}

const InvoiceSidebar: React.FC<InvoiceSidebarProps> = ({
  invoice,
  invoiceCode,
  amountDue,
  isPaid,
  isCancelled,
  canPay,
  canPayStripe,
  canPayPayPal,
  isRecurring,
  canSetupAutomaticPayments,
  hasCardOnFile,
  paymentMethod,
  setPaymentMethod,
  paymentSuccess,
  cardSetupSuccess,
  setCardSetupSuccess,
  savedCards,
  loadingSavedCards,
  deletingCard,
  handleDeleteCard,
  handlePaymentSuccess,
  loadInvoice,
  downloadingPdf,
  handleDownloadPdf,
}) => {
  return (
    <div className="lg:w-[340px] lg:flex-shrink-0 flex flex-col gap-4 h-fit lg:sticky lg:top-4">
      {/* Download PDF Section */}
      <div className="bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6">
        <p className="text-[16px] font-bold leading-[24px] text-[#09090b] mb-4">
          Download PDF
        </p>
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-white bg-[#8e51ff] hover:bg-[#7a44db] rounded-lg transition-colors disabled:opacity-50"
        >
          {downloadingPdf ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Download Invoice PDF
            </>
          )}
        </button>
      </div>

      {/* Payment Section */}
      {canPay && !paymentSuccess && !cardSetupSuccess && (
      <div className="bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6 flex flex-col gap-6">
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
                      {savedCards[0].brand?.charAt(0).toUpperCase() + savedCards[0].brand?.slice(1) || 'Card'} &bull;&bull;&bull;&bull; {savedCards[0].last4}
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
                          ? `${savedCards[0].brand?.charAt(0).toUpperCase() + savedCards[0].brand?.slice(1) || 'Card'} \u2022\u2022\u2022\u2022 ${savedCards[0].last4}`
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

        {/* Stripe Card Setup Form - For automatic payments */}
        {paymentMethod === 'setup_card' && canSetupAutomaticPayments && (
          <StripeCardSetupSection
            shareCode={invoiceCode as string}
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
            shareCode={invoiceCode as string}
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
            shareCode={invoiceCode as string}
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
            shareCode={invoiceCode as string}
            amount={amountDue}
            currency={invoice.currency_code}
            onBack={() => setPaymentMethod(null)}
          />
        )}
      </div>
    )}

    {/* Card Setup Success */}
    {cardSetupSuccess && !paymentSuccess && (
      <SavedCardPaymentSection
        shareCode={invoiceCode as string}
        amountDue={amountDue}
        currency={invoice.currency_code}
        onSuccess={handlePaymentSuccess}
      />
    )}

    {/* No payment methods available */}
    {!canPay && !isPaid && !isCancelled && amountDue > 0 && !cardSetupSuccess && (
      <div className="bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6">
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
  );
};

export default InvoiceSidebar;
