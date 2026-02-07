import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import planAPI from '../../services/planAPI';

interface PlanFeatureAssignmentProps {
  darkMode: boolean;
}

export default function PlanFeatureAssignment({ darkMode }: PlanFeatureAssignmentProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planFeatures, setPlanFeatures] = useState<any>(null);
  const [allDisplayFeatures, setAllDisplayFeatures] = useState<any[]>([]);
  const [allSystemFeatures, setAllSystemFeatures] = useState<any[]>([]);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('display');
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  // Local state for editing
  const [displayFeatureAssignments, setDisplayFeatureAssignments] = useState<any[]>([]);
  const [systemFeatureAssignments, setSystemFeatureAssignments] = useState<any[]>([]);
  const [characterAccessAssignments, setCharacterAccessAssignments] = useState<any[]>([]);
  const [toolAccessAssignments, setToolAccessAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Only fetch plan features after initial data is loaded (check if at least characters are loaded)
    if (selectedPlanId && (allCharacters.length > 0 || allDisplayFeatures.length > 0 || allSystemFeatures.length > 0)) {
      fetchPlanFeatures(selectedPlanId);
    }
  }, [selectedPlanId, allCharacters.length, allDisplayFeatures.length, allSystemFeatures.length]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansResponse, displayResponse, systemResponse, charactersResponse] = await Promise.all([
        (adminAPI as any).getPlans(),
        (adminAPI as any).getDisplayFeatures(),
        (adminAPI as any).getSystemFeatures(),
        (planAPI as any).getPublicCharacters({ per_page: 100 }), // Use public endpoint which is now available
      ]);

      setPlans(plansResponse.plans || []);
      setAllDisplayFeatures(displayResponse.features || []);
      setAllSystemFeatures(systemResponse.features || []);
      setAllCharacters(charactersResponse.characters || []); // Use 'characters' for public API response

      // Select first plan by default if available
      if (plansResponse.plans && plansResponse.plans.length > 0) {
        setSelectedPlanId(plansResponse.plans[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanFeatures = async (planId: string) => {
    setLoading(true);
    try {
      const response = await (adminAPI as any).getPlanFeatures(planId);
      setPlanFeatures(response);

      // Initialize display feature assignments with three-state support
      const displayAssignments = allDisplayFeatures.map((feature: any) => {
        const existing = response.display_features?.find((df: any) => df.feature.id === feature.id);
        return {
          feature_id: feature.id,
          feature_name: feature.name,
          feature_state: existing ? (existing.is_included ? 'included' : 'excluded') : 'not_shown',
          custom_value: existing ? existing.custom_value : '',
        };
      });
      setDisplayFeatureAssignments(displayAssignments);

      // Initialize system feature assignments
      const systemAssignments = allSystemFeatures.map((feature: any) => {
        const existing = response.system_features?.find((sf: any) => sf.feature.id === feature.id);
        // Normalize feature type to uppercase for consistency
        const normalizedType = feature.feature_type?.toUpperCase() || 'BOOLEAN';

        const assignment: any = {
          feature_id: feature.id,
          feature_name: feature.name,
          feature_type: normalizedType,
          feature_code: feature.code,
        };

        if (normalizedType === 'BOOLEAN') {
          assignment.is_enabled = existing ? existing.is_enabled : false;
        } else if (normalizedType === 'LIMIT') {
          assignment.limit_value = existing ? existing.limit_value : 0;
        } else if (normalizedType === 'LIST') {
          assignment.allowed_values = existing ? existing.allowed_values : [];
        }

        return assignment;
      });
      setSystemFeatureAssignments(systemAssignments);

      // Initialize character access assignments
      const characterAssignments = allCharacters.map((character: any) => {
        const existing = response.character_access?.find((ca: any) => ca.character_id === character.id);
        return {
          character_id: character.id,
          character_name: character.name,
          is_accessible: existing ? existing.is_accessible : false,
          daily_message_limit: existing ? existing.daily_message_limit : null,
          daily_token_limit: existing ? existing.daily_token_limit : null,
          monthly_message_limit: existing ? existing.monthly_message_limit : null,
          monthly_token_limit: existing ? existing.monthly_token_limit : null,
          rate_limit_per_minute: existing ? existing.rate_limit_per_minute : 10,
          priority: existing ? existing.priority : 1,
        };
      });
      setCharacterAccessAssignments(characterAssignments);

      // Fetch tool access for this plan
      try {
        const toolAccessResponse = await (adminAPI as any).getPlanToolAccess(planId);
        // Response is an array directly with all tool data
        const toolAssignments = (Array.isArray(toolAccessResponse) ? toolAccessResponse : []).map((tool: any) => ({
          tool_name: tool.tool_name,
          tool_description: tool.tool_description,
          is_enabled: tool.is_enabled ?? false,
          monthly_usage_limit: tool.monthly_usage_limit,
        }));
        setToolAccessAssignments(toolAssignments);
      } catch {
        // If tool access endpoint fails, set empty
        setToolAccessAssignments([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplayFeatures = async () => {
    setSaving(true);
    try {
      // Only send features that are included or excluded (not 'not_shown')
      const features = displayFeatureAssignments
        .filter((assignment: any) => assignment.feature_state !== 'not_shown')
        .map(({ feature_id, feature_state, custom_value }: any) => ({
          feature_id,
          is_included: feature_state === 'included',
          custom_value: custom_value || null,
        }));
      await (adminAPI as any).updatePlanDisplayFeatures(selectedPlanId, features);
      setSuccessModal({ isOpen: true, message: 'Display features updated successfully!' });
      fetchPlanFeatures(selectedPlanId!);
    } catch (err: any) {
      alert(`Error saving display features: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemFeatures = async () => {
    setSaving(true);
    try {
      const features = systemFeatureAssignments.map((assignment: any) => {
        const feature: any = { feature_id: assignment.feature_id };
        // Use normalized uppercase type for consistency
        const normalizedType = assignment.feature_type?.toUpperCase() || 'BOOLEAN';

        if (normalizedType === 'BOOLEAN') {
          feature.is_enabled = assignment.is_enabled;
        } else if (normalizedType === 'LIMIT') {
          feature.limit_value = assignment.limit_value;
        } else if (normalizedType === 'LIST') {
          feature.allowed_values = assignment.allowed_values;
        }

        return feature;
      });

      await (adminAPI as any).updatePlanSystemFeatures(selectedPlanId, features);
      setSuccessModal({ isOpen: true, message: 'System features updated successfully!' });
      fetchPlanFeatures(selectedPlanId!);
    } catch (err: any) {
      alert(`Error saving system features: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCharacterAccess = async () => {
    setSaving(true);
    try {
      const characters = characterAccessAssignments.map((assignment: any) => ({
        character_id: assignment.character_id,
        is_accessible: assignment.is_accessible,
        daily_message_limit: assignment.daily_message_limit,
        daily_token_limit: assignment.daily_token_limit,
        monthly_message_limit: assignment.monthly_message_limit,
        monthly_token_limit: assignment.monthly_token_limit,
        rate_limit_per_minute: assignment.rate_limit_per_minute,
        priority: assignment.priority,
      }));

      await (adminAPI as any).updatePlanCharacterAccess(selectedPlanId, characters);
      setSuccessModal({ isOpen: true, message: 'Character access updated successfully!' });
      fetchPlanFeatures(selectedPlanId!);
    } catch (err: any) {
      alert(`Error saving character access: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateDisplayFeature = (featureId: string, field: string, value: any) => {
    setDisplayFeatureAssignments(prev =>
      prev.map(f => f.feature_id === featureId ? { ...f, [field]: value } : f)
    );
  };

  const updateFeatureState = (featureId: string, state: string) => {
    setDisplayFeatureAssignments(prev =>
      prev.map(f => f.feature_id === featureId ? { ...f, feature_state: state } : f)
    );
  };

  const updateSystemFeature = (featureId: string, updates: any) => {
    setSystemFeatureAssignments(prev =>
      prev.map(f => f.feature_id === featureId ? { ...f, ...updates } : f)
    );
  };

  const updateCharacterAccess = (characterId: string, field: string, value: any) => {
    setCharacterAccessAssignments(prev =>
      prev.map(c => c.character_id === characterId ? { ...c, [field]: value } : c)
    );
  };

  const handleSaveToolAccess = async () => {
    setSaving(true);
    try {
      const tools = toolAccessAssignments.map((assignment: any) => ({
        tool_name: assignment.tool_name,
        is_enabled: assignment.is_enabled,
        monthly_usage_limit: assignment.monthly_usage_limit,
      }));

      await (adminAPI as any).updatePlanToolAccess(selectedPlanId, tools);
      setSuccessModal({ isOpen: true, message: 'Tool limits updated successfully!' });
      fetchPlanFeatures(selectedPlanId!);
    } catch (err: any) {
      alert(`Error saving tool limits: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateToolAccess = (toolName: string, field: string, value: any) => {
    setToolAccessAssignments(prev =>
      prev.map(t => t.tool_name === toolName ? { ...t, [field]: value } : t)
    );
  };

  if (loading && !selectedPlanId) {
    return (
      <div className={`flex justify-center items-center h-64 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  if (error && !selectedPlanId) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
        Error loading data: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Plan Selector */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-700'}`}>
          Select Plan
        </label>
        <select
          value={selectedPlanId || ''}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className={`w-full max-w-md px-4 py-2 rounded-lg border ${
            darkMode
              ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
              : 'bg-white border-neutral-300 text-zinc-950'
          } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
        >
          <option value="">Select a plan...</option>
          {plans.map((plan: any) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - ${plan.monthly_price}/mo
            </option>
          ))}
        </select>
      </div>

      {selectedPlanId && (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('display')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'display'
                  ? 'bg-zenible-primary text-white'
                  : darkMode
                  ? 'bg-zenible-dark-tab-bg text-zenible-dark-text hover:bg-zenible-dark-border'
                  : 'bg-gray-100 text-zinc-700 hover:bg-gray-200'
              }`}
            >
              Display Features
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'system'
                  ? 'bg-zenible-primary text-white'
                  : darkMode
                  ? 'bg-zenible-dark-tab-bg text-zenible-dark-text hover:bg-zenible-dark-border'
                  : 'bg-gray-100 text-zinc-700 hover:bg-gray-200'
              }`}
            >
              System Features
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'characters'
                  ? 'bg-zenible-primary text-white'
                  : darkMode
                  ? 'bg-zenible-dark-tab-bg text-zenible-dark-text hover:bg-zenible-dark-border'
                  : 'bg-gray-100 text-zinc-700 hover:bg-gray-200'
              }`}
            >
              Character Access
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'tools'
                  ? 'bg-zenible-primary text-white'
                  : darkMode
                  ? 'bg-zenible-dark-tab-bg text-zenible-dark-text hover:bg-zenible-dark-border'
                  : 'bg-gray-100 text-zinc-700 hover:bg-gray-200'
              }`}
            >
              Tool Limits
            </button>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className={`flex justify-center items-center h-64 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
          ) : (
            <>
              {/* Display Features Tab */}
              {activeTab === 'display' && (
                <div className={`rounded-xl p-6 border ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    Display Features
                  </h3>
                  <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
                    <p className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                      <strong>Feature States:</strong>
                      <span className="ml-2">&#10003; Included</span> |
                      <span className="ml-2">&#10007; Excluded (shown as not available)</span> |
                      <span className="ml-2">&#8212; Not Shown (hidden from plan)</span>
                    </p>
                  </div>
                  <div className="space-y-3">
                    {displayFeatureAssignments.map((assignment: any) => (
                      <div
                        key={assignment.feature_id}
                        className={`flex items-center gap-4 p-3 rounded-lg ${
                          darkMode ? 'bg-zenible-dark-sidebar' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateFeatureState(assignment.feature_id, 'included')}
                            className={`p-2 rounded transition-colors ${
                              assignment.feature_state === 'included'
                                ? 'bg-green-500 text-white'
                                : darkMode
                                ? 'bg-zenible-dark-bg text-zenible-dark-text-secondary hover:bg-zenible-dark-card'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Include feature"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => updateFeatureState(assignment.feature_id, 'excluded')}
                            className={`p-2 rounded transition-colors ${
                              assignment.feature_state === 'excluded'
                                ? 'bg-red-500 text-white'
                                : darkMode
                                ? 'bg-zenible-dark-bg text-zenible-dark-text-secondary hover:bg-zenible-dark-card'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Exclude feature (show as not available)"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => updateFeatureState(assignment.feature_id, 'not_shown')}
                            className={`p-2 rounded transition-colors ${
                              assignment.feature_state === 'not_shown'
                                ? darkMode
                                  ? 'bg-gray-600 text-white'
                                  : 'bg-gray-400 text-white'
                                : darkMode
                                ? 'bg-zenible-dark-bg text-zenible-dark-text-secondary hover:bg-zenible-dark-card'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Don't show feature"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex-1">
                          <label className={`font-medium ${
                            assignment.feature_state === 'not_shown'
                              ? darkMode ? 'text-zenible-dark-text-secondary line-through' : 'text-gray-400 line-through'
                              : darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                          }`}>
                            {assignment.feature_name}
                          </label>
                          <div className={`text-xs mt-1 ${
                            assignment.feature_state === 'included' ? 'text-green-600 dark:text-green-400' :
                            assignment.feature_state === 'excluded' ? 'text-red-600 dark:text-red-400' :
                            'text-gray-500 dark:text-gray-400'
                          }`}>
                            {assignment.feature_state === 'included' ? 'Included in plan' :
                             assignment.feature_state === 'excluded' ? 'Shown as not available' :
                             'Hidden from plan'}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={assignment.custom_value}
                          onChange={(e) => updateDisplayFeature(assignment.feature_id, 'custom_value', e.target.value)}
                          placeholder="Custom value (e.g., 'Unlimited')"
                          disabled={assignment.feature_state === 'not_shown'}
                          className={`w-64 px-3 py-1 rounded border ${
                            assignment.feature_state === 'not_shown'
                              ? darkMode
                                ? 'bg-zenible-dark-bg/50 border-zenible-dark-border/50 text-zenible-dark-text-secondary/50 cursor-not-allowed'
                                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : darkMode
                              ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                              : 'bg-white border-neutral-300 text-zinc-950'
                          } focus:outline-none focus:ring-1 focus:ring-zenible-primary`}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveDisplayFeatures}
                    disabled={saving}
                    className="mt-6 px-6 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Display Features'}
                  </button>
                </div>
              )}

              {/* System Features Tab */}
              {activeTab === 'system' && (
                <div className={`rounded-xl p-6 border ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    System Features Configuration
                  </h3>
                  <p className={`text-sm mb-6 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                    Assign system features to this plan with their appropriate values based on feature type.
                  </p>

                  {/* Info Box */}
                  <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                      <p className="font-semibold mb-2">Feature Types:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><strong>Boolean:</strong> Toggle features on/off</li>
                        <li><strong>Limit:</strong> Set numeric limits (-1 for unlimited)</li>
                        <li><strong>List:</strong> Define allowed values for the feature</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {systemFeatureAssignments.length === 0 ? (
                      <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                        No system features available. Please configure system features first.
                      </div>
                    ) : (
                      systemFeatureAssignments.map((assignment: any) => (
                        <div
                          key={assignment.feature_id}
                          className={`p-5 rounded-lg border ${darkMode ? 'bg-zenible-dark-sidebar border-zenible-dark-border' : 'bg-gray-50 border-neutral-200'}`}
                        >
                          <div className="space-y-3">
                            {/* Feature Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className={`font-medium text-base ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                                    {assignment.feature_name}
                                  </h4>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    assignment.feature_type === 'BOOLEAN'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      : assignment.feature_type === 'LIMIT'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                  }`}>
                                    {assignment.feature_type}
                                  </span>
                                </div>
                                <code className={`text-xs mt-1 inline-block ${darkMode ? 'text-zenible-primary' : 'text-zenible-primary'}`}>
                                  {assignment.feature_code}
                                </code>
                              </div>
                            </div>

                            {/* Feature Value Controls */}
                            <div className="ml-0">
                              {assignment.feature_type === 'BOOLEAN' && (
                                <div className="flex items-center gap-3">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={assignment.is_enabled}
                                      onChange={(e) => updateSystemFeature(assignment.feature_id, { is_enabled: e.target.checked })}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zenible-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zenible-primary"></div>
                                  </label>
                                  <span className={`text-sm ${assignment.is_enabled
                                    ? darkMode ? 'text-green-400' : 'text-green-600'
                                    : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                                  }`}>
                                    {assignment.is_enabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </div>
                              )}

                              {assignment.feature_type === 'LIMIT' && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="number"
                                      value={assignment.limit_value}
                                      onChange={(e) => updateSystemFeature(assignment.feature_id, { limit_value: parseInt(e.target.value) || 0 })}
                                      min="-1"
                                      className={`w-40 px-3 py-2 rounded-lg border ${
                                        darkMode
                                          ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                          : 'bg-white border-neutral-300 text-zinc-950'
                                      } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
                                    />
                                    <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                                      {assignment.limit_value === -1 ? 'Unlimited' : `Limit: ${assignment.limit_value}`}
                                    </span>
                                  </div>
                                  <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                                    Enter -1 for unlimited, 0 to disable, or a positive number for the limit
                                  </p>
                                </div>
                              )}

                              {assignment.feature_type === 'LIST' && (
                                <div className="space-y-3">
                                  <div className="flex flex-wrap gap-2">
                                    {assignment.allowed_values && assignment.allowed_values.length > 0 ? (
                                      assignment.allowed_values.map((value: string, index: number) => (
                                        <span
                                          key={index}
                                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                                            darkMode
                                              ? 'bg-zenible-dark-bg border border-zenible-dark-border text-zenible-dark-text'
                                              : 'bg-white border border-neutral-300 text-zinc-950'
                                          }`}
                                        >
                                          {value}
                                          <button
                                            onClick={() => {
                                              const newValues = assignment.allowed_values.filter((_: any, i: number) => i !== index);
                                              updateSystemFeature(assignment.feature_id, { allowed_values: newValues });
                                            }}
                                            className={`ml-1 hover:text-red-500 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </span>
                                      ))
                                    ) : (
                                      <span className={`text-sm italic ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                                        No values defined
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Add value and press Enter"
                                      onKeyPress={(e: any) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const value = e.target.value.trim();
                                          if (value && !assignment.allowed_values?.includes(value)) {
                                            const newValues = [...(assignment.allowed_values || []), value];
                                            updateSystemFeature(assignment.feature_id, { allowed_values: newValues });
                                            e.target.value = '';
                                          }
                                        }
                                      }}
                                      className={`flex-1 px-3 py-2 rounded-lg border ${
                                        darkMode
                                          ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                          : 'bg-white border-neutral-300 text-zinc-950'
                                      } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
                                    />
                                    <button
                                      onClick={(e: any) => {
                                        const input = e.target.parentElement.querySelector('input');
                                        const value = input.value.trim();
                                        if (value && !assignment.allowed_values?.includes(value)) {
                                          const newValues = [...(assignment.allowed_values || []), value];
                                          updateSystemFeature(assignment.feature_id, { allowed_values: newValues });
                                          input.value = '';
                                        }
                                      }}
                                      className={`px-3 py-2 rounded-lg border ${
                                        darkMode
                                          ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-sidebar'
                                          : 'bg-gray-100 border-neutral-300 text-zinc-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      Add
                                    </button>
                                  </div>
                                  <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                                    Add values that will be allowed for this feature in this plan
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={handleSaveSystemFeatures}
                    disabled={saving}
                    className="mt-6 px-6 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save System Features'}
                  </button>
                </div>
              )}

              {/* Character Access Tab */}
              {activeTab === 'characters' && (
                <div className={`rounded-xl p-6 border ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    Character Access Configuration
                  </h3>
                  <p className={`text-sm mb-6 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                    Configure which AI characters are accessible for this plan and set their usage limits.
                  </p>

                  {/* Info Box */}
                  <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                      <p className="font-semibold mb-2">Limit Settings:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><strong>Daily Message Limit:</strong> Maximum messages per day (leave empty for unlimited)</li>
                        <li><strong>Daily Token Limit:</strong> Maximum tokens per day (leave empty for unlimited)</li>
                        <li><strong>Monthly Message Limit:</strong> Maximum messages per month (leave empty for unlimited)</li>
                        <li><strong>Monthly Token Limit:</strong> Maximum tokens per month (leave empty for unlimited)</li>
                        <li><strong>Rate Limit:</strong> Maximum messages per minute (prevents abuse)</li>
                        <li><strong>Priority:</strong> Queue priority 1-100 (higher = faster response times)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {characterAccessAssignments.length === 0 ? (
                      <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                        No characters available. Please ensure characters are configured in the system.
                      </div>
                    ) : (
                      characterAccessAssignments.map((assignment: any) => (
                        <div
                          key={assignment.character_id}
                          className={`p-4 rounded-lg border transition-all ${
                            assignment.is_accessible
                              ? darkMode
                                ? 'bg-zenible-dark-sidebar border-zenible-primary/50'
                                : 'bg-purple-50 border-purple-200'
                              : darkMode
                                ? 'bg-zenible-dark-sidebar/50 border-zenible-dark-border'
                                : 'bg-gray-50 border-neutral-200'
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <input
                              type="checkbox"
                              checked={assignment.is_accessible}
                              onChange={(e) => updateCharacterAccess(assignment.character_id, 'is_accessible', e.target.checked)}
                              className="w-5 h-5 mt-0.5 text-zenible-primary rounded focus:ring-zenible-primary"
                            />
                            <div className="flex-1">
                              <h4 className={`font-medium text-lg ${
                                assignment.is_accessible
                                  ? darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                                  : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                              }`}>
                                {assignment.character_name || 'Unnamed Character'}
                              </h4>
                              {assignment.is_accessible && (
                                <p className={`text-xs mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  Accessible on this plan
                                </p>
                              )}
                            </div>
                          </div>

                          {assignment.is_accessible && (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 ml-8">
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                                  Daily Message Limit
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={assignment.daily_message_limit || ''}
                                    onChange={(e) => updateCharacterAccess(assignment.character_id, 'daily_message_limit', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Unlimited"
                                    min="0"
                                    className={`w-full px-3 py-2 rounded border ${
                                      darkMode
                                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                        : 'bg-white border-neutral-300 text-zinc-950'
                                    } focus:outline-none focus:ring-1 focus:ring-zenible-primary`}
                                  />
                                  <span className={`absolute right-2 top-2.5 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-400'}`}>
                                    /day
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                                  Daily Token Limit
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={assignment.daily_token_limit || ''}
                                    onChange={(e) => updateCharacterAccess(assignment.character_id, 'daily_token_limit', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Unlimited"
                                    min="0"
                                    className={`w-full px-3 py-2 rounded border ${
                                      darkMode
                                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                        : 'bg-white border-neutral-300 text-zinc-950'
                                    } focus:outline-none focus:ring-1 focus:ring-zenible-primary`}
                                  />
                                  <span className={`absolute right-2 top-2.5 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-400'}`}>
                                    tokens
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                                  Monthly Message Limit
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={assignment.monthly_message_limit || ''}
                                    onChange={(e) => updateCharacterAccess(assignment.character_id, 'monthly_message_limit', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Unlimited"
                                    min="0"
                                    className={`w-full px-3 py-2 rounded border ${
                                      darkMode
                                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                        : 'bg-white border-neutral-300 text-zinc-950'
                                    } focus:outline-none focus:ring-1 focus:ring-zenible-primary`}
                                  />
                                  <span className={`absolute right-2 top-2.5 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-400'}`}>
                                    /mo
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                                  Monthly Token Limit
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={assignment.monthly_token_limit || ''}
                                    onChange={(e) => updateCharacterAccess(assignment.character_id, 'monthly_token_limit', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Unlimited"
                                    min="0"
                                    className={`w-full px-3 py-2 rounded border ${
                                      darkMode
                                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                        : 'bg-white border-neutral-300 text-zinc-950'
                                    } focus:outline-none focus:ring-1 focus:ring-zenible-primary`}
                                  />
                                  <span className={`absolute right-2 top-2.5 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-400'}`}>
                                    tokens
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                                  Rate Limit (min)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={assignment.rate_limit_per_minute}
                                    onChange={(e) => updateCharacterAccess(assignment.character_id, 'rate_limit_per_minute', parseInt(e.target.value) || 10)}
                                    min="1"
                                    max="100"
                                    className={`w-full px-3 py-2 rounded border ${
                                      darkMode
                                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                        : 'bg-white border-neutral-300 text-zinc-950'
                                    } focus:outline-none focus:ring-1 focus:ring-zenible-primary`}
                                  />
                                  <span className={`absolute right-2 top-2.5 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-400'}`}>
                                    /min
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                                  Priority (1-100)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={assignment.priority}
                                    onChange={(e) => updateCharacterAccess(assignment.character_id, 'priority', Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                                    min="1"
                                    max="100"
                                    className={`w-full px-3 py-2 rounded border ${
                                      darkMode
                                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                        : 'bg-white border-neutral-300 text-zinc-950'
                                    } focus:outline-none focus:ring-1 focus:ring-zenible-primary`}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {!assignment.is_accessible && (
                            <div className={`ml-8 text-sm italic ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                              This character is not accessible on this plan
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={handleSaveCharacterAccess}
                    disabled={saving}
                    className="mt-6 px-6 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Character Access'}
                  </button>
                </div>
              )}

              {/* Tool Limits Tab */}
              {activeTab === 'tools' && (
                <div className={`rounded-xl p-6 border ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    Tool Limits Configuration
                  </h3>
                  <p className={`text-sm mb-6 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                    Configure which AI tools are available for this plan and set their monthly usage limits.
                  </p>

                  {/* Info Box */}
                  <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                      <p className="font-semibold mb-2">Tool Settings:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><strong>Enabled:</strong> Toggle to enable/disable the tool for this plan</li>
                        <li><strong>Monthly Usage Limit:</strong> Maximum times the tool can be used per month (leave empty for unlimited)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {toolAccessAssignments.length === 0 ? (
                      <div className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                        No tools available. Please ensure tools are configured in the system.
                      </div>
                    ) : (
                      toolAccessAssignments.map((assignment: any) => (
                        <div
                          key={assignment.tool_name}
                          className={`p-4 rounded-lg border transition-all ${
                            assignment.is_enabled
                              ? darkMode
                                ? 'bg-zenible-dark-sidebar border-zenible-primary/50'
                                : 'bg-purple-50 border-purple-200'
                              : darkMode
                                ? 'bg-zenible-dark-sidebar/50 border-zenible-dark-border'
                                : 'bg-gray-50 border-neutral-200'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex items-center gap-3 pt-1">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={assignment.is_enabled}
                                  onChange={(e) => updateToolAccess(assignment.tool_name, 'is_enabled', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zenible-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zenible-primary"></div>
                              </label>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className={`font-medium text-base ${
                                  assignment.is_enabled
                                    ? darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                                    : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                                }`}>
                                  {assignment.tool_name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                </h4>
                                <code className={`text-xs px-2 py-0.5 rounded ${
                                  darkMode ? 'bg-zenible-dark-bg text-zenible-primary' : 'bg-gray-100 text-zenible-primary'
                                }`}>
                                  {assignment.tool_name}
                                </code>
                              </div>
                              {assignment.tool_description && (
                                <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                                  {assignment.tool_description}
                                </p>
                              )}
                              {assignment.is_enabled && (
                                <div className="mt-3">
                                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                                    Monthly Usage Limit
                                  </label>
                                  <div className="relative w-48">
                                    <input
                                      type="number"
                                      value={assignment.monthly_usage_limit || ''}
                                      onChange={(e) => updateToolAccess(assignment.tool_name, 'monthly_usage_limit', e.target.value ? parseInt(e.target.value) : null)}
                                      placeholder="Unlimited"
                                      min="0"
                                      className={`w-full px-3 py-2 rounded border ${
                                        darkMode
                                          ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                          : 'bg-white border-neutral-300 text-zinc-950'
                                      } focus:outline-none focus:ring-1 focus:ring-zenible-primary`}
                                    />
                                    <span className={`absolute right-3 top-2.5 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-400'}`}>
                                      /mo
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={handleSaveToolAccess}
                    disabled={saving}
                    className="mt-6 px-6 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Tool Limits'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-md mx-4 rounded-xl shadow-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className={`text-lg font-semibold text-center mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Success!
              </h3>
              <p className={`text-center mb-6 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                {successModal.message}
              </p>
              <button
                onClick={() => setSuccessModal({ isOpen: false, message: '' })}
                className="w-full px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
