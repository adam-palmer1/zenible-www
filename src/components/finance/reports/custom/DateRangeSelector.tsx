import React from 'react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
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

  const handlePresetChange = (preset: ReportDateRangePreset) => {
    if (preset === dateRange?.preset) {
      setDateRange(undefined);
      return;
    }

    const config: DateRangeConfig = { preset };
    if (preset === 'custom') {
      config.custom_start = dateRange?.custom_start || '';
      config.custom_end = dateRange?.custom_end || '';
    }
    setDateRange(config);
  };

  const handleCustomDateChange = (field: 'custom_start' | 'custom_end', value: string) => {
    setDateRange({
      preset: 'custom',
      ...dateRange,
      [field]: value,
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
      <div className="space-y-3">
        <select
          value={dateRange?.preset || ''}
          onChange={(e) => {
            if (e.target.value) {
              handlePresetChange(e.target.value as ReportDateRangePreset);
            } else {
              setDateRange(undefined);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">All time (no date filter)</option>
          {PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {DATE_RANGE_PRESET_LABELS[preset]}
            </option>
          ))}
        </select>

        {dateRange?.preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.custom_start || ''}
              onChange={(e) => handleCustomDateChange('custom_start', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-sm text-[#71717a]">to</span>
            <input
              type="date"
              value={dateRange.custom_end || ''}
              onChange={(e) => handleCustomDateChange('custom_end', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangeSelector;
