import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import planAPI from '../services/planAPI';
import { useAuth } from './AuthContext';
import { queryKeys } from '../lib/query-keys';

interface EntityLimit {
  entity_type: string;
  can_create: boolean;
  is_over: boolean;
  name?: string;
  current?: number;
  limit?: number;
  current_count?: number;
  allowed_limit?: number;
  [key: string]: unknown;
}

interface Feature {
  code: string;
  name?: string;
  enabled: boolean;
  [key: string]: unknown;
}

interface ToolUsage {
  tool_name: string;
  name?: string;
  limit: number | null;
  remaining: number;
  is_enabled?: boolean;
  current_usage?: number;
  monthly_usage_limit?: number;
  [key: string]: unknown;
}

interface AIUsageTotal {
  current?: number;
  limit?: number;
  remaining?: number;
  [key: string]: unknown;
}

interface AICharacterUsage {
  character_name?: string;
  name?: string;
  usage?: number;
  current?: number;
  messages_used?: number;
  limit?: number;
  message_limit?: number;
  [key: string]: unknown;
}

interface AIUsage {
  total?: AIUsageTotal;
  per_character?: AICharacterUsage[];
  [key: string]: unknown;
}

interface DowngradeWarning {
  entity_type: string;
  current_count: number;
  allowed_limit: number;
  [key: string]: unknown;
}

interface UsageData {
  entity_limits?: EntityLimit[];
  features?: Feature[];
  tool_usage?: ToolUsage[];
  downgrade_warnings?: DowngradeWarning[];
  ai_usage?: AIUsage;
  plan_name?: string;
  plan_id?: string;
  usage_resets_at?: string;
  integrations?: Record<string, unknown>;
  [key: string]: unknown;
}

interface UsageDashboardContextValue {
  usageData: UsageData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canCreate: (entityType: string) => boolean;
  getEntityLimit: (entityType: string) => EntityLimit | null | undefined;
  isOverLimit: (entityType: string) => boolean;
  getFeature: (featureCode: string) => Feature | null | undefined;
  isFeatureEnabled: (featureCode: string) => boolean;
  getToolUsage: (toolName: string) => ToolUsage | null | undefined;
  canUseTool: (toolName: string) => boolean;
  hasDowngradeWarnings: boolean;
  downgradeWarnings: DowngradeWarning[];
  aiUsage: AIUsage | null;
  planName: string | null;
  planId: string | null;
  usageResetsAt: string | null;
  integrations: Record<string, unknown>;
}

const UsageDashboardContext = createContext<UsageDashboardContextValue | null>(null);

export function useUsageDashboard(): UsageDashboardContextValue {
  const context = useContext(UsageDashboardContext);
  if (!context) {
    throw new Error('useUsageDashboard must be used within a UsageDashboardProvider');
  }
  return context;
}

// Optional hook that returns null if not in provider (for components that may be outside provider)
export function useUsageDashboardOptional(): UsageDashboardContextValue | null {
  return useContext(UsageDashboardContext);
}

export function UsageDashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const usageQuery = useQuery({
    queryKey: queryKeys.usageDashboard.all,
    queryFn: () => planAPI.getUsageDashboard() as Promise<UsageData>,
    enabled: !!user,
    // Refetch more frequently since usage data changes with user actions
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const usageData = usageQuery.data || null;

  // Refresh function
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.usageDashboard.all });
  }, [queryClient]);

  // Helper functions to check limits
  const canCreate = useCallback((entityType: string) => {
    if (!usageData?.entity_limits) return true;
    const limit = usageData.entity_limits.find(l => l.entity_type === entityType);
    return limit ? limit.can_create : true;
  }, [usageData]);

  const getEntityLimit = useCallback((entityType: string) => {
    if (!usageData?.entity_limits) return null;
    return usageData.entity_limits.find(l => l.entity_type === entityType);
  }, [usageData]);

  const isOverLimit = useCallback((entityType: string) => {
    if (!usageData?.entity_limits) return false;
    const limit = usageData.entity_limits.find(l => l.entity_type === entityType);
    return limit ? limit.is_over : false;
  }, [usageData]);

  const getFeature = useCallback((featureCode: string) => {
    if (!usageData?.features) return null;
    return usageData.features.find(f => f.code === featureCode);
  }, [usageData]);

  const isFeatureEnabled = useCallback((featureCode: string) => {
    const feature = getFeature(featureCode);
    return feature ? feature.enabled : false;
  }, [getFeature]);

  const getToolUsage = useCallback((toolName: string) => {
    if (!usageData?.tool_usage) return null;
    return usageData.tool_usage.find(t => t.tool_name === toolName);
  }, [usageData]);

  const canUseTool = useCallback((toolName: string) => {
    const tool = getToolUsage(toolName);
    if (!tool) return true; // If tool not in list, assume unlimited
    if (tool.limit === null) return true; // Unlimited
    return tool.remaining > 0;
  }, [getToolUsage]);

  const value = useMemo((): UsageDashboardContextValue => ({
    // Data
    usageData,
    loading: usageQuery.isLoading,
    error: usageQuery.error ? (usageQuery.error as Error).message : null,

    // Actions
    refresh,

    // Helpers - Entity Limits
    canCreate,
    getEntityLimit,
    isOverLimit,

    // Helpers - Features
    getFeature,
    isFeatureEnabled,

    // Helpers - Tools
    getToolUsage,
    canUseTool,

    // Helpers - Warnings
    hasDowngradeWarnings: (usageData?.downgrade_warnings?.length ?? 0) > 0,
    downgradeWarnings: usageData?.downgrade_warnings || [],

    // Helpers - AI Usage
    aiUsage: usageData?.ai_usage || null,

    // Helpers - Plan info
    planName: usageData?.plan_name || null,
    planId: usageData?.plan_id || null,
    usageResetsAt: usageData?.usage_resets_at || null,

    // Helpers - Integrations
    integrations: usageData?.integrations || {},
  }), [
    usageData,
    usageQuery.isLoading,
    usageQuery.error,
    refresh,
    canCreate,
    getEntityLimit,
    isOverLimit,
    getFeature,
    isFeatureEnabled,
    getToolUsage,
    canUseTool,
  ]);

  return (
    <UsageDashboardContext.Provider value={value}>
      {children}
    </UsageDashboardContext.Provider>
  );
}

export default UsageDashboardContext;
