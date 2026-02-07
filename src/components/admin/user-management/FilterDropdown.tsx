import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { FilterDropdownProps } from './types';

/**
 * Generic Filter Dropdown - Positioned relative to trigger button
 */
const FilterDropdown: React.FC<FilterDropdownProps> = ({ isOpen, onClose, options, selectedValue, onSelect, title }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = () => onClose();
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          {title}
        </div>
      )}
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => { onSelect(option.id); onClose(); }}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
            option.id === selectedValue ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          <span>{option.label}</span>
          {option.id === selectedValue && <Check className="h-4 w-4 text-purple-600" />}
        </button>
      ))}
    </div>
  );
};

export default FilterDropdown;
