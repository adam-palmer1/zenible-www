import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon, GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import publicBookingAPI from '../../services/api/public/booking';
import BookingCalendar from '../../components/booking/BookingCalendar';
import TimeSlotPicker from '../../components/booking/TimeSlotPicker';
import BookingForm from '../../components/booking/BookingForm';

interface TimezoneEntry {
  value: string;
  label: string;
  region: string;
}

// Comprehensive timezone list with cities
const TIMEZONES: TimezoneEntry[] = [
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

// Format date with Today/Tomorrow/Date
const formatFriendlyDate = (dateStr: string): string => {
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

const PublicBookingPage: React.FC = () => {
  const { username, shortcode } = useParams<{ username: string; shortcode: string }>();

  // Page data state
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking flow state
  const [step, setStep] = useState<'calendar' | 'form' | 'confirmed'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTimeDisplay, setSelectedTimeDisplay] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Availability data for the visible calendar range (keyed by date)
  const [availabilityData, setAvailabilityData] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(false);

  // Timezone state - default to visitor's detected timezone
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [showTimezoneSelector, setShowTimezoneSelector] = useState<boolean>(false);
  const [timezoneSearch, setTimezoneSearch] = useState<string>('');

  // Track if we've done the initial auto-select
  const hasAutoSelectedRef = useRef<boolean>(false);

  // Fetch call type page data
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await (publicBookingAPI as any).getCallTypePage(username, shortcode);
        setPageData(data);
      } catch (err: any) {
        console.error('Error fetching call type page:', err);
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

    if (username && shortcode) {
      fetchPageData();
    }
  }, [username, shortcode]);

  // Fetch availability for the visible calendar range
  const fetchCalendarAvailability = useCallback(async (startDate: string, endDate: string) => {
    if (!username || !shortcode) return;

    try {
      setAvailabilityLoading(true);

      const data = await (publicBookingAPI as any).getAvailableSlots(
        username,
        shortcode,
        startDate,
        endDate
      );

      // Convert days array to object keyed by date
      const newAvailability: Record<string, string[]> = {};
      (data.days as any[])?.forEach((day: any) => {
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
      console.error('Error fetching calendar availability:', err);
      setAvailabilityData({});
    } finally {
      setAvailabilityLoading(false);
    }
  }, [username, shortcode]);

  // Handle calendar month change
  const handleMonthChange = useCallback((startDate: string, endDate: string) => {
    fetchCalendarAvailability(startDate, endDate);
  }, [fetchCalendarAvailability]);

  // Handle date selection - use visitor-timezone-aware data
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    // Get slots from visitor availability
    const slotData = visitorAvailability[date] || [];
    // Pass slot data with both host time (for booking) and visitor time (for display)
    setAvailableSlots(slotData);
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
    const visitorSlots: Record<string, any[]> = {};

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
          const sourceHour = parseInt(sourceParts.find(p => p.type === 'hour')!.value);
          const sourceMinute = parseInt(sourceParts.find(p => p.type === 'minute')!.value);

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
      slots.sort((a: any, b: any) => (a.adjustedDate || 0) - (b.adjustedDate || 0));
    });

    return {
      availableDates: Object.keys(visitorSlots).sort(),
      visitorAvailability: visitorSlots,
    };
  }, [availabilityData, pageData?.timezone, selectedTimezone]);

  // Format time from 24h to 12h
  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    // Find the display time for this slot
    const slot = availableSlots.find((s: any) => (typeof s === 'object' ? s.time : s) === time);
    const displayTime = slot && typeof slot === 'object' && slot.visitorTime
      ? slot.visitorTime
      : formatTime(time);
    setSelectedTimeDisplay(displayTime);
    setStep('form');
  };

  // Handle form submission
  const handleSubmit = async (formData: any) => {
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

      const result = await (publicBookingAPI as any).createBooking(username, shortcode, bookingData);
      setBookingResult(result);
      setStep('confirmed');
    } catch (err: any) {
      console.error('Error creating booking:', err);
      if (err.status === 409) {
        setSubmitError('This time slot is no longer available. Please select another time.');
        setStep('calendar');
        setSelectedTime(null);
        // Refetch single date to get updated slots
        setSlotsLoading(true);
        try {
          const data = await (publicBookingAPI as any).getAvailableSlots(username, shortcode, selectedDate, selectedDate);
          const dayData = (data.days as any[])?.find((d: any) => d.date === selectedDate);
          const slots = dayData?.slots || [];
          setAvailabilityData((prev) => ({ ...prev, [selectedDate as string]: slots }));
          setAvailableSlots(slots);
        } catch (refetchErr) {
          console.error('Error refetching slots:', refetchErr);
        } finally {
          setSlotsLoading(false);
        }
      } else {
        setSubmitError(err.message || 'Failed to create booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 'form') {
      setStep('calendar');
      setSelectedTime(null);
    }
  };

  // Get display label for current timezone
  const timezoneLabel = useMemo(() => {
    const found = TIMEZONES.find(tz => tz.value === selectedTimezone);
    if (found) return `${found.label}, ${found.region}`;
    // Extract city name from timezone string
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

  // Calculate min/max dates
  const { minDate, maxDate } = useMemo(() => {
    const settings = pageData?.settings;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const min = new Date(today);
    min.setDate(min.getDate() + (settings?.min_notice_hours ? Math.ceil(settings.min_notice_hours / 24) : 0));

    const max = new Date(today);
    max.setDate(max.getDate() + (settings?.max_days_ahead || 60));

    return { minDate: min, maxDate: max };
  }, [pageData?.settings]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error === 'Booking page not found' ? 'Page Not Found' : 'Unavailable'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            to={`/book/${username}`}
            className="inline-flex items-center px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Back to booking page
          </Link>
        </div>
      </div>
    );
  }

  const { host, call_type } = pageData;

  // Confirmed state
  if (step === 'confirmed' && bookingResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-zenible-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A confirmation email has been sent to your email address.
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {call_type.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Date:</strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Time:</strong> {selectedTimeDisplay || formatTime(selectedTime!)} ({timezoneLabel})
            </p>
            {bookingResult.meeting_link && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <strong>Meeting Link:</strong>{' '}
                <a
                  href={bookingResult.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zenible-primary hover:underline"
                >
                  Join Meeting
                </a>
              </p>
            )}
          </div>

          {bookingResult.cancel_token && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need to cancel?{' '}
              <Link
                to={`/booking/cancel/${bookingResult.cancel_token}`}
                className="text-zenible-primary hover:underline"
              >
                Cancel booking
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/book/${username}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to {host.name}
          </Link>

          <div className="flex items-start gap-4">
            {host.avatar_url ? (
              <img
                src={host.avatar_url}
                alt={host.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zenible-primary text-white flex items-center justify-center text-lg font-bold">
                {host.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{host.name}</p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {call_type.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: call_type.color }}
                  />
                )}
                {call_type.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <ClockIcon className="h-4 w-4" />
                <span>{call_type.duration_minutes} minutes</span>
              </div>
            </div>
          </div>

          {call_type.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              {call_type.description}
            </p>
          )}

          {/* Timezone selector */}
          <div className="mt-4 relative inline-block">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-zenible-primary hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => {
                setShowTimezoneSelector(!showTimezoneSelector);
                setTimezoneSearch('');
              }}
            >
              <GlobeAltIcon className="h-4 w-4" />
              <span>{timezoneLabel}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            {showTimezoneSelector && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-zenible-primary dark:bg-gray-700 dark:text-white"
                    placeholder="Search city..."
                    value={timezoneSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimezoneSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredTimezones.map((tz) => (
                    <button
                      key={`${tz.value}-${tz.label}`}
                      type="button"
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        selectedTimezone === tz.value
                          ? 'bg-zenible-primary text-white hover:bg-zenible-primary'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
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
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No matching cities
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit error message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        )}

        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {step === 'calendar' && (
            <div className="md:flex">
              {/* Calendar */}
              <div className="md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Select a Date
                </h2>
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
              <div className="md:w-1/2 p-6">
                {selectedDate && (
                  <p className="text-sm font-semibold text-zenible-primary mb-2">
                    {formatFriendlyDate(selectedDate)}
                  </p>
                )}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Please select a date to see available times.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'form' && (
            <div className="p-6">
              <BookingForm
                date={selectedDate}
                time={selectedTime}
                displayTime={selectedTimeDisplay}
                duration={call_type.duration_minutes}
                timezone={timezoneLabel}
                onSubmit={handleSubmit}
                onBack={handleBack}
                loading={submitting}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Powered by{' '}
            <a href={import.meta.env.VITE_HOME_URL || '/'} className="hover:text-zenible-primary transition-colors">
              Zenible
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicBookingPage;
