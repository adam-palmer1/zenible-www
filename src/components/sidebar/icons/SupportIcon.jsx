import React from 'react';

export default function SupportIcon({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="10"
        cy="10"
        r="7.5"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M7.5 7.5C7.5 6.11929 8.61929 5 10 5C11.3807 5 12.5 6.11929 12.5 7.5C12.5 8.88071 11.3807 10 10 10V11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="10"
        cy="14"
        r="0.5"
        fill={color}
      />
    </svg>
  );
}