/**
 * Custom Report Builder Reducer Hook
 * Manages ReportConfiguration state for the builder form
 */

import { useReducer, useCallback } from 'react';
import type {
  ReportConfiguration,
  ReportEntityType,
  EntitySelectionConfig,
  DateRangeConfig,
  ContactFilterConfig,
  ReportSortDirection,
  EntityExtraFilters,
} from '@/types/customReport';

// --- Actions ---

type BuilderAction =
  | { type: 'ADD_ENTITY'; payload: EntitySelectionConfig }
  | { type: 'REMOVE_ENTITY'; payload: ReportEntityType }
  | { type: 'SET_ENTITY_COLUMNS'; payload: { entityType: ReportEntityType; columns: string[] } }
  | { type: 'SET_ENTITY_STATUS_FILTERS'; payload: { entityType: ReportEntityType; statuses: string[] } }
  | { type: 'SET_ENTITY_EXTRA_FILTERS'; payload: { entityType: ReportEntityType; filters: EntityExtraFilters } }
  | { type: 'SET_DATE_RANGE'; payload: DateRangeConfig | undefined }
  | { type: 'SET_CONTACT_FILTER'; payload: ContactFilterConfig | undefined }
  | { type: 'SET_SORT'; payload: { sortBy?: string; sortDirection?: ReportSortDirection } }
  | { type: 'LOAD_CONFIG'; payload: ReportConfiguration }
  | { type: 'RESET' };

const initialState: ReportConfiguration = {
  entity_selections: [],
};

function builderReducer(state: ReportConfiguration, action: BuilderAction): ReportConfiguration {
  switch (action.type) {
    case 'ADD_ENTITY': {
      const exists = state.entity_selections.some(
        (s) => s.entity_type === action.payload.entity_type
      );
      if (exists) return state;
      return {
        ...state,
        entity_selections: [...state.entity_selections, action.payload],
      };
    }

    case 'REMOVE_ENTITY':
      return {
        ...state,
        entity_selections: state.entity_selections.filter(
          (s) => s.entity_type !== action.payload
        ),
      };

    case 'SET_ENTITY_COLUMNS':
      return {
        ...state,
        entity_selections: state.entity_selections.map((s) =>
          s.entity_type === action.payload.entityType
            ? { ...s, columns: action.payload.columns }
            : s
        ),
      };

    case 'SET_ENTITY_STATUS_FILTERS':
      return {
        ...state,
        entity_selections: state.entity_selections.map((s) =>
          s.entity_type === action.payload.entityType
            ? { ...s, status_filters: action.payload.statuses }
            : s
        ),
      };

    case 'SET_ENTITY_EXTRA_FILTERS':
      return {
        ...state,
        entity_selections: state.entity_selections.map((s) =>
          s.entity_type === action.payload.entityType
            ? { ...s, extra_filters: action.payload.filters }
            : s
        ),
      };

    case 'SET_DATE_RANGE':
      return { ...state, date_range: action.payload };

    case 'SET_CONTACT_FILTER':
      return { ...state, contact_filter: action.payload };

    case 'SET_SORT':
      return {
        ...state,
        sort_by: action.payload.sortBy,
        sort_direction: action.payload.sortDirection,
      };

    case 'LOAD_CONFIG':
      return { ...action.payload };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function useCustomReportBuilder() {
  const [configuration, dispatch] = useReducer(builderReducer, initialState);

  const addEntity = useCallback((config: EntitySelectionConfig) => {
    dispatch({ type: 'ADD_ENTITY', payload: config });
  }, []);

  const removeEntity = useCallback((entityType: ReportEntityType) => {
    dispatch({ type: 'REMOVE_ENTITY', payload: entityType });
  }, []);

  const setEntityColumns = useCallback(
    (entityType: ReportEntityType, columns: string[]) => {
      dispatch({ type: 'SET_ENTITY_COLUMNS', payload: { entityType, columns } });
    },
    []
  );

  const setEntityStatusFilters = useCallback(
    (entityType: ReportEntityType, statuses: string[]) => {
      dispatch({ type: 'SET_ENTITY_STATUS_FILTERS', payload: { entityType, statuses } });
    },
    []
  );

  const setEntityExtraFilters = useCallback(
    (entityType: ReportEntityType, filters: EntityExtraFilters) => {
      dispatch({ type: 'SET_ENTITY_EXTRA_FILTERS', payload: { entityType, filters } });
    },
    []
  );

  const setDateRange = useCallback((dateRange: DateRangeConfig | undefined) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: dateRange });
  }, []);

  const setContactFilter = useCallback((contactFilter: ContactFilterConfig | undefined) => {
    dispatch({ type: 'SET_CONTACT_FILTER', payload: contactFilter });
  }, []);

  const setSort = useCallback((sortBy?: string, sortDirection?: ReportSortDirection) => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortDirection } });
  }, []);

  const loadConfig = useCallback((config: ReportConfiguration) => {
    dispatch({ type: 'LOAD_CONFIG', payload: config });
  }, []);

  const resetConfig = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    configuration,
    addEntity,
    removeEntity,
    setEntityColumns,
    setEntityStatusFilters,
    setEntityExtraFilters,
    setDateRange,
    setContactFilter,
    setSort,
    loadConfig,
    resetConfig,
  };
}
