import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import bookingSettingsAPI from '../../../../../services/api/crm/bookingSettings';
import { useNotification } from '../../../../../contexts/NotificationContext';

const DAYS = [
  { index: 0, name: 'Monday' },
  { index: 1, name: 'Tuesday' },
  { index: 2, name: 'Wednesday' },
  { index: 3, name: 'Thursday' },
  { index: 4, name: 'Friday' },
  { index: 5, name: 'Saturday' },
  { index: 6, name: 'Sunday' },
];

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '17:00';

interface AvailabilityWindow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  isNew?: boolean;
}

const AvailabilityEditor = ({ callTypeId = null }: { callTypeId?: string | null }) => {
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { showSuccess, showError } = useNotification();

  // Load availability windows
  useEffect(() => {
    const loadWindows = async () => {
      try {
        const data = await bookingSettingsAPI.listAvailability(callTypeId) as { windows?: any[]; [key: string]: unknown };
        setWindows(data.windows || []);
      } catch (error) {
        showError('Failed to load availability');
        console.error('Failed to load availability:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWindows();
  }, [callTypeId, showError]);

  // Group windows by day
  const windowsByDay = DAYS.map((day) => ({
    ...day,
    windows: windows.filter((w) => w.day_of_week === day.index),
  }));

  const addWindow = (dayIndex: number) => {
    const newWindow = {
      id: `temp-${Date.now()}`,
      day_of_week: dayIndex,
      start_time: DEFAULT_START_TIME,
      end_time: DEFAULT_END_TIME,
      is_active: true,
      isNew: true,
    };
    setWindows([...windows, newWindow]);
    setHasChanges(true);
  };

  const updateWindow = (windowId: string, field: string, value: any) => {
    setWindows(windows.map((w) =>
      w.id === windowId ? { ...w, [field]: value } : w
    ));
    setHasChanges(true);
  };

  const removeWindow = (windowId: string) => {
    setWindows(windows.filter((w) => w.id !== windowId));
    setHasChanges(true);
  };

  const toggleDay = (dayIndex: number) => {
    const dayWindows = windows.filter((w) => w.day_of_week === dayIndex);
    if (dayWindows.length > 0) {
      // Remove all windows for this day
      setWindows(windows.filter((w) => w.day_of_week !== dayIndex));
    } else {
      // Add default window for this day
      addWindow(dayIndex);
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare windows data for bulk update
      const windowsData = windows.map((w) => ({
        day_of_week: w.day_of_week,
        start_time: w.start_time,
        end_time: w.end_time,
        is_active: w.is_active,
      }));

      const data = await bookingSettingsAPI.bulkUpdateAvailability({
        call_type_id: callTypeId,
        windows: windowsData,
      }) as { windows?: any[]; [key: string]: unknown };

      setWindows(data.windows || []);
      setHasChanges(false);
      showSuccess('Availability saved successfully');
    } catch (error) {
      showError('Failed to save availability');
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time: string) => {
    // Handle both HH:MM and HH:MM:SS formats
    return time?.slice(0, 5) || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading availability...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Weekly Availability
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set your available hours for each day of the week. You can add multiple time windows per day.
        </p>
      </div>

      <div className="space-y-4">
        {windowsByDay.map(({ index, name, windows: dayWindows }) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            {/* Day toggle */}
            <div className="flex items-center min-w-[140px]">
              <button
                type="button"
                onClick={() => toggleDay(index)}
                className={`
                  relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${dayWindows.length > 0 ? 'bg-zenible-primary' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0
                    transition duration-200 ease-in-out
                    ${dayWindows.length > 0 ? 'translate-x-4' : 'translate-x-0'}
                  `}
                />
              </button>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                {name}
              </span>
            </div>

            {/* Time windows */}
            <div className="flex-1">
              {dayWindows.length === 0 ? (
                <span className="text-sm text-gray-500 dark:text-gray-400">Unavailable</span>
              ) : (
                <div className="space-y-2">
                  {dayWindows.map((window) => (
                    <div key={window.id} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={formatTime(window.start_time)}
                        onChange={(e) => updateWindow(window.id, 'start_time', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-gray-500 dark:text-gray-400">to</span>
                      <input
                        type="time"
                        value={formatTime(window.end_time)}
                        onChange={(e) => updateWindow(window.id, 'end_time', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => removeWindow(window.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove time window"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add time window button */}
              {dayWindows.length > 0 && (
                <button
                  onClick={() => addWindow(index)}
                  className="mt-2 flex items-center gap-1 text-sm text-zenible-primary hover:text-opacity-80 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add hours
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  );
};

export default AvailabilityEditor;
