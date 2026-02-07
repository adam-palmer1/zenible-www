import React from 'react';

interface CRMIconProps {
  className?: string;
  color?: string;
}

export default function CRMIcon({ className = "w-6 h-6", color = "currentColor" }: CRMIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Database/contacts icon representing CRM */}
      <path
        d="M12 14C16.4183 14 20 12.2091 20 10C20 7.79086 16.4183 6 12 6C7.58172 6 4 7.79086 4 10C4 12.2091 7.58172 14 12 14Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 10V16C4 18.21 7.58 20 12 20C16.42 20 20 18.21 20 16V10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 10V13"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 10V13"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 2H15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2V6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
