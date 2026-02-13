/**
 * Finance module constants
 * Shared constants for invoices, quotes, expenses, and payments
 */

// Invoice Statuses
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [INVOICE_STATUS.DRAFT]: 'Draft',
  [INVOICE_STATUS.SENT]: 'Sent',
  [INVOICE_STATUS.VIEWED]: 'Viewed',
  [INVOICE_STATUS.PAID]: 'Paid',
  [INVOICE_STATUS.PARTIALLY_PAID]: 'Partially Paid',
  [INVOICE_STATUS.OVERDUE]: 'Overdue',
  [INVOICE_STATUS.CANCELLED]: 'Cancelled',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [INVOICE_STATUS.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  [INVOICE_STATUS.SENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [INVOICE_STATUS.VIEWED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  [INVOICE_STATUS.PAID]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [INVOICE_STATUS.PARTIALLY_PAID]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  [INVOICE_STATUS.OVERDUE]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  [INVOICE_STATUS.CANCELLED]: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// Credit Note Statuses
export const CREDIT_NOTE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  APPLIED: 'applied',
  VOID: 'void',
} as const;

export type CreditNoteStatus = typeof CREDIT_NOTE_STATUS[keyof typeof CREDIT_NOTE_STATUS];

export const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  [CREDIT_NOTE_STATUS.DRAFT]: 'Draft',
  [CREDIT_NOTE_STATUS.ISSUED]: 'Issued',
  [CREDIT_NOTE_STATUS.APPLIED]: 'Applied',
  [CREDIT_NOTE_STATUS.VOID]: 'Void',
};

export const CREDIT_NOTE_STATUS_COLORS: Record<CreditNoteStatus, string> = {
  [CREDIT_NOTE_STATUS.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  [CREDIT_NOTE_STATUS.ISSUED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [CREDIT_NOTE_STATUS.APPLIED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [CREDIT_NOTE_STATUS.VOID]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// Quote Statuses
export const QUOTE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  INVOICED: 'invoiced',
} as const;

export type QuoteStatus = typeof QUOTE_STATUS[keyof typeof QUOTE_STATUS];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  [QUOTE_STATUS.DRAFT]: 'Draft',
  [QUOTE_STATUS.SENT]: 'Sent',
  [QUOTE_STATUS.VIEWED]: 'Viewed',
  [QUOTE_STATUS.ACCEPTED]: 'Accepted',
  [QUOTE_STATUS.REJECTED]: 'Rejected',
  [QUOTE_STATUS.EXPIRED]: 'Expired',
  [QUOTE_STATUS.INVOICED]: 'Invoiced',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  [QUOTE_STATUS.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  [QUOTE_STATUS.SENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [QUOTE_STATUS.VIEWED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  [QUOTE_STATUS.ACCEPTED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [QUOTE_STATUS.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  [QUOTE_STATUS.EXPIRED]: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  [QUOTE_STATUS.INVOICED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

// Payment Methods
export const PAYMENT_METHOD = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  WIRE_TRANSFER: 'wire_transfer',
  CASH: 'cash',
  CHECK: 'check',
  STRIPE: 'stripe',
  CREDIT_NOTE: 'credit_note',
  OTHER: 'other',
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PAYMENT_METHOD.CREDIT_CARD]: 'Credit Card',
  [PAYMENT_METHOD.DEBIT_CARD]: 'Debit Card',
  [PAYMENT_METHOD.PAYPAL]: 'PayPal',
  [PAYMENT_METHOD.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHOD.WIRE_TRANSFER]: 'Wire Transfer',
  [PAYMENT_METHOD.CASH]: 'Cash',
  [PAYMENT_METHOD.CHECK]: 'Check',
  [PAYMENT_METHOD.STRIPE]: 'Stripe',
  [PAYMENT_METHOD.CREDIT_NOTE]: 'Credit Note',
  [PAYMENT_METHOD.OTHER]: 'Other',
};

// Payment Statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  CANCELLED: 'cancelled',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PROCESSING]: 'Processing',
  [PAYMENT_STATUS.COMPLETED]: 'Completed',
  [PAYMENT_STATUS.SUCCEEDED]: 'Succeeded',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
  [PAYMENT_STATUS.PARTIALLY_REFUNDED]: 'Partially Refunded',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelled',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  [PAYMENT_STATUS.PROCESSING]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [PAYMENT_STATUS.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [PAYMENT_STATUS.SUCCEEDED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  [PAYMENT_STATUS.REFUNDED]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  [PAYMENT_STATUS.PARTIALLY_REFUNDED]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  [PAYMENT_STATUS.CANCELLED]: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// Payment Types
export const PAYMENT_TYPE = {
  ONE_TIME: 'one_time',
  SUBSCRIPTION: 'subscription',
  INVOICE: 'invoice',
  REFUND: 'refund',
} as const;

export type PaymentType = typeof PAYMENT_TYPE[keyof typeof PAYMENT_TYPE];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PAYMENT_TYPE.ONE_TIME]: 'One-time',
  [PAYMENT_TYPE.SUBSCRIPTION]: 'Subscription',
  [PAYMENT_TYPE.INVOICE]: 'Invoice',
  [PAYMENT_TYPE.REFUND]: 'Refund',
};

export const PAYMENT_TYPE_COLORS: Record<PaymentType, string> = {
  [PAYMENT_TYPE.ONE_TIME]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  [PAYMENT_TYPE.SUBSCRIPTION]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [PAYMENT_TYPE.INVOICE]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  [PAYMENT_TYPE.REFUND]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

// Recurring Types (backend expects lowercase values)
export const RECURRING_TYPE = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
} as const;

export type RecurringType = typeof RECURRING_TYPE[keyof typeof RECURRING_TYPE];

export const RECURRING_TYPE_LABELS: Record<RecurringType, string> = {
  [RECURRING_TYPE.WEEKLY]: 'Weekly',
  [RECURRING_TYPE.MONTHLY]: 'Monthly',
  [RECURRING_TYPE.QUARTERLY]: 'Quarterly',
  [RECURRING_TYPE.YEARLY]: 'Yearly',
  [RECURRING_TYPE.CUSTOM]: 'Custom',
};

// Custom Period Types (backend expects lowercase values)
export const CUSTOM_PERIOD = {
  DAYS: 'days',
  WEEKS: 'weeks',
  MONTHS: 'months',
  YEARS: 'years',
} as const;

export type CustomPeriod = typeof CUSTOM_PERIOD[keyof typeof CUSTOM_PERIOD];

export const CUSTOM_PERIOD_LABELS: Record<CustomPeriod, string> = {
  [CUSTOM_PERIOD.DAYS]: 'Days',
  [CUSTOM_PERIOD.WEEKS]: 'Weeks',
  [CUSTOM_PERIOD.MONTHS]: 'Months',
  [CUSTOM_PERIOD.YEARS]: 'Years',
};

// Pricing Types
export const PRICING_TYPE = {
  FIXED: 'Fixed',
  ONE_TIME: 'One-time',
  RECURRING: 'Recurring',
} as const;

export type PricingType = typeof PRICING_TYPE[keyof typeof PRICING_TYPE];

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  [PRICING_TYPE.FIXED]: 'Fixed Price',
  [PRICING_TYPE.ONE_TIME]: 'One-time',
  [PRICING_TYPE.RECURRING]: 'Recurring',
};

// Payment Gateway Types
export const PAYMENT_GATEWAY = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
} as const;

export type PaymentGateway = typeof PAYMENT_GATEWAY[keyof typeof PAYMENT_GATEWAY];

export const PAYMENT_GATEWAY_LABELS: Record<PaymentGateway, string> = {
  [PAYMENT_GATEWAY.STRIPE]: 'Stripe',
  [PAYMENT_GATEWAY.PAYPAL]: 'PayPal',
};

// Expense Categories (Default)
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Office Supplies', color: '#3B82F6' },
  { name: 'Travel', color: '#10B981' },
  { name: 'Meals & Entertainment', color: '#F59E0B' },
  { name: 'Software & Subscriptions', color: '#8B5CF6' },
  { name: 'Utilities', color: '#06B6D4' },
  { name: 'Insurance', color: '#EF4444' },
  { name: 'Professional Services', color: '#EC4899' },
  { name: 'Marketing & Advertising', color: '#F97316' },
  { name: 'Rent', color: '#6366F1' },
  { name: 'Equipment', color: '#14B8A6' },
  { name: 'Taxes & Licenses', color: '#84CC16' },
  { name: 'Other', color: '#64748B' },
] as const;

// Date Range Presets
export const DATE_RANGE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom',
} as const;

export type DateRangePreset = typeof DATE_RANGE_PRESETS[keyof typeof DATE_RANGE_PRESETS];

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  [DATE_RANGE_PRESETS.TODAY]: 'Today',
  [DATE_RANGE_PRESETS.YESTERDAY]: 'Yesterday',
  [DATE_RANGE_PRESETS.THIS_WEEK]: 'This Week',
  [DATE_RANGE_PRESETS.LAST_WEEK]: 'Last Week',
  [DATE_RANGE_PRESETS.THIS_MONTH]: 'This Month',
  [DATE_RANGE_PRESETS.LAST_MONTH]: 'Last Month',
  [DATE_RANGE_PRESETS.THIS_QUARTER]: 'This Quarter',
  [DATE_RANGE_PRESETS.LAST_QUARTER]: 'Last Quarter',
  [DATE_RANGE_PRESETS.THIS_YEAR]: 'This Year',
  [DATE_RANGE_PRESETS.LAST_YEAR]: 'Last Year',
  [DATE_RANGE_PRESETS.CUSTOM]: 'Custom Range',
};

// Sort Options
export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  AMOUNT_HIGH: 'amount_high',
  AMOUNT_LOW: 'amount_low',
  NAME_AZ: 'name_az',
  NAME_ZA: 'name_za',
  STATUS: 'status',
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

export const SORT_OPTION_LABELS: Record<SortOption, string> = {
  [SORT_OPTIONS.NEWEST]: 'Newest First',
  [SORT_OPTIONS.OLDEST]: 'Oldest First',
  [SORT_OPTIONS.AMOUNT_HIGH]: 'Amount (High to Low)',
  [SORT_OPTIONS.AMOUNT_LOW]: 'Amount (Low to High)',
  [SORT_OPTIONS.NAME_AZ]: 'Name (A-Z)',
  [SORT_OPTIONS.NAME_ZA]: 'Name (Z-A)',
  [SORT_OPTIONS.STATUS]: 'Status',
};

// Currency Codes (Common)
export const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'NZD',
] as const;

