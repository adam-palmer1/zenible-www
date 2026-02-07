import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileCheck,
  Receipt,
  CreditCard,
  Wallet,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { useReports } from '../../../contexts/ReportsContext';

/**
 * Transaction type icons and colors
 */
const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  invoice: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  quote: { icon: FileCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  expense: { icon: Receipt, color: 'text-red-600', bg: 'bg-red-50' },
  credit_note: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
  payment: { icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
};

/**
 * Unified status colors
 */
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
};

/**
 * Format date (e.g., "12 Jan 2024")
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format type label
 */
const formatTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    invoice: 'Invoice',
    quote: 'Quote',
    expense: 'Expense',
    credit_note: 'Credit Note',
    payment: 'Payment',
  };
  return labels[type] || type;
};

/**
 * Format status label
 */
const formatStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status] || status;
};

/**
 * Get display name for contact
 */
const getContactDisplayName = (contact: any): string => {
  if (!contact) return '-';
  if (contact.business_name) return contact.business_name;
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  return fullName || contact.email || '-';
};

interface SortHeaderProps {
  field: string;
  label: string;
  currentSort: string;
  currentDirection: string;
  onSort: (field: string) => void;
}

/**
 * Sortable column header
 */
const SortHeader: React.FC<SortHeaderProps> = ({ field, label, currentSort, currentDirection, onSort }) => {
  const isActive = currentSort === field;

  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="flex flex-col">
          <ChevronUp
            className={`w-3 h-3 -mb-1 ${
              isActive && currentDirection === 'asc' ? 'text-purple-600' : 'text-gray-300'
            }`}
          />
          <ChevronDown
            className={`w-3 h-3 ${
              isActive && currentDirection === 'desc' ? 'text-purple-600' : 'text-gray-300'
            }`}
          />
        </span>
      </div>
    </th>
  );
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component
 */
const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="text-sm text-[#71717a]">{total} transactions</div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium ${
                currentPage === page
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Transaction List Component
 */
const TransactionList: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, total, totalPages, loading, filters, setSort, setPage } = useReports() as any;

  const handleSort = (field: string) => {
    setSort(field);
  };

  const handleRowClick = (transaction: any) => {
    const routes: Record<string, string> = {
      invoice: `/finance/invoices/${transaction.id}`,
      quote: `/finance/quotes/${transaction.id}`,
      expense: `/finance/expenses/${transaction.id}/edit`,
      credit_note: `/finance/credit-notes/${transaction.id}`,
      payment: `/finance/payments/${transaction.id}`,
    };
    const route = routes[transaction.transaction_type];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Results count */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <span className="text-sm text-[#71717a]">
          {loading ? 'Loading...' : `${total} transactions found`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader
                field="transaction_type"
                label="Type"
                currentSort={filters.sort_by}
                currentDirection={filters.sort_direction}
                onSort={handleSort}
              />
              <SortHeader
                field="transaction_number"
                label="Number"
                currentSort={filters.sort_by}
                currentDirection={filters.sort_direction}
                onSort={handleSort}
              />
              <SortHeader
                field="transaction_date"
                label="Date"
                currentSort={filters.sort_by}
                currentDirection={filters.sort_direction}
                onSort={handleSort}
              />
              <SortHeader
                field="contact_name"
                label="Client"
                currentSort={filters.sort_by}
                currentDirection={filters.sort_direction}
                onSort={handleSort}
              />
              <SortHeader
                field="amount"
                label="Amount"
                currentSort={filters.sort_by}
                currentDirection={filters.sort_direction}
                onSort={handleSort}
              />
              <SortHeader
                field="unified_status"
                label="Status"
                currentSort={filters.sort_by}
                currentDirection={filters.sort_direction}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                  No transactions found matching your filters
                </td>
              </tr>
            ) : (
              transactions.map((txn: any) => {
                const typeConfig = TYPE_CONFIG[txn.transaction_type] || TYPE_CONFIG.invoice;
                const TypeIcon = typeConfig.icon;

                return (
                  <tr
                    key={`${txn.transaction_type}-${txn.id}`}
                    onClick={() => handleRowClick(txn)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 ${typeConfig.bg} rounded-lg flex items-center justify-center`}
                        >
                          <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                        </div>
                        <span className={`text-sm font-medium ${typeConfig.color}`}>
                          {formatTypeLabel(txn.transaction_type)}
                        </span>
                      </div>
                    </td>

                    {/* Number */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-[#09090b]">
                        {txn.transaction_number}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#71717a]">
                        {formatDate(txn.transaction_date)}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#09090b]">
                        {getContactDisplayName(txn.contact)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[#09090b]">
                        {txn.currency?.symbol || '$'}
                        {parseFloat(txn.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          STATUS_COLORS[txn.unified_status] || STATUS_COLORS.pending
                        }`}
                      >
                        {formatStatusLabel(txn.unified_status)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
};

export default TransactionList;
