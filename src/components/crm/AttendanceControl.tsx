import React, { useState } from 'react';
import { CheckIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import bookingWebhooksAPI from '../../services/api/crm/bookingWebhooks';
import { useNotification } from '../../contexts/NotificationContext';
import logger from '../../utils/logger';

/**
 * Attended / no-show toggle for a past booking.
 *
 * Zenible is the system of record for attendance, so marking here also emits
 * the booking.completed / booking.no_show webhooks. Clicking the active state
 * again clears the mark (which emits nothing — there is no "un-happened"
 * event).
 */

interface AttendanceControlProps {
  appointmentId: string;
  value?: 'completed' | 'no_show' | null;
  onChange?: (next: 'completed' | 'no_show' | null) => void;
}

const AttendanceControl: React.FC<AttendanceControlProps> = ({
  appointmentId,
  value = null,
  onChange,
}) => {
  const { showError } = useNotification();
  const [status, setStatus] = useState<'completed' | 'no_show' | null>(value);
  const [saving, setSaving] = useState(false);

  const set = async (next: 'completed' | 'no_show') => {
    // Clicking the active option clears it.
    const target = status === next ? null : next;
    const previous = status;

    setSaving(true);
    setStatus(target);
    try {
      await bookingWebhooksAPI.markAttendance(appointmentId, target);
      onChange?.(target);
    } catch (err) {
      setStatus(previous);
      logger.error('Failed to mark attendance:', err);
      showError('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  const base =
    'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-50';

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Attendance">
      <button
        type="button"
        onClick={() => set('completed')}
        disabled={saving}
        aria-pressed={status === 'completed'}
        title="Mark as attended"
        className={`${base} ${
          status === 'completed'
            ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
            : 'text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
        }`}
      >
        <CheckIcon className="h-3.5 w-3.5" />
        Attended
      </button>
      <button
        type="button"
        onClick={() => set('no_show')}
        disabled={saving}
        aria-pressed={status === 'no_show'}
        title="Mark as no-show"
        className={`${base} ${
          status === 'no_show'
            ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
            : 'text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
        }`}
      >
        <NoSymbolIcon className="h-3.5 w-3.5" />
        No-show
      </button>
    </div>
  );
};

export default AttendanceControl;
