import React, { Suspense, lazy } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
 * WidgetWrapper - Sortable wrapper component for dashboard widgets
 *
 * Features:
 * - Drag handle via useSortable
 * - 3-dot action menu with Hide and Settings options
 * - Lazy loading of widget content
 * - Consistent styling across all widgets
 */
const WidgetWrapper = ({
  widgetId,
  onHide,
  onOpenSettings,
  isDragOverlay = false,
}) => {
  const { getPreference } = usePreferences();
  const config = WIDGET_REGISTRY[widgetId];

  // Get sortable props
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widgetId, disabled: isDragOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  // Determine width class for full-width widgets
  const widthClass = config.fullWidth ? 'md:col-span-2 lg:col-span-3' : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group
        ${widthClass}
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${isDragOverlay ? 'shadow-xl rotate-2' : ''}
      `}
    >
      {/* Card container */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden h-full flex flex-col">
        {/* Header with drag handle and action menu */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-between p-4 pb-2 cursor-grab active:cursor-grabbing"
        >
          <h3 className="text-base font-medium text-zinc-700">
            {config.name}
          </h3>

          {/* 3-dot action menu */}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Dropdown
              trigger={
                <button
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Widget options"
                >
                  <EllipsisVerticalIcon className="h-5 w-5" />
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

        {/* Widget content */}
        <div className="p-4 pt-2 flex-1 overflow-hidden">
          <Suspense fallback={<WidgetSkeleton />}>
            <WidgetComponent settings={widgetSettings} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default WidgetWrapper;
