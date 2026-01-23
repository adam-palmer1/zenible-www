import React, { useState, useEffect } from 'react';
import { useCRMReferenceData } from '../../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../../hooks/crm/useCompanyAttributes';
import { useNotification } from '../../../../contexts/NotificationContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Advanced Tab - Advanced settings and preferences
 */
const AdvancedTab = ({ onUnsavedChanges }) => {
  const { numberFormats, loading: formatsLoading } = useCRMReferenceData();
  const {
    getNumberFormat,
    setNumberFormat,
    getTimezone,
    setTimezone,
    loading: attributesLoading,
  } = useCompanyAttributes();

  const { showSuccess, showError } = useNotification();

  const [selectedFormat, setSelectedFormat] = useState(null);
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/London');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update selected values when attributes finish loading
  useEffect(() => {
    if (!attributesLoading) {
      const numberFormat = getNumberFormat();
      const timezone = getTimezone();

      if (numberFormat) {
        setSelectedFormat(numberFormat);
      }
      if (timezone) {
        setSelectedTimezone(timezone);
      }
    }
  }, [attributesLoading, getNumberFormat, getTimezone]);

  // Common timezones
  const timezones = [
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'America/Toronto',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  const handleFormatChange = (formatId) => {
    setSelectedFormat(formatId);
    setHasChanges(true);
    onUnsavedChanges?.(true);
  };

  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone);
    setHasChanges(true);
    onUnsavedChanges?.(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save number format
      if (selectedFormat) {
        await setNumberFormat(selectedFormat);
      }

      // Save timezone
      if (selectedTimezone) {
        await setTimezone(selectedTimezone);
      }

      setHasChanges(false);
      onUnsavedChanges?.(false);
      showSuccess('Advanced settings saved successfully');
    } catch (error) {
      showError('Failed to save advanced settings');
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  if (formatsLoading || attributesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading advanced settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Number Format */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Number Format
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose how numbers are displayed throughout the application (decimals and thousands separators)
        </p>

        <div className="space-y-2">
          {numberFormats.map((format) => (
            <label
              key={format.id}
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="number_format"
                value={format.id}
                checked={selectedFormat === format.id}
                onChange={(e) => handleFormatChange(e.target.value)}
                className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {format.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Example: {format.format_string}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Timezone */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Timezone
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Set your company's timezone for dates, times, and scheduling
        </p>

        <select
          value={selectedTimezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Data Export */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Export
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export your company data for backup or migration purposes
        </p>

        <div className="flex gap-3">
          <button
            disabled
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
          >
            Export Contacts (Coming Soon)
          </button>
          <button
            disabled
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
          >
            Export Services (Coming Soon)
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                Danger Zone
              </h4>
              <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                Permanent actions that cannot be undone. Proceed with caution.
              </p>
              <button
                disabled
                className="px-4 py-2 bg-red-600 text-white rounded-lg opacity-50 cursor-not-allowed"
              >
                Delete All Company Data (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setSelectedFormat(getNumberFormat());
            setSelectedTimezone(getTimezone() || 'Europe/London');
            setHasChanges(false);
            onUnsavedChanges?.(false);
          }}
          disabled={!hasChanges}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdvancedTab;
