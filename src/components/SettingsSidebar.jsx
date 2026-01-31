import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import planAPI from '../services/planAPI';
import UserProfileSection from './sidebar/UserProfileSection';
import {
  UserIcon,
  CreditCardIcon,
  PaintBrushIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function SettingsSidebar({ activeTab, setActiveTab }) {
  const { darkMode } = usePreferences();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [planName, setPlanName] = useState('Free Plan');

  useEffect(() => {
    const fetchPlanName = async () => {
      if (user && user.current_plan_id) {
        try {
          const planDetails = await planAPI.getPublicPlanDetails(user.current_plan_id);
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

  const accountSettings = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'subscription', label: 'Subscription', icon: CreditCardIcon },
    { id: 'customization', label: 'Customization', icon: PaintBrushIcon },
  ];

  const companySettings = [
    { id: 'company', label: 'Company Profile', icon: BuildingOfficeIcon },
    { id: 'localization', label: 'Localization', icon: GlobeAltIcon },
    { id: 'email-templates', label: 'Email Templates', icon: EnvelopeIcon },
    { id: 'booking', label: 'Booking', icon: CalendarDaysIcon },
    { id: 'integrations', label: 'Integrations', icon: PuzzlePieceIcon },
    { id: 'advanced', label: 'Advanced', icon: Cog6ToothIcon },
  ];

  return (
    <div className={`fixed left-0 top-0 h-screen w-[280px] flex flex-col border-r z-40 ${
      darkMode
        ? 'bg-zenible-dark-sidebar border-zenible-dark-border'
        : 'bg-white border-neutral-200'
    }`}>
      {/* Brand Logo Section - Matches SidebarHeader */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
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
                {planName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto">
        {/* Account Settings Section */}
        <div className="p-4">
          <p className={`font-inter font-medium text-xs leading-5 mb-2 ${
            darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
          }`}>Account Settings</p>
          <div className="flex flex-col gap-1">
            {accountSettings.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? darkMode
                        ? 'bg-zenible-dark-tab-bg border border-zenible-primary'
                        : 'bg-zenible-tab-bg border border-zenible-primary'
                      : darkMode
                        ? 'hover:bg-zenible-dark-card'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? 'text-zenible-primary'
                        : darkMode
                          ? 'text-zenible-dark-text-secondary'
                          : 'text-zinc-500'
                    }`}
                  />
                  <span className={`font-inter font-medium text-sm ${
                    isActive
                      ? darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                      : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Separator */}
        <div className={`mx-4 h-px ${
          darkMode ? 'bg-zenible-dark-border' : 'bg-zenible-stroke'
        }`} />

        {/* Company Settings Section */}
        <div className="p-4">
          <p className={`font-inter font-medium text-xs leading-5 mb-2 ${
            darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
          }`}>Company Settings</p>
          <div className="flex flex-col gap-1">
            {companySettings.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? darkMode
                        ? 'bg-zenible-dark-tab-bg border border-zenible-primary'
                        : 'bg-zenible-tab-bg border border-zenible-primary'
                      : darkMode
                        ? 'hover:bg-zenible-dark-card'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? 'text-zenible-primary'
                        : darkMode
                          ? 'text-zenible-dark-text-secondary'
                          : 'text-zinc-500'
                    }`}
                  />
                  <span className={`font-inter font-medium text-sm ${
                    isActive
                      ? darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                      : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <UserProfileSection />
    </div>
  );
}
