import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../layout/AppLayout';
import TabNavigation from './TabNavigation';
import EventCard from './EventCard';
import RegistrationModal from './RegistrationModal';
import { usePreferences } from '../../contexts/PreferencesContext';
import eventsAPI from '../../services/eventsAPI';

// Helper function to determine event status based on datetime and duration
const getEventStatus = (event: any) => {
  const now = new Date();
  const eventDateTime = new Date(event.start_datetime);
  const eventEndTime = new Date(eventDateTime.getTime() + event.duration_minutes * 60000);

  // Live: current time is within event duration
  if (now >= eventDateTime && now <= eventEndTime) {
    return 'live';
  }

  // Recorded: event has ended and has replay URL
  if (now > eventEndTime && event.replay_url) {
    return 'recorded';
  }

  // Upcoming: event hasn't started yet
  if (now < eventDateTime) {
    return 'upcoming';
  }

  // Default to upcoming if no replay available
  return 'upcoming';
};

export default function LiveQA() {
  const { darkMode } = usePreferences();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsAPI.listEvents() as { items?: unknown[] };
      setEvents((data.items || []) as typeof events);
    } catch (err: any) {
      console.error('[LiveQA] Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsAPI.getMyRegistrations() as unknown[];
      setMyEvents((Array.isArray(data) ? data : []) as typeof myEvents);
    } catch (err: any) {
      console.error('[LiveQA] Error fetching my events:', err);
      setError(err.message || 'Failed to load your registered events');
    } finally {
      setLoading(false);
    }
  };

  // Fetch my events when tab changes to 'my-events'
  useEffect(() => {
    if (activeTab === 'my-events') {
      fetchMyEvents();
    }
  }, [activeTab]);

  // Filter events based on active tab
  const getFilteredEvents = () => {
    if (activeTab === 'schedule') {
      return [];
    }

    if (activeTab === 'my-events') {
      // Sort my events: live events first, then by start date
      return [...myEvents].sort((a, b) => {
        const statusA = getEventStatus(a);
        const statusB = getEventStatus(b);

        // Live events come first
        if (statusA === 'live' && statusB !== 'live') return -1;
        if (statusA !== 'live' && statusB === 'live') return 1;

        // Within same status, sort by start date (upcoming first)
        return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
      });
    }

    // Filter by client-side status
    return events.filter(event => {
      const status = getEventStatus(event);
      return status === activeTab;
    });
  };

  const filteredEvents = getFilteredEvents();

  const handleRegisterClick = useCallback(async (event: any) => {
    setSelectedEvent(event);
    setShowRegistrationModal(true);
  }, []);

  const handleUnregisterClick = useCallback(async (event: any) => {
    try {
      await eventsAPI.unregisterFromEvent(event.id);
      // Refresh events after unregistering
      await fetchEvents();
      if (activeTab === 'my-events') {
        await fetchMyEvents();
      }
    } catch (err: any) {
      console.error('[LiveQA] Error unregistering from event:', err);
      alert(err.message || 'Failed to unregister from event');
    }
  }, [activeTab]);

  const handleCloseModal = useCallback(async (registered = false) => {
    setShowRegistrationModal(false);
    setSelectedEvent(null);
    // Refresh events if registration was successful
    if (registered) {
      await fetchEvents();
      if (activeTab === 'my-events') {
        await fetchMyEvents();
      }
    }
  }, [activeTab]);

  return (
    <AppLayout pageTitle="Live Q&A">
      {/* Page Header */}
        <div
          className={`border-b border-solid ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-neutral-200 bg-white'
          }`}
          style={{ height: '64px' }}
        >
          <div className="flex items-center h-full px-4 py-2.5">
            <h1
              className={`font-['Inter'] font-semibold text-[24px] leading-[32px] ${
                darkMode ? 'text-gray-100' : 'text-zinc-950'
              }`}
            >
              Live Q&A Sessions
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-4">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            darkMode={darkMode}
          />
        </div>

        {/* Content Section - Event Cards Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p
                className={`font-['Inter'] text-[16px] ${
                  darkMode ? 'text-gray-400' : 'text-zinc-500'
                }`}
              >
                Loading events...
              </p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <p
                className={`font-['Inter'] text-[16px] ${
                  darkMode ? 'text-red-400' : 'text-red-600'
                }`}
              >
                {error}
              </p>
            </div>
          ) : activeTab === 'schedule' ? (
            <div className="flex items-center justify-center h-64">
              <p
                className={`font-['Inter'] text-[16px] ${
                  darkMode ? 'text-gray-400' : 'text-zinc-500'
                }`}
              >
                Schedule 1:1 sessions coming soon...
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p
                className={`font-['Inter'] text-[16px] ${
                  darkMode ? 'text-gray-400' : 'text-zinc-500'
                }`}
              >
                No {activeTab === 'my-events' ? 'registered' : activeTab} events available
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3.5">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  darkMode={darkMode}
                  onRegisterClick={() => handleRegisterClick(event)}
                  onUnregisterClick={() => handleUnregisterClick(event)}
                />
              ))}
            </div>
          )}
        </div>

      {/* Registration Modal */}
      {showRegistrationModal && selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          onClose={handleCloseModal}
          darkMode={darkMode}
        />
      )}
    </AppLayout>
  );
}
