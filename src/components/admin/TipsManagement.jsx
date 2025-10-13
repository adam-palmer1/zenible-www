import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';

export default function TipsManagement() {
  const { darkMode } = useOutletContext();

  // Main state
  const [tips, setTips] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [characterFilter, setCharacterFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Modal states
  const [showTipModal, setShowTipModal] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTip, setDeletingTip] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Bulk selection
  const [selectedTips, setSelectedTips] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkCharacterId, setBulkCharacterId] = useState('');

  // Bulk import
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportCharacter, setBulkImportCharacter] = useState('');
  const [bulkImportPriority, setBulkImportPriority] = useState(1);
  const [bulkImportActive, setBulkImportActive] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('tips'); // tips, analytics, engagement

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsCharacter, setAnalyticsCharacter] = useState('');

  // Engagement state
  const [engagement, setEngagement] = useState(null);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [engagementDays, setEngagementDays] = useState(30);

  // Form state
  const [tipForm, setTipForm] = useState({
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
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(characterFilter && { character_id: characterFilter }),
        ...(activeFilter !== '' && { is_active: activeFilter === 'true' })
      };

      const response = await adminAPI.getTips(params);
      setTips(response.tips || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tips:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await adminAPI.getAICharacters({ is_active: true });
      setCharacters(response.characters || response.items || []);
    } catch (err) {
      console.error('Error fetching characters:', err);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const params = {
        days: analyticsDays,
        ...(analyticsCharacter && { character_id: analyticsCharacter })
      };
      const data = await adminAPI.getTipsAnalytics(params);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchEngagement = async () => {
    setEngagementLoading(true);
    try {
      const params = { days: engagementDays };
      const data = await adminAPI.getTipsEngagement(params);
      setEngagement(data);
    } catch (err) {
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
    setShowTipModal(true);
  };

  const handleEditTip = (tip) => {
    setEditingTip(tip);
    setTipForm({
      content: tip.content,
      ai_character_id: tip.ai_character_id || '',
      is_active: tip.is_active,
      priority: tip.priority
    });
    setShowTipModal(true);
  };

  const handleSaveTip = async () => {
    try {
      const data = {
        content: tipForm.content,
        ...(tipForm.ai_character_id && { ai_character_id: tipForm.ai_character_id }),
        is_active: tipForm.is_active,
        priority: parseInt(tipForm.priority)
      };

      if (editingTip) {
        await adminAPI.updateTip(editingTip.id, data);
      } else {
        await adminAPI.createTip(data);
      }

      setShowTipModal(false);
      fetchTips();
    } catch (err) {
      alert(`Error saving tip: ${err.message}`);
    }
  };

  const handleDeleteTip = async () => {
    if (!deletingTip) return;

    try {
      await adminAPI.deleteTip(deletingTip.id);
      setShowDeleteModal(false);
      setDeletingTip(null);
      fetchTips();
    } catch (err) {
      alert(`Error deleting tip: ${err.message}`);
    }
  };

  const handleToggleActive = async (tip) => {
    try {
      await adminAPI.updateTip(tip.id, { is_active: !tip.is_active });
      fetchTips();
    } catch (err) {
      alert(`Error updating tip: ${err.message}`);
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
      setShowBulkModal(false);
      setSelectedTips([]);
      setBulkAction('');
      setBulkCharacterId('');
      fetchTips();
    } catch (err) {
      alert(`Error performing bulk action: ${err.message}`);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;

    try {
      // Split by newlines and filter out empty lines
      const lines = bulkImportText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        alert('Please enter at least one tip');
        return;
      }

      // Create array of tip objects
      const tips = lines.map(content => ({
        content,
        ...(bulkImportCharacter && { ai_character_id: bulkImportCharacter }),
        is_active: bulkImportActive,
        priority: parseInt(bulkImportPriority)
      }));

      // Call bulk create API
      await adminAPI.bulkCreateTips(tips);

      // Close modal and reset form
      setShowBulkImportModal(false);
      setBulkImportText('');
      setBulkImportCharacter('');
      setBulkImportPriority(1);
      setBulkImportActive(true);

      // Refresh tips list
      fetchTips();

      alert(`Successfully created ${lines.length} tip${lines.length > 1 ? 's' : ''}`);
    } catch (err) {
      alert(`Error importing tips: ${err.message}`);
    }
  };

  const getBulkImportPreviewCount = () => {
    if (!bulkImportText.trim()) return 0;
    return bulkImportText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0).length;
  };

  const toggleSelectTip = (tipId) => {
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
      setSelectedTips(tips.map(t => t.id));
    }
  };

  const getCharacterName = (characterId) => {
    if (!characterId) return 'Unassigned';
    const character = characters.find(c => c.id === characterId);
    return character ? character.name : 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
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

                <select
                  value={characterFilter}
                  onChange={(e) => {
                    setCharacterFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Characters</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>

                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateTip}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                >
                  Create Tip
                </button>

                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Bulk Import
                </button>

                {selectedTips.length > 0 && (
                  <button
                    onClick={() => setShowBulkModal(true)}
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
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
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
                        {tips.map(tip => (
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
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {getCharacterName(tip.ai_character_id)}
                              </span>
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
                                {formatDate(tip.created_at)}
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
                                  onClick={() => {
                                    setDeletingTip(tip);
                                    setShowDeleteModal(true);
                                  }}
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
                        <select
                          value={perPage}
                          onChange={(e) => {
                            setPerPage(parseInt(e.target.value));
                            setPage(1);
                          }}
                          className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                        >
                          <option value="10">10 per page</option>
                          <option value="20">20 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
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
              <select
                value={analyticsDays}
                onChange={(e) => setAnalyticsDays(parseInt(e.target.value))}
                className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 365 days</option>
              </select>

              <select
                value={analyticsCharacter}
                onChange={(e) => setAnalyticsCharacter(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              >
                <option value="">All Characters</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
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
                      {analytics.analytics?.map((item, index) => (
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
            <select
              value={engagementDays}
              onChange={(e) => setEngagementDays(parseInt(e.target.value))}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 365 days</option>
            </select>
          </div>

          {engagementLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
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
      {showTipModal && (
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
                <select
                  value={tipForm.ai_character_id}
                  onChange={(e) => setTipForm({ ...tipForm, ai_character_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">Unassigned</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
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
                onClick={() => setShowTipModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingTip && (
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
                "{truncateText(deletingTip.content, 100)}"
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingTip(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
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
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">Select action...</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="assign">Assign to Character</option>
                  <option value="delete">Delete</option>
                </select>
              </div>

              {bulkAction === 'assign' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Character
                  </label>
                  <select
                    value={bulkCharacterId}
                    onChange={(e) => setBulkCharacterId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  >
                    <option value="">Select character...</option>
                    {characters.map(char => (
                      <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                  </select>
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
                  setShowBulkModal(false);
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
      {showBulkImportModal && (
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
                  placeholder="Enter tips, one per line...&#10;Example:&#10;Always start with a strong opening in your proposals&#10;Research the client's business before applying&#10;Highlight your unique value proposition"
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
                <select
                  value={bulkImportCharacter}
                  onChange={(e) => setBulkImportCharacter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">Unassigned</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
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
                  setShowBulkImportModal(false);
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
