/**
 * CSV Parser Utility for Expense Import/Export
 * Handles CSV parsing, validation, column mapping, and template generation
 */

/**
 * Parse CSV file to array of objects
 * @param {File} file - CSV file to parse
 * @returns {Promise<Array>} Array of row objects
 */
export const parseCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        // Parse header row
        const headers = parseCSVLine(lines[0]);

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue; // Skip empty lines

          const row = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
          });
          data.push(row);
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array<string>} Array of values
 */
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);

  return values;
};

/**
 * Detect column mapping from CSV headers
 * @param {Array<string>} headers - CSV header row
 * @returns {Object} Column mapping
 */
export const detectColumnMapping = (headers) => {
  const mapping = {};

  const columnMap = {
    // Date
    'date': 'expense_date',
    'expense date': 'expense_date',
    'expense_date': 'expense_date',

    // Amount
    'amount': 'amount',
    'total': 'amount',
    'price': 'amount',

    // Currency
    'currency': 'currency',
    'currency code': 'currency',

    // Description
    'description': 'description',
    'note': 'description',
    'memo': 'description',

    // Category
    'category': 'category',
    'expense category': 'category',

    // Vendor
    'vendor': 'vendor',
    'supplier': 'vendor',
    'merchant': 'vendor',

    // Payment Method
    'payment method': 'payment_method',
    'payment_method': 'payment_method',
    'method': 'payment_method',

    // Reference
    'reference': 'reference_number',
    'reference number': 'reference_number',
    'reference_number': 'reference_number',
    'invoice number': 'reference_number',
    'receipt': 'reference_number',

    // Notes
    'notes': 'notes',
    'additional notes': 'notes',
  };

  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();
    if (columnMap[normalizedHeader]) {
      mapping[index] = {
        csvColumn: header,
        expenseField: columnMap[normalizedHeader],
      };
    }
  });

  return mapping;
};

/**
 * Validate a single expense row
 * @param {Object} row - Row data
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateExpenseRow = (row, options = {}) => {
  const { categories = [], vendors = [] } = options;
  const errors = [];

  // Required: Amount
  if (!row.amount || isNaN(parseFloat(row.amount)) || parseFloat(row.amount) <= 0) {
    errors.push('Amount is required and must be a positive number');
  }

  // Required: Date
  if (!row.expense_date) {
    errors.push('Expense date is required');
  } else {
    const date = new Date(row.expense_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format. Use YYYY-MM-DD');
    }
  }

  // Optional but validate if provided: Category
  if (row.category && categories.length > 0) {
    const categoryExists = categories.some(
      cat => cat?.name?.toLowerCase() === row.category.toLowerCase()
    );
    if (!categoryExists) {
      errors.push(`Category "${row.category}" not found`);
    }
  }

  // Optional but validate if provided: Vendor
  if (row.vendor && vendors.length > 0) {
    const vendorExists = vendors.some(
      v => v?.name?.toLowerCase() === row.vendor.toLowerCase()
    );
    if (!vendorExists) {
      errors.push(`Vendor "${row.vendor}" not found`);
    }
  }

  // Optional but validate if provided: Payment Method
  if (row.payment_method) {
    const validMethods = ['credit_card', 'bank_transfer', 'cash', 'check'];
    const normalizedMethod = row.payment_method.toLowerCase().replace(/\s+/g, '_');
    if (!validMethods.includes(normalizedMethod)) {
      errors.push(`Invalid payment method. Use: ${validMethods.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Convert CSV row to expense API format
 * @param {Object} row - CSV row data
 * @param {Object} options - Conversion options
 * @returns {Object} Expense data in API format
 */
export const convertToExpenseFormat = (row, options = {}) => {
  const { categories = [], vendors = [], currencies = [], createMissing = false } = options;

  const expenseData = {
    amount: parseFloat(row.amount),
    expense_date: row.expense_date,
    description: row.description || undefined,
    notes: row.notes || undefined,
    reference_number: row.reference_number || undefined,
  };

  // Currency
  if (row.currency) {
    const currency = currencies.find(
      c => c?.currency?.code?.toLowerCase() === row.currency.toLowerCase()
    );
    if (currency) {
      expenseData.currency_id = currency.currency.id;
    }
  }

  // Category
  if (row.category) {
    const category = categories.find(
      cat => cat?.name?.toLowerCase() === row.category.toLowerCase()
    );
    if (category) {
      expenseData.category_id = category.id;
    }
  }

  // Vendor
  if (row.vendor) {
    const vendor = vendors.find(
      v => v?.name?.toLowerCase() === row.vendor.toLowerCase()
    );
    if (vendor) {
      expenseData.vendor_id = vendor.id;
    }
  }

  // Payment Method
  if (row.payment_method) {
    const normalizedMethod = row.payment_method.toLowerCase().replace(/\s+/g, '_');
    expenseData.payment_method = normalizedMethod;
  }

  return expenseData;
};

/**
 * Generate CSV template for expense import
 * @returns {string} CSV template string
 */
export const generateCSVTemplate = () => {
  const headers = [
    'expense_date',
    'amount',
    'currency',
    'description',
    'category',
    'vendor',
    'payment_method',
    'reference_number',
    'notes',
  ];

  const exampleRow = [
    '2024-01-15',
    '150.00',
    'USD',
    'Office Supplies',
    'Office Expenses',
    'Office Depot',
    'credit_card',
    'INV-12345',
    'Monthly office supplies order',
  ];

  return [
    headers.join(','),
    exampleRow.join(','),
  ].join('\n');
};

/**
 * Generate error CSV for download
 * @param {Array} errors - Array of error objects { row, errors }
 * @param {Array} headers - Original CSV headers
 * @returns {string} CSV string with errors
 */
export const generateErrorCSV = (errors, headers = []) => {
  const errorHeaders = [...headers, 'Error'];
  const rows = [errorHeaders.join(',')];

  errors.forEach(({ row, errors: errorList }) => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });

    const errorMessage = errorList.join('; ');
    values.push(`"${errorMessage}"`);
    rows.push(values.join(','));
  });

  return rows.join('\n');
};

/**
 * Convert array of objects to CSV string
 * @param {Array<Object>} data - Array of expense objects
 * @param {Array<string>} fields - Fields to include
 * @returns {string} CSV string
 */
export const convertToCSV = (data, fields) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headers = fields || Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  // Create data rows
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];

      // Handle nested objects (like category.name, vendor.name)
      if (header.includes('.')) {
        const parts = header.split('.');
        value = parts.reduce((obj, key) => obj?.[key], row);
      }

      // Convert value to string
      value = value !== null && value !== undefined ? String(value) : '';

      // Escape commas and quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    });

    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Download CSV string as file
 * @param {string} csvString - CSV content
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (csvString, filename) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
