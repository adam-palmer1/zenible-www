import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import planAPI from '../services/planAPI';
import { useAuth } from './AuthContext';

const UsageDashboardContext = createContext(null);

export function useUsageDashboard() {
  const context = useContext(UsageDashboardContext);
  if (!context) {
    throw new Error('useUsageDashboard must be used within a UsageDashboardProvider');
  }
  return context;
}

// Optional hook that returns null if not in provider (for components that may be outside provider)
export function useUsageDashboardOptional() {
  return useContext(UsageDashboardContext);
}

export function UsageDashboardProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsageDashboard = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!user) {
      setUsageData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await planAPI.getUsageDashboard();
      setUsageData(data);
    } catch (err) {
      console.error('Failed to fetch usage dashboard:', err);
      setError(err.message);
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
  const canCreate = useCallback((entityType) => {
    if (!usageData?.entity_limits) return true;
    const limit = usageData.entity_limits.find(l => l.entity_type === entityType);
    return limit ? limit.can_create : true;
  }, [usageData]);

  const getEntityLimit = useCallback((entityType) => {
    if (!usageData?.entity_limits) return null;
    return usageData.entity_limits.find(l => l.entity_type === entityType);
  }, [usageData]);

  const isOverLimit = useCallback((entityType) => {
    if (!usageData?.entity_limits) return false;
    const limit = usageData.entity_limits.find(l => l.entity_type === entityType);
    return limit ? limit.is_over : false;
  }, [usageData]);

  const getFeature = useCallback((featureCode) => {
    if (!usageData?.features) return null;
    return usageData.features.find(f => f.code === featureCode);
  }, [usageData]);

  const isFeatureEnabled = useCallback((featureCode) => {
    const feature = getFeature(featureCode);
    return feature ? feature.enabled : false;
  }, [getFeature]);

  const getToolUsage = useCallback((toolName) => {
    if (!usageData?.tool_usage) return null;
    return usageData.tool_usage.find(t => t.tool_name === toolName);
  }, [usageData]);

  const canUseTool = useCallback((toolName) => {
    const tool = getToolUsage(toolName);
    if (!tool) return true; // If tool not in list, assume unlimited
    if (tool.limit === null) return true; // Unlimited
    return tool.remaining > 0;
  }, [getToolUsage]);

  const hasDowngradeWarnings = usageData?.downgrade_warnings?.length > 0;

  const value = {
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
