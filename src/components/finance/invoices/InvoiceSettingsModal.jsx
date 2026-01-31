import React from 'react';
import { X, Settings } from 'lucide-react';
import RecurringInvoiceSettings from './RecurringInvoiceSettings';

const InvoiceSettingsModal = ({
  isOpen,
  onClose,
  isRecurring,
  recurringType,
  customEvery,
  customPeriod,
  recurringEndDate,
  recurringOccurrences,
  recurringStatus = 'active',
  startDate,
  allowStripePayments,
  allowPaypalPayments,
  allowPartialPayments,
  automaticPaymentEnabled,
  automaticEmail = true,
  attachPdfToEmail = true,
  sendPaymentReceipt = true,
  receivePaymentNotifications = true,
  invoiceStatus = 'draft',
  onChange,
  isEditing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Settings</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {/* Recurring Invoice Settings */}
              <RecurringInvoiceSettings
                isRecurring={isRecurring}
                recurringType={recurringType}
                customEvery={customEvery}
                customPeriod={customPeriod}
                recurringEndDate={recurringEndDate}
                recurringOccurrences={recurringOccurrences}
                recurringStatus={recurringStatus}
                automaticEmail={automaticEmail}
                attachPdfToEmail={attachPdfToEmail}
                startDate={startDate}
                onChange={onChange}
                isEditing={isEditing}
              />

              {/* Payment Options */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Payment Options</h4>
                <div className="space-y-3">
                  {/* Stripe Payments */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowStripePayments}
                      onChange={(e) => onChange({ allowStripePayments: e.target.checked })}
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
                      onChange={(e) => onChange({ allowPaypalPayments: e.target.checked })}
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
                      onChange={(e) => onChange({ allowPartialPayments: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Allow Partial Payments</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Client can pay invoice in multiple installments</p>
                    </div>
                  </label>

                  {/* Automatic Payment */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={automaticPaymentEnabled}
                      onChange={(e) => onChange({ automaticPaymentEnabled: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Automatic Payment</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Allow client to save card for automatic payment</p>
                    </div>
                  </label>

                  {/* Automatic Email - only show when not recurring (recurring has its own email settings) */}
                  {!isRecurring && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automaticEmail}
                        onChange={(e) => onChange({ automaticEmail: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Automatic Email Notifications</span>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Send automatic email updates to client</p>
                      </div>
                    </label>
                  )}
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
                      onChange={(e) => onChange({ sendPaymentReceipt: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Send Payment Receipt</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Send receipt to client when payment is received</p>
                    </div>
                  </label>

                  {/* Receive Payment Notifications */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receivePaymentNotifications}
                      onChange={(e) => onChange({ receivePaymentNotifications: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Receive Payment Notifications</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Get notified when payments are received</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSettingsModal;
