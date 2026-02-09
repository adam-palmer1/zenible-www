import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DatePickerCalendarProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  error?: boolean;
  className?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({ value, onChange, error = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const selectedDay = value ? new Date(value + 'T00:00:00') : null;
  const isSelected = (day: number) => {
    if (!selectedDay) return false;
    return selectedDay.getFullYear() === year && selectedDay.getMonth() === month && selectedDay.getDate() === day;
  };

  const today = new Date();
  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  // Build the grid rows
  const rows: (number | null)[][] = [];
  let currentRow: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentRow.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    currentRow.push(day);
    if (currentRow.length === 7) {
      rows.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length > 0) {
    while (currentRow.length < 7) currentRow.push(null);
    rows.push(currentRow);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-purple-500 border-transparent' : ''}`}
      >
        <CalendarIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className={value ? 'text-gray-900 text-sm' : 'text-gray-400 text-sm'}>
          {value ? formatDisplay(value) : 'Select date'}
        </span>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-[280px]">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-gray-900">{monthLabel}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <ChevronRightIcon className="w-3.5 h-3.5 text-purple-600" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="space-y-1">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-7">
                {row.map((day, colIndex) => (
                  <div key={colIndex} className="flex items-center justify-center">
                    {day !== null ? (
                      <button
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={`w-8 h-8 rounded-md text-sm font-medium flex items-center justify-center transition-colors ${
                          isSelected(day)
                            ? 'bg-purple-600 text-white'
                            : isToday(day)
                            ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                            : 'text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerCalendar;
