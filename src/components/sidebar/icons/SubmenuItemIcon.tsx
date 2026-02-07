import React from 'react';

interface SubmenuItemIconProps {
  className?: string;
  color?: string;
  isActive?: boolean;
}

export default function SubmenuItemIcon({ className = "w-6 h-6", color: _color = "currentColor", isActive = false }: SubmenuItemIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Vertical dashed line */}
      <line
        x1="1"
        y1="0"
        x2="1"
        y2="24"
        stroke="#E5E5E5"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {/* Circle */}
      <circle
        cx="4"
        cy="12"
        r="4"
        fill={isActive ? "#71717A" : "#A1A1AA"}
      />
      {/* Inner circle */}
      <circle
        cx="4"
        cy="12"
        r="3"
        fill="#E5E5E5"
      />
    </svg>
  );
}
