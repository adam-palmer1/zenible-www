import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import countriesAPI from '../services/api/crm/countries';
import industriesAPI from '../services/api/crm/industries';
import employeeRangesAPI from '../services/api/crm/employeeRanges';
import vendorTypesAPI from '../services/api/crm/vendorTypes';
import numberFormatsAPI from '../services/api/crm/numberFormats';
import appointmentEnumsAPI from '../services/api/crm/appointmentEnums';

interface CRMReferenceDataState {
  countries: unknown[];
  companyEnabledCountries: unknown[];
  industries: unknown[];
  employeeRanges: unknown[];
  vendorTypes: unknown[];
  numberFormats: unknown[];
  appointmentTypes: unknown[];
  appointmentStatuses: unknown[];
  syncStatuses: unknown[];
  recurringTypes: unknown[];
  recurringStatuses: unknown[];
  monthlyRecurringTypes: unknown[];
  editScopes: unknown[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface CRMReferenceDataContextValue extends CRMReferenceDataState {
  getCountryByCode: (code: string) => unknown;
  getCountryById: (id: string) => unknown;
  getIndustryById: (id: string) => unknown;
  getIndustryByName: (name: string) => unknown;
  getEmployeeRangeById: (id: string) => unknown;
  getNumberFormatById: (id: string) => unknown;
  getVendorTypeById: (id: string) => unknown;
  getTypeLabel: (value: string) => string;
  getStatusLabel: (value: string) => string;
  getStatusColor: (value: string) => string;
  refresh: () => Promise<void>;
}

const CRMReferenceDataContext = createContext<CRMReferenceDataContextValue | null>(null);

export const CRMReferenceDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // State for all reference data
  const [state, setState] = useState<CRMReferenceDataState>({
    // Static reference data
    countries: [],
    companyEnabledCountries: [],
    industries: [],
    employeeRanges: [],
    vendorTypes: [],
    numberFormats: [],

    // Appointment enums (migrated from EnumMetadataContext)
    appointmentTypes: [],
    appointmentStatuses: [],
    syncStatuses: [],
    recurringTypes: [],
    recurringStatuses: [],
    monthlyRecurringTypes: [],
    editScopes: [],

    // Meta
    loading: true,
    error: null,
    lastFetch: null
  });

  // Fetch all reference data on mount
  const fetchAllReferenceData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [
        countriesData,
        companyCountriesData,
        industriesData,
        employeeRangesData,
        vendorTypesData,
        numberFormatsData,
        appointmentEnumsData
      ] = await Promise.all([
        countriesAPI.list().catch(() => []),
        countriesAPI.getCompanyCountries().catch(() => []),
        industriesAPI.list().catch(() => []),
        employeeRangesAPI.list().catch(() => []),
        vendorTypesAPI.list().catch(() => []),
        numberFormatsAPI.list().catch(() => []),
        appointmentEnumsAPI.getEnums().catch(() => ({}))
      ]);

      setState({
        countries: (countriesData as unknown[]) || [],
        companyEnabledCountries: (companyCountriesData as unknown[]) || [],
        industries: (industriesData as unknown[]) || [],
        employeeRanges: (employeeRangesData as unknown[]) || [],
        vendorTypes: (vendorTypesData as unknown[]) || [],
        numberFormats: (numberFormatsData as unknown[]) || [],
        appointmentTypes: (appointmentEnumsData as any)?.appointment_types || [],
        appointmentStatuses: (appointmentEnumsData as any)?.appointment_statuses || [],
        syncStatuses: (appointmentEnumsData as any)?.sync_statuses || [],
        recurringTypes: (appointmentEnumsData as any)?.recurring_types || [],
        recurringStatuses: (appointmentEnumsData as any)?.recurring_statuses || [],
        monthlyRecurringTypes: (appointmentEnumsData as any)?.monthly_recurring_types || [],
        editScopes: (appointmentEnumsData as any)?.edit_scopes || [],
        loading: false,
        error: null,
        lastFetch: Date.now()
      });
    } catch (err) {
      console.error('Failed to fetch CRM reference data:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message
      }));
    }
  }, []);

  useEffect(() => {
    // Only fetch reference data when user is authenticated
    // This prevents unnecessary API calls on public pages (e.g., public invoice view)
    if (!authLoading && isAuthenticated) {
      fetchAllReferenceData();
    } else if (!authLoading && !isAuthenticated) {
      // Not authenticated - set loading to false so components don't wait forever
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchAllReferenceData, authLoading, isAuthenticated]);

  // Helper methods for quick lookups
  const helpers = useMemo(() => ({
    // Country helpers
    getCountryByCode: (code: string) => (state.countries as any[]).find(c => c.code === code),
    getCountryById: (id: string) => (state.countries as any[]).find(c => c.id === id),

    // Industry helpers
    getIndustryById: (id: string) => (state.industries as any[]).find(i => i.id === id),
    getIndustryByName: (name: string) => (state.industries as any[]).find(i => i.name === name),

    // Employee range helpers
    getEmployeeRangeById: (id: string) => (state.employeeRanges as any[]).find(e => e.id === id),

    // Number format helpers
    getNumberFormatById: (id: string) => (state.numberFormats as any[]).find(n => n.id === id),

    // Vendor type helpers
    getVendorTypeById: (id: string) => (state.vendorTypes as any[]).find(v => v.id === id),

    // Appointment type helpers (migrated from EnumMetadataContext)
    getTypeLabel: (value: string) => (state.appointmentTypes as any[]).find(t => t.value === value)?.label || value,
    getStatusLabel: (value: string) => (state.appointmentStatuses as any[]).find(s => s.value === value)?.label || value,
    getStatusColor: (value: string) => (state.appointmentStatuses as any[]).find(s => s.value === value)?.color || '#6B7280'
  }), [state]);

  const value: CRMReferenceDataContextValue = {
    ...state,
    ...helpers,
    refresh: fetchAllReferenceData
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
