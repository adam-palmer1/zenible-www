/**
 * Custom Reports Context
 * Provides state management for the Custom Reports tab
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { queryKeys } from '@/lib/query-keys';
import { useCustomReportBuilder } from '@/hooks/finance/useCustomReportBuilder';
import customReportsAPI from '@/services/api/finance/customReports';
import type {
  AvailableColumnsResponse,
  CustomReportCreate,
  CustomReportListItem,
  CustomReportResponse,
  CustomReportUpdate,
  ReportConfiguration,
  ReportExecutionResponse,
} from '@/types/customReport';

export type CustomReportsMode = 'list' | 'build' | 'results';

interface CustomReportsContextValue {
  // Available columns metadata
  availableColumns: AvailableColumnsResponse | undefined;
  columnsLoading: boolean;

  // Saved reports list
  savedReports: CustomReportListItem[];
  savedReportsTotal: number;
  savedReportsLoading: boolean;
  savedReportsPage: number;
  setSavedReportsPage: (page: number) => void;

  // Builder configuration
  configuration: ReportConfiguration;
  addEntity: ReturnType<typeof useCustomReportBuilder>['addEntity'];
  removeEntity: ReturnType<typeof useCustomReportBuilder>['removeEntity'];
  setEntityColumns: ReturnType<typeof useCustomReportBuilder>['setEntityColumns'];
  setEntityStatusFilters: ReturnType<typeof useCustomReportBuilder>['setEntityStatusFilters'];
  setEntityExtraFilters: ReturnType<typeof useCustomReportBuilder>['setEntityExtraFilters'];
  setDateRange: ReturnType<typeof useCustomReportBuilder>['setDateRange'];
  setContactFilter: ReturnType<typeof useCustomReportBuilder>['setContactFilter'];
  setSort: ReturnType<typeof useCustomReportBuilder>['setSort'];
  loadConfig: ReturnType<typeof useCustomReportBuilder>['loadConfig'];
  resetConfiguration: ReturnType<typeof useCustomReportBuilder>['resetConfig'];

  // Execution
  executionResult: ReportExecutionResponse | null;
  executionLoading: boolean;
  executionError: string | null;

  // View state
  mode: CustomReportsMode;
  setMode: (mode: CustomReportsMode) => void;
  activeReportId: string | null;
  activeReportName: string | null;

  // Operations
  executeReport: (page?: number) => Promise<void>;
  executeSavedReport: (id: string, page?: number) => Promise<void>;
  saveReport: (data: CustomReportCreate) => Promise<CustomReportResponse>;
  updateReport: (id: string, data: CustomReportUpdate) => Promise<CustomReportResponse>;
  deleteReport: (id: string) => Promise<void>;
  cloneReport: (id: string, name?: string) => Promise<CustomReportResponse>;
  exportReport: (format: 'csv' | 'pdf', savedReportId?: string) => Promise<boolean>;
  loadSavedReport: (report: CustomReportResponse) => void;
  startNewReport: () => void;
}

const CustomReportsContext = createContext<CustomReportsContextValue | null>(null);

export const CustomReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const builder = useCustomReportBuilder();

  const [mode, setMode] = useState<CustomReportsMode>('list');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeReportName, setActiveReportName] = useState<string | null>(null);
  const [savedReportsPage, setSavedReportsPage] = useState(1);
  const [executionResult, setExecutionResult] = useState<ReportExecutionResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // --- Queries ---

  const columnsQuery = useQuery({
    queryKey: queryKeys.customReports.columns(),
    queryFn: () => customReportsAPI.getAvailableColumns(),
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const savedReportsQuery = useQuery({
    queryKey: queryKeys.customReports.list(savedReportsPage),
    queryFn: () => customReportsAPI.listReports(savedReportsPage),
    enabled: !!user,
  });

  // --- Mutations ---

  const executeMutation = useMutation({
    mutationFn: ({ config, page }: { config: ReportConfiguration; page: number }) =>
      customReportsAPI.executeReport(config, page),
    onSuccess: (data) => {
      setExecutionResult(data);
      setExecutionError(null);
      setMode('results');
    },
    onError: (error: Error) => {
      setExecutionError(error.message);
    },
  });

  const executeSavedMutation = useMutation({
    mutationFn: ({ id, page }: { id: string; page: number }) =>
      customReportsAPI.executeSavedReport(id, page),
    onSuccess: (data) => {
      setExecutionResult(data);
      setExecutionError(null);
      setMode('results');
    },
    onError: (error: Error) => {
      setExecutionError(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomReportCreate) => customReportsAPI.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customReports.list() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomReportUpdate }) =>
      customReportsAPI.updateReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customReports.list() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customReportsAPI.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customReports.list() });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      customReportsAPI.cloneReport(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customReports.list() });
    },
  });

  // --- Operations ---

  const executeReport = useCallback(
    async (page = 1) => {
      setExecutionError(null);
      await executeMutation.mutateAsync({ config: builder.configuration, page });
    },
    [builder.configuration, executeMutation]
  );

  const executeSavedReport = useCallback(
    async (id: string, page = 1) => {
      setActiveReportId(id);
      setExecutionError(null);
      // Fetch full report so configuration is available for editing
      const report = await customReportsAPI.getReport(id);
      builder.loadConfig(report.configuration);
      setActiveReportName(report.name);
      await executeSavedMutation.mutateAsync({ id, page });
    },
    [executeSavedMutation, builder]
  );

  const saveReport = useCallback(
    async (data: CustomReportCreate) => {
      const result = await createMutation.mutateAsync(data);
      setActiveReportId(result.id);
      setActiveReportName(result.name);
      return result;
    },
    [createMutation]
  );

  const updateReport = useCallback(
    async (id: string, data: CustomReportUpdate) => {
      const result = await updateMutation.mutateAsync({ id, data });
      if (id === activeReportId && data.name) {
        setActiveReportName(data.name);
      }
      return result;
    },
    [updateMutation, activeReportId]
  );

  const deleteReport = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
      if (id === activeReportId) {
        setActiveReportId(null);
        setActiveReportName(null);
        setMode('list');
      }
    },
    [deleteMutation, activeReportId]
  );

  const cloneReport = useCallback(
    async (id: string, name?: string) => {
      return cloneMutation.mutateAsync({ id, name });
    },
    [cloneMutation]
  );

  const exportReport = useCallback(
    async (format: 'csv' | 'pdf', savedReportId?: string) => {
      try {
        let blob: Blob;

        if (savedReportId) {
          blob =
            format === 'csv'
              ? await customReportsAPI.exportSavedCSV(savedReportId)
              : await customReportsAPI.exportSavedPDF(savedReportId);
        } else {
          blob =
            format === 'csv'
              ? await customReportsAPI.exportCSV(builder.configuration)
              : await customReportsAPI.exportPDF(builder.configuration);
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `custom-report.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
      } catch {
        return false;
      }
    },
    [builder.configuration]
  );

  const loadSavedReport = useCallback(
    (report: CustomReportResponse) => {
      builder.loadConfig(report.configuration);
      setActiveReportId(report.id);
      setActiveReportName(report.name);
      setMode('build');
    },
    [builder]
  );

  const startNewReport = useCallback(() => {
    builder.resetConfig();
    setActiveReportId(null);
    setActiveReportName(null);
    setExecutionResult(null);
    setExecutionError(null);
    setMode('build');
  }, [builder]);

  // --- Value ---

  const value = useMemo(
    (): CustomReportsContextValue => ({
      availableColumns: columnsQuery.data,
      columnsLoading: columnsQuery.isLoading,

      savedReports: savedReportsQuery.data?.items || [],
      savedReportsTotal: savedReportsQuery.data?.total || 0,
      savedReportsLoading: savedReportsQuery.isLoading,
      savedReportsPage,
      setSavedReportsPage,

      configuration: builder.configuration,
      addEntity: builder.addEntity,
      removeEntity: builder.removeEntity,
      setEntityColumns: builder.setEntityColumns,
      setEntityStatusFilters: builder.setEntityStatusFilters,
      setEntityExtraFilters: builder.setEntityExtraFilters,
      setDateRange: builder.setDateRange,
      setContactFilter: builder.setContactFilter,
      setSort: builder.setSort,
      loadConfig: builder.loadConfig,
      resetConfiguration: builder.resetConfig,

      executionResult,
      executionLoading: executeMutation.isPending || executeSavedMutation.isPending,
      executionError,

      mode,
      setMode,
      activeReportId,
      activeReportName,

      executeReport,
      executeSavedReport,
      saveReport,
      updateReport,
      deleteReport,
      cloneReport,
      exportReport,
      loadSavedReport,
      startNewReport,
    }),
    [
      columnsQuery.data,
      columnsQuery.isLoading,
      savedReportsQuery.data,
      savedReportsQuery.isLoading,
      savedReportsPage,
      builder,
      executionResult,
      executeMutation.isPending,
      executeSavedMutation.isPending,
      executionError,
      mode,
      activeReportId,
      activeReportName,
      executeReport,
      executeSavedReport,
      saveReport,
      updateReport,
      deleteReport,
      cloneReport,
      exportReport,
      loadSavedReport,
      startNewReport,
    ]
  );

  return (
    <CustomReportsContext.Provider value={value}>{children}</CustomReportsContext.Provider>
  );
};

export const useCustomReports = (): CustomReportsContextValue => {
  const context = useContext(CustomReportsContext);
  if (!context) {
    throw new Error('useCustomReports must be used within a CustomReportsProvider');
  }
  return context;
};
