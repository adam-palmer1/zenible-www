import React from 'react';
import { calculateNextBillingDate } from '../../../utils/recurringBilling';

/**
 * RecurringExpenseSettings Component
 * Configures recurring expense settings
 *
 * Key Difference from Invoices:
 * - Expenses use recurring_number only (-1 for infinite, X for count)
 * - Invoices use recurringEndDate OR recurringOccurrences
 */
const RecurringExpenseSettings = ({
  isRecurring,
  recurringType,
  recurringEvery,
  recurringPeriod,
  recurringNumber,
  recurringStatus,
  startDate,
  onChange,
  readOnly = false,
  isEditMode = false,
}) => {
  const handleChange = (field, value) => {
    onChange({ [field]: value });
  };

  // Calculate next expense date for preview
  const nextExpenseDate = isRecurring && startDate
    ? calculateNextBillingDate(startDate, recurringType, recurringEvery, recurringPeriod)
    : null;

  return (
    <div className="space-y-4 design-bg-secondary rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold design-text-primary">Recurring Expense</h3>
        {!readOnly && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => handleChange('isRecurring', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 dark:peer-focus:ring-purple-500/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        )}
      </div>

      {isRecurring && (
        <div className="space-y-4 pt-4 border-t design-border">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium design-text-primary mb-2">
              Frequency
            </label>
            {readOnly ? (
              <div className="design-text-secondary">
                {recurringType === 'custom'
                  ? `Every ${recurringEvery} ${recurringPeriod}`
                  : recurringType.charAt(0).toUpperCase() + recurringType.slice(1)}
              </div>
            ) : (
              <select
                value={recurringType}
                onChange={(e) => handleChange('recurringType', e.target.value)}
                className="w-full px-3 py-2 design-input rounded-md"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            )}
          </div>

          {/* Custom Frequency */}
          {recurringType === 'custom' && !readOnly && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Every
                </label>
                <input
                  type="number"
                  value={recurringEvery}
                  onChange={(e) => handleChange('recurringEvery', parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-3 py-2 design-input rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Period
                </label>
                <select
                  value={recurringPeriod}
                  onChange={(e) => handleChange('recurringPeriod', e.target.value)}
                  className="w-full px-3 py-2 design-input rounded-md"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          )}

          {/* Recurrence Limit (Expense-specific: recurring_number) */}
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
                    onChange={(e) => handleChange('recurringNumber', parseInt(e.target.value) || 1)}
                    onFocus={() => {
                      if (recurringNumber === -1) {
                        handleChange('recurringNumber', 12);
                      }
                    }}
                    min="1"
                    placeholder="12"
                    className="w-24 px-3 py-1.5 design-input rounded-md"
                  />
                  <span className="design-text-primary">occurrences</span>
                </label>
              </div>
            )}
          </div>

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
                <select
                  value={recurringStatus}
                  onChange={(e) => handleChange('recurringStatus', e.target.value)}
                  className="w-full px-3 py-2 design-input rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
              <p className="text-xs design-text-secondary mt-1">
                {recurringStatus === 'paused' && 'Automatic generation is paused. You can still generate manually.'}
                {recurringStatus === 'cancelled' && 'Recurring generation is permanently stopped.'}
                {recurringStatus === 'active' && 'Expenses will be generated automatically based on the schedule.'}
              </p>
            </div>
          )}

          {/* Next Expense Preview */}
          {nextExpenseDate && (
            <div className="design-bg-primary rounded-lg p-4 border-l-4 border-purple-600">
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
      )}
    </div>
  );
};

export default RecurringExpenseSettings;
