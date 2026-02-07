/**
 * Expense Field Formatter Utility
 * Formats technical field names and values for human-readable display in history viewer
 */

import { PAYMENT_METHOD_LABELS } from '../constants/finance';
import { formatCurrency } from './currency';

/**
 * Field name mappings from backend to human-readable format
 */
const FIELD_NAME_MAP: Record<string, string> = {
  // Basic fields
  expense_number: 'Expense Number',
  description: 'Description',
  amount: 'Amount',
  expense_date: 'Date',
  status: 'Status',
  payment_method: 'Payment Method',
  reference_number: 'Reference Number',
  notes: 'Notes',

  // Relations
  expense_category_id: 'Category',
  category_id: 'Category',
  contact_id: 'Contact/Client',
  vendor_id: 'Vendor',
  currency_id: 'Currency',
  created_by_user_id: 'Created By',

  // Currency fields
  exchange_rate: 'Exchange Rate',
  base_amount: 'Base Amount',

  // Recurring fields
  pricing_type: 'Pricing Type',
  recurring_type: 'Recurring Type',
  recurring_status: 'Recurring Status',
  recurring_number: 'Recurrence Limit',
  custom_every: 'Custom Interval',
  custom_period: 'Custom Period',

  // Attachment fields
  receipt_url: 'Receipt URL',
  attachment_filename: 'Attachment',
  attachment_size: 'Attachment Size',
  attachment_type: 'Attachment Type',

  // Timestamps
  created_at: 'Created At',
  updated_at: 'Updated At',
  deleted_at: 'Deleted At',
};

export const formatExpenseFieldName = (fieldName: string): string => {
  return FIELD_NAME_MAP[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

interface ReferenceEntity {
  id: string;
  name: string;
  code?: string;
}

interface ReferenceData {
  categories?: ReferenceEntity[];
  vendors?: ReferenceEntity[];
  currencies?: ReferenceEntity[];
}

export const formatExpenseFieldValue = (fieldName: string, value: unknown, referenceData: ReferenceData = {}): string => {
  const { categories = [], vendors = [], currencies = [] } = referenceData;

  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  // Boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Date fields
  if (fieldName === 'expense_date' || fieldName.includes('_at')) {
    try {
      const date = new Date(value as string);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return String(value);
    }
  }

  // Amount fields
  if (fieldName === 'amount' || fieldName === 'base_amount') {
    // Try to format as currency if numeric
    const numValue = parseFloat(String(value));
    if (!isNaN(numValue)) {
      // Default to USD if no currency info available
      return formatCurrency(numValue, 'USD');
    }
    return String(value);
  }

  // Exchange rate
  if (fieldName === 'exchange_rate') {
    const numValue = parseFloat(String(value));
    if (!isNaN(numValue)) {
      return numValue.toFixed(4);
    }
    return String(value);
  }

  // Payment method
  if (fieldName === 'payment_method') {
    return PAYMENT_METHOD_LABELS[value as keyof typeof PAYMENT_METHOD_LABELS] || String(value);
  }

  // Category ID resolution
  if ((fieldName === 'expense_category_id' || fieldName === 'category_id') && categories.length > 0) {
    const category = categories.find(cat => cat.id === value);
    return category ? category.name : `Category #${value}`;
  }

  // Vendor ID resolution
  if (fieldName === 'vendor_id' && vendors.length > 0) {
    const vendor = vendors.find(v => v.id === value);
    return vendor ? vendor.name : `Vendor #${value}`;
  }

  // Contact ID resolution (assuming vendors array can also contain clients)
  if (fieldName === 'contact_id' && vendors.length > 0) {
    const contact = vendors.find(v => v.id === value);
    return contact ? contact.name : `Contact #${value}`;
  }

  // Currency ID resolution
  if (fieldName === 'currency_id' && currencies.length > 0) {
    const currency = currencies.find(c => c.id === value);
    return currency ? `${currency.code} - ${currency.name}` : `Currency #${value}`;
  }

  // Recurring type
  if (fieldName === 'recurring_type') {
    const typeMap: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom',
    };
    return typeMap[String(value).toLowerCase()] || String(value);
  }

  // Recurring status
  if (fieldName === 'recurring_status') {
    const statusMap: Record<string, string> = {
      active: 'Active',
      paused: 'Paused',
      cancelled: 'Cancelled',
    };
    return statusMap[String(value).toLowerCase()] || String(value);
  }

  // Recurring number
  if (fieldName === 'recurring_number') {
    const numValue = parseInt(String(value));
    if (numValue === -1) {
      return 'Infinite (Never ends)';
    }
    if (!isNaN(numValue)) {
      return `${numValue} occurrences`;
    }
    return String(value);
  }

  // Custom period
  if (fieldName === 'custom_period') {
    const periodMap: Record<string, string> = {
      days: 'Days',
      weeks: 'Weeks',
      months: 'Months',
      years: 'Years',
    };
    return periodMap[String(value).toLowerCase()] || String(value);
  }

  // Pricing type
  if (fieldName === 'pricing_type') {
    const typeMap: Record<string, string> = {
      fixed: 'Fixed Price',
      one_time: 'One-time',
      recurring: 'Recurring',
    };
    return typeMap[String(value).toLowerCase()] || String(value);
  }

  // Expense status
  if (fieldName === 'status') {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Attachment size (bytes to KB/MB)
  if (fieldName === 'attachment_size' && typeof value === 'number') {
    if (value < 1024) {
      return `${value} bytes`;
    } else if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(2)} KB`;
    } else {
      return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  // Default: return as string
  return String(value);
};

interface ChangeRecord {
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  [key: string]: unknown;
}

interface FormattedChange extends ChangeRecord {
  displayFieldName: string;
  displayOldValue: string;
  displayNewValue: string;
  isSignificant: boolean;
}

export const formatExpenseChange = (change: ChangeRecord, referenceData: ReferenceData = {}): FormattedChange => {
  const displayFieldName = formatExpenseFieldName(change.field_name);
  const displayOldValue = formatExpenseFieldValue(change.field_name, change.old_value, referenceData);
  const displayNewValue = formatExpenseFieldValue(change.field_name, change.new_value, referenceData);

  // Determine if this is a significant change
  const significantFields = ['amount', 'expense_date', 'expense_category_id', 'category_id', 'vendor_id', 'status'];
  const isSignificant = significantFields.includes(change.field_name);

  return {
    ...change,
    displayFieldName,
    displayOldValue,
    displayNewValue,
    isSignificant,
  };
};

export const formatExpenseChanges = (changes: ChangeRecord[], referenceData: ReferenceData = {}): FormattedChange[] => {
  return changes.map(change => formatExpenseChange(change, referenceData));
};
