import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import { useModalState } from '../../hooks/useModalState';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { LoadingSpinner } from '../shared';
import Combobox from '../ui/combobox/Combobox';

interface Tip {
  id: string;
  content: string;
  ai_character_id?: string;
  is_active: boolean;
  priority: number;
  created_at?: string;
}

interface AICharacter {
  id: string;
  name: string;
  avatar_url?: string;
  description?: string;
  is_active?: boolean;
}

interface TipAnalytics {
  total_tips: number;
  total_views: number;
  unique_users: number;
  date_range?: { days: number };
  analytics?: Array<{
    content: string;
    total_views: number;
    unique_viewers: number;
    last_accessed?: string;
  }>;
}

interface TipEngagement {
  total_tips: number;
  active_tips: number;
  total_views: number;
  unique_users: number;
  average_views_per_tip?: number;
}

interface TipForm {
  content: string;
  ai_character_id: string;
  is_active: boolean;
  priority: number;
}

export default function TipsManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  // Main state
  const [tips, setTips] = useState<Tip[]>([]);
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [characterFilter, setCharacterFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Modal states
  const tipModal = useModalState();
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const deleteConfirmation = useDeleteConfirmation<Tip>();
  const bulkModal = useModalState();
  const bulkImportModal = useModalState();

  // Bulk selection
  const [selectedTips, setSelectedTips] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkCharacterId, setBulkCharacterId] = useState<string>('');

  // Bulk import
  const [bulkImportText, setBulkImportText] = useState<string>('');
  const [bulkImportCharacter, setBulkImportCharacter] = useState<string>('');
  const [bulkImportPriority, setBulkImportPriority] = useState<number>(1);
  const [bulkImportActive, setBulkImportActive] = useState<boolean>(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>('tips'); // tips, analytics, engagement

  // Analytics state
  const [analytics, setAnalytics] = useState<TipAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  const [analyticsCharacter, setAnalyticsCharacter] = useState<string>('');

  // Engagement state
  const [engagement, setEngagement] = useState<TipEngagement | null>(null);
  const [engagementLoading, setEngagementLoading] = useState<boolean>(false);
  const [engagementDays, setEngagementDays] = useState<number>(30);

  // Form state
  const [tipForm, setTipForm] = useState<TipForm>({
    content: '',
    ai_character_id: '',
    is_active: true,
    priority: 1
  });

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchTips();
  }, [page, perPage, search, characterFilter, activeFilter]);

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'engagement') {
      fetchEngagement();
    }
  }, [activeTab, analyticsDays, analyticsCharacter, engagementDays]);

  const fetchTips = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        ...(search && { search }),
        ...(characterFilter && { character_id: characterFilter }),
        ...(activeFilter !== '' && { is_active: activeFilter })
      };

      const response = await adminAPI.getTips(params) as Record<string, unknown>;
      setTips((response.tips as Tip[]) || []);
      setTotal((response.total as number) || 0);
      setTotalPages((response.total_pages as number) || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Error fetching tips:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await adminAPI.getAICharacters({ is_active: 'true' }) as Record<string, unknown>;
      setCharacters((response.characters as AICharacter[]) || (response.items as AICharacter[]) || []);
    } catch (err: unknown) {
      console.error('Error fetching characters:', err);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const params: Record<string, string> = {
        days: String(analyticsDays),
        ...(analyticsCharacter && { character_id: analyticsCharacter })
      };
      const data = await adminAPI.getTipsAnalytics(params) as TipAnalytics;
      setAnalytics(data);
    } catch (err: unknown) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchEngagement = async () => {
    setEngagementLoading(true);
    try {
      const params: Record<string, string> = { days: String(engagementDays) };
      const data = await adminAPI.getTipsEngagement(params) as TipEngagement;
      setEngagement(data);
    } catch (err: unknown) {
      console.error('Error fetching engagement:', err);
    } finally {
      setEngagementLoading(false);
    }
  };

  const handleCreateTip = () => {
    setEditingTip(null);
    setTipForm({
      content: '',
      ai_character_id: '',
      is_active: true,
      priority: 1
    });
    tipModal.open();
  };

  const handleEditTip = (tip: Tip) => {
    setEditingTip(tip);
    setTipForm({
      content: tip.content,
      ai_character_id: tip.ai_character_id || '',
      is_active: tip.is_active,
      priority: tip.priority
    });
    tipModal.open();
  };

  const handleSaveTip = async () => {
    try {
      const data = {
        content: tipForm.content,
        ...(tipForm.ai_character_id && { ai_character_id: tipForm.ai_character_id }),
        is_active: tipForm.is_active,
        priority: Number(tipForm.priority)
      };

      if (editingTip) {
        await adminAPI.updateTip(editingTip.id, data);
      } else {
        await adminAPI.createTip(data);
      }

      tipModal.close();
      fetchTips();
    } catch (err: unknown) {
      alert(`Error saving tip: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteTip = async () => {
    await deleteConfirmation.confirmDelete(async (tip) => {
      try {
        await adminAPI.deleteTip(tip.id);
        fetchTips();
      } catch (err: unknown) {
        alert(`Error deleting tip: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }
    });
  };

  const handleToggleActive = async (tip: Tip) => {
    try {
      await adminAPI.updateTip(tip.id, { is_active: !tip.is_active });
      fetchTips();
    } catch (err: unknown) {
      alert(`Error updating tip: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleBulkAction = async () => {
    if (selectedTips.length === 0 || !bulkAction) return;

    try {
      const data = {
        tip_ids: selectedTips,
        action: bulkAction,
        ...(bulkAction === 'assign' && bulkCharacterId && { ai_character_id: bulkCharacterId })
      };

      await adminAPI.bulkActionTips(data);
      bulkModal.close();
      setSelectedTips([]);
      setBulkAction('');
      setBulkCharacterId('');
      fetchTips();
    } catch (err: unknown) {
      alert(`Error performing bulk action: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;

    try {
      // Split by newlines and filter out empty lines
      const lines = bulkImportText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      if (lines.length === 0) {
        alert('Please enter at least one tip');
        return;
      }

      // Create array of tip objects
      const tipsToImport = lines.map((content: string) => ({
        content,
        ...(bulkImportCharacter && { ai_character_id: bulkImportCharacter }),
        is_active: bulkImportActive,
        priority: Number(bulkImportPriority)
      }));

      // Call bulk create API
      await adminAPI.bulkCreateTips(tipsToImport);

      // Close modal and reset form
      bulkImportModal.close();
      setBulkImportText('');
      setBulkImportCharacter('');
      setBulkImportPriority(1);
      setBulkImportActive(true);

      // Refresh tips list
      fetchTips();

      alert(`Successfully created ${lines.length} tip${lines.length > 1 ? 's' : ''}`);
    } catch (err: unknown) {
      alert(`Error importing tips: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const getBulkImportPreviewCount = (): number => {
    if (!bulkImportText.trim()) return 0;
    return bulkImportText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0).length;
  };

  const toggleSelectTip = (tipId: string) => {
    setSelectedTips(prev =>
      prev.includes(tipId)
        ? prev.filter(id => id !== tipId)
        : [...prev, tipId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTips.length === tips.length) {
      setSelectedTips([]);
    } else {
      setSelectedTips(tips.map((t: Tip) => t.id));
    }
  };

  const getCharacter = (characterId: string): AICharacter | null => {
    if (!characterId) return null;
    return characters.find((c: AICharacter) => c.id === characterId) || null;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Tips Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage tip of the day messages from AI characters
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <div className="px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('tips')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'tips'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Tips List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('engagement')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'engagement'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Engagement
          </button>
        </div>
      </div>

      {/* Tips List Tab */}
      {activeTab === 'tips' && (
        <>
          {/* Filters and Actions */}
          <div className="p-6">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search in content..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />

                <Combobox
                  value={characterFilter}
                  onChange={(value) => {
                    setCharacterFilter(value);
                    setPage(1);
                  }}
                  options={characters.map((char: AICharacter) => ({ id: char.id, label: char.name }))}
                  placeholder="All Characters"
                  allowClear
                />

                <Combobox
                  value={activeFilter}
                  onChange={(value) => {
                    setActiveFilter(value);
                    setPage(1);
                  }}
                  options={[
                    { id: 'true', label: 'Active' },
                    { id: 'false', label: 'Inactive' },
                  ]}
                  placeholder="All Status"
                  allowClear
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateTip}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                >
                  Create Tip
                </button>

                <button
                  onClick={() => bulkImportModal.open()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Bulk Import
                </button>

                {selectedTips.length > 0 && (
                  <button
                    onClick={() => bulkModal.open()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Bulk Actions ({selectedTips.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tips Table */}
          <div className="px-6 pb-6">
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              {loading ? (
                <LoadingSpinner height="py-12" />
              ) : error ? (
                <div className="text-red-500 text-center py-12">Error: {error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            <input
                              type="checkbox"
                              checked={selectedTips.length === tips.length && tips.length > 0}
                              onChange={toggleSelectAll}
                              className="rounded"
                            />
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Content
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Character
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Priority
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Status
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Created
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                        {tips.map((tip: Tip) => (
                          <tr key={tip.id}>
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedTips.includes(tip.id)}
                                onChange={() => toggleSelectTip(tip.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {truncateText(tip.content, 150)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const char = getCharacter(tip.ai_character_id ?? '');
                                if (!char) {
                                  return (
                                    <span className={`text-sm italic ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
                                      Unassigned
                                    </span>
                                  );
                                }
                                return (
                                  <div className="flex items-center gap-2" title={char.description || ''}>
                                    {char.avatar_url ? (
                                      <img
                                        src={char.avatar_url}
                                        alt={char.name}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-zenible-dark-border' : 'bg-gray-200'}`}>
                                        <span className="text-xs font-medium">{char.name.charAt(0)}</span>
                                      </div>
                                    )}
                                    <span className={`text-sm font-medium truncate ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                      {char.name}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {tip.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleActive(tip)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  tip.is_active ? 'bg-zenible-primary' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    tip.is_active ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                                {formatDate(tip.created_at ?? '')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditTip(tip)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteConfirmation.requestDelete(tip)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className={`px-6 py-3 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Page {page} of {totalPages} ({total} total)
                        </span>
                        <Combobox
                          value={String(perPage)}
                          onChange={(value) => {
                            setPerPage(parseInt(value || '20'));
                            setPage(1);
                          }}
                          options={[
                            { id: '10', label: '10 per page' },
                            { id: '20', label: '20 per page' },
                            { id: '50', label: '50 per page' },
                            { id: '100', label: '100 per page' },
                          ]}
                          allowClear={false}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className={`px-3 py-1 text-sm rounded ${
                            page === 1
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-zenible-primary text-white hover:bg-opacity-90'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className={`px-3 py-1 text-sm rounded ${
                            page === totalPages
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-zenible-primary text-white hover:bg-opacity-90'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="p-6">
          <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Combobox
                value={String(analyticsDays)}
                onChange={(value) => setAnalyticsDays(parseInt(value || '30'))}
                options={[
                  { id: '7', label: 'Last 7 days' },
                  { id: '30', label: 'Last 30 days' },
                  { id: '90', label: 'Last 90 days' },
                  { id: '365', label: 'Last 365 days' },
                ]}
                allowClear={false}
              />

              <Combobox
                value={analyticsCharacter}
                onChange={(value) => setAnalyticsCharacter(value)}
                options={characters.map((char: AICharacter) => ({ id: char.id, label: char.name }))}
                placeholder="All Characters"
                allowClear
              />
            </div>
          </div>

          {analyticsLoading ? (
            <LoadingSpinner height="py-12" />
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Tips</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.total_tips || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Views</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.total_views || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Unique Users</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.unique_users || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Date Range</div>
                  <div className={`text-sm font-medium mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.date_range?.days || 0} days
                  </div>
                </div>
              </div>

              <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className="p-4 border-b">
                  <h3 className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    Tips Performance
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Content
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Total Views
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Unique Viewers
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Last Accessed
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                      {analytics.analytics?.map((item: { content: string; total_views: number; unique_viewers: number; last_accessed?: string }, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {truncateText(item.content, 100)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {item.total_views || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {item.unique_viewers || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                              {item.last_accessed ? formatDate(item.last_accessed) : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              No analytics data available
            </div>
          )}
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="p-6">
          <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <Combobox
              options={[
                { id: '7', label: 'Last 7 days' },
                { id: '30', label: 'Last 30 days' },
                { id: '90', label: 'Last 90 days' },
                { id: '365', label: 'Last 365 days' },
              ]}
              value={String(engagementDays)}
              onChange={(value) => setEngagementDays(parseInt(value || '7'))}
              placeholder="Select period"
              allowClear={false}
            />
          </div>

          {engagementLoading ? (
            <LoadingSpinner height="py-12" />
          ) : engagement ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Tips</div>
                <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {engagement.total_tips || 0}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Active Tips</div>
                <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {engagement.active_tips || 0}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Views</div>
                <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {engagement.total_views || 0}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Unique Users</div>
                <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {engagement.unique_users || 0}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Avg Views/Tip</div>
                <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {engagement.average_views_per_tip ? engagement.average_views_per_tip.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              No engagement data available
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Tip Modal */}
      {tipModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {editingTip ? 'Edit Tip' : 'Create Tip'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Content *
                </label>
                <textarea
                  value={tipForm.content}
                  onChange={(e) => setTipForm({ ...tipForm, content: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Enter tip content..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  AI Character
                </label>
                <Combobox
                  options={characters.map((char: AICharacter) => ({ id: char.id, label: char.name }))}
                  value={tipForm.ai_character_id}
                  onChange={(value) => setTipForm({ ...tipForm, ai_character_id: value })}
                  placeholder="Unassigned"
                  allowClear
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tipForm.priority}
                  onChange={(e) => setTipForm({ ...tipForm, priority: parseInt(e.target.value) || 1 })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={tipForm.is_active}
                  onChange={(e) => setTipForm({ ...tipForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Active
                </label>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleSaveTip}
                disabled={!tipForm.content}
                className={`px-4 py-2 rounded-lg ${
                  tipForm.content
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingTip ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => tipModal.close()}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete this tip?
              </p>
              <p className={`mt-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                "{truncateText(deleteConfirmation.item.content, 100)}"
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleDeleteTip}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={deleteConfirmation.cancelDelete}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {bulkModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Bulk Actions
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Action
                </label>
                <Combobox
                  options={[
                    { id: 'activate', label: 'Activate' },
                    { id: 'deactivate', label: 'Deactivate' },
                    { id: 'assign', label: 'Assign to Character' },
                    { id: 'delete', label: 'Delete' },
                  ]}
                  value={bulkAction}
                  onChange={(value) => setBulkAction(value)}
                  placeholder="Select action..."
                  allowClear={false}
                />
              </div>

              {bulkAction === 'assign' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Character
                  </label>
                  <Combobox
                    options={characters.map((char: AICharacter) => ({ id: char.id, label: char.name }))}
                    value={bulkCharacterId}
                    onChange={(value) => setBulkCharacterId(value)}
                    placeholder="Select character..."
                    allowClear={false}
                  />
                </div>
              )}

              <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                {selectedTips.length} tip(s) selected
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || (bulkAction === 'assign' && !bulkCharacterId)}
                className={`px-4 py-2 rounded-lg ${
                  bulkAction && (bulkAction !== 'assign' || bulkCharacterId)
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Execute
              </button>
              <button
                onClick={() => {
                  bulkModal.close();
                  setBulkAction('');
                  setBulkCharacterId('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkImportModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Bulk Import Tips
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Tips (one per line) *
                </label>
                <textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  rows={10}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder={"Enter tips, one per line...\nExample:\nAlways start with a strong opening in your proposals\nResearch the client's business before applying\nHighlight your unique value proposition"}
                />
                {getBulkImportPreviewCount() > 0 && (
                  <p className={`text-sm mt-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Preview: {getBulkImportPreviewCount()} tip{getBulkImportPreviewCount() > 1 ? 's' : ''} will be created
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  AI Character (optional)
                </label>
                <Combobox
                  options={characters.map((char: AICharacter) => ({ id: char.id, label: char.name }))}
                  value={bulkImportCharacter}
                  onChange={(value) => setBulkImportCharacter(value)}
                  placeholder="Unassigned"
                  allowClear
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={bulkImportPriority}
                  onChange={(e) => setBulkImportPriority(parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bulk_import_active"
                  checked={bulkImportActive}
                  onChange={(e) => setBulkImportActive(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="bulk_import_active" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  All tips active
                </label>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleBulkImport}
                disabled={!bulkImportText.trim() || getBulkImportPreviewCount() === 0}
                className={`px-4 py-2 rounded-lg ${
                  bulkImportText.trim() && getBulkImportPreviewCount() > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Import {getBulkImportPreviewCount() > 0 ? `(${getBulkImportPreviewCount()})` : ''}
              </button>
              <button
                onClick={() => {
                  bulkImportModal.close();
                  setBulkImportText('');
                  setBulkImportCharacter('');
                  setBulkImportPriority(1);
                  setBulkImportActive(true);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
