import React from 'react';

interface FinanceIconProps {
  className?: string;
  color?: string;
}

export default function FinanceIcon({ className = "w-6 h-6", color = "currentColor" }: FinanceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Front banknote */}
      <path
        d="M2 8.5H17C17.55 8.5 18 8.95 18 9.5V19.5C18 20.05 17.55 20.5 17 20.5H3C2.45 20.5 2 20.05 2 19.5V8.5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Back banknote */}
      <path
        d="M6 8.5V5.5C6 4.95 6.45 4.5 7 4.5H21C21.55 4.5 22 4.95 22 5.5V15.5C22 16.05 21.55 16.5 21 16.5H18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center circle on front note */}
      <circle
        cx="10"
        cy="14.5"
        r="2.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
