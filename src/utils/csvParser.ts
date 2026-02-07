/**
 * CSV Parser Utility for Expense Import/Export
 * Handles CSV parsing, validation, column mapping, and template generation
 */

export const parseCSV = async (file: File): Promise<Record<string, string>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        // Parse header row
        const headers = parseCSVLine(lines[0]);

        // Parse data rows
        const data: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue; // Skip empty lines

          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
          });
          data.push(row);
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
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

interface ColumnMapping {
  [index: number]: {
    csvColumn: string;
    expenseField: string;
  };
}

export const detectColumnMapping = (headers: string[]): ColumnMapping => {
  const mapping: ColumnMapping = {};

  const columnMap: Record<string, string> = {
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

interface ValidationOptions {
  categories?: Array<{ name?: string }>;
  vendors?: Array<{ name?: string }>;
}

export const validateExpenseRow = (row: Record<string, string>, options: ValidationOptions = {}): { valid: boolean; errors: string[] } => {
  const { categories = [], vendors = [] } = options;
  const errors: string[] = [];

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

interface ConversionOptions {
  categories?: Array<{ id: string; name?: string }>;
  vendors?: Array<{ id: string; name?: string }>;
  currencies?: Array<{ currency?: { id: string; code?: string } }>;
  createMissing?: boolean;
}

export const convertToExpenseFormat = (row: Record<string, string>, options: ConversionOptions = {}): Record<string, unknown> => {
  const { categories = [], vendors = [], currencies = [] } = options;

  const expenseData: Record<string, unknown> = {
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
      expenseData.currency_id = currency.currency!.id;
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

export const generateCSVTemplate = (): string => {
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

interface ErrorRow {
  row: Record<string, string>;
  errors: string[];
}

export const generateErrorCSV = (errors: ErrorRow[], headers: string[] = []): string => {
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

export const convertToCSV = (data: Record<string, unknown>[] | null | undefined, fields?: string[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headers = fields || Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  // Create data rows
  data.forEach(row => {
    const values = headers.map(header => {
      let value: unknown = row[header];

      // Handle nested objects (like category.name, vendor.name)
      if (header.includes('.')) {
        const parts = header.split('.');
        value = parts.reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], row);
      }

      // Convert value to string
      let strValue = value !== null && value !== undefined ? String(value) : '';

      // Escape commas and quotes
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        strValue = `"${strValue.replace(/"/g, '""')}"`;
      }

      return strValue;
    });

    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

export const downloadCSV = (csvString: string, filename: string): void => {
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
