import React from 'react';
import {
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  LinkIcon,
  ReceiptPercentIcon,
  PaperAirplaneIcon,
  DocumentIcon,
  FolderIcon,
  CreditCardIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { MoreVertical } from 'lucide-react';
import Dropdown from '../../ui/dropdown/Dropdown';

interface InvoiceActionsMenuProps {
  invoice: any;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  onLinkPayment?: () => void;
  onExpenses?: () => void;
  onProjects?: () => void;
  onSendReminder?: () => void;
  onMarkAsSent?: () => void;
  onRevertToDraft?: () => void;
  onChargeCard?: () => void;
  showLinkPayment?: boolean;
  showSendReminder?: boolean;
  showMarkAsSent?: boolean;
  showRevertToDraft?: boolean;
  showChargeCard?: boolean;
}

/**
 * Actions dropdown menu for invoice detail page
 * Contains actions not shown in the main action bar
 */
const InvoiceActionsMenu: React.FC<InvoiceActionsMenuProps> = ({
  invoice,
  onEdit,
  onClone,
  onDelete,
  onLinkPayment,
  onExpenses,
  onProjects,
  onSendReminder,
  onMarkAsSent,
  onRevertToDraft,
  onChargeCard,
  showLinkPayment = false,
  showSendReminder = false,
  showMarkAsSent = false,
  showRevertToDraft = false,
  showChargeCard = false,
}) => {
  const menuItems = [
    {
      id: 'edit',
      label: 'Edit Invoice',
      icon: PencilIcon,
      onClick: onEdit,
    },
    {
      id: 'clone',
      label: 'Clone Invoice',
      icon: DocumentDuplicateIcon,
      onClick: onClone,
    },
    showSendReminder && {
      id: 'send_reminder',
      label: 'Send Reminder',
      icon: BellAlertIcon,
      onClick: onSendReminder,
    },
    showChargeCard && {
      id: 'charge_card',
      label: 'Charge Saved Card',
      icon: CreditCardIcon,
      onClick: onChargeCard,
    },
    showLinkPayment && {
      id: 'link_payment',
      label: 'Link Existing Payment',
      icon: LinkIcon,
      onClick: onLinkPayment,
    },
    {
      id: 'expenses',
      label: 'Link Expenses',
      icon: ReceiptPercentIcon,
      onClick: onExpenses,
    },
    {
      id: 'projects',
      label: 'Link Projects',
      icon: FolderIcon,
      onClick: onProjects,
    },
    showMarkAsSent && {
      id: 'mark_sent',
      label: 'Mark as Sent',
      icon: PaperAirplaneIcon,
      onClick: onMarkAsSent,
    },
    showRevertToDraft && {
      id: 'revert_draft',
      label: 'Revert to Draft',
      icon: DocumentIcon,
      onClick: onRevertToDraft,
    },
    {
      id: 'delete',
      label: 'Delete Invoice',
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

export default InvoiceActionsMenu;
