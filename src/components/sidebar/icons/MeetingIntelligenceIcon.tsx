import React from 'react';

interface MeetingIntelligenceIconProps {
  className?: string;
  color?: string;
}

export default function MeetingIntelligenceIcon({ className = "w-6 h-6", color = "currentColor" }: MeetingIntelligenceIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Video screen */}
      <path
        d="M2 9C2 6 3.5 4.5 6.5 4.5H13.5C16.5 4.5 18 6 18 9V15C18 18 16.5 19.5 13.5 19.5H6.5C3.5 19.5 2 18 2 15V9Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Camera lens / record button */}
      <path
        d="M22 8.5L18 11.5V12.5L22 15.5V8.5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Waveform lines inside screen */}
      <path
        d="M7 10.5V13.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 9V15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 10.5V13.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
