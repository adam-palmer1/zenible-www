import React from 'react';

export default function ChevronDownIcon({ className = "w-4 h-4", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 11 6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.1666 1.00008L5.58324 5.0095L0.999919 1.00008"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
