import type { InvoiceResponse } from '../../../../types';

/**
 * Extended InvoiceResponse including extra runtime fields the backend may return
 * beyond what the OpenAPI spec declares (e.g. legacy/computed fields).
 */
export interface InvoiceDetailData extends InvoiceResponse {
  /** Legacy alias for issue_date */
  invoice_date?: string;
  /** Whether invoice is recurring (computed from pricing_type) */
  is_recurring?: boolean;
  /** Parent invoice ID for auto-generated child invoices */
  parent_invoice_id?: string | null;
  /** Sequence number within recurrence series */
  recurrence_sequence_number?: number | null;
  /** End date for recurring invoices */
  recurring_end_date?: string | null;
  /** Number of recurring occurrences */
  recurring_occurrences?: number | null;
  /** Legacy tax_rate field */
  tax_rate?: number | string;
  /** Legacy tax_label field */
  tax_label?: string;
  /** Legacy terms field */
  terms?: string | null;
  /** Legacy deposit alias */
  deposit?: string | number;
  /** Embedded company info (from some endpoints) */
  company?: { name?: string; email?: string };
}

/** Extended SimpleContactResponse with optional nested country */
export interface DetailContactInfo {
  id: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  email?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country_id?: string;
  address?: string;
  tax_id?: string;
  country?: { name?: string } | null;
}

/** Shape for the confirmation modal config parameter */
export interface ConfirmationConfig {
  title: string;
  message: string;
  variant: 'danger' | 'warning' | 'primary';
  confirmText: string;
  onConfirm: (() => void) | null;
}

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

export const getStatusBadgeClasses = (status: string) => {
  const statusColors: Record<string, string> = {
    draft: 'bg-[#f4f4f5] text-[#09090b]',
    sent: 'bg-[#dff2fe] text-[#09090b]',
    viewed: 'bg-[#e0f2fe] text-[#09090b]',
    partial: 'bg-[#fef3c7] text-[#09090b]',
    paid: 'bg-[#dcfce7] text-[#09090b]',
    overdue: 'bg-[#fee2e2] text-[#09090b]',
    cancelled: 'bg-[#f4f4f5] text-[#71717a]',
  };
  return statusColors[status] || 'bg-[#f4f4f5] text-[#09090b]';
};
