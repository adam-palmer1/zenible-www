import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import publicBookingAPI from '../../services/api/public/booking';
import BookingCalendar from '../../components/booking/BookingCalendar';
import TimeSlotPicker from '../../components/booking/TimeSlotPicker';
import BookingForm from '../../components/booking/BookingForm';

const PublicBookingPage = () => {
  const { username, shortcode } = useParams();

  // Page data state
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking flow state
  const [step, setStep] = useState('calendar'); // 'calendar', 'form', 'confirmed'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Fetch call type page data
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await publicBookingAPI.getCallTypePage(username, shortcode);
        setPageData(data);
      } catch (err) {
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

  // Fetch available slots when date changes
  const fetchSlots = useCallback(async (date) => {
    if (!date) return;

    try {
      setSlotsLoading(true);
      setAvailableSlots([]);

      // Fetch slots for the selected date (start and end same date)
      const data = await publicBookingAPI.getAvailableSlots(
        username,
        shortcode,
        date,
        date
      );

      // Extract slots for the selected date
      const dateSlots = data.available_slots?.[date] || [];
      setAvailableSlots(dateSlots);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [username, shortcode]);

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    fetchSlots(date);
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep('form');
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const bookingData = {
        date: selectedDate,
        time: selectedTime,
        timezone: pageData?.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        guest_name: formData.name,
        guest_email: formData.email,
        guest_phone: formData.phone || null,
        notes: formData.notes || null,
      };

      const result = await publicBookingAPI.createBooking(username, shortcode, bookingData);
      setBookingResult(result);
      setStep('confirmed');
    } catch (err) {
      console.error('Error creating booking:', err);
      if (err.status === 409) {
        setSubmitError('This time slot is no longer available. Please select another time.');
        setStep('calendar');
        setSelectedTime(null);
        fetchSlots(selectedDate);
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

  const { host, call_type, settings } = pageData;
  const timezone = settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Generate available dates (next 60 days as placeholder - actual availability comes from API)
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + (settings?.min_notice_hours ? Math.ceil(settings.min_notice_hours / 24) : 0));
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + (settings?.max_days_ahead || 60));

  // For now, mark all dates as potentially available - the time slot API will filter
  const availableDates = [];
  const current = new Date(minDate);
  while (current <= maxDate) {
    availableDates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  // Confirmed state
  if (step === 'confirmed' && bookingResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
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
              <strong>Time:</strong> {selectedTime} ({timezone})
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
                  <TimeSlotPicker
                    slots={availableSlots}
                    selectedTime={selectedTime}
                    onSelect={handleTimeSelect}
                    loading={slotsLoading}
                    timezone={timezone}
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
                duration={call_type.duration_minutes}
                timezone={timezone}
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
            <a href="/" className="hover:text-zenible-primary transition-colors">
              Zenible
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicBookingPage;
