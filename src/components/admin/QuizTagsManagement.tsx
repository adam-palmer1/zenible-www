import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import quizAPI from '../../services/quizAPI';
import adminAPI from '../../services/adminAPI';
import { useModalState } from '../../hooks/useModalState';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { QuizTag, Plan, TagFormState, BulkUpdateFormState, BulkUpdateResult, BulkDeleteResult } from './quiz-tags/types';
import TagStatsCards from './quiz-tags/TagStatsCards';
import TagFiltersBar from './quiz-tags/TagFiltersBar';
import BulkActionsBar from './quiz-tags/BulkActionsBar';
import TagsTable from './quiz-tags/TagsTable';
import TagFormModal from './quiz-tags/TagFormModal';
import DeleteTagModal from './quiz-tags/DeleteTagModal';
import BulkUpdateModal from './quiz-tags/BulkUpdateModal';
import BulkDeleteModal from './quiz-tags/BulkDeleteModal';

export default function QuizTagsManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  // Main state
  const [tags, setTags] = useState<QuizTag[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');

  // Modal states
  const tagModal = useModalState();
  const [editingTag, setEditingTag] = useState<QuizTag | null>(null);
  const deleteConfirmation = useDeleteConfirmation<QuizTag>();
  const [showIconDropdown, setShowIconDropdown] = useState<boolean>(false);

  // Bulk update states
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const bulkUpdateModal = useModalState();
  const [applyStatusChange, setApplyStatusChange] = useState<boolean>(false);
  const [applyPlanChange, setApplyPlanChange] = useState<boolean>(false);
  const [bulkUpdateForm, setBulkUpdateForm] = useState<BulkUpdateFormState>({
    is_active: true,
    subscription_plan_ids: []
  });
  const [bulkUpdateResult, setBulkUpdateResult] = useState<BulkUpdateResult | null>(null);

  // Bulk delete states
  const bulkDeleteModal = useModalState();
  const [bulkDeleteResult, setBulkDeleteResult] = useState<BulkDeleteResult | null>(null);

  // Form state
  const [tagForm, setTagForm] = useState<TagFormState>({
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
    const handleClickOutside = (event: MouseEvent) => {
      if (showIconDropdown && !(event.target as HTMLElement).closest('.icon-dropdown-container')) {
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
      const params: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        ...(search && { search }),
        ...(activeFilter !== '' && { is_active: activeFilter }),
        ...(planFilter && { subscription_plan_id: planFilter })
      };

      const response = await quizAPI.getQuizTags(params) as QuizTag[] | Record<string, unknown>;
      // Handle both direct array response and paginated object response
      const tagsArray = Array.isArray(response) ? response : ((response as Record<string, unknown>).tags as QuizTag[] || (response as Record<string, unknown>).items as QuizTag[] || []);
      setTags(tagsArray);
      setTotal(Array.isArray(response) ? response.length : ((response as Record<string, unknown>).total as number || 0));
      setTotalPages(Array.isArray(response) ? 1 : ((response as Record<string, unknown>).total_pages as number || 1));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Error fetching quiz tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await adminAPI.getPlans() as Record<string, unknown>;
      setPlans((response.plans as Plan[]) || (response.items as Plan[]) || []);
    } catch (err: unknown) {
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
    tagModal.open();
  };

  const handleEditTag = (tag: QuizTag) => {
    setEditingTag(tag);

    // Extract plan IDs from the plans array if available, otherwise use subscription_plan_ids
    const planIds = tag.plans && tag.plans.length > 0
      ? tag.plans.map((p: { id: string; name: string }) => p.id)
      : (tag.subscription_plan_ids || []);

    setTagForm({
      name: tag.name,
      description: tag.description || '',
      icon: tag.icon || '',
      subscription_plan_ids: planIds,
      is_active: tag.is_active
    });
    tagModal.open();
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

      tagModal.close();
      fetchTags();
    } catch (err: unknown) {
      alert(`Error saving tag: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteTag = async () => {
    await deleteConfirmation.confirmDelete(async (tag: QuizTag) => {
      try {
        await quizAPI.deleteQuizTag(tag.id);
        fetchTags();
      } catch (err: unknown) {
        alert(`Error deleting tag: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }
    });
  };

  const handleToggleActive = async (tag: QuizTag) => {
    // Optimistically update local state
    setTags(prevTags =>
      prevTags.map(t =>
        t.id === tag.id ? { ...t, is_active: !t.is_active } : t
      )
    );

    try {
      await quizAPI.updateQuizTag(tag.id, { is_active: !tag.is_active });
    } catch (err: unknown) {
      // Revert on error
      setTags(prevTags =>
        prevTags.map(t =>
          t.id === tag.id ? { ...t, is_active: !t.is_active } : t
        )
      );
      alert(`Error updating tag: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const getPlanNames = (tag: QuizTag) => {
    // Backend returns plans as an array of plan objects, not IDs
    if (tag.plans && tag.plans.length > 0) {
      return tag.plans.map((p: { id: string; name: string }) => p.name).join(', ');
    }
    // Fallback to old format if subscription_plan_ids is provided
    if (tag.subscription_plan_ids && tag.subscription_plan_ids.length > 0) {
      const names = tag.subscription_plan_ids.map((id: string) => {
        const plan = plans.find((p: Plan) => p.id === id);
        return plan ? plan.name : 'Unknown';
      });
      return names.join(', ');
    }
    return 'No plans assigned';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTagIds(tags.map((tag: QuizTag) => tag.id));
    } else {
      setSelectedTagIds([]);
    }
  };

  const handleSelectTag = (tagId: string) => {
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
    bulkUpdateModal.open();
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
          const update: Record<string, string | boolean | string[]> = { tag_id: tagId };
          if (applyStatusChange) {
            update.is_active = bulkUpdateForm.is_active;
          }
          if (applyPlanChange) {
            update.subscription_plan_ids = bulkUpdateForm.subscription_plan_ids;
          }
          return update;
        })
      };

      const result = await quizAPI.bulkUpdateQuizTags(updateData) as BulkUpdateResult;
      setBulkUpdateResult(result);

      // If all successful, clear selection and close modal after delay
      if (result.failed === 0) {
        setTimeout(() => {
          bulkUpdateModal.close();
          setSelectedTagIds([]);
          fetchTags();
        }, 2000);
      } else {
        // If some failed, just refresh the list
        fetchTags();
      }
    } catch (err: unknown) {
      alert(`Bulk update failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Bulk delete handlers
  const handleOpenBulkDelete = () => {
    setBulkDeleteResult(null);
    bulkDeleteModal.open();
  };

  const handleBulkDeleteTags = async () => {
    if (selectedTagIds.length > 100) {
      alert('Maximum 100 tags can be deleted at once');
      return;
    }

    try {
      const result = await quizAPI.bulkDeleteQuizTags({
        tag_ids: selectedTagIds
      }) as BulkDeleteResult;
      setBulkDeleteResult(result);

      // If all successful, clear selection and close modal after delay
      if (result.failed === 0) {
        setTimeout(() => {
          bulkDeleteModal.close();
          setSelectedTagIds([]);
          fetchTags();
        }, 2000);
      } else {
        // If some failed, just refresh the list
        fetchTags();
      }
    } catch (err: unknown) {
      alert(`Bulk delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Quiz Tags Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage quiz tags and assign them to subscription plans
        </p>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <TagStatsCards
          darkMode={darkMode}
          total={total}
          tags={tags}
          plans={plans}
        />

        {/* Filters and Actions */}
        <TagFiltersBar
          darkMode={darkMode}
          search={search}
          setSearch={setSearch}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
          setPage={setPage}
          plans={plans}
          onCreateTag={handleCreateTag}
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedTagIds.length > 0 && (
        <BulkActionsBar
          darkMode={darkMode}
          selectedCount={selectedTagIds.length}
          onBulkUpdate={handleOpenBulkUpdate}
          onBulkDelete={handleOpenBulkDelete}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Tags Table */}
      <TagsTable
        darkMode={darkMode}
        loading={loading}
        error={error}
        tags={tags}
        selectedTagIds={selectedTagIds}
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onSelectAll={handleSelectAll}
        onSelectTag={handleSelectTag}
        onToggleActive={handleToggleActive}
        onEditTag={handleEditTag}
        onRequestDelete={deleteConfirmation.requestDelete}
        getPlanNames={getPlanNames}
        formatDate={formatDate}
        setPage={setPage}
        setPerPage={setPerPage}
      />

      {/* Create/Edit Tag Modal */}
      {tagModal.isOpen && (
        <TagFormModal
          darkMode={darkMode}
          editingTag={editingTag}
          tagForm={tagForm}
          setTagForm={setTagForm}
          showIconDropdown={showIconDropdown}
          setShowIconDropdown={setShowIconDropdown}
          plans={plans}
          onSave={handleSaveTag}
          onClose={() => tagModal.close()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.item && (
        <DeleteTagModal
          darkMode={darkMode}
          tag={deleteConfirmation.item}
          loading={deleteConfirmation.loading}
          onConfirm={handleDeleteTag}
          onCancel={deleteConfirmation.cancelDelete}
        />
      )}

      {/* Bulk Update Modal */}
      {bulkUpdateModal.isOpen && (
        <BulkUpdateModal
          darkMode={darkMode}
          selectedTagIds={selectedTagIds}
          tags={tags}
          plans={plans}
          applyStatusChange={applyStatusChange}
          setApplyStatusChange={setApplyStatusChange}
          applyPlanChange={applyPlanChange}
          setApplyPlanChange={setApplyPlanChange}
          bulkUpdateForm={bulkUpdateForm}
          setBulkUpdateForm={setBulkUpdateForm}
          bulkUpdateResult={bulkUpdateResult}
          onBulkUpdate={handleBulkUpdate}
          onClose={() => {
            bulkUpdateModal.close();
            setBulkUpdateResult(null);
          }}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModal.isOpen && (
        <BulkDeleteModal
          darkMode={darkMode}
          selectedTagIds={selectedTagIds}
          tags={tags}
          bulkDeleteResult={bulkDeleteResult}
          onBulkDelete={handleBulkDeleteTags}
          onClose={() => {
            bulkDeleteModal.close();
            setBulkDeleteResult(null);
            if (bulkDeleteResult?.failed === 0) {
              setSelectedTagIds([]);
            }
          }}
        />
      )}
    </div>
  );
}
