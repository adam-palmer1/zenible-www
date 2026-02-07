/**
 * Auth, User, Plan, Subscription, and Payment types.
 * Convenience re-exports from OpenAPI generated types.
 */
import type { components } from './api.generated';

// ──────────────────────────────────────────────
// Authentication
// ──────────────────────────────────────────────

export type UserRegister = components['schemas']['UserRegister'];
export type UserLogin = components['schemas']['UserLogin'];
export type Token = components['schemas']['Token'];
export type ForgotPassword = components['schemas']['ForgotPassword'];
export type SetPassword = components['schemas']['SetPassword'];
export type SetPasswordResponse = components['schemas']['SetPasswordResponse'];
export type VerifyEmail = components['schemas']['VerifyEmail'];
export type GoogleLoginRequest = components['schemas']['GoogleLoginRequest'];
export type GoogleLoginResponse = components['schemas']['GoogleLoginResponse'];
export type GoogleCallbackRequest = components['schemas']['GoogleCallbackRequest'];
export type OAuthUrlResponse = components['schemas']['OAuthUrlResponse'];

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────

export type UserResponse = components['schemas']['UserResponse'];
export type UserDetailResponse = components['schemas']['UserDetailResponse'];
export type UserUpdate = components['schemas']['UserUpdate'];
export type UserAdminUpdate = components['schemas']['UserAdminUpdate'];
export type UserRoleUpdate = components['schemas']['UserRoleUpdate'];
export type UserList = components['schemas']['UserList'];
export type SimpleUserResponse = components['schemas']['SimpleUserResponse'];
export type UsernameAvailabilityResponse = components['schemas']['UsernameAvailabilityResponse'];
export type UsernameResponse = components['schemas']['UsernameResponse'];
export type UsernameUpdate = components['schemas']['UsernameUpdate'];
export type UsernameUpdateResponse = components['schemas']['UsernameUpdateResponse'];

// User Features
export type UserFeaturesResponse = components['schemas']['UserFeaturesResponse'];
export type UserDisplayFeature = components['schemas']['UserDisplayFeature'];
export type UserLimitsResponse = components['schemas']['UserLimitsResponse'];
export type UserCharacterAccess = components['schemas']['UserCharacterAccess'];
export type CharacterAccessCheck = components['schemas']['CharacterAccessCheck'];

// ──────────────────────────────────────────────
// Preferences
// ──────────────────────────────────────────────

export type PreferenceResponse = components['schemas']['PreferenceResponse'];
export type PreferenceUpdate = components['schemas']['PreferenceUpdate'];
export type PreferenceList = components['schemas']['PreferenceList'];
export type PreferenceSimpleResponse = components['schemas']['PreferenceSimpleResponse'];
export type PreferenceCategoryList = components['schemas']['PreferenceCategoryList'];
export type PreferenceBulkSet = components['schemas']['PreferenceBulkSet'];
export type PreferenceBulkGet = components['schemas']['PreferenceBulkGet'];
export type PreferenceBulkResponse = components['schemas']['PreferenceBulkResponse'];
export type PreferenceKeyValue = components['schemas']['PreferenceKeyValue'];

// ──────────────────────────────────────────────
// Plans
// ──────────────────────────────────────────────

export type PlanResponse = components['schemas']['PlanResponse'];
export type PlanDetailResponse = components['schemas']['PlanDetailResponse'];
export type PlanCreate = components['schemas']['PlanCreate'];
export type PlanUpdate = components['schemas']['PlanUpdate'];
export type PlanList = components['schemas']['PlanList'];
export type PlanSubscribersResponse = components['schemas']['PlanSubscribersResponse'];
export type StripeSync = components['schemas']['StripeSync'];
export type StripeSyncResponse = components['schemas']['StripeSyncResponse'];

