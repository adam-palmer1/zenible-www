/**
 * Widget Registry - Central configuration for all dashboard widgets
 *
 * Each widget defines:
 * - id: Unique identifier used for preferences storage
 * - name: Display name shown in UI
 * - description: Brief description for widget customizer
 * - component: Component name to lazy load
 * - defaultVisible: Whether widget is visible by default
 * - defaultOrder: Default sort order (lower = earlier)
 * - hasSettings: Whether widget has configurable settings
 * - settingsSchema: Schema for settings (if hasSettings is true)
 * - category: Widget category for grouping in customizer
 * - fullWidth: Whether widget spans full width (optional)
 */

export interface WidgetSettingsField {
  type: string;
  default: any;
  min?: number;
  max?: number;
  label: string;
  options?: any[];
}

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  component: string;
  defaultVisible: boolean;
  defaultOrder: number;
  hasSettings: boolean;
  settingsSchema?: Record<string, WidgetSettingsField>;
  category: string;
  fullWidth?: boolean;
  defaultSize: { w: number; h: number };
}

export interface WidgetCategory {
  name: string;
  order: number;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const WIDGET_REGISTRY: Record<string, WidgetConfig> = {
  tipOfTheDay: {
    id: 'tipOfTheDay',
    name: 'Tip of the Day',
    description: 'Daily tips to improve your workflow',
    component: 'TipOfTheDayWidget',
    defaultVisible: true,
    defaultOrder: 0,
    hasSettings: false,
    category: 'general',
    fullWidth: true,
    defaultSize: { w: 1, h: 1 },
  },

  currentProjects: {
    id: 'currentProjects',
    name: 'Current Projects',
    description: 'Shows your active, planning, and on-hold projects',
    component: 'CurrentProjectsWidget',
    defaultVisible: true,
    defaultOrder: 1,
    hasSettings: true,
    settingsSchema: {
      limit: { type: 'number', default: 3, min: 1, max: 10, label: 'Number of projects' },
    },
    category: 'crm',
    defaultSize: { w: 1, h: 2 },
  },

  monthlyIncomeGoal: {
    id: 'monthlyIncomeGoal',
    name: 'Monthly Income Goal',
    description: 'Track progress toward your monthly income target',
    component: 'MonthlyIncomeGoalWidget',
    defaultVisible: true,
    defaultOrder: 2,
    hasSettings: true,
    settingsSchema: {
      monthlyGoal: { type: 'number', default: 5000, min: 0, label: 'Monthly Goal' },
      currency: { type: 'currency', default: 'USD', label: 'Currency' },
    },
    category: 'finance',
    defaultSize: { w: 1, h: 2 },
  },

  profitAndLoss: {
    id: 'profitAndLoss',
    name: 'Profit & Loss',
    description: 'Revenue vs expenses with net profit/loss chart',
    component: 'ProfitAndLossWidget',
    defaultVisible: true,
    defaultOrder: 3,
    hasSettings: true,
    settingsSchema: {
      periodMonths: { type: 'select', default: 6, options: [3, 6, 12], label: 'Period (months)' },
    },
    category: 'finance',
    defaultSize: { w: 1, h: 2 },
  },

  outstandingInvoices: {
    id: 'outstandingInvoices',
    name: 'Outstanding Invoices',
    description: 'Summary of unpaid and overdue invoices',
    component: 'OutstandingInvoicesWidget',
    defaultVisible: true,
    defaultOrder: 4,
    hasSettings: false,
    category: 'finance',
    defaultSize: { w: 1, h: 1 },
  },

  recentInvoices: {
    id: 'recentInvoices',
    name: 'Recent Invoices',
    description: 'Latest invoices created or updated',
    component: 'RecentInvoicesWidget',
    defaultVisible: true,
    defaultOrder: 5,
    hasSettings: true,
    settingsSchema: {
      limit: { type: 'number', default: 5, min: 3, max: 10, label: 'Number of invoices' },
    },
    category: 'finance',
    defaultSize: { w: 1, h: 2 },
  },

  recentPayments: {
    id: 'recentPayments',
    name: 'Recent Payments',
    description: 'Latest payments received',
    component: 'RecentPaymentsWidget',
    defaultVisible: false,
    defaultOrder: 6,
    hasSettings: true,
    settingsSchema: {
      limit: { type: 'number', default: 5, min: 3, max: 10, label: 'Number of payments' },
    },
    category: 'finance',
    defaultSize: { w: 1, h: 2 },
  },

  recentExpenses: {
    id: 'recentExpenses',
    name: 'Recent Expenses',
    description: 'Your latest recorded expenses',
    component: 'RecentExpensesWidget',
    defaultVisible: false,
    defaultOrder: 7,
    hasSettings: true,
    settingsSchema: {
      limit: { type: 'number', default: 5, min: 3, max: 10, label: 'Number of expenses' },
    },
    category: 'finance',
    defaultSize: { w: 1, h: 2 },
  },

  currencyExchange: {
    id: 'currencyExchange',
    name: 'Currency Exchange',
    description: 'Live exchange rates with historical chart',
    component: 'CurrencyExchangeWidget',
    defaultVisible: false,
    defaultOrder: 8,
    hasSettings: true,
    settingsSchema: {
      fromCurrency: { type: 'currency', default: 'USD', label: 'From Currency' },
      toCurrency: { type: 'currency', default: 'EUR', label: 'To Currency' },
      showGraph: { type: 'boolean', default: true, label: 'Show Historical Graph' },
      graphDays: { type: 'select', default: 7, options: [7, 14, 30, 90, 180, 365], label: 'Graph Period (days)' },
    },
    category: 'finance',
    defaultSize: { w: 1, h: 2 },
  },

  recentClients: {
    id: 'recentClients',
    name: 'Recent Clients',
    description: 'Recently added or updated clients',
    component: 'RecentClientsWidget',
    defaultVisible: true,
    defaultOrder: 9,
    hasSettings: true,
    settingsSchema: {
      limit: { type: 'number', default: 5, min: 3, max: 10, label: 'Number of clients' },
    },
    category: 'crm',
    defaultSize: { w: 1, h: 2 },
  },

  upcomingAppointments: {
    id: 'upcomingAppointments',
    name: 'Upcoming Appointments',
    description: 'Your scheduled appointments',
    component: 'UpcomingAppointmentsWidget',
    defaultVisible: true,
    defaultOrder: 10,
    hasSettings: true,
    settingsSchema: {
      days: { type: 'number', default: 7, min: 1, max: 30, label: 'Days ahead' },
      limit: { type: 'number', default: 5, min: 3, max: 10, label: 'Max appointments' },
    },
    category: 'calendar',
    defaultSize: { w: 1, h: 2 },
  },

  upcomingCalls: {
    id: 'upcomingCalls',
    name: 'Upcoming Calls',
    description: 'Your scheduled calls',
    component: 'UpcomingCallsWidget',
    defaultVisible: false,
    defaultOrder: 11,
    hasSettings: true,
    settingsSchema: {
      days: { type: 'number', default: 7, min: 1, max: 30, label: 'Days ahead' },
      limit: { type: 'number', default: 5, min: 3, max: 10, label: 'Max calls' },
    },
    category: 'calendar',
    defaultSize: { w: 1, h: 2 },
  },
};

/**
 * Widget categories for grouping in customizer
 */
export const WIDGET_CATEGORIES: Record<string, WidgetCategory> = {
  general: { name: 'General', order: 0 },
  finance: { name: 'Finance', order: 1 },
  crm: { name: 'CRM', order: 2 },
  calendar: { name: 'Calendar', order: 3 },
};

/**
 * Get default widget layout (all widgets with default visibility/order)
 */
export const getWidgetDefaults = (): { id: string; visible: boolean }[] => {
  return Object.values(WIDGET_REGISTRY)
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map(widget => ({
      id: widget.id,
      visible: widget.defaultVisible,
    }));
};

/**
 * Get widget config by ID
 */
export const getWidgetConfig = (widgetId: string): WidgetConfig | undefined => WIDGET_REGISTRY[widgetId];

/**
 * Get all widgets grouped by category
 */
export const getWidgetsByCategory = (): Record<string, WidgetConfig[]> => {
  const grouped: Record<string, WidgetConfig[]> = {};

  Object.values(WIDGET_REGISTRY).forEach(widget => {
    if (!grouped[widget.category]) {
      grouped[widget.category] = [];
    }
    grouped[widget.category].push(widget);
  });

  // Sort widgets within each category by defaultOrder
  Object.keys(grouped).forEach(category => {
    grouped[category].sort((a, b) => a.defaultOrder - b.defaultOrder);
  });

  return grouped;
};

/**
 * Get default settings for a widget
 */
export const getDefaultWidgetSettings = (widgetId: string): Record<string, any> => {
  const config = WIDGET_REGISTRY[widgetId];
  if (!config?.settingsSchema) return {};

  return Object.fromEntries(
    Object.entries(config.settingsSchema).map(([key, schema]) => [key, schema.default])
  );
};

/**
 * Available currencies for currency-type settings
 */
export const AVAILABLE_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '\u20ac' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00a3' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00a5' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00a5' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20b9' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
];
