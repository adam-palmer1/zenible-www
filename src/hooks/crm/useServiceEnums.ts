import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import servicesAPI from '../../services/api/crm/services';
import { queryKeys } from '../../lib/query-keys';
import type { ServiceEnumsResponse } from '../../types/crm';

interface ServiceStatus {
  value: string;
  label: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Hook for fetching service enums (statuses, etc.)
 * Uses React Query for caching and deduplication
 */
export function useServiceEnums() {
  const queryClient = useQueryClient();

  const enumsQuery = useQuery({
    queryKey: queryKeys.serviceEnums.all,
    queryFn: () => servicesAPI.getEnums() as Promise<ServiceEnumsResponse>,
  });

  const serviceStatuses = useMemo(
    () => (enumsQuery.data?.service_statuses || []) as ServiceStatus[],
    [enumsQuery.data]
  );

  const fetchEnums = useCallback(async (force: boolean = false): Promise<ServiceEnumsResponse> => {
    if (force) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.serviceEnums.all });
    }
    return enumsQuery.data || ({ service_statuses: [] } as ServiceEnumsResponse);
  }, [queryClient, enumsQuery.data]);

  // Helper to get status by value
  const getStatusByValue = useCallback((value: string): ServiceStatus | undefined => {
    return serviceStatuses.find((s) => s.value === value);
  }, [serviceStatuses]);

  // Helper to get status label
  const getStatusLabel = useCallback((value: string): string => {
    const status = getStatusByValue(value);
    return status?.label || value;
  }, [getStatusByValue]);

  return {
    serviceStatuses,
    loading: enumsQuery.isLoading,
    error: enumsQuery.error?.message || null,
    fetchEnums,
    getStatusByValue,
    getStatusLabel,
  };
}

export default useServiceEnums;
