import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string | null;
  icon?: LucideIcon;
  iconColor?: string;
}

/**
 * KPI Card Component matching Figma design specifications
 * - White background with border (#e5e5e5)
 * - Title: 14px regular, #71717a
 * - Value: 18px semibold, #09090b
 * - Icon: 52x52px with colored background on right side
 * - Padding: 16px, Border radius: 12px
 * - Optional subtitle for additional details (e.g., currency breakdown)
 */
const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon: Icon, iconColor = 'blue' }) => {
  const iconColorVariants: Record<string, { bg: string; iconColor: string }> = {
    blue: {
      bg: 'bg-[#dff2fe]', // Blue light from Figma
      iconColor: 'text-[#0ea5e9]', // Blue-500
    },
    purple: {
      bg: 'bg-[#ede9fe]', // Purple light from Figma
      iconColor: 'text-[#8b5cf6]', // Purple-500
    },
    green: {
      bg: 'bg-[#dcfce7]', // Green light from Figma
      iconColor: 'text-[#00a63e]', // Green
    },
    yellow: {
      bg: 'bg-[#fef3c7]', // Yellow light
      iconColor: 'text-[#f59e0b]', // Yellow-500
    },
    red: {
      bg: 'bg-[#ffe2e2]', // Red light from Figma
      iconColor: 'text-[#ef4444]', // Red-500
    },
    orange: {
      bg: 'bg-[#ffedd5]', // Orange light
      iconColor: 'text-[#f97316]', // Orange-500
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
        <p className="text-base md:text-lg font-semibold text-[#09090b] leading-[22px] md:leading-[26px]">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-[#a1a1aa] leading-[18px] mt-1">
            {subtitle}
          </p>
        )}
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

export default React.memo(KPICard);
