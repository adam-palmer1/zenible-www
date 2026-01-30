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
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No available times for this date.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Please select another date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map((slot) => {
          // Slots can be either strings (simple case) or objects with { time, visitorTime }
          const isObject = typeof slot === 'object';
          const hostTime = isObject ? slot.time : slot;
          const displayTime = isObject && slot.visitorTime ? slot.visitorTime : formatTime(hostTime);

          return (
            <button
              key={hostTime}
              onClick={() => onSelect(hostTime)}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg border transition-all
                ${selectedTime === hostTime
                  ? 'bg-zenible-primary text-white border-zenible-primary'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-zenible-primary hover:text-zenible-primary'
                }
              `}
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
