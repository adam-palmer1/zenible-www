import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../../common/ConfirmationModal';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import logger from '../../../utils/logger';
import { usePreferences } from '../../../contexts/PreferencesContext';
import {
  notebooksAPI,
  taskFoldersAPI,
  userTasksAPI,
  type UserNotebook,
  type UserTask,
  type UserTaskFolder,
  type UserTaskTreeNode,
  type UserTaskTreeResponse,
} from '../../../services/api/crm/userTasks';
import TasksSubBar from './TasksSubBar';
import TreeNode, { type FlatNode } from './TreeNode';
import RootDropSentinel from './RootDropSentinel';
import QuickAddTaskRow from './QuickAddTaskRow';

const SENTINEL_START = 'sentinel:root-start';
const SENTINEL_END = 'sentinel:root-end';

const TaskDetailModal = React.lazy(() => import('./TaskDetailModal'));
const FolderModal = React.lazy(() => import('./FolderModal'));
const NotebookModal = React.lazy(() => import('./NotebookModal'));

type FlatList = FlatNode[];

function flattenTree(
  tree: UserTaskTreeResponse,
  expanded: Set<string>,
  hideCompleted: boolean,
): FlatList {
  const out: FlatList = [];

  const walkFolder = (folder: UserTaskTreeNode, depth: number) => {
    out.push({
      id: `folder:${folder.id}`,
      type: 'folder',
      depth,
      parentId: folder.parent_id,
      folder,
    });
    if (expanded.has(folder.id)) {
      folder.folders.forEach((child) => walkFolder(child, depth + 1));
      folder.tasks.forEach((task) => {
        if (hideCompleted && task.is_completed) return;
        out.push({
          id: `task:${task.id}`,
          type: 'task',
          depth: depth + 1,
          parentId: task.folder_id,
          task,
        });
      });
    }
  };

  tree.folders.forEach((f) => walkFolder(f, 0));
  tree.tasks.forEach((t) => {
    if (hideCompleted && t.is_completed) return;
    out.push({
      id: `task:${t.id}`,
      type: 'task',
      depth: 0,
      parentId: t.folder_id,
      task: t,
    });
  });

  return out;
}

const EXPANDED_PREF_KEY = 'crm_tasks_expanded_folders';
const SELECTED_NOTEBOOK_PREF_KEY = 'crm_tasks_selected_notebook';
const HIDE_COMPLETED_PREF_KEY = 'crm_tasks_hide_completed';

