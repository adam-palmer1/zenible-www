import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Play, Pencil, Copy, Share2, Trash2 } from 'lucide-react';
import type { CustomReportListItem } from '@/types/customReport';

interface SavedReportActionsProps {
  report: CustomReportListItem;
  onRun: (id: string) => void;
  onEdit: (id: string) => void;
  onClone: (id: string) => void;
  onToggleShare: (id: string) => void;
  onDelete: (id: string) => void;
}

const SavedReportActions: React.FC<SavedReportActionsProps> = ({
  report,
  onRun,
  onEdit,
  onClone,
  onToggleShare,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actions = [
    { label: 'Run', icon: Play, onClick: () => onRun(report.id), color: 'text-green-600' },
    ...(report.is_owner
      ? [{ label: 'Edit', icon: Pencil, onClick: () => onEdit(report.id), color: 'text-gray-600' }]
      : []),
    { label: 'Clone', icon: Copy, onClick: () => onClone(report.id), color: 'text-gray-600' },
    ...(report.is_owner
      ? [
          {
            label: report.is_shared ? 'Unshare' : 'Share',
            icon: Share2,
            onClick: () => onToggleShare(report.id),
            color: 'text-blue-600',
          },
          { label: 'Delete', icon: Trash2, onClick: () => onDelete(report.id), color: 'text-red-600' },
        ]
      : []),
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="py-1">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#09090b] hover:bg-gray-50"
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedReportActions;
