/**
 * DashboardDataContext
 *
 * Provides aggregated dashboard widget data to child widgets via context.
 * Replaces individual useState+useEffect data fetching in each widget with
 * a single React Query call to the aggregate endpoint.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { usePreferences } from './PreferencesContext';
import { WIDGET_REGISTRY, getDefaultWidgetSettings } from '../components/zenible-dashboard/widgets/WidgetRegistry';
import { useDashboardData, WIDGET_DATA_KEY_MAP, SUPPORTED_WIDGET_IDS } from '../hooks/dashboard/useDashboardData';

interface DashboardWidgetState {
  data: any;
  isLoading: boolean;
  error: Error | null;
}

interface DashboardDataContextValue {
  /** Get data for a specific widget by its registry ID */
  getWidgetData: (widgetId: string) => DashboardWidgetState;
  /** Whether the aggregate query is loading */
  isLoading: boolean;
  /** Error from the aggregate query */
  error: Error | null;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

interface DashboardDataProviderProps {
  visibleWidgetIds: string[];
  children: React.ReactNode;
}

export function DashboardDataProvider({ visibleWidgetIds, children }: DashboardDataProviderProps) {
  const { getPreference } = usePreferences();

  // Collect widget settings from preferences
  const widgetSettings = useMemo(() => {
    const settings: Record<string, Record<string, any>> = {};
    for (const id of visibleWidgetIds) {
      settings[id] = getPreference(
        `dashboard_widget_settings_${id}`,
        getDefaultWidgetSettings(id)
      ) as Record<string, any>;
    }
    return settings;
  }, [visibleWidgetIds, getPreference]);

  const { data, isLoading, error } = useDashboardData(visibleWidgetIds, widgetSettings);

  const contextValue = useMemo<DashboardDataContextValue>(() => ({
    getWidgetData: (widgetId: string): DashboardWidgetState => {
      // If widget is not supported by aggregate endpoint, return empty state
      if (!SUPPORTED_WIDGET_IDS.has(widgetId)) {
        return { data: null, isLoading: false, error: null };
      }

      const dataKey = WIDGET_DATA_KEY_MAP[widgetId];
      if (!dataKey) {
        return { data: null, isLoading: false, error: null };
      }

      const widgetData = data?.widgets?.[dataKey as keyof typeof data.widgets] ?? null;

      return {
        data: widgetData,
        isLoading,
        error: error as Error | null,
      };
    },
    isLoading,
    error: error as Error | null,
  }), [data, isLoading, error]);

  return (
    <DashboardDataContext.Provider value={contextValue}>
      {children}
    </DashboardDataContext.Provider>
  );
}

/**
 * Hook to consume dashboard data for a specific widget.
 *
 * Usage in a widget:
 *   const { data, isLoading, error } = useDashboardWidget('currentProjects');
 */
export function useDashboardWidget(widgetId: string): DashboardWidgetState {
  const context = useContext(DashboardDataContext);

  // If not wrapped in provider (e.g., widget used outside dashboard), return loading state
  if (!context) {
    return { data: null, isLoading: true, error: null };
  }

  return context.getWidgetData(widgetId);
}

export default DashboardDataContext;
