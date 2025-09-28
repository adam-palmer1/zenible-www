import React from 'react';

export default function SidebarHeader() {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3">
        {/* Brand Icon - Purple background with white Z */}
        <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center">
          <span className="text-white font-bold text-sm">Z</span>
        </div>

        {/* Brand Text */}
        <div className="flex flex-col">
          <span className="text-[#111827] font-semibold text-sm leading-5">
            Zenible
          </span>
          <span className="text-[#6B7280] text-xs leading-4">
            Free Plan
          </span>
        </div>
      </div>
    </div>
  );
}