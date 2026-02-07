import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface NumberFormatModalProps {
  darkMode: boolean;
  numberFormats: any[] | undefined;
  selectedNumberFormat: any;
  onSelect: (formatId: any) => void;
  onClose: () => void;
}

export default function NumberFormatModal({
  darkMode,
  numberFormats,
  selectedNumberFormat,
  onSelect,
  onClose,
}: NumberFormatModalProps) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className={`relative rounded-xl shadow-xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Select Number Format
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-4">
            <div className="max-h-64 overflow-y-auto">
              {numberFormats?.map((format) => (
                <button
                  key={format.id}
                  onClick={() => {
                    onSelect(format.id);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between rounded-lg ${
                    selectedNumberFormat === format.id ? 'bg-zenible-primary/10 text-zenible-primary' : ''
                  } ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                >
                  <div>
                    <div className={`font-medium ${selectedNumberFormat === format.id ? 'text-zenible-primary' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {format.name}
                    </div>
                    <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Example: {format.format_string}
                    </div>
                  </div>
                  {selectedNumberFormat === format.id && (
                    <div className="h-2 w-2 rounded-full bg-zenible-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
