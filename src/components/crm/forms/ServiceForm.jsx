import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormSelect, FormTextarea } from '../../ui/form';
import { serviceSchema, getServiceDefaultValues } from '../schemas/serviceSchema';
import {
  SERVICE_STATUS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_HEX_COLORS,
} from '../../../constants/crm';

/**
 * Service form component using React Hook Form
 *
 * @param {Object} props
 * @param {Object} props.service - Existing service data (for edit mode)
 * @param {Object} props.defaultCurrency - Default currency object
 * @param {Array} props.companyCurrencies - Available company currencies
 * @param {Function} props.onSubmit - Form submit handler
 * @param {boolean} props.loading - Whether form is submitting
 * @param {string} props.submitError - General submit error message
 */
const ServiceForm = ({
  service = null,
  defaultCurrency = null,
  companyCurrencies = [],
  onSubmit,
  loading = false,
  submitError = null,
}) => {
  const methods = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: getServiceDefaultValues(service, defaultCurrency),
  });

  const { watch } = methods;
  const frequencyType = watch('frequency_type');

  // Map companyCurrencies to options format
  const currencyOptions = (companyCurrencies || []).map((cc) => ({
    value: cc.currency?.id || cc.id,
    label: `${cc.currency?.code || cc.code}${cc.currency?.symbol ? ` (${cc.currency.symbol})` : ''}`,
  }));

  // Status options with color indicators
  const statusOptions = Object.values(SERVICE_STATUS).map((status) => ({
    value: status,
    label: SERVICE_STATUS_LABELS[status],
    color: SERVICE_STATUS_HEX_COLORS[status],
  }));

  return (
    <Form methods={methods} onSubmit={onSubmit} className="space-y-4">
      {/* General Error */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      {/* Service Name */}
      <FormField
        name="name"
        label="Service Name"
        type="text"
        required
      />

      {/* Description */}
      <FormTextarea
        name="description"
        label="Description"
        rows={3}
      />

      {/* Price and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="price"
          label="Price"
          type="number"
          registerOptions={{ step: 0.01 }}
        />

        <div>
          <FormSelect
            name="currency_id"
            label="Currency"
            options={currencyOptions}
            placeholder={currencyOptions.length === 0 ? "No currencies available" : "Select..."}
          />
          {currencyOptions.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No currencies configured. Please add currencies in CRM Settings.
            </p>
          )}
        </div>
      </div>

      {/* Frequency Type */}
      <FormSelect
        name="frequency_type"
        label="Frequency"
        options={[
          { value: 'one_off', label: 'One-off' },
          { value: 'recurring', label: 'Recurring' },
        ]}
        required
      />

      {/* Time Period (conditional) */}
      {frequencyType === 'recurring' && (
        <FormSelect
          name="time_period"
          label="Time Period"
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
          placeholder="Select..."
        />
      )}

      {/* Status */}
      <FormSelect
        name="status"
        label="Status"
        options={statusOptions}
      />

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : service ? 'Update' : 'Create'}
        </button>
      </div>
    </Form>
  );
};

export default ServiceForm;
