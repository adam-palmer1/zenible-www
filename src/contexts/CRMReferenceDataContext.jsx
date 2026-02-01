import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import countriesAPI from '../services/api/crm/countries';
import industriesAPI from '../services/api/crm/industries';
import employeeRangesAPI from '../services/api/crm/employeeRanges';
import vendorTypesAPI from '../services/api/crm/vendorTypes';
import numberFormatsAPI from '../services/api/crm/numberFormats';
import appointmentEnumsAPI from '../services/api/crm/appointmentEnums';

const CRMReferenceDataContext = createContext();

export const CRMReferenceDataProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // State for all reference data
  const [state, setState] = useState({
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
        countries: countriesData || [],
        companyEnabledCountries: companyCountriesData || [],
        industries: industriesData || [],
        employeeRanges: employeeRangesData || [],
        vendorTypes: vendorTypesData || [],
        numberFormats: numberFormatsData || [],
        appointmentTypes: appointmentEnumsData?.appointment_types || [],
        appointmentStatuses: appointmentEnumsData?.appointment_statuses || [],
        syncStatuses: appointmentEnumsData?.sync_statuses || [],
        recurringTypes: appointmentEnumsData?.recurring_types || [],
        recurringStatuses: appointmentEnumsData?.recurring_statuses || [],
        monthlyRecurringTypes: appointmentEnumsData?.monthly_recurring_types || [],
        editScopes: appointmentEnumsData?.edit_scopes || [],
        loading: false,
        error: null,
        lastFetch: Date.now()
      });
    } catch (err) {
      console.error('Failed to fetch CRM reference data:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message
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
    getCountryByCode: (code) => state.countries.find(c => c.code === code),
    getCountryById: (id) => state.countries.find(c => c.id === id),

    // Industry helpers
    getIndustryById: (id) => state.industries.find(i => i.id === id),
    getIndustryByName: (name) => state.industries.find(i => i.name === name),

    // Employee range helpers
    getEmployeeRangeById: (id) => state.employeeRanges.find(e => e.id === id),

    // Number format helpers
    getNumberFormatById: (id) => state.numberFormats.find(n => n.id === id),

    // Vendor type helpers
    getVendorTypeById: (id) => state.vendorTypes.find(v => v.id === id),

    // Appointment type helpers (migrated from EnumMetadataContext)
    getTypeLabel: (value) => state.appointmentTypes.find(t => t.value === value)?.label || value,
    getStatusLabel: (value) => state.appointmentStatuses.find(s => s.value === value)?.label || value,
    getStatusColor: (value) => state.appointmentStatuses.find(s => s.value === value)?.color || '#6B7280'
  }), [state]);

  const value = {
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
