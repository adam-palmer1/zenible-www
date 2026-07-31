import React, { useState, useMemo, useEffect } from 'react';

/** Parse a YYYY-MM or YYYY-MM-DD string into the first of that month. */
const parseMonth = (value?: string | null): Date | null => {
  if (!value) return null;
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return null;
  return new Date(year, month - 1, 1);
};

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
  /**
   * Called with the visible grid range plus the month being displayed (YYYY-MM).
   * The grid range spills into the adjacent months, so `monthKey` is what tells
   * the parent which month the visitor is actually looking at.
   */
  onMonthChange?: (startDate: string, endDate: string, monthKey: string) => void;
  minDate?: Date;
  maxDate?: Date;
  /** ISO date (YYYY-MM-DD); when set, the calendar jumps to that date's month. */
  focusMonth?: string | null;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  availableDates = [],
  selectedDate,
  onSelect,
  onMonthChange,
  minDate,
  maxDate,
  focusMonth,
}) => {
  // Start on focusMonth when the parent already knows it, so the first paint is
  // the right month rather than today's month followed by a visible jump.
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const initial = parseMonth(focusMonth);
    if (initial) return initial;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Jump to the month the parent asks for (e.g. the first month with availability)
  useEffect(() => {
    const target = parseMonth(focusMonth);
    if (!target) return;
    setCurrentMonth((prev) =>
      prev.getFullYear() === target.getFullYear() && prev.getMonth() === target.getMonth()
        ? prev
        : target
    );
  }, [focusMonth]);

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

      const formatDate = (d: Date): string => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      onMonthChange(formatDate(startDate), formatDate(endDate), monthKey);
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
