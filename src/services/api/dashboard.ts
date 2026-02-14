/**
 * Dashboard API Service
 * Fetches aggregated widget data from the dashboard endpoint.
 */

import { createRequest } from './httpClient';
import { buildQueryString } from './httpClient';

const request = createRequest('DashboardAPI');

export interface DashboardWidgetData {
  tip_of_the_day: any | null;
  current_projects: any[] | null;
  monthly_income_summary: any | null;
  profit_and_loss: any | null;
  outstanding_invoices: any | null;
  recent_invoices: any[] | null;
  recent_clients: any[] | null;
  upcoming_appointments: any[] | null;
}

export interface DashboardResponse {
  widgets: DashboardWidgetData;
  fetched_at: string;
}

export interface DashboardWidgetParams {
  widgets: string[];
  monthly_goal?: number;
  monthly_goal_currency?: string;
  pnl_period_months?: number;
  projects_limit?: number;
  clients_limit?: number;
  appointments_days?: number;
  appointments_limit?: number;
  invoices_limit?: number;
}

/**
 * Fetch aggregated dashboard widget data.
 */
async function getWidgets(params: DashboardWidgetParams): Promise<DashboardResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    widgets: params.widgets.join(','),
    monthly_goal: params.monthly_goal,
    monthly_goal_currency: params.monthly_goal_currency,
    pnl_period_months: params.pnl_period_months,
    projects_limit: params.projects_limit,
    clients_limit: params.clients_limit,
    appointments_days: params.appointments_days,
    appointments_limit: params.appointments_limit,
    invoices_limit: params.invoices_limit,
  };

  const qs = buildQueryString(queryParams as Record<string, any>);
  const endpoint = qs ? `/dashboard/widgets?${qs}` : '/dashboard/widgets';

  return request<DashboardResponse>(endpoint, { method: 'GET' });
}

const dashboardAPI = { getWidgets };
export default dashboardAPI;