// Tax Rate Presets
export const TAX_RATE_PRESETS = [
  { label: 'No Tax', rate: 0 },
  { label: '5%', rate: 5 },
  { label: '10%', rate: 10 },
  { label: '15%', rate: 15 },
  { label: '18%', rate: 18 },
  { label: '20%', rate: 20 },
  { label: '25%', rate: 25 },
] as const;

// Number Formatting
export const NUMBER_FORMAT = {
  LOCALE: 'en-US',
  CURRENCY_DECIMALS: 2,
  PERCENTAGE_DECIMALS: 1,
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  ALLOWED_EXTENSIONS: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf',
    '.doc', '.docx',
    '.xls', '.xlsx',
    '.txt',
  ],
} as const;

// API Endpoints Base
export const API_ENDPOINTS = {
  INVOICES: '/api/v1/invoices',
  QUOTES: '/api/v1/quotes',
  EXPENSES: '/api/v1/expenses',
  PAYMENTS: '/api/v1/payments',
  PAYMENT_INTEGRATIONS: '/api/v1/payment-integrations',
} as const;

// Feature Flags (for gradual rollout)
export const FEATURE_FLAGS = {
  RECURRING_INVOICES: true,
  RECURRING_EXPENSES: true,
  QUOTE_REVISIONS: true,
  DIGITAL_SIGNATURES: true,
  PAYMENT_GATEWAYS: true,
  EXPENSE_ANALYTICS: true,
  MULTI_CURRENCY: true,
  PDF_GENERATION: true,
  EMAIL_SENDING: true,
  BULK_OPERATIONS: true,
  IMPORT_EXPORT: true,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVOICE_NOT_FOUND: 'Invoice not found',
  QUOTE_NOT_FOUND: 'Quote not found',
  EXPENSE_NOT_FOUND: 'Expense not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
  INVALID_AMOUNT: 'Invalid amount',
  INVALID_TAX_RATE: 'Tax rate must be between 0 and 100',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_DATE: 'Invalid date',
  PAYMENT_FAILED: 'Payment processing failed',
  NETWORK_ERROR: 'Network error. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  INVOICE_CREATED: 'Invoice created successfully',
  INVOICE_UPDATED: 'Invoice updated successfully',
  INVOICE_SENT: 'Invoice sent successfully',
  INVOICE_DELETED: 'Invoice deleted successfully',
  QUOTE_CREATED: 'Quote created successfully',
  QUOTE_UPDATED: 'Quote updated successfully',
  QUOTE_SENT: 'Quote sent successfully',
  QUOTE_ACCEPTED: 'Quote accepted successfully',
  QUOTE_CONVERTED: 'Quote converted to invoice successfully',
  EXPENSE_CREATED: 'Expense created successfully',
  EXPENSE_UPDATED: 'Expense updated successfully',
  EXPENSE_DELETED: 'Expense deleted successfully',
  PAYMENT_RECORDED: 'Payment recorded successfully',
  PAYMENT_REFUNDED: 'Payment refunded successfully',
} as const;
