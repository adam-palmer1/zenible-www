import React from 'react';
import { Link } from 'react-router-dom';
import { useUsageDashboardOptional } from '../../contexts/UsageDashboardContext';

type UsageColor = 'green' | 'yellow' | 'red';
type UsageVariant = 'badge' | 'compact' | 'inline';

interface UsageLimitBadgeProps {
  entityType?: string;
  characterId?: string;
  aiUsage?: boolean;
  variant?: UsageVariant;
  showUpgradeLink?: boolean;
  darkMode?: boolean;
  className?: string;
}

interface LoadingSkeletonProps {
  variant: UsageVariant;
  darkMode: boolean;
  className: string;
}

interface BadgeVariantProps {
  current: number;
  limit: number;
  label: string;
  percentage: number;
  color: UsageColor;
  isOverLimit: boolean;
  showUpgradeLink: boolean;
  darkMode: boolean;
  className: string;
}

interface CompactVariantProps {
  current: number;
  limit: number;
  color: UsageColor;
  isOverLimit: boolean;
  showUpgradeLink: boolean;
  darkMode: boolean;
  className: string;
}

interface InlineVariantProps {
  current: number;
  limit: number;
  remaining: number;
  label: string;
  color: UsageColor;
  isOverLimit: boolean;
  showUpgradeLink: boolean;
  darkMode: boolean;
  className: string;
}

interface ColorClasses {
  dot: string;
  text: string;
  bg: string;
  border: string;
  progress: string;
}

/**
 * UsageLimitBadge - Reusable component to display usage limits
 *
 * Variants:
 * - badge: Full badge with progress bar (for headers with space)
 * - compact: Small `12/20` format with color dot
 * - inline: Text like "12 of 20 remaining" (for tight spaces)
 *
 * Color scheme:
 * - Green: Under 75% usage
 * - Yellow: 75-99% usage
 * - Red: At or over limit
 */
export default function UsageLimitBadge({
  entityType,
  characterId,
  aiUsage,
  variant = 'compact',
  showUpgradeLink = false,
  darkMode = false,
  className = '',
}: UsageLimitBadgeProps): React.ReactElement | null {
  const usageContext = useUsageDashboardOptional();

  // If context is not available, don't render anything
  if (!usageContext) {
    return null;
  }

  const {
    getEntityLimit,
    aiUsage: aiData,
    loading
  } = usageContext;

  // Show loading skeleton
  if (loading) {
    return <LoadingSkeleton variant={variant} darkMode={darkMode} className={className} />;
  }

  // Determine data source
  let current: number;
  let limit: number;
  let label: string;
  let isUnlimited: boolean;

  if (entityType) {
    const data = getEntityLimit(entityType);
    if (!data) return null;
    current = data.current ?? 0;
    isUnlimited = data.limit === null || data.limit === undefined || data.limit === -1;
    limit = data.limit ?? 0;
    label = formatEntityLabel(entityType);
  } else if (characterId) {
    // For AI features - compare character limit vs total AI limit, show the greater limit
    if (!aiData) return null;

    const totalData = aiData.total;
    const characterData = aiData.per_character?.find((c) => c.character_id === characterId);

    // Get both limits (treat null as unlimited/very high)
    const totalLimit = totalData?.limit ?? Infinity;
    const characterLimit = characterData?.limit ?? Infinity;

    // If both are unlimited, don't show anything
    if (totalLimit === Infinity && characterLimit === Infinity) {
      return null;
    }

    // Use whichever has the greater limit
    if (totalLimit >= characterLimit && totalLimit !== Infinity) {
      current = totalData?.current ?? 0;
      limit = totalLimit;
      isUnlimited = false;
      label = 'AI messages';
    } else if (characterLimit !== Infinity) {
      current = characterData?.usage ?? 0;
      limit = characterLimit;
      isUnlimited = false;
      label = characterData?.character_name || 'AI messages';
    } else {
      return null;
    }
  } else if (aiUsage) {
    if (!aiData?.total) return null;
    current = aiData.total.current ?? 0;
    isUnlimited = aiData.total.limit === null || aiData.total.limit === undefined;
    limit = aiData.total.limit ?? 0;
    label = 'AI messages';
  } else {
    return null;
  }

  // Don't show anything for unlimited limits
  if (isUnlimited) {
    return null;
  }

  // Calculate usage percentage and color
  const percentage = limit > 0 ? (current / limit) * 100 : 100;
  const color = getColorFromPercentage(percentage);
  const remaining = Math.max(0, limit - current);
  const isOverLimit = percentage >= 100;

  // Render based on variant
  switch (variant) {
    case 'badge':
      return (
        <BadgeVariant
          current={current}
          limit={limit}
          label={label}
          percentage={percentage}
          color={color}
          isOverLimit={isOverLimit}
          showUpgradeLink={showUpgradeLink}
          darkMode={darkMode}
          className={className}
        />
      );
    case 'inline':
      return (
        <InlineVariant
          current={current}
          limit={limit}
          remaining={remaining}
          label={label}
          color={color}
          isOverLimit={isOverLimit}
          showUpgradeLink={showUpgradeLink}
          darkMode={darkMode}
          className={className}
        />
      );
    case 'compact':
    default:
      return (
        <CompactVariant
          current={current}
          limit={limit}
          color={color}
          isOverLimit={isOverLimit}
          showUpgradeLink={showUpgradeLink}
          darkMode={darkMode}
          className={className}
        />
      );
  }
}

