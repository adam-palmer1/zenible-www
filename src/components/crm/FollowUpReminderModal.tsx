import React, { useState } from 'react';
import Modal from '../ui/modal/Modal';
import DatePickerCalendar from '../shared/DatePickerCalendar';
import TimePickerInput from '../shared/TimePickerInput';

interface FollowUpReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reminderAt: string) => void;
  contactName: string;
}

const FollowUpReminderModal: React.FC<FollowUpReminderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contactName,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date && !selectedTime) {
      setSelectedTime('09:00');
    }
  };

  const handleConfirm = () => {
    let reminderAt: string;

    if (selectedDate) {
      const date = new Date(selectedDate + 'T00:00:00');
      const [hours, minutes] = (selectedTime || '09:00').split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      reminderAt = date.toISOString();
    } else {
      reminderAt = new Date().toISOString();
    }

    onConfirm(reminderAt);
    handleClose();
  };

  const handleClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      title={`Set Follow-Up Reminder`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Set a follow-up reminder for <span className="font-medium">{contactName}</span>.
          Optionally pick a date and time.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date (optional)
          </label>
          <DatePickerCalendar
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>

        {selectedDate !== '' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time
            </label>
            <TimePickerInput
              value={selectedTime}
              onChange={setSelectedTime}
            />
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          If no date is selected, the reminder will be set as a general follow-up.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary hover:bg-zenible-primary/90 rounded-lg transition-colors"
          >
            Set Reminder
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FollowUpReminderModal;
