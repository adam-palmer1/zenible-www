import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SortableHeaderProps {
  /** The data field name this column sorts by */
  field: string;
  /** Display label for the column header */
  label: string;
  /** Currently active sort field */
  currentSort: string;
  /** Current sort direction */
  currentDirection: 'asc' | 'desc';
  /** Callback when this header is clicked to change sort */
  onSort: (field: string) => void;
  /** Text alignment within the header cell */
  align?: 'left' | 'center' | 'right';
  /** Additional CSS class names for the th element */
  className?: string;
}

/**
 * SortableHeader Component
 *
 * A reusable table column header that shows sort state and handles sort toggling.
 * Extracted from the duplicated SortableColumnHeader implementations in
 * ClientsView and VendorsView.
 *
 * Usage:
 * ```tsx
 * <SortableHeader
 *   field="display_name"
 *   label="Name"
 *   currentSort={sortField}
 *   currentDirection={sortDirection}
 *   onSort={handleSortChange}
 *   align="left"
 * />
 * ```
 */
const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  label,
  currentSort,
  currentDirection,
  onSort,
  align = 'left',
  className,
}) => {
  const isActive = currentSort === field;

  const alignClass =
    align === 'right'
      ? 'justify-end'
      : align === 'center'
        ? 'justify-center'
        : 'justify-start';

  const textAlignClass =
    align === 'right'
      ? 'text-right'
      : align === 'center'
        ? 'text-center'
        : 'text-left';

  return (
    <th
      className={`px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors select-none ${textAlignClass} ${className || ''}`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${alignClass}`}>
        <span>{label}</span>
        <span
          className={`flex flex-col transition-colors ${
            isActive ? 'text-zenible-primary' : 'text-gray-300'
          }`}
        >
          {isActive ? (
            currentDirection === 'asc' ? (
              <ChevronUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ChevronDownIcon className="h-3.5 w-3.5" />
            )
          ) : (
            <svg
              className="h-3.5 w-3.5 opacity-50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          )}
        </span>
      </div>
    </th>
  );
};

export default SortableHeader;
