import React from 'react';
import { RECURRING_TYPE } from '../../../constants/finance';
import { getRecurringFrequencyLabel, calculateNextBillingDate } from '../../../utils/recurringBilling';

const RecurringInvoiceSettings = ({
  isRecurring,
  recurringType,
  recurringEvery,
  recurringPeriod,
  recurringEndDate,
  recurringOccurrences,
  startDate,
  onChange,
  readOnly = false,
}) => {
  const handleChange = (field, value) => {
    onChange({ [field]: value });
  };

  const nextBillingDate = isRecurring && startDate
    ? calculateNextBillingDate(startDate, recurringType, recurringEvery, recurringPeriod)
    : null;

  return (
    <div className="space-y-4 design-bg-secondary rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold design-text-primary">Recurring Invoice</h3>
        {!readOnly && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => handleChange('isRecurring', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zenible-primary/20 dark:peer-focus:ring-zenible-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zenible-primary"></div>
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
                {getRecurringFrequencyLabel(recurringType, recurringEvery, recurringPeriod)}
              </div>
            ) : (
              <select
                value={recurringType}
                onChange={(e) => handleChange('recurringType', e.target.value)}
                className="w-full px-3 py-2 design-input rounded-md"
              >
                <option value={RECURRING_TYPE.WEEKLY}>Weekly</option>
                <option value={RECURRING_TYPE.MONTHLY}>Monthly</option>
                <option value={RECURRING_TYPE.QUARTERLY}>Quarterly</option>
                <option value={RECURRING_TYPE.YEARLY}>Yearly</option>
                <option value={RECURRING_TYPE.CUSTOM}>Custom</option>
              </select>
            )}
          </div>

          {/* Custom Frequency */}
          {recurringType === RECURRING_TYPE.CUSTOM && !readOnly && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Every
                </label>
                <input
                  type="number"
                  value={recurringEvery}
                  onChange={(e) => handleChange('recurringEvery', parseInt(e.target.value))}
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
                  <option value="Days">Days</option>
                  <option value="Weeks">Weeks</option>
                  <option value="Months">Months</option>
                  <option value="Years">Years</option>
                </select>
              </div>
            </div>
          )}

          {/* End Condition */}
          <div>
            <label className="block text-sm font-medium design-text-primary mb-2">
              End Condition
            </label>
            {readOnly ? (
              <div className="design-text-secondary">
                {recurringEndDate
                  ? `Ends on ${new Date(recurringEndDate).toLocaleDateString()}`
                  : recurringOccurrences
                  ? `Ends after ${recurringOccurrences} occurrences`
                  : 'Never ends'}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!recurringEndDate && !recurringOccurrences}
                    onChange={() => {
                      handleChange('recurringEndDate', null);
                      handleChange('recurringOccurrences', null);
                    }}
                    className="mr-2 text-zenible-primary focus:ring-zenible-primary"
                  />
                  <span className="design-text-primary">Never</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!!recurringEndDate}
                    onChange={() => {
                      handleChange('recurringOccurrences', null);
                    }}
                    className="text-zenible-primary focus:ring-zenible-primary"
                  />
                  <span className="design-text-primary">On</span>
                  <input
                    type="date"
                    value={recurringEndDate || ''}
                    onChange={(e) => {
                      handleChange('recurringEndDate', e.target.value);
                      handleChange('recurringOccurrences', null);
                    }}
                    className="px-3 py-1.5 design-input rounded-md flex-1"
                  />
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!!recurringOccurrences}
                    onChange={() => {
                      handleChange('recurringEndDate', null);
                    }}
                    className="text-zenible-primary focus:ring-zenible-primary"
                  />
                  <span className="design-text-primary">After</span>
                  <input
                    type="number"
                    value={recurringOccurrences || ''}
                    onChange={(e) => {
                      handleChange('recurringOccurrences', parseInt(e.target.value));
                      handleChange('recurringEndDate', null);
                    }}
                    min="1"
                    placeholder="0"
                    className="w-24 px-3 py-1.5 design-input rounded-md"
                  />
                  <span className="design-text-primary">occurrences</span>
                </label>
              </div>
            )}
          </div>

          {/* Next Billing Preview */}
          {nextBillingDate && (
            <div className="design-bg-primary rounded-lg p-4 border-l-4 border-zenible-primary">
              <div className="flex items-center justify-between">
                <span className="text-sm design-text-secondary">Next billing date:</span>
                <span className="text-sm design-text-primary font-medium">
                  {nextBillingDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringInvoiceSettings;
