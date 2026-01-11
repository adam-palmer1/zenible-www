import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Reusable financial statistics card component
 */
const FinancialStatsCard = ({
  title,
  value,
  trend = null,
  icon: Icon,
  color = 'blue',
  suffix = '',
  prefix = '',
  subtitle = null,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return TrendingUp;
    if (trend.direction === 'down') return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    // For expense metrics, down is good (green), up is bad (red)
    if (trend.inverse) {
      return trend.direction === 'down' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
    // For revenue metrics, up is good (green), down is bad (red)
    return trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className="design-bg-primary rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium design-text-secondary">{title}</p>
          <p className="text-2xl font-bold design-text-primary mt-1">
            {prefix}{value}{suffix}
          </p>
          {subtitle && (
            <p className="text-xs design-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          {TrendIcon && <TrendIcon className={`w-4 h-4 ${getTrendColor()}`} />}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
            {Math.abs(trend.percentage || 0).toFixed(1)}%
          </span>
          <span className="text-sm design-text-secondary">
            {trend.period || 'from last period'}
          </span>
        </div>
      )}
    </div>
  );
};

export default FinancialStatsCard;
