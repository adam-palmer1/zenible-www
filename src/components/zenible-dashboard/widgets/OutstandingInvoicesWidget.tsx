import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, ArrowRightIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import invoicesAPI from '../../../services/api/finance/invoices';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { formatCurrency } from '../../../utils/currency';
import { LoadingSpinner } from '../../shared';

interface OutstandingInvoicesWidgetProps {
  settings?: Record<string, any>;
}

/**
 * Outstanding Invoices Widget for Dashboard
 * Shows summary of unpaid and overdue invoices using the stats API
 */
const OutstandingInvoicesWidget = ({ settings: _settings = {} }: OutstandingInvoicesWidgetProps) => {
  const navigate = useNavigate();
  const { defaultCurrency, loading: currencyLoading } = useCompanyCurrencies();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = defaultCurrency?.currency?.code || 'GBP';

  useEffect(() => {
    // Wait for company currency to load
    if (currencyLoading) {
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await invoicesAPI.getStats();
        setStats(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch invoice stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currencyLoading]);

  const handleViewOutstanding = () => navigate('/finance/invoices?status=outstanding');
  const handleViewOverdue = () => navigate('/finance/invoices?status=overdue');

  if (loading || currencyLoading) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px] text-gray-500 text-sm">
        Failed to load invoice stats
      </div>
    );
  }

  const totalOutstanding = parseFloat(stats?.total_outstanding || 0);
  const totalOverdue = parseFloat(stats?.overdue_value || 0);
  const overdueCount = stats?.overdue_count || 0;
  const outstandingCount = stats?.outstanding_count || 0;

  return (
    <div className="flex flex-col h-full justify-center gap-2">
      {/* Outstanding */}
      <button
        onClick={handleViewOutstanding}
        className="flex items-center justify-between p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <span className="text-xs text-gray-600 font-medium">Outstanding ({outstandingCount})</span>
        <span className="text-sm font-bold text-gray-700">
          {formatCurrency(totalOutstanding, currency)}
        </span>
      </button>

      {/* Overdue */}
      <button
        onClick={handleViewOverdue}
        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
          overdueCount > 0
            ? 'bg-red-50 hover:bg-red-100'
            : 'bg-green-50 hover:bg-green-100'
        }`}
      >
        <span className={`text-xs font-medium ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          Overdue ({overdueCount})
        </span>
        <span className={`text-sm font-bold ${overdueCount > 0 ? 'text-red-700' : 'text-green-700'}`}>
          {formatCurrency(totalOverdue, currency)}
        </span>
      </button>
    </div>
  );
};

export default OutstandingInvoicesWidget;
