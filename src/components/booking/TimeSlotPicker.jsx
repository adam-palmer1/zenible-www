import React from 'react';

const TimeSlotPicker = ({
  slots = [],
  selectedTime,
  onSelect,
  loading = false,
  timezone,
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

  // Format time for display (e.g., "09:00" -> "9:00 AM")
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-2">
      {timezone && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Times shown in {timezone}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map((time) => (
          <button
            key={time}
            onClick={() => onSelect(time)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg border transition-all
              ${selectedTime === time
                ? 'bg-zenible-primary text-white border-zenible-primary'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-zenible-primary hover:text-zenible-primary'
              }
            `}
          >
            {formatTime(time)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotPicker;
