import React, { useRef, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface CurrencySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (currencyId: string) => void;
  selectedCurrencyId?: string;
  currencies?: any[];
  anchorRef?: React.RefObject<HTMLElement> | null;
}

const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCurrencyId,
  currencies = [],
  anchorRef = null,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          anchorRef?.current && !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
      >
        {currencies.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No currencies configured
          </div>
        ) : (
          <div className="py-1">
            {currencies.map((c: any) => {
              const currencyId = c.currency_id || c.currency?.id;
              const isSelected = selectedCurrencyId === currencyId;

              return (
                <button
                  key={currencyId}
                  type="button"
                  onClick={() => {
                    onSelect(currencyId);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium text-gray-700 dark:text-gray-300 w-6">
                      {c.currency?.symbol || '$'}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {c.currency?.code || 'Unknown'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {c.currency?.name || ''}
                      </span>
                      {c.is_default && (
                        <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                          (Default)
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default CurrencySelectorModal;
