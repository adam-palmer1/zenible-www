import React, { useState } from 'react';
import { TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currencyUtils';
import { ConfirmModal } from '../ui/modal/Modal';

interface InvoiceLinksListProps {
  invoiceLinks?: any[];
  loading?: boolean;
  onDelete?: (linkId: string) => void;
  currencyCode?: string;
}

const InvoiceLinksList: React.FC<InvoiceLinksListProps> = ({
  invoiceLinks = [],
  loading = false,
  onDelete,
  currencyCode,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  if (invoiceLinks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No invoice links yet</p>
        <p className="text-sm mt-1">Link portions of this service to invoices for milestone billing</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {invoiceLinks.map((link: any) => {
          const invoiceLabel = link.invoice_number || link.invoice?.invoice_number || (link.invoice_id ? `Invoice #${link.invoice_id.slice(0, 8)}` : 'Unlinked');
          return (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(parseFloat(link.amount), currencyCode)}
                  </span>
                  {link.invoice_id ? (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">{'\u2192'}</span>
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <DocumentTextIcon className="h-4 w-4" />
                        {invoiceLabel}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                      Not linked to invoice
                    </span>
                  )}
                </div>
                {link.notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {link.notes}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(link.invoiced_at).toLocaleDateString()}
                </p>
              </div>

              {onDelete && (
                <button
                  onClick={() => setConfirmDelete({ id: link.id, label: invoiceLabel })}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                  title="Delete invoice link"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Delete Invoice Link"
        description={`Are you sure you want to remove the link to ${confirmDelete?.label}? This will not delete the invoice itself.`}
        onConfirm={() => {
          if (confirmDelete && onDelete) {
            onDelete(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default InvoiceLinksList;
