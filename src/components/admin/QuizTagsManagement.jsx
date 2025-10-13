import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import quizAPI from '../../services/quizAPI';
import adminAPI from '../../services/adminAPI';
import { ICON_OPTIONS, getIconPath } from '../../utils/iconUtils';

export default function QuizTagsManagement() {
  const { darkMode } = useOutletContext();

  // Main state
  const [tags, setTags] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Modal states
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTag, setDeletingTag] = useState(null);
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  // Bulk update states
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [applyStatusChange, setApplyStatusChange] = useState(false);
  const [applyPlanChange, setApplyPlanChange] = useState(false);
  const [bulkUpdateForm, setBulkUpdateForm] = useState({
    is_active: true,
    subscription_plan_ids: []
  });
  const [bulkUpdateResult, setBulkUpdateResult] = useState(null);

  // Bulk delete states
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState(null);

  // Form state
  const [tagForm, setTagForm] = useState({
    name: '',
    description: '',
    icon: '',
    subscription_plan_ids: [],
    is_active: true
  });

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchTags();
  }, [page, perPage, search, activeFilter, planFilter]);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Close icon dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showIconDropdown && !event.target.closest('.icon-dropdown-container')) {
        setShowIconDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showIconDropdown]);

  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(activeFilter !== '' && { is_active: activeFilter === 'true' }),
        ...(planFilter && { subscription_plan_id: planFilter })
      };

      const response = await quizAPI.getQuizTags(params);
      // Handle both direct array response and paginated object response
      const tagsArray = Array.isArray(response) ? response : (response.tags || response.items || []);
      setTags(tagsArray);
      setTotal(Array.isArray(response) ? response.length : (response.total || 0));
      setTotalPages(Array.isArray(response) ? 1 : (response.total_pages || 1));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching quiz tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await adminAPI.getPlans();
      setPlans(response.plans || response.items || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const handleCreateTag = () => {
    setEditingTag(null);
    setTagForm({
      name: '',
      description: '',
      icon: '',
      subscription_plan_ids: [],
      is_active: true
    });
    setShowTagModal(true);
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);

    // Extract plan IDs from the plans array if available, otherwise use subscription_plan_ids
    const planIds = tag.plans && tag.plans.length > 0
      ? tag.plans.map(p => p.id)
      : (tag.subscription_plan_ids || []);

    setTagForm({
      name: tag.name,
      description: tag.description || '',
      icon: tag.icon || '',
      subscription_plan_ids: planIds,
      is_active: tag.is_active
    });
    setShowTagModal(true);
  };

  const handleSaveTag = async () => {
    try {
      const data = {
        name: tagForm.name,
        icon: tagForm.icon,
        description: tagForm.description || undefined,
        subscription_plan_ids: tagForm.subscription_plan_ids,
        is_active: tagForm.is_active
      };

      if (editingTag) {
        await quizAPI.updateQuizTag(editingTag.id, data);
      } else {
        await quizAPI.createQuizTag(data);
      }

      setShowTagModal(false);
      fetchTags();
    } catch (err) {
      alert(`Error saving tag: ${err.message}`);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;

    try {
      await quizAPI.deleteQuizTag(deletingTag.id);
      setShowDeleteModal(false);
      setDeletingTag(null);
      fetchTags();
    } catch (err) {
      alert(`Error deleting tag: ${err.message}`);
    }
  };

  const handleToggleActive = async (tag) => {
    // Optimistically update local state
    setTags(prevTags =>
      prevTags.map(t =>
        t.id === tag.id ? { ...t, is_active: !t.is_active } : t
      )
    );

    try {
      await quizAPI.updateQuizTag(tag.id, { is_active: !tag.is_active });
    } catch (err) {
      // Revert on error
      setTags(prevTags =>
        prevTags.map(t =>
          t.id === tag.id ? { ...t, is_active: !t.is_active } : t
        )
      );
      alert(`Error updating tag: ${err.message}`);
    }
  };

  const getPlanNames = (tag) => {
    // Backend returns plans as an array of plan objects, not IDs
    if (tag.plans && tag.plans.length > 0) {
      return tag.plans.map(p => p.name).join(', ');
    }
    // Fallback to old format if subscription_plan_ids is provided
    if (tag.subscription_plan_ids && tag.subscription_plan_ids.length > 0) {
      const names = tag.subscription_plan_ids.map(id => {
        const plan = plans.find(p => p.id === id);
        return plan ? plan.name : 'Unknown';
      });
      return names.join(', ');
    }
    return 'No plans assigned';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTagIds(tags.map(tag => tag.id));
    } else {
      setSelectedTagIds([]);
    }
  };

  const handleSelectTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleClearSelection = () => {
    setSelectedTagIds([]);
  };

  const handleOpenBulkUpdate = () => {
    setBulkUpdateForm({
      is_active: true,
      subscription_plan_ids: []
    });
    setApplyStatusChange(false);
    setApplyPlanChange(false);
    setBulkUpdateResult(null);
    setShowBulkUpdateModal(true);
  };

  const handleBulkUpdate = async () => {
    if (!applyStatusChange && !applyPlanChange) {
      alert('Please select at least one field to update');
      return;
    }

    if (selectedTagIds.length > 100) {
      alert('Maximum 100 tags can be updated at once');
      return;
    }

    try {
      // Build the update data
      const updateData = {
        tags: selectedTagIds.map(tagId => {
          const update = { tag_id: tagId };
          if (applyStatusChange) {
            update.is_active = bulkUpdateForm.is_active;
          }
          if (applyPlanChange) {
            update.subscription_plan_ids = bulkUpdateForm.subscription_plan_ids;
          }
          return update;
        })
      };

      const result = await quizAPI.bulkUpdateQuizTags(updateData);
      setBulkUpdateResult(result);

      // If all successful, clear selection and close modal after delay
      if (result.failed === 0) {
        setTimeout(() => {
          setShowBulkUpdateModal(false);
          setSelectedTagIds([]);
          fetchTags();
        }, 2000);
      } else {
        // If some failed, just refresh the list
        fetchTags();
      }
    } catch (err) {
      alert(`Bulk update failed: ${err.message}`);
    }
  };

  const getSelectedTags = () => {
    return tags.filter(tag => selectedTagIds.includes(tag.id));
  };

  // Bulk delete handlers
  const handleOpenBulkDelete = () => {
    setBulkDeleteResult(null);
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteTags = async () => {
    if (selectedTagIds.length > 100) {
      alert('Maximum 100 tags can be deleted at once');
      return;
    }

    try {
      const result = await quizAPI.bulkDeleteQuizTags({
        tag_ids: selectedTagIds
      });
      setBulkDeleteResult(result);

      // If all successful, clear selection and close modal after delay
      if (result.failed === 0) {
        setTimeout(() => {
          setShowBulkDeleteModal(false);
          setSelectedTagIds([]);
          fetchTags();
        }, 2000);
      } else {
        // If some failed, just refresh the list
        fetchTags();
      }
    } catch (err) {
      alert(`Bulk delete failed: ${err.message}`);
    }
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Quiz Tags Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage quiz tags and assign them to subscription plans
        </p>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Tags</div>
            <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {total}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Active Tags</div>
            <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {tags.filter(t => t.is_active).length}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Plans</div>
            <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {plans.length}
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

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

            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              <option value="">All Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateTag}
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
            >
              Create Tag
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTagIds.length > 0 && (
        <div className="px-6 pb-4">
          <div className={`p-4 rounded-lg border flex items-center justify-between ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
              </span>
              {selectedTagIds.length > 100 && (
                <span className="text-sm text-red-600">
                  Warning: Maximum 100 tags can be updated at once
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenBulkUpdate}
                disabled={selectedTagIds.length > 100}
                className={`px-4 py-2 rounded-lg ${
                  selectedTagIds.length <= 100
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Bulk Update
              </button>
              <button
                onClick={handleOpenBulkDelete}
                disabled={selectedTagIds.length > 100}
                className={`px-4 py-2 rounded-lg ${
                  selectedTagIds.length <= 100
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Bulk Delete
              </button>
              <button
                onClick={handleClearSelection}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Table */}
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
                          checked={tags.length > 0 && selectedTagIds.length === tags.length}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Name
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Description
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Associated Plans
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Quizzes
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
                    {tags.map(tag => (
                      <tr key={tag.id} className={selectedTagIds.includes(tag.id) ? (darkMode ? 'bg-zenible-primary bg-opacity-10' : 'bg-blue-50') : ''}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTagIds.includes(tag.id)}
                            onChange={() => handleSelectTag(tag.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon)} />
                            </svg>
                            <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {tag.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {tag.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {getPlanNames(tag)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text' : 'bg-gray-100 text-gray-700'}`}>
                            {tag.quiz_count || 0} quizzes
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(tag)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              tag.is_active ? 'bg-zenible-primary' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                tag.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            {formatDate(tag.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTag(tag)}
                              className="text-zenible-primary hover:opacity-80"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeletingTag(tag);
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

      {/* Create/Edit Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {editingTag ? 'Edit Quiz Tag' : 'Create Quiz Tag'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={tagForm.name}
                  onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Enter tag name..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={tagForm.description}
                  onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Enter tag description..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Icon *
                </label>
                <div className="relative icon-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setShowIconDropdown(!showIconDropdown)}
                    className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  >
                    <div className="flex items-center gap-2">
                      {tagForm.icon ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tagForm.icon)} />
                          </svg>
                          <span>{ICON_OPTIONS.find(opt => opt.value === tagForm.icon)?.label || 'Selected icon'}</span>
                        </>
                      ) : (
                        <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>Select an icon...</span>
                      )}
                    </div>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showIconDropdown && (
                    <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-64 overflow-y-auto ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                      {ICON_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setTagForm({ ...tagForm, icon: option.value });
                            setShowIconDropdown(false);
                          }}
                          className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-opacity-50 transition-colors ${
                            tagForm.icon === option.value
                              ? darkMode ? 'bg-zenible-primary bg-opacity-20' : 'bg-blue-50'
                              : darkMode ? 'hover:bg-zenible-dark-border' : 'hover:bg-gray-50'
                          }`}
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(option.value)} />
                          </svg>
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Choose a Heroicon for this quiz tag
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Associated Plans
                </label>
                <p className={`text-xs mb-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Hold Ctrl (Cmd on Mac) to select multiple plans
                </p>
                <select
                  multiple
                  size="5"
                  value={tagForm.subscription_plan_ids}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setTagForm({ ...tagForm, subscription_plan_ids: selected });
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={tagForm.is_active}
                  onChange={(e) => setTagForm({ ...tagForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Active
                </label>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleSaveTag}
                disabled={!tagForm.name || !tagForm.icon}
                className={`px-4 py-2 rounded-lg ${
                  tagForm.name && tagForm.icon
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingTag ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowTagModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete the tag "{deletingTag.name}"?
              </p>
              {deletingTag.quiz_count > 0 && (
                <p className={`mt-2 text-sm text-yellow-600`}>
                  Warning: This tag is associated with {deletingTag.quiz_count} quiz(zes). Deleting it may affect those quizzes.
                </p>
              )}
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleDeleteTag}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingTag(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className={`w-full max-w-2xl mx-4 my-8 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Bulk Update Quiz Tags ({selectedTagIds.length} selected)
              </h3>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Status Update Section */}
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="apply_status"
                    checked={applyStatusChange}
                    onChange={(e) => setApplyStatusChange(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="apply_status" className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Update Status
                  </label>
                </div>
                {applyStatusChange && (
                  <div className="flex gap-4 ml-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        checked={bulkUpdateForm.is_active === true}
                        onChange={() => setBulkUpdateForm({ ...bulkUpdateForm, is_active: true })}
                        className="rounded-full"
                      />
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        checked={bulkUpdateForm.is_active === false}
                        onChange={() => setBulkUpdateForm({ ...bulkUpdateForm, is_active: false })}
                        className="rounded-full"
                      />
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>Inactive</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Plans Update Section */}
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="apply_plans"
                    checked={applyPlanChange}
                    onChange={(e) => setApplyPlanChange(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="apply_plans" className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Update Associated Plans
                  </label>
                </div>
                {applyPlanChange && (
                  <div className="ml-6 space-y-2">
                    <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Hold Ctrl (Cmd on Mac) to select multiple plans. This will replace existing plan assignments.
                    </p>
                    <select
                      multiple
                      size="5"
                      value={bulkUpdateForm.subscription_plan_ids}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setBulkUpdateForm({ ...bulkUpdateForm, subscription_plan_ids: selected });
                      }}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300'}`}
                    >
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Selected Tags Preview */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Selected Tags ({selectedTagIds.length}):
                </label>
                <div className={`p-3 rounded-lg border max-h-40 overflow-y-auto ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
                  <ul className="space-y-1">
                    {getSelectedTags().slice(0, 10).map(tag => (
                      <li key={tag.id} className={`text-sm flex items-center gap-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon)} />
                        </svg>
                        {tag.name}
                      </li>
                    ))}
                    {selectedTagIds.length > 10 && (
                      <li className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        + {selectedTagIds.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Bulk Update Results */}
              {bulkUpdateResult && (
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-white border-gray-300'}`}>
                  <h5 className={`font-medium text-sm mb-3 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Update Results
                  </h5>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Total:
                      </p>
                      <p className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {bulkUpdateResult.total_submitted}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Successful:
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        {bulkUpdateResult.successful}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Failed:
                      </p>
                      <p className="text-lg font-semibold text-red-600">
                        {bulkUpdateResult.failed}
                      </p>
                    </div>
                  </div>

                  {/* Failed Tags */}
                  {bulkUpdateResult.failed > 0 && (
                    <div className={`p-3 rounded border ${darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                      <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                        Failed Updates:
                      </p>
                      <ul className="space-y-1">
                        {bulkUpdateResult.results
                          .filter(r => !r.success)
                          .map((result) => {
                            const tag = tags.find(t => t.id === result.tag_id);
                            return (
                              <li key={result.tag_id} className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                                {tag ? tag.name : result.tag_id}: {result.error}
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  )}

                  {/* Success Message */}
                  {bulkUpdateResult.failed === 0 && (
                    <div className={`p-3 rounded border ${darkMode ? 'bg-green-900 bg-opacity-20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                      <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                        ✓ All tags updated successfully! Closing...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleBulkUpdate}
                disabled={(!applyStatusChange && !applyPlanChange) || bulkUpdateResult?.failed === 0}
                className={`px-4 py-2 rounded-lg ${
                  (applyStatusChange || applyPlanChange) && bulkUpdateResult?.failed !== 0
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Update Tags
              </button>
              <button
                onClick={() => {
                  setShowBulkUpdateModal(false);
                  setBulkUpdateResult(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                {bulkUpdateResult ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Bulk Delete
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {!bulkDeleteResult ? (
                <>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900 bg-opacity-20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                      Warning: This action cannot be undone!
                    </p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      You are about to delete {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''}.
                      This will remove all tag associations with quizzes but will not delete the quizzes themselves.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      Selected Tags ({getSelectedTags().length}):
                    </h4>
                    <div className={`max-h-60 overflow-y-auto rounded-lg border ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                      <ul className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'}`}>
                        {getSelectedTags().map(tag => (
                          <li key={tag.id} className={`px-4 py-3 ${darkMode ? 'hover:bg-zenible-dark-border' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon)} />
                              </svg>
                              <div className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {tag.name}
                              </div>
                            </div>
                            <div className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                              {tag.quiz_count || 0} associated quiz{(tag.quiz_count || 0) !== 1 ? 'zes' : ''}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    bulkDeleteResult.failed === 0
                      ? (darkMode ? 'bg-green-900 bg-opacity-20 border-green-700' : 'bg-green-50 border-green-200')
                      : (darkMode ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' : 'bg-yellow-50 border-yellow-200')
                  }`}>
                    <p className={`font-medium ${
                      bulkDeleteResult.failed === 0
                        ? (darkMode ? 'text-green-400' : 'text-green-800')
                        : (darkMode ? 'text-yellow-400' : 'text-yellow-800')
                    }`}>
                      {bulkDeleteResult.failed === 0
                        ? '✓ All tags deleted successfully!'
                        : `⚠️ Partial success: ${bulkDeleteResult.successful} of ${bulkDeleteResult.total_submitted} tags deleted`
                      }
                    </p>
                  </div>

                  {bulkDeleteResult.failed > 0 && bulkDeleteResult.results && (
                    <div className="space-y-2">
                      <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        Failed Deletions ({bulkDeleteResult.results.filter(r => !r.success).length}):
                      </h4>
                      <div className={`max-h-60 overflow-y-auto rounded-lg border ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                        <ul className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'}`}>
                          {bulkDeleteResult.results
                            .filter(r => !r.success)
                            .map((result, index) => {
                              const tag = tags.find(t => t.id === result.tag_id);
                              return (
                                <li key={index} className={`px-4 py-3 ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
                                  <div className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                    {tag ? tag.name : result.tag_id}
                                  </div>
                                  <div className="text-sm mt-1 text-red-600">
                                    {result.error || 'Unknown error'}
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              {!bulkDeleteResult ? (
                <>
                  <button
                    onClick={handleBulkDeleteTags}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete {selectedTagIds.length} Tag{selectedTagIds.length !== 1 ? 's' : ''}
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    setBulkDeleteResult(null);
                    if (bulkDeleteResult.failed === 0) {
                      setSelectedTagIds([]);
                    }
                  }}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
