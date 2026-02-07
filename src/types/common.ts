/**
 * Common shared types used across the application.
 * Re-exports from OpenAPI generated types + supplementary types.
 */
import type { components } from './api.generated';

// ──────────────────────────────────────────────
// Validation & Errors
// ──────────────────────────────────────────────

export type ValidationError = components['schemas']['ValidationError'];
export type HTTPValidationError = components['schemas']['HTTPValidationError'];

/** Enhanced error thrown by httpClient */
export interface APIError extends Error {
  status?: number;
  data?: unknown;
  response?: { detail: string | ValidationError[] };
}

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────

/** Standard paginated list response from the API */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

/** Pagination state used in contexts/hooks */
export interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// ──────────────────────────────────────────────
// Sorting & Filtering
// ──────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  sort_by: string;
  sort_direction: SortDirection;
}

/** Base query params shared by most list endpoints */
export interface ListQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: SortDirection;
}

// ──────────────────────────────────────────────
// Number Format
// ──────────────────────────────────────────────

export type NumberFormatResponse = components['schemas']['NumberFormatResponse'];

/** Number format configuration for display */
export interface NumberFormat {
  decimal_separator: string;
  thousands_separator: string;
  format_string: string;
  name: string;
}

// ──────────────────────────────────────────────
// Date Range
// ──────────────────────────────────────────────

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

export interface DateRange {
  start_date: string | null;
  end_date: string | null;
  preset?: DateRangePreset;
}

// ──────────────────────────────────────────────
// Enums from OpenAPI
// ──────────────────────────────────────────────

export type SortDirectionEnum = components['schemas']['SortDirectionEnum'];
export type FieldTypeEnum = components['schemas']['FieldTypeEnum'];
export type FieldCategoryEnum = components['schemas']['FieldCategoryEnum'];
export type OperationType = components['schemas']['OperationType'];

// ──────────────────────────────────────────────
// Currency
// ──────────────────────────────────────────────

export type CurrencyResponse = components['schemas']['CurrencyResponse'];
export type CurrencyConversionRequest = components['schemas']['CurrencyConversionRequest'];
export type CurrencyConversionResponse = components['schemas']['CurrencyConversionResponse'];
export type BatchConversionRequest = components['schemas']['BatchConversionRequest'];
export type BatchConversionResponse = components['schemas']['BatchConversionResponse'];
export type ExchangeRatesRequest = components['schemas']['ExchangeRatesRequest'];
export type ExchangeRatesResponse = components['schemas']['ExchangeRatesResponse'];
export type HistoricalRateRequest = components['schemas']['HistoricalRateRequest'];
export type HistoricalRateResponse = components['schemas']['HistoricalRateResponse'];
export type HistoricalRangeRequest = components['schemas']['HistoricalRangeRequest'];
export type HistoricalRangeResponse = components['schemas']['HistoricalRangeResponse'];
export type HistoricalConversionRequest = components['schemas']['HistoricalConversionRequest'];
export type HistoricalConversionResponse = components['schemas']['HistoricalConversionResponse'];
export type SimpleCurrencyResponse = components['schemas']['SimpleCurrencyResponse'];

// ──────────────────────────────────────────────
// Country
// ──────────────────────────────────────────────

export type CountryResponse = components['schemas']['CountryResponse'];
export type CountryCreate = components['schemas']['CountryCreate'];

// ──────────────────────────────────────────────
// Company
// ──────────────────────────────────────────────

export type CompanyResponse = components['schemas']['CompanyResponse'];
export type CompanyUpdate = components['schemas']['CompanyUpdate'];
export type CompanyAttributeResponse = components['schemas']['CompanyAttributeResponse'];
export type CompanyAttributeCreate = components['schemas']['CompanyAttributeCreate'];
export type CompanyAttributeBatchUpdate = components['schemas']['CompanyAttributeBatchUpdate'];
export type CompanyCurrencyResponse = components['schemas']['CompanyCurrencyResponse'];
export type CompanyCurrencyCreate = components['schemas']['CompanyCurrencyCreate'];
export type CompanyCountryResponse = components['schemas']['CompanyCountryResponse'];
export type CompanyCountryCreate = components['schemas']['CompanyCountryCreate'];
export type CompanyTaxResponse = components['schemas']['CompanyTaxResponse'];
export type CompanyTaxCreate = components['schemas']['CompanyTaxCreate'];
export type CompanyTaxUpdate = components['schemas']['CompanyTaxUpdate'];
export type CompanyTaxReorderRequest = components['schemas']['CompanyTaxReorderRequest'];
export type CompanyUserDetailResponse = components['schemas']['CompanyUserDetailResponse'];
export type CompanyUserSummary = components['schemas']['CompanyUserSummary'];
export type CompanyUserInvite = components['schemas']['CompanyUserInvite'];
export type CompanyInvitationResponse = components['schemas']['CompanyInvitationResponse'];
export type CompanyUsersAndInvitationsResponse = components['schemas']['CompanyUsersAndInvitationsResponse'];

// ──────────────────────────────────────────────
// Permissions
// ──────────────────────────────────────────────

export type PermissionResponse = components['schemas']['PermissionResponse'];
export type PermissionListResponse = components['schemas']['PermissionListResponse'];
export type UserPermissionsResponse = components['schemas']['UserPermissionsResponse'];
export type UserPermissionResponse = components['schemas']['UserPermissionResponse'];
export type UserPermissionGrant = components['schemas']['UserPermissionGrant'];
export type UserPermissionRevoke = components['schemas']['UserPermissionRevoke'];
export type UserPermissionBulkUpdate = components['schemas']['UserPermissionBulkUpdate'];

// ──────────────────────────────────────────────
// Number Formats, Industries, Employee Ranges, Vendor Types
// ──────────────────────────────────────────────

export type NumberFormatCreate = components['schemas']['NumberFormatCreate'];
export type NumberFormatUpdate = components['schemas']['NumberFormatUpdate'];
export type IndustryResponse = components['schemas']['IndustryResponse'];
export type IndustryCreate = components['schemas']['IndustryCreate'];
export type IndustryUpdate = components['schemas']['IndustryUpdate'];
export type EmployeeRangeResponse = components['schemas']['EmployeeRangeResponse'];
export type EmployeeRangeCreate = components['schemas']['EmployeeRangeCreate'];
export type EmployeeRangeUpdate = components['schemas']['EmployeeRangeUpdate'];
export type VendorTypeResponse = components['schemas']['VendorTypeResponse'];
export type VendorTypeCreate = components['schemas']['VendorTypeCreate'];
export type VendorTypeUpdate = components['schemas']['VendorTypeUpdate'];
