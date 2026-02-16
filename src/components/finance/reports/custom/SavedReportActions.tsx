import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import type { CustomReportListItem } from '@/types/customReport';

interface SavedReportActionsProps {
  report: CustomReportListItem;
  onEdit: (id: string) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
}

const SavedReportActions: React.FC<SavedReportActionsProps> = ({
  report,
  onEdit,
  onClone,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setPos({ bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right });
      } else {
        setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      }
    }
  }, [isOpen]);

  const actions = [
    ...(report.is_owner
      ? [{ label: 'Edit', onClick: () => onEdit(report.id), color: 'text-[#09090b]' }]
      : []),
    { label: 'Clone', onClick: () => onClone(report.id), color: 'text-[#09090b]' },
    ...(report.is_owner
      ? [{ label: 'Delete', onClick: () => onDelete(report.id), color: 'text-red-600' }]
      : []),
  ];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, right: pos.right, width: 160, zIndex: 9999 }}
            className="bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <div className="py-1">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${action.color}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default SavedReportActions;
