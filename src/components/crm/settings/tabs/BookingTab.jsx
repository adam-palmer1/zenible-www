import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import bookingSettingsAPI from '../../../../services/api/crm/bookingSettings';
import { useNotification } from '../../../../contexts/NotificationContext';
import BookingGeneralSettings from './booking/BookingGeneralSettings';
import AvailabilityEditor from './booking/AvailabilityEditor';
import CallTypesList from './booking/CallTypesList';

/**
 * Booking Tab - Call booking settings and configuration
 */
const BookingTab = ({ onUnsavedChanges }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');

  const { user } = useAuth();
  const { showError } = useNotification();

  // Load booking settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await bookingSettingsAPI.get();
        setSettings(data);
      } catch (error) {
        showError('Failed to load booking settings');
        console.error('Failed to load booking settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [showError]);

  const handleSettingsUpdate = (updatedSettings) => {
    setSettings(updatedSettings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading booking settings...</div>
      </div>
    );
  }

  const sections = [
    { id: 'general', label: 'General Settings' },
    { id: 'availability', label: 'Availability' },
    { id: 'call-types', label: 'Call Types' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeSection === section.id
                  ? 'border-zenible-primary text-zenible-primary dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Public Booking URL */}
      {settings?.booking_page_enabled && user?.username && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Your public booking page:{' '}
            <a
              href={`${window.location.origin}/book/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:no-underline"
            >
              {window.location.origin}/book/{user.username}
            </a>
          </p>
        </div>
      )}

      {/* Section Content */}
      <div className="mt-6">
        {activeSection === 'general' && (
          <BookingGeneralSettings
            settings={settings}
            onUpdate={handleSettingsUpdate}
            onUnsavedChanges={onUnsavedChanges}
          />
        )}
        {activeSection === 'availability' && (
          <AvailabilityEditor />
        )}
        {activeSection === 'call-types' && (
          <CallTypesList />
        )}
      </div>
    </div>
  );
};

export default BookingTab;
