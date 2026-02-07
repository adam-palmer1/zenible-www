import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon,
  GlobeAltIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

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
import publicBookingAPI from '../../services/api/public/booking';
import BookingCalendar from '../../components/booking/BookingCalendar';
import TimeSlotPicker from '../../components/booking/TimeSlotPicker';

const BookingCancellation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelled, setCancelled] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');

  // Reschedule state
  const [mode, setMode] = useState<'view' | 'cancel' | 'reschedule'>('view');
  const [rescheduling, setRescheduling] = useState<boolean>(false);
  const [rescheduled, setRescheduled] = useState<boolean>(false);
  const [rescheduleResult, setRescheduleResult] = useState<any>(null);

  // Calendar/slot state for rescheduling
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availabilityData, setAvailabilityData] = useState<Record<string, string[]>>({});
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);

  // Timezone state
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [showTimezoneSelector, setShowTimezoneSelector] = useState<boolean>(false);
  const [timezoneSearch, setTimezoneSearch] = useState<string>('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await (publicBookingAPI as any).lookupBooking(token);
        setBooking(data);

        // Set timezone from booking if available
        if (data.timezone) {
          setSelectedTimezone(data.timezone);
        }

        // Check if already cancelled
        if (data.status === 'cancelled') {
          setCancelled(true);
        }
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        if (err.status === 404) {
          setError('Booking not found');
        } else {
          setError(err.message || 'Failed to load booking details');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBooking();
    }
  }, [token]);

  // Format date for display (uses booking timezone for ISO datetime strings)
  const formatDate = (dateStr: string, timezone: string = selectedTimezone): string => {
    if (!dateStr) return '';
    // Handle both ISO datetime and date-only strings
    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: dateStr.includes('T') ? timezone : undefined,
    });
  };

  // Format time for display (uses booking timezone for ISO datetime strings)
  const formatTime = (timeStr: string, timezone: string = selectedTimezone): string => {
    if (!timeStr) return '';
    // If it's an ISO datetime string
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      });
    }
    // If it's HH:MM format
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await (publicBookingAPI as any).cancelBooking(token, reason.trim() || null);
      setCancelled(true);
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  // Fetch availability for rescheduling
  const fetchCalendarAvailability = useCallback(async (startDate: string, endDate: string) => {
    if (!booking?.username || !booking?.call_type_shortcode) return;

    try {
      setSlotsLoading(true);
      const data = await (publicBookingAPI as any).getAvailableSlots(
        booking.username,
        booking.call_type_shortcode,
        startDate,
        endDate
      );

      const newAvailability: Record<string, string[]> = {};
      (data.days as any[])?.forEach((day: any) => {
        if (day.slots && day.slots.length > 0) {
          newAvailability[day.date] = day.slots;
        }
      });

      setAvailabilityData(newAvailability);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailabilityData({});
    } finally {
      setSlotsLoading(false);
    }
  }, [booking?.username, booking?.call_type_shortcode]);

  // Transform availability data to visitor's timezone
  const { availableDates, visitorAvailability } = useMemo(() => {
    const hostTimezone = booking?.host_timezone;
    if (!hostTimezone || hostTimezone === selectedTimezone) {
      return {
        availableDates: Object.keys(availabilityData),
        visitorAvailability: availabilityData,
      };
    }

    const visitorSlots: Record<string, any[]> = {};

    Object.entries(availabilityData).forEach(([hostDate, slots]) => {
      slots.forEach((time) => {
        try {
          const [year, month, day] = hostDate.split('-').map(Number);
          const [hours, minutes] = time.split(':').map(Number);

          const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

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

          const visitorDateFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: selectedTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          const visitorDate = visitorDateFormatter.format(adjustedDate);

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
            time,
            adjustedDate,
            visitorTime: visitorTimeFormatted,
          });
        } catch (e) {
          if (!visitorSlots[hostDate]) {
            visitorSlots[hostDate] = [];
          }
          visitorSlots[hostDate].push({ hostDate, time });
        }
      });
    });

    Object.values(visitorSlots).forEach((slots) => {
      slots.sort((a: any, b: any) => (a.adjustedDate || 0) - (b.adjustedDate || 0));
    });

    return {
      availableDates: Object.keys(visitorSlots).sort(),
      visitorAvailability: visitorSlots,
    };
  }, [availabilityData, booking?.host_timezone, selectedTimezone]);

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    const slotData = visitorAvailability[date] || [];
    setAvailableSlots(slotData);
  };

  // Handle time selection and reschedule
  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);

    try {
      setRescheduling(true);
      setError(null);

      // Find the host date for this slot
      const slot = availableSlots.find((s: any) => (typeof s === 'object' ? s.time : s) === time);
      const hostDate = slot?.hostDate || selectedDate;

      // Combine into ISO datetime
      const newStartDatetime = `${hostDate}T${time}:00`;

      const result = await (publicBookingAPI as any).rescheduleBooking(token, newStartDatetime, selectedTimezone);
      setRescheduleResult(result);
      setRescheduled(true);
    } catch (err: any) {
      console.error('Error rescheduling booking:', err);
      setError(err.message || 'Failed to reschedule booking. The time slot may no longer be available.');
      setSelectedTime(null);
    } finally {
      setRescheduling(false);
    }
  };

  // Calculate min/max dates for calendar
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const min = new Date(today);
    const max = new Date(today);
    max.setDate(max.getDate() + 60);

    return { minDate: min, maxDate: max };
  }, []);

  // Get display label for current timezone
  const timezoneLabel = useMemo(() => {
    const found = TIMEZONES.find(tz => tz.value === selectedTimezone);
    if (found) return `${found.label}, ${found.region}`;
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  // Error state (no booking)
  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error === 'Booking not found' ? 'Booking Not Found' : 'Error'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error === 'Booking not found'
              ? 'This link is invalid or has expired.'
              : error}
          </p>
          <a
            href={import.meta.env.VITE_HOME_URL || '/'}
            className="inline-flex items-center px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Rescheduled success state
  if (rescheduled && rescheduleResult) {
    const newDate = rescheduleResult.new_start_datetime?.split('T')[0];
    const newTime = rescheduleResult.new_start_datetime?.split('T')[1]?.substring(0, 5);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-zenible-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Booking Rescheduled!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your booking has been successfully rescheduled. A confirmation email has been sent.
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {booking.call_type_name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>New time:</strong> {newDate && formatDate(newDate)} at {newTime && formatTime(newTime)}
            </p>
            {rescheduleResult.meeting_link && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <strong>Meeting Link:</strong>{' '}
                <a
                  href={rescheduleResult.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zenible-primary hover:underline"
                >
                  Join Meeting
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Already cancelled or just cancelled success state
  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-zenible-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Booking Cancelled
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your booking has been successfully cancelled. {booking?.host_name} has been notified.
          </p>

          {booking && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{booking.call_type_name}</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(booking.start_datetime)} at {formatTime(booking.start_datetime)}
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Want to reschedule?{' '}
            {booking?.username ? (
              <Link
                to={`/book/${booking.username}`}
                className="text-zenible-primary hover:underline"
              >
                Book a new time
              </Link>
            ) : (
              <span>Contact the host directly.</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Check if booking is in the past
  const isPast = new Date(booking.start_datetime) < new Date();

  // Past booking state
  if (isPast) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Cannot Modify
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This booking has already passed and cannot be modified.
          </p>
          <a
            href={import.meta.env.VITE_HOME_URL || '/'}
            className="inline-flex items-center px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Reschedule mode - show calendar
  if (mode === 'reschedule') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => {
                setMode('view');
                setSelectedDate(null);
                setSelectedTime(null);
                setError(null);
              }}
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reschedule Booking
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Select a new date and time for your {booking.call_type_name} with {booking.host_name}
            </p>

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

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Calendar and slots */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
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
                  onMonthChange={fetchCalendarAvailability}
                  minDate={minDate}
                  maxDate={maxDate}
                />
              </div>

              {/* Time slots */}
              <div className="md:w-1/2 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {selectedDate ? 'Select a Time' : 'Available Times'}
                </h2>
                {selectedDate ? (
                  rescheduling ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400">Rescheduling...</span>
                    </div>
                  ) : (
                    <TimeSlotPicker
                      slots={availableSlots}
                      selectedTime={selectedTime}
                      onSelect={handleTimeSelect}
                      loading={slotsLoading}
                    />
                  )
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Please select a date to see available times.
                  </p>
                )}
              </div>
            </div>
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
  }

  // Cancel confirmation mode
  if (mode === 'cancel') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cancel Booking
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Are you sure you want to cancel this booking?
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Booking Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {booking.call_type_name}
              </h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {booking.host_avatar ? (
                    <img
                      src={booking.host_avatar}
                      alt={booking.host_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zenible-primary text-white flex items-center justify-center font-bold">
                      {booking.host_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-gray-900 dark:text-white">{booking.host_name}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <CalendarIcon className="h-5 w-5" />
                  <span>{formatDate(booking.start_datetime)}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-5 w-5" />
                  <span>
                    {formatTime(booking.start_datetime)} ({booking.duration_minutes} minutes)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Let the host know why you're cancelling..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setMode('view')}
              className="flex-1 px-4 py-3 text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </button>
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
  }

  // Default view mode - show booking details with options
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Booking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Reschedule or cancel your upcoming appointment
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Booking Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {booking.call_type_name}
            </h2>

            <div className="space-y-3">
              {/* Host */}
              <div className="flex items-center gap-3">
                {booking.host_avatar ? (
                  <img
                    src={booking.host_avatar}
                    alt={booking.host_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zenible-primary text-white flex items-center justify-center font-bold">
                    {booking.host_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="text-gray-900 dark:text-white">{booking.host_name}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-5 w-5" />
                <span>{formatDate(booking.start_datetime)}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <ClockIcon className="h-5 w-5" />
                <span>
                  {formatTime(booking.start_datetime)} ({booking.duration_minutes} minutes)
                </span>
              </div>

              {/* Meeting link */}
              {booking.meeting_link && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={booking.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zenible-primary hover:underline text-sm"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode('reschedule')}
            disabled={booking.can_reschedule === false}
            className={`w-full px-4 py-3 font-medium rounded-lg transition-colors ${
              booking.can_reschedule === false
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-zenible-primary text-white hover:bg-opacity-90'
            }`}
          >
            Reschedule Booking
          </button>
          <button
            onClick={() => setMode('cancel')}
            disabled={booking.can_cancel === false}
            className={`w-full px-4 py-3 font-medium rounded-lg border transition-colors ${
              booking.can_cancel === false
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                : 'bg-white dark:bg-gray-800 text-red-600 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            Cancel Booking
          </button>
          {(booking.can_reschedule === false || booking.can_cancel === false) && booking.cancellation_deadline && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              The modification deadline ({formatTime(booking.cancellation_deadline)} on {formatDate(booking.cancellation_deadline)}) has passed.
            </p>
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

export default BookingCancellation;
