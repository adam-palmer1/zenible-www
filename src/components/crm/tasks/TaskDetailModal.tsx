import React, { useEffect, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import logger from '../../../utils/logger';
import DatePickerCalendar from '../../shared/DatePickerCalendar';
import RichTextEditor from '../../shared/RichTextEditor';
import Dropdown from '../../ui/dropdown/Dropdown';
import {
  userTasksAPI,
  type UserNotebook,
  type UserTask,
} from '../../../services/api/crm/userTasks';

/**
 * Normalise the Quill editor output before persisting. An empty editor emits
 * `<p><br></p>` (and stripping that may leave just whitespace), so we treat
 * those as null to preserve the column's nullable semantics.
 */
function normaliseDescription(html: string): string | null {
  const stripped = html.replace(/<p><br><\/p>/g, '').trim();
  return stripped ? html : null;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: UserTask | null;
  notebookId: string | null;
  notebooks: UserNotebook[];
  defaultFolderId: string | null;
  onSaved: () => void | Promise<void>;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  notebookId,
  notebooks,
  defaultFolderId,
  onSaved,
}) => {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [isCompleted, setIsCompleted] = useState(task?.is_completed ?? false);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>(
    task?.notebook_id ?? notebookId ?? notebooks[0]?.id ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setDueDate(task?.due_date ?? '');
    setIsCompleted(task?.is_completed ?? false);
    setSelectedNotebookId(task?.notebook_id ?? notebookId ?? notebooks[0]?.id ?? '');
    setError(null);
  }, [task, isOpen, notebookId, notebooks]);

  // Esc closes the modal. Enter saves via the form's onSubmit when focus is in
  // a single-line input (browser default). Inside the rich-text editor Enter
  // is consumed by Quill for newlines, which is what we want.
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

  const isEdit = !!task;
  const isMoveBetweenNotebooks = isEdit && task && task.notebook_id !== selectedNotebookId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }
    if (!selectedNotebookId) {
      setError('Pick a notebook.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cleanDescription = normaliseDescription(description ?? '');
      if (task) {
        // If the notebook changed, move first so the task lands in the new notebook.
        if (isMoveBetweenNotebooks) {
          await userTasksAPI.move(task.id, {
            new_folder_id: null,
            new_notebook_id: selectedNotebookId,
          });
        }
        await userTasksAPI.update(task.id, {
          title: trimmedTitle,
          description: cleanDescription,
          due_date: dueDate || null,
          is_completed: isCompleted,
        });
      } else {
        await userTasksAPI.create({
          title: trimmedTitle,
          description: cleanDescription,
          due_date: dueDate || null,
          is_completed: isCompleted,
          notebook_id: selectedNotebookId,
          folder_id: defaultFolderId,
        });
      }
      await onSaved();
    } catch (err) {
      logger.error('Failed to save task', err);
      setError('Could not save task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit task' : 'New task'}</h3>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <RichTextEditor
              value={description ?? ''}
              onChange={setDescription}
              placeholder="Optional description"
            />
          </div>
          {/* Notebook · Due date · Completed — one row on >=sm, stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
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
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <DatePickerCalendar value={dueDate ?? ''} onChange={(date) => setDueDate(date)} />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed</label>
              <button
                type="button"
                onClick={() => setIsCompleted((v) => !v)}
                aria-pressed={isCompleted}
                className={`flex items-center gap-2 w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                  isCompleted
                    ? 'border-zenible-primary bg-purple-50 text-zenible-primary'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => {}}
                  tabIndex={-1}
                  className="accent-zenible-primary pointer-events-none"
                />
                <span className="truncate">{isCompleted ? 'Completed' : 'Not completed'}</span>
              </button>
            </div>
          </div>
          {isMoveBetweenNotebooks && (
            <p className="text-xs text-zenible-primary">
              This task will move to “
              {notebooks.find((n) => n.id === selectedNotebookId)?.name}”.
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer (always visible) */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
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
  );
};

export default TaskDetailModal;
