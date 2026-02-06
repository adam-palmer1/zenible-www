import React, { Suspense, lazy, useState } from 'react';
import { EllipsisVerticalIcon, EyeSlashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Dropdown from '../../ui/dropdown/Dropdown';
import { WIDGET_REGISTRY, getDefaultWidgetSettings } from './WidgetRegistry';
import { usePreferences } from '../../../contexts/PreferencesContext';

// Lazy load widget components for code splitting
const widgetComponents = {
  CurrentProjectsWidget: lazy(() => import('./CurrentProjectsWidget')),
  TipOfTheDayWidget: lazy(() => import('./TipOfTheDayWidget')),
  RecentInvoicesWidget: lazy(() => import('./RecentInvoicesWidget')),
  RecentClientsWidget: lazy(() => import('./RecentClientsWidget')),
  RecentExpensesWidget: lazy(() => import('./RecentExpensesWidget')),
  OutstandingInvoicesWidget: lazy(() => import('./OutstandingInvoicesWidget')),
  RecentPaymentsWidget: lazy(() => import('./RecentPaymentsWidget')),
  CurrencyExchangeWidget: lazy(() => import('./CurrencyExchangeWidget')),
  UpcomingAppointmentsWidget: lazy(() => import('./UpcomingAppointmentsWidget')),
  UpcomingCallsWidget: lazy(() => import('./UpcomingCallsWidget')),
  MonthlyIncomeGoalWidget: lazy(() => import('./MonthlyIncomeGoalWidget')),
  ProfitAndLossWidget: lazy(() => import('./ProfitAndLossWidget')),
};

// Loading skeleton for widgets
const WidgetSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
    <div className="h-20 bg-gray-200 rounded" />
  </div>
);

/**
 * WidgetWrapper - Container component for dashboard widgets
 *
 * Features:
 * - Drag handle for react-grid-layout (via .widget-drag-handle class)
 * - 3-dot action menu with Hide and Settings options
 * - Lazy loading of widget content
 * - Consistent styling across all widgets
 * - Fills entire grid cell height
 */
const WidgetWrapper = ({
  widgetId,
  onHide,
  onOpenSettings,
  isDragging = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { getPreference } = usePreferences();
  const config = WIDGET_REGISTRY[widgetId];

  // Get widget-specific settings from preferences
  const widgetSettings = getPreference(
    `dashboard_widget_settings_${widgetId}`,
    getDefaultWidgetSettings(widgetId)
  );

  // Get the widget component
  const WidgetComponent = widgetComponents[config?.component];

  if (!config || !WidgetComponent) {
    console.warn(`Widget not found: ${widgetId}`);
    return null;
  }

  return (
    <div className="h-full w-full">
      {/* Card container */}
      <div
        className={`group bg-white border border-neutral-200 rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all ${
          isDragging ? 'shadow-lg ring-2 ring-[#8e51ff] ring-opacity-50' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header with drag handle and action menu */}
        <div className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing select-none flex-shrink-0">
          <h3 className="text-sm font-medium text-zinc-700 truncate">
            {config.name}
          </h3>

          {/* 3-dot action menu - stops propagation to prevent drag while clicking */}
          <div
            className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Dropdown
              trigger={
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Widget options"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </button>
              }
              align="end"
              side="bottom"
            >
              {config.hasSettings && (
                <Dropdown.Item onSelect={() => onOpenSettings?.(widgetId)}>
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Settings
                </Dropdown.Item>
              )}
              <Dropdown.Item onSelect={() => onHide?.(widgetId)}>
                <EyeSlashIcon className="h-4 w-4 mr-2" />
                Hide
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>

        {/* Widget content - fills remaining space */}
        <div className="px-3 pb-3 flex-1 min-h-0 overflow-hidden">
          <Suspense fallback={<WidgetSkeleton />}>
            <WidgetComponent settings={widgetSettings} isHovered={isHovered} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default WidgetWrapper;
