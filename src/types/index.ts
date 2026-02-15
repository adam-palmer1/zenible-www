/**
 * Central type barrel file.
 *
 * Usage:
 *   import type { ContactResponse, InvoiceCreate, UserResponse } from '@/types';
 *
 * For raw OpenAPI types (rarely needed):
 *   import type { components, paths } from '@/types/api.generated';
 */

// Common shared types
export * from './common';

// Domain types
export * from './auth';
export * from './crm';
export * from './finance';
export * from './ai';
export * from './websocket';
export * from './customReport';

// Existing manually-created types
export {
  EmailTemplateType as EmailTemplateTypeEnum,
  type EmailTemplate as EmailTemplateManual,
  type EmailTemplateCreate as EmailTemplateCreateManual,
  type EmailTemplateUpdate as EmailTemplateUpdateManual,
  type EmailTemplateListResponse as EmailTemplateListResponseManual,
  type TemplateVariable,
  type TemplateVariablesResponse,
  type EmailTemplatePreviewRequest as EmailTemplatePreviewRequestManual,
  type EmailTemplatePreviewResponse as EmailTemplatePreviewResponseManual,
  type InvoiceSendRequest as InvoiceSendRequestManual,
  TEMPLATE_TYPE_LABELS,
  TEMPLATE_TYPE_COLORS,
  TEMPLATE_CATEGORIES,
} from './emailTemplate';

// Re-export the raw generated types namespace for advanced usage
export type { components, paths, operations } from './api.generated';
