import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, CheckCircle, XCircle, Clock, Send, TrendingUp, DollarSign } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { QUOTE_STATUS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import QuoteList from './QuoteList';
import NewSidebar from '../../sidebar/NewSidebar';

const QuoteDashboard = () => {
  const navigate = useNavigate();
  const { quotes, loading, stats, statsLoading } = useQuotes();

  // Use stats from API if available, otherwise calculate from quotes
  const totalQuotes = stats?.total_count ?? quotes.length;
  const draftCount = stats?.draft_count ?? quotes.filter(q => q.status === QUOTE_STATUS.DRAFT).length;
  const sentCount = stats?.sent_count ?? quotes.filter(q => q.status === QUOTE_STATUS.SENT).length;
  const acceptedCount = stats?.accepted_count ?? quotes.filter(q => q.status === QUOTE_STATUS.ACCEPTED).length;
  const rejectedCount = stats?.rejected_count ?? quotes.filter(q => q.status === QUOTE_STATUS.REJECTED).length;
  const expiredCount = stats?.expired_count ?? quotes.filter(q => q.status === QUOTE_STATUS.EXPIRED).length;
  const invoicedCount = stats?.invoiced_count ?? quotes.filter(q => q.status === QUOTE_STATUS.INVOICED).length;

  const totalValue = stats?.total_value ?? quotes.reduce((sum, q) => sum + (q.total || 0), 0);
  const acceptedValue = stats?.accepted_value ?? quotes.filter(q => q.status === QUOTE_STATUS.ACCEPTED).reduce((sum, q) => sum + (q.total || 0), 0);
  const pendingValue = stats?.pending_value ?? quotes.filter(q => q.status === QUOTE_STATUS.SENT).reduce((sum, q) => sum + (q.total || 0), 0);

  // Acceptance rate from API or calculate
  const acceptanceRate = stats?.acceptance_rate ?? (
    (acceptedCount + rejectedCount) > 0
      ? Math.round((acceptedCount / (acceptedCount + rejectedCount)) * 100)
      : 0
  );

  const isLoading = loading || statsLoading;

  const statsCards = [
    { name: 'Total Quotes', value: totalQuotes, icon: FileText, color: 'bg-blue-500' },
    { name: 'Total Value', value: formatCurrency(totalValue, 'USD'), icon: DollarSign, color: 'bg-purple-500' },
    { name: 'Accepted Value', value: formatCurrency(acceptedValue, 'USD'), icon: CheckCircle, color: 'bg-green-500' },
    { name: 'Acceptance Rate', value: `${acceptanceRate}%`, icon: TrendingUp, color: 'bg-indigo-500' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold design-text-primary">Quotes</h1>
              <p className="text-sm design-text-secondary mt-1">Manage and track your quotes</p>
            </div>
            <button onClick={() => navigate('/finance/quotes/new')} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat) => (
              <div key={stat.name} className="design-bg-primary rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: stat.color.replace('bg-', '#') }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm design-text-secondary mb-1">{stat.name}</p>
                    <p className="text-2xl font-bold design-text-primary">{isLoading ? '...' : stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Breakdown */}
          <div className="design-bg-primary rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold design-text-primary mb-4">Status Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-500 dark:text-gray-400">{isLoading ? '...' : draftCount}</div>
                <div className="text-sm design-text-secondary mt-1">Draft</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{isLoading ? '...' : sentCount}</div>
                <div className="text-sm design-text-secondary mt-1">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{isLoading ? '...' : acceptedCount}</div>
                <div className="text-sm design-text-secondary mt-1">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{isLoading ? '...' : rejectedCount}</div>
                <div className="text-sm design-text-secondary mt-1">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{isLoading ? '...' : expiredCount}</div>
                <div className="text-sm design-text-secondary mt-1">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{isLoading ? '...' : invoicedCount}</div>
                <div className="text-sm design-text-secondary mt-1">Invoiced</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {isLoading ? '...' : formatCurrency(pendingValue, 'USD')}
                </div>
                <div className="text-sm design-text-secondary mt-1">Pending Value</div>
              </div>
            </div>
          </div>

          <QuoteList />
        </div>
      </div>
    </div>
  );
};

export default QuoteDashboard;
