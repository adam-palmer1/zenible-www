import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface SystemFeaturesManagerProps {
  darkMode: boolean;
}

interface DeleteModalState {
  isOpen: boolean;
  feature: any;
}

interface FormData {
  code?: string;
  name: string;
  description: string;
  feature_type?: string;
}

export default function SystemFeaturesManager({ darkMode }: SystemFeaturesManagerProps) {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false, feature: null });
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    feature_type: 'boolean',
  });

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await (adminAPI as any).getSystemFeatures();
      setFeatures(response.features || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFeature(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      feature_type: 'boolean',
    });
    setShowModal(true);
  };

  const handleEdit = (feature: any) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description,
      // Note: code and feature_type cannot be edited
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingFeature) {
        // Only name and description can be updated
        await (adminAPI as any).updateSystemFeature(editingFeature.id, {
          name: formData.name,
          description: formData.description,
        });
      } else {
        await (adminAPI as any).createSystemFeature(formData);
      }
      setShowModal(false);
      fetchFeatures();
    } catch (err: any) {
      alert(`Error saving feature: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.feature) return;
    try {
      await (adminAPI as any).deleteSystemFeature(deleteModal.feature.id);
      setDeleteModal({ isOpen: false, feature: null });
      fetchFeatures();
    } catch (err: any) {
      alert(`Error deleting feature: ${err.message}`);
    }
  };

  const getFeatureTypeBadgeClass = (type: string): string => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (type) {
      case 'BOOLEAN':
        return `${baseClasses} ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`;
      case 'LIMIT':
        return `${baseClasses} ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`;
      case 'LIST':
        return `${baseClasses} ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`;
      default:
        return `${baseClasses} ${darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700'}`;
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
        Error loading system features: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          System Features
        </h3>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark transition-colors"
        >
          Add System Feature
        </button>
      </div>

      <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-sidebar' : 'border-neutral-200 bg-gray-50'}`}>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Code</th>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Name</th>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Type</th>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Description</th>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature: any) => (
              <tr key={feature.id} className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <td className="p-4">
                  <code className={`px-2 py-1 rounded text-sm ${darkMode ? 'bg-zenible-dark-tab-bg text-zenible-primary' : 'bg-gray-100 text-zenible-primary'}`}>
                    {feature.code}
                  </code>
                </td>
                <td className={`p-4 font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {feature.name}
                </td>
                <td className="p-4">
                  <span className={getFeatureTypeBadgeClass(feature.feature_type)}>
                    {feature.feature_type}
                  </span>
                </td>
                <td className={`p-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                  {feature.description}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(feature)}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zenible-dark-tab-bg text-zenible-dark-text' : 'hover:bg-gray-100 text-zinc-600'}`}
                      title="Edit name and description"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, feature })}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {features.length === 0 && (
          <div className={`p-8 text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            No system features found. Create your first feature to get started.
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md rounded-xl p-6 ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {editingFeature ? 'Edit System Feature' : 'Create System Feature'}
            </h3>

            <div className="space-y-4">
              {!editingFeature && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-700'}`}>
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                          : 'bg-white border-neutral-300 text-zinc-950'
                      } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
                      placeholder="e.g., api_access, max_conversations"
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                      Unique identifier for this feature (cannot be changed later)
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-700'}`}>
                      Feature Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.feature_type || 'boolean'}
                      onChange={(e) => setFormData({ ...formData, feature_type: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                          : 'bg-white border-neutral-300 text-zinc-950'
                      } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
                    >
                      <option value="boolean">BOOLEAN - On/Off switch</option>
                      <option value="limit">LIMIT - Numeric value</option>
                      <option value="list">LIST - Array of values</option>
                    </select>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
                      Determines how this feature is configured (cannot be changed later)
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-700'}`}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-neutral-300 text-zinc-950'
                  } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
                  placeholder="e.g., API Access, Maximum Conversations"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-700'}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-neutral-300 text-zinc-950'
                  } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
                  placeholder="e.g., Controls access to the API endpoints"
                />
              </div>

              {editingFeature && (
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
                  <p className="text-sm">
                    <strong>Note:</strong> Only the name and description can be edited. The code and feature type cannot be changed after creation.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-zenible-dark-tab-bg text-zenible-dark-text hover:bg-zenible-dark-border'
                    : 'bg-gray-100 text-zinc-700 hover:bg-gray-200'
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark transition-colors"
              >
                {editingFeature ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, feature: null })}
        onConfirm={handleDelete}
        title="Delete System Feature"
        message={`Are you sure you want to delete the system feature "${deleteModal.feature?.name}" (${deleteModal.feature?.code})? This may affect existing plan configurations.`}
        darkMode={darkMode}
      />
    </div>
  );
}
