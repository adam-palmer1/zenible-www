import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import reportsAPI from '../../../services/api/finance/reports';
import { queryKeys } from '../../../lib/query-keys';
import { formatDate } from '../../../utils/dateUtils';
import type { ReportsSummaryParams } from '../../../hooks/finance/useReportsSummary';

/* ── Status badge ────────────────────────────────────────────── */

const UNIFIED_STATUS_STYLES: Record<string, string> = {
  draft:       'bg-gray-100 text-gray-700',
  pending:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
  refunded:    'bg-orange-100 text-orange-700',
};

const UNIFIED_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const TYPE_LABELS: Record<string, string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  expense: 'Expense',
  credit_note: 'Credit Note',
  payment: 'Payment',
};

const TYPE_STYLES: Record<string, string> = {
  invoice:     'bg-blue-50 text-blue-700',
  quote:       'bg-purple-50 text-purple-700',
  expense:     'bg-red-50 text-red-700',
  credit_note: 'bg-orange-50 text-orange-700',
  payment:     'bg-green-50 text-green-700',
};

/* ── Props ───────────────────────────────────────────────────── */

interface ReportsTransactionTableProps {
  filterParams: ReportsSummaryParams;
}

const PER_PAGE = 20;

/**
 * Transactions table for the Reports Overview tab.
 * Fetches paginated transactions matching the same filters as the summary/charts.
 */
const ReportsTransactionTable: React.FC<ReportsTransactionTableProps> = ({ filterParams }) => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  // Reset to page 1 when filters change
  const filterKey = JSON.stringify(filterParams);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const queryParams = useMemo(() => ({
    page,
    per_page: PER_PAGE,
    sort_by: 'transaction_date',
    sort_direction: 'desc',
    ...filterParams,
  }), [page, filterParams]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.financeReports.transactions(queryParams),
    queryFn: () => reportsAPI.listTransactions(queryParams),
    enabled: !!user,
  });

  const items: any[] = (data as any)?.items || [];
  const total: number = (data as any)?.total || 0;
  const totalPages: number = (data as any)?.total_pages || 0;

  const getContactName = (item: any): string => {
    if (!item.contact) return '-';
    return item.contact.business_name
      || `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim()
      || '-';
  };

  const formatAmount = (item: any): string => {
    const symbol = item.currency?.symbol || '$';
    const num = parseFloat(item.amount) || 0;
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /* ── Loading skeleton ──────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex gap-4">
              <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Empty state ───────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-[#09090b]">Transactions</h3>
        </div>
        <div className="py-12 text-center">
          <p className="text-[#71717a]">No transactions found for the selected filters</p>
        </div>
      </div>
    );
  }

  /* ── Table ─────────────────────────────────────────────────── */
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#09090b]">
          Transactions
          <span className="ml-2 text-sm font-normal text-[#71717a]">({total})</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_STYLES[item.transaction_type] || 'bg-gray-100 text-gray-700'}`}>
                    {TYPE_LABELS[item.transaction_type] || item.transaction_type}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.transaction_number || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 max-w-[200px] truncate">
                  {getContactName(item)}
                </td>
                <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.transaction_date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatAmount(item)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${UNIFIED_STATUS_STYLES[item.unified_status] || 'bg-gray-100 text-gray-700'}`}>
                    {UNIFIED_STATUS_LABELS[item.unified_status] || item.original_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-[32px] h-8 px-2 text-sm rounded-md ${
                    page === pageNum
                      ? 'bg-purple-50 border border-purple-500 text-purple-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTransactionTable;
