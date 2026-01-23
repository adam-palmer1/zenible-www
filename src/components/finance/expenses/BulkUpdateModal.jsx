import React, { useState } from 'react';
import Modal from '../../ui/modal/Modal';
import { Loader2 } from 'lucide-react';

/**
 * BulkUpdateModal Component
 * Modal for bulk updating category of selected expenses
 */
const BulkUpdateModal = ({
  open,
  onOpenChange,
  selectedCount,
  categories,
  onConfirm,
  loading = false
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const handleConfirm = async () => {
    if (!selectedCategoryId) {
      return;
    }

    await onConfirm({ category_id: selectedCategoryId });
    setSelectedCategoryId('');
  };

  const handleCancel = () => {
    setSelectedCategoryId('');
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Update Category"
      size="md"
      showCloseButton={true}
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Update the category for {selectedCount} selected expense{selectedCount > 1 ? 's' : ''}?
          </p>

          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            New Category
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={loading}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedCategoryId}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update {selectedCount} Expense{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkUpdateModal;
