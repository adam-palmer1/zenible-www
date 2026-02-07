import React from 'react';

type BadgeVariant = 'default' | 'client' | 'vendor' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Badge Component
 *
 * A reusable badge/tag component with multiple variants and sizes
 */
const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
  children
}) => {
  // Variant color mappings
  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    client: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    vendor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  // Dot color mappings
  const dotClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-500',
    client: 'bg-green-500',
    vendor: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  // Size mappings
  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full font-medium
        ${variantClasses[variant] || variantClasses.default}
        ${sizeClasses[size] || sizeClasses.sm}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant] || dotClasses.default}`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
