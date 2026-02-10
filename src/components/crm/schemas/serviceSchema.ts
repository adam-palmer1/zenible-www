import { z } from 'zod';

/**
 * Service form validation schema using Zod
 *
 * Validation rules:
 * - Name is required
 * - Price is required and must be positive
 * - Currency is required
 * - Frequency type is required (one_off or recurring)
 * - When recurring, time_period is required
 * - When custom time period, custom_every and custom_period are required
 * - All other fields are optional
 */
export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.coerce.number({ message: 'Price is required' }).positive('Price must be positive'),
  currency_id: z.string().min(1, 'Currency is required'),
  frequency_type: z.enum(['one_off', 'recurring'], {
    message: 'Frequency type is required',
  }),
  time_period: z.enum(['weekly', 'monthly', 'yearly', 'custom']).optional().or(z.literal('')).transform((val) => val || undefined),
  custom_every: z.union([
    z.coerce.number().int().min(1),
    z.literal(''),
  ]).optional().transform((val) => (val === '' || val === undefined || val === 0) ? undefined : val),
  custom_period: z.enum(['days', 'weeks', 'months', 'years']).optional().or(z.literal('')).transform((val) => val || undefined),
  is_hidden: z.boolean().optional(),
}).refine((data) => {
  if (data.time_period === 'custom') {
    return data.custom_every !== undefined && data.custom_period !== undefined;
  }
  return true;
}, { message: 'Custom frequency and period are required', path: ['custom_every'] });

/**
 * Get default values for service form
 */
export const getServiceDefaultValues = (service: any = null, defaultCurrency: any = null) => {
  if (service) {
    return {
      ...service,
      custom_every: service.custom_every != null ? String(service.custom_every) : '',
    };
  }

  return {
    frequency_type: 'one_off',
    is_hidden: false,
    currency_id: defaultCurrency?.currency?.id || '',
  };
};
