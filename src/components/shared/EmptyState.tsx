import React from 'react';

interface EmptyStateProps {
  /** Optional icon to display above the title */
  icon?: React.ReactNode;
  /** Main message text */
  title: string;
  /** Optional secondary description text */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Number of columns to span in a table context */
  colSpan?: number;
}

/**
 * EmptyState Component
 *
 * A reusable empty state display for tables and list views.
 * Can be rendered as a table row (when colSpan is provided) or as a standalone block.
 *
 * Usage in a table:
 * ```tsx
 * <tbody>
 *   {items.length === 0 ? (
 *     <EmptyState title="No clients found" colSpan={6} />
 *   ) : (
 *     items.map(...)
 *   )}
 * </tbody>
 * ```
 *
 * Usage standalone:
 * ```tsx
 * <EmptyState
 *   icon={<UserGroupIcon className="h-12 w-12" />}
 *   title="No contacts yet"
 *   description="Add your first contact to get started."
 *   action={{ label: "Add Contact", onClick: handleAdd }}
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  colSpan,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {icon && (
        <div className="mb-3 text-gray-400 dark:text-gray-500">{icon}</div>
      )}
      <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      {description && (
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-zenible-primary hover:bg-zenible-primary/90 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );

  // When used inside a table, wrap in tr/td
  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} className="text-center">
          {content}
        </td>
      </tr>
    );
  }

  return content;
};

export default EmptyState;
