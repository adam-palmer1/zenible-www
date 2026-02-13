import React, { useState, useMemo, useEffect } from 'react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Inline SVG icons
const ChevronLeftIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="zw-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="zw-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

interface BookingCalendarProps {
  availableDates?: string[];
  selectedDate?: string | null;
  onSelect: (date: string) => void;
  onMonthChange?: (startDate: string, endDate: string) => void;
  minDate?: Date;
  maxDate?: Date;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  availableDates = [],
  selectedDate,
  onSelect,
  onMonthChange,
  minDate,
  maxDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Convert available dates to Set for fast lookup
  const availableDateSet = useMemo(() => {
    return new Set(availableDates);
  }, [availableDates]);

  // Notify parent of visible date range when month changes
  useEffect(() => {
    if (onMonthChange) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + ((7 - endDate.getDay()) % 7));

      const formatDate = (d: Date): string => d.toISOString().split('T')[0];
      onMonthChange(formatDate(startDate), formatDate(endDate));
    }
  }, [currentMonth, onMonthChange]);

  // Get days for current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + ((7 - endDate.getDay()) % 7));

    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = (): void => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = (): void => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = formatDateString(date);
    return availableDateSet.has(dateStr);
  };

  const isDateInCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isDateInRange = (date: Date): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  const isDateSelected = (date: Date): boolean => {
    return selectedDate === formatDateString(date);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDateString(date) === formatDateString(today);
  };

  const handleDateClick = (date: Date): void => {
    if (!isDateAvailable(date) || !isDateInRange(date)) return;
    onSelect(formatDateString(date));
  };

  const canGoPrevious = useMemo(() => {
    if (!minDate) return true;
    const lastDayOfPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    return lastDayOfPrevMonth >= minDate;
  }, [currentMonth, minDate]);

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const firstDayOfNextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return firstDayOfNextMonth <= maxDate;
  }, [currentMonth, maxDate]);

  return (
    <div className="zw-calendar">
      {/* Header */}
      <div className="zw-calendar-header">
        <h3 className="zw-calendar-title">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="zw-calendar-nav">
          <button
            onClick={goToPreviousMonth}
            disabled={!canGoPrevious}
            className="zw-nav-btn"
            type="button"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="zw-nav-btn"
            type="button"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="zw-calendar-grid">
        {/* Day headers */}
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="zw-day-header">
            {day}
          </div>
        ))}

        {/* Days */}
        {calendarDays.map((date, index) => {
          const available = isDateAvailable(date);
          const inCurrentMonth = isDateInCurrentMonth(date);
          const inRange = isDateInRange(date);
          const selected = isDateSelected(date);
          const today = isToday(date);

          const className = [
            'zw-day',
            !inCurrentMonth && 'outside-month',
            today && 'today',
            selected && 'selected',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!available || !inRange}
              className={className}
              type="button"
            >
              {date.getDate()}
              {available && !selected && (
                <span className="zw-day-indicator" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="zw-calendar-legend">
        <span className="zw-legend-dot" />
        <span>Available</span>
      </div>
    </div>
  );
};

export default BookingCalendar;
