import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@heroicons/react/24/outline';

interface DropdownProps {
  trigger: React.ReactNode;
  children?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
}

interface DropdownItemProps {
  children?: React.ReactNode;
  onSelect?: (event: Event) => void;
  disabled?: boolean;
  destructive?: boolean;
  highlighted?: boolean;
  className?: string;
}

interface DropdownCheckboxItemProps {
  children?: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

interface DropdownSeparatorProps {
  className?: string;
}

interface DropdownLabelProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Base Dropdown component using Radix UI DropdownMenu
 *
 * Benefits:
 * - Automatic positioning with collision detection
 * - Automatic click-outside handling
 * - Automatic keyboard navigation
 * - Automatic ARIA attributes
 * - Eliminates 40+ lines of manual positioning logic
 *
 * Usage:
 * <Dropdown trigger={<button>Actions</button>} align="end">
 *   <Dropdown.Item onSelect={handleEdit}>Edit</Dropdown.Item>
 *   <Dropdown.Item onSelect={handleDelete} destructive>Delete</Dropdown.Item>
 * </Dropdown>
 */
const Dropdown: React.FC<DropdownProps> & {
  Item: React.FC<DropdownItemProps>;
  CheckboxItem: React.FC<DropdownCheckboxItemProps>;
  Separator: React.FC<DropdownSeparatorProps>;
  Label: React.FC<DropdownLabelProps>;
} = ({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 8,
  alignOffset = 0,
  className = '',
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className={`
            min-w-[220px]
            bg-white dark:bg-gray-800
            rounded-[12px]
            border border-[#e5e5e5] dark:border-gray-700
            p-[6px]
            flex flex-col gap-[6px]
            z-50
            shadow-[3px_4px_15px_0px_rgba(0,0,0,0.06)]
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95
            data-[state=open]:zoom-in-95
            data-[side=bottom]:slide-in-from-top-2
            data-[side=left]:slide-in-from-right-2
            data-[side=right]:slide-in-from-left-2
            data-[side=top]:slide-in-from-bottom-2
            ${className}
          `}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

/**
 * Dropdown Item component
 */
const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onSelect,
  disabled = false,
  destructive = false,
  highlighted = false,
  className = '',
}) => {
  const itemClass = destructive
    ? 'text-[#fb2c36] hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700'
    : highlighted
      ? 'text-[#09090b] dark:text-white bg-[#f4f4f5] dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:bg-gray-200 dark:focus:bg-gray-600'
      : 'text-[#09090b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700';

  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      disabled={disabled}
      className={`
        px-[12px] py-[8px]
        text-[14px] leading-[22px]
        h-[36px] min-h-[44px] lg:min-h-[36px]
        outline-none
        cursor-pointer
        rounded-[10px]
        transition-colors
        disabled:opacity-50
        disabled:cursor-not-allowed
        flex items-center gap-2
        ${itemClass}
        ${className}
      `}
    >
      {children}
    </DropdownMenu.Item>
  );
};

/**
 * Dropdown CheckboxItem component for filters
 */
const DropdownCheckboxItem: React.FC<DropdownCheckboxItemProps> = ({
  children,
  checked,
  onCheckedChange,
  disabled = false,
  className = '',
}) => {
  return (
    <DropdownMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`
        px-3 py-3 lg:py-2
        text-sm
        text-gray-700
        outline-none
        cursor-pointer
        rounded-md
        transition-colors
        hover:bg-gray-100
        focus:bg-gray-100
        disabled:opacity-50
        disabled:cursor-not-allowed
        flex items-center gap-2
        ${className}
      `}
    >
      <DropdownMenu.ItemIndicator className="w-4 h-4">
        <CheckIcon className="h-4 w-4 text-purple-600" />
      </DropdownMenu.ItemIndicator>
      <span className="flex-1">{children}</span>
    </DropdownMenu.CheckboxItem>
  );
};

/**
 * Dropdown Separator component
 */
const DropdownSeparator: React.FC<DropdownSeparatorProps> = ({ className = '' }) => {
  return (
    <DropdownMenu.Separator
      className={`h-px bg-gray-200 my-1 ${className}`}
    />
  );
};

/**
 * Dropdown Label component
 */
const DropdownLabel: React.FC<DropdownLabelProps> = ({ children, className = '' }) => {
  return (
    <DropdownMenu.Label
      className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase ${className}`}
    >
      {children}
    </DropdownMenu.Label>
  );
};

// Attach sub-components
Dropdown.Item = DropdownItem;
Dropdown.CheckboxItem = DropdownCheckboxItem;
Dropdown.Separator = DropdownSeparator;
Dropdown.Label = DropdownLabel;

export default Dropdown;
