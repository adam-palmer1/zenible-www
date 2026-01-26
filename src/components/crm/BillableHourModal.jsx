import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/modal/Modal';
import { formatCurrency } from '../../utils/currencyUtils';
import { useNotification } from '../../contexts/NotificationContext';
import { useCompanyCurrencies } from '../../hooks/crm';

/**
 * Modal for adding/editing a billable hour entry
 */
const BillableHourModal = ({
  isOpen,
  onClose,
  projectId,
  entry = null, // If provided, editing; otherwise creating
  defaultRate,
  defaultCurrency,
  onSuccess,
}) => {
  const isEditing = !!entry;
  const isInvoiced = entry?.invoice_id;

  const [formData, setFormData] = useState({
    hours: '',
    description: '',
    notes: '',
    start_time: '',
    is_billable: true,
    hourly_rate: '',
    currency_id: '',
  });
  const [loading, setLoading] = useState(false);

  const { showError } = useNotification();
  const { companyCurrencies } = useCompanyCurrencies();

  // Reset form when modal opens/closes or entry changes
  useEffect(() => {
    if (isOpen) {
      if (entry) {
        setFormData({
          hours: entry.hours || '',
          description: entry.description || '',
          notes: entry.notes || '',
          start_time: entry.start_time ? formatDateTimeLocal(entry.start_time) : '',
          end_time: entry.end_time ? formatDateTimeLocal(entry.end_time) : '',
          is_billable: entry.is_billable ?? true,
          hourly_rate: entry.hourly_rate || '',
          currency_id: entry.currency_id || '',
        });
      } else {
        setFormData({
          hours: '',
          description: '',
          notes: '',
          start_time: '',
          end_time: '',
          is_billable: true,
          hourly_rate: '',
          currency_id: '',
        });
      }
    }
  }, [isOpen, entry]);

  // Helper to format ISO datetime to datetime-local input format
  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate preview amount
  const getPreviewAmount = () => {
    const hours = parseFloat(formData.hours) || 0;
    const rate = parseFloat(formData.hourly_rate) || parseFloat(defaultRate) || 0;
    return hours * rate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hours = parseFloat(formData.hours);
    if (!hours || hours <= 0) {
      showError('Hours must be greater than 0');
      return;
    }

    try {
      setLoading(true);

      // Build payload - only include non-empty values
      const payload = {
        hours,
        is_billable: formData.is_billable,
      };

      if (formData.description?.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.notes?.trim()) {
        payload.notes = formData.notes.trim();
      }
      if (formData.start_time) {
        payload.start_time = new Date(formData.start_time).toISOString();
      }
      if (formData.end_time) {
        payload.end_time = new Date(formData.end_time).toISOString();
      }
      if (formData.hourly_rate) {
        payload.hourly_rate = parseFloat(formData.hourly_rate);
      }
      if (formData.currency_id) {
        payload.currency_id = formData.currency_id;
      }

      await onSuccess(payload);
      onClose();
    } catch (error) {
      showError(error.message || 'Failed to save billable hour entry');
    } finally {
      setLoading(false);
    }
  };

  const previewAmount = getPreviewAmount();
  const effectiveRate = formData.hourly_rate || defaultRate;
  const currencyCode = defaultCurrency || 'USD';

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title={isEditing ? 'Edit Billable Hours' : 'Log Billable Hours'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoiced Warning */}
        {isInvoiced && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  This entry is linked to an invoice
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Hours, rate, description, and billable status cannot be changed. Unlink from invoice first to edit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hours *
          </label>
          <input
            type="number"
            step="0.25"
            min="0.25"
            value={formData.hours}
            onChange={(e) => handleInputChange('hours', e.target.value)}
            placeholder="0.00"
            required
            disabled={isInvoiced}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of work..."
            maxLength={500}
            disabled={isInvoiced}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
          />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Time
            </label>
            <input
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Billable Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_billable"
            checked={formData.is_billable}
            onChange={(e) => handleInputChange('is_billable', e.target.checked)}
            disabled={isInvoiced}
            className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary disabled:opacity-50"
          />
          <label htmlFor="is_billable" className="text-sm text-gray-700 dark:text-gray-300">
            Billable
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            Uncheck for internal/non-billable time
          </span>
        </div>

        {/* Rate Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hourly Rate Override
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.hourly_rate}
              onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
              placeholder={defaultRate ? `${defaultRate}` : '0.00'}
              disabled={isInvoiced}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
            />
            <select
              value={formData.currency_id}
              onChange={(e) => handleInputChange('currency_id', e.target.value)}
              disabled={isInvoiced}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
            >
              <option value="">Use default ({currencyCode})</option>
              {companyCurrencies.map(c => (
                <option key={c.currency_id} value={c.currency_id}>
                  {c.currency?.code || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
          {effectiveRate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.hourly_rate ? 'Custom rate' : `Using project default: ${formatCurrency(effectiveRate, currencyCode)}/hr`}
            </p>
          )}
        </div>

        {/* Preview Amount */}
        {formData.hours && effectiveRate && formData.is_billable && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700 dark:text-blue-300">Estimated Amount</span>
              <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(previewAmount, currencyCode)}
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {formData.hours}h × {formatCurrency(effectiveRate, currencyCode)}/hr
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
          />
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
            disabled={loading || !formData.hours}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Log Hours'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BillableHourModal;
