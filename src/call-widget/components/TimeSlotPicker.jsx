import React from 'react';

// Simple time formatter for when no conversion is needed
const formatTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const TimeSlotPicker = ({
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
          const hostTime = isObject ? slot.time : slot;
          const displayTime = isObject && slot.visitorTime ? slot.visitorTime : formatTime(hostTime);

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
