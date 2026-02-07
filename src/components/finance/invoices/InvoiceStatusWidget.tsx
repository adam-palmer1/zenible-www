import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, DollarSign, Clock, AlertCircle, TrendingUp, ArrowRight, LucideIcon } from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { INVOICE_STATUS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';

const InvoiceStatusWidget: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, loading } = useInvoices();

  // Calculate statistics
  const totalInvoices = invoices.length;
  const overdueInvoices = invoices.filter((inv: any) => {
    if (inv.status === INVOICE_STATUS.PAID) return false;
    if (!inv.due_date) return false;
    return new Date(inv.due_date) < new Date();
  });

  const totalRevenue = invoices
    .filter((inv: any) => inv.status === INVOICE_STATUS.PAID)
    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

  const outstandingAmount = invoices
    .filter((inv: any) => inv.status !== INVOICE_STATUS.PAID && inv.status !== INVOICE_STATUS.CANCELLED)
    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

  const draftCount = invoices.filter((inv: any) => inv.status === INVOICE_STATUS.DRAFT).length;

  const stats: { label: string; value: string | number; icon: LucideIcon; color: string; bgColor: string }[] = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue, 'USD'),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(outstandingAmount, 'USD'),
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: 'Overdue',
      value: overdueInvoices.length,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Draft',
      value: draftCount,
      icon: FileText,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
  ];

  if (loading) {
    return (
      <div className="design-bg-primary rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-48">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="design-bg-primary rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b design-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zenible-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-zenible-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold design-text-primary">Invoice Overview</h3>
              <p className="text-sm design-text-secondary">
                {totalInvoices} total invoices
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/finance/invoices')}
            className="text-sm text-zenible-primary hover:text-zenible-primary/80 font-medium flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="design-bg-secondary rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold design-text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-xs design-text-secondary">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Overdue */}
        {overdueInvoices.length > 0 && (
          <div className="mt-4 pt-4 border-t design-border">
            <h4 className="text-sm font-medium design-text-primary mb-3">
              Recent Overdue Invoices
            </h4>
            <div className="space-y-2">
              {overdueInvoices.slice(0, 3).map((invoice: any) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                  className="flex items-center justify-between p-3 design-bg-tertiary rounded-lg hover:design-bg-quaternary cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium design-text-primary truncate">
                      {invoice.invoice_number}
                    </div>
                    <div className="text-xs design-text-secondary truncate">
                      {invoice.contact?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="ml-3 text-right">
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </div>
                    <div className="text-xs design-text-secondary">
                      {invoice.due_date && new Date(invoice.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {overdueInvoices.length > 3 && (
              <button
                onClick={() => navigate('/finance/invoices?status=overdue')}
                className="mt-3 w-full text-sm text-zenible-primary hover:text-zenible-primary/80 font-medium"
              >
                View all {overdueInvoices.length} overdue invoices
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceStatusWidget;