const TasksTreeView: React.FC = () => {
  const { getPreference, updatePreference } = usePreferences();

  const [tree, setTree] = useState<UserTaskTreeResponse>({ folders: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [notebooks, setNotebooks] = useState<UserNotebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(() => {
    const stored = getPreference(SELECTED_NOTEBOOK_PREF_KEY, null);
    return typeof stored === 'string' ? stored : null;
  });
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    return Boolean(getPreference(HIDE_COMPLETED_PREF_KEY, false));
  });
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<UserNotebook | null>(null);
  // Hydrate from persisted preferences. We read once on mount — preferences
  // are loaded eagerly by PreferencesProvider before this view mounts.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const stored = getPreference(EXPANDED_PREF_KEY, []) as string[] | null;
    return new Set(Array.isArray(stored) ? stored : []);
  });

  // Persist preferences. PreferencesContext recreates `updatePreference` on
  // every render, so we route through a ref to avoid infinite re-render loops.
  const updatePreferenceRef = useRef(updatePreference);
  updatePreferenceRef.current = updatePreference;
  const expandedHydratedRef = useRef(false);
  const notebookHydratedRef = useRef(false);
  const hideCompletedHydratedRef = useRef(false);

  useEffect(() => {
    if (!expandedHydratedRef.current) {
      expandedHydratedRef.current = true;
      return;
    }
    void updatePreferenceRef.current(EXPANDED_PREF_KEY, Array.from(expanded), 'crm').catch((err) => {
      logger.error('Failed to persist expanded tasks folders', err);
    });
  }, [expanded]);

  useEffect(() => {
    if (!notebookHydratedRef.current) {
      notebookHydratedRef.current = true;
      return;
    }
    if (!selectedNotebookId) return;
    void updatePreferenceRef.current(SELECTED_NOTEBOOK_PREF_KEY, selectedNotebookId, 'crm').catch((err) => {
      logger.error('Failed to persist selected notebook', err);
    });
  }, [selectedNotebookId]);

  useEffect(() => {
    if (!hideCompletedHydratedRef.current) {
      hideCompletedHydratedRef.current = true;
      return;
    }
    void updatePreferenceRef.current(HIDE_COMPLETED_PREF_KEY, hideCompleted, 'crm').catch((err) => {
      logger.error('Failed to persist hide completed', err);
    });
  }, [hideCompleted]);
  const [editingTask, setEditingTask] = useState<UserTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [createTaskFolderId, setCreateTaskFolderId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<UserTaskFolder | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'task'; task: UserTask }
    | { kind: 'folder'; folder: UserTaskFolder }
    | { kind: 'notebook'; notebook: UserNotebook }
    | null
  >(null);
  // Type of the node currently being dragged ('folder' | 'task' | null).
  // Folders should stay in place while a task is being dragged, since tasks
  // drop INTO folders rather than reordering next to them.
  const [activeType, setActiveType] = useState<'folder' | 'task' | null>(null);

  const sensors = useSensors(
    // Mouse uses distance-activation so a click never starts a drag.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch uses long-press activation. A quick horizontal swipe (more than the
    // tolerance) cancels TouchSensor before it activates, leaving the row's own
    // swipe-to-reveal handlers free to take over.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Drag-hover-to-expand: when a drag hovers over a closed folder for ~700ms,
  // auto-expand it so users can drop into nested folders.
  const HOVER_EXPAND_DELAY_MS = 700;
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTargetRef = useRef<string | null>(null);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    hoverTargetRef.current = null;
  }, []);

  useEffect(() => () => clearHoverTimer(), [clearHoverTimer]);

  const refresh = useCallback(async (notebookId?: string | null) => {
    try {
      const data = await userTasksAPI.getTree(notebookId ?? undefined);
      setTree(data);
    } catch (err) {
      logger.error('Failed to load task tree', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotebooks = useCallback(async (): Promise<UserNotebook[]> => {
    try {
      const resp = await notebooksAPI.list();
      setNotebooks(resp.items);
      return resp.items;
    } catch (err) {
      logger.error('Failed to load notebooks', err);
      return [];
    }
  }, []);

  // On mount: load notebooks, decide which one to display, then load its tree.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const items = await loadNotebooks();
      if (cancelled) return;
      const target = selectedNotebookId && items.some((n) => n.id === selectedNotebookId)
        ? selectedNotebookId
        : items[0]?.id ?? null;
      if (target !== selectedNotebookId) setSelectedNotebookId(target);
      await refresh(target);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload tree when the selected notebook changes (after initial mount).
  const initialNotebookSet = useRef(false);
  useEffect(() => {
    if (!initialNotebookSet.current) {
      initialNotebookSet.current = true;
      return;
    }
    if (selectedNotebookId) void refresh(selectedNotebookId);
  }, [selectedNotebookId, refresh]);

  // Listen for the CRMTopBar "+ Add Task" / "+ New Folder" buttons.
  useEffect(() => {
    const handleNewTask = () => {
      setEditingTask(null);
      setCreateTaskFolderId(null);
      setShowTaskModal(true);
    };
    const handleNewFolder = () => {
      setEditingFolder(null);
      setCreateFolderParentId(null);
      setShowFolderModal(true);
    };
    window.addEventListener('zenible:tasks:new', handleNewTask);
    window.addEventListener('zenible:tasks:new-folder', handleNewFolder);
    return () => {
      window.removeEventListener('zenible:tasks:new', handleNewTask);
      window.removeEventListener('zenible:tasks:new-folder', handleNewFolder);
    };
  }, []);

  const flat = useMemo(() => flattenTree(tree, expanded, hideCompleted), [tree, expanded, hideCompleted]);
  const flatIds = useMemo(
    () => [SENTINEL_START, ...flat.map((n) => n.id), SENTINEL_END],
    [flat],
  );

  const toggleExpand = (folderId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const findNode = (id: string): FlatNode | undefined => flat.find((n) => n.id === id);

  const collectDescendantFolderIds = (folder: UserTaskTreeNode): Set<string> => {
    const ids = new Set<string>();
    const visit = (f: UserTaskTreeNode) => {
      ids.add(f.id);
      f.folders.forEach(visit);
    };
    visit(folder);
    return ids;
  };

  const findFolderInTree = (id: string, nodes: UserTaskTreeNode[]): UserTaskTreeNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const inner = findFolderInTree(id, n.folders);
      if (inner) return inner;
    }
    return null;
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveType(id.startsWith('folder:') ? 'folder' : 'task');
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      const overId = over ? String(over.id) : null;

      // If we're no longer over the same folder, cancel any pending expand.
      if (overId !== hoverTargetRef.current) {
        clearHoverTimer();
      }

      if (!overId || !overId.startsWith('folder:')) return;

      const folderId = overId.slice('folder:'.length);
      // Don't auto-expand a folder onto itself, and skip already-expanded folders.
      if (`folder:${folderId}` === String(active.id)) return;
      if (expanded.has(folderId)) return;
      // Timer already running for this target.
      if (hoverTargetRef.current === overId) return;

      hoverTargetRef.current = overId;
      hoverTimerRef.current = setTimeout(() => {
        setExpanded((prev) => {
          if (prev.has(folderId)) return prev;
          const next = new Set(prev);
          next.add(folderId);
          return next;
        });
        hoverTimerRef.current = null;
        hoverTargetRef.current = null;
      }, HOVER_EXPAND_DELAY_MS);
    },
    [expanded, clearHoverTimer],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      clearHoverTimer();
      setActiveType(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeNode = findNode(String(active.id));
      if (!activeNode) return;

      const overId = String(over.id);

      // Dropping on either sentinel zone extracts the item to the root of the
      // current notebook (parent_id / folder_id = null). Start sentinel sorts
      // to position 0; end sentinel appends (omit new_sort_order).
      if (overId === SENTINEL_START || overId === SENTINEL_END) {
        const atStart = overId === SENTINEL_START;
        try {
          if (activeNode.type === 'folder') {
            await taskFoldersAPI.move(activeNode.folder.id, {
              new_parent_id: null,
              ...(atStart ? { new_sort_order: 0 } : {}),
            });
          } else {
            await userTasksAPI.move(activeNode.task.id, {
              new_folder_id: null,
              ...(atStart ? { new_sort_order: 0 } : {}),
            });
          }
          await refresh(selectedNotebookId);
        } catch (err) {
          logger.error('Failed to extract to root', err);
          await refresh(selectedNotebookId);
        }
        return;
      }

      const overNode = findNode(overId);
      if (!overNode) return;

      // Compute new parent + insertion index based on the over node.
      let newParentId: string | null;
      let newSortOrder: number;

      if (overNode.type === 'folder') {
        // Block dropping a folder into itself or a descendant.
        if (activeNode.type === 'folder') {
          const descendants = collectDescendantFolderIds(activeNode.folder);
          if (descendants.has(overNode.folder.id)) return;
        }
        // Drop INTO the folder, append at end of its children of matching type.
        newParentId = overNode.folder.id;
        const folderNode = findFolderInTree(overNode.folder.id, tree.folders);
        if (activeNode.type === 'folder') {
          newSortOrder = folderNode ? folderNode.folders.length : 0;
        } else {
          newSortOrder = folderNode ? folderNode.tasks.length : 0;
        }
      } else {
        // Over is a task — reorder among that task's siblings (same folder_id).
        // Active becomes a sibling at the over task's index.
        newParentId = overNode.task.folder_id;
        // Count tasks in that folder before the over task to find its index.
        const folderId = overNode.task.folder_id;
        const siblings = folderId
          ? findFolderInTree(folderId, tree.folders)?.tasks ?? []
          : tree.tasks;
        const idx = siblings.findIndex((t) => t.id === overNode.task.id);
        newSortOrder = idx < 0 ? siblings.length : idx;
      }

      try {
        if (activeNode.type === 'folder') {
          await taskFoldersAPI.move(activeNode.folder.id, {
            new_parent_id: newParentId,
            new_sort_order: newSortOrder,
          });
        } else {
          await userTasksAPI.move(activeNode.task.id, {
            new_folder_id: newParentId,
            new_sort_order: newSortOrder,
          });
        }
        await refresh(selectedNotebookId);
      } catch (err) {
        logger.error('Failed to move node', err);
        await refresh(selectedNotebookId);
      }
    },
    [flat, tree, refresh],
  );

  const handleToggleComplete = async (task: UserTask) => {
    try {
      await userTasksAPI.update(task.id, { is_completed: !task.is_completed });
      await refresh(selectedNotebookId);
    } catch (err) {
      logger.error('Failed to toggle task', err);
    }
  };

  const requestDeleteTask = (task: UserTask) => setPendingDelete({ kind: 'task', task });
  const requestDeleteFolder = (folder: UserTaskFolder) =>
    setPendingDelete({ kind: 'folder', folder });

  const openNewNotebook = () => {
    setEditingNotebook(null);
    setShowNotebookModal(true);
  };
  const openEditNotebook = (nb: UserNotebook) => {
    setEditingNotebook(nb);
    setShowNotebookModal(true);
  };
  const requestDeleteNotebook = (nb: UserNotebook) => setPendingDelete({ kind: 'notebook', notebook: nb });

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === 'task') {
        await userTasksAPI.delete(pendingDelete.task.id);
        await refresh(selectedNotebookId);
      } else if (pendingDelete.kind === 'folder') {
        await taskFoldersAPI.delete(pendingDelete.folder.id);
        await refresh(selectedNotebookId);
      } else {
        await notebooksAPI.delete(pendingDelete.notebook.id);
        const items = await loadNotebooks();
        const next = items[0]?.id ?? null;
        setSelectedNotebookId(next);
        await refresh(next);
      }
    } catch (err) {
      logger.error('Failed to delete', err);
    } finally {
      setPendingDelete(null);
    }
  };

  const openNewTask = (folderId: string | null) => {
    setEditingTask(null);
    setCreateTaskFolderId(folderId);
    setShowTaskModal(true);
  };

  const openEditTask = (task: UserTask) => {
    setEditingTask(task);
    setCreateTaskFolderId(task.folder_id);
    setShowTaskModal(true);
  };

  const openNewFolder = (parentId: string | null) => {
    setEditingFolder(null);
    setCreateFolderParentId(parentId);
    setShowFolderModal(true);
  };

  const openEditFolder = (folder: UserTaskFolder) => {
    setEditingFolder(folder);
    setCreateFolderParentId(folder.parent_id);
    setShowFolderModal(true);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow overflow-hidden">
      <TasksSubBar
        notebooks={notebooks}
        selectedNotebookId={selectedNotebookId}
        hideCompleted={hideCompleted}
        onSelectNotebook={setSelectedNotebookId}
        onNewNotebook={openNewNotebook}
        onEditNotebook={openEditNotebook}
        onDeleteNotebook={requestDeleteNotebook}
        onHideCompletedChange={setHideCompleted}
      />
      <div className="flex-1 min-h-0 overflow-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">Loading…</div>
        ) : flat.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No tasks yet. Use “New folder” or “New task” to get started.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              clearHoverTimer();
              setActiveType(null);
            }}
          >
            <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
              <RootDropSentinel id={SENTINEL_START} showHint={activeType !== null} />
              {flat.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  isExpanded={node.type === 'folder' && expanded.has(node.folder.id)}
                  activeType={activeType}
                  onToggleExpand={toggleExpand}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={openEditTask}
                  onDeleteTask={requestDeleteTask}
                  onEditFolder={openEditFolder}
                  onDeleteFolder={requestDeleteFolder}
                  onNewTaskIn={(folderId) => openNewTask(folderId)}
                  onNewFolderIn={(parentId) => openNewFolder(parentId)}
                />
              ))}
              <RootDropSentinel id={SENTINEL_END} showHint={activeType !== null} />
            </SortableContext>
            <QuickAddTaskRow
              notebookId={selectedNotebookId}
              onCreated={() => refresh(selectedNotebookId)}
            />
          </DndContext>
        )}
      </div>

      {showTaskModal && (
        <Suspense fallback={null}>
          <TaskDetailModal
            isOpen={showTaskModal}
            onClose={() => setShowTaskModal(false)}
            task={editingTask}
            notebookId={selectedNotebookId}
            notebooks={notebooks}
            defaultFolderId={createTaskFolderId}
            onSaved={async () => {
              setShowTaskModal(false);
              await refresh(selectedNotebookId);
            }}
          />
        </Suspense>
      )}

      {showFolderModal && (
        <Suspense fallback={null}>
          <FolderModal
            isOpen={showFolderModal}
            onClose={() => setShowFolderModal(false)}
            folder={editingFolder}
            notebookId={selectedNotebookId}
            notebooks={notebooks}
            defaultParentId={createFolderParentId}
            onSaved={async () => {
              setShowFolderModal(false);
              await refresh(selectedNotebookId);
            }}
          />
        </Suspense>
      )}

      {showNotebookModal && (
        <Suspense fallback={null}>
          <NotebookModal
            isOpen={showNotebookModal}
            onClose={() => setShowNotebookModal(false)}
            notebook={editingNotebook}
            onSaved={async (saved) => {
              setShowNotebookModal(false);
              const items = await loadNotebooks();
              // Switch to the saved notebook if it's new.
              if (!editingNotebook) {
                setSelectedNotebookId(saved.id);
                await refresh(saved.id);
              } else {
                // For an edit, refresh tree only if needed (project change doesn't move tasks).
                await refresh(selectedNotebookId);
              }
            }}
          />
        </Suspense>
      )}

      <ConfirmationModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={
          pendingDelete?.kind === 'folder'
            ? 'Delete folder?'
            : pendingDelete?.kind === 'notebook'
              ? 'Delete notebook?'
              : 'Delete task?'
        }
        message={
          pendingDelete?.kind === 'folder'
            ? `Delete the folder "${pendingDelete.folder.name}" and everything inside it? This cannot be undone.`
            : pendingDelete?.kind === 'notebook'
              ? `Delete the notebook "${pendingDelete.notebook.name}" and every folder and task inside it? This cannot be undone.`
              : pendingDelete?.kind === 'task'
                ? `Delete the task "${pendingDelete.task.title}"? This cannot be undone.`
                : ''
        }
        confirmText="Delete"
        confirmColor="red"
        icon={TrashIcon}
        iconColor="text-red-600"
      />

    </div>
  );
};

export default TasksTreeView;
