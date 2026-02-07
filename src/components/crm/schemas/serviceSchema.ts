import { z } from 'zod';
import { SERVICE_STATUS } from '../../../constants/crm';

/**
 * Service form validation schema using Zod
 *
 * Validation rules:
 * - Name is required
 * - Frequency type is required (one_off or recurring)
 * - Price must be a positive number if provided
 * - Status must be one of: inactive, active, completed
 * - All other fields are optional
 */
export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive').optional().or(z.literal('')),
  currency_id: z.string().optional(),
  frequency_type: z.enum(['one_off', 'recurring'], {
    message: 'Frequency type is required',
  }),
  time_period: z.enum(['weekly', 'monthly', 'yearly']).optional().or(z.literal('')),
  status: z.enum([SERVICE_STATUS.PENDING, SERVICE_STATUS.INACTIVE, SERVICE_STATUS.ACTIVE, SERVICE_STATUS.COMPLETED]).optional(),
  is_hidden: z.boolean().optional(),
});

/**
 * Get default values for service form
 */
export const getServiceDefaultValues = (service: any = null, defaultCurrency: any = null) => {
  if (service) {
    return service;
  }

  return {
    frequency_type: 'one_off',
    status: (SERVICE_STATUS as any).ACTIVE,
    is_hidden: false,
    currency_id: defaultCurrency?.id || '',
  };
};
