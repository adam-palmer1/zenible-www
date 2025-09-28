import React from 'react';

export default function ProposalWizardIcon({ className = "w-5 h-5", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.5 15L5.5 12L8.5 15L15.5 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12.5 8H15.5V11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="1.5"
        y="1.5"
        width="17"
        height="17"
        rx="2"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}