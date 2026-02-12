import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import planAPI from '../../services/planAPI';
import type { PlanDetailResponse } from '../../types';
import brandIcon from '../../assets/icons/brand-icon.svg';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export default function SidebarHeader({ isCollapsed, onToggle, isMobile = false }: SidebarHeaderProps) {
  const { user: rawUser } = useAuth();
  const user = rawUser;
  const [planName, setPlanName] = useState('Free Plan');

  useEffect(() => {
    const fetchPlanName = async () => {
      if (user && user.current_plan_id) {
        try {
          const planDetails = await planAPI.getPublicPlanDetails(user.current_plan_id) as PlanDetailResponse;
          if (planDetails && planDetails.name) {
            setPlanName(`${planDetails.name} Plan`);
          }
        } catch (error) {
          console.error('Failed to fetch plan details:', error);
        }
      }
    };

    fetchPlanName();
  }, [user]);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Brand Icon - Purple background with Zenible logo */}
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center p-[6px]">
            <img src={brandIcon} alt="" className="w-[19.2px] h-[19.2px]" />
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

        {/* Toggle / Close Button */}
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center lg:p-1 lg:min-h-0 lg:min-w-0"
          title={isMobile ? "Close menu" : isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isMobile ? (
            // X close icon for mobile
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
