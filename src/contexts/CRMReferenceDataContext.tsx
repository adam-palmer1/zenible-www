import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useUsageDashboardOptional } from './UsageDashboardContext';
import countriesAPI from '../services/api/crm/countries';
import industriesAPI from '../services/api/crm/industries';
import employeeRangesAPI from '../services/api/crm/employeeRanges';
import vendorTypesAPI from '../services/api/crm/vendorTypes';
import numberFormatsAPI from '../services/api/crm/numberFormats';
import appointmentEnumsAPI from '../services/api/crm/appointmentEnums';
import { queryKeys } from '../lib/query-keys';

export interface ReferenceCountry {
  id: string;
  name: string;
  code: string;
  [key: string]: unknown;
}

export interface ReferenceCompanyCountry {
  id: string;
  country: ReferenceCountry;
  is_default: boolean;
  [key: string]: unknown;
}

export interface Industry {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface EmployeeRange {
  id: string;
  name: string;
  min_employees?: number;
  max_employees?: number;
  [key: string]: unknown;
}

export interface VendorType {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface NumberFormat {
  id: string;
  name?: string;
  format_string?: string;
  decimal_separator: string;
  thousands_separator: string;
  [key: string]: unknown;
}

export interface EnumItem {
  value: string;
  label: string;
  color?: string;
  [key: string]: unknown;
}

/** Shape of the appointment enums API response (superset of generated AppointmentEnumsResponse) */
interface AppointmentEnumsData {
  appointment_types?: EnumItem[];
  appointment_statuses?: EnumItem[];
  sync_statuses?: EnumItem[];
  recurring_types?: EnumItem[];
  recurring_statuses?: EnumItem[];
  monthly_recurring_types?: EnumItem[];
  edit_scopes?: EnumItem[];
  [key: string]: unknown;
}

interface CRMReferenceDataState {
  countries: ReferenceCountry[];
  companyEnabledCountries: ReferenceCompanyCountry[];
  industries: Industry[];
  employeeRanges: EmployeeRange[];
  vendorTypes: VendorType[];
  numberFormats: NumberFormat[];
  appointmentTypes: EnumItem[];
  appointmentStatuses: EnumItem[];
  syncStatuses: EnumItem[];
  recurringTypes: EnumItem[];
  recurringStatuses: EnumItem[];
  monthlyRecurringTypes: EnumItem[];
  editScopes: EnumItem[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface CRMReferenceDataContextValue extends CRMReferenceDataState {
  getCountryByCode: (code: string) => ReferenceCountry | undefined;
  getCountryById: (id: string) => ReferenceCountry | undefined;
  getIndustryById: (id: string) => Industry | undefined;
  getIndustryByName: (name: string) => Industry | undefined;
  getEmployeeRangeById: (id: string) => EmployeeRange | undefined;
  getNumberFormatById: (id: string) => NumberFormat | undefined;
  getVendorTypeById: (id: string) => VendorType | undefined;
  getTypeLabel: (value: string) => string;
  getStatusLabel: (value: string) => string;
  getStatusColor: (value: string) => string;
  refresh: () => Promise<void>;
}

const REFERENCE_STALE_TIME = 30 * 60 * 1000; // 30 minutes
const REFERENCE_GC_TIME = 60 * 60 * 1000; // 1 hour

const CRMReferenceDataContext = createContext<CRMReferenceDataContextValue | null>(null);

async function fetchAllReferenceData(calendarEnabled: boolean) {
  const failedSources: string[] = [];

  const [
    countriesData,
    companyCountriesData,
    industriesData,
    employeeRangesData,
    vendorTypesData,
    numberFormatsData,
    appointmentEnumsData
  ] = await Promise.all([
    countriesAPI.list().catch((err: unknown) => { console.error('Failed to load countries:', err); failedSources.push('countries'); return []; }),
    countriesAPI.getCompanyCountries().catch((err: unknown) => { console.error('Failed to load company countries:', err); failedSources.push('companyCountries'); return []; }),
    industriesAPI.list().catch((err: unknown) => { console.error('Failed to load industries:', err); failedSources.push('industries'); return []; }),
    employeeRangesAPI.list().catch((err: unknown) => { console.error('Failed to load employee ranges:', err); failedSources.push('employeeRanges'); return []; }),
    vendorTypesAPI.list().catch((err: unknown) => { console.error('Failed to load vendor types:', err); failedSources.push('vendorTypes'); return []; }),
    numberFormatsAPI.list().catch((err: unknown) => { console.error('Failed to load number formats:', err); failedSources.push('numberFormats'); return []; }),
    calendarEnabled
      ? appointmentEnumsAPI.getEnums().catch((err: unknown) => { console.error('Failed to load appointment enums:', err); failedSources.push('appointmentEnums'); return {}; })
      : Promise.resolve({})
  ]);

  const enums = appointmentEnumsData as AppointmentEnumsData;

  return {
    countries: (countriesData as ReferenceCountry[]) || [],
    companyEnabledCountries: (companyCountriesData as ReferenceCompanyCountry[]) || [],
    industries: (industriesData as Industry[]) || [],
    employeeRanges: (employeeRangesData as EmployeeRange[]) || [],
    vendorTypes: (vendorTypesData as VendorType[]) || [],
    numberFormats: (numberFormatsData as NumberFormat[]) || [],
    appointmentTypes: enums?.appointment_types || [],
    appointmentStatuses: enums?.appointment_statuses || [],
    syncStatuses: enums?.sync_statuses || [],
    recurringTypes: enums?.recurring_types || [],
    recurringStatuses: enums?.recurring_statuses || [],
    monthlyRecurringTypes: enums?.monthly_recurring_types || [],
    editScopes: enums?.edit_scopes || [],
    failedSources,
  };
}

export const CRMReferenceDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const usageDashboard = useUsageDashboardOptional();

  // Check if calendar feature is enabled (default to false if usage data not yet loaded)
  const calendarEnabled = usageDashboard?.isFeatureEnabled('calendar') ?? false;

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: [...queryKeys.referenceData.all, { calendarEnabled }],
    queryFn: () => fetchAllReferenceData(calendarEnabled),
    staleTime: REFERENCE_STALE_TIME,
    gcTime: REFERENCE_GC_TIME,
    enabled: !authLoading && isAuthenticated,
  });

