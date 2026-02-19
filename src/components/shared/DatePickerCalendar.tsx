import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useModalPortal } from '../../contexts/ModalPortalContext';

interface DatePickerCalendarProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  error?: boolean;
  className?: string;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({ value, onChange, error = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalPortal = useModalPortal();
  const portalTarget = modalPortal || document.body;
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  const [inputText, setInputText] = useState(() => formatDisplay(value));
  const isFocusedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top?: number; bottom?: number; left: number; width: number }>({ left: 0, width: 280 });

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      if (openAbove) {
        setDropdownPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left, width: 280 });
      } else {
        setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: 280 });
      }
    }
  }, []);

  // Sync inputText and viewDate from value prop — but only when not actively typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setInputText(formatDisplay(value));
    }
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setInputText(formatDisplay(value));
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onChange(dateStr);
    setInputText(formatDisplay(dateStr));
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    // Progressive parsing of DD/MM/YYYY
    const parts = text.split('/');

    // Once we have month and year (at least partial), navigate the calendar view
    if (parts.length >= 2) {
      const mon = parseInt(parts[1], 10);
      if (parts.length >= 3 && parts[2].length === 4) {
        const yr = parseInt(parts[2], 10);
        if (mon >= 1 && mon <= 12 && yr >= 1900 && yr <= 2100) {
          setViewDate(new Date(yr, mon - 1, 1));

          // If day is also complete, commit the full date
          const day = parseInt(parts[0], 10);
          if (parts[0].length >= 1 && day >= 1 && day <= 31) {
            const parsed = new Date(yr, mon - 1, day);
            if (parsed.getFullYear() === yr && parsed.getMonth() === mon - 1 && parsed.getDate() === day) {
              const yyyy = String(yr);
              const mm = String(mon).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              onChange(`${yyyy}-${mm}-${dd}`);
            }
          }
        }
      } else if (mon >= 1 && mon <= 12) {
        // Navigate to the month in the current viewDate year
        setViewDate(prev => new Date(prev.getFullYear(), mon - 1, 1));
      }
    }
  };

  const handleInputFocus = () => {
    isFocusedRef.current = true;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    isFocusedRef.current = false;
    // Restore display to the committed value
    setInputText(formatDisplay(value));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInputText(formatDisplay(value));
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      // If the current text produced a valid date, close the picker
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
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
    <div ref={containerRef} className={`relative min-w-[130px] ${className}`}>
      {/* Input */}
      <div
        onClick={() => { if (!isOpen) { updatePosition(); setIsOpen(true); } }}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-purple-500 border-transparent' : ''}`}
      >
        <CalendarIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder="DD/MM/YYYY"
          className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 w-full min-w-0 cursor-pointer focus:cursor-text"
        />
      </div>

      {/* Calendar Dropdown - rendered via portal to escape overflow:hidden containers */}
      {isOpen && createPortal(
        <div
          style={{ pointerEvents: 'auto' }}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => { setIsOpen(false); setInputText(formatDisplay(value)); }} />
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: dropdownPos.left,
              ...(dropdownPos.top != null ? { top: dropdownPos.top } : {}),
              ...(dropdownPos.bottom != null ? { bottom: dropdownPos.bottom } : {}),
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
          >
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
        </div>,
        portalTarget
      )}
    </div>
  );
};

export default DatePickerCalendar;
