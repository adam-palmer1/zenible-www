import React, { useEffect, useState } from 'react';
import logger from '../../../utils/logger';
import { notebooksAPI, type UserNotebook } from '../../../services/api/crm/userTasks';
import ProjectAutocomplete from './ProjectAutocomplete';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: UserNotebook | null;
  onSaved: (notebook: UserNotebook) => void | Promise<void>;
}

const NotebookModal: React.FC<NotebookModalProps> = ({ isOpen, onClose, notebook, onSaved }) => {
  const [name, setName] = useState(notebook?.name ?? '');
  const [projectId, setProjectId] = useState<string | null>(notebook?.project_id ?? null);
  const [projectLabel, setProjectLabel] = useState<string | null>(notebook?.project_name ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(notebook?.name ?? '');
    setProjectId(notebook?.project_id ?? null);
    setProjectLabel(notebook?.project_name ?? null);
    setError(null);
  }, [notebook, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const isEdit = !!notebook;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = notebook
        ? await notebooksAPI.update(notebook.id, { name: trimmed, project_id: projectId })
        : await notebooksAPI.create({ name: trimmed, project_id: projectId });
      await onSaved(result);
    } catch (err) {
      logger.error('Failed to save notebook', err);
      setError('Could not save notebook.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{isEdit ? 'Rename notebook' : 'New notebook'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary"
              placeholder="Notebook name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project (optional)</label>
            <ProjectAutocomplete
              value={projectId}
              valueLabel={projectLabel}
              onChange={(opt) => {
                setProjectId(opt?.id ?? null);
                setProjectLabel(opt?.name ?? null);
              }}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotebookModal;
