/**
 * Expense Field Formatter Utility
 * Formats technical field names and values for human-readable display in history viewer
 */

import { PAYMENT_METHOD_LABELS } from '../constants/finance';
import { formatCurrency } from './currency';

/**
 * Field name mappings from backend to human-readable format
 */
const FIELD_NAME_MAP = {
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

/**
 * Format a field name to human-readable format
 * @param {string} fieldName - Technical field name from backend
 * @returns {string} Human-readable field name
 */
export const formatExpenseFieldName = (fieldName) => {
  return FIELD_NAME_MAP[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Format a field value based on its type
 * @param {string} fieldName - Field name to determine formatting strategy
 * @param {any} value - Raw value to format
 * @param {Object} referenceData - Reference data for resolving IDs
 * @param {Array} referenceData.categories - Expense categories
 * @param {Array} referenceData.vendors - Vendor contacts
 * @param {Array} referenceData.currencies - Currencies
 * @returns {string} Formatted value
 */
export const formatExpenseFieldValue = (fieldName, value, referenceData = {}) => {
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
      const date = new Date(value);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return value;
    }
  }

  // Amount fields
  if (fieldName === 'amount' || fieldName === 'base_amount') {
    // Try to format as currency if numeric
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Default to USD if no currency info available
      return formatCurrency(numValue, 'USD');
    }
    return value;
  }

  // Exchange rate
  if (fieldName === 'exchange_rate') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return numValue.toFixed(4);
    }
    return value;
  }

  // Payment method
  if (fieldName === 'payment_method') {
    return PAYMENT_METHOD_LABELS[value] || value;
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
    const typeMap = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom',
    };
    return typeMap[value?.toLowerCase()] || value;
  }

  // Recurring status
  if (fieldName === 'recurring_status') {
    const statusMap = {
      active: 'Active',
      paused: 'Paused',
      cancelled: 'Cancelled',
    };
    return statusMap[value?.toLowerCase()] || value;
  }

  // Recurring number
  if (fieldName === 'recurring_number') {
    const numValue = parseInt(value);
    if (numValue === -1) {
      return 'Infinite (Never ends)';
    }
    if (!isNaN(numValue)) {
      return `${numValue} occurrences`;
    }
    return value;
  }

  // Custom period
  if (fieldName === 'custom_period') {
    const periodMap = {
      days: 'Days',
      weeks: 'Weeks',
      months: 'Months',
      years: 'Years',
    };
    return periodMap[value?.toLowerCase()] || value;
  }

  // Pricing type
  if (fieldName === 'pricing_type') {
    const typeMap = {
      fixed: 'Fixed Price',
      one_time: 'One-time',
      recurring: 'Recurring',
    };
    return typeMap[value?.toLowerCase()] || value;
  }

  // Expense status
  if (fieldName === 'status') {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
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

/**
 * Format a complete change entry for display
 * @param {Object} change - Change record from API
 * @param {Object} referenceData - Reference data for resolving IDs
 * @returns {Object} Formatted change with display values
 */
export const formatExpenseChange = (change, referenceData = {}) => {
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

/**
 * Format multiple changes at once
 * @param {Array} changes - Array of change records
 * @param {Object} referenceData - Reference data for resolving IDs
 * @returns {Array} Array of formatted changes
 */
export const formatExpenseChanges = (changes, referenceData = {}) => {
  return changes.map(change => formatExpenseChange(change, referenceData));
};
