/**
 * Email Template Types
 * Type definitions for email template management and invoice sending
 */

// Enums
export enum EmailTemplateType {
  INVOICE_SEND = 'invoice_send',
  INVOICE_REMINDER = 'invoice_reminder',
  PAYMENT_RECEIPT = 'payment_receipt',
  QUOTE_SEND = 'quote_send',
  QUOTE_ACCEPTED = 'quote_accepted',
  QUOTE_REJECTED = 'quote_rejected'
}

// Base Template
export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: EmailTemplateType;
  subject: string;
  body: string;
  company_id?: string;
  is_system_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Create Template
export interface EmailTemplateCreate {
  name: string;
  description?: string;
  template_type: EmailTemplateType;
  subject: string;
  body: string;
  is_active?: boolean;
}

// Update Template
export interface EmailTemplateUpdate {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  is_active?: boolean;
}

// List Response
export interface EmailTemplateListResponse {
  items: EmailTemplate[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Template Variables
export interface TemplateVariable {
  name: string;
  description: string;
}

export interface TemplateVariablesResponse {
  template_type: EmailTemplateType;
  variables: string[];
  descriptions: Record<string, string>;
}

// Preview Request/Response
export interface EmailTemplatePreviewRequest {
  variables: Record<string, string>;
}

export interface EmailTemplatePreviewResponse {
  subject: string;
  body: string;
  variables_used: string[];
}

// Invoice Send Request
export interface InvoiceSendRequest {
  to_email?: string;
  cc_emails?: string[];
  email_subject?: string;
  email_body?: string;
  attach_pdf?: boolean;
  template_id?: string;
}

// Template Type Labels (for UI)
export const TEMPLATE_TYPE_LABELS: Record<EmailTemplateType, string> = {
  [EmailTemplateType.INVOICE_SEND]: 'Invoice Send',
  [EmailTemplateType.INVOICE_REMINDER]: 'Invoice Reminder',
  [EmailTemplateType.PAYMENT_RECEIPT]: 'Payment Receipt',
  [EmailTemplateType.QUOTE_SEND]: 'Quote Send',
  [EmailTemplateType.QUOTE_ACCEPTED]: 'Quote Accepted',
  [EmailTemplateType.QUOTE_REJECTED]: 'Quote Rejected',
};

// Template Type Colors (for badges)
export const TEMPLATE_TYPE_COLORS: Record<EmailTemplateType, string> = {
  [EmailTemplateType.INVOICE_SEND]: 'blue',
  [EmailTemplateType.INVOICE_REMINDER]: 'orange',
  [EmailTemplateType.PAYMENT_RECEIPT]: 'green',
  [EmailTemplateType.QUOTE_SEND]: 'purple',
  [EmailTemplateType.QUOTE_ACCEPTED]: 'green',
  [EmailTemplateType.QUOTE_REJECTED]: 'red',
};
