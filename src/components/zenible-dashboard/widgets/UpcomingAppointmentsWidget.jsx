import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import appointmentsAPI from '../../../services/api/crm/appointments';

/**
 * Upcoming Appointments Widget for Dashboard
 * Shows scheduled appointments
 *
 * Settings:
 * - days: Number of days ahead to look (default: 7)
 * - limit: Max appointments to display (default: 5)
 */
const UpcomingAppointmentsWidget = ({ settings = {} }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = settings.days || 7;
  const limit = settings.limit || 5;

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const response = await appointmentsAPI.list({
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          per_page: limit,
        });

        // Sort by start_time
        const sorted = (response.items || response || [])
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .slice(0, limit);

        setAppointments(sorted);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [days, limit]);

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      call: 'bg-blue-100 text-blue-700',
      meeting: 'bg-purple-100 text-purple-700',
      follow_up: 'bg-amber-100 text-amber-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const handleViewAll = () => navigate('/crm?tab=calendar');
  const handleAppointmentClick = (id) => navigate(`/crm?tab=calendar&appointment=${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[180px]">
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No upcoming appointments</p>
          <button
            onClick={handleViewAll}
            className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
          >
            Schedule an appointment
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {appointments.map((appointment) => (
              <button
                key={appointment.id}
                onClick={() => handleAppointmentClick(appointment.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appointment.title || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <ClockIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDateTime(appointment.start_time)}
                      </span>
                    </div>
                    {appointment.contact && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        with {appointment.contact.display_name || appointment.contact.first_name}
                      </p>
                    )}
                  </div>
                  {appointment.appointment_type && (
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getTypeColor(appointment.appointment_type)}`}>
                      {appointment.appointment_type}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
            >
              View calendar
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UpcomingAppointmentsWidget;
