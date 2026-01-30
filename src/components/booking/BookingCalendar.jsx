import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BookingCalendar = ({
  availableDates = [],
  selectedDate,
  onSelect,
  onMonthChange,
  minDate,
  maxDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Notify parent of visible date range when month changes
  React.useEffect(() => {
    if (onMonthChange) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);

      // Start from the Sunday of the first week
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      // End on the Saturday of the last week
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

      const formatDate = (d) => d.toISOString().split('T')[0];
      onMonthChange(formatDate(startDate), formatDate(endDate));
    }
  }, [currentMonth, onMonthChange]);

  // Convert available dates to Set for fast lookup
  const availableDateSet = useMemo(() => {
    return new Set(availableDates);
  }, [availableDates]);

  // Get days for current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday of the first week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on the Saturday of the last week
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateAvailable = (date) => {
    const dateStr = formatDateString(date);
    return availableDateSet.has(dateStr);
  };

  const isDateInCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isDateInRange = (date) => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  const isDateSelected = (date) => {
    return selectedDate === formatDateString(date);
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDateString(date) === formatDateString(today);
  };

  const handleDateClick = (date) => {
    if (!isDateAvailable(date) || !isDateInRange(date)) return;
    onSelect(formatDateString(date));
  };

  // Check if we can navigate to previous/next month
  const canGoPrevious = useMemo(() => {
    if (!minDate) return true;
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const lastDayOfPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    return lastDayOfPrevMonth >= minDate;
  }, [currentMonth, minDate]);

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const firstDayOfNextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return firstDayOfNextMonth <= maxDate;
  }, [currentMonth, maxDate]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const available = isDateAvailable(date);
          const inCurrentMonth = isDateInCurrentMonth(date);
          const inRange = isDateInRange(date);
          const selected = isDateSelected(date);
          const today = isToday(date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!available || !inRange}
              className={`
                relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                transition-all duration-150
                ${!inCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                ${inCurrentMonth && !available ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : ''}
                ${inCurrentMonth && available && !selected ? 'text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' : ''}
                ${selected ? 'bg-zenible-primary text-white' : ''}
                ${today && !selected ? 'ring-1 ring-zenible-primary' : ''}
              `}
            >
              {date.getDate()}
              {available && !selected && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Available</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
