import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, ArrowRightIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import invoicesAPI from '../../../services/api/finance/invoices';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { formatCurrency } from '../../../utils/currency';

/**
 * Outstanding Invoices Widget for Dashboard
 * Shows summary of unpaid and overdue invoices using the stats API
 */
const OutstandingInvoicesWidget = ({ settings = {} }) => {
  const navigate = useNavigate();
  const { defaultCurrency, loading: currencyLoading } = useCompanyCurrencies();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err) {
        console.error('Failed to fetch invoice stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currencyLoading]);

  const handleViewOutstanding = () => navigate('/finance/invoices?status=sent,partially_paid');
  const handleViewOverdue = () => navigate('/finance/invoices?status=overdue');

  if (loading || currencyLoading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[180px] text-gray-500 text-sm">
        Failed to load invoice stats
      </div>
    );
  }

  const totalOutstanding = parseFloat(stats?.total_outstanding || 0);
  const totalOverdue = parseFloat(stats?.overdue_value || 0);
  const overdueCount = stats?.overdue_count || 0;
  const outstandingCount = (stats?.sent_count || 0);

  return (
    <div className="flex flex-col h-[180px]">
      {/* Outstanding Amount */}
      <div className="flex-1 space-y-4">
        <button
          onClick={handleViewOutstanding}
          className="w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-blue-600 font-medium mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(totalOutstanding, currency)}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                {outstandingCount} invoice{outstandingCount !== 1 ? 's' : ''}
              </p>
            </div>
            <BanknotesIcon className="w-10 h-10 text-blue-300 group-hover:text-blue-400" />
          </div>
        </button>

        {/* Overdue Amount */}
        {overdueCount > 0 ? (
          <button
            onClick={handleViewOverdue}
            className="w-full p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-700">
                    {formatCurrency(totalOverdue, currency)} overdue
                  </p>
                  <p className="text-xs text-red-500">
                    {overdueCount} invoice{overdueCount !== 1 ? 's' : ''} past due
                  </p>
                </div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-red-400 group-hover:text-red-600" />
            </div>
          </button>
        ) : (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 text-center">
              No overdue invoices
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingInvoicesWidget;
