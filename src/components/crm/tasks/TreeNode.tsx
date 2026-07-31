import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FilePlus, Folder, FolderOpen, FolderPlus, Trash2 } from 'lucide-react';
import type {
  UserTask,
  UserTaskFolder,
  UserTaskTreeNode,
} from '../../../services/api/crm/userTasks';

export type FlatNode =
  | {
      id: string;
      type: 'folder';
      depth: number;
      parentId: string | null;
      folder: UserTaskTreeNode;
    }
  | {
      id: string;
      type: 'task';
      depth: number;
      parentId: string | null;
      task: UserTask;
    };

interface TreeNodeProps {
  node: FlatNode;
  isExpanded: boolean;
  /** Type of node currently being dragged (null if no drag in progress). */
  activeType: 'folder' | 'task' | null;
  onToggleExpand: (folderId: string) => void;
  onToggleComplete: (task: UserTask) => void;
  onEditTask: (task: UserTask) => void;
  onDeleteTask: (task: UserTask) => void;
  onEditFolder: (folder: UserTaskFolder) => void;
  onDeleteFolder: (folder: UserTaskFolder) => void;
  onNewTaskIn: (folderId: string | null) => void;
  onNewFolderIn: (parentId: string | null) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  isExpanded,
  activeType,
  onToggleExpand,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onEditFolder,
  onDeleteFolder,
  onNewTaskIn,
  onNewFolderIn,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: node.id });

  const pointerDownPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const handleRowPointerDownCapture = (e: React.PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };
  const isPointerClickOnRow = (e: React.MouseEvent): boolean => {
    if ((e.target as HTMLElement).closest('[data-tree-action]')) return false;
    const start = pointerDownPosRef.current;
    if (!start) return true;
    return Math.abs(e.clientX - start.x) <= 3 && Math.abs(e.clientY - start.y) <= 3;
  };

  // Visual shift rules during a drag (excluding the currently-dragged item):
  //   - Dragging a FOLDER: nothing shifts — folder drops go INTO another
  //     folder rather than between rows, and a folder can't slot between two
  //     tasks, so any movement would mislead.
  //   - Dragging a TASK: rows shift normally. The only exception is the
  //     drop-target folder itself (the one the cursor is currently over):
  //     freezing it preserves the "drop INTO me" affordance. All OTHER
  //     folders shift like tasks, so a folder sitting between source and
  //     target slides out of the way instead of letting the tasks past it
  //     overlap its position.
  const freezeInPlace =
    !isDragging &&
    (activeType === 'folder' || (node.type === 'folder' && isOver));
  const containerStyle: React.CSSProperties = {
    transform: freezeInPlace ? undefined : CSS.Transform.toString(transform),
    transition: freezeInPlace ? 'none' : transition,
    paddingLeft: 8 + node.depth * (typeof window !== 'undefined' && window.innerWidth < 640 ? 12 : 20),
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isOver ? 'rgba(142, 81, 255, 0.10)' : undefined,
    touchAction: 'pan-y',
  };

  // Swipe-to-reveal: on touch devices the action cluster slides IN from the
  // right of the row, sitting on top of the static text. `swipeProgress` is
  // a 0..1 value (0 = fully hidden off-screen, 1 = fully revealed). dnd-kit's
  // TouchSensor requires a 250ms long-press to drag, so quick horizontal
  // swipes are reserved for this gesture without conflicting with drag.
  const swipeWidth = node.type === 'folder' ? 130 : 50;
  const [swipeProgress, setSwipeProgress] = React.useState(0);
  const swipeRef = React.useRef<{
    startX: number;
    startY: number;
    base: number;
    direction: 'horizontal' | 'vertical' | 'unknown';
  } | null>(null);
  const rowRef = React.useRef<HTMLDivElement | null>(null);

  const setRefs = (el: HTMLDivElement | null) => {
    rowRef.current = el;
    setNodeRef(el);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      base: swipeProgress,
      direction: 'unknown',
    };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const s = swipeRef.current;
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.startX;
    const dy = t.clientY - s.startY;
    if (s.direction === 'unknown') {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        s.direction = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
    }
    if (s.direction === 'horizontal') {
      // dx is negative when swiping left, which should INCREASE progress.
      const target = s.base + (-dx) / swipeWidth;
      setSwipeProgress(Math.max(0, Math.min(1, target)));
    }
  };
  const handleTouchEnd = () => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || s.direction !== 'horizontal') return;
    setSwipeProgress((curr) => (curr > 0.5 ? 1 : 0));
  };

  const isRevealed = swipeProgress > 0;
  const isSwipeActive = swipeRef.current?.direction === 'horizontal';

  // Close the swipe when the user clicks or taps anywhere outside this row.
  React.useEffect(() => {
    if (!isRevealed) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && rowRef.current && rowRef.current.contains(target)) return;
      setSwipeProgress(0);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isRevealed]);

  // Cluster slides in from the right. `translate-x-full` (class) is the
  // resting off-screen state and `md:group-hover:translate-x-0` (class) drives
  // the desktop hover slide-in. We only set an inline transform DURING an
  // active mobile swipe — otherwise the inline style would beat Tailwind's
  // hover class and break desktop reveal.
  const clusterStyle: React.CSSProperties = isRevealed
    ? {
        transform: `translateX(${(1 - swipeProgress) * 100}%)`,
        transition: isSwipeActive ? 'none' : undefined,
        opacity: 1,
        pointerEvents: 'auto' as const,
      }
    : {};

  // Wrap a row's onClick so that tapping a swiped-open row first closes the
  // swipe instead of triggering its normal action.
  const wrapForegroundClick = (handler: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
    if (isRevealed) {
      e.preventDefault();
      setSwipeProgress(0);
      return;
    }
    handler(e);
  };

  // Helper for action button clicks — close the swipe before running the action.
  const closeSwipeAnd = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setSwipeProgress(0);
    fn();
  };

  if (node.type === 'folder') {
    const f = node.folder;
    return (
      <div ref={setRefs} style={containerStyle} className="group relative overflow-hidden">
        {/* Row content — text stays put; the cluster slides in over it. */}
        <div
          {...attributes}
          {...listeners}
          onPointerDownCapture={handleRowPointerDownCapture}
          onClick={wrapForegroundClick((e) => {
            if (!isPointerClickOnRow(e)) return;
            onEditFolder(f);
          })}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="relative z-10 flex items-center gap-2 py-1.5 pr-2 rounded hover:bg-gray-50 border-b border-gray-100 cursor-grab active:cursor-grabbing bg-white"
        >
          <button
            type="button"
            data-tree-action
            onClick={(e) => { e.stopPropagation(); onToggleExpand(f.id); }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            className="w-5 text-gray-500"
          >
            {isExpanded ? '▾' : '▸'}
          </button>
          {isExpanded ? (
            <FolderOpen className="w-5 h-5 text-zenible-primary" aria-hidden="true" />
          ) : (
            <Folder className="w-5 h-5 text-zenible-primary" aria-hidden="true" />
          )}
          <span className="flex-1 font-medium text-gray-800 truncate">{f.name}</span>
        </div>

        {/* Action cluster — overlays the row from the right; slides in via translateX. */}
        <div
          style={clusterStyle}
          className="absolute inset-y-0 right-0 z-20 flex items-center gap-1 pr-2 pl-3 bg-white opacity-0 pointer-events-none translate-x-full transition-transform duration-200 ease-out md:translate-x-0 md:transition-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
          data-tree-action
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={closeSwipeAnd(() => onNewTaskIn(f.id))}
            className="p-1 text-gray-600 hover:bg-gray-200 rounded"
            aria-label="New task in folder"
            title="New task in folder"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={closeSwipeAnd(() => onNewFolderIn(f.id))}
            className="p-1 text-gray-600 hover:bg-gray-200 rounded"
            aria-label="New subfolder"
            title="New subfolder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={closeSwipeAnd(() => onDeleteFolder(f))}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            aria-label="Delete folder"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const t = node.task;
  return (
    <div ref={setRefs} style={containerStyle} className="group relative overflow-hidden">
      {/* Row content — text stays put; the cluster slides in over it. */}
      <div
        {...attributes}
        {...listeners}
        onPointerDownCapture={handleRowPointerDownCapture}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="relative z-10 flex items-center gap-2 py-1.5 pr-2 rounded hover:bg-gray-50 border-b border-gray-100 cursor-grab active:cursor-grabbing bg-white"
      >
        <span className="w-5" aria-hidden="true" />
        <input
          type="checkbox"
          checked={t.is_completed}
          onChange={() => onToggleComplete(t)}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer accent-zenible-primary"
        />
        <button
          type="button"
          onClick={wrapForegroundClick((e) => {
            e.stopPropagation();
            onEditTask(t);
          })}
          className={`flex-1 text-left truncate ${
            t.is_completed ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {t.title}
        </button>
        {t.due_date && (() => {
          const due = new Date(`${t.due_date}T00:00:00`);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const isOverdue = !t.is_completed && due < today;
          return (
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                isOverdue ? 'bg-red-50 text-red-700 font-medium' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.due_date}
            </span>
          );
        })()}
      </div>
      {/* Action cluster — overlays the row from the right; slides in via translateX. */}
      <div
        style={clusterStyle}
        className="absolute inset-y-0 right-0 z-20 flex items-center gap-1 pr-2 pl-3 bg-white opacity-0 pointer-events-none translate-x-full transition-transform duration-200 ease-out md:translate-x-0 md:transition-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeSwipeAnd(() => onDeleteTask(t))}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          aria-label="Delete task"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TreeNode;
