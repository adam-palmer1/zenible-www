/**
 * Dashboard Data Hook
 *
 * Single React Query hook that fetches all visible widget data
 * from the aggregate dashboard endpoint.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import dashboardAPI, { type DashboardWidgetParams } from '../../services/api/dashboard';

/**
 * Maps widget registry IDs to backend widget parameter names.
 */
const WIDGET_ID_MAP: Record<string, string> = {
  tipOfTheDay: 'tip',
  currentProjects: 'projects',
  monthlyIncomeGoal: 'monthly_income',
  profitAndLoss: 'pnl',
  outstandingInvoices: 'outstanding_invoices',
  recentInvoices: 'recent_invoices',
  recentClients: 'recent_clients',
  upcomingAppointments: 'appointments',
};

/**
 * Maps widget registry IDs to the response data keys.
 */
const WIDGET_DATA_KEY_MAP: Record<string, string> = {
  tipOfTheDay: 'tip_of_the_day',
  currentProjects: 'current_projects',
  monthlyIncomeGoal: 'monthly_income_summary',
  profitAndLoss: 'profit_and_loss',
  outstandingInvoices: 'outstanding_invoices',
  recentInvoices: 'recent_invoices',
  recentClients: 'recent_clients',
  upcomingAppointments: 'upcoming_appointments',
};

/**
 * Widget IDs that are supported by the aggregate endpoint.
 */
const SUPPORTED_WIDGET_IDS = new Set(Object.keys(WIDGET_ID_MAP));

/**
 * Flatten widget settings from the preferences into query params.
 */
function flattenSettings(
  visibleWidgetIds: string[],
  widgetSettings: Record<string, Record<string, any>>
): Partial<DashboardWidgetParams> {
  const params: Partial<DashboardWidgetParams> = {};

  for (const id of visibleWidgetIds) {
    const settings = widgetSettings[id] || {};

    switch (id) {
      case 'monthlyIncomeGoal':
        if (settings.monthlyGoal !== undefined) params.monthly_goal = settings.monthlyGoal;
        if (settings.currency) params.monthly_goal_currency = settings.currency;
        break;
      case 'profitAndLoss':
        if (settings.periodMonths !== undefined) params.pnl_period_months = settings.periodMonths;
        break;
      case 'currentProjects':
        if (settings.limit !== undefined) params.projects_limit = settings.limit;
        break;
      case 'recentClients':
        if (settings.limit !== undefined) params.clients_limit = settings.limit;
        break;
      case 'upcomingAppointments':
        if (settings.days !== undefined) params.appointments_days = settings.days;
        if (settings.limit !== undefined) params.appointments_limit = settings.limit;
        break;
      case 'recentInvoices':
        if (settings.limit !== undefined) params.invoices_limit = settings.limit;
        break;
    }
  }

  return params;
}

export function useDashboardData(
  visibleWidgetIds: string[],
  widgetSettings: Record<string, Record<string, any>>
) {
  // Filter to only widgets supported by the aggregate endpoint
  const supportedIds = visibleWidgetIds.filter((id) => SUPPORTED_WIDGET_IDS.has(id));
  const backendWidgetIds = supportedIds.map((id) => WIDGET_ID_MAP[id]);
  const settings = flattenSettings(supportedIds, widgetSettings);

  return useQuery({
    queryKey: queryKeys.dashboard.widgets(supportedIds),
    queryFn: () =>
      dashboardAPI.getWidgets({
        widgets: backendWidgetIds,
        ...settings,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: supportedIds.length > 0,
  });
}

/**
 * Get the data key for a widget from the response.
 */
export function getWidgetDataKey(widgetId: string): string | undefined {
  return WIDGET_DATA_KEY_MAP[widgetId];
}

export { SUPPORTED_WIDGET_IDS, WIDGET_DATA_KEY_MAP };
