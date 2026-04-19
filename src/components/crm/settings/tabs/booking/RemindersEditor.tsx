import React, { useCallback, useEffect, useState } from 'react';
import {
  BellAlertIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import logger from '../../../../../utils/logger';
import bookingRemindersAPI, {
  BookingReminderRule,
} from '../../../../../services/api/crm/bookingReminders';
import { useNotification } from '../../../../../contexts/NotificationContext';
import { useEscapeKey } from '../../../../../hooks/useEscapeKey';
import { useDeleteConfirmation } from '../../../../../hooks/useDeleteConfirmation';
import ConfirmationModal from '../../../../common/ConfirmationModal';

type TimeUnit = 'hours' | 'days';
type PickerField = 'amount' | 'unit';

interface ReminderRowState {
  slot: number;
  amount: number;
  unit: TimeUnit;
  send_email: boolean;
  send_sms: boolean;
}

interface PickerState {
  rowIndex: number;
  field: PickerField;
}

const MAX_REMINDERS = 3;
const HOURS_RANGE = Array.from({ length: 24 }, (_, i) => i + 1);   // 1..24
const DAYS_RANGE = Array.from({ length: 30 }, (_, i) => i + 1);    // 1..30

const UNIT_OPTIONS: { value: TimeUnit; label: string }[] = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

const fromRule = (rule: BookingReminderRule): ReminderRowState => {
  const useDays = rule.offset_hours % 24 === 0 && rule.offset_hours >= 24;
  return {
    slot: rule.slot,
    amount: useDays ? rule.offset_hours / 24 : rule.offset_hours,
    unit: useDays ? 'days' : 'hours',
    send_email: rule.send_email,
    send_sms: rule.send_sms,
  };
};

const toPayload = (row: ReminderRowState) => ({
  slot: row.slot,
  offset_hours: row.unit === 'days' ? row.amount * 24 : row.amount,
  send_email: row.send_email,
  send_sms: row.send_sms,
});

const unitLabel = (unit: TimeUnit) =>
  UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? unit;

const RemindersEditor: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [rows, setRows] = useState<ReminderRowState[]>([]);
  const [original, setOriginal] = useState<ReminderRowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smsTemplate, setSmsTemplate] = useState<string>('');
  const [smsEnabled, setSmsEnabled] = useState<boolean>(false);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const deleteConfirm = useDeleteConfirmation<number>();

  useEscapeKey(() => setPicker(null), picker !== null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, tpl] = await Promise.all([
          bookingRemindersAPI.list(),
          bookingRemindersAPI.getSmsTemplate(),
        ]);
        if (cancelled) return;
        const loaded = (list.items || []).map(fromRule);
        setRows(loaded);
        setOriginal(JSON.parse(JSON.stringify(loaded)));
        setSmsTemplate(tpl.template);
        setSmsEnabled(tpl.sms_enabled);
      } catch (e) {
        logger.error(e);
        showError('Failed to load reminder settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  const hasChanges = useCallback(
    () => JSON.stringify(rows) !== JSON.stringify(original),
    [rows, original],
  );

  const nextFreeSlot = (): number => {
    const used = new Set(rows.map((r) => r.slot));
    for (let i = 1; i <= MAX_REMINDERS; i += 1) if (!used.has(i)) return i;
    return rows.length + 1;
  };

  const handleAdd = () => {
    if (rows.length >= MAX_REMINDERS) return;
    setRows((prev) => [
      ...prev,
      {
        slot: nextFreeSlot(),
        amount: 1,
        unit: 'hours',
        send_email: true,
        send_sms: false,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    deleteConfirm.requestDelete(index);
  };

  const confirmRemove = async () => {
    await deleteConfirm.confirmDelete(async (index) => {
      setRows((prev) => prev.filter((_, i) => i !== index));
    });
  };

  const setRow = (index: number, next: Partial<ReminderRowState>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...next } : row)));
  };

  const handleUnitChange = (index: number, unit: TimeUnit) => {
    const row = rows[index];
    const maxForUnit = unit === 'hours' ? 24 : 30;
    const amount = Math.min(Math.max(1, row.amount), maxForUnit);
    setRow(index, { unit, amount });
  };

  const validate = (): string | null => {
    for (const row of rows) {
      if (!row.send_email && !(smsEnabled && row.send_sms)) {
        return 'Each reminder must have at least Email or SMS selected.';
      }
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      showError(error);
      return;
    }
    setSaving(true);
    try {
      const resp = await bookingRemindersAPI.replace(rows.map(toPayload));
      const loaded = (resp.items || []).map(fromRule);
      setRows(loaded);
      setOriginal(JSON.parse(JSON.stringify(loaded)));
      showSuccess('Reminder settings saved');
    } catch (e) {
      logger.error(e);
      showError('Failed to save reminder settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading reminder settings…</div>
      </div>
    );
  }

  const PickerButton: React.FC<{
    label: string;
    onClick: () => void;
    className?: string;
  }> = ({ label, onClick, className = '' }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between gap-2 hover:border-zenible-primary transition-colors ${className}`}
    >
      <span className="text-gray-900 dark:text-white text-sm">{label}</span>
      <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
    </button>
  );

  const renderPicker = () => {
    if (!picker) return null;
    const row = rows[picker.rowIndex];
    if (!row) return null;

    let title: string;
    let options: { value: string | number; label: string }[];
    let current: string | number;
    let onPick: (value: string | number) => void;

    if (picker.field === 'amount') {
      const range = row.unit === 'hours' ? HOURS_RANGE : DAYS_RANGE;
      title = row.unit === 'hours' ? 'Select Hours' : 'Select Days';
      options = range.map((n) => ({
        value: n,
        label: `${n} ${row.unit === 'hours' ? (n === 1 ? 'hour' : 'hours') : (n === 1 ? 'day' : 'days')}`,
      }));
      current = row.amount;
      onPick = (value) => {
        setRow(picker.rowIndex, { amount: Number(value) });
        setPicker(null);
      };
    } else {
      title = 'Select Unit';
      options = UNIT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
      current = row.unit;
      onPick = (value) => {
        handleUnitChange(picker.rowIndex, value as TimeUnit);
        setPicker(null);
      };
    }

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setPicker(null)}
        />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xs">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={() => setPicker(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              type="button"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onPick(opt.value)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg ${
                  current === opt.value
                    ? 'bg-zenible-primary/10 text-zenible-primary'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Booking Reminders
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Send up to {MAX_REMINDERS} automatic reminders to the guest before the
          appointment.
        </p>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <BellAlertIcon className="h-6 w-6 mx-auto text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">
              No reminders configured. Add one below.
            </p>
          </div>
        )}

        {rows.map((row, idx) => (
          <div
            key={`${row.slot}-${idx}`}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Reminder {idx + 1}:
              </span>

              <PickerButton
                label={String(row.amount)}
                onClick={() => setPicker({ rowIndex: idx, field: 'amount' })}
                className="w-20"
              />

              <PickerButton
                label={unitLabel(row.unit)}
                onClick={() => setPicker({ rowIndex: idx, field: 'unit' })}
                className="w-28"
              />

              <span className="text-sm text-gray-600 dark:text-gray-300">
                before appointment
              </span>

              <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 ml-2">
                <input
                  type="checkbox"
                  checked={row.send_email}
                  onChange={(e) => setRow(idx, { send_email: e.target.checked })}
                  className="h-4 w-4 text-zenible-primary border-gray-300 rounded focus:ring-blue-500"
                />
                Email
              </label>

              <label
                className={`flex items-center gap-1.5 text-sm ${
                  smsEnabled
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                title={
                  smsEnabled
                    ? undefined
                    : 'SMS is not configured. Contact your administrator.'
                }
              >
                <input
                  type="checkbox"
                  checked={smsEnabled && row.send_sms}
                  disabled={!smsEnabled}
                  onChange={(e) => setRow(idx, { send_sms: e.target.checked })}
                  className="h-4 w-4 text-zenible-primary border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                SMS
              </label>

              <button
                onClick={() => handleRemove(idx)}
                className="ml-auto p-1.5 text-gray-400 hover:text-red-500"
                aria-label="Delete reminder"
                type="button"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}

        {rows.length < MAX_REMINDERS && (
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zenible-primary border border-zenible-primary rounded-lg hover:bg-zenible-primary/10"
          >
            <PlusIcon className="h-4 w-4" />
            Add reminder
          </button>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          SMS reminder message
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          The SMS body is fixed and cannot be edited. To customise the email
          version, go to Email Templates → Booking Reminder.
        </p>
        <pre className="mt-3 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-200 font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3">
{smsTemplate}
        </pre>
        {!smsEnabled && (
          <div className="mt-3 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
            SMS reminders are currently disabled — Twilio is not configured.
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges() || saving}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          type="button"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {renderPicker()}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.cancelDelete}
        onConfirm={confirmRemove}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
};

export default RemindersEditor;
