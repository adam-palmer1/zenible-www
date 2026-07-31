import React, { useEffect, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import logger from '../../../utils/logger';
import Dropdown from '../../ui/dropdown/Dropdown';
import {
  taskFoldersAPI,
  type UserNotebook,
  type UserTaskFolder,
} from '../../../services/api/crm/userTasks';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: UserTaskFolder | null;
  notebookId: string | null;
  notebooks: UserNotebook[];
  defaultParentId: string | null;
  onSaved: () => void | Promise<void>;
}

const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  notebookId,
  notebooks,
  defaultParentId,
  onSaved,
}) => {
  const [name, setName] = useState(folder?.name ?? '');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>(
    folder?.notebook_id ?? notebookId ?? notebooks[0]?.id ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(folder?.name ?? '');
    setSelectedNotebookId(folder?.notebook_id ?? notebookId ?? notebooks[0]?.id ?? '');
    setError(null);
  }, [folder, isOpen, notebookId, notebooks]);

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

  const isEdit = !!folder;
  const isMoveBetweenNotebooks = isEdit && folder && folder.notebook_id !== selectedNotebookId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (!selectedNotebookId) {
      setError('Pick a notebook.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (folder) {
        // If the user changed the notebook, move first (cascades the entire subtree).
        if (isMoveBetweenNotebooks) {
          await taskFoldersAPI.move(folder.id, {
            new_parent_id: null,
            new_notebook_id: selectedNotebookId,
          });
        }
        if (trimmed !== folder.name) {
          await taskFoldersAPI.update(folder.id, { name: trimmed });
        }
      } else {
        await taskFoldersAPI.create({
          name: trimmed,
          notebook_id: selectedNotebookId,
          parent_id: defaultParentId,
        });
      }
      await onSaved();
    } catch (err) {
      logger.error('Failed to save folder', err);
      setError('Could not save folder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{isEdit ? 'Edit folder' : 'New folder'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary"
              placeholder="Folder name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notebook</label>
            <Dropdown
              align="start"
              side="bottom"
              className="w-[var(--radix-dropdown-menu-trigger-width)]"
              trigger={
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-zenible-primary hover:bg-gray-50"
                >
                  <span className="flex-1 truncate text-sm text-gray-900">
                    {(() => {
                      const sel = notebooks.find((n) => n.id === selectedNotebookId);
                      if (!sel) return 'Select notebook…';
                      return (
                        <>
                          {sel.name}
                          {sel.project_name && (
                            <span className="text-gray-400 ml-2">— {sel.project_name}</span>
                          )}
                        </>
                      );
                    })()}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </button>
              }
            >
              {notebooks.map((nb) => (
                <Dropdown.Item
                  key={nb.id}
                  highlighted={nb.id === selectedNotebookId}
                  onSelect={() => setSelectedNotebookId(nb.id)}
                >
                  <span className="flex-1 truncate">{nb.name}</span>
                  {nb.project_name && (
                    <span className="ml-2 text-xs text-gray-400 truncate max-w-[120px]">
                      {nb.project_name}
                    </span>
                  )}
                </Dropdown.Item>
              ))}
            </Dropdown>
            {isMoveBetweenNotebooks && (
              <p className="mt-1 text-xs text-zenible-primary">
                This folder and everything inside it will move to “
                {notebooks.find((n) => n.id === selectedNotebookId)?.name}”.
              </p>
            )}
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

export default FolderModal;
