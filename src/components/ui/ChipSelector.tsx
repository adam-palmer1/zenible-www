import React from 'react';

interface ChipOption {
  value: string;
  label: string;
  color?: string;
}

interface ChipSelectorProps {
  options?: ChipOption[];
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
  useColors?: boolean;
  className?: string;
}

/**
 * Chip Selector component for single or multiple selection
 * Matches Figma design with checkbox-style square and label
 */
const ChipSelector: React.FC<ChipSelectorProps> = ({
  options = [],
  value = null,
  onChange,
  multiple = false,
  useColors = false,
  className = '',
}) => {
  const handleToggle = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      // Single select: allow deselection by clicking the same option again
      if (value === optionValue) {
        onChange(null);
      } else {
        onChange(optionValue);
      }
    }
  };

  const isSelected = (optionValue: string): boolean => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 142, g: 81, b: 255 }; // Default purple
  };

  // Helper to lighten a color (for background)
  const lightenColor = (hex: string, percent: number): string => {
    const rgb = hexToRgb(hex);
    const r = Math.min(255, rgb.r + Math.round((255 - rgb.r) * percent));
    const g = Math.min(255, rgb.g + Math.round((255 - rgb.g) * percent));
    const b = Math.min(255, rgb.b + Math.round((255 - rgb.b) * percent));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Helper to get light background color from main color (95% lighter)
  const getLightBgColor = (color: string): string => {
    if (!color) return '#f5f3ff';
    return lightenColor(color, 0.85);
  };

  // Helper to get checkbox background color (80% lighter)
  const getCheckboxBgColor = (color: string): string => {
    if (!color) return '#ddd6ff';
    return lightenColor(color, 0.7);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        const mainColor = useColors && option.color ? option.color : '#8e51ff';

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border transition-all ${
              selected
                ? 'border-[' + mainColor + ']'
                : 'border-[#e5e5e5] hover:border-gray-300'
            }`}
            style={{
              backgroundColor: selected ? getLightBgColor(mainColor) : '#ffffff',
              borderColor: selected ? mainColor : '#e5e5e5',
            }}
          >
            {/* Checkbox square */}
            <div
              className="w-6 h-6 rounded-[10px] border transition-all"
              style={{
                backgroundColor: selected ? getCheckboxBgColor(mainColor) : '#ffffff',
                borderColor: selected ? mainColor : '#e5e5e5',
              }}
            />

            {/* Label */}
            <span className="text-[16px] font-medium leading-6 text-[#09090b] whitespace-nowrap">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ChipSelector;
