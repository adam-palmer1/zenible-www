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

export const WIDGET_REGISTRY = {
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
  },
};

/**
 * Widget categories for grouping in customizer
 */
export const WIDGET_CATEGORIES = {
  general: { name: 'General', order: 0 },
  finance: { name: 'Finance', order: 1 },
  crm: { name: 'CRM', order: 2 },
  calendar: { name: 'Calendar', order: 3 },
};

/**
 * Get default widget layout (all widgets with default visibility/order)
 */
export const getWidgetDefaults = () => {
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
export const getWidgetConfig = (widgetId) => WIDGET_REGISTRY[widgetId];

/**
 * Get all widgets grouped by category
 */
export const getWidgetsByCategory = () => {
  const grouped = {};

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
export const getDefaultWidgetSettings = (widgetId) => {
  const config = WIDGET_REGISTRY[widgetId];
  if (!config?.settingsSchema) return {};

  return Object.fromEntries(
    Object.entries(config.settingsSchema).map(([key, schema]) => [key, schema.default])
  );
};

/**
 * Available currencies for currency-type settings
 */
export const AVAILABLE_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
];
