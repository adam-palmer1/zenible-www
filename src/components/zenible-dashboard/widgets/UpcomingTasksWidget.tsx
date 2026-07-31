import React, { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '../../shared';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';
import { queryKeys } from '../../../lib/query-keys';
import logger from '../../../utils/logger';
import {
  notebooksAPI,
  userTasksAPI,
  type UserNotebook,
  type UserTask,
} from '../../../services/api/crm/userTasks';

// Lazy-load the modal so the widget bundle stays small.
const TaskDetailModal = React.lazy(() => import('../../crm/tasks/TaskDetailModal'));

interface DashboardTask {
  id: string;
  title: string;
  folder_id: string | null;
  due_date: string | null;
  is_completed: boolean;
}

interface UpcomingTasksWidgetProps {
  settings?: Record<string, any>;
  isHovered?: boolean;
}

const formatDueDate = (dateString: string): { label: string; isOverdue: boolean } => {
  const due = new Date(`${dateString}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isOverdue = due < today;
  if (due.getTime() === today.getTime()) return { label: 'Today', isOverdue: false };
  if (due.getTime() === tomorrow.getTime()) return { label: 'Tomorrow', isOverdue: false };
  if (isOverdue) {
    return {
      label: `Overdue · ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      isOverdue: true,
    };
  }
  return {
    label: due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    isOverdue: false,
  };
};

const UpcomingTasksWidget = ({ isHovered = false }: UpcomingTasksWidgetProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tasks, isLoading: loading } = useDashboardWidget('upcomingTasks');

  const [editingTask, setEditingTask] = useState<UserTask | null>(null);
  const [notebooks, setNotebooks] = useState<UserNotebook[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const taskList: DashboardTask[] = tasks || [];

  const handleOpenTask = async (taskId: string) => {
    if (openingId) return;
    setOpeningId(taskId);
    try {
      // Parallel fetch — the modal needs both the full task (description,
      // notebook_id, etc.) and the notebooks list (for the picker).
      const [task, notebookList] = await Promise.all([
        userTasksAPI.get(taskId),
        notebooks.length > 0
          ? Promise.resolve({ items: notebooks, total: notebooks.length })
          : notebooksAPI.list(),
      ]);
      if (notebooks.length === 0) setNotebooks(notebookList.items);
      setEditingTask(task);
    } catch (err) {
      logger.error('Failed to open task from dashboard widget', err);
    } finally {
      setOpeningId(null);
    }
  };

  const handleViewAll = () => navigate('/crm/tasks');

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  return (
    <div className="flex flex-col h-full">
      {taskList.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No pending tasks</p>
          <button
            onClick={handleViewAll}
            className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
          >
            Open Tasks
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <div
              className="h-full overflow-y-auto space-y-2"
              style={{
                width: isHovered ? '100%' : 'calc(100% + 17px)',
                paddingRight: isHovered ? '0' : '17px',
                transition: 'width 0.2s ease, padding-right 0.2s ease',
              }}
            >
              {taskList.map((task) => {
                const due = task.due_date ? formatDueDate(task.due_date) : null;
                const isOpening = openingId === task.id;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleOpenTask(task.id)}
                    disabled={isOpening}
                    className={`w-full p-3 rounded-lg border transition-all text-left group ${
                      due?.isOverdue
                        ? 'border-red-200 bg-red-50/50 hover:border-red-400'
                        : 'border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50'
                    } ${isOpening ? 'opacity-60' : ''}`}
                  >
                    <p
                      className={`text-sm truncate ${
                        task.is_completed
                          ? 'line-through text-gray-400'
                          : 'font-medium text-gray-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    {due && (
                      <p
                        className={`text-xs mt-1 ${
                          due.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                        }`}
                      >
                        {due.label}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
            >
              Open Tasks
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {editingTask && (
        <Suspense fallback={null}>
          <TaskDetailModal
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            task={editingTask}
            notebookId={editingTask.notebook_id}
            notebooks={notebooks}
            defaultFolderId={editingTask.folder_id}
            onSaved={async () => {
              setEditingTask(null);
              // Refetch the dashboard so the widget reflects the edit (toggled
              // completion, renamed title, due date, etc.).
              await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default UpcomingTasksWidget;
