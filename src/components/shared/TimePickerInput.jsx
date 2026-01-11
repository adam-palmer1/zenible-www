import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * Custom time picker component with dropdown selector
 */
const TimePickerInput = ({ value, onChange, error = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Convert 12-hour to 24-hour format
  const handleApply = () => {
    let hour24 = parseInt(selectedHour, 10);
    if (selectedPeriod === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (selectedPeriod === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }

    const timeValue = `${hour24.toString().padStart(2, '0')}:${selectedMinute}`;
    onChange(timeValue);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return '';
    return `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <div className="relative">
      {/* Input Display */}
      <div
        ref={inputRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${className}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {getDisplayValue() || 'Select time'}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {/* Dropdown Picker */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64"
          >
            <div className="flex gap-2 mb-4">
              {/* Hour Selector */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Hour</label>
                <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => setSelectedHour(hour)}
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
                <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => setSelectedMinute(minute)}
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
                    onClick={() => setSelectedPeriod('AM')}
                    className={`w-full px-2 py-1.5 text-sm hover:bg-gray-50 ${
                      selectedPeriod === 'AM' ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-900'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('PM')}
                    className={`w-full px-2 py-1.5 text-sm hover:bg-gray-50 border-t border-gray-300 ${
                      selectedPeriod === 'PM' ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-900'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApply}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
            >
              Apply
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TimePickerInput;
