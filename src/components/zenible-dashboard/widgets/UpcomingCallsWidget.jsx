import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneIcon, ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import appointmentsAPI from '../../../services/api/crm/appointments';

/**
 * Upcoming Calls Widget for Dashboard
 * Shows scheduled calls (appointments with type 'call')
 *
 * Settings:
 * - days: Number of days ahead to look (default: 7)
 * - limit: Max calls to display (default: 5)
 */
const UpcomingCallsWidget = ({ settings = {}, isHovered = false }) => {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = settings.days || 7;
  const limit = settings.limit || 5;

  useEffect(() => {
    const loadCalls = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const response = await appointmentsAPI.list({
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          appointment_type: 'call',
          per_page: limit,
        });

        // Sort by start_time
        const sorted = (response.items || response || [])
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .slice(0, limit);

        setCalls(sorted);
      } catch (error) {
        console.error('Failed to load calls:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCalls();
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

  // Check if call is soon (within 1 hour)
  const isCallSoon = (dateString) => {
    const callTime = new Date(dateString);
    const now = new Date();
    const diffMs = callTime - now;
    return diffMs > 0 && diffMs < 60 * 60 * 1000; // Within 1 hour
  };

  const handleViewAll = () => navigate('/crm?tab=calendar&filter=calls');
  const handleCallClick = (id) => navigate(`/crm?tab=calendar&appointment=${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <PhoneIcon className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No upcoming calls</p>
          <button
            onClick={handleViewAll}
            className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
          >
            Schedule a call
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
            {calls.map((call) => {
              const soon = isCallSoon(call.start_time);

              return (
                <button
                  key={call.id}
                  onClick={() => handleCallClick(call.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all group ${
                    soon
                      ? 'border-green-200 bg-green-50 hover:border-green-400'
                      : 'border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${soon ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <PhoneIcon className={`w-4 h-4 ${soon ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {call.title || 'Phone Call'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <ClockIcon className="w-3 h-3 text-gray-400" />
                          <span className={`text-xs ${soon ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                            {formatDateTime(call.start_time)}
                          </span>
                        </div>
                        {call.contact && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            with {call.contact.display_name || call.contact.first_name}
                          </p>
                        )}
                      </div>
                    </div>
                    {soon && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                        Soon
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
            >
              View all calls
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UpcomingCallsWidget;
