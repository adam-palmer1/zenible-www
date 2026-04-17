import React, { useState } from 'react';

// Inline SVG icon
const ArrowLeftIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="zw-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

// Format date for display
const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// Format time from 24h to 12h
const formatTime = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

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
  displayTime?: string | null;
  duration?: number;
  timezone?: string;
  onSubmit: (formData: BookingFormData) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
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
  error,
}) => {
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    country_code: getDefaultCountryCode(),
    phone: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="zw-form-section">
      {/* Header with back button */}
      <div className="zw-form-header">
        <button
          type="button"
          onClick={onBack}
          className="zw-back-btn"
        >
          <ArrowLeftIcon />
        </button>
        <div className="zw-form-summary">
          <p className="zw-form-summary-title">
            {formatDisplayDate(date)} at {displayTime || formatTime(time)}
          </p>
          <p className="zw-form-summary-details">
            {duration} minutes {timezone && `• ${timezone}`}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--zenible-error)',
          borderRadius: 'var(--zenible-radius)',
          color: 'var(--zenible-error)',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form className="zw-form" onSubmit={handleSubmit}>
        <div className="zw-form-group">
          <label className="zw-label zw-label-required">Your Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
            placeholder="John Doe"
            className={`zw-input ${errors.name ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.name && <span className="zw-error-text">{errors.name}</span>}
        </div>

        <div className="zw-form-group">
          <label className="zw-label zw-label-required">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
            placeholder="john@example.com"
            className={`zw-input ${errors.email ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.email && <span className="zw-error-text">{errors.email}</span>}
        </div>

        <div className="zw-form-group">
          <label className="zw-label">Phone Number (optional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
            <input
              type="tel"
              value={formData.country_code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('country_code', e.target.value.replace(/[^0-9+\s]/g, ''))}
              placeholder="+44"
              className="zw-input"
              disabled={loading}
            />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
              placeholder="7570 835 398"
              className="zw-input"
              disabled={loading}
            />
          </div>
        </div>

        <div className="zw-form-group">
          <label className="zw-label">Additional Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('notes', e.target.value)}
            placeholder="Any additional information..."
            className="zw-textarea"
            disabled={loading}
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="zw-submit-btn"
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
