/**
 * Admin API - Barrel file
 * Re-exports all domain-specific admin API services as a single unified object
 * for backward compatibility. Existing imports of `adminAPI` will still work.
 *
 * For new code, prefer importing the domain-specific services directly:
 *   import { adminUsersAPI } from '@/services/api/admin';
 */

import adminDashboardAPI from './api/admin/dashboard';
import adminUsersAPI from './api/admin/users';
import adminPlansAPI from './api/admin/plans';
import adminSubscriptionsAPI from './api/admin/subscriptions';
import adminPaymentsAPI from './api/admin/payments';
import adminThreadsAPI from './api/admin/threads';
import adminAI_API from './api/admin/ai';
import adminFeaturesAPI from './api/admin/features';
import adminCustomizationAPI from './api/admin/customization';
import adminPlatformsAPI from './api/admin/platforms';
import adminAIToolsAPI from './api/admin/aiTools';
import adminPreferencesAPI from './api/admin/preferences';
import adminTipsAPI from './api/admin/tips';

const adminAPI = {
  ...adminDashboardAPI,
  ...adminUsersAPI,
  ...adminPlansAPI,
  ...adminSubscriptionsAPI,
  ...adminPaymentsAPI,
  ...adminThreadsAPI,
  ...adminAI_API,
  ...adminFeaturesAPI,
  ...adminCustomizationAPI,
  ...adminPlatformsAPI,
  ...adminAIToolsAPI,
  ...adminPreferencesAPI,
  ...adminTipsAPI,
};

export { adminAPI };
export default adminAPI;

// Also export individual services for targeted imports
export {
  adminDashboardAPI,
  adminUsersAPI,
  adminPlansAPI,
  adminSubscriptionsAPI,
  adminPaymentsAPI,
  adminThreadsAPI,
  adminAI_API,
  adminFeaturesAPI,
  adminCustomizationAPI,
  adminPlatformsAPI,
  adminAIToolsAPI,
  adminPreferencesAPI,
  adminTipsAPI,
};
