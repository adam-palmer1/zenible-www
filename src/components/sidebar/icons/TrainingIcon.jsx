import React from 'react';

export default function TrainingIcon({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 2.5H16C16.8284 2.5 17.5 3.17157 17.5 4V16C17.5 16.8284 16.8284 17.5 16 17.5H4C3.17157 17.5 2.5 16.8284 2.5 16V4C2.5 3.17157 3.17157 2.5 4 2.5Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M6.5 6.5H13.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.5 9H13.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11.5H11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}