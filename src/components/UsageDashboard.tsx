import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';
import { useUsageDashboard } from '../contexts/UsageDashboardContext';
import { LoadingSpinner } from './shared';

interface UsageProgressBarProps {
  current: number;
  limit: number;
  darkMode: boolean;
  showPercentage?: boolean;
}

interface FeatureBadgeProps {
  enabled: boolean;
  darkMode: boolean;
}

// Progress bar component for usage limits
function UsageProgressBar({ current, limit, darkMode, showPercentage = true }: UsageProgressBarProps) {
  // Safely handle null/undefined values
  const safeCurrentValue = current ?? 0;
  const safeLimitValue = limit ?? -1;
  const isUnlimited = safeLimitValue === -1 || safeLimitValue === null;
  const percentage = isUnlimited || safeLimitValue === 0 ? 0 : Math.min((safeCurrentValue / safeLimitValue) * 100, 100);
  const isOver = !isUnlimited && safeCurrentValue > safeLimitValue;
  const isNearLimit = !isUnlimited && percentage >= 75 && percentage < 100;

  const getBarColor = () => {
    if (isOver) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full">
      <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-200'}`}>
        {!isUnlimited && (
          <div
            className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        )}
      </div>
      {showPercentage && !isUnlimited && (
        <div className={`text-xs mt-1 ${
          isOver
            ? 'text-red-500'
            : isNearLimit
              ? darkMode ? 'text-yellow-400' : 'text-yellow-600'
              : darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
        }`}>
          {Number(safeCurrentValue).toLocaleString()} / {Number(safeLimitValue).toLocaleString()} ({Math.round(percentage)}%)
        </div>
      )}
      {isUnlimited && (
        <div className={`text-xs mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
          Unlimited
        </div>
      )}
    </div>
  );
}

// Feature status badge
function FeatureBadge({ enabled, darkMode }: FeatureBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      enabled
        ? darkMode
          ? 'bg-green-900/30 text-green-400'
          : 'bg-green-100 text-green-800'
        : darkMode
          ? 'bg-gray-700 text-gray-400'
          : 'bg-gray-100 text-gray-500'
    }`}>
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  );
}

export default function UsageDashboard() {
  const { darkMode } = usePreferences();
  const navigate = useNavigate();
  const { usageData, loading, error, refresh } = useUsageDashboard();
  const [expandedSections, setExpandedSections] = useState({
    features: true,
    limits: true,
    aiUsage: true,
    integrations: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className={`rounded-xl border p-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <LoadingSpinner size="h-8 w-8" height="py-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border p-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`text-center py-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          <p className="mb-2">Failed to load usage data</p>
          <button
            onClick={refresh}
            className="text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return null;
  }

  const {
    plan_name,
    features = [],
    entity_limits = [],
    ai_usage = {},
    tool_usage = [],
    integrations = {},
    downgrade_warnings = []
  } = usageData;

  // Format feature name for display
  const formatFeatureName = (key: string) => {
    if (!key) return 'Unknown';
    return String(key)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Downgrade Warnings */}
      {downgrade_warnings && downgrade_warnings.length > 0 && (
        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                Action Required
              </h4>
              <ul className="space-y-2">
                {downgrade_warnings.map((warning, index) => {
                  // Try to get the display name from entity_limits
                  const entityLimit = entity_limits.find(e => e.entity_type === warning.entity_type);
                  const displayName = entityLimit?.name || formatFeatureName(warning.entity_type);
                  return (
                    <li key={index} className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      <strong>{displayName}:</strong> You have {warning.current_count} but your plan allows {warning.allowed_limit}.
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => navigate('/pricing')}
                className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
                  darkMode
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan & Usage Overview */}
      <div className={`rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Plan Usage & Limits
              </h3>
              {usageData.usage_resets_at && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Your usage will reset on: {new Date(usageData.usage_resets_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
            {plan_name && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                darkMode ? 'bg-zenible-primary/20 text-zenible-primary' : 'bg-purple-100 text-purple-800'
              }`}>
                {plan_name}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Entity Limits Section */}
          {entity_limits && entity_limits.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('limits')}
                className={`flex items-center justify-between w-full text-left mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'}`}
              >
                <h4 className="font-medium">Resource Limits</h4>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSections.limits ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSections.limits && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entity_limits.map((limit, index) => (
                    <div
                      key={limit.entity_type || index}
                      className={`p-4 rounded-lg ${
                        limit.is_over
                          ? darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                          : darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                          {limit.name || formatFeatureName(limit.entity_type)}
                        </span>
                        {limit.is_over && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
                          }`}>
                            Over limit
                          </span>
                        )}
                        {!limit.is_over && limit.can_create === false && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            At limit
                          </span>
                        )}
                      </div>
                      <UsageProgressBar
                        current={limit.current ?? 0}
                        limit={limit.limit ?? -1}
                        darkMode={darkMode}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Usage Section */}
          {ai_usage && (ai_usage.total || ai_usage.per_character) && (
            <div>
              <button
                onClick={() => toggleSection('aiUsage')}
                className={`flex items-center justify-between w-full text-left mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'}`}
              >
                <h4 className="font-medium">AI Usage</h4>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSections.aiUsage ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSections.aiUsage && (
                <div className="space-y-4">
                  {/* Total AI Messages */}
                  {ai_usage.total && (
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                          Total AI Messages (Monthly)
                        </span>
                        {ai_usage.total.remaining != null && ai_usage.total.limit !== -1 && ai_usage.total.limit != null && (
                          <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            {Number(ai_usage.total.remaining).toLocaleString()} remaining
                          </span>
                        )}
                      </div>
                      <UsageProgressBar
                        current={ai_usage.total.current ?? 0}
                        limit={ai_usage.total.limit ?? -1}
                        darkMode={darkMode}
                      />
                    </div>
                  )}

                  {/* Per-Character Usage */}
                  {ai_usage.per_character && ai_usage.per_character.length > 0 && (
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <h5 className={`text-sm font-medium mb-3 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                        Per Character
                      </h5>
                      <div className="space-y-3">
                        {ai_usage.per_character.map((char, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                                {char.character_name || char.name || `Character ${index + 1}`}
                              </span>
                            </div>
                            <UsageProgressBar
                              current={char.usage ?? char.current ?? char.messages_used ?? 0}
                              limit={char.limit ?? char.message_limit ?? -1}
                              darkMode={darkMode}
                              showPercentage={true}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tool Usage Section */}
          {tool_usage && tool_usage.length > 0 && (
            <div>
              <h4 className={`font-medium mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'}`}>
                Tool Usage
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tool_usage.map((tool, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                        {formatFeatureName(tool.tool_name || tool.name || '')}
                      </span>
                      <FeatureBadge enabled={tool.is_enabled ?? false} darkMode={darkMode} />
                    </div>
                    {tool.is_enabled && tool.monthly_usage_limit && (
                      <UsageProgressBar
                        current={tool.current_usage || 0}
                        limit={tool.monthly_usage_limit}
                        darkMode={darkMode}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Section */}
          {features && Array.isArray(features) && features.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('features')}
                className={`flex items-center justify-between w-full text-left mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'}`}
              >
                <h4 className="font-medium">Plan Features</h4>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSections.features ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSections.features && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((feature) => (
                    <div
                      key={feature.code}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                        {feature.name || formatFeatureName(feature.code)}
                      </span>
                      {feature.enabled ? (
                        <svg className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Integrations Section */}
          {integrations && Object.keys(integrations).length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('integrations')}
                className={`flex items-center justify-between w-full text-left mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'}`}
              >
                <h4 className="font-medium">Integrations</h4>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSections.integrations ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSections.integrations && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(integrations).filter(([, integration]) => integration != null).map(([key, integration]: [string, any]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                          {formatFeatureName(key)}
                        </span>
                        <FeatureBadge enabled={integration.feature_enabled} darkMode={darkMode} />
                      </div>
                      {integration.feature_enabled && (
                        <div className="space-y-1">
                          {integration.has_connection !== undefined && (
                            <div className={`text-xs flex items-center gap-1 ${
                              integration.has_connection
                                ? darkMode ? 'text-green-400' : 'text-green-600'
                                : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                integration.has_connection ? 'bg-green-500' : 'bg-gray-400'
                              }`}></span>
                              {integration.has_connection ? 'Connected' : 'Not connected'}
                            </div>
                          )}
                          {integration.stripe_connected !== undefined && (
                            <div className={`text-xs flex items-center gap-1 ${
                              integration.stripe_connected
                                ? darkMode ? 'text-green-400' : 'text-green-600'
                                : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                integration.stripe_connected ? 'bg-green-500' : 'bg-gray-400'
                              }`}></span>
                              Stripe: {integration.stripe_connected ? 'Connected' : 'Not connected'}
                            </div>
                          )}
                          {integration.paypal_connected !== undefined && (
                            <div className={`text-xs flex items-center gap-1 ${
                              integration.paypal_connected
                                ? darkMode ? 'text-green-400' : 'text-green-600'
                                : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                integration.paypal_connected ? 'bg-green-500' : 'bg-gray-400'
                              }`}></span>
                              PayPal: {integration.paypal_connected ? 'Connected' : 'Not connected'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
