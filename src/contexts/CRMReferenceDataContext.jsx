import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import countriesAPI from '../services/api/crm/countries';
import currenciesAPI from '../services/api/crm/currencies';
import industriesAPI from '../services/api/crm/industries';
import employeeRangesAPI from '../services/api/crm/employeeRanges';
import vendorTypesAPI from '../services/api/crm/vendorTypes';
import numberFormatsAPI from '../services/api/crm/numberFormats';
import appointmentEnumsAPI from '../services/api/crm/appointmentEnums';

const CRMReferenceDataContext = createContext();

export const CRMReferenceDataProvider = ({ children }) => {
  // State for all reference data
  const [state, setState] = useState({
    // Static reference data
    countries: [],
    companyEnabledCountries: [],
    currencies: [],
    companyEnabledCurrencies: [],
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
        currenciesData,
        companyCurrenciesData,
        industriesData,
        employeeRangesData,
        vendorTypesData,
        numberFormatsData,
        appointmentEnumsData
      ] = await Promise.all([
        countriesAPI.list().catch(() => []),
        countriesAPI.getCompanyCountries().catch(() => []),
        currenciesAPI.list().catch(() => []),
        currenciesAPI.getCompanyCurrencies().catch(() => []),
        industriesAPI.list().catch(() => []),
        employeeRangesAPI.list().catch(() => []),
        vendorTypesAPI.list().catch(() => []),
        numberFormatsAPI.list().catch(() => []),
        appointmentEnumsAPI.getEnums().catch(() => ({}))
      ]);

      setState({
        countries: countriesData || [],
        companyEnabledCountries: companyCountriesData || [],
        currencies: currenciesData || [],
        companyEnabledCurrencies: companyCurrenciesData || [],
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
    fetchAllReferenceData();
  }, [fetchAllReferenceData]);

  // Helper methods for quick lookups
  const helpers = useMemo(() => ({
    // Country helpers
    getCountryByCode: (code) => state.countries.find(c => c.code === code),
    getCountryById: (id) => state.countries.find(c => c.id === id),

    // Currency helpers
    getCurrencyByCode: (code) => state.currencies.find(c => c.code === code),
    getCurrencyById: (id) => state.currencies.find(c => c.id === id),

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
