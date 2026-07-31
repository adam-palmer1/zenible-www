import React from 'react';
import { useSortable } from '@dnd-kit/sortable';

interface RootDropSentinelProps {
  id: string;
  /** When true, show a faint hint so the user discovers the drop zone. */
  showHint?: boolean;
}

/**
 * Invisible drop zone at the very top or very bottom of the tree. Dropping a
 * folder or task here moves it to the root of the current notebook, extracting
 * it from any parent folder it was nested inside.
 *
 * Always laid out (a few px tall) so dnd-kit can detect hover, and reveals a
 * thin purple line when something is being dragged over it.
 */
const RootDropSentinel: React.FC<RootDropSentinelProps> = ({ id, showHint = false }) => {
  const { setNodeRef, isOver } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      aria-hidden="true"
      className="h-2 mx-2 my-0.5 rounded transition-colors"
      style={{
        backgroundColor: isOver
          ? 'rgba(142, 81, 255, 0.35)'
          : showHint
            ? 'rgba(142, 81, 255, 0.06)'
            : 'transparent',
      }}
    />
  );
};

export default RootDropSentinel;
