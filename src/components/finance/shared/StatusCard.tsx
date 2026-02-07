import React from 'react';

interface StatusCardProps {
  count: React.ReactNode;
  label: string;
}

/**
 * Status Card Component matching Figma design specifications
 * - White background with border (#e5e5e5)
 * - Number: 18px semibold, #09090b (centered)
 * - Label: 14px regular, #71717a (centered)
 * - Padding: 16px, Border radius: 12px
 * - Simple centered layout with no color variants
 */
const StatusCard: React.FC<StatusCardProps> = ({ count, label }) => {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
      <div className="text-center">
        <p className="text-lg font-semibold text-[#09090b] leading-[26px] mb-1">
          {count}
        </p>
        <p className="text-sm text-[#71717a] leading-[22px]">
          {label}
        </p>
      </div>
    </div>
  );
};

export default React.memo(StatusCard);
