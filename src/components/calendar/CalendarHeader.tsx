import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: string;
  onNavigateDate: (direction: string) => void;
  onViewModeChange: (viewMode: string) => void;
  onNewAppointment: () => void;
  onToday: () => void;
  onOpenSettings: () => void;
}

export default function CalendarHeader({
  currentDate,
  viewMode,
  onNavigateDate,
  onViewModeChange,
  onNewAppointment,
  onToday,
  onOpenSettings,
}: CalendarHeaderProps) {
  return (
    <div className="p-3 md:p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigateDate('prev')}
          className="p-2.5 hover:bg-gray-100 rounded"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h2 className={`font-semibold text-gray-900 ${viewMode === 'daily' ? 'text-base' : 'text-xl'}`}>
          {viewMode === 'daily' && format(currentDate, 'd MMM yyyy')}
          {viewMode === 'weekly' && format(currentDate, 'MMM yyyy')}
          {viewMode === 'monthly' && format(currentDate, 'MMM yyyy')}
        </h2>
        <button
          onClick={() => onNavigateDate('next')}
          className="p-2.5 hover:bg-gray-100 rounded"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          Today
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {/* View Mode Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('daily')}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'daily'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => onViewModeChange('weekly')}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'weekly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => onViewModeChange('monthly')}
            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
        </div>

        <button
          onClick={onNewAppointment}
          className="px-3 md:px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">New Appointment</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Calendar Settings"
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
