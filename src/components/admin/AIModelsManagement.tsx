import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import { request as apiRequest } from '../../services/api/httpClient';
import OpenAIModelSyncModal from './OpenAIModelSyncModal';
import ModelPricingModal from './ModelPricingModal';
import { useModalState } from '../../hooks/useModalState';
import { LoadingSpinner } from '../shared';

interface AdminOutletContext {
  darkMode: boolean;
}

interface OpenAIModel {
  model_id: string;
  name: string;
  supports_chat: boolean;
  supports_completion: boolean;
  supports_embedding: boolean;
  supports_assistant: boolean;
  supports_vision: boolean;
  supports_function_calling: boolean;
  max_tokens?: number | null;
  pricing_input?: string | null;
  pricing_output?: string | null;
  is_active: boolean;
  is_deprecated: boolean;
}

interface OpenAIModelListResponse {
  models?: OpenAIModel[];
  total_pages?: number;
}

export default function AIModelsManagement() {
  const { darkMode } = useOutletContext<AdminOutletContext>();
  const [models, setModels] = useState<OpenAIModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const syncModal = useModalState();
  const pricingModal = useModalState();
  const [editingModel, setEditingModel] = useState<OpenAIModel | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [activeOnly, setActiveOnly] = useState(true);
  const [featureFilter, setFeatureFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Feature options
  const features = [
    { value: '', label: 'All Features' },
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'vision', label: 'Vision' },
    { value: 'function_calling', label: 'Function Calling' },
    { value: 'completion', label: 'Completion' }
  ];

  useEffect(() => {
    fetchModels();
  }, [page, perPage, activeOnly, featureFilter]);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;

      if (featureFilter) {
        // Use feature-specific endpoint with active_only parameter
        const params = new URLSearchParams();
        if (activeOnly) {
          params.append('active_only', 'true');
        }
        const queryString = params.toString();
        const url = `/admin/openai/models/by-feature/${featureFilter}${queryString ? `?${queryString}` : ''}`;
        response = await apiRequest(url, {
          method: 'GET'
        });
      } else {
        // Use general paginated endpoint
        response = await adminAPI.getOpenAIModels({
          page: String(page),
          per_page: String(perPage),
          active_only: String(activeOnly)
        });
      }

      const typedResponse = response as OpenAIModelListResponse;
      if (typedResponse.models) {
        setModels(typedResponse.models);
        setTotalPages(typedResponse.total_pages || 1);
      } else {
        setModels([]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModelStatus = async (modelId: string, currentStatus: boolean) => {
    try {
      await adminAPI.updateOpenAIModel(modelId, {
        is_active: !currentStatus
      });
      fetchModels();
    } catch (err: any) {
      alert(`Failed to update model status: ${err.message}`);
    }
  };

  const handleUpdatePricing = async (modelId: string, pricingInput: number, pricingOutput: number) => {
    try {
      await adminAPI.updateOpenAIModel(modelId, {
        pricing_input: pricingInput,
        pricing_output: pricingOutput
      });
      fetchModels();
    } catch (err) {
      throw new Error(`Failed to update pricing: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEditPricing = (model: OpenAIModel) => {
    setEditingModel(model);
    pricingModal.open();
  };

  const getCapabilityBadges = (model: OpenAIModel): string[] => {
    const badges: string[] = [];
    if (model.supports_chat) badges.push('Chat');
    if (model.supports_embedding) badges.push('Embedding');
    if (model.supports_assistant) badges.push('Assistant');
    if (model.supports_vision) badges.push('Vision');
    if (model.supports_function_calling) badges.push('Functions');
    if (model.supports_completion) badges.push('Completion');
    return badges;
  };

  const formatPrice = (price: string | number | null | undefined): string => {
    if (!price) return 'N/A';
    const numPrice = parseFloat(String(price));
    if (isNaN(numPrice)) return 'N/A';
    return `$${numPrice.toFixed(4)}`;
  };

  const filteredModels = models.filter(model => {
    // Filter by active status
    if (activeOnly && !model.is_active) return false;

    // Filter by search query
    if (searchQuery) {
      const matchesSearch = model.model_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (model.name && model.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`h-16 border-b flex items-center justify-between px-6 ${
        darkMode
          ? 'bg-zenible-dark-card border-zenible-dark-border'
          : 'bg-white border-neutral-200'
      }`}>
        <h1 className={`text-2xl font-semibold ${
          darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'
        }`}>
          AI Models Management
        </h1>

        <button
          onClick={() => syncModal.open()}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg text-sm font-medium hover:bg-zenible-primary-dark transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Models
        </button>
      </div>

      {/* Filters */}
      <div className={`p-4 border-b ${
        darkMode
          ? 'bg-zenible-dark-bg border-zenible-dark-border'
          : 'bg-gray-50 border-neutral-200'
      }`}>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg border ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary'
                : 'bg-white border-neutral-300 text-gray-900 placeholder-gray-500'
            }`}
          />

          {/* Feature Filter */}
          <select
            value={featureFilter}
            onChange={(e) => {
              setFeatureFilter(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-lg border ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-neutral-300 text-gray-900'
            }`}
          >
            {features.map(feature => (
              <option key={feature.value} value={feature.value}>
                {feature.label}
              </option>
            ))}
          </select>

          {/* Active Only Toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded"
            />
            <span className={`text-sm ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Active Only
            </span>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <LoadingSpinner height="h-full" />
        ) : error ? (
          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
          }`}>
            Error loading models: {error}
          </div>
        ) : (
          <div className={`rounded-lg overflow-hidden ${
            darkMode ? 'bg-zenible-dark-card' : 'bg-white'
          }`}>
            <table className="w-full">
              <thead className={`${
                darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'
              } border-b ${
                darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
              }`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                  }`}>
                    Model
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                  }`}>
                    Capabilities
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                  }`}>
                    Context Window
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                  }`}>
                    Pricing (per 1K)
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'
              }`}>
                {filteredModels.map(model => (
                  <tr key={model.model_id} className={`${
                    darkMode ? 'hover:bg-zenible-dark-bg/50' : 'hover:bg-gray-50'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap w-64">
                      <div>
                        <div
                          className={`font-medium truncate ${
                            darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                          }`}
                          title={model.name || model.model_id}
                        >
                          {model.name || model.model_id}
                        </div>
                        <div className={`text-xs truncate ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                        }`}>
                          {model.model_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex flex-wrap gap-1">
                        {getCapabilityBadges(model).map(badge => (
                          <span
                            key={badge}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              darkMode
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                      }`}>
                        {model.max_tokens ? `${model.max_tokens.toLocaleString()} tokens` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                          Input: {formatPrice(model.pricing_input)}
                        </div>
                        <div className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>
                          Output: {formatPrice(model.pricing_output)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleModelStatus(model.model_id, model.is_active)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          model.is_active
                            ? darkMode
                              ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            : darkMode
                            ? 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                      >
                        {model.is_active ? 'Active' : 'Inactive'}
                      </button>
                      {model.is_deprecated && (
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs ${
                          darkMode
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          Deprecated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEditPricing(model)}
                        className={`text-sm ${
                          darkMode
                            ? 'text-zenible-primary hover:text-zenible-primary-dark'
                            : 'text-zenible-primary hover:text-zenible-primary-dark'
                        }`}
                      >
                        Edit Pricing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredModels.length === 0 && (
              <div className={`text-center py-8 ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
              }`}>
                No models found
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && !featureFilter && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${
                page === 1
                  ? darkMode
                    ? 'bg-zenible-dark-bg text-zenible-dark-text-secondary cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode
                  ? 'bg-zenible-dark-card text-zenible-dark-text hover:bg-zenible-dark-tab-bg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded ${
                page === totalPages
                  ? darkMode
                    ? 'bg-zenible-dark-bg text-zenible-dark-text-secondary cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode
                  ? 'bg-zenible-dark-card text-zenible-dark-text hover:bg-zenible-dark-tab-bg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* OpenAI Model Sync Modal */}
      <OpenAIModelSyncModal
        isOpen={syncModal.isOpen}
        onClose={() => {
          syncModal.close();
          fetchModels(); // Refresh models after sync
        }}
        darkMode={darkMode}
      />

      {/* Model Pricing Modal */}
      <ModelPricingModal
        isOpen={pricingModal.isOpen}
        onClose={() => {
          pricingModal.close();
          setEditingModel(null);
        }}
        onSave={handleUpdatePricing}
        model={editingModel}
        darkMode={darkMode}
      />
    </div>
  );
}