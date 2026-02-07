import { FilterOption } from './types';

export const DURATION_OPTIONS: FilterOption[] = [
  { id: '30days', label: '30 Days', description: 'Default duration' },
  { id: '3months', label: '3 Months', description: 'Expires in 3 months' },
  { id: '6months', label: '6 Months', description: 'Expires in 6 months' },
  { id: '1year', label: '1 Year', description: 'Expires in 1 year' },
  { id: 'lifetime', label: 'Lifetime', description: 'Valid until 2099' },
  { id: 'custom', label: 'Custom Dates', description: 'Set specific dates' },
];

export const ROLE_OPTIONS: FilterOption[] = [
  { id: 'USER', label: 'User', description: 'Standard user access' },
  { id: 'ADMIN', label: 'Admin', description: 'Full administrative access' },
];

export const ROLE_FILTER_OPTIONS: FilterOption[] = [
  { id: '', label: 'All Roles' },
  { id: 'ADMIN', label: 'Admin' },
  { id: 'USER', label: 'User' },
];

export const ACTIVE_FILTER_OPTIONS: FilterOption[] = [
  { id: '', label: 'All Users' },
  { id: 'active', label: 'Active' },
  { id: 'deleted', label: 'Deleted' },
];

export const VERIFIED_FILTER_OPTIONS: FilterOption[] = [
  { id: '', label: 'All' },
  { id: 'true', label: 'Verified' },
  { id: 'false', label: 'Unverified' },
];

export const ORDER_BY_OPTIONS: FilterOption[] = [
  { id: 'created_at', label: 'Created Date' },
  { id: 'updated_at', label: 'Updated Date' },
  { id: 'email', label: 'Email' },
  { id: 'first_name', label: 'Name' },
];

export const ORDER_DIR_OPTIONS: FilterOption[] = [
  { id: 'desc', label: 'Descending' },
  { id: 'asc', label: 'Ascending' },
];
