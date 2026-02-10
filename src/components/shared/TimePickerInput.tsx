import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
}

/**
 * Custom time picker component with dropdown selector and typeable input.
 * Typing updates the picker selections live and commits on valid input.
 */
const TimePickerInput: React.FC<TimePickerInputProps> = ({ value, onChange, error = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [inputText, setInputText] = useState('');
  const isFocusedRef = useRef(false);
  const [dropdownPos, setDropdownPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Format display value from picker state
  const getDisplayValue = useCallback(() => {
    if (!value) return '';
    return `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
  }, [value, selectedHour, selectedMinute, selectedPeriod]);

  // Parse incoming value (HH:MM format in 24-hour)
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':');
      const hour24 = parseInt(hours, 10);
      const isPM = hour24 >= 12;
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

      setSelectedHour(hour12.toString().padStart(2, '0'));
      setSelectedMinute(minutes);
      setSelectedPeriod(isPM ? 'PM' : 'AM');
    }
  }, [value]);

  // Sync input text when picker state changes — but only when not actively typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setInputText(getDisplayValue());
    }
  }, [getDisplayValue]);

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      if (openAbove) {
        setDropdownPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
      } else {
        setDropdownPos({ top: rect.bottom + 8, left: rect.left });
      }
    }
  }, []);

  const handleOpen = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input text on close
        setInputText(getDisplayValue());
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, getDisplayValue]);

  // Convert 12h to 24h and call onChange
  const commitTime = useCallback((hour12: string, minute: string, period: string) => {
    let hour24 = parseInt(hour12, 10);
    if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }
    onChange(`${hour24.toString().padStart(2, '0')}:${minute}`);
  }, [onChange]);

  // Picker button handlers — update state and commit immediately
  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    commitTime(hour, selectedMinute, selectedPeriod);
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    commitTime(selectedHour, minute, selectedPeriod);
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    commitTime(selectedHour, selectedMinute, period);
  };

  // Parse typed input: "2:30 PM", "02:30 pm", "2:30pm", "22:30" (24h), etc.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    const trimmed = text.trim();

    // Try 12-hour format first: "2:30 PM", "02:30pm", etc.
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
    if (match12) {
      const hr = parseInt(match12[1], 10);
      const min = parseInt(match12[2], 10);
      const period = match12[3].toUpperCase();

      if (hr >= 1 && hr <= 12 && min >= 0 && min <= 59) {
        const hourStr = hr.toString().padStart(2, '0');
        const minStr = min.toString().padStart(2, '0');
        setSelectedHour(hourStr);
        setSelectedMinute(minStr);
        setSelectedPeriod(period);
        commitTime(hourStr, minStr, period);
      }
      return;
    }

    // Try 24-hour format: "22:30", "09:15", "0:00", etc.
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const hour24 = parseInt(match24[1], 10);
      const min = parseInt(match24[2], 10);

      if (hour24 >= 0 && hour24 <= 23 && min >= 0 && min <= 59) {
        const period = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const hourStr = hour12.toString().padStart(2, '0');
        const minStr = min.toString().padStart(2, '0');
        setSelectedHour(hourStr);
        setSelectedMinute(minStr);
        setSelectedPeriod(period);
        commitTime(hourStr, minStr, period);
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
    setInputText(getDisplayValue());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInputText(getDisplayValue());
      textInputRef.current?.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
      textInputRef.current?.blur();
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <div className={`relative ${className}`}>
      {/* Input Display */}
      <div
        ref={inputRef}
        onClick={handleOpen}
        className={`flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      >
        <input
          ref={textInputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder="HH:MM AM/PM"
          className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 w-full cursor-pointer focus:cursor-text"
        />
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {/* Dropdown Picker - rendered via portal to escape modal overflow */}
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setIsOpen(false)} />
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: dropdownPos.left,
              ...(dropdownPos.top != null ? { top: dropdownPos.top } : {}),
              ...(dropdownPos.bottom != null ? { bottom: dropdownPos.bottom } : {}),
              width: 256,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-300 rounded-lg shadow-lg p-4"
          >
            <div className="flex gap-2">
              {/* Hour Selector */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Hour</label>
                <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto scrollbar-hide">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleHourSelect(hour)}
                      className={`w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 ${
                        selectedHour === hour ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-900'
                      }`}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minute Selector */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Minute</label>
                <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto scrollbar-hide">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => handleMinuteSelect(minute)}
                      className={`w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 ${
                        selectedMinute === minute ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-900'
                      }`}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM/PM Selector */}
              <div className="w-16">
                <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
                <div className="border border-gray-300 rounded-md">
                  <button
                    type="button"
                    onClick={() => handlePeriodSelect('AM')}
                    className={`w-full px-2 py-1.5 text-sm hover:bg-gray-50 ${
                      selectedPeriod === 'AM' ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-900'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodSelect('PM')}
                    className={`w-full px-2 py-1.5 text-sm hover:bg-gray-50 border-t border-gray-300 ${
                      selectedPeriod === 'PM' ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-900'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default TimePickerInput;