// Helper functions
function getColorFromPercentage(percentage: number): UsageColor {
  if (percentage >= 100) return 'red';
  if (percentage >= 75) return 'yellow';
  return 'green';
}

function formatEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    active_clients: 'clients',
    active_vendors: 'vendors',
    active_services: 'services',
    active_projects: 'projects',
    active_crm_contacts: 'contacts',
    active_invoices: 'invoices',
    active_quotes: 'quotes',
    active_expenses: 'expenses',
    active_credit_notes: 'credit notes',
  };
  return labels[entityType] || entityType.replace(/_/g, ' ');
}

function getColorClasses(color: UsageColor, darkMode: boolean): ColorClasses {
  const colors: Record<UsageColor, ColorClasses> = {
    green: {
      dot: 'bg-green-500',
      text: darkMode ? 'text-green-400' : 'text-green-600',
      bg: darkMode ? 'bg-green-900/30' : 'bg-green-100',
      border: darkMode ? 'border-green-700' : 'border-green-200',
      progress: 'bg-green-500',
    },
    yellow: {
      dot: 'bg-yellow-500',
      text: darkMode ? 'text-yellow-400' : 'text-yellow-600',
      bg: darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
      border: darkMode ? 'border-yellow-700' : 'border-yellow-200',
      progress: 'bg-yellow-500',
    },
    red: {
      dot: 'bg-red-500',
      text: darkMode ? 'text-red-400' : 'text-red-600',
      bg: darkMode ? 'bg-red-900/30' : 'bg-red-100',
      border: darkMode ? 'border-red-700' : 'border-red-200',
      progress: 'bg-red-500',
    },
  };
  return colors[color] || colors.green;
}

// Loading skeleton component
function LoadingSkeleton({ variant, darkMode, className }: LoadingSkeletonProps): React.ReactElement {
  const baseClasses = darkMode ? 'bg-gray-700' : 'bg-gray-200';

  switch (variant) {
    case 'badge':
      return (
        <div className={`animate-pulse ${className}`}>
          <div className={`h-8 w-24 rounded-lg ${baseClasses}`} />
        </div>
      );
    case 'inline':
      return (
        <div className={`animate-pulse ${className}`}>
          <div className={`h-4 w-20 rounded ${baseClasses}`} />
        </div>
      );
    case 'compact':
    default:
      return (
        <div className={`animate-pulse ${className}`}>
          <div className={`h-5 w-12 rounded ${baseClasses}`} />
        </div>
      );
  }
}

// Badge variant - full badge with progress bar
function BadgeVariant({ current, limit, label: _label, percentage, color, isOverLimit, showUpgradeLink, darkMode, className }: BadgeVariantProps): React.ReactElement {
  const colorClasses = getColorClasses(color, darkMode);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`px-3 py-1.5 rounded-lg border ${colorClasses.bg} ${colorClasses.border}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${colorClasses.text}`}>
            Usage: {current}/{limit}
          </span>
          <div className={`w-16 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full transition-all ${colorClasses.progress}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
      {showUpgradeLink && isOverLimit && (
        <Link
          to="/settings?tab=subscription"
          className="text-xs text-zenible-primary hover:underline"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}

// Compact variant - small format with color dot
function CompactVariant({ current, limit, color, isOverLimit, showUpgradeLink, darkMode, className }: CompactVariantProps): React.ReactElement {
  const colorClasses = getColorClasses(color, darkMode);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${colorClasses.dot}`} />
      <span className={`text-xs font-medium ${isOverLimit ? colorClasses.text : (darkMode ? 'text-gray-300' : 'text-gray-600')}`}>
        Usage: {current}/{limit}
      </span>
      {showUpgradeLink && isOverLimit && (
        <Link
          to="/settings?tab=subscription"
          className="text-xs text-zenible-primary hover:underline ml-1"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}

// Inline variant - text format
function InlineVariant({ current, limit, remaining: _remaining, label: _label, color, isOverLimit, showUpgradeLink, darkMode, className }: InlineVariantProps): React.ReactElement {
  const colorClasses = getColorClasses(color, darkMode);

  return (
    <span className={`text-xs ${isOverLimit ? colorClasses.text : (darkMode ? 'text-gray-400' : 'text-gray-600')} ${className}`}>
      Usage: {current}/{limit}
      {showUpgradeLink && isOverLimit && (
        <>
          {' · '}
          <Link
            to="/settings?tab=subscription"
            className="text-zenible-primary hover:underline"
          >
            Upgrade
          </Link>
        </>
      )}
    </span>
  );
}
