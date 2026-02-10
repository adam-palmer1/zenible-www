import { z } from 'zod';

/**
 * Contact form validation schema using Zod
 *
 * Validation rules:
 * - At least one identifier required (first_name, business_name, or email)
 * - Email must be valid format if provided
 * - All other fields are optional
 */
export const contactSchema = z.object({
  // Basic fields
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  business_name: z.string().optional(),
  email: z.string()
    .optional()
    .transform(val => !val || val === '' ? null : val)
    .refine(val => val === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Invalid email format'),

  // Phone
  country_code: z.string().optional()
    .refine(val => !val || /^[+\d\s]*$/.test(val), 'Country code must contain only digits and +'),
  phone: z.string().optional()
    .refine(val => !val || /^[\d\s\-()+.]*$/.test(val), 'Phone number must contain only digits, spaces, and punctuation'),

  // Address
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(), // Legacy field - kept for compatibility
  country_id: z.any().optional().transform((val: any) => {
    if (!val || val === '' || val === 'null' || val === 'undefined') return null;
    return val;
  }),

  // Company/Tax information
  registration_number: z.string().optional(),
  tax_number: z.string().optional(),
  tax_id: z.string().optional(),

  // Type flags
  is_client: z.boolean().optional(),
  is_vendor: z.boolean().optional(),
  is_active: z.boolean().optional(),

  // Vendor-specific
  vendor_type: z.string().optional(),
  default_payment_terms: z.any().optional().transform((val: any) => {
    if (val === null || val === undefined || val === '' || val === 'null') return null;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num)) return null;
    return Math.min(Math.max(num, 0), 365);
  }),

  // Status
  current_global_status_id: z.union([z.string(), z.null()]).optional(),
  current_custom_status_id: z.union([z.string(), z.null()]).optional(),

  // Finance fields (handle null, undefined, empty strings, and UUIDs)
  currency_id: z.any().optional().transform((val: any) => {
    if (!val || val === '' || val === 'null' || val === 'undefined') return null;
    return val;
  }),
  preferred_currency_id: z.any().optional().transform((val: any) => {
    if (!val || val === '' || val === 'null' || val === 'undefined') return null;
    return val;
  }),
  invoice_payment_terms: z.any().optional().transform((val: any) => {
    if (val === null || val === undefined || val === '' || val === 'null') return null;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num)) return null;
    return Math.min(Math.max(num, 0), 365);
  }),
  invoice_notes: z.string().optional(),
  hourly_rate: z.any().optional().transform((val: any) => {
    if (val === null || val === undefined || val === '' || val === 'null') return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return null;
    return Math.max(num, 0);
  }),

  // Other
  notes: z.string().optional(),
}).refine(
  (data) => {
    // At least one identifier required
    return data.first_name || data.business_name || data.email;
  },
  {
    message: 'At least one of first name, business name, or email is required',
    path: ['first_name'], // Show error on first_name field
  }
).refine(
  (data) => {
    // Email required for clients and vendors
    if ((data.is_client || data.is_vendor) && !data.email) {
      return false;
    }
    return true;
  },
  {
    message: 'Email is required for clients and vendors',
    path: ['email'],
  }
);

/**
 * Get default values for contact form
 */
export const getContactDefaultValues = (
  contact: any = null,
  initialStatus: string | null = null,
  defaultCurrencyId: string | null = null,
  initialContactType: string | null = null,
  defaultCountryId: string | null = null
) => {
  if (contact) {
    return {
      ...contact,
      // Convert null values to empty strings for form fields
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      business_name: contact.business_name || '',
      email: contact.email || '',
      country_code: contact.country_code || '',
      phone: contact.phone || '',
      address_line_1: contact.address_line_1 || '',
      address_line_2: contact.address_line_2 || '',
      city: contact.city || '',
      state: contact.state || '',
      postcode: contact.postcode || '',
      country: contact.country || '',
      country_id: contact.country_id || null,
      // Company/Tax information
      registration_number: contact.registration_number || '',
      tax_number: contact.tax_number || '',
      tax_id: contact.tax_id || '',
      // Vendor-specific
      vendor_type: contact.vendor_type || '',
      default_payment_terms: contact.default_payment_terms || null,
      // Finance fields - use company default currency if contact's currency is null
      currency_id: contact.currency_id || defaultCurrencyId || null,
      preferred_currency_id: contact.preferred_currency_id || null,
      invoice_payment_terms: contact.invoice_payment_terms || null,
      invoice_notes: contact.invoice_notes || '',
      hourly_rate: contact.hourly_rate || null,
    };
  }

  return {
    first_name: '',
    last_name: '',
    business_name: '',
    email: '',
    country_code: '+44',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    country_id: defaultCountryId || null,
    notes: '',
    is_active: true,
    is_client: initialContactType === 'client',
    is_vendor: initialContactType === 'vendor',
    currency_id: defaultCurrencyId || null,
    preferred_currency_id: null,
    invoice_payment_terms: null,
    invoice_notes: '',
    hourly_rate: null,
    current_global_status_id: initialStatus || null,
    current_custom_status_id: null,
    // Company/Tax information
    registration_number: '',
    tax_number: '',
    tax_id: '',
    // Vendor-specific
    vendor_type: '',
    default_payment_terms: null,
  };
};
