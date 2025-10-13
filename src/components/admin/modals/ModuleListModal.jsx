import React from 'react';
import RichTextEditor from '../../shared/RichTextEditor';

const ModuleListModal = ({
  show,
  onClose,
  selectedCourse,
  modules,
  modulesLoading,
  onCreateModule,
  onEditModule,
  onDeleteModule,
  onManageResources,
  showModuleModal,
  setShowModuleModal,
  editingModule,
  moduleForm,
  setModuleForm,
  onSaveModule,
  showDeleteModuleModal,
  setShowDeleteModuleModal,
  deletingModule,
  setDeletingModule,
  darkMode
}) => {
  if (!show || !selectedCourse) return null;

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      {/* Modules Management Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Manage Modules: {selectedCourse.title}
            </h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            <div className="mb-4">
              <button
                onClick={onCreateModule}
                className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
              >
                Add Module
              </button>
            </div>

            {modulesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
              </div>
            ) : modules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Order
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Title
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Duration
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Published
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Resources
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                    {modules.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((module) => (
                      <tr key={module.id}>
                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {module.order_index}
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          <div>{module.title}</div>
                          {module.description && (
                            <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                              {truncateText(module.description, 60)}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {module.duration_minutes ? `${module.duration_minutes} min` : '-'}
                        </td>
                        <td className={`px-4 py-3`}>
                          {module.status === 'published' ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Published</span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Draft</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => onManageResources(selectedCourse, module)}
                            className="text-zenible-primary hover:text-zenible-primary-dark hover:underline"
                          >
                            {module.total_resources || 0} {module.total_resources === 1 ? 'resource' : 'resources'}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onEditModule(module)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeletingModule(module);
                                setShowDeleteModuleModal(true);
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
            ) : (
              <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                No modules yet. Click "Add Module" to create one.
              </div>
            )}
          </div>
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b sticky top-0 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {editingModule ? 'Edit Module' : 'Create Module'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Module title"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Description *
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Content
                </label>
                <RichTextEditor
                  value={moduleForm.content}
                  onChange={(value) => setModuleForm({ ...moduleForm, content: value })}
                  placeholder="Module content (HTML)"
                  darkMode={darkMode}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={moduleForm.video_url}
                    onChange={(e) => setModuleForm({ ...moduleForm, video_url: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Order Index *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={moduleForm.order_index}
                    onChange={(e) => setModuleForm({ ...moduleForm, order_index: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="module_is_published"
                  checked={moduleForm.is_published}
                  onChange={(e) => setModuleForm({ ...moduleForm, is_published: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="module_is_published" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Published
                </label>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 sticky bottom-0 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <button
                onClick={onSaveModule}
                disabled={!moduleForm.title || !moduleForm.description}
                className={`px-4 py-2 rounded-lg ${
                  moduleForm.title && moduleForm.description
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingModule ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowModuleModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Module Modal */}
      {showDeleteModuleModal && deletingModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete Module
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete this module?
              </p>
              <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                "{deletingModule.title}"
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={onDeleteModule}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModuleModal(false);
                  setDeletingModule(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModuleListModal;
