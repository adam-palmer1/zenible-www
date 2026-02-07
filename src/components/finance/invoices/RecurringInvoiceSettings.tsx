import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, XCircle, ChevronDown, Check, Calendar, Mail, Paperclip } from 'lucide-react';
import { RECURRING_TYPE, RECURRING_TYPE_LABELS } from '../../../constants/finance';
import { getRecurringFrequencyLabel, calculateNextBillingDate } from '../../../utils/recurringBilling';

const RECURRING_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
};

const FREQUENCY_OPTIONS = [
  { value: (RECURRING_TYPE as any).WEEKLY, label: 'Weekly', description: 'Every week' },
  { value: (RECURRING_TYPE as any).MONTHLY, label: 'Monthly', description: 'Every month' },
  { value: (RECURRING_TYPE as any).QUARTERLY, label: 'Quarterly', description: 'Every 3 months' },
  { value: (RECURRING_TYPE as any).YEARLY, label: 'Yearly', description: 'Every year' },
  { value: (RECURRING_TYPE as any).CUSTOM, label: 'Custom', description: 'Set your own schedule' },
];

interface RecurringInvoiceSettingsProps {
  isRecurring: boolean;
  recurringType: string;
  customEvery: number;
  customPeriod: string;
  recurringEndDate: string | null;
  recurringOccurrences: number | null;
  recurringStatus?: string;
  automaticEmail?: boolean;
  attachPdfToEmail?: boolean;
  startDate: string;
  onChange: (changes: Record<string, any>) => void;
  readOnly?: boolean;
  isEditing?: boolean;
}

const RecurringInvoiceSettings: React.FC<RecurringInvoiceSettingsProps> = ({
  isRecurring,
  recurringType,
  customEvery,
  customPeriod,
  recurringEndDate,
  recurringOccurrences,
  recurringStatus = 'active',
  automaticEmail = true,
  attachPdfToEmail = true,
  startDate,
  onChange,
  readOnly = false,
  isEditing = false, // true when editing existing invoice
}) => {
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const frequencyButtonRef = useRef<HTMLButtonElement>(null);
  const frequencyDropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const nextBillingDate = isRecurring && startDate
    ? (calculateNextBillingDate as any)(startDate, recurringType, customEvery, customPeriod)
    : null;

  const selectedFrequency = FREQUENCY_OPTIONS.find(f => f.value === recurringType) || FREQUENCY_OPTIONS[1];

  // Close dropdown on click outside
  useEffect(() => {
    if (!showFrequencyDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        frequencyDropdownRef.current &&
        !frequencyDropdownRef.current.contains(event.target as Node) &&
        frequencyButtonRef.current &&
        !frequencyButtonRef.current.contains(event.target as Node)
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

    const handleEscape = (event: KeyboardEvent) => {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('isRecurring', e.target.checked)}
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
                {(getRecurringFrequencyLabel as any)(recurringType, customEvery, customPeriod)}
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
          {recurringType === (RECURRING_TYPE as any).CUSTOM && !readOnly && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Every
                </label>
                <input
                  type="number"
                  value={customEvery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('customEvery', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 design-input rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Period
                </label>
                <select
                  value={customPeriod}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('customPeriod', e.target.value)}
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
                    checked={!recurringEndDate && (!recurringOccurrences || recurringOccurrences <= 0)}
                    onChange={() => {
                      handleChange('recurringEndDate', null);
                      handleChange('recurringOccurrences', -1);
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
                      // Set a default date if none exists (30 days from now)
                      if (!recurringEndDate) {
                        const defaultDate = new Date();
                        defaultDate.setDate(defaultDate.getDate() + 30);
                        handleChange('recurringEndDate', defaultDate.toISOString().split('T')[0]);
                      }
                      handleChange('recurringOccurrences', null);
                    }}
                    className="text-zenible-primary focus:ring-zenible-primary"
                  />
                  <span className="design-text-primary">On</span>
                  <input
                    type="date"
                    value={recurringEndDate || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleChange('recurringEndDate', e.target.value);
                      handleChange('recurringOccurrences', null);
                    }}
                    className="px-3 py-1.5 design-input rounded-md flex-1"
                  />
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={recurringOccurrences != null && recurringOccurrences > 0}
                    onChange={() => {
                      handleChange('recurringEndDate', null);
                      // Set a default occurrence count if none exists
                      if (!recurringOccurrences || recurringOccurrences <= 0) {
                        handleChange('recurringOccurrences', 1);
                      }
                    }}
                    className="text-zenible-primary focus:ring-zenible-primary"
                  />
                  <span className="design-text-primary">After</span>
                  <input
                    type="number"
                    value={recurringOccurrences != null && recurringOccurrences > 0 ? recurringOccurrences : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const inputValue = e.target.value;
                      // Empty input - don't change yet (user is typing)
                      if (inputValue === '') return;

                      const value = parseInt(inputValue);
                      if (isNaN(value) || value <= 0) {
                        // Invalid or 0 - switch to "Never"
                        handleChange('recurringOccurrences', -1);
                      } else {
                        handleChange('recurringOccurrences', value);
                      }
                      handleChange('recurringEndDate', null);
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      // On blur, if empty, switch to "Never"
                      if (e.target.value === '' && recurringOccurrences != null && recurringOccurrences > 0) {
                        handleChange('recurringOccurrences', -1);
                      }
                    }}
                    min="1"
                    placeholder="1"
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

          {/* Automatic Email Settings */}
          <div className="space-y-3">
            <label className="block text-sm font-medium design-text-primary">
              Email Settings
            </label>
            {readOnly ? (
              <div className="space-y-2 text-sm design-text-secondary">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{automaticEmail ? 'Automatic emails enabled' : 'Automatic emails disabled'}</span>
                </div>
                {automaticEmail && (
                  <div className="flex items-center gap-2 ml-6">
                    <Paperclip className="h-4 w-4" />
                    <span>{attachPdfToEmail ? 'PDF attachment included' : 'No PDF attachment'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automaticEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('automaticEmail', e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300 rounded"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium design-text-primary">Send automatic emails</span>
                    </div>
                    <p className="text-xs design-text-secondary mt-0.5">
                      Automatically send invoice emails when new invoices are generated
                    </p>
                  </div>
                </label>

                {automaticEmail && (
                  <label className="flex items-start gap-3 cursor-pointer ml-7">
                    <input
                      type="checkbox"
                      checked={attachPdfToEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('attachPdfToEmail', e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium design-text-primary">Attach PDF to email</span>
                      </div>
                      <p className="text-xs design-text-secondary mt-0.5">
                        Include the invoice PDF as an attachment
                      </p>
                    </div>
                  </label>
                )}
              </div>
            )}
          </div>

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