  const state: CRMReferenceDataState = useMemo(() => ({
    countries: data?.countries || [],
    companyEnabledCountries: data?.companyEnabledCountries || [],
    industries: data?.industries || [],
    employeeRanges: data?.employeeRanges || [],
    vendorTypes: data?.vendorTypes || [],
    numberFormats: data?.numberFormats || [],
    appointmentTypes: data?.appointmentTypes || [],
    appointmentStatuses: data?.appointmentStatuses || [],
    syncStatuses: data?.syncStatuses || [],
    recurringTypes: data?.recurringTypes || [],
    recurringStatuses: data?.recurringStatuses || [],
    monthlyRecurringTypes: data?.monthlyRecurringTypes || [],
    editScopes: data?.editScopes || [],
    loading: isLoading,
    error: error ? (error as Error).message
      : (data?.failedSources?.length ? `Partially loaded. Failed sources: ${data.failedSources.join(', ')}` : null),
    lastFetch: dataUpdatedAt || null,
  }), [data, isLoading, error, dataUpdatedAt]);

  // Helper methods for quick lookups
  const helpers = useMemo(() => ({
    getCountryByCode: (code: string) => state.countries.find(c => c.code === code),
    getCountryById: (id: string) => state.countries.find(c => c.id === id),
    getIndustryById: (id: string) => state.industries.find(i => i.id === id),
    getIndustryByName: (name: string) => state.industries.find(i => i.name === name),
    getEmployeeRangeById: (id: string) => state.employeeRanges.find(e => e.id === id),
    getNumberFormatById: (id: string) => state.numberFormats.find(n => n.id === id),
    getVendorTypeById: (id: string) => state.vendorTypes.find(v => v.id === id),
    getTypeLabel: (value: string) => state.appointmentTypes.find(t => t.value === value)?.label || value,
    getStatusLabel: (value: string) => state.appointmentStatuses.find(s => s.value === value)?.label || value,
    getStatusColor: (value: string) => state.appointmentStatuses.find(s => s.value === value)?.color || '#6B7280'
  }), [state]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.referenceData.all });
  }, [queryClient]);

  const value: CRMReferenceDataContextValue = {
    ...state,
    ...helpers,
    refresh,
  };

  return (
    <CRMReferenceDataContext.Provider value={value}>
      {children}
    </CRMReferenceDataContext.Provider>
  );
};

export const useCRMReferenceData = () => {
  const context = useContext(CRMReferenceDataContext);
  if (!context) {
    throw new Error('useCRMReferenceData must be used within CRMReferenceDataProvider');
  }
  return context;
};
