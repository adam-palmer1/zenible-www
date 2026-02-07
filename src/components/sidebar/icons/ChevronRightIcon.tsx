import React from 'react';

interface ChevronRightIconProps {
  className?: string;
  color?: string;
}

export default function ChevronRightIcon({ className = "w-4 h-4", color = "currentColor" }: ChevronRightIconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 12L10 8L6 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
