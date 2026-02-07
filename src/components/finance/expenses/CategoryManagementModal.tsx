import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FolderPlus, X, Check, Loader2, Tag } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useNotification } from '../../../contexts/NotificationContext';
import Modal from '../../ui/modal/Modal';

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ open, onOpenChange }) => {
  const { categories, createCategory, updateCategory, deleteCategory, refreshCategories } = useExpenses() as any;
  const { showSuccess, showError, showConfirm } = useNotification() as any;

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name, description });
        showSuccess('Category updated successfully');
      } else {
        await createCategory({ name, description });
        showSuccess('Category created successfully');
      }
      handleReset();
      refreshCategories();
    } catch (error: any) {
      showError(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setShowForm(true);
  };

  const handleDelete = async (category: any) => {
    const confirmed = await showConfirm(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
    );
    if (confirmed) {
      try {
        await deleteCategory(category.id);
        showSuccess('Category deleted successfully');
        refreshCategories();
      } catch (error: any) {
        showError(error.message || 'Failed to delete category');
      }
    }
  };

  const handleReset = () => {
    setShowForm(false);
    setEditingCategory(null);
    setName('');
    setDescription('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title=""
      size="lg"
      showCloseButton={false}
    >
      {/* Custom Header */}
      <div className="-m-6 mb-0">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Expense Categories
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Organize your expenses with custom categories
              </p>
            </div>
            <button
              onClick={() => handleOpenChange(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Add/Edit Form */}
          {showForm ? (
            <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  {editingCategory ? (
                    <Edit2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <FolderPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      placeholder="e.g., Office Supplies, Travel, Software"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                      placeholder="Brief description of what this category is for..."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !name.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          {editingCategory ? 'Update' : 'Create'} Category
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full mb-6 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Add New Category</span>
              </div>
            </button>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categories ({categories.length})
              </h3>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No categories yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Create your first category to start organizing your expenses.
                </p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 -mr-1">
                {categories.map((category: any) => (
                  <div
                    key={category.id}
                    className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {category.name}
                      </h4>
                      {category.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-end">
            <button
              onClick={() => handleOpenChange(false)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryManagementModal;
