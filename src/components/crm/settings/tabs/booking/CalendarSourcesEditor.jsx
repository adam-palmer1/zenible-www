import React, { useState, useEffect } from 'react';
import { CalendarIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import bookingSettingsAPI from '../../../../../services/api/crm/bookingSettings';
import { useNotification } from '../../../../../contexts/NotificationContext';

const CalendarSourcesEditor = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const { showSuccess, showError } = useNotification();

  // Load Google accounts with conflict status
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await bookingSettingsAPI.listGoogleAccounts();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Failed to load Google accounts:', error);
      showError('Failed to load Google accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (tokenId, enable) => {
    setTogglingId(tokenId);
    try {
      if (enable) {
        await bookingSettingsAPI.enableAccountConflicts(tokenId);
        showSuccess('Calendar conflict checking enabled');
      } else {
        await bookingSettingsAPI.disableAccountConflicts(tokenId);
        showSuccess('Calendar conflict checking disabled');
      }
      // Refresh list
      const data = await bookingSettingsAPI.listGoogleAccounts();
      setAccounts(data.accounts || []);
    } catch (error) {
      showError('Failed to update calendar settings');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading calendar settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Calendar Conflict Checking
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select which calendars should block booking slots when you have events scheduled.
        </p>
      </div>

      <div className="space-y-3">
        {/* Zenible Calendar - Always enabled */}
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <input
            type="checkbox"
            checked
            disabled
            className="h-4 w-4 text-zenible-primary border-gray-300 rounded focus:ring-blue-500 cursor-not-allowed"
          />
          <CalendarIcon className="h-5 w-5 text-purple-500" />
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              Zenible Calendar
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Appointments in Zenible are automatically checked
            </p>
          </div>
        </div>

        {/* Google Accounts */}
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <div
              key={account.token_id}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <input
                type="checkbox"
                checked={account.is_enabled_for_conflicts}
                onChange={(e) => handleToggle(account.token_id, e.target.checked)}
                disabled={togglingId === account.token_id}
                className="h-4 w-4 text-zenible-primary border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {account.account_name || 'Google Calendar'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {account.google_account_email}
                </p>
              </div>
              {togglingId === account.token_id && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-zenible-primary" />
              )}
            </div>
          ))
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  No Google Calendar connected
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Connect a Google Calendar in the Integrations tab to check for conflicts with your Google events.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSourcesEditor;
