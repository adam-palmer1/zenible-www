import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../shared';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';

interface UpcomingAppointmentsWidgetProps {
  settings?: Record<string, any>;
  isHovered?: boolean;
}

/**
 * Upcoming Appointments Widget for Dashboard
 * Shows scheduled appointments
 */
const UpcomingAppointmentsWidget = ({ settings = {}, isHovered = false }: UpcomingAppointmentsWidgetProps) => {
  const navigate = useNavigate();
  const { data: appointments, isLoading: loading } = useDashboardWidget('upcomingAppointments');

  const appointmentList = appointments || [];

  // Format date and time
  const formatDateTime = (dateString: string): string => {
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

  const handleViewAll = () => navigate('/calendar');
  const handleAppointmentClick = (id: string) => navigate(`/calendar?appointment=${id}`);

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  return (
    <div className="flex flex-col h-full">
      {appointmentList.length === 0 ? (
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
          <div className="flex-1 overflow-hidden">
            <div
              className="h-full overflow-y-auto space-y-2"
              style={{
                width: isHovered ? '100%' : 'calc(100% + 17px)',
                paddingRight: isHovered ? '0' : '17px',
                transition: 'width 0.2s ease, padding-right 0.2s ease'
              }}
            >
            {appointmentList.map((appointment: any) => (
              <button
                key={appointment.id}
                onClick={() => handleAppointmentClick(appointment.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {appointment.title || 'Untitled'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <ClockIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatDateTime(appointment.start_datetime)}
                    </span>
                  </div>
                  {appointment.location && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {appointment.location.split('\n')[0]}
                    </p>
                  )}
                </div>
              </button>
            ))}
            </div>
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
