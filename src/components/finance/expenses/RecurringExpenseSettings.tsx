import React, { useMemo } from 'react';
import { calculateNextBillingDate } from '../../../utils/recurringBilling';
import Combobox from '../../ui/combobox/Combobox';

interface RecurringExpenseSettingsProps {
  isRecurring: boolean;
  recurringType: string;
  customEvery: number;
  customPeriod: string;
  recurringNumber: number;
  recurringStatus: string;
  startDate: string;
  onChange: (changes: Record<string, any>) => void;
  readOnly?: boolean;
  isEditMode?: boolean;
  parentExpenseNumber?: string | null;
}

const RecurringExpenseSettings: React.FC<RecurringExpenseSettingsProps> = ({
  isRecurring,
  recurringType,
  customEvery,
  customPeriod,
  recurringNumber,
  recurringStatus,
  startDate,
  onChange,
  readOnly = false,
  isEditMode = false,
  parentExpenseNumber = null,
}) => {
  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  // Calculate next expense date for preview
  const nextExpenseDate = isRecurring && startDate
    ? calculateNextBillingDate(startDate, recurringType, customEvery, customPeriod)
    : null;

  // Frequency options for Combobox
  const frequencyOptions = useMemo(() => [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'custom', label: 'Custom' },
  ], []);

  // Custom period options for Combobox
  const periodOptions = useMemo(() => [
    { id: 'days', label: 'Days' },
    { id: 'weeks', label: 'Weeks' },
    { id: 'months', label: 'Months' },
    { id: 'years', label: 'Years' },
  ], []);

  // Status options for Combobox
  const statusOptions = useMemo(() => [
    { id: 'active', label: 'Active' },
    { id: 'paused', label: 'Paused' },
    { id: 'cancelled', label: 'Cancelled' },
  ], []);

  return (
    <div className="space-y-4 design-bg-secondary rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold design-text-primary">Recurring Expense</h3>
          {parentExpenseNumber && (
            <p className="text-sm design-text-secondary mt-1">
              Child Expense of: <span className="font-medium design-text-primary">{parentExpenseNumber}</span>
            </p>
          )}
        </div>
        {!readOnly && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('isRecurring', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 dark:peer-focus:ring-purple-500/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        )}
      </div>

      {isRecurring && (
        <div className="pt-4 border-t design-border">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Frequency and Next Expense Date */}
            <div className="space-y-4">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Frequency
                </label>
                {readOnly ? (
                  <div className="design-text-secondary">
                    {recurringType === 'custom'
                      ? `Every ${customEvery} ${customPeriod}`
                      : recurringType.charAt(0).toUpperCase() + recurringType.slice(1)}
                  </div>
                ) : (
                  <Combobox
                    options={frequencyOptions}
                    value={recurringType}
                    onChange={(value: any) => handleChange('recurringType', value)}
                    placeholder="Select frequency"
                    allowClear={false}
                  />
                )}
              </div>

              {/* Custom Frequency */}
              {recurringType === 'custom' && !readOnly && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium design-text-primary mb-2">
                      Every
                    </label>
                    <input
                      type="number"
                      value={customEvery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('customEvery', parseInt(e.target.value))}
                      onBlur={() => { if (isNaN(customEvery) || customEvery < 1) handleChange('customEvery', 1); }}
                      min="1"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium design-text-primary mb-2">
                      Period
                    </label>
                    <Combobox
                      options={periodOptions}
                      value={customPeriod}
                      onChange={(value: any) => handleChange('customPeriod', value)}
                      placeholder="Select period"
                      allowClear={false}
                    />
                  </div>
                </div>
              )}

              {/* Recurring Status (Edit Mode Only) */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium design-text-primary mb-2">
                    Status
                  </label>
                  {readOnly ? (
                    <div className="design-text-secondary">
                      {recurringStatus.charAt(0).toUpperCase() + recurringStatus.slice(1)}
                    </div>
                  ) : (
                    <Combobox
                      options={statusOptions}
                      value={recurringStatus}
                      onChange={(value: any) => handleChange('recurringStatus', value)}
                      placeholder="Select status"
                      allowClear={false}
                    />
                  )}
                  <p className="text-xs design-text-secondary mt-1">
                    {recurringStatus === 'paused' && 'Automatic generation is paused.'}
                    {recurringStatus === 'cancelled' && 'Recurring generation is permanently stopped.'}
                    {recurringStatus === 'active' && 'Expenses will be generated automatically.'}
                  </p>
                </div>
              )}

              {/* Next Expense Preview */}
              {nextExpenseDate && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm design-text-secondary">Next expense date:</span>
                    <span className="text-sm design-text-primary font-medium">
                      {nextExpenseDate.toLocaleDateString()}
                    </span>
                  </div>
                  {recurringNumber !== -1 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs design-text-secondary">Remaining occurrences:</span>
                      <span className="text-xs design-text-primary font-medium">
                        {recurringNumber}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Recurrence Limit */}
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Recurrence Limit
              </label>
              {readOnly ? (
                <div className="design-text-secondary">
                  {recurringNumber === -1
                    ? 'Never ends (infinite)'
                    : `Ends after ${recurringNumber} occurrences`}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={recurringNumber === -1}
                      onChange={() => handleChange('recurringNumber', -1)}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="design-text-primary">Never (infinite)</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={recurringNumber !== -1}
                      onChange={() => {
                        if (recurringNumber === -1) {
                          handleChange('recurringNumber', 12);
                        }
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="design-text-primary">After</span>
                    <input
                      type="number"
                      value={recurringNumber === -1 ? 12 : recurringNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('recurringNumber', parseInt(e.target.value))}
                      onBlur={() => { if (recurringNumber !== -1 && (isNaN(recurringNumber) || recurringNumber < 1)) handleChange('recurringNumber', 1); }}
                      onFocus={() => {
                        if (recurringNumber === -1) {
                          handleChange('recurringNumber', 12);
                        }
                      }}
                      min="1"
                      placeholder="12"
                      className="w-24 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <span className="design-text-primary">occurrences</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringExpenseSettings;
