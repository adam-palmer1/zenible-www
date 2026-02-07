import React, { useState, useRef, useEffect } from 'react';
import { useServices } from '../../hooks/crm/useServices';
import { getCurrencySymbol } from '../../utils/currency';

interface ServiceAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (service: any) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Service autocomplete dropdown component
 * Allows searching existing services or typing a new service name
 */
const ServiceAutocomplete: React.FC<ServiceAutocompleteProps> = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Start typing to select or create service',
  className = '',
  disabled = false
}) => {
  const { services } = useServices() as any;
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter services based on query
  const filterServices = (query: string) => {
    if (!services || !Array.isArray(services) || !query.trim()) {
      return [];
    }

    const queryLower = query.toLowerCase();
    return services.filter((service: any) =>
      !service.is_hidden && (
        service.name.toLowerCase().includes(queryLower) ||
        (service.description && service.description.toLowerCase().includes(queryLower))
      )
    ).slice(0, 10); // Limit to 10 results
  };

  // Update dropdown state based on input value
  const updateDropdown = (query: string) => {
    const filtered = filterServices(query);
    const exactMatch = services?.find((service: any) =>
      !service.is_hidden && service.name.toLowerCase() === query.toLowerCase()
    );
    const shouldShow = filtered.length > 0 && (!exactMatch || filtered.length > 1) && query.length > 0;

    setFilteredServices(filtered);
    setShowDropdown(shouldShow);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
    updateDropdown(newValue);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value && value.length > 0) {
      updateDropdown(value);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay closing dropdown to allow click on dropdown items
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  // Handle service selection from dropdown
  const handleServiceSelect = async (service: any) => {
    if (onSelect) {
      await onSelect(service);
    }
    setShowDropdown(false);
    setFilteredServices([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown &&
          inputRef.current && !inputRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={`px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary w-full ${className}`}
      />

      {/* Autocomplete Dropdown */}
      {showDropdown && filteredServices.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {filteredServices.map((service: any) => (
            <button
              key={service.id}
              type="button"
              onMouseDown={async (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                await handleServiceSelect(service);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  {service.description && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">{service.description}</div>
                  )}
                </div>
                {service.price && (
                  <div className="text-sm text-gray-700 font-medium ml-2 flex-shrink-0">
                    {getCurrencySymbol(service.currency_code || 'GBP')}
                    {parseFloat(service.price).toFixed(2)}
                    {service.frequency_type === 'recurring' && (
                      <span className="text-xs text-gray-500 ml-1">
                        /{service.time_period?.substring(0, 2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceAutocomplete;
