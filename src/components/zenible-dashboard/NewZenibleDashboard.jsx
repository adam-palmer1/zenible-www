import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Squares2X2Icon } from '@heroicons/react/24/outline';
import NewSidebar from '../sidebar/NewSidebar';
import { SortableWidgetGrid, WidgetCustomizer } from './widgets';
import mainIcon from '../../assets/icons/dashboard/icon.svg';

export default function NewZenibleDashboard() {
  const { user } = useAuth();
  const firstName = user?.first_name || user?.email?.split('@')[0] || 'there';

  // State for widget customizer modal
  const [showCustomizer, setShowCustomizer] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col relative size-full transition-all duration-300 overflow-y-auto bg-gray-50"
        style={{ marginLeft: 'var(--sidebar-width, 280px)' }}
      >
        {/* Welcome Header */}
        <div className="box-border flex flex-col gap-1 items-start p-4 shrink-0 w-full bg-white border-b border-gray-100">
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="font-semibold text-2xl text-zinc-950">
                Welcome back, {firstName}!
              </p>
              <p className="font-normal text-sm text-zinc-500">
                Let's make today count.
              </p>
            </div>

            {/* Customize Dashboard Button */}
            <button
              onClick={() => setShowCustomizer(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Squares2X2Icon className="w-4 h-4" />
              Customize
            </button>
          </div>
        </div>

        {/* Profile Setup Card - "Personalize Your AI Experience" */}
        <div className="px-4 py-3 shrink-0 w-full">
          <div className="bg-violet-50 border border-[#c4b4ff] rounded-xl p-4">
            <div className="flex gap-4 items-center">
              <div className="bg-white p-2 rounded-lg shrink-0">
                <img alt="" className="w-6 h-6" src={mainIcon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg text-zinc-950">
                  Personalize Your AI Experience
                </p>
                <p className="text-xs text-zinc-500">
                  Complete your professional profile to get more relevant and tailored proposal feedback.
                </p>
              </div>
              <button className="bg-[#8e51ff] px-4 py-2.5 rounded-lg shrink-0 hover:bg-[#7b3ff0] transition-colors">
                <span className="font-medium text-white">
                  Setup Profile
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sortable Widget Grid */}
        <div className="flex-1 pb-4">
          <SortableWidgetGrid onOpenCustomizer={() => setShowCustomizer(true)} />
        </div>
      </div>

      {/* Widget Customizer Modal */}
      <WidgetCustomizer
        open={showCustomizer}
        onOpenChange={setShowCustomizer}
      />
    </div>
  );
}
