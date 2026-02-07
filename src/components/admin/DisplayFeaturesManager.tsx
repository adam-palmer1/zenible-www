import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { LoadingSpinner } from '../shared';

interface DisplayFeature {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

interface DisplayFeaturesResponse {
  features: DisplayFeature[];
}

interface DisplayFeaturesManagerProps {
  darkMode?: boolean;
}

export default function DisplayFeaturesManager({ darkMode }: DisplayFeaturesManagerProps) {
  const [features, setFeatures] = useState<DisplayFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<DisplayFeature | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; feature: DisplayFeature | null }>({ isOpen: false, feature: null });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 1,
  });

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getDisplayFeatures() as DisplayFeaturesResponse;
      setFeatures(response.features || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFeature(null);
    setFormData({
      name: '',
      description: '',
      display_order: features.length + 1,
    });
    setShowModal(true);
  };

  const handleEdit = (feature: DisplayFeature) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description,
      display_order: feature.display_order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingFeature) {
        await adminAPI.updateDisplayFeature(editingFeature.id, formData);
      } else {
        await adminAPI.createDisplayFeature(formData);
      }
      setShowModal(false);
      fetchFeatures();
    } catch (err) {
      alert(`Error saving feature: ${(err as Error).message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.feature) return;
    try {
      await adminAPI.deleteDisplayFeature(deleteModal.feature.id);
      setDeleteModal({ isOpen: false, feature: null });
      fetchFeatures();
    } catch (err) {
      alert(`Error deleting feature: ${(err as Error).message}`);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const updatedFeatures = [...features];
    const temp = updatedFeatures[index];
    updatedFeatures[index] = updatedFeatures[index - 1];
    updatedFeatures[index - 1] = temp;

    // Update display orders
    try {
      await Promise.all([
        adminAPI.updateDisplayFeature(updatedFeatures[index].id, {
          ...updatedFeatures[index],
          display_order: index + 1,
        }),
        adminAPI.updateDisplayFeature(updatedFeatures[index - 1].id, {
          ...updatedFeatures[index - 1],
          display_order: index,
        }),
      ]);
      fetchFeatures();
    } catch (err) {
      alert(`Error reordering features: ${(err as Error).message}`);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === features.length - 1) return;
    const updatedFeatures = [...features];
    const temp = updatedFeatures[index];
    updatedFeatures[index] = updatedFeatures[index + 1];
    updatedFeatures[index + 1] = temp;

    // Update display orders
    try {
      await Promise.all([
        adminAPI.updateDisplayFeature(updatedFeatures[index].id, {
          ...updatedFeatures[index],
          display_order: index + 1,
        }),
        adminAPI.updateDisplayFeature(updatedFeatures[index + 1].id, {
          ...updatedFeatures[index + 1],
          display_order: index + 2,
        }),
      ]);
      fetchFeatures();
    } catch (err) {
      alert(`Error reordering features: ${(err as Error).message}`);
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
        Error loading display features: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Display Features
        </h3>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark transition-colors"
        >
          Add Display Feature
        </button>
      </div>

      <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-sidebar' : 'border-neutral-200 bg-gray-50'}`}>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Order</th>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Name</th>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Description</th>
              <th className={`text-left p-4 font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={feature.id} className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                      {feature.display_order}
                    </span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'hover:bg-zenible-dark-tab-bg' : ''}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === features.length - 1}
                        className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'hover:bg-zenible-dark-tab-bg' : ''}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
                <td className={`p-4 font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {feature.name}
                </td>
                <td className={`p-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                  {feature.description}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(feature)}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zenible-dark-tab-bg text-zenible-dark-text' : 'hover:bg-gray-100 text-zinc-600'}`}
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
            No display features found. Create your first feature to get started.
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md rounded-xl p-6 ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {editingFeature ? 'Edit Display Feature' : 'Create Display Feature'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-700'}`}>
                  Name
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
                  placeholder="e.g., Priority Support"
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
                  placeholder="e.g., 24/7 dedicated support with fast response times"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-700'}`}>
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                  min="1"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-neutral-300 text-zinc-950'
                  } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
                />
              </div>
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
        title="Delete Display Feature"
        message={`Are you sure you want to delete the display feature "${deleteModal.feature?.name}"? This action cannot be undone.`}
        darkMode={darkMode}
      />
    </div>
  );
}