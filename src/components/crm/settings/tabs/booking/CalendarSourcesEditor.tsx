import React, { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import bookingSettingsAPI from '../../../../../services/api/crm/bookingSettings';
import { useNotification } from '../../../../../contexts/NotificationContext';

interface CalendarConflictSource {
  calendar_id: string;
  calendar_name?: string;
  check_for_conflicts: boolean;
}

interface CalendarAccount {
  token_id: string;
  is_enabled_for_conflicts: boolean;
  account_name?: string;
  google_account_email?: string;
  calendar_sources?: CalendarConflictSource[];
}

const CalendarSourcesEditor = () => {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [originalAccounts, setOriginalAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showSuccess, showError } = useNotification();

  // Load Google accounts with conflict status
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await bookingSettingsAPI.listGoogleAccounts() as { accounts?: any[]; [key: string]: unknown };
      const loaded = data.accounts || [];
      setAccounts(loaded);
      setOriginalAccounts(JSON.parse(JSON.stringify(loaded)));
    } catch (error) {
      console.error('Failed to load Google accounts:', error);
      showError('Failed to load Google accounts');
    } finally {
      setLoading(false);
    }
  };

  // Detect if anything changed from the original state
  const hasChanges = useCallback(() => {
    return JSON.stringify(accounts) !== JSON.stringify(originalAccounts);
  }, [accounts, originalAccounts]);

  const handleToggleAccount = (tokenId: string, enable: boolean) => {
    setAccounts(prev => prev.map(a => {
      if (a.token_id !== tokenId) return a;
      return {
        ...a,
        is_enabled_for_conflicts: enable,
        // When disabling, uncheck all sub-calendars
        calendar_sources: enable ? a.calendar_sources : (a.calendar_sources || []).map(s => ({ ...s, check_for_conflicts: false }))
      };
    }));
  };

  const handleToggleCalendar = (tokenId: string, calendarId: string, enable: boolean) => {
    setAccounts(prev => prev.map(a => {
      if (a.token_id !== tokenId) return a;
      const updatedSources = (a.calendar_sources || []).map(s =>
        s.calendar_id === calendarId ? { ...s, check_for_conflicts: enable } : s
      );
      const anyEnabled = updatedSources.some(s => s.check_for_conflicts);
      return {
        ...a,
        is_enabled_for_conflicts: anyEnabled,
        calendar_sources: updatedSources
      };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // For each account, update conflict sources
      for (const account of accounts) {
        const original = originalAccounts.find(a => a.token_id === account.token_id);
        const origSources = original?.calendar_sources || [];
        const newSources = account.calendar_sources || [];

        // Check if this account's calendar selections changed
        const origChecked = new Set(origSources.filter(s => s.check_for_conflicts).map(s => s.calendar_id));
        const newChecked = new Set(newSources.filter(s => s.check_for_conflicts).map(s => s.calendar_id));

        const sameSelection = origChecked.size === newChecked.size && [...origChecked].every(id => newChecked.has(id));
        if (sameSelection) continue;

        if (newChecked.size === 0 && origChecked.size > 0) {
          // All unchecked — disable the account
          await bookingSettingsAPI.disableAccountConflicts(account.token_id);
        } else if (newChecked.size > 0 && origChecked.size === 0) {
          // Was disabled, now has selections — enable first, then set calendars
          await bookingSettingsAPI.enableAccountConflicts(account.token_id);
          await bookingSettingsAPI.updateCalendarConflictSources(account.token_id, [...newChecked]);
        } else {
          // Update calendar selections
          await bookingSettingsAPI.updateCalendarConflictSources(account.token_id, [...newChecked]);
        }
      }

      showSuccess('Calendar conflict settings saved');

      // Reload to get fresh state from server
      const data = await bookingSettingsAPI.listGoogleAccounts() as { accounts?: any[]; [key: string]: unknown };
      const loaded = data.accounts || [];
      setAccounts(loaded);
      setOriginalAccounts(JSON.parse(JSON.stringify(loaded)));
    } catch (_error) {
      showError('Failed to save calendar settings');
    } finally {
      setSaving(false);
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
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3 p-4">
                <input
                  type="checkbox"
                  checked={account.is_enabled_for_conflicts}
                  onChange={(e) => handleToggleAccount(account.token_id, e.target.checked)}
                  className="h-4 w-4 text-zenible-primary border-gray-300 rounded focus:ring-blue-500"
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
              </div>

              {/* Per-calendar conflict sources */}
              {account.calendar_sources && account.calendar_sources.length > 0 && (
                <div className="px-4 pb-3 ml-11 space-y-1">
                  {account.calendar_sources.map((cal) => (
                    <label
                      key={cal.calendar_id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={cal.check_for_conflicts}
                        onChange={(e) => handleToggleCalendar(account.token_id, cal.calendar_id, e.target.checked)}
                        className="h-3.5 w-3.5 text-zenible-primary border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {cal.calendar_name || cal.calendar_id}
                      </span>
                    </label>
                  ))}
                </div>
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

      {/* Save button */}
      {accounts.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges() || saving}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarSourcesEditor;
