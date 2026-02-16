/**
 * Custom Report Builder Types
 * Mirrors backend schemas from app/schemas/crm/custom_report.py
 */

// --- Enums ---

export type ReportEntityType =
  | 'invoice'
  | 'quote'
  | 'credit_note'
  | 'expense'
  | 'payment'
  | 'billable_hour'
  | 'contact_service';

export type ReportDateRangePreset =
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'custom';

export type ColumnDataType =
  | 'string'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'boolean';

export type ReportSortDirection = 'asc' | 'desc';

// --- Configuration Models ---

export interface EntityExtraFilters {
  is_recurring?: boolean;
  is_overdue?: boolean;
  is_outstanding?: boolean;
  is_unallocated?: boolean;
  is_billable?: boolean;
  is_invoiced?: boolean;
  is_expired?: boolean;
  has_linked_invoice?: boolean;
  category_ids?: string[];
  project_ids?: string[];
  vendor_ids?: string[];
  payment_method?: string;
  frequency_type?: string;
  currency_ids?: string[];
}

export interface EntitySelectionConfig {
  entity_type: ReportEntityType;
  columns: string[];
  status_filters?: string[];
  extra_filters?: EntityExtraFilters;
}

export interface DateRangeConfig {
  preset: ReportDateRangePreset;
  custom_start?: string;
  custom_end?: string;
}

export interface ContactFilterConfig {
  contact_ids: string[];
  include_deleted?: boolean;
}

export interface ReportConfiguration {
  entity_selections: EntitySelectionConfig[];
  date_range?: DateRangeConfig;
  contact_filter?: ContactFilterConfig;
  sort_by?: string;
  sort_direction?: ReportSortDirection;
}

// --- CRUD Schemas ---

export interface CustomReportCreate {
  name: string;
  description?: string;
  configuration: ReportConfiguration;
}

export interface CustomReportUpdate {
  name?: string;
  description?: string;
  configuration?: ReportConfiguration;
}

export interface CustomReportResponse {
  id: string;
  company_id: string;
  created_by_user_id: string;
  name: string;
  description: string | null;
  configuration: ReportConfiguration;
  created_at: string;
  updated_at: string;
}

export interface CustomReportListItem {
  id: string;
  name: string;
  description: string | null;
  is_owner: boolean;
  entity_types: ReportEntityType[];
  created_at: string;
  updated_at: string;
}

export interface CustomReportListResponse {
  items: CustomReportListItem[];
  total: number;
  page: number;
  per_page: number;
}

// --- Execution Schemas ---

export interface EntityColumnMeta {
  key: string;
  label: string;
  data_type: ColumnDataType;
  sortable: boolean;
  filterable: boolean;
  is_default: boolean;
  enum_values?: string[];
}

export interface EntityFilterMeta {
  status_options: string[];
  extra_filters: string[];
}

export interface EntityQueryResultResponse {
  entity_type: ReportEntityType;
  columns: EntityColumnMeta[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  per_page: number;
  aggregations?: Record<string, unknown>;
}

export interface ReportExecutionResponse {
  results: Record<ReportEntityType, EntityQueryResultResponse>;
  executed_at: string;
  date_range_resolved?: {
    start: string;
    end: string;
  };
}

export interface AvailableEntityColumns {
  entity_type: ReportEntityType;
  columns: EntityColumnMeta[];
  filters: EntityFilterMeta;
}

export interface AvailableColumnsResponse {
  entities: AvailableEntityColumns[];
}

// --- UI Helper Types ---

export const ENTITY_TYPE_LABELS: Record<ReportEntityType, string> = {
  invoice: 'Invoices',
  quote: 'Quotes',
  credit_note: 'Credit Notes',
  expense: 'Expenses',
  payment: 'Payments',
  billable_hour: 'Billable Hours',
  contact_service: 'Contact Services',
};

export const ENTITY_TYPE_COLORS: Record<ReportEntityType, { bg: string; text: string }> = {
  invoice: { bg: 'bg-blue-100', text: 'text-blue-700' },
  quote: { bg: 'bg-purple-100', text: 'text-purple-700' },
  credit_note: { bg: 'bg-orange-100', text: 'text-orange-700' },
  expense: { bg: 'bg-red-100', text: 'text-red-700' },
  payment: { bg: 'bg-green-100', text: 'text-green-700' },
  billable_hour: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  contact_service: { bg: 'bg-teal-100', text: 'text-teal-700' },
};

export const DATE_RANGE_PRESET_LABELS: Record<ReportDateRangePreset, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  last_quarter: 'Last Quarter',
  this_year: 'This Year',
  last_year: 'Last Year',
  last_7_days: 'Last 7 Days',
  last_30_days: 'Last 30 Days',
  last_90_days: 'Last 90 Days',
  custom: 'Custom Range',
};
