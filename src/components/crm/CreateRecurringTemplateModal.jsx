import React, { useState, useEffect } from 'react';
import { InformationCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/modal/Modal';
import { formatCurrency } from '../../utils/currencyUtils';
import { useNotification } from '../../contexts/NotificationContext';
import { useContacts } from '../../hooks/crm';

// Frequency options for recurring invoices
const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

/**
 * Modal for creating a recurring invoice template from a service
 * This will create the template and automatically link the service to it
 */
const CreateRecurringTemplateModal = ({
  isOpen,
  onClose,
  service,
  contactId,
  onSuccess,
}) => {
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [startDate, setStartDate] = useState('');
  const [frequency, setFrequency] = useState('');
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { createRecurringTemplateFromService } = useContacts({}, 0, { skipInitialFetch: true });

  const currencyCode = service?.currency?.code || 'USD';
  const servicePrice = parseFloat(service?.price) || 0;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && service) {
      setInvoicePrefix('');
      setStartDate('');
      // Default frequency from service time_period
      const mappedFrequency = mapTimePeriodToFrequency(service.time_period);
      setFrequency(mappedFrequency || 'monthly');
    }
  }, [isOpen, service]);

  // Map service time_period to invoice frequency
  const mapTimePeriodToFrequency = (timePeriod) => {
    if (!timePeriod) return null;
    const lower = timePeriod.toLowerCase();
    if (lower.includes('week')) return 'weekly';
    if (lower.includes('bi') && lower.includes('week')) return 'biweekly';
    if (lower.includes('month')) return 'monthly';
    if (lower.includes('quarter')) return 'quarterly';
    if (lower.includes('year') || lower.includes('annual')) return 'yearly';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const data = {};

      if (invoicePrefix) {
        data.invoice_prefix = invoicePrefix;
      }
      if (startDate) {
        data.start_date = startDate;
      }
      if (frequency) {
        data.recurring_frequency = frequency;
      }

      const result = await createRecurringTemplateFromService(contactId, service.id, data);
      showSuccess('Recurring template created and service linked');
      onSuccess?.(result);
      onClose();
    } catch (error) {
      showError(error.message || 'Failed to create recurring template');
    } finally {
      setLoading(false);
    }
  };

  if (!service) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Create Recurring Invoice Template"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Template will be created and service will be linked
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                A recurring invoice template will be created with the service details. The service will be automatically linked to this template and become locked.
              </p>
            </div>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Service Details (Pre-filled)
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Service Name</span>
              <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Amount</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(servicePrice, currencyCode)}
              </span>
            </div>
            {service.time_period && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Billing Period</span>
                <span className="font-medium text-gray-900 dark:text-white">{service.time_period}</span>
              </div>
            )}
          </div>
        </div>

        {/* Template Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Template Settings (Optional)
          </h4>

          {/* Invoice Number Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Invoice Number Prefix
            </label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="e.g., REC, SUB, AUTO..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to use default prefix
            </p>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Billing Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Invoice Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to use today's date
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRecurringTemplateModal;
