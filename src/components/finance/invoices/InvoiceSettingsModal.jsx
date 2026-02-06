import React, { useMemo } from 'react';
import { X, Settings, Bell, AlertTriangle, Clock, Calendar, StopCircle } from 'lucide-react';
import RecurringInvoiceSettings from './RecurringInvoiceSettings';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';

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
  // Reminder settings
  overrideReminderSettings = false,
  invoiceRemindersEnabled = null,
  invoiceReminderFrequencyDays = null,
  maxInvoiceReminders = null,
  remindersStopped = false,
  reminderCount = 0,
  lastReminderSentAt = null,
  nextReminderDueAt = null,
  contact = null,
  onChange,
  isEditing = false,
}) => {
  // Get company settings for inheritance display
  const { companyAttributes } = useCompanyAttributes();

  // Calculate effective settings with priority cascade
  const effectiveSettings = useMemo(() => {
    const companyEnabled = companyAttributes?.invoice_reminders_enabled ?? false;
    const companyFrequency = companyAttributes?.invoice_reminder_frequency_days ?? 7;
    const companyMax = companyAttributes?.max_invoice_reminders ?? 3;

    const contactEnabled = contact?.invoice_reminders_enabled;
    const contactFrequency = contact?.invoice_reminder_frequency_days;
    const contactMax = contact?.max_invoice_reminders;

    // Determine effective values following priority cascade
    const enabled = invoiceRemindersEnabled ?? contactEnabled ?? companyEnabled;
    const frequency = invoiceReminderFrequencyDays ?? contactFrequency ?? companyFrequency;
    const max = maxInvoiceReminders ?? contactMax ?? companyMax;

    // Determine source for each setting
    const enabledSource = invoiceRemindersEnabled !== null ? 'invoice'
      : contactEnabled !== null && contactEnabled !== undefined ? 'contact'
      : companyEnabled !== undefined ? 'company' : 'default';
    const frequencySource = invoiceReminderFrequencyDays !== null ? 'invoice'
      : contactFrequency !== null && contactFrequency !== undefined ? 'contact'
      : companyFrequency !== undefined ? 'company' : 'default';
    const maxSource = maxInvoiceReminders !== null ? 'invoice'
      : contactMax !== null && contactMax !== undefined ? 'contact'
      : companyMax !== undefined ? 'company' : 'default';

    return {
      enabled,
      frequency,
      max,
      sources: { enabled: enabledSource, frequency: frequencySource, max: maxSource },
      inheritedFrom: contactEnabled !== null && contactEnabled !== undefined ? 'contact' : 'company'
    };
  }, [invoiceRemindersEnabled, invoiceReminderFrequencyDays, maxInvoiceReminders, contact, companyAttributes]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
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

              {/* Reminder Settings */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-4 w-4 text-orange-500" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Reminder Settings</h4>
                </div>

                {/* Reminders Stopped Warning */}
                {remindersStopped && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <StopCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Reminders Stopped</span>
                      <p className="text-xs text-red-600 dark:text-red-300">All automatic reminders have been stopped for this invoice.</p>
                    </div>
                  </div>
                )}

                {/* Override Toggle */}
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={overrideReminderSettings}
                    onChange={(e) => onChange({ overrideReminderSettings: e.target.checked })}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Override contact/company settings</span>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Use custom reminder settings for this invoice</p>
                  </div>
                </label>

                {overrideReminderSettings ? (
                  /* Custom Settings */
                  <div className="space-y-4 pl-7">
                    {/* Enable Reminders */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enable reminders
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="remindersEnabled"
                            checked={invoiceRemindersEnabled === true}
                            onChange={() => onChange({ invoiceRemindersEnabled: true })}
                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="remindersEnabled"
                            checked={invoiceRemindersEnabled === false}
                            onChange={() => onChange({ invoiceRemindersEnabled: false })}
                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">No</span>
                        </label>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Frequency (days between reminders)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={invoiceReminderFrequencyDays || ''}
                        onChange={(e) => onChange({ invoiceReminderFrequencyDays: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder={`${effectiveSettings.frequency} (inherited)`}
                        className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Valid range: 1-60 days</p>
                    </div>

                    {/* Max Reminders */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum reminders
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={maxInvoiceReminders !== null ? maxInvoiceReminders : ''}
                        onChange={(e) => onChange({ maxInvoiceReminders: e.target.value !== '' ? parseInt(e.target.value) : null })}
                        placeholder={`${effectiveSettings.max} (inherited)`}
                        className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Valid range: 0-5 reminders</p>
                    </div>
                  </div>
                ) : (
                  /* Inherited Settings Display */
                  <div className="pl-7 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Inherited from: <span className="font-medium capitalize">{effectiveSettings.inheritedFrom}</span>
                    </p>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <p>Enabled: <span className="font-medium">{effectiveSettings.enabled ? 'Yes' : 'No'}</span></p>
                      <p>Frequency: <span className="font-medium">{effectiveSettings.frequency} days</span></p>
                      <p>Max: <span className="font-medium">{effectiveSettings.max} reminders</span></p>
                    </div>
                  </div>
                )}

                {/* Current Status - only show if invoice has been sent */}
                {(invoiceStatus !== 'draft' && (reminderCount > 0 || lastReminderSentAt || nextReminderDueAt)) && (
                  <div className="mt-4 pl-7 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">Current status</p>
                    <div className="space-y-1 text-sm text-blue-600 dark:text-blue-300">
                      <p className="flex items-center gap-2">
                        <Bell className="h-3.5 w-3.5" />
                        Reminders sent: <span className="font-medium">{reminderCount} of {effectiveSettings.max}</span>
                      </p>
                      {lastReminderSentAt && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          Last sent: <span className="font-medium">{formatDate(lastReminderSentAt)}</span>
                        </p>
                      )}
                      {nextReminderDueAt && !remindersStopped && (
                        <p className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          Next scheduled: <span className="font-medium">{formatDate(nextReminderDueAt)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Stop All Reminders Button - only show for non-draft invoices */}
                {invoiceStatus !== 'draft' && !remindersStopped && (
                  <div className="mt-4 pl-7">
                    <button
                      type="button"
                      onClick={() => onChange({ remindersStopped: true })}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
                    >
                      <StopCircle className="h-4 w-4" />
                      Stop All Reminders
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Permanently stop all automatic reminders for this invoice
                    </p>
                  </div>
                )}

                {/* Resume Reminders Button - show when stopped */}
                {remindersStopped && (
                  <div className="mt-4 pl-7">
                    <button
                      type="button"
                      onClick={() => onChange({ remindersStopped: false })}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                      Resume Reminders
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Re-enable automatic reminders for this invoice
                    </p>
                  </div>
                )}
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
