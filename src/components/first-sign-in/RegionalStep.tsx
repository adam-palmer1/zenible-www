import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { TIMEZONES } from './constants';

interface RegionalStepProps {
  darkMode: boolean;
  selectedTimezone: string;
  selectedNumberFormat: any;
  numberFormats: any[] | undefined;
  onOpenTimezoneModal: () => void;
  onOpenNumberFormatModal: () => void;
}

export default function RegionalStep({
  darkMode,
  selectedTimezone,
  selectedNumberFormat,
  numberFormats,
  onOpenTimezoneModal,
  onOpenNumberFormatModal,
}: RegionalStepProps) {
  const getTimezoneLabel = (value: string) => {
    const tz = TIMEZONES.find(t => t.value === value);
    if (tz) return `${tz.label}, ${tz.region}`;
    return value;
  };

  const getNumberFormatInfo = (formatId: any) => {
    const format = numberFormats?.find(f => f.id === formatId);
    if (format) return { name: format.name, example: format.format_string };
    return { name: 'Select format', example: '' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Regional Settings
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Set your timezone and number format preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Timezone */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Timezone
          </label>
          <button
            type="button"
            onClick={onOpenTimezoneModal}
            className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } hover:border-zenible-primary transition-colors`}
          >
            <span>{getTimezoneLabel(selectedTimezone)}</span>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Number Format */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Number Format
          </label>
          <p className={`text-xs mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Choose how numbers are displayed (decimals and thousands separators)
          </p>

          <button
            type="button"
            onClick={onOpenNumberFormatModal}
            className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } hover:border-zenible-primary transition-colors`}
          >
            <div>
              <span>{getNumberFormatInfo(selectedNumberFormat).name}</span>
              {getNumberFormatInfo(selectedNumberFormat).example && (
                <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  (e.g. {getNumberFormatInfo(selectedNumberFormat).example})
                </span>
              )}
            </div>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
