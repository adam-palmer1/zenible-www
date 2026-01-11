/**
 * @deprecated This context has been replaced by CRMReferenceDataContext
 * Use useCRMReferenceData() instead of useEnumMetadata()
 *
 * This file is kept for backward compatibility during migration.
 * It will be removed in a future version.
 */

import React, { createContext, useContext } from 'react';
import { useCRMReferenceData } from './CRMReferenceDataContext';

const EnumMetadataContext = createContext();

/**
 * @deprecated Use CRMReferenceDataProvider instead
 */
export const EnumMetadataProvider = ({ children }) => {
  console.warn('EnumMetadataProvider is deprecated. It now delegates to CRMReferenceDataProvider. Please update your code to use CRMReferenceDataProvider directly.');

  // Provider no longer does anything - CRMReferenceDataProvider handles it
  return <>{children}</>;
};

/**
 * @deprecated Use useCRMReferenceData() instead
 */
export const useEnumMetadata = () => {
  console.warn('useEnumMetadata() is deprecated. Use useCRMReferenceData() instead.');

  // Delegate to the new context
  const referenceData = useCRMReferenceData();

  // Return the same shape for backward compatibility
  return {
    appointmentTypes: referenceData.appointmentTypes,
    appointmentStatuses: referenceData.appointmentStatuses,
    syncStatuses: referenceData.syncStatuses,
    recurringTypes: referenceData.recurringTypes,
    recurringStatuses: referenceData.recurringStatuses,
    monthlyRecurringTypes: referenceData.monthlyRecurringTypes,
    editScopes: referenceData.editScopes,
    loading: referenceData.loading,
    error: referenceData.error,
    refresh: referenceData.refresh,
    getTypeLabel: referenceData.getTypeLabel,
    getStatusLabel: referenceData.getStatusLabel,
    getStatusColor: referenceData.getStatusColor
  };
};
