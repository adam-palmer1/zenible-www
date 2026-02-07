import type { InvoiceResponse, InvoiceItemResponse } from '../../../../types';

/**
 * Extended InvoiceResponse including extra runtime fields the backend may return
 * beyond what the OpenAPI spec declares (e.g. legacy/computed fields).
 */
/**
 * Extended InvoiceResponse including extra runtime fields the backend may return
 * beyond what the OpenAPI spec declares (e.g. legacy/computed fields).
 */
export interface InvoiceFormData extends InvoiceResponse {
  /** Legacy alias for issue_date */
  invoice_date?: string;
  /** Legacy alias for invoice_items */
  items?: InvoiceItemResponse[];
  /** Whether invoice is recurring (computed from pricing_type) */
  is_recurring?: boolean;
  /** End date for recurring invoices */
  recurring_end_date?: string | null;
  /** Number of recurring occurrences */
  recurring_occurrences?: number | null;
}

/** Local line item shape used in form state (mixes response fields with parsed numbers) */
export interface FormLineItem {
  id?: string;
  description: string;
  name?: string;
  subtext?: string | null;
  quantity: number;
  price: number;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  taxes?: FormItemTax[];
  _billable_hour_ids?: string[];
  _project_id?: string;
  [key: string]: unknown;
}

/** Tax entry on a line item during editing */
export interface FormItemTax {
  tax_name: string;
  tax_rate: number;
  tax_amount: number;
  display_order?: number;
  id?: string;
}

/** Document-level tax */
export interface FormDocumentTax {
  tax_name: string;
  tax_rate: number;
  id?: string;
}

/** Project allocation entry */
export interface ProjectAllocation {
  project_id: string;
  percentage: number;
}

/** Contact tax from the API */
export interface ContactTax {
  tax_name: string;
  tax_rate: string | number;
  sort_order?: number;
}

/** Billable hours list response */
export interface BillableHoursListResponse {
  items: BillableHourEntry[];
  total: number;
  total_hours?: number;
  total_amount?: number;
}

export interface BillableHourEntry {
  id: string;
  project_id?: string;
  currency_id?: string;
  quantity?: number;
  project?: { name: string } | null;
  [key: string]: unknown;
}

/** Settings modal update payload */
export interface InvoiceSettingsUpdate {
  isRecurring?: boolean;
  pricingType?: string;
  recurringType?: string;
  customEvery?: number;
  customPeriod?: string;
  recurringEndDate?: string | null;
  recurringOccurrences?: number | null;
  recurringStatus?: string;
  recurringNumber?: number;
  allowStripePayments?: boolean;
  allowPaypalPayments?: boolean;
  allowPartialPayments?: boolean;
  automaticPaymentEnabled?: boolean;
  automaticEmail?: boolean;
  attachPdfToEmail?: boolean;
  sendPaymentReceipt?: boolean;
  receivePaymentNotifications?: boolean;
  overrideReminderSettings?: boolean;
  invoiceRemindersEnabled?: boolean | null;
  invoiceReminderFrequencyDays?: number | null;
  maxInvoiceReminders?: number | null;
  remindersStopped?: boolean;
}

export interface InvoiceFormProps {
  invoice?: InvoiceFormData | null;
  onSuccess?: (result: InvoiceFormData) => void;
  isInModal?: boolean;
}
