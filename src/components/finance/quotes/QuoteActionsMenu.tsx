import React from 'react';
import {
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { MoreVertical } from 'lucide-react';
import Dropdown from '../../ui/dropdown/Dropdown';

interface QuoteActionsMenuProps {
  quote: any;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  onProjects: () => void;
  onAccept: () => void;
  onReject: () => void;
  showAccept?: boolean;
  showReject?: boolean;
}

/**
 * Actions dropdown menu for quote detail page
 * Contains actions not shown in the main action bar
 */
const QuoteActionsMenu: React.FC<QuoteActionsMenuProps> = ({
  quote,
  onEdit,
  onClone,
  onDelete,
  onProjects,
  onAccept,
  onReject,
  showAccept = false,
  showReject = false,
}) => {
  const menuItems = [
    {
      id: 'edit',
      label: 'Edit Quote',
      icon: PencilIcon,
      onClick: onEdit,
    },
    {
      id: 'clone',
      label: 'Clone Quote',
      icon: DocumentDuplicateIcon,
      onClick: onClone,
    },
    {
      id: 'projects',
      label: 'Link Projects',
      icon: FolderIcon,
      onClick: onProjects,
    },
    showAccept && {
      id: 'accept',
      label: 'Accept Quote',
      icon: CheckCircleIcon,
      onClick: onAccept,
    },
    showReject && {
      id: 'reject',
      label: 'Reject Quote',
      icon: XCircleIcon,
      onClick: onReject,
    },
    {
      id: 'delete',
      label: 'Delete Quote',
      icon: TrashIcon,
      onClick: onDelete,
      destructive: true,
    },
  ].filter(Boolean) as any[];

  return (
    <Dropdown
      trigger={
        <button
          className="flex items-center justify-center w-[40px] h-[40px] bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="More actions"
        >
          <MoreVertical className="h-5 w-5 text-[#71717a]" />
        </button>
      }
      align="end"
      side="bottom"
    >
      {menuItems.map((item: any, index: number) => (
        <Dropdown.Item
          key={item.id}
          onSelect={item.onClick}
          destructive={item.destructive}
          highlighted={index === 0}
        >
          <item.icon className="h-4 w-4 mr-2" />
          {item.label}
        </Dropdown.Item>
      ))}
    </Dropdown>
  );
};

export default QuoteActionsMenu;
