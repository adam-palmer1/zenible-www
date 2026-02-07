import React from 'react';
import { Repeat, AlertTriangle, Clock } from 'lucide-react';
import RecurringInvoiceSettings from '../RecurringInvoiceSettings';
import RecurringTemplateCard from '../RecurringTemplateCard';
import type { InvoiceDetailData } from './InvoiceDetailTypes';
import { formatDate } from './InvoiceDetailTypes';

interface InvoiceDetailAlertsProps {
  invoice: InvoiceDetailData;
  onLoadInvoice: () => void;
  onNavigateToParent: () => void;
}

const InvoiceDetailAlerts: React.FC<InvoiceDetailAlertsProps> = ({
  invoice,
  onLoadInvoice,
  onNavigateToParent,
}) => {
  return (
    <>
      {/* Auto-billing Failed Warning */}
      {invoice.auto_billing_failed && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
                Automatic Payment Failed
              </h4>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {invoice.auto_billing_failure_reason || 'All automatic payment retry attempts have been exhausted.'}
              </p>
              {invoice.auto_billing_attempts > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  {invoice.auto_billing_attempts} attempt{invoice.auto_billing_attempts !== 1 ? 's' : ''} made
                  {invoice.last_auto_billing_attempt_at && (
                    <span> - Last attempt: {formatDate(invoice.last_auto_billing_attempt_at)}</span>
                  )}
                </p>
              )}
              <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                Customer action required to update payment method.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-billing Retry Scheduled Warning */}
      {!invoice.auto_billing_failed && invoice.next_auto_billing_retry_at && (
        <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                Payment Retry Scheduled
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                {invoice.auto_billing_failure_reason && (
                  <span className="block mb-1">Previous attempt: {invoice.auto_billing_failure_reason}</span>
                )}
                Next automatic payment retry: <strong>{formatDate(invoice.next_auto_billing_retry_at)}</strong>
              </p>
              {invoice.auto_billing_attempts > 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  Attempt {invoice.auto_billing_attempts} of 3
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recurring Template Management - Only show for parent templates (no parent_invoice_id) */}
      {(invoice.pricing_type === 'recurring' || invoice.is_recurring) && !invoice.parent_invoice_id && (
        <RecurringTemplateCard invoice={invoice} onUpdate={onLoadInvoice} />
      )}

      {/* Auto-Generated Invoice Badge - Show for child invoices with parent_invoice_id */}
      {invoice.parent_invoice_id && (
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Auto-Generated Invoice
                {invoice.recurrence_sequence_number && ` #${invoice.recurrence_sequence_number}`}
              </span>
            </div>
            <button
              onClick={onNavigateToParent}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              View Template
            </button>
          </div>
        </div>
      )}

      {/* Preserved: Recurring Settings */}
      {invoice.is_recurring && (
        <RecurringInvoiceSettings
          isRecurring={invoice.is_recurring ?? false}
          recurringType={invoice.recurring_type ?? 'monthly'}
          customEvery={invoice.custom_every ?? 1}
          customPeriod={invoice.custom_period ?? 'months'}
          recurringEndDate={invoice.recurring_end_date ?? null}
          recurringOccurrences={invoice.recurring_occurrences ?? null}
          startDate={invoice.issue_date || invoice.invoice_date || ''}
          onChange={() => {}}
          readOnly={true}
        />
      )}
    </>
  );
};

export default InvoiceDetailAlerts;
