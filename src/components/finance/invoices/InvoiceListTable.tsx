import React from 'react';
import {
  MoreVertical,
  Clock,
  AlertCircle,
  Repeat,
  FileText,
} from 'lucide-react';
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '../../../constants/finance';
import type { InvoiceStatus } from '../../../constants/finance';
import { getCurrencySymbol } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateUtils';
import ActionMenu from '../../shared/ActionMenu';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${INVOICE_STATUS_COLORS[status as InvoiceStatus] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
      {INVOICE_STATUS_LABELS[status as InvoiceStatus] || status}
    </span>
  );
};

interface InvoiceListTableProps {
  loading: boolean;
  paginatedInvoices: any[];
  selectedIds: any[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne: (invoiceId: any) => void;
  onView: (invoice: any) => void;
  onEdit: (invoice: any) => void;
  onSend: (invoice: any) => void;
  onSendReminder: (invoice: any) => void;
  canSendReminder: (invoice: any) => boolean;
  onDownloadPDF: (invoice: any) => void;
  onClone: (invoice: any) => void;
  onDeleteClick: (invoice: any) => void;
  openActionMenuId: any;
  onSetOpenActionMenuId: (id: any) => void;
  formatNumber: (num: number) => string;

  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  filteredInvoicesLength: number;
  onPageChange: (page: number) => void;
}

const InvoiceListTable: React.FC<InvoiceListTableProps> = ({
  loading,
  paginatedInvoices,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onView,
  onEdit,
  onSend,
  onSendReminder,
  canSendReminder,
  onDownloadPDF,
  onClone,
  onDeleteClick,
  openActionMenuId,
  onSetOpenActionMenuId,
  formatNumber,
  currentPage,
  totalPages,
  itemsPerPage,
  filteredInvoicesLength,
  onPageChange,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-12 px-2 md:px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                  onChange={onSelectAll}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
              </th>
              <th scope="col" className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th scope="col" className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="hidden md:table-cell px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="hidden md:table-cell px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th scope="col" className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="w-12 px-2 md:px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                  Loading invoices...
                </td>
              </tr>
            ) : paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">No invoices found</p>
                  <p className="text-sm text-gray-500 mt-1">Create your first invoice to get started</p>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice: any) => {
                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onView(invoice)}
                  >
                    <td className="px-2 md:px-4 py-3" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(invoice.id)}
                        onChange={() => onSelectOne(invoice.id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-2 md:px-4 py-3 text-sm font-medium text-gray-900">
                      #{invoice.invoice_number || '-'}
                    </td>
                    <td className="px-2 md:px-4 py-3 text-sm text-gray-900">
                      {invoice.contact?.business_name ||
                       `${invoice.contact?.first_name || ''} ${invoice.contact?.last_name || ''}`.trim() ||
                       '-'}
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-4 py-3 text-sm text-gray-500">
                      {formatDate(invoice.issue_date || invoice.invoice_date)}
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-4 py-3 text-sm text-gray-500">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-2 md:px-4 py-3 text-sm font-medium text-gray-900">
                      {invoice.currency?.symbol || getCurrencySymbol(invoice.currency?.code)}{formatNumber(typeof invoice.total === 'number' ? invoice.total : parseFloat(invoice.total || 0))}
                    </td>
                    <td className="px-2 md:px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={invoice.status} />

                        {/* Recurring status badge */}
                        {(invoice.pricing_type === 'recurring' || invoice.is_recurring) && (
                          <span className={`px-2 py-1 text-xs font-medium rounded inline-flex items-center gap-1 ${
                            invoice.parent_invoice_id
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : invoice.recurring_status === 'paused'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : invoice.recurring_status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {!invoice.parent_invoice_id && <Repeat className="h-3 w-3" />}
                            {invoice.parent_invoice_id
                              ? 'Auto-Generated'
                              : invoice.recurring_status === 'paused'
                                ? 'Paused'
                                : invoice.recurring_status === 'cancelled'
                                  ? 'Cancelled'
                                  : 'Active'}
                          </span>
                        )}

                        {/* Generated invoice badge */}
                        {invoice.generated_from_template && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Gen #{invoice.recurrence_sequence_number || 'N/A'}
                          </span>
                        )}

                        {/* Outstanding balance badge */}
                        {invoice.outstanding_balance && parseFloat(invoice.outstanding_balance) !== 0 && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            parseFloat(invoice.outstanding_balance) > 0
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {parseFloat(invoice.outstanding_balance) > 0
                              ? `${invoice.currency?.symbol || getCurrencySymbol(invoice.currency?.code)}${formatNumber(parseFloat(invoice.outstanding_balance))} Due`
                              : `${invoice.currency?.symbol || getCurrencySymbol(invoice.currency?.code)}${formatNumber(Math.abs(parseFloat(invoice.outstanding_balance)))} Credit`
                            }
                          </span>
                        )}

                        {/* Auto-billing failed badge */}
                        {invoice.auto_billing_failed && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-600 text-white inline-flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Payment Failed
                          </span>
                        )}

                        {/* Auto-billing retry scheduled badge */}
                        {!invoice.auto_billing_failed && invoice.next_auto_billing_retry_at && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Retry Scheduled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-3 text-sm" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          id={`action-btn-${invoice.id}`}
                          onClick={() => onSetOpenActionMenuId(openActionMenuId === invoice.id ? null : invoice.id)}
                          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                        {openActionMenuId === invoice.id && (
                          <ActionMenu
                            itemId={invoice.id}
                            onClose={() => onSetOpenActionMenuId(null)}
                            actions={[
                              { label: 'View', onClick: () => onView(invoice) },
                              { label: 'Edit', onClick: () => onEdit(invoice) },
                              { label: 'Send', onClick: () => onSend(invoice) },
                              { label: 'Send Reminder', onClick: () => onSendReminder(invoice), condition: canSendReminder(invoice) },
                              { label: 'Download PDF', onClick: () => onDownloadPDF(invoice) },
                              { label: 'Clone', onClick: () => onClone(invoice) },
                              { label: 'Delete', onClick: () => onDeleteClick(invoice), variant: 'danger' },
                            ]}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && paginatedInvoices.length > 0 && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            {/* Mobile pagination */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredInvoicesLength)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{filteredInvoicesLength}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* Previous button */}
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                {/* Next button */}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceListTable;
