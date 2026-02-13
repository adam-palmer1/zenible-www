import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import invoicesAPI from '../../../services/api/finance/invoices';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface AutomaticPaymentConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onConsent: (result: any) => void;
  isPublic?: boolean;
  publicToken?: string | null;
}

/**
 * Automatic Payment Consent Modal
 * Get customer consent for automatic payments
 */
const AutomaticPaymentConsentModal: React.FC<AutomaticPaymentConsentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onConsent,
  isPublic: _isPublic = false,
  publicToken = null,
}) => {
  useEscapeKey(onClose, isOpen);

  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accepted) {
      setError('Please accept the terms to enable automatic payments');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Call consent API
      const result = await invoicesAPI.updatePaymentConsent({
        publicToken: publicToken || '',
        automaticPaymentEnabled: true,
        consentAccepted: true,
      });

      onConsent(result);
      onClose();
    } catch (err: any) {
      console.error('[AutomaticPaymentConsentModal] Error:', err);
      setError(err.message || 'Failed to enable automatic payments. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-zenible-dark-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-design-border">
          <h2 className="text-xl font-semibold text-design-text-primary">
            Enable Automatic Payments
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-design-text-muted hover:text-design-text-primary rounded transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Invoice Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="font-medium text-design-text-primary mb-2">Invoice Details</h3>
            <div className="space-y-1 text-sm text-design-text-muted">
              <p>
                <span className="font-medium">Invoice:</span> {invoice?.invoice_number}
              </p>
              <p>
                <span className="font-medium">Amount:</span> {invoice?.currency} {typeof invoice?.total === 'number' ? invoice.total.toFixed(2) : parseFloat(invoice?.total || 0).toFixed(2)}
              </p>
              {invoice?.recurring_type && (
                <p>
                  <span className="font-medium">Frequency:</span> {invoice.recurring_type.charAt(0).toUpperCase() + invoice.recurring_type.slice(1)}
                </p>
              )}
              {invoice?.recurring_number && invoice.recurring_number !== -1 && (
                <p>
                  <span className="font-medium">Occurrences:</span> {invoice.recurring_number}
                </p>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-3">
            <h3 className="font-medium text-design-text-primary">Terms & Conditions</h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-design-text-secondary space-y-2">
              <p>By enabling automatic payments, you authorize us to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Charge your saved payment method automatically when invoices are due</li>
                <li>Send you an email notification before each payment is processed</li>
                <li>Save your card details securely for future payments</li>
              </ul>
              <p className="mt-3">You can cancel automatic payments at any time.</p>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={accepted}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAccepted(e.target.checked);
                setError(null);
              }}
              className="mt-1 h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300 rounded"
            />
            <label htmlFor="consent" className="text-sm text-design-text-secondary cursor-pointer">
              I have read and accept the terms and conditions for automatic payments. I authorize automatic charges to my payment method for this invoice.
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-design-text-primary bg-white dark:bg-zenible-dark-card border border-design-border rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !accepted}
              className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enabling...' : 'Enable Automatic Payments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AutomaticPaymentConsentModal;
