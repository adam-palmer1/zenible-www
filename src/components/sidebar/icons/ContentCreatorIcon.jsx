import React from 'react';

export default function ContentCreatorIcon({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="2"
        y="4"
        width="16"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 9L11 10.5L8 12V9Z"
        fill={color}
      />
    </svg>
  );
}