import React from 'react';

/**
 * KPI Card Component matching Figma design specifications
 * - White background with border (#e5e5e5)
 * - Title: 14px regular, #71717a
 * - Value: 18px semibold, #09090b
 * - Icon: 52x52px with colored background on right side
 * - Padding: 16px, Border radius: 12px
 */
const KPICard = ({ title, value, icon: Icon, iconColor = 'blue' }) => {
  const iconColorVariants = {
    blue: {
      bg: 'bg-[#dff2fe]', // Blue light from Figma
      iconColor: 'text-[#0ea5e9]', // Blue-500
    },
    green: {
      bg: 'bg-[#d1fae5]', // Green light
      iconColor: 'text-[#10b981]', // Green-500
    },
    yellow: {
      bg: 'bg-[#fef3c7]', // Yellow light
      iconColor: 'text-[#f59e0b]', // Yellow-500
    },
    red: {
      bg: 'bg-[#fee2e2]', // Red light
      iconColor: 'text-[#ef4444]', // Red-500
    },
  };

  const colors = iconColorVariants[iconColor] || iconColorVariants.blue;

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 flex items-start justify-between gap-4">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#71717a] leading-[22px] mb-1">
          {title}
        </p>
        <p className="text-lg font-semibold text-[#09090b] leading-[26px]">
          {value}
        </p>
      </div>

      {/* Icon */}
      {Icon && (
        <div className={`w-[52px] h-[52px] ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
      )}
    </div>
  );
};

export default KPICard;
