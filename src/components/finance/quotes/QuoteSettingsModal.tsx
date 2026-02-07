import React from 'react';
import { X, Settings } from 'lucide-react';

interface QuoteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteStatus?: string;
  allowStripePayments?: boolean;
  allowPaypalPayments?: boolean;
  allowPartialPayments?: boolean;
  automaticPaymentEnabled?: boolean;
  attachPdfToEmail?: boolean;
  sendPaymentReceipt?: boolean;
  receivePaymentNotifications?: boolean;
  paymentInstructions?: string;
  onChange: (updates: Record<string, any>) => void;
}

const QuoteSettingsModal: React.FC<QuoteSettingsModalProps> = ({
  isOpen,
  onClose,
  quoteStatus = 'draft',
  allowStripePayments = false,
  allowPaypalPayments = false,
  allowPartialPayments = false,
  automaticPaymentEnabled = false,
  attachPdfToEmail = true,
  sendPaymentReceipt = true,
  receivePaymentNotifications = true,
  paymentInstructions = '',
  onChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quote Settings</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {/* Quote Status Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Current Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  quoteStatus === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200' :
                  quoteStatus === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  quoteStatus === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  quoteStatus === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  quoteStatus === 'expired' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                }`}>
                  {quoteStatus.charAt(0).toUpperCase() + quoteStatus.slice(1).replace('_', ' ')}
                </span>
              </div>

              {/* Payment Options */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Payment Options</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  These settings will be copied to the invoice when this quote is converted.
                </p>
                <div className="space-y-3">
                  {/* Stripe Payments */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowStripePayments}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ allowStripePayments: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Allow Stripe Payments</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Enable credit card payments via Stripe</p>
                    </div>
                  </label>

                  {/* PayPal Payments */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPaypalPayments}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ allowPaypalPayments: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Allow PayPal Payments</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Enable PayPal as a payment method</p>
                    </div>
                  </label>

                  {/* Partial Payments */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPartialPayments}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ allowPartialPayments: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Allow Partial Payments</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Client can pay in multiple installments</p>
                    </div>
                  </label>

                  {/* Automatic Payment */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={automaticPaymentEnabled}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ automaticPaymentEnabled: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Automatic Payment</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Automatically charge saved payment method when converted to invoice</p>
                    </div>
                  </label>

                  {/* Attach PDF to Email */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachPdfToEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ attachPdfToEmail: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Attach PDF to Email</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Include PDF attachment when sending quote by email</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h4>
                <div className="space-y-3">
                  {/* Send Payment Receipt */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendPaymentReceipt}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ sendPaymentReceipt: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Send Payment Receipt</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Send receipt to client when payment is received (after conversion)</p>
                    </div>
                  </label>

                  {/* Receive Payment Notifications */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receivePaymentNotifications}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ receivePaymentNotifications: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Receive Payment Notifications</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Get notified when payments are received (after conversion)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Payment Instructions</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  These instructions will appear on the quote and be copied to the invoice.
                </p>
                <textarea
                  value={paymentInstructions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ paymentInstructions: e.target.value })}
                  rows={4}
                  placeholder="e.g., Please make payment via bank transfer to Account: 12345678, Sort Code: 00-00-00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-y text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteSettingsModal;
