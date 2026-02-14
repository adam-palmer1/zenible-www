import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../ui/modal/Modal';
import { WIDGET_REGISTRY, getDefaultWidgetSettings, AVAILABLE_CURRENCIES } from './WidgetRegistry';
import type { WidgetSettingsField } from './WidgetRegistry';
import { usePreferences } from '../../../contexts/PreferencesContext';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { ChevronDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface WidgetSettingsModalProps {
  widgetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WidgetSettingsModal - Modal for configuring widget-specific settings
 *
 * Dynamically generates form fields based on the widget's settingsSchema
 */
const WidgetSettingsModal = ({ widgetId, open, onOpenChange }: WidgetSettingsModalProps) => {
  const { getPreference, updatePreference } = usePreferences();
  const { defaultCurrency: companyDefaultCurrency } = useCompanyCurrencies();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const config = widgetId ? WIDGET_REGISTRY[widgetId] : undefined;
  const schema = config?.settingsSchema;

  // Load current settings when modal opens
  useEffect(() => {
    if (open && widgetId) {
      const defaults = getDefaultWidgetSettings(widgetId);

      // Override currency defaults with company default currency if available
      if (companyDefaultCurrency?.currency?.code) {
        const defaultCode = companyDefaultCurrency.currency.code;
        Object.entries(schema || {}).forEach(([key, fieldSchema]) => {
          if (fieldSchema.type === 'currency') {
            defaults[key] = defaultCode;
          }
        });
      }

      const currentSettings = getPreference(
        `dashboard_widget_settings_${widgetId}`,
        defaults
      );
      setSettings(currentSettings as Record<string, any>);
    }
  }, [open, widgetId, getPreference, companyDefaultCurrency, schema]);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreference(
        `dashboard_widget_settings_${widgetId}`,
        settings,
        'dashboard'
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save widget settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!widgetId) return;
    const defaults = getDefaultWidgetSettings(widgetId);

    // Override currency defaults with company default currency if available
    if (companyDefaultCurrency?.currency?.code) {
      const defaultCode = companyDefaultCurrency.currency.code;
      Object.entries(schema || {}).forEach(([key, fieldSchema]) => {
        if (fieldSchema.type === 'currency') {
          defaults[key] = defaultCode;
        }
      });
    }

    setSettings(defaults);
  };

  if (!config || !schema) {
    return null;
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`${config.name} Settings`}
      description="Configure how this widget displays information"
      size="sm"
    >
      <div className="space-y-4">
        {Object.entries(schema).map(([key, fieldSchema]) => (
          <SettingsField
            key={key}
            name={key}
            schema={fieldSchema}
            value={settings[key]}
            onChange={(value: any) => handleChange(key, value)}
          />
        ))}
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Reset to defaults
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7b3ff0] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface StyledSelectProps {
  label: string;
  value: any;
  options: any[];
  onChange: (value: any) => void;
  getOptionLabel?: (opt: any) => string;
  getOptionValue?: (opt: any) => any;
  searchable?: boolean;
  searchPlaceholder?: string;
}

/**
 * Styled Select Dropdown Component
 */
const StyledSelect = ({ label, value, options, onChange, getOptionLabel, getOptionValue, searchable = false, searchPlaceholder = "Search..." }: StyledSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get display value
  const selectedOption = options.find(opt => {
    const optValue = getOptionValue ? getOptionValue(opt) : opt;
    return optValue === value;
  });
  const displayValue = selectedOption
    ? (getOptionLabel ? getOptionLabel(selectedOption) : selectedOption)
    : 'Select...';

  // Filter options based on search
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => {
        const optLabel = getOptionLabel ? getOptionLabel(opt) : String(opt);
        return optLabel.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (opt: any) => {
    const optValue = getOptionValue ? getOptionValue(opt) : opt;
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left bg-white hover:bg-gray-50 focus:ring-2 focus:ring-[#8e51ff] focus:border-transparent flex items-center justify-between"
        >
          <span className="text-gray-900 truncate">{displayValue}</span>
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8e51ff] focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt, index) => {
                  const optValue = getOptionValue ? getOptionValue(opt) : opt;
                  const optLabel = getOptionLabel ? getOptionLabel(opt) : String(opt);
                  const isSelected = optValue === value;

                  return (
                    <button
                      key={optValue ?? index}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-purple-50' : ''
                      }`}
                    >
                      <span className="text-gray-900">{optLabel}</span>
                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-[#8e51ff]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SettingsFieldProps {
  name: string;
  schema: WidgetSettingsField;
  value: any;
  onChange: (value: any) => void;
}

/**
 * Dynamic form field based on schema type
 */
const SettingsField = ({ name: _name, schema, value, onChange }: SettingsFieldProps) => {
  const { type, label, min, max, options } = schema;

  const baseInputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8e51ff] focus:border-transparent text-sm";

  switch (type) {
    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            className={baseInputClass}
          />
          {(min !== undefined || max !== undefined) && (
            <p className="mt-1 text-xs text-gray-500">
              {min !== undefined && max !== undefined
                ? `Between ${min} and ${max}`
                : min !== undefined
                  ? `Minimum: ${min}`
                  : `Maximum: ${max}`}
            </p>
          )}
        </div>
      );

    case 'select':
      return (
        <StyledSelect
          label={label}
          value={value}
          options={options || []}
          onChange={(val) => {
            // Convert to number if options are numbers
            onChange(typeof (options || [])[0] === 'number' ? parseInt(val, 10) : val);
          }}
        />
      );

    case 'currency':
      return (
        <StyledSelect
          label={label}
          value={value}
          options={AVAILABLE_CURRENCIES}
          onChange={onChange}
          getOptionLabel={(c) => `${c.symbol} ${c.code} - ${c.name}`}
          getOptionValue={(c) => c.code}
          searchable
          searchPlaceholder="Search currencies..."
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${value ? 'bg-[#8e51ff]' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${value ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        </div>
      );
  }
};

export default WidgetSettingsModal;
