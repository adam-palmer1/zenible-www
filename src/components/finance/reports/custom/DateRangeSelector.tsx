import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
import DatePickerCalendar from '@/components/shared/DatePickerCalendar';
import {
  DATE_RANGE_PRESET_LABELS,
  type ReportDateRangePreset,
  type DateRangeConfig,
} from '@/types/customReport';

const PRESETS: ReportDateRangePreset[] = [
  'this_month',
  'last_month',
  'this_quarter',
  'last_quarter',
  'this_year',
  'last_year',
  'last_7_days',
  'last_30_days',
  'last_90_days',
  'custom',
];

const DateRangeSelector: React.FC = () => {
  const { configuration, setDateRange } = useCustomReports();
  const dateRange = configuration.date_range;

  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 380;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
      } else {
        setPos({ top: rect.bottom + 8, left: rect.left });
      }
    }
  }, [open]);

  const handlePresetChange = (preset: ReportDateRangePreset) => {
    const config: DateRangeConfig = { preset };
    if (preset === 'custom') {
      config.custom_start = dateRange?.custom_start || '';
      config.custom_end = dateRange?.custom_end || '';
    }
    setDateRange(config);
  };

  const handleCustomDateChange = (field: 'custom_start' | 'custom_end', value: string) => {
    setDateRange({
      ...dateRange,
      preset: 'custom',
      [field]: value,
    });
  };

  const handleClear = () => {
    setDateRange(undefined);
    setOpen(false);
  };

  const label = dateRange?.preset
    ? DATE_RANGE_PRESET_LABELS[dateRange.preset]
    : 'All Time';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
          dateRange?.preset
            ? 'border-purple-500 bg-purple-50 text-purple-700'
            : 'border-gray-300 text-gray-700'
        }`}
      >
        <Calendar className="h-4 w-4" />
        <span className="max-w-[180px] truncate">{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: 320, zIndex: 9999 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200"
          >
            {/* Preset Options */}
            <div className="p-3 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.filter((p) => p !== 'custom').map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                      dateRange?.preset === preset
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {DATE_RANGE_PRESET_LABELS[preset]}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="p-3 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Custom Range</div>
              <div className="flex items-center gap-2">
                <DatePickerCalendar
                  value={dateRange?.custom_start || ''}
                  onChange={(date) => handleCustomDateChange('custom_start', date)}
                  className="flex-1"
                />
                <span className="text-sm text-gray-400">to</span>
                <DatePickerCalendar
                  value={dateRange?.custom_end || ''}
                  onChange={(date) => handleCustomDateChange('custom_end', date)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 flex items-center justify-between">
              <button
                onClick={handleClear}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default DateRangeSelector;
