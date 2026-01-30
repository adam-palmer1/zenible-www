import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import WidgetAPI from './api';
import BookingCalendar from './components/BookingCalendar';
import TimeSlotPicker from './components/TimeSlotPicker';
import BookingForm from './components/BookingForm';

// Inline SVG icons
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="zw-icon-sm">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="zw-icon-sm">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="zw-icon-sm">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

// Format date for display
const formatDisplayDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// Format date with Today/Tomorrow/Date
const formatFriendlyDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const day = date.getDate();
  const suffix = (day % 10 === 1 && day !== 11) ? 'st'
    : (day % 10 === 2 && day !== 12) ? 'nd'
    : (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
  const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  if (date.getTime() === today.getTime()) {
    return `Today (${day}${suffix} ${monthYear})`;
  } else if (date.getTime() === tomorrow.getTime()) {
    return `Tomorrow (${day}${suffix} ${monthYear})`;
  } else {
    return `${day}${suffix} ${monthYear}`;
  }
};

// Comprehensive timezone list with cities
const TIMEZONES = [
  // North America
  { value: 'America/New_York', label: 'New York', region: 'US' },
  { value: 'America/Chicago', label: 'Chicago', region: 'US' },
  { value: 'America/Denver', label: 'Denver', region: 'US' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', region: 'US' },
  { value: 'America/Anchorage', label: 'Anchorage', region: 'US' },
  { value: 'Pacific/Honolulu', label: 'Honolulu', region: 'US' },
  { value: 'America/Phoenix', label: 'Phoenix', region: 'US' },
  { value: 'America/Detroit', label: 'Detroit', region: 'US' },
  { value: 'America/Toronto', label: 'Toronto', region: 'Canada' },
  { value: 'America/Vancouver', label: 'Vancouver', region: 'Canada' },
  { value: 'America/Montreal', label: 'Montreal', region: 'Canada' },
  { value: 'America/Mexico_City', label: 'Mexico City', region: 'Mexico' },
  // Europe
  { value: 'Europe/London', label: 'London', region: 'UK' },
  { value: 'Europe/Paris', label: 'Paris', region: 'France' },
  { value: 'Europe/Berlin', label: 'Berlin', region: 'Germany' },
  { value: 'Europe/Madrid', label: 'Madrid', region: 'Spain' },
  { value: 'Europe/Rome', label: 'Rome', region: 'Italy' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Netherlands' },
  { value: 'Europe/Brussels', label: 'Brussels', region: 'Belgium' },
  { value: 'Europe/Vienna', label: 'Vienna', region: 'Austria' },
  { value: 'Europe/Zurich', label: 'Zurich', region: 'Switzerland' },
  { value: 'Europe/Stockholm', label: 'Stockholm', region: 'Sweden' },
  { value: 'Europe/Oslo', label: 'Oslo', region: 'Norway' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen', region: 'Denmark' },
  { value: 'Europe/Helsinki', label: 'Helsinki', region: 'Finland' },
  { value: 'Europe/Dublin', label: 'Dublin', region: 'Ireland' },
  { value: 'Europe/Lisbon', label: 'Lisbon', region: 'Portugal' },
  { value: 'Europe/Warsaw', label: 'Warsaw', region: 'Poland' },
  { value: 'Europe/Prague', label: 'Prague', region: 'Czech Republic' },
  { value: 'Europe/Budapest', label: 'Budapest', region: 'Hungary' },
  { value: 'Europe/Athens', label: 'Athens', region: 'Greece' },
  { value: 'Europe/Moscow', label: 'Moscow', region: 'Russia' },
  { value: 'Europe/Istanbul', label: 'Istanbul', region: 'Turkey' },
  // Asia
  { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Japan' },
  { value: 'Asia/Seoul', label: 'Seoul', region: 'South Korea' },
  { value: 'Asia/Shanghai', label: 'Shanghai', region: 'China' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'China' },
  { value: 'Asia/Singapore', label: 'Singapore', region: 'Singapore' },
  { value: 'Asia/Dubai', label: 'Dubai', region: 'UAE' },
  { value: 'Asia/Kolkata', label: 'Mumbai', region: 'India' },
  { value: 'Asia/Kolkata', label: 'Delhi', region: 'India' },
  { value: 'Asia/Bangkok', label: 'Bangkok', region: 'Thailand' },
  { value: 'Asia/Jakarta', label: 'Jakarta', region: 'Indonesia' },
  { value: 'Asia/Manila', label: 'Manila', region: 'Philippines' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur', region: 'Malaysia' },
  { value: 'Asia/Taipei', label: 'Taipei', region: 'Taiwan' },
  { value: 'Asia/Jerusalem', label: 'Tel Aviv', region: 'Israel' },
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney', region: 'Australia' },
  { value: 'Australia/Melbourne', label: 'Melbourne', region: 'Australia' },
  { value: 'Australia/Brisbane', label: 'Brisbane', region: 'Australia' },
  { value: 'Australia/Perth', label: 'Perth', region: 'Australia' },
  { value: 'Pacific/Auckland', label: 'Auckland', region: 'New Zealand' },
  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo', region: 'Brazil' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Argentina' },
  { value: 'America/Santiago', label: 'Santiago', region: 'Chile' },
  { value: 'America/Bogota', label: 'Bogotá', region: 'Colombia' },
  { value: 'America/Lima', label: 'Lima', region: 'Peru' },
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo', region: 'Egypt' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', region: 'South Africa' },
  { value: 'Africa/Lagos', label: 'Lagos', region: 'Nigeria' },
  { value: 'Africa/Nairobi', label: 'Nairobi', region: 'Kenya' },
];

// Format time from 24h to 12h
const formatTime = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const BookingWidget = ({ config }) => {
  const api = useMemo(() => new WidgetAPI(config.apiBaseUrl), [config.apiBaseUrl]);

  // Page data state
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking flow state
  const [step, setStep] = useState('calendar'); // 'calendar', 'form', 'confirmed'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTimeDisplay, setSelectedTimeDisplay] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Availability data for the visible calendar range
  const [availabilityData, setAvailabilityData] = useState({});

  // Timezone state - default to visitor's detected timezone
  const [selectedTimezone, setSelectedTimezone] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');

  // Track if we've done the initial auto-select
  const hasAutoSelectedRef = useRef(false);

  // Fetch call type page data
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCallTypePage(config.username, config.callType);
        setPageData(data);
      } catch (err) {
        console.error('[ZenibleBooking] Error fetching page data:', err);
        if (err.status === 404) {
          setError('Booking page not found');
        } else if (err.status === 403) {
          setError('Booking is not available');
        } else {
          setError(err.message || 'Failed to load booking page');
        }
      } finally {
        setLoading(false);
      }
    };

    if (config.username && config.callType) {
      fetchPageData();
    }
  }, [api, config.username, config.callType]);

  // Fetch availability for the visible calendar range
  const fetchCalendarAvailability = useCallback(async (startDate, endDate) => {
    if (!config.username || !config.callType) return;

    try {
      const data = await api.getAvailableSlots(
        config.username,
        config.callType,
        startDate,
        endDate
      );

      const newAvailability = {};
      data.days?.forEach((day) => {
        if (day.slots && day.slots.length > 0) {
          newAvailability[day.date] = day.slots;
        }
      });

      setAvailabilityData(newAvailability);

      // Auto-select will be handled by the effect that watches availableDates
      if (!hasAutoSelectedRef.current && Object.keys(newAvailability).length > 0) {
        hasAutoSelectedRef.current = true;
      }
    } catch (err) {
      console.error('[ZenibleBooking] Error fetching availability:', err);
      setAvailabilityData({});
    }
  }, [api, config.username, config.callType]);

  // Handle calendar month change
  const handleMonthChange = useCallback((startDate, endDate) => {
    fetchCalendarAvailability(startDate, endDate);
  }, [fetchCalendarAvailability]);

  // Handle date selection - use visitor-timezone-aware data
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    // Get slots from visitor availability
    const slotData = visitorAvailability[date] || [];
    // Pass slot data with both host time (for booking) and visitor time (for display)
    setAvailableSlots(slotData);
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    // Find the display time for this slot
    const slot = availableSlots.find(s => (typeof s === 'object' ? s.time : s) === time);
    const displayTime = slot && typeof slot === 'object' && slot.visitorTime
      ? slot.visitorTime
      : formatTime(time);
    setSelectedTimeDisplay(displayTime);
    setStep('form');
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      // Combine date and time into ISO datetime string
      const startDatetime = `${selectedDate}T${selectedTime}:00`;

      const bookingData = {
        start_datetime: startDatetime,
        timezone: selectedTimezone,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        notes: formData.notes || null,
      };

      const result = await api.createBooking(config.username, config.callType, bookingData);
      setBookingResult(result);
      setStep('confirmed');

      // Callback if provided
      if (config.onBookingComplete) {
        config.onBookingComplete(result);
      }
    } catch (err) {
      console.error('[ZenibleBooking] Error creating booking:', err);
      if (err.status === 409) {
        setSubmitError('This time slot is no longer available. Please select another time.');
        setStep('calendar');
        setSelectedTime(null);
        // Refetch slots
        setSlotsLoading(true);
        try {
          const data = await api.getAvailableSlots(config.username, config.callType, selectedDate, selectedDate);
          const dayData = data.days?.find((d) => d.date === selectedDate);
          const slots = dayData?.slots || [];
          setAvailabilityData((prev) => ({ ...prev, [selectedDate]: slots }));
          setAvailableSlots(slots);
        } catch (refetchErr) {
          console.error('[ZenibleBooking] Error refetching slots:', refetchErr);
        } finally {
          setSlotsLoading(false);
        }
      } else {
        setSubmitError(err.message || 'Failed to create booking. Please try again.');
        if (config.onError) {
          config.onError(err);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle back from form
  const handleBack = () => {
    setStep('calendar');
    setSubmitError(null);
  };

  // Transform availability data to visitor's timezone
  // This recalculates which dates have slots when viewed in the visitor's timezone
  const { availableDates, visitorAvailability } = useMemo(() => {
    const hostTimezone = pageData?.timezone;
    if (!hostTimezone || hostTimezone === selectedTimezone) {
      // No conversion needed
      return {
        availableDates: Object.keys(availabilityData),
        visitorAvailability: availabilityData,
      };
    }

    // Group slots by their date in the visitor's timezone
    const visitorSlots = {}; // { visitorDate: [{ hostDate, time, visitorTime }] }

    Object.entries(availabilityData).forEach(([hostDate, slots]) => {
      slots.forEach((time) => {
        try {
          const [year, month, day] = hostDate.split('-').map(Number);
          const [hours, minutes] = time.split(':').map(Number);

          // Create date in host timezone
          const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

          // Get offset to adjust to actual host time
          const sourceFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: hostTimezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
          });
          const sourceParts = sourceFormatter.formatToParts(utcDate);
          const sourceHour = parseInt(sourceParts.find(p => p.type === 'hour').value);
          const sourceMinute = parseInt(sourceParts.find(p => p.type === 'minute').value);

          const wantedMinutes = hours * 60 + minutes;
          const gotMinutes = sourceHour * 60 + sourceMinute;
          const offsetMinutes = wantedMinutes - gotMinutes;

          const adjustedDate = new Date(utcDate.getTime() + offsetMinutes * 60 * 1000);

          // Get the date in visitor timezone
          const visitorDateFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: selectedTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          const visitorDate = visitorDateFormatter.format(adjustedDate);

          // Format the time in visitor timezone
          const visitorTimeFormatted = new Intl.DateTimeFormat('en-US', {
            timeZone: selectedTimezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }).format(adjustedDate);

          if (!visitorSlots[visitorDate]) {
            visitorSlots[visitorDate] = [];
          }
          visitorSlots[visitorDate].push({
            hostDate,
            time, // Original host time for booking
            adjustedDate,
            visitorTime: visitorTimeFormatted, // Pre-formatted for display
          });
        } catch (e) {
          // On error, keep original date
          if (!visitorSlots[hostDate]) {
            visitorSlots[hostDate] = [];
          }
          visitorSlots[hostDate].push({ hostDate, time });
        }
      });
    });

    // Sort slots within each date by time
    Object.values(visitorSlots).forEach((slots) => {
      slots.sort((a, b) => (a.adjustedDate || 0) - (b.adjustedDate || 0));
    });

    return {
      availableDates: Object.keys(visitorSlots).sort(),
      visitorAvailability: visitorSlots,
    };
  }, [availabilityData, pageData?.timezone, selectedTimezone]);

  // Calculate min/max dates
  const { minDate, maxDate } = useMemo(() => {
    const settings = pageData?.settings || {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const min = new Date(today);
    min.setDate(min.getDate() + (settings.min_notice_hours ? Math.ceil(settings.min_notice_hours / 24) : 0));

    const max = new Date(today);
    max.setDate(max.getDate() + (settings.max_days_ahead || 60));

    return {
      minDate: min,
      maxDate: max,
    };
  }, [pageData]);

  // Get display label for current timezone
  const timezoneLabel = useMemo(() => {
    const found = TIMEZONES.find(tz => tz.value === selectedTimezone);
    if (found) return `${found.label}, ${found.region}`;
    // Extract city name from timezone string (e.g., "America/New_York" -> "New York")
    const parts = selectedTimezone.split('/');
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    return city;
  }, [selectedTimezone]);

  // Filter timezones based on search
  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch.trim()) return TIMEZONES;
    const search = timezoneSearch.toLowerCase();
    return TIMEZONES.filter(tz =>
      tz.label.toLowerCase().includes(search) ||
      tz.region.toLowerCase().includes(search) ||
      tz.value.toLowerCase().includes(search)
    );
  }, [timezoneSearch]);

  // Auto-select first available date when availability or timezone changes
  useEffect(() => {
    if (availableDates.length > 0 && hasAutoSelectedRef.current) {
      const firstDate = availableDates[0];
      setSelectedDate(firstDate);
      const slotData = visitorAvailability[firstDate] || [];
      setAvailableSlots(slotData);
    }
  }, [availableDates, visitorAvailability]);

  // Loading state
  if (loading) {
    return (
      <div className="zenible-widget">
        <div className="zw-loading">
          <div className="zw-spinner" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="zenible-widget">
        <div className="zw-error">
          <h2 className="zw-error-title">
            {error === 'Booking page not found' ? 'Page Not Found' : 'Unavailable'}
          </h2>
          <p className="zw-error-message">
            {error === 'Booking page not found'
              ? "The booking page you're looking for doesn't exist."
              : error}
          </p>
        </div>
      </div>
    );
  }

  const { host, call_type } = pageData || {};

  // Confirmed state
  if (step === 'confirmed' && bookingResult) {
    return (
      <div className="zenible-widget">
        <div className="zw-confirmation">
          <div className="zw-success-icon">
            <CheckCircleIcon />
          </div>
          <h2 className="zw-confirmation-title">Booking Confirmed!</h2>
          <p className="zw-confirmation-message">
            You'll receive a confirmation email shortly.
          </p>

          <div className="zw-confirmation-details">
            <div className="zw-confirmation-row">
              <span className="zw-confirmation-label">Date</span>
              <span className="zw-confirmation-value">{formatDisplayDate(selectedDate)}</span>
            </div>
            <div className="zw-confirmation-row">
              <span className="zw-confirmation-label">Time</span>
              <span className="zw-confirmation-value">{selectedTimeDisplay || formatTime(selectedTime)}</span>
            </div>
            <div className="zw-confirmation-row">
              <span className="zw-confirmation-label">Duration</span>
              <span className="zw-confirmation-value">{call_type?.duration_minutes} minutes</span>
            </div>
            {bookingResult.meeting_link && (
              <div className="zw-confirmation-row">
                <span className="zw-confirmation-label">Meeting Link</span>
                <a
                  href={bookingResult.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--zenible-primary)', textDecoration: 'none' }}
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="zw-footer">
          <a href="https://www.zenible.com" target="_blank" rel="noopener noreferrer">
            Powered by Zenible
          </a>
        </div>
      </div>
    );
  }

  // Form step
  if (step === 'form') {
    return (
      <div className="zenible-widget">
        {/* Header */}
        <div className="zw-header">
          {host && (
            <div className="zw-host">
              <div className="zw-host-avatar">
                {host.avatar_url ? (
                  <img src={host.avatar_url} alt={host.name} />
                ) : (
                  host.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <p className="zw-host-name">{host.name}</p>
            </div>
          )}
          <div className="zw-call-type">
            <h1 className="zw-call-type-name">{call_type?.name}</h1>
            <span className="zw-call-type-duration">
              <ClockIcon />
              {call_type?.duration_minutes} min
            </span>
          </div>
        </div>

        <BookingForm
          date={selectedDate}
          time={selectedTime}
          displayTime={selectedTimeDisplay}
          duration={call_type?.duration_minutes}
          timezone={timezoneLabel}
          onSubmit={handleSubmit}
          onBack={handleBack}
          loading={submitting}
          error={submitError}
        />

        <div className="zw-footer">
          <a href="https://www.zenible.com" target="_blank" rel="noopener noreferrer">
            Powered by Zenible
          </a>
        </div>
      </div>
    );
  }

  // Calendar step (default)
  return (
    <div className="zenible-widget">
      {/* Header */}
      <div className="zw-header">
        {host && (
          <div className="zw-host">
            <div className="zw-host-avatar">
              {host.avatar_url ? (
                <img src={host.avatar_url} alt={host.name} />
              ) : (
                host.name?.charAt(0)?.toUpperCase() || '?'
              )}
            </div>
            <p className="zw-host-name">{host.name}</p>
          </div>
        )}
        <div className="zw-call-type">
          <h1 className="zw-call-type-name">{call_type?.name}</h1>
          <span className="zw-call-type-duration">
            <ClockIcon />
            {call_type?.duration_minutes} min
          </span>
        </div>
        {call_type?.description && (
          <p className="zw-description">{call_type.description}</p>
        )}

        {/* Timezone selector */}
        <div className="zw-timezone-selector" style={{ marginTop: '16px' }}>
          <button
            type="button"
            className="zw-timezone-btn"
            onClick={() => {
              setShowTimezoneSelector(!showTimezoneSelector);
              setTimezoneSearch('');
            }}
          >
            <GlobeIcon />
            <span>{timezoneLabel}</span>
            <ChevronDownIcon />
          </button>
          {showTimezoneSelector && (
            <div className="zw-timezone-dropdown" style={{ bottom: 'auto', top: '100%', marginTop: '4px', marginBottom: 0 }}>
              <div style={{ padding: '8px', borderBottom: '1px solid var(--zenible-border)' }}>
                <input
                  type="text"
                  className="zw-input"
                  placeholder="Search city..."
                  value={timezoneSearch}
                  onChange={(e) => setTimezoneSearch(e.target.value)}
                  autoFocus
                  style={{ padding: '8px 10px', fontSize: '13px' }}
                />
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filteredTimezones.map((tz) => (
                  <button
                    key={`${tz.value}-${tz.label}`}
                    type="button"
                    className={`zw-timezone-option ${selectedTimezone === tz.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTimezone(tz.value);
                      setShowTimezoneSelector(false);
                      setTimezoneSearch('');
                    }}
                  >
                    {tz.label}, {tz.region}
                  </button>
                ))}
                {filteredTimezones.length === 0 && (
                  <div style={{ padding: '12px', color: 'var(--zenible-text-muted)', fontSize: '13px', textAlign: 'center' }}>
                    No matching cities
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="zw-content">
        {/* Calendar */}
        <div className="zw-calendar-section">
          <h2 className="zw-section-title">Select a Date</h2>
          <BookingCalendar
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>

        {/* Time slots */}
        <div className="zw-slots-section">
          {selectedDate && (
            <p className="zw-selected-date-label">{formatFriendlyDate(selectedDate)}</p>
          )}
          <h2 className="zw-section-title">
            {selectedDate ? 'Select a Time' : 'Available Times'}
          </h2>
          {selectedDate ? (
            <TimeSlotPicker
              slots={availableSlots}
              selectedTime={selectedTime}
              onSelect={handleTimeSelect}
              loading={slotsLoading}
            />
          ) : (
            <div className="zw-select-date">
              Please select a date to see available times.
            </div>
          )}
        </div>
      </div>

      <div className="zw-footer">
        <a href="https://www.zenible.com" target="_blank" rel="noopener noreferrer">
          Powered by Zenible
        </a>
      </div>
    </div>
  );
};

export default BookingWidget;
