import React, { useState, useEffect } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../../contexts/AuthContext';
import bookingSettingsAPI from '../../../../services/api/crm/bookingSettings';
import { useNotification } from '../../../../contexts/NotificationContext';
import BookingGeneralSettings from './booking/BookingGeneralSettings';
import AvailabilityEditor from './booking/AvailabilityEditor';
import CallTypesList from './booking/CallTypesList';
import CalendarSourcesEditor from './booking/CalendarSourcesEditor';
import EmbedSettings from './booking/EmbedSettings';

/**
 * Booking Tab - Call booking settings and configuration
 */
const BookingTab = ({ onUnsavedChanges }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const { showError } = useNotification();

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/book/${user.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
    { id: 'calendars', label: 'Calendar Sources' },
    { id: 'embed', label: 'Embed Widget' },
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
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Your public booking page:{' '}
              <a
                href={`${window.location.origin}/book/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zenible-primary hover:underline"
              >
                {window.location.origin}/book/{user.username}
              </a>
            </p>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1 px-2 py-1 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded transition-colors"
              title="Copy URL"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
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
        {activeSection === 'calendars' && (
          <CalendarSourcesEditor />
        )}
        {activeSection === 'embed' && (
          <EmbedSettings username={user?.username} />
        )}
      </div>
    </div>
  );
};

export default BookingTab;
