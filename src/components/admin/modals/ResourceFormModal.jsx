import React from 'react';

const ResourceFormModal = ({
  show,
  onClose,
  editingResource,
  resourceForm,
  setResourceForm,
  onSaveResource,
  resourceTypes,
  darkMode
}) => {
  if (!show) return null;

  // Helper to get field labels based on resource type
  const getContentUrlLabel = () => {
    switch (resourceForm.resource_type) {
      case 'video':
        return 'Video URL';
      case 'pdf':
        return 'PDF URL';
      case 'link':
        return 'External Link URL';
      default:
        return 'Content URL';
    }
  };

  const getContentUrlPlaceholder = () => {
    switch (resourceForm.resource_type) {
      case 'video':
        return 'https://youtube.com/watch?v=... or https://vimeo.com/...';
      case 'pdf':
        return 'https://example.com/document.pdf';
      case 'link':
        return 'https://example.com/external-resource';
      default:
        return 'https://...';
    }
  };

  // Determine if we should show content_url or content_text
  const showContentUrl = resourceForm.resource_type !== 'rich_text';
  const showContentText = resourceForm.resource_type === 'rich_text';

  // Validation
  const isValid = resourceForm.title &&
                  (showContentUrl ? resourceForm.content_url : true) &&
                  (showContentText ? resourceForm.content_text : true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b sticky top-0 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            {editingResource ? 'Edit Resource' : 'Create Resource'}
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Resource Type Selector */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Resource Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {resourceTypes.map(type => {
                const typeInfo = getResourceTypeInfo(type);
                const isSelected = resourceForm.resource_type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setResourceForm({ ...resourceForm, resource_type: type })}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-zenible-primary bg-zenible-primary bg-opacity-10'
                        : darkMode
                          ? 'border-zenible-dark-border hover:border-zenible-primary'
                          : 'border-neutral-200 hover:border-zenible-primary'
                    }`}
                  >
                    <div className="text-2xl mb-1">{typeInfo.icon}</div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {typeInfo.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Title *
            </label>
            <input
              type="text"
              value={resourceForm.title}
              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder="Resource title"
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              value={resourceForm.description}
              onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder="Brief description of the resource"
            />
          </div>

          {/* Content URL (for video, pdf, link) */}
          {showContentUrl && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                {getContentUrlLabel()} *
              </label>
              <input
                type="url"
                value={resourceForm.content_url}
                onChange={(e) => setResourceForm({ ...resourceForm, content_url: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder={getContentUrlPlaceholder()}
              />
            </div>
          )}

          {/* Content Text (for rich_text) */}
          {showContentText && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Content *
              </label>
              <textarea
                value={resourceForm.content_text}
                onChange={(e) => setResourceForm({ ...resourceForm, content_text: e.target.value })}
                rows={8}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder="Rich text content (supports Markdown)"
              />
            </div>
          )}

          {/* Duration and Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={resourceForm.duration_minutes}
                onChange={(e) => setResourceForm({ ...resourceForm, duration_minutes: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder="e.g., 15"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Order Index *
              </label>
              <input
                type="number"
                min="1"
                value={resourceForm.order_index}
                onChange={(e) => setResourceForm({ ...resourceForm, order_index: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              />
            </div>
          </div>

          {/* Resource Metadata (optional JSON) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Resource Metadata (JSON)
            </label>
            <textarea
              value={resourceForm.resource_metadata}
              onChange={(e) => setResourceForm({ ...resourceForm, resource_metadata: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder='{"key": "value"}'
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Optional: Additional metadata in JSON format
            </p>
          </div>

          {/* Checkboxes */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="resource_is_required"
                checked={resourceForm.is_required}
                onChange={(e) => setResourceForm({ ...resourceForm, is_required: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="resource_is_required" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Required
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="resource_is_active"
                checked={resourceForm.is_active}
                onChange={(e) => setResourceForm({ ...resourceForm, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="resource_is_active" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Active
              </label>
            </div>
          </div>
        </div>

        <div className={`px-6 py-4 border-t flex gap-2 sticky bottom-0 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <button
            onClick={onSaveResource}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg ${
              isValid
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {editingResource ? 'Update' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get resource type info
const getResourceTypeInfo = (resourceType) => {
  const types = {
    video: {
      icon: '🎥',
      label: 'Video'
    },
    pdf: {
      icon: '📄',
      label: 'PDF'
    },
    rich_text: {
      icon: '📝',
      label: 'Content'
    },
    link: {
      icon: '🔗',
      label: 'Link'
    }
  };
  return types[resourceType] || { icon: '📦', label: 'Unknown' };
};

export default ResourceFormModal;
