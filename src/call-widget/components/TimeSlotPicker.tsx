import React from 'react';

interface TimeSlot {
  time: string;
  visitorTime?: string;
  hostDate?: string;
  adjustedDate?: Date;
}

interface TimeSlotPickerProps {
  slots?: (string | TimeSlot)[];
  selectedTime?: string | null;
  onSelect: (time: string) => void;
  loading?: boolean;
}

// Simple time formatter for when no conversion is needed
const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots = [],
  selectedTime,
  onSelect,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="zw-loading">
        <div className="zw-spinner" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="zw-no-slots">
        No available times for this date. Please select another date.
      </div>
    );
  }

  return (
    <div>
      <div className="zw-slots-grid">
        {slots.map((slot) => {
          // Slots can be either strings (simple case) or objects with { time, visitorTime }
          const isObject = typeof slot === 'object';
          const hostTime = isObject ? (slot as TimeSlot).time : (slot as string);
          const displayTime = isObject && (slot as TimeSlot).visitorTime ? (slot as TimeSlot).visitorTime : formatTime(hostTime);

          return (
            <button
              key={hostTime}
              onClick={() => onSelect(hostTime)}
              className={`zw-slot ${selectedTime === hostTime ? 'selected' : ''}`}
              type="button"
            >
              {displayTime}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotPicker;
