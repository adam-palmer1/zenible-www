import React from 'react';

export default function BusinessSchoolIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.05 2.53L4.03 6.46C2.1 7.72 2.1 10.54 4.03 11.8L10.05 15.73C11.13 16.44 12.91 16.44 13.99 15.73L19.98 11.8C21.9 10.54 21.9 7.73 19.98 6.47L13.99 2.54C12.91 1.82 11.13 1.82 10.05 2.53Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.63 13.08L5.62 17.77C5.62 19.04 6.6 20.4 7.8 20.8L10.99 21.86C11.54 22.04 12.45 22.04 13.01 21.86L16.2 20.8C17.4 20.4 18.38 19.04 18.38 17.77V13.13"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.4 15V9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}