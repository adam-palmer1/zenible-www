import { z } from 'zod';

/**
 * Service form validation schema using Zod
 *
 * Validation rules:
 * - Name is required
 * - Frequency type is required (one_off or recurring)
 * - Price must be a positive number if provided
 * - All other fields are optional
 */
export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive').optional().or(z.literal('')),
  currency_id: z.string().optional(),
  frequency_type: z.enum(['one_off', 'recurring'], {
    required_error: 'Frequency type is required',
  }),
  time_period: z.enum(['weekly', 'monthly', 'yearly']).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
});

/**
 * Get default values for service form
 */
export const getServiceDefaultValues = (service = null, defaultCurrency = null) => {
  if (service) {
    return service;
  }

  return {
    frequency_type: 'one_off',
    is_active: true,
    is_hidden: false,
    currency_id: defaultCurrency?.id || '',
  };
};
