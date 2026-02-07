import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: any | null;
  categories: any[];
  onSave: () => void;
  darkMode: boolean;
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  category,
  categories,
  onSave,
  darkMode
}: CategoryFormModalProps) {
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 1
  });

  // Initialize form when modal opens or category changes
  useEffect(() => {
    if (!isOpen) return;

    if (category) {
      setCategoryForm({
        name: category.name || '',
        description: category.description || '',
        display_order: category.display_order || 1
      });
    } else {
      setCategoryForm({
        name: '',
        description: '',
        display_order: 1
      });
    }
  }, [isOpen, category]);

  const handleSaveCategory = async () => {
    try {
      if (category) {
        await adminAPI.updateAICharacterCategory(category.id, categoryForm);
      } else {
        await adminAPI.createAICharacterCategory(categoryForm);
      }

      onClose();
      onSave();
    } catch (err: any) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId: any) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await adminAPI.deleteAICharacterCategory(categoryId);
        onSave();
      } catch (err: any) {
        alert(`Error deleting category: ${err.message}`);
      }
    }
  };

  const handleEditCategory = (cat: any) => {
    setCategoryForm({
      name: cat.name || '',
      description: cat.description || '',
      display_order: cat.display_order || 1
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-lg w-full rounded-lg p-6 ${
        darkMode ? 'bg-zenible-dark-card' : 'bg-white'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${
          darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
        }`}>
          Manage Categories
        </h2>

        <div className="space-y-4 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Category Name *
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="e.g., Customer Service"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Description
            </label>
            <input
              type="text"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Brief description..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Display Order
            </label>
            <input
              type="number"
              value={categoryForm.display_order}
              onChange={(e) => setCategoryForm({...categoryForm, display_order: parseInt(e.target.value)})}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="1"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mb-4">
            <h3 className={`text-sm font-medium mb-2 ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
            }`}>
              Existing Categories
            </h3>
            <div className={`border rounded-lg divide-y ${
              darkMode
                ? 'border-zenible-dark-border divide-zenible-dark-border'
                : 'border-gray-200 divide-gray-200'
            }`}>
              {Array.isArray(categories) && categories.sort((a, b) => a.display_order - b.display_order).map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2">
                  <div>
                    <div className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                    }`}>
                      {cat.name}
                    </div>
                    <div className={`text-xs ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      {cat.description}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(cat)}
                      className={`text-sm ${
                        darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className={`text-sm ${
                        darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded-lg ${
              darkMode
                ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Close
          </button>
          <button
            onClick={handleSaveCategory}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
          >
            {category ? 'Update' : 'Create'} Category
          </button>
        </div>
      </div>
    </div>
  );
}
