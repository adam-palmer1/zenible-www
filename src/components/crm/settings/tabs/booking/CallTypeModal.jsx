import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import callTypesAPI from '../../../../../services/api/crm/callTypes';
import { useNotification } from '../../../../../contexts/NotificationContext';

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const CANCELLATION_NOTICE_OPTIONS = [
  { value: 0, label: 'No minimum (anytime)' },
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours (default)' },
  { value: 48, label: '48 hours' },
  { value: 72, label: '3 days' },
  { value: 168, label: '1 week' },
];

const COLOR_OPTIONS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6b7280', // Gray
];

const CONFERENCING_OPTIONS = [
  { value: 'none', label: 'No video conferencing' },
  { value: 'google_meet', label: 'Google Meet (auto-generate link)' },
  { value: 'zoom', label: 'Zoom (auto-generate link)' },
  { value: 'custom', label: 'Custom meeting link' },
];

const CallTypeModal = ({ isOpen, onClose, onSave, callType }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortcode: '',
    description: '',
    duration_minutes: 30,
    color: '#3b82f6',
    location: '',
    conferencing_type: 'none',
    custom_meeting_link: '',
    max_display_slots_per_day: null,
    min_cancellation_notice_hours: 24,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCancellationPicker, setShowCancellationPicker] = useState(false);
  const [showConferencingPicker, setShowConferencingPicker] = useState(false);

  const { showSuccess, showError } = useNotification();

  // Helper functions to get display labels
  const getDurationLabel = (value) => {
    const opt = DURATION_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : `${value} minutes`;
  };

  const getCancellationLabel = (value) => {
    const opt = CANCELLATION_NOTICE_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : `${value} hours`;
  };

  const getConferencingLabel = (value) => {
    const opt = CONFERENCING_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : value;
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (callType) {
        setFormData({
          name: callType.name || '',
          shortcode: callType.shortcode || '',
          description: callType.description || '',
          duration_minutes: callType.duration_minutes || 30,
          color: callType.color || '#3b82f6',
          location: callType.location || '',
          conferencing_type: callType.conferencing_type || 'none',
          custom_meeting_link: callType.custom_meeting_link || '',
          max_display_slots_per_day: callType.max_display_slots_per_day || null,
          min_cancellation_notice_hours: callType.min_cancellation_notice_hours ?? 24,
          is_active: callType.is_active ?? true,
        });
      } else {
        setFormData({
          name: '',
          shortcode: '',
          description: '',
          duration_minutes: 30,
          color: '#3b82f6',
          location: '',
          conferencing_type: 'none',
          custom_meeting_link: '',
          max_display_slots_per_day: null,
          min_cancellation_notice_hours: 24,
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, callType]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Auto-generate shortcode from name
  const handleNameChange = (name) => {
    handleChange('name', name);
    if (!callType) {
      // Only auto-generate for new call types
      const shortcode = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50);
      handleChange('shortcode', shortcode);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.shortcode.trim()) {
      newErrors.shortcode = 'Shortcode is required';
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(formData.shortcode)) {
      newErrors.shortcode = 'Shortcode must be lowercase letters, numbers, and hyphens only';
    }

    if (formData.conferencing_type === 'custom' && !formData.custom_meeting_link.trim()) {
      newErrors.custom_meeting_link = 'Meeting link is required for custom conferencing';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      let saved;
      if (callType) {
        // Update existing
        saved = await callTypesAPI.update(callType.id, formData);
        showSuccess('Call type updated');
      } else {
        // Create new
        saved = await callTypesAPI.create(formData);
        showSuccess('Call type created');
      }
      onSave(saved);
    } catch (error) {
      showError(error.message || 'Failed to save call type');
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {callType ? 'Edit Call Type' : 'New Call Type'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={100}
                placeholder="e.g., 30 Minute Discovery Call"
                className={`
                  w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white
                  ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                `}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Shortcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shortcode *
              </label>
              <input
                type="text"
                value={formData.shortcode}
                onChange={(e) => handleChange('shortcode', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                maxLength={50}
                placeholder="e.g., discovery"
                className={`
                  w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white
                  ${errors.shortcode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                `}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                URL-friendly identifier (e.g., /book/username/{formData.shortcode || 'shortcode'})
              </p>
              {errors.shortcode && (
                <p className="mt-1 text-sm text-red-500">{errors.shortcode}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Describe what this call is about..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration
              </label>
              <button
                type="button"
                onClick={() => setShowDurationPicker(true)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-zenible-primary transition-colors"
              >
                <span className="text-gray-900 dark:text-white">{getDurationLabel(formData.duration_minutes)}</span>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Max Display Slots Per Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max display slots per day
              </label>
              <input
                type="number"
                value={formData.max_display_slots_per_day || ''}
                onChange={(e) => handleChange('max_display_slots_per_day', e.target.value ? parseInt(e.target.value) : null)}
                min="1"
                max="50"
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Limit time slots shown per day (leave empty for no limit)
              </p>
            </div>

            {/* Cancellation Policy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cancellation Policy
              </label>
              <button
                type="button"
                onClick={() => setShowCancellationPicker(true)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-zenible-primary transition-colors"
              >
                <span className="text-gray-900 dark:text-white">{getCancellationLabel(formData.min_cancellation_notice_hours)}</span>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </button>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formData.min_cancellation_notice_hours === 0
                  ? 'Guests can cancel or reschedule at any time before the appointment'
                  : `Guests must cancel or reschedule at least ${formData.min_cancellation_notice_hours} hours before`}
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleChange('color', color)}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all
                      ${formData.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Conferencing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Video Conferencing
              </label>
              <button
                type="button"
                onClick={() => setShowConferencingPicker(true)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between hover:border-zenible-primary transition-colors"
              >
                <span className="text-gray-900 dark:text-white">{getConferencingLabel(formData.conferencing_type)}</span>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Custom Meeting Link */}
            {formData.conferencing_type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Meeting Link *
                </label>
                <input
                  type="url"
                  value={formData.custom_meeting_link}
                  onChange={(e) => handleChange('custom_meeting_link', e.target.value)}
                  placeholder="https://zoom.us/j/123456789"
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white
                    ${errors.custom_meeting_link ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                  `}
                />
                {errors.custom_meeting_link && (
                  <p className="mt-1 text-sm text-red-500">{errors.custom_meeting_link}</p>
                )}
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location (optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Conference Room A, Phone call"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : callType ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>

        {/* Duration Picker Modal */}
        {showDurationPicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowDurationPicker(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xs">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Duration
                </h3>
                <button
                  onClick={() => setShowDurationPicker(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      handleChange('duration_minutes', opt.value);
                      setShowDurationPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg ${
                      formData.duration_minutes === opt.value ? 'bg-zenible-primary/10 text-zenible-primary' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Notice Picker Modal */}
        {showCancellationPicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowCancellationPicker(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xs">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cancellation Notice
                </h3>
                <button
                  onClick={() => setShowCancellationPicker(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {CANCELLATION_NOTICE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      handleChange('min_cancellation_notice_hours', opt.value);
                      setShowCancellationPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg ${
                      formData.min_cancellation_notice_hours === opt.value ? 'bg-zenible-primary/10 text-zenible-primary' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conferencing Picker Modal */}
        {showConferencingPicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowConferencingPicker(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Video Conferencing
                </h3>
                <button
                  onClick={() => setShowConferencingPicker(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {CONFERENCING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      handleChange('conferencing_type', opt.value);
                      setShowConferencingPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg ${
                      formData.conferencing_type === opt.value ? 'bg-zenible-primary/10 text-zenible-primary' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallTypeModal;
