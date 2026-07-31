import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '../../../../../hooks/useEscapeKey';
import callTypesAPI from '../../../../../services/api/crm/callTypes';
import currenciesAPI from '../../../../../services/api/crm/currencies';
import paymentIntegrationsAPI from '../../../../../services/api/finance/paymentIntegrations';
import { useNotification } from '../../../../../contexts/NotificationContext';
import logger from '../../../../../utils/logger';

interface CurrencyOption {
  id: string;
  code: string;
  symbol?: string;
}

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

const CallTypeModal = ({ isOpen, onClose, onSave, callType }: any) => {
  const [formData, setFormData] = useState<any>({
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
    is_chargeable: false,
    price: '',
    currency_id: '',
    payment_methods: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCancellationPicker, setShowCancellationPicker] = useState(false);
  const [showConferencingPicker, setShowConferencingPicker] = useState(false);

  // Payment integration availability (controls greying of the payment controls)
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const anyIntegrationEnabled = stripeEnabled || paypalEnabled;

  const { showSuccess, showError } = useNotification();

  useEscapeKey(onClose, isOpen);

  // Helper functions to get display labels
  const getDurationLabel = (value: number) => {
    const opt = DURATION_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : `${value} minutes`;
  };

  const getCancellationLabel = (value: number) => {
    const opt = CANCELLATION_NOTICE_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : `${value} hours`;
  };

  const getConferencingLabel = (value: string) => {
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
          is_chargeable: callType.is_chargeable ?? false,
          price: callType.price_amount != null ? String(callType.price_amount) : '',
          currency_id: callType.currency_id || '',
          payment_methods: [
            ...(callType.accept_stripe ? ['stripe'] : []),
            ...(callType.accept_paypal ? ['paypal'] : []),
          ],
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
          is_chargeable: false,
          price: '',
          currency_id: '',
          payment_methods: [],
        });
      }
      setErrors({});
      loadPaymentContext();
    }
  }, [isOpen, callType]);

  // Fetch integration status + currencies whenever the modal opens, and prune
  // any previously-selected method whose integration is no longer enabled.
  const loadPaymentContext = async () => {
    setIntegrationsLoading(true);
    try {
      const [stripeRes, paypalRes, currencyRes] = await Promise.allSettled([
        paymentIntegrationsAPI.getStripeConnectStatus(),
        paymentIntegrationsAPI.getPayPalStatus(),
        currenciesAPI.list(),
      ]);

      let stripeOn = false;
      if (stripeRes.status === 'fulfilled') {
        const s: any = stripeRes.value;
        stripeOn = s?.status === 'enabled' && s?.charges_enabled === true;
      }
      let paypalOn = false;
      if (paypalRes.status === 'fulfilled') {
        const p: any = paypalRes.value;
        paypalOn = !!p?.is_connected && (p?.is_ready_for_payments === true || p?.payments_receivable === true);
      }
      setStripeEnabled(stripeOn);
      setPaypalEnabled(paypalOn);

      if (currencyRes.status === 'fulfilled') {
        const raw: any = currencyRes.value;
        const list: CurrencyOption[] = Array.isArray(raw) ? raw : (raw?.items || []);
        setCurrencies(list);
      }

      // Drop selected methods whose integration is now disabled.
      setFormData((prev: any) => ({
        ...prev,
        payment_methods: (prev.payment_methods || []).filter((m: string) =>
          (m === 'stripe' && stripeOn) || (m === 'paypal' && paypalOn)
        ),
      }));
    } catch (e) {
      logger.error('Failed to load payment context', e);
    } finally {
      setIntegrationsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  const togglePaymentMethod = (method: string) => {
    setFormData((prev: any) => {
      const has = (prev.payment_methods || []).includes(method);
      return {
        ...prev,
        payment_methods: has
          ? prev.payment_methods.filter((m: string) => m !== method)
          : [...(prev.payment_methods || []), method],
      };
    });
    if (errors.payment_methods) {
      setErrors((prev: any) => ({ ...prev, payment_methods: null }));
    }
  };

  // Auto-generate shortcode from name
  const handleNameChange = (name: string) => {
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
    const newErrors: any = {};

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

    if (formData.is_chargeable) {
      const price = parseFloat(formData.price);
      if (!formData.price || isNaN(price) || price <= 0) {
        newErrors.price = 'Enter a price greater than 0';
      }
      if (!formData.currency_id) {
        newErrors.currency_id = 'Select a currency';
      }
      if (!formData.payment_methods || formData.payment_methods.length === 0) {
        newErrors.payment_methods = 'Select at least one payment method';
      } else if (
        formData.payment_methods.some(
          (m: string) => (m === 'stripe' && !stripeEnabled) || (m === 'paypal' && !paypalEnabled),
        )
      ) {
        newErrors.payment_methods = 'A selected payment method is no longer available';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Normalize the chargeable fields into the API shape.
      const { price, payment_methods, ...rest } = formData;
      const payload: any = { ...rest, is_chargeable: !!formData.is_chargeable };
      if (formData.is_chargeable) {
        payload.price_amount = parseFloat(formData.price);
        payload.currency_id = formData.currency_id;
        payload.accept_stripe = payment_methods.includes('stripe');
        payload.accept_paypal = payment_methods.includes('paypal');
      } else {
        payload.price_amount = null;
        payload.currency_id = null;
        payload.accept_stripe = false;
        payload.accept_paypal = false;
      }

      let saved;
      if (callType) {
        // Update existing
        saved = await callTypesAPI.update(callType.id, payload);
        showSuccess('Call type updated');
      } else {
        // Create new
        saved = await callTypesAPI.create(payload);
        showSuccess('Call type created');
      }
      onSave(saved);
    } catch (error) {
      showError((error as Error).message || 'Failed to save call type');
      logger.error('Failed to save:', error);
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

            {/* Payment */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Require payment
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Guests pay before the appointment is booked
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_chargeable}
                  disabled={!anyIntegrationEnabled || integrationsLoading}
                  title={
                    !anyIntegrationEnabled
                      ? 'Connect Stripe or PayPal in Settings → Integrations to charge for this appointment'
                      : undefined
                  }
                  onClick={() => handleChange('is_chargeable', !formData.is_chargeable)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_chargeable ? 'bg-zenible-primary' : 'bg-gray-300 dark:bg-gray-600'
                  } ${!anyIntegrationEnabled || integrationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_chargeable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {integrationsLoading && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Checking integrations…</p>
              )}
              {!integrationsLoading && !anyIntegrationEnabled && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Connect Stripe or PayPal in Settings → Integrations to charge for this appointment.
                </p>
              )}

              {formData.is_chargeable && (
                <div className="mt-4 space-y-4">
                  {/* Price + Currency */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                          errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                    </div>
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Currency *
                      </label>
                      <select
                        value={formData.currency_id}
                        onChange={(e) => handleChange('currency_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                          errors.currency_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <option value="">Select…</option>
                        {currencies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                      {errors.currency_id && (
                        <p className="mt-1 text-sm text-red-500">{errors.currency_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Payment methods */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Accepted payment methods *
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: 'stripe', label: 'Stripe (card)', enabled: stripeEnabled },
                        { key: 'paypal', label: 'PayPal', enabled: paypalEnabled },
                      ].map((m) => (
                        <label
                          key={m.key}
                          className={`flex items-center gap-2 ${
                            m.enabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                          }`}
                          title={m.enabled ? undefined : `${m.label} is not connected`}
                        >
                          <input
                            type="checkbox"
                            disabled={!m.enabled}
                            checked={formData.payment_methods.includes(m.key)}
                            onChange={() => togglePaymentMethod(m.key)}
                            className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">{m.label}</span>
                          {!m.enabled && (
                            <span className="text-xs text-gray-400">(not connected)</span>
                          )}
                        </label>
                      ))}
                    </div>
                    {errors.payment_methods && (
                      <p className="mt-1 text-sm text-red-500">{errors.payment_methods}</p>
                    )}
                  </div>
                </div>
              )}
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
