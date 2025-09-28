import React from 'react';

export default function UpgradeIcon({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2.5L13.5 6H11V13.5H9V6H6.5L10 2.5Z"
        fill={color}
      />
      <path
        d="M4.5 17.5H15.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}