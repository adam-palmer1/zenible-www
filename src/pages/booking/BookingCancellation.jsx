import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExclamationTriangleIcon, CheckCircleIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import publicBookingAPI from '../../services/api/public/booking';

const BookingCancellation = () => {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await publicBookingAPI.lookupBooking(token);
        setBooking(data);

        // Check if already cancelled
        if (data.status === 'cancelled') {
          setCancelled(true);
        }
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

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await publicBookingAPI.cancelBooking(token, reason.trim() || null);
      setCancelled(true);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
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
  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error === 'Booking not found' ? 'Booking Not Found' : 'Error'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error === 'Booking not found'
              ? 'This cancellation link is invalid or has expired.'
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

  // Already cancelled or just cancelled success state
  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
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
                {formatDate(booking.date)} at {formatTime(booking.time)}
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Want to reschedule?{' '}
            {booking?.host_username ? (
              <Link
                to={`/book/${booking.host_username}`}
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
  const isPast = new Date(`${booking.date}T${booking.time}`) < new Date();

  // Past booking state
  if (isPast) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Cannot Cancel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This booking has already passed and cannot be cancelled.
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
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Let the host know why you're cancelling..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/booking/confirm/${token}`}
            className="flex-1 px-4 py-3 text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Keep Booking
          </Link>
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
};

export default BookingCancellation;
