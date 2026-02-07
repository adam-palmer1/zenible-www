import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import planAPI from '../services/planAPI';
import { useAuth } from './AuthContext';

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
  const location = useLocation();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageDashboard = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!user) {
      setUsageData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await planAPI.getUsageDashboard() as UsageData;
      setUsageData(data);
    } catch (err) {
      console.error('Failed to fetch usage dashboard:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount, when user changes, and on each page navigation
  useEffect(() => {
    if (user) {
      fetchUsageDashboard();
    } else {
      setUsageData(null);
    }
  }, [user, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh function
  const refresh = useCallback(() => {
    return fetchUsageDashboard();
  }, [fetchUsageDashboard]);

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

  const hasDowngradeWarnings = (usageData?.downgrade_warnings?.length ?? 0) > 0;

  const value: UsageDashboardContextValue = {
    // Data
    usageData,
    loading,
    error,

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
    hasDowngradeWarnings,
    downgradeWarnings: usageData?.downgrade_warnings || [],

    // Helpers - AI Usage
    aiUsage: usageData?.ai_usage || null,

    // Helpers - Plan info
    planName: usageData?.plan_name || null,
    planId: usageData?.plan_id || null,
    usageResetsAt: usageData?.usage_resets_at || null,

    // Helpers - Integrations
    integrations: usageData?.integrations || {},
  };

  return (
    <UsageDashboardContext.Provider value={value}>
      {children}
    </UsageDashboardContext.Provider>
  );
}

export default UsageDashboardContext;
