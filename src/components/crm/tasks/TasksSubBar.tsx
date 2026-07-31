import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, Cog6ToothIcon, FunnelIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Dropdown from '../../ui/dropdown/Dropdown';
import type { UserNotebook } from '../../../services/api/crm/userTasks';

interface TasksSubBarProps {
  notebooks: UserNotebook[];
  selectedNotebookId: string | null;
  hideCompleted: boolean;
  onSelectNotebook: (id: string) => void;
  onNewNotebook: () => void;
  onEditNotebook: (notebook: UserNotebook) => void;
  onDeleteNotebook: (notebook: UserNotebook) => void;
  onHideCompletedChange: (hide: boolean) => void;
}

const TasksSubBar: React.FC<TasksSubBarProps> = ({
  notebooks,
  selectedNotebookId,
  hideCompleted,
  onSelectNotebook,
  onNewNotebook,
  onEditNotebook,
  onDeleteNotebook,
  onHideCompletedChange,
}) => {
  const selected = notebooks.find((n) => n.id === selectedNotebookId) ?? notebooks[0] ?? null;
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [filterOpen]);

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2">
      {/* Left: notebook selector */}
      <Dropdown
        trigger={
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 max-w-full min-w-0"
          >
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{selected?.name ?? 'Notebook'}</span>
            {selected?.project_name && (
              <span className="hidden sm:inline text-xs text-gray-500 truncate max-w-[140px]">· {selected.project_name}</span>
            )}
            <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </button>
        }
        align="start"
        side="bottom"
      >
        {notebooks.map((nb) => (
          <Dropdown.Item
            key={nb.id}
            onSelect={() => onSelectNotebook(nb.id)}
          >
            <span className="flex-1 truncate">{nb.name}</span>
            {nb.project_name && (
              <span className="ml-2 text-xs text-gray-400 truncate max-w-[120px]">{nb.project_name}</span>
            )}
          </Dropdown.Item>
        ))}
        {notebooks.length > 0 && <Dropdown.Separator />}
        <Dropdown.Item onSelect={() => onNewNotebook()}>
          <PlusIcon className="w-4 h-4 mr-2" />
          New notebook
        </Dropdown.Item>
        {selected && (
          <Dropdown.Item onSelect={() => onEditNotebook(selected)}>
            <Cog6ToothIcon className="w-4 h-4 mr-2" />
            Notebook Settings
          </Dropdown.Item>
        )}
        {selected && notebooks.length > 1 && (
          <Dropdown.Item destructive onSelect={() => onDeleteNotebook(selected)}>
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete notebook
          </Dropdown.Item>
        )}
      </Dropdown>

      {/* Right: filter popover */}
      <div className="relative" ref={filterRef}>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
            hideCompleted
              ? 'border-zenible-primary text-zenible-primary bg-purple-50'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          aria-label="Filter tasks"
          aria-expanded={filterOpen}
        >
          <FunnelIcon className="w-5 h-5" />
        </button>
        {filterOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-30">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => onHideCompletedChange(e.target.checked)}
                className="accent-zenible-primary"
              />
              Hide completed
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksSubBar;
