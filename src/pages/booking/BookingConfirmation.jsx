import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircleIcon, CalendarIcon, ClockIcon, VideoCameraIcon, MapPinIcon } from '@heroicons/react/24/outline';
import publicBookingAPI from '../../services/api/public/booking';

const BookingConfirmation = () => {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await publicBookingAPI.lookupBooking(token);
        setBooking(data);
      } catch (err) {
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

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Generate calendar links
  const generateCalendarLinks = (booking) => {
    const startDate = new Date(`${booking.date}T${booking.time}`);
    const endDate = new Date(startDate.getTime() + booking.duration_minutes * 60000);

    const formatForCalendar = (date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    };

    const title = encodeURIComponent(`${booking.call_type_name} with ${booking.host_name}`);
    const details = encodeURIComponent(booking.meeting_link ? `Meeting link: ${booking.meeting_link}` : '');
    const location = encodeURIComponent(booking.meeting_link || '');

    // Google Calendar
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatForCalendar(startDate)}/${formatForCalendar(endDate)}&details=${details}&location=${location}`;

    // Outlook Calendar
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${details}&location=${location}`;

    return { googleUrl, outlookUrl };
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
            {error === 'Booking not found' ? 'Booking Not Found' : 'Error'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error === 'Booking not found'
              ? 'This booking confirmation link is invalid or has expired.'
              : error}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const calendarLinks = generateCalendarLinks(booking);
  const isCancelled = booking.status === 'cancelled';
  const isPast = new Date(`${booking.date}T${booking.time}`) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Status Header */}
        <div className="text-center mb-8">
          {isCancelled ? (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✕</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Booking Cancelled
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                This booking has been cancelled.
              </p>
            </>
          ) : isPast ? (
            <>
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Past Booking
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                This booking has already occurred.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Booking Confirmed
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Your call has been scheduled.
              </p>
            </>
          )}
        </div>

        {/* Booking Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {booking.call_type_name}
            </h2>

            <div className="space-y-4">
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
                <span>{formatDate(booking.date)}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <ClockIcon className="h-5 w-5" />
                <span>
                  {formatTime(booking.time)} ({booking.duration_minutes} minutes)
                </span>
              </div>

              {/* Timezone */}
              {booking.timezone && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="h-5 w-5" />
                  <span>{booking.timezone}</span>
                </div>
              )}

              {/* Meeting Link */}
              {booking.meeting_link && !isCancelled && !isPast && (
                <div className="flex items-center gap-3">
                  <VideoCameraIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <a
                    href={booking.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zenible-primary hover:underline"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isCancelled && !isPast && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Add to Calendar
              </h3>
              <div className="flex flex-wrap gap-2">
                <a
                  href={calendarLinks.googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Google Calendar
                </a>
                <a
                  href={calendarLinks.outlookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Outlook
                </a>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Need to make changes?{' '}
                  <Link
                    to={`/booking/cancel/${token}`}
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    Cancel this booking
                  </Link>
                </p>
              </div>
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

export default BookingConfirmation;
