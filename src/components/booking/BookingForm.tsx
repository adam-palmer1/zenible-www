import React, { useState } from 'react';
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

// Map region code from browser locale to dial code
const REGION_DIAL_CODES: Record<string, string> = {
  GB: '+44', US: '+1', CA: '+1', IE: '+353', AU: '+61', NZ: '+64',
  DE: '+49', FR: '+33', ES: '+34', IT: '+39', NL: '+31', BE: '+32',
  PT: '+351', AT: '+43', CH: '+41', SE: '+46', NO: '+47', DK: '+45',
  FI: '+358', PL: '+48', CZ: '+420', RO: '+40', HU: '+36', GR: '+30',
  IN: '+91', JP: '+81', CN: '+86', KR: '+82', SG: '+65', HK: '+852',
  ZA: '+27', BR: '+55', MX: '+52', AR: '+54', AE: '+971', SA: '+966',
  IL: '+972', RU: '+7', UA: '+380', TR: '+90', NG: '+234', KE: '+254',
  EG: '+20', PH: '+63', TH: '+66', MY: '+60', ID: '+62', VN: '+84',
};

const getDefaultCountryCode = (): string => {
  try {
    const locale = navigator.language || navigator.languages?.[0] || '';
    const region = locale.split('-')[1]?.toUpperCase();
    if (region && REGION_DIAL_CODES[region]) {
      return REGION_DIAL_CODES[region];
    }
  } catch {}
  return '+1';
};

interface BookingFormData {
  name: string;
  email: string;
  country_code: string;
  phone: string;
  notes: string;
}

interface BookingFormProps {
  date: string;
  time: string;
  displayTime?: string;
  duration: number;
  timezone?: string;
  onSubmit: (formData: BookingFormData) => void;
  onBack: () => void;
  loading?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({
  date,
  time,
  displayTime,
  duration,
  timezone,
  onSubmit,
  onBack,
  loading = false,
}) => {
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    country_code: getDefaultCountryCode(),
    phone: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Back button and summary */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to calendar
        </button>

        {/* Booking summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Booking Summary
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <span>{displayTime || formatTime(time)} ({duration} minutes)</span>
            </div>
            {timezone && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {timezone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            maxLength={200}
            placeholder="Your full name"
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white
              ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            `}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="you@example.com"
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white
              ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            `}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone (optional)
          </label>
          <div className="grid gap-2" style={{ gridTemplateColumns: '90px 1fr' }}>
            <input
              type="tel"
              value={formData.country_code}
              onChange={(e) => handleChange('country_code', e.target.value.replace(/[^0-9+\s]/g, ''))}
              maxLength={10}
              placeholder="+44"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              maxLength={50}
              placeholder="7570 835 398"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Anything you'd like to share before the call..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-zenible-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          By booking, you agree to receive email confirmations and reminders.
        </p>
      </form>
    </div>
  );
};

export default BookingForm;
