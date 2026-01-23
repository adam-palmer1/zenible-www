import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, XCircle, ChevronDown, Check, Calendar } from 'lucide-react';
import { RECURRING_TYPE, RECURRING_TYPE_LABELS } from '../../../constants/finance';
import { getRecurringFrequencyLabel, calculateNextBillingDate } from '../../../utils/recurringBilling';

const RECURRING_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
};

const FREQUENCY_OPTIONS = [
  { value: RECURRING_TYPE.WEEKLY, label: 'Weekly', description: 'Every week' },
  { value: RECURRING_TYPE.MONTHLY, label: 'Monthly', description: 'Every month' },
  { value: RECURRING_TYPE.QUARTERLY, label: 'Quarterly', description: 'Every 3 months' },
  { value: RECURRING_TYPE.YEARLY, label: 'Yearly', description: 'Every year' },
  { value: RECURRING_TYPE.CUSTOM, label: 'Custom', description: 'Set your own schedule' },
];

const RecurringInvoiceSettings = ({
  isRecurring,
  recurringType,
  recurringEvery,
  recurringPeriod,
  recurringEndDate,
  recurringOccurrences,
  recurringStatus = 'active',
  startDate,
  onChange,
  readOnly = false,
  isEditing = false, // true when editing existing invoice
}) => {
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const frequencyButtonRef = useRef(null);
  const frequencyDropdownRef = useRef(null);

  const handleChange = (field, value) => {
    onChange({ [field]: value });
  };

  const nextBillingDate = isRecurring && startDate
    ? calculateNextBillingDate(startDate, recurringType, recurringEvery, recurringPeriod)
    : null;

  const selectedFrequency = FREQUENCY_OPTIONS.find(f => f.value === recurringType) || FREQUENCY_OPTIONS[1];

  // Close dropdown on click outside
  useEffect(() => {
    if (!showFrequencyDropdown) return;

    const handleClickOutside = (event) => {
      if (
        frequencyDropdownRef.current &&
        !frequencyDropdownRef.current.contains(event.target) &&
        frequencyButtonRef.current &&
        !frequencyButtonRef.current.contains(event.target)
      ) {
        setShowFrequencyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFrequencyDropdown]);

  // Close on escape
  useEffect(() => {
    if (!showFrequencyDropdown) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowFrequencyDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFrequencyDropdown]);

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
              <div className="relative">
                <button
                  ref={frequencyButtonRef}
                  type="button"
                  onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                  className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedFrequency.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedFrequency.description}
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showFrequencyDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Frequency Dropdown */}
                {showFrequencyDropdown && (
                  <div
                    ref={frequencyDropdownRef}
                    className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="py-1">
                      {FREQUENCY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            handleChange('recurringType', option.value);
                            setShowFrequencyDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            recurringType === option.value ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-sm font-medium ${
                                recurringType === option.value
                                  ? 'text-purple-700 dark:text-purple-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {option.label}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {option.description}
                              </div>
                            </div>
                            {recurringType === option.value && (
                              <Check className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
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

          {/* Recurring Status - only show when editing existing recurring invoice */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Template Status
              </label>
              {readOnly ? (
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  recurringStatus === RECURRING_STATUS.ACTIVE
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : recurringStatus === RECURRING_STATUS.PAUSED
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {recurringStatus === RECURRING_STATUS.ACTIVE && <Play className="h-3.5 w-3.5 mr-1.5" />}
                  {recurringStatus === RECURRING_STATUS.PAUSED && <Pause className="h-3.5 w-3.5 mr-1.5" />}
                  {recurringStatus === RECURRING_STATUS.CANCELLED && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                  {recurringStatus.charAt(0).toUpperCase() + recurringStatus.slice(1)}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('recurringStatus', RECURRING_STATUS.ACTIVE)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recurringStatus === RECURRING_STATUS.ACTIVE
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-green-900/30 dark:hover:text-green-400'
                    }`}
                  >
                    <Play className="h-4 w-4 mr-1.5" />
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('recurringStatus', RECURRING_STATUS.PAUSED)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recurringStatus === RECURRING_STATUS.PAUSED
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400'
                    }`}
                  >
                    <Pause className="h-4 w-4 mr-1.5" />
                    Paused
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('recurringStatus', RECURRING_STATUS.CANCELLED)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recurringStatus === RECURRING_STATUS.CANCELLED
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Cancelled
                  </button>
                </div>
              )}
              <p className="text-xs design-text-secondary mt-2">
                {recurringStatus === RECURRING_STATUS.ACTIVE && 'Invoices will be generated automatically on schedule'}
                {recurringStatus === RECURRING_STATUS.PAUSED && 'Generation is paused but can be resumed'}
                {recurringStatus === RECURRING_STATUS.CANCELLED && 'Template is permanently stopped'}
              </p>
            </div>
          )}

          {/* Next Billing Preview */}
          {nextBillingDate && recurringStatus === RECURRING_STATUS.ACTIVE && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Next billing date</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {nextBillingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Warning */}
          {nextBillingDate && recurringStatus === RECURRING_STATUS.PAUSED && (
            <div className="design-bg-primary rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Paused:</strong> No invoices will be generated until you set the status to Active.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringInvoiceSettings;
