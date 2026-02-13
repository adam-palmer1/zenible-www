import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, X } from 'lucide-react';
import DatePickerCalendar from '../../shared/DatePickerCalendar';
import { formatLocalDate } from '../../../utils/dateUtils';

/**
 * Helper to get last 30 days date range
 */
// eslint-disable-next-line react-refresh/only-export-components
export const getLast30DaysRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  return {
    start_date: formatLocalDate(thirtyDaysAgo),
    end_date: formatLocalDate(today),
  };
};

interface DatePreset {
  label: string;
  getValue: () => { start_date: string; end_date: string };
}

const DATE_PRESETS: DatePreset[] = [
  { label: 'Last 30 Days', getValue: getLast30DaysRange },
  { label: 'Today', getValue: () => {
    const today = new Date();
    const dateStr = formatLocalDate(today);
    return { start_date: dateStr, end_date: dateStr };
  }},
  { label: 'Yesterday', getValue: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = formatLocalDate(yesterday);
    return { start_date: dateStr, end_date: dateStr };
  }},
  { label: 'Last 7 Days', getValue: () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    return {
      start_date: formatLocalDate(sevenDaysAgo),
      end_date: formatLocalDate(today),
    };
  }},
  { label: 'This Week', getValue: () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    return {
      start_date: formatLocalDate(startOfWeek),
      end_date: formatLocalDate(today),
    };
  }},
  { label: 'Last Week', getValue: () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const endOfLastWeek = new Date(today);
    endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1);
    const startOfLastWeek = new Date(endOfLastWeek);
    startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
    return {
      start_date: formatLocalDate(startOfLastWeek),
      end_date: formatLocalDate(endOfLastWeek),
    };
  }},
  { label: 'This Month', getValue: () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start_date: formatLocalDate(startOfMonth),
      end_date: formatLocalDate(today),
    };
  }},
  { label: 'Last Month', getValue: () => {
    const today = new Date();
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      start_date: formatLocalDate(startOfLastMonth),
      end_date: formatLocalDate(endOfLastMonth),
    };
  }},
  { label: 'This Quarter', getValue: () => {
    const today = new Date();
    const quarter = Math.floor(today.getMonth() / 3);
    const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
    return {
      start_date: formatLocalDate(startOfQuarter),
      end_date: formatLocalDate(today),
    };
  }},
  { label: 'This Year', getValue: () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    return {
      start_date: formatLocalDate(startOfYear),
      end_date: formatLocalDate(today),
    };
  }},
  { label: 'Last Year', getValue: () => {
    const today = new Date();
    const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
    return {
      start_date: formatLocalDate(startOfLastYear),
      end_date: formatLocalDate(endOfLastYear),
    };
  }},
];

const DATE_FIELDS = [
  { key: 'entry', label: 'Entry Date' },
  { key: 'paid', label: 'Paid Date' },
];

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (range: { start_date: string | null; end_date: string | null }) => void;
  dateField?: string;
  onDateFieldChange?: (field: string) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ startDate, endDate, onChange, dateField = 'entry', onDateFieldChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(startDate || '');
  const [customEnd, setCustomEnd] = useState(endDate || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 400;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      if (openAbove) {
        setDropdownPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
      } else {
        setDropdownPos({ top: rect.bottom + 8, left: rect.left });
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCustomStart(startDate || '');
    setCustomEnd(endDate || '');
  }, [startDate, endDate]);

  const handlePresetClick = (preset: DatePreset) => {
    const { start_date, end_date } = preset.getValue();
    onChange({ start_date, end_date });
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    onChange({
      start_date: customStart || null,
      end_date: customEnd || null,
    });
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ start_date: null, end_date: null });
    setCustomStart('');
    setCustomEnd('');
  };

  const getDisplayText = () => {
    if (!startDate && !endDate) return 'All Time';

    // Check if current dates match a preset and show its label
    if (startDate && endDate) {
      for (const preset of DATE_PRESETS) {
        const { start_date, end_date } = preset.getValue();
        if (startDate === start_date && endDate === end_date) {
          return preset.label;
        }
      }
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (startDate === endDate) {
      return formatDate(startDate!);
    }

    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    if (startDate) {
      return `From ${formatDate(startDate)}`;
    }

    return `Until ${formatDate(endDate!)}`;
  };

  const hasFilter = startDate || endDate;

  const isPresetActive = (preset: DatePreset) => {
    if (!startDate || !endDate) return false;
    const { start_date, end_date } = preset.getValue();
    return startDate === start_date && endDate === end_date;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => { if (!isOpen) updatePosition(); setIsOpen(!isOpen); }}
        className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border-[1.5px] ${hasFilter ? 'border-purple-500' : 'border-[#e5e5e5] dark:border-gray-600'} rounded-xl text-sm font-normal text-[#09090b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors`}
      >
        <Calendar className="h-4 w-4 text-[#71717a]" />
        <span className={hasFilter ? 'text-purple-600 dark:text-purple-400' : ''}>{getDisplayText()}</span>
        {hasFilter ? (
          <X
            className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown className={`h-4 w-4 text-[#71717a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => { setIsOpen(false); setShowCustom(false); }} />
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: dropdownPos.left,
              ...(dropdownPos.top != null ? { top: dropdownPos.top } : {}),
              ...(dropdownPos.bottom != null ? { bottom: dropdownPos.bottom } : {}),
              width: 288,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[#e5e5e5] dark:border-gray-600"
          >
            {!showCustom ? (
              <>
                {onDateFieldChange && (
                  <div className="p-3 border-b border-[#e5e5e5] dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Filter by:</span>
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        {DATE_FIELDS.map((field) => (
                          <button
                            key={field.key}
                            onClick={() => onDateFieldChange(field.key)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                              dateField === field.key
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {field.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="py-1 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => {
                      onChange({ start_date: null, end_date: null });
                      setIsOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${!startDate && !endDate ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                  >
                    All Time
                  </button>
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className={`block w-full text-left px-4 py-2 text-sm ${isPresetActive(preset) ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#e5e5e5] dark:border-gray-600 p-2">
                  <button
                    onClick={() => setShowCustom(true)}
                    className="w-full text-left px-2 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md"
                  >
                    Custom Range...
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 space-y-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Date Range
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                    <DatePickerCalendar
                      value={customStart}
                      onChange={(date) => setCustomStart(date)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                    <DatePickerCalendar
                      value={customEnd}
                      onChange={(date) => setCustomEnd(date)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomApply}
                    disabled={!customStart && !customEnd}
                    className="flex-1 px-3 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default DateRangeFilter;
