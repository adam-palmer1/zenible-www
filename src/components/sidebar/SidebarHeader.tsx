import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import planAPI from '../../services/planAPI';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function SidebarHeader({ isCollapsed, onToggle }: SidebarHeaderProps) {
  const { user: rawUser } = useAuth();
  const user = rawUser as any;
  const [planName, setPlanName] = useState('Free Plan');

  useEffect(() => {
    const fetchPlanName = async () => {
      if (user && user.current_plan_id) {
        try {
          const planDetails = await planAPI.getPublicPlanDetails(user.current_plan_id) as any;
          if (planDetails && planDetails.name) {
            setPlanName(`${planDetails.name} Plan`);
          }
        } catch (error) {
          console.error('Failed to fetch plan details:', error);
          // Keep default "Free Plan" if fetch fails
        }
      }
    };

    fetchPlanName();
  }, [user]);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Brand Icon - Purple background with white Z */}
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center">
            <span className="text-white font-bold text-sm">Z</span>
          </div>

          {/* Brand Text - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-[#111827] font-semibold text-sm leading-5">
                Zenible
              </span>
              <span className="text-[#6B7280] text-xs leading-4">
                {planName}
              </span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isCollapsed ? (
              // Expand icon (>)
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            ) : (
              // Collapse icon (<)
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
