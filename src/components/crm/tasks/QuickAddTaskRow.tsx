import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import logger from '../../../utils/logger';
import { userTasksAPI } from '../../../services/api/crm/userTasks';

interface QuickAddTaskRowProps {
  notebookId: string | null;
  onCreated: () => void | Promise<void>;
}

/**
 * Bottom-of-tree row for quickly creating a task. Click → input appears →
 * type a title → Enter saves and resets for the next entry, Esc cancels.
 * Blur with an empty value also collapses back to the button.
 */
const QuickAddTaskRow: React.FC<QuickAddTaskRowProps> = ({ notebookId, onCreated }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const reset = () => {
    setTitle('');
    setEditing(false);
  };

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || !notebookId) {
      reset();
      return;
    }
    setSaving(true);
    try {
      await userTasksAPI.create({
        title: trimmed,
        notebook_id: notebookId,
        folder_id: null,
      });
      setTitle('');
      // Keep the row in edit mode so the user can rattle off several tasks
      // in a row without having to click "+ New Task" each time.
      inputRef.current?.focus();
      await onCreated();
    } catch (err) {
      logger.error('Failed to create task via quick-add', err);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full flex items-center gap-2 py-1.5 px-2 rounded text-sm text-gray-500 hover:bg-gray-50 hover:text-zenible-primary border-b border-transparent"
      >
        <Plus className="w-4 h-4" />
        <span>New Task</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded border-b border-gray-100">
      <Plus className="w-4 h-4 text-zenible-primary flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void submit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            reset();
          }
        }}
        onBlur={() => {
          if (!title.trim()) reset();
        }}
        disabled={saving}
        placeholder="Task title…"
        className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
      />
    </div>
  );
};

export default QuickAddTaskRow;
