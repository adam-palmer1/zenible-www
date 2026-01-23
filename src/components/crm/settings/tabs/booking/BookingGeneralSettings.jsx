import React, { useState, useEffect } from 'react';
import bookingSettingsAPI from '../../../../../services/api/crm/bookingSettings';
import { useNotification } from '../../../../../contexts/NotificationContext';

// Common timezones list
const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
];

const BookingGeneralSettings = ({ settings, onUpdate, onUnsavedChanges }) => {
  const [formData, setFormData] = useState({
    timezone: settings?.timezone || 'UTC',
    buffer_before_minutes: settings?.buffer_before_minutes || 0,
    buffer_after_minutes: settings?.buffer_after_minutes || 0,
    min_booking_notice_hours: settings?.min_booking_notice_hours || 1,
    max_booking_days_ahead: settings?.max_booking_days_ahead || 60,
    daily_booking_limit: settings?.daily_booking_limit || null,
    weekly_booking_limit: settings?.weekly_booking_limit || null,
    booking_page_enabled: settings?.booking_page_enabled ?? true,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const { showSuccess, showError } = useNotification();

  // Track changes
  useEffect(() => {
    onUnsavedChanges?.(hasChanges);
  }, [hasChanges, onUnsavedChanges]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await bookingSettingsAPI.update(formData);
      onUpdate(updated);
      setHasChanges(false);
      showSuccess('Booking settings saved successfully');
    } catch (error) {
      showError('Failed to save booking settings');
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      timezone: settings?.timezone || 'UTC',
      buffer_before_minutes: settings?.buffer_before_minutes || 0,
      buffer_after_minutes: settings?.buffer_after_minutes || 0,
      min_booking_notice_hours: settings?.min_booking_notice_hours || 1,
      max_booking_days_ahead: settings?.max_booking_days_ahead || 60,
      daily_booking_limit: settings?.daily_booking_limit || null,
      weekly_booking_limit: settings?.weekly_booking_limit || null,
      booking_page_enabled: settings?.booking_page_enabled ?? true,
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Booking Page Toggle */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Public Booking Page
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Allow visitors to book calls through your public booking page
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('booking_page_enabled', !formData.booking_page_enabled)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${formData.booking_page_enabled ? 'bg-zenible-primary' : 'bg-gray-200 dark:bg-gray-700'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                transition duration-200 ease-in-out
                ${formData.booking_page_enabled ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Timezone
        </h3>
        <select
          value={formData.timezone}
          onChange={(e) => handleChange('timezone', e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          All availability times will be displayed in this timezone
        </p>
      </div>

      {/* Buffer Times */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Buffer Times
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buffer before calls (minutes)
            </label>
            <input
              type="number"
              value={formData.buffer_before_minutes}
              onChange={(e) => handleChange('buffer_before_minutes', parseInt(e.target.value) || 0)}
              min="0"
              max="120"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Time blocked before each call
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buffer after calls (minutes)
            </label>
            <input
              type="number"
              value={formData.buffer_after_minutes}
              onChange={(e) => handleChange('buffer_after_minutes', parseInt(e.target.value) || 0)}
              min="0"
              max="120"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Time blocked after each call
            </p>
          </div>
        </div>
      </div>

      {/* Booking Constraints */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Booking Constraints
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum notice (hours)
            </label>
            <input
              type="number"
              value={formData.min_booking_notice_hours}
              onChange={(e) => handleChange('min_booking_notice_hours', parseInt(e.target.value) || 0)}
              min="0"
              max="720"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              How far in advance bookings must be made
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum days ahead
            </label>
            <input
              type="number"
              value={formData.max_booking_days_ahead}
              onChange={(e) => handleChange('max_booking_days_ahead', parseInt(e.target.value) || 1)}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              How far into the future bookings can be made
            </p>
          </div>
        </div>
      </div>

      {/* Booking Limits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Booking Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily booking limit
            </label>
            <input
              type="number"
              value={formData.daily_booking_limit || ''}
              onChange={(e) => handleChange('daily_booking_limit', e.target.value ? parseInt(e.target.value) : null)}
              min="1"
              max="50"
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Maximum bookings per day (leave empty for no limit)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weekly booking limit
            </label>
            <input
              type="number"
              value={formData.weekly_booking_limit || ''}
              onChange={(e) => handleChange('weekly_booking_limit', e.target.value ? parseInt(e.target.value) : null)}
              min="1"
              max="200"
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Maximum bookings per week (leave empty for no limit)
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCancel}
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

export default BookingGeneralSettings;
