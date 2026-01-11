import React from 'react';
import { Trash2, Edit, X } from 'lucide-react';

/**
 * BulkActionBar Component
 * Fixed bottom bar showing bulk action buttons when expenses are selected
 */
const BulkActionBar = ({
  selectedCount,
  onBulkDelete,
  onBulkUpdateCategory,
  onClearSelection,
  loading = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 design-bg-primary border-t design-border shadow-lg animate-slide-up">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="design-text-primary font-medium">
              {selectedCount} expense{selectedCount > 1 ? 's' : ''} selected
            </div>
            <button
              onClick={onClearSelection}
              disabled={loading}
              className="text-sm design-text-secondary hover:design-text-primary disabled:opacity-50 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBulkUpdateCategory}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary disabled:opacity-50 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Update Category
            </button>
            <button
              onClick={onBulkDelete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 dark:bg-red-700 dark:hover:bg-red-800"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionBar;
