import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentTextIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { formatCurrency } from '../../../utils/currency';

/**
 * Recent Invoices Widget for Dashboard
 * Shows the most recent invoices
 *
 * Settings:
 * - limit: Number of invoices to display (default: 5)
 */
const RecentInvoicesWidget = ({ settings = {} }) => {
  const navigate = useNavigate();
  const { invoices, loading, initialized, fetchInvoices } = useInvoices();
  const limit = settings.limit || 5;

  useEffect(() => {
    if (!initialized) {
      fetchInvoices();
    }
  }, [initialized, fetchInvoices]);

  // Get recent invoices (already sorted by created_at desc from context)
  const recentInvoices = invoices.slice(0, limit);

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      partially_paid: 'bg-amber-100 text-amber-700',
    };
    return colors[status] || colors.draft;
  };

  const handleViewAll = () => navigate('/finance/invoices');
  const handleInvoiceClick = (id) => navigate(`/finance/invoices?invoice=${id}`);

  if (loading && !initialized) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[180px]">
      {recentInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No invoices yet</p>
          <button
            onClick={handleViewAll}
            className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
          >
            Create your first invoice
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {recentInvoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => handleInvoiceClick(invoice.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {invoice.invoice_number || `INV-${String(invoice.id).slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {invoice.contact?.display_name || invoice.contact?.company_name || 'No client'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total_amount || invoice.amount || 0, invoice.currency || 'USD')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
            >
              View all invoices
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentInvoicesWidget;
