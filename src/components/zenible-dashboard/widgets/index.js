// Widget System Components
export { default as WidgetWrapper } from './WidgetWrapper';
export { default as WidgetSettingsModal } from './WidgetSettingsModal';
export { default as SortableWidgetGrid } from './SortableWidgetGrid';
export { default as WidgetCustomizer } from './WidgetCustomizer';

// Widget Registry
export {
  WIDGET_REGISTRY,
  WIDGET_CATEGORIES,
  AVAILABLE_CURRENCIES,
  getWidgetDefaults,
  getWidgetConfig,
  getWidgetsByCategory,
  getDefaultWidgetSettings,
} from './WidgetRegistry';

// Individual Widgets
export { default as CurrentProjectsWidget } from './CurrentProjectsWidget';
export { default as TipOfTheDayWidget } from './TipOfTheDayWidget';
export { default as RecentInvoicesWidget } from './RecentInvoicesWidget';
export { default as RecentClientsWidget } from './RecentClientsWidget';
export { default as RecentExpensesWidget } from './RecentExpensesWidget';
export { default as OutstandingInvoicesWidget } from './OutstandingInvoicesWidget';
export { default as RecentPaymentsWidget } from './RecentPaymentsWidget';
export { default as CurrencyExchangeWidget } from './CurrencyExchangeWidget';
export { default as UpcomingAppointmentsWidget } from './UpcomingAppointmentsWidget';
export { default as UpcomingCallsWidget } from './UpcomingCallsWidget';
export { default as MonthlyIncomeGoalWidget } from './MonthlyIncomeGoalWidget';
export { default as ProfitAndLossWidget } from './ProfitAndLossWidget';
