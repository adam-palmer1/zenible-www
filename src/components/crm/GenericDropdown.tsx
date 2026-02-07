import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useModalPortal } from '../../contexts/ModalPortalContext';

interface GenericDropdownProps {
  value: any;
  onChange: (value: any) => void;
  options?: any[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  getOptionValue?: (opt: any) => any;
  getOptionLabel?: (opt: any) => string;
}

const GenericDropdown: React.FC<GenericDropdownProps> = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  disabled = false,
  // Option can be { value, label } or just string
  getOptionValue = (opt: any) => typeof opt === 'string' ? opt : opt.value,
  getOptionLabel = (opt: any) => typeof opt === 'string' ? opt : opt.label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the modal portal container if we're inside a modal
  const modalPortal = useModalPortal();
  const portalTarget = modalPortal || document.body;

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selectedOption = options.find((opt: any) => getOptionValue(opt) === value);
  const displayLabel = selectedOption ? getOptionLabel(selectedOption) : placeholder;

  return (
    <div className={`relative ${className}`}>
      {/* Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-left flex items-center justify-between outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'} ${buttonClassName}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {displayLabel}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - Portaled to modal container (if inside modal) or body */}
      {isOpen && createPortal(
        <div
          style={{ pointerEvents: 'auto' }}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* Options */}
          <div
            ref={dropdownRef}
            className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <div className="py-1">
              {options.map((option: any, index: number) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                const isSelected = value === optionValue;

                return (
                  <button
                    key={optionValue || index}
                    type="button"
                    onClick={() => {
                      onChange(optionValue);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <span className="text-gray-900 dark:text-gray-100">{optionLabel}</span>
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        portalTarget
      )}
    </div>
  );
};

export default GenericDropdown;
