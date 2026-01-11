import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for fetching and caching reference data
 * Can be used for industries, employee ranges, vendor types, number formats, etc.
 *
 * @param {Object} api - API service instance with list() method
 * @param {string} dataKey - Key name for the data (for error messages)
 */
export const useReferenceData = (api, dataKey = 'data') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.list();
      setData(result);
    } catch (err) {
      setError(err.message || `Failed to load ${dataKey}`);
      console.error(`Failed to fetch ${dataKey}:`, err);
    } finally {
      setLoading(false);
    }
  }, [api, dataKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};

// Convenience hooks for specific reference data types
import industriesAPI from '../../services/api/crm/industries';
import employeeRangesAPI from '../../services/api/crm/employeeRanges';
import vendorTypesAPI from '../../services/api/crm/vendorTypes';
import numberFormatsAPI from '../../services/api/crm/numberFormats';

export const useIndustries = () => {
  return useReferenceData(industriesAPI, 'industries');
};

export const useEmployeeRanges = () => {
  return useReferenceData(employeeRangesAPI, 'employee ranges');
};

export const useVendorTypes = () => {
  return useReferenceData(vendorTypesAPI, 'vendor types');
};

export const useNumberFormats = () => {
  return useReferenceData(numberFormatsAPI, 'number formats');
};
