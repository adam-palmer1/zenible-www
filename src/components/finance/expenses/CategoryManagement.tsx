import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useNotification } from '../../../contexts/NotificationContext';

const CategoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const { categories, createCategory, updateCategory, deleteCategory, refreshCategories } = useExpenses() as any;
  const { showSuccess, showError, showConfirm } = useNotification() as any;

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError('Category name is required');
      return;
    }

    try {
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
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setShowForm(true);
  };

  const handleDelete = async (category: any) => {
    const confirmed = await showConfirm('Delete Category', `Delete category "${category.name}"? This cannot be undone.`);
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/finance/expenses')} className="flex items-center gap-2 design-text-secondary hover:design-text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Expenses</span>
        </button>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </button>
      </div>

      <div className="design-bg-primary rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold design-text-primary mb-6">Expense Categories</h2>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 design-bg-secondary rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Category name" className="w-full px-3 py-2 design-input rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">Description</label>
                <textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Category description" rows={2} className="w-full px-3 py-2 design-input rounded-md resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleReset} className="px-4 py-2 text-sm font-medium design-text-primary design-bg-tertiary rounded-md hover:design-bg-quaternary">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90">
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-center py-8 design-text-secondary">No categories yet. Create one to get started.</p>
          ) : (
            categories.map((category: any) => (
              <div key={category.id} className="flex items-center justify-between p-4 design-bg-secondary rounded-lg hover:design-bg-tertiary transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium design-text-primary">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm design-text-secondary mt-1">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(category)} className="p-2 design-text-secondary hover:design-text-primary" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(category)} className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
