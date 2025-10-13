import React from 'react';
import ResourceFormModal from './ResourceFormModal';
import coursesAPI from '../../../services/coursesAPI';

const ResourceListModal = ({
  show,
  onClose,
  selectedCourse,
  selectedModule,
  resources,
  resourcesLoading,
  onCreateResource,
  onEditResource,
  onDeleteResource,
  showResourceModal,
  setShowResourceModal,
  editingResource,
  resourceForm,
  setResourceForm,
  onSaveResource,
  showDeleteResourceModal,
  setShowDeleteResourceModal,
  deletingResource,
  setDeletingResource,
  resourceTypes,
  darkMode
}) => {
  if (!show || !selectedCourse || !selectedModule) return null;

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getResourceTypeInfo = (resourceType) => {
    return coursesAPI.getResourceTypeInfo(resourceType);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <>
      {/* Resources Management Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-6xl max-h-[85vh] overflow-hidden rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Manage Resources: {selectedModule.title}
            </h3>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Course: {selectedCourse.title}
            </p>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            <div className="mb-4">
              <button
                onClick={onCreateResource}
                className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
              >
                Add Resource
              </button>
            </div>

            {resourcesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
              </div>
            ) : resources.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Order
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Type
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Title
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Duration
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Required
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Active
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                    {resources.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((resource) => {
                      const typeInfo = getResourceTypeInfo(resource.resource_type);
                      return (
                        <tr key={resource.id}>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {resource.order_index}
                          </td>
                          <td className={`px-4 py-3`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${typeInfo.color.bg} ${typeInfo.color.text}`}>
                              <span>{typeInfo.icon}</span>
                              <span>{typeInfo.label}</span>
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            <div className="font-medium">{resource.title}</div>
                            {resource.description && (
                              <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                                {truncateText(resource.description, 60)}
                              </div>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {formatDuration(resource.duration_minutes)}
                          </td>
                          <td className={`px-4 py-3`}>
                            {resource.is_required ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Required</span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Optional</span>
                            )}
                          </td>
                          <td className={`px-4 py-3`}>
                            {resource.is_active ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Active</span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Inactive</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => onEditResource(resource)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingResource(resource);
                                  setShowDeleteResourceModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                No resources yet. Click "Add Resource" to create one.
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

      {/* Create/Edit Resource Modal */}
      {showResourceModal && (
        <ResourceFormModal
          show={showResourceModal}
          onClose={() => setShowResourceModal(false)}
          editingResource={editingResource}
          resourceForm={resourceForm}
          setResourceForm={setResourceForm}
          onSaveResource={onSaveResource}
          resourceTypes={resourceTypes}
          darkMode={darkMode}
        />
      )}

      {/* Delete Resource Modal */}
      {showDeleteResourceModal && deletingResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete Resource
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete this resource?
              </p>
              <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                "{deletingResource.title}"
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={onDeleteResource}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteResourceModal(false);
                  setDeletingResource(null);
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

export default ResourceListModal;
