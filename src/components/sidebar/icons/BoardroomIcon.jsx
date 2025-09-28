import React from 'react';

export default function BoardroomIcon({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="7"
        cy="6"
        r="2.5"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="13"
        cy="6"
        r="2.5"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M2 17.5C2 14.7386 4.23858 12.5 7 12.5C9.76142 12.5 12 14.7386 12 17.5"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 17.5C8 14.7386 10.2386 12.5 13 12.5C15.7614 12.5 18 14.7386 18 17.5"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}