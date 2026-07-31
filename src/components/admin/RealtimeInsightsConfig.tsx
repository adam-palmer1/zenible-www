import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createRequest } from '../../services/api/httpClient';
import adminAI_API from '../../services/api/admin/ai';

interface AdminOutletContext {
  darkMode: boolean;
}

interface ObjectiveConfig {
  id: string;
  label: string;
  description: string;
  fast_system_prompt: string;
  slow_system_prompt: string;
  anchor_system_prompt: string;
  trigger_system_prompt: string;
}

interface InsightsConfig {
  fast_interval_s: number;
  slow_interval_s: number;
  anchor_interval_s: number;
  credit_interval_s: number;
  fast_model: string;
  slow_model: string;
  objectives: ObjectiveConfig[];
  trigger_patterns: Record<string, string[]>;
}

const request = createRequest('AdminRealtimeInsights');

export default function RealtimeInsightsConfig() {
  const { darkMode } = useOutletContext<AdminOutletContext>();
  const [config, setConfig] = useState<InsightsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPattern, setEditingPattern] = useState<string | null>(null);
  const [newPatternText, setNewPatternText] = useState('');
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
  const [newObjectiveLabel, setNewObjectiveLabel] = useState('');
  const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string }>>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      // Fetch all pages of models
      const allModels: Array<{ value: string; label: string }> = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await adminAI_API.getOpenAIModels({
          is_active: 'true',
          per_page: '100',
          page: String(page),
        }) as any;
        const models = response?.items || response?.models || [];
        if (Array.isArray(models)) {
          models.forEach((m: any) => {
            if (m.supports_chat || m.supports_completion) {
              allModels.push({ value: m.model_id, label: m.model_id });
            }
          });
        }
        const totalPages = response?.total_pages || 1;
        hasMore = page < totalPages;
        page++;
      }
      setAvailableModels(allModels);
    } catch {
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await request('/admin/realtime-insights/config', { method: 'GET' }) as InsightsConfig;
      setConfig(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      setError(null);
      const data = await request('/admin/realtime-insights/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      }) as InsightsConfig;
      setConfig(data);
      setSuccess('Configuration saved');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof InsightsConfig, value: unknown) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const addPattern = (category: string) => {
    if (!config || !newPatternText.trim()) return;
    const patterns = [...(config.trigger_patterns[category] || []), newPatternText.trim().toLowerCase()];
    setConfig({
      ...config,
      trigger_patterns: { ...config.trigger_patterns, [category]: patterns },
    });
    setNewPatternText('');
  };

  const removePattern = (category: string, index: number) => {
    if (!config) return;
    const patterns = [...(config.trigger_patterns[category] || [])];
    patterns.splice(index, 1);
    setConfig({
      ...config,
      trigger_patterns: { ...config.trigger_patterns, [category]: patterns },
    });
  };

  const addObjective = () => {
    if (!config || !newObjectiveLabel.trim()) return;
    const slug = newObjectiveLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (config.objectives.some((o) => o.id === slug)) return;
    setConfig({
      ...config,
      objectives: [...config.objectives, {
        id: slug,
        label: newObjectiveLabel.trim(),
        description: '',
        fast_system_prompt: '',
        slow_system_prompt: '',
        anchor_system_prompt: '',
        trigger_system_prompt: '',
      }],
    });
    setNewObjectiveLabel('');
    setExpandedObjective(slug);
  };

  const removeObjective = (id: string) => {
    if (!config || id === 'unspecified' || id === 'other') return;
    setConfig({
      ...config,
      objectives: config.objectives.filter((o) => o.id !== id),
    });
    if (expandedObjective === id) setExpandedObjective(null);
  };

  const updateObjectivePrompt = (id: string, field: keyof ObjectiveConfig, value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      objectives: config.objectives.map((o) =>
        o.id === id ? { ...o, [field]: value } : o
      ),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const cardClass = `rounded-lg p-5 ${darkMode ? 'bg-zenible-dark-card border border-zenible-dark-border' : 'bg-white border border-gray-200'}`;
  const labelClass = `block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`;
  const helpClass = `text-xs mb-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`;
  const inputClass = `w-full max-w-xs px-3 py-2 text-sm rounded-lg border ${
    darkMode
      ? 'bg-zenible-dark-bg border-zenible-dark-border text-white'
      : 'bg-white border-gray-300 text-gray-900'
  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`;

  const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
    buying_signal: { label: 'Buying Signals', description: 'Phrases indicating purchase intent' },
    objection: { label: 'Objections', description: 'Phrases indicating resistance or pushback' },
    action_commit: { label: 'Action Commitments', description: 'Phrases where someone commits to doing something' },
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Real-time Insights
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          Configure the AI analysis engine that runs during live meetings.
          Changes take effect for new sessions — running sessions keep their original config.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>
      )}

      <div className="space-y-6">
        {/* Analysis Intervals */}
        <div className={cardClass}>
          <h2 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Analysis Intervals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fast Loop (seconds)</label>
              <p className={helpClass}>Haiku extraction: action items, questions, signals</p>
              <input
                type="number"
                min={5}
                max={60}
                value={config?.fast_interval_s || 12}
                onChange={(e) => updateField('fast_interval_s', parseInt(e.target.value) || 12)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Slow Loop (seconds)</label>
              <p className={helpClass}>Sonnet summary refresh + coaching feedback</p>
              <input
                type="number"
                min={30}
                max={300}
                value={config?.slow_interval_s || 90}
                onChange={(e) => updateField('slow_interval_s', parseInt(e.target.value) || 90)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Anchor Recompute (seconds)</label>
              <p className={helpClass}>Full-transcript recompute to correct drift</p>
              <input
                type="number"
                min={300}
                max={3600}
                value={config?.anchor_interval_s || 900}
                onChange={(e) => updateField('anchor_interval_s', parseInt(e.target.value) || 900)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Credit Interval (seconds)</label>
              <p className={helpClass}>1 usage credit consumed per this many seconds</p>
              <input
                type="number"
                min={30}
                max={600}
                value={config?.credit_interval_s || 120}
                onChange={(e) => updateField('credit_interval_s', parseInt(e.target.value) || 120)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* AI Models */}
        <div className={cardClass}>
          <h2 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Models
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fast Model (Haiku)</label>
              <p className={helpClass}>Used for rapid extraction every {config?.fast_interval_s || 12}s</p>
              <select
                value={config?.fast_model || ''}
                onChange={(e) => updateField('fast_model', e.target.value)}
                className={inputClass}
                disabled={modelsLoading}
              >
                {modelsLoading && <option>Loading models...</option>}
                {!modelsLoading && availableModels.length === 0 && <option value="">No models available</option>}
                {availableModels.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
                {config?.fast_model && !availableModels.find(m => m.value === config.fast_model) && (
                  <option value={config.fast_model}>{config.fast_model}</option>
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Slow Model (Sonnet)</label>
              <p className={helpClass}>Used for summaries, coaching, anchor recomputes</p>
              <select
                value={config?.slow_model || ''}
                onChange={(e) => updateField('slow_model', e.target.value)}
                className={inputClass}
                disabled={modelsLoading}
              >
                {modelsLoading && <option>Loading models...</option>}
                {!modelsLoading && availableModels.length === 0 && <option value="">No models available</option>}
                {availableModels.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
                {config?.slow_model && !availableModels.find(m => m.value === config.slow_model) && (
                  <option value={config.slow_model}>{config.slow_model}</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Call Objectives & System Prompts */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Call Objectives
              </h2>
              <p className={helpClass}>
                Each objective has its own set of system prompts. Users select an objective before enabling insights.
                Use <code className="px-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">[[OBJECTIVE]]</code> in the "Other" prompts — it gets replaced with the user's text.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {(config?.objectives || []).map((obj) => {
              const isProtected = obj.id === 'unspecified' || obj.id === 'other';
              const isExpanded = expandedObjective === obj.id;
              return (
                <div key={obj.id} className={`rounded-lg border ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                  {/* Objective header */}
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer ${
                      darkMode ? 'hover:bg-zenible-dark-bg' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setExpandedObjective(isExpanded ? null : obj.id)}
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''} ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {obj.label}
                      </span>
                      {isProtected && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-gray-100 text-gray-500'}`}>
                          {obj.id === 'unspecified' ? 'Default' : 'Custom text'}
                        </span>
                      )}
                    </div>
                    {!isProtected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeObjective(obj.id); }}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Expanded prompts */}
                  {isExpanded && (
                    <div className={`px-4 pb-4 space-y-3 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-gray-100'}`}>
                      <div className="pt-3">
                        <label className={labelClass}>Description</label>
                        <p className={helpClass}>Short description shown to users when selecting this objective.</p>
                        <input
                          type="text"
                          value={obj.description || ''}
                          onChange={(e) => updateObjectivePrompt(obj.id, 'description', e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg border ${
                            darkMode
                              ? 'bg-zenible-dark-bg border-zenible-dark-border text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        />
                      </div>
                      {([
                        { key: 'fast_system_prompt' as const, label: 'Fast Extraction (Haiku)', help: 'Runs every ~12s. Extracts action items, questions, decisions, signals.' },
                        { key: 'slow_system_prompt' as const, label: 'Summary & Coaching (Sonnet)', help: 'Runs every ~90s. Rolling summary, sentiment, coaching notes.' },
                        { key: 'anchor_system_prompt' as const, label: 'Anchor Recompute (Sonnet)', help: 'Runs every ~15min. Full-transcript correctness pass.' },
                        { key: 'trigger_system_prompt' as const, label: 'Event Trigger (Haiku)', help: 'On-demand. Uses {trigger_type}, {trigger_text}, {speaker}.' },
                      ]).map(({ key, label, help }) => (
                        <div key={key} className="pt-3">
                          <label className={labelClass}>{label}</label>
                          <p className={helpClass}>{help}</p>
                          <textarea
                            value={obj[key] || ''}
                            onChange={(e) => updateObjectivePrompt(obj.id, key, e.target.value)}
                            rows={5}
                            className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                              darkMode
                                ? 'bg-zenible-dark-bg border-zenible-dark-border text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add objective */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newObjectiveLabel}
                onChange={(e) => setNewObjectiveLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addObjective(); }}
                placeholder="New objective name..."
                className={`${inputClass} max-w-xs`}
              />
              <button
                onClick={addObjective}
                disabled={!newObjectiveLabel.trim()}
                className="text-xs px-3 py-2 rounded-lg bg-zenible-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                Add Objective
              </button>
            </div>
          </div>
        </div>

        {/* Trigger Patterns */}
        <div className={cardClass}>
          <h2 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Event Trigger Patterns
          </h2>
          <p className={helpClass}>
            Phrases that trigger immediate targeted analysis when detected in the transcript.
            All patterns are matched case-insensitively.
          </p>

          <div className="space-y-4">
            {Object.entries(config?.trigger_patterns || {}).map(([category, patterns]) => {
              const meta = CATEGORY_LABELS[category] || { label: category, description: '' };
              return (
                <div key={category}>
                  <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-primary' : 'text-gray-800'}`}>
                    {meta.label}
                  </h3>
                  {meta.description && (
                    <p className={helpClass}>{meta.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {patterns.map((pattern, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          darkMode ? 'bg-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pattern}
                        <button
                          onClick={() => removePattern(category, i)}
                          className="hover:text-red-500 ml-0.5"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                  {editingPattern === category ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newPatternText}
                        onChange={(e) => setNewPatternText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { addPattern(category); setEditingPattern(null); } }}
                        placeholder="Type a phrase..."
                        autoFocus
                        className={`${inputClass} max-w-sm`}
                      />
                      <button
                        onClick={() => { addPattern(category); setEditingPattern(null); }}
                        className="text-xs px-3 py-2 rounded-lg bg-zenible-primary text-white hover:opacity-90"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setEditingPattern(null); setNewPatternText(''); }}
                        className={`text-xs px-3 py-2 rounded-lg ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingPattern(category); setNewPatternText(''); }}
                      className={`text-xs ${darkMode ? 'text-zenible-primary' : 'text-purple-600'} hover:underline`}
                    >
                      + Add pattern
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium rounded-lg bg-zenible-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
