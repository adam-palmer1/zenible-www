/**
 * Email Template Types
 * Type definitions for email template management and invoice sending
 */

// Enums
export enum EmailTemplateType {
  // Invoices
  INVOICE_SEND = 'invoice_send',
  INVOICE_REMINDER = 'invoice_reminder',
  // Quotes
  QUOTE_SEND = 'quote_send',
  QUOTE_ACCEPTED = 'quote_accepted',
  QUOTE_REJECTED = 'quote_rejected',
  QUOTE_REMINDER = 'quote_reminder',
  // Payments
  PAYMENT_RECEIPT = 'payment_receipt',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_RETRY_FAILED = 'payment_retry_failed',
  PAYMENT_FINAL_FAILURE = 'payment_final_failure',
  // Credit Notes
  CREDIT_NOTE_SEND = 'credit_note_send',
  // Bookings
  BOOKING_CONFIRMATION_GUEST = 'booking_confirmation_guest',
  BOOKING_CONFIRMATION_HOST = 'booking_confirmation_host',
  BOOKING_CANCELLED_GUEST = 'booking_cancelled_guest',
  BOOKING_CANCELLED_HOST = 'booking_cancelled_host',
  BOOKING_RESCHEDULED_GUEST = 'booking_rescheduled_guest',
  BOOKING_RESCHEDULED_HOST = 'booking_rescheduled_host'
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
  // Invoices
  [EmailTemplateType.INVOICE_SEND]: 'Invoice Send',
  [EmailTemplateType.INVOICE_REMINDER]: 'Invoice Reminder',
  // Quotes
  [EmailTemplateType.QUOTE_SEND]: 'Quote Send',
  [EmailTemplateType.QUOTE_ACCEPTED]: 'Quote Accepted',
  [EmailTemplateType.QUOTE_REJECTED]: 'Quote Rejected',
  [EmailTemplateType.QUOTE_REMINDER]: 'Quote Reminder',
  // Payments
  [EmailTemplateType.PAYMENT_RECEIPT]: 'Payment Receipt',
  [EmailTemplateType.PAYMENT_FAILED]: 'Payment Failed',
  [EmailTemplateType.PAYMENT_RETRY_FAILED]: 'Payment Retry Failed',
  [EmailTemplateType.PAYMENT_FINAL_FAILURE]: 'Payment Final Failure',
  // Credit Notes
  [EmailTemplateType.CREDIT_NOTE_SEND]: 'Credit Note Send',
  // Bookings
  [EmailTemplateType.BOOKING_CONFIRMATION_GUEST]: 'Booking Confirmation (Guest)',
  [EmailTemplateType.BOOKING_CONFIRMATION_HOST]: 'Booking Confirmation (Host)',
  [EmailTemplateType.BOOKING_CANCELLED_GUEST]: 'Booking Cancelled (Guest)',
  [EmailTemplateType.BOOKING_CANCELLED_HOST]: 'Booking Cancelled (Host)',
  [EmailTemplateType.BOOKING_RESCHEDULED_GUEST]: 'Booking Rescheduled (Guest)',
  [EmailTemplateType.BOOKING_RESCHEDULED_HOST]: 'Booking Rescheduled (Host)',
};

// Template Type Colors (for badges)
export const TEMPLATE_TYPE_COLORS: Record<EmailTemplateType, string> = {
  // Invoices
  [EmailTemplateType.INVOICE_SEND]: 'blue',
  [EmailTemplateType.INVOICE_REMINDER]: 'orange',
  // Quotes
  [EmailTemplateType.QUOTE_SEND]: 'purple',
  [EmailTemplateType.QUOTE_ACCEPTED]: 'green',
  [EmailTemplateType.QUOTE_REJECTED]: 'red',
  [EmailTemplateType.QUOTE_REMINDER]: 'yellow',
  // Payments
  [EmailTemplateType.PAYMENT_RECEIPT]: 'green',
  [EmailTemplateType.PAYMENT_FAILED]: 'red',
  [EmailTemplateType.PAYMENT_RETRY_FAILED]: 'orange',
  [EmailTemplateType.PAYMENT_FINAL_FAILURE]: 'red',
  // Credit Notes
  [EmailTemplateType.CREDIT_NOTE_SEND]: 'teal',
  // Bookings
  [EmailTemplateType.BOOKING_CONFIRMATION_GUEST]: 'green',
  [EmailTemplateType.BOOKING_CONFIRMATION_HOST]: 'blue',
  [EmailTemplateType.BOOKING_CANCELLED_GUEST]: 'red',
  [EmailTemplateType.BOOKING_CANCELLED_HOST]: 'orange',
  [EmailTemplateType.BOOKING_RESCHEDULED_GUEST]: 'yellow',
  [EmailTemplateType.BOOKING_RESCHEDULED_HOST]: 'yellow',
};

// Template Categories for UI organization
export const TEMPLATE_CATEGORIES = {
  invoices: {
    label: 'Invoices',
    types: [
      EmailTemplateType.INVOICE_SEND,
      EmailTemplateType.INVOICE_REMINDER,
    ],
  },
  quotes: {
    label: 'Quotes',
    types: [
      EmailTemplateType.QUOTE_SEND,
      EmailTemplateType.QUOTE_ACCEPTED,
      EmailTemplateType.QUOTE_REJECTED,
      EmailTemplateType.QUOTE_REMINDER,
    ],
  },
  payments: {
    label: 'Payments',
    types: [
      EmailTemplateType.PAYMENT_RECEIPT,
      EmailTemplateType.PAYMENT_FAILED,
      EmailTemplateType.PAYMENT_RETRY_FAILED,
      EmailTemplateType.PAYMENT_FINAL_FAILURE,
    ],
  },
  credit_notes: {
    label: 'Credit Notes',
    types: [
      EmailTemplateType.CREDIT_NOTE_SEND,
    ],
  },
  bookings: {
    label: 'Bookings',
    types: [
      EmailTemplateType.BOOKING_CONFIRMATION_GUEST,
      EmailTemplateType.BOOKING_CONFIRMATION_HOST,
      EmailTemplateType.BOOKING_RESCHEDULED_GUEST,
      EmailTemplateType.BOOKING_RESCHEDULED_HOST,
      EmailTemplateType.BOOKING_CANCELLED_GUEST,
      EmailTemplateType.BOOKING_CANCELLED_HOST,
    ],
  },
};
