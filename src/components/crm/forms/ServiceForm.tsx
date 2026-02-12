import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormTextarea } from '../../ui/form';
import { serviceSchema, getServiceDefaultValues } from '../schemas/serviceSchema';
import CurrencySelectorModal from '../CurrencySelectorModal';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useModalPortal } from '../../../contexts/ModalPortalContext';

interface OptionDropdownProps {
  name: string;
  label?: string;
  options: { value: string; label: string; color?: string }[];
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Styled dropdown selector that matches the site's modal dropdown pattern.
 * Uses useFormContext() for React Hook Form integration.
 * Portals dropdown panel to modal's portal container to avoid clipping.
 */
const OptionDropdown: React.FC<OptionDropdownProps> = ({
  name,
  label,
  options,
  required = false,
  placeholder = 'Select...',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { watch, setValue, formState: { errors } } = useFormContext();
  const value = watch(name);
  const error = errors[name];
  const selectedOption = options.find((o) => String(o.value) === String(value));

  const modalPortal = useModalPortal();
  const portalTarget = modalPortal || document.body;

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className || ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm rounded-lg border ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-900 text-left flex items-center justify-between outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer hover:border-gray-400 dark:hover:border-gray-500`}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2">
            {selectedOption.color && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedOption.color }}
              />
            )}
            <span className="text-gray-900 dark:text-white">{selectedOption.label}</span>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
        )}
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && createPortal(
        <div
          style={{ pointerEvents: 'auto' }}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div
            className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <div className="py-1">
              {options.map((option) => {
                const isSelected = String(value) === String(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setValue(name, option.value, { shouldValidate: true });
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {option.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        portalTarget
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  );
};

interface ServiceFormProps {
  service?: any;
  defaultCurrency?: any;
  companyCurrencies?: any[];
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitError?: string | null;
}

/**
 * Service form component using React Hook Form
 */
const ServiceForm: React.FC<ServiceFormProps> = ({
  service = null,
  defaultCurrency = null,
  companyCurrencies = [],
  onSubmit,
  onCancel,
  loading = false,
  submitError = null,
}) => {
  const methods = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: getServiceDefaultValues(service, defaultCurrency),
  });

  const { watch, setValue, formState: { errors } } = methods;
  const frequencyType = watch('frequency_type');
  const timePeriod = watch('time_period');

  // Clear recurring fields when switching to one_off
  useEffect(() => {
    if (frequencyType === 'one_off') {
      setValue('time_period', '');
      setValue('custom_every', '');
      setValue('custom_period', '');
    }
  }, [frequencyType, setValue]);

  // Set defaults or clear custom fields based on time period selection
  useEffect(() => {
    if (timePeriod === 'custom') {
      // Default to "Every 1 Months" when custom is first selected
      const currentEvery = watch('custom_every');
      const currentPeriod = watch('custom_period');
      if (!currentEvery) setValue('custom_every', '1');
      if (!currentPeriod) setValue('custom_period', 'months');
    } else if (timePeriod) {
      setValue('custom_every', '');
      setValue('custom_period', '');
    }
  }, [timePeriod, setValue, watch]);

  // Currency selector state
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyButtonRef = useRef<HTMLButtonElement>(null);

  // Custom every options (1-12)
  const customEveryOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          name="price"
          label="Price"
          type="number"
          required
          registerOptions={{ min: 0 }}
        />

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
            <span className="text-red-500 ml-1">*</span>
          </label>
          <button
            ref={currencyButtonRef}
            type="button"
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.currency_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-900 text-left flex items-center justify-between outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer hover:border-gray-400 dark:hover:border-gray-500`}
          >
            {(() => {
              const selectedCurrency = companyCurrencies.find(
                (cc: any) => cc.currency.id === watch('currency_id')
              );
              if (selectedCurrency) {
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {selectedCurrency.currency.symbol}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {selectedCurrency.currency.code}
                    </span>
                    {selectedCurrency.is_default && (
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        (Default)
                      </span>
                    )}
                  </div>
                );
              }
              return (
                <span className="text-gray-500 dark:text-gray-400">
                  {companyCurrencies.length === 0
                    ? 'No currencies available'
                    : 'Select currency...'}
                </span>
              );
            })()}
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-400 transition-transform ${
                showCurrencyDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>
          <CurrencySelectorModal
            isOpen={showCurrencyDropdown}
            onClose={() => setShowCurrencyDropdown(false)}
            onSelect={(currencyId: string) => {
              setValue('currency_id', currencyId, { shouldValidate: true });
            }}
            selectedCurrencyId={watch('currency_id')}
            currencies={companyCurrencies}
            anchorRef={currencyButtonRef as React.RefObject<HTMLElement>}
          />
          {companyCurrencies.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No currencies configured. Please add currencies in CRM Settings.
            </p>
          )}
          {errors.currency_id && (
            <p className="mt-1 text-sm text-red-600">
              {errors.currency_id.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Frequency Type */}
      <OptionDropdown
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
        <OptionDropdown
          name="time_period"
          label="Time Period"
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
            { value: 'custom', label: 'Custom' },
          ]}
          placeholder="Select..."
        />
      )}

      {/* Custom Frequency (conditional) */}
      {frequencyType === 'recurring' && timePeriod === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Frequency
          </label>
          <div className="flex gap-2 items-start">
            <span className="text-sm text-gray-700 dark:text-gray-300 py-2 flex-shrink-0">
              Every
            </span>
            <OptionDropdown
              name="custom_every"
              options={customEveryOptions}
              placeholder="—"
              className="w-20 flex-shrink-0"
            />
            <OptionDropdown
              name="custom_period"
              options={[
                { value: 'days', label: 'Days' },
                { value: 'weeks', label: 'Weeks' },
                { value: 'months', label: 'Months' },
                { value: 'years', label: 'Years' },
              ]}
              placeholder="Period"
              className="flex-1"
            />
          </div>
          {errors.custom_every && (
            <p className="mt-1 text-sm text-red-600">
              {errors.custom_every.message as string}
            </p>
          )}
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <div />
        )}
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