// Plan Features
export type PlanFeaturesOverview = components['schemas']['PlanFeaturesOverview'];
export type PlanDisplayFeatureResponse = components['schemas']['PlanDisplayFeatureResponse'];
export type PlanDisplayFeaturesUpdate = components['schemas']['PlanDisplayFeaturesUpdate'];
export type PlanSystemFeatureResponse = components['schemas']['PlanSystemFeatureResponse'];
export type PlanSystemFeaturesUpdate = components['schemas']['PlanSystemFeaturesUpdate'];
export type PlanCharacterAccessResponse = components['schemas']['PlanCharacterAccessResponse'];
export type PlanCharacterAccessUpdate = components['schemas']['PlanCharacterAccessUpdate'];
export type DisplayFeatureResponse = components['schemas']['DisplayFeatureResponse'];
export type DisplayFeatureCreate = components['schemas']['DisplayFeatureCreate'];
export type DisplayFeatureUpdate = components['schemas']['DisplayFeatureUpdate'];
export type SystemFeatureResponse = components['schemas']['SystemFeatureResponse'];
export type SystemFeatureCreate = components['schemas']['SystemFeatureCreate'];
export type SystemFeatureUpdate = components['schemas']['SystemFeatureUpdate'];
export type FeatureType = components['schemas']['FeatureType'];
export type FeatureCheckResponse = components['schemas']['FeatureCheckResponse'];
export type FeatureStatus = components['schemas']['FeatureStatus'];

// ──────────────────────────────────────────────
// Subscriptions
// ──────────────────────────────────────────────

export type SubscriptionResponse = components['schemas']['SubscriptionResponse'];
export type SubscriptionCreate = components['schemas']['SubscriptionCreate'];
export type SubscriptionList = components['schemas']['SubscriptionList'];
export type UpgradeRequest = components['schemas']['UpgradeRequest'];
export type DowngradeRequest = components['schemas']['DowngradeRequest'];
export type DowngradeWarning = components['schemas']['DowngradeWarning'];
export type CancelRequest = components['schemas']['CancelRequest'];
export type ReactivateRequest = components['schemas']['ReactivateRequest'];
export type UpdatePaymentMethodRequest = components['schemas']['UpdatePaymentMethodRequest'];

// ──────────────────────────────────────────────
// Payments (Platform/Subscription)
// ──────────────────────────────────────────────

export type PaymentIntentCreate = components['schemas']['PaymentIntentCreate'];
export type PaymentIntentResponse = components['schemas']['PaymentIntentResponse'];
export type PaymentIntentClientSecret = components['schemas']['PaymentIntentClientSecret'];
export type PaymentMethodResponse = components['schemas']['PaymentMethodResponse'];
export type PaymentMethodCreate = components['schemas']['PaymentMethodCreate'];
export type PaymentStats = components['schemas']['PaymentStats'];
export type PaymentHistory = components['schemas']['PaymentHistory'];
export type PaymentList = components['schemas']['PaymentList'];
export type RefundRequest = components['schemas']['RefundRequest'];
export type RefundResponse = components['schemas']['RefundResponse'];

// ──────────────────────────────────────────────
// Usage & Limits
// ──────────────────────────────────────────────

export type UsageResponse = components['schemas']['UsageResponse'];
export type UsageDashboardResponse = components['schemas']['UsageDashboardResponse'];
export type UsageLimitsResponse = components['schemas']['UsageLimitsResponse'];
export type UsageAnalytics = components['schemas']['UsageAnalytics'];
export type UsageHistoryResponse = components['schemas']['UsageHistoryResponse'];
export type UsageTrackingResponse = components['schemas']['UsageTrackingResponse'];
export type CurrentUsageResponse = components['schemas']['CurrentUsageResponse'];
export type DailyUsageSummary = components['schemas']['DailyUsageSummary'];
export type MonthlyLimitCheckResponse = components['schemas']['MonthlyLimitCheckResponse'];
export type EntityLimitCheckResponse = components['schemas']['EntityLimitCheckResponse'];
export type EntityLimitStatus = components['schemas']['EntityLimitStatus'];
export type UserStatusOverrideResponse = components['schemas']['UserStatusOverrideResponse'];
export type UserStatusOverrideUpdate = components['schemas']['UserStatusOverrideUpdate'];

// ──────────────────────────────────────────────
// Admin
// ──────────────────────────────────────────────

export type DashboardStats = components['schemas']['DashboardStats'];
export type RevenueAnalytics = components['schemas']['RevenueAnalytics'];
export type UserAnalytics = components['schemas']['UserAnalytics'];
