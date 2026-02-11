import React, { useState, useEffect } from 'react';
import { X, Loader2, CreditCard } from 'lucide-react';
import { adminSubscriptionsAPI } from '../../../services/adminAPI';

interface SubscriptionHistoryModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const SubscriptionHistoryModal: React.FC<SubscriptionHistoryModalProps> = ({
  userId,
  userName,
  onClose,
}) => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await adminSubscriptionsAPI.getUserSubscriptionHistory(userId, {
        page: String(page),
        per_page: '10',
      }) as any;
      setSubscriptions(response.subscriptions || response.items || []);
      setTotalPages(response.pages || response.total_pages || 1);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('Failed to fetch subscription history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString() : '-';

  const getStatusBadge = (sub: any) => {
    const status = (sub.status || '').toLowerCase();
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${
        sub.cancel_at_period_end ? 'bg-yellow-100 text-yellow-800' :
        status === 'active' ? 'bg-green-100 text-green-800' :
        status === 'canceled' || status === 'cancelled' ? 'bg-red-100 text-red-800' :
        status === 'past_due' ? 'bg-orange-100 text-orange-800' :
        status === 'trialing' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {sub.cancel_at_period_end ? 'Pending Cancel' : sub.status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-3xl mx-2 sm:mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Subscription History
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{userName}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No subscription records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase whitespace-nowrap text-gray-500 dark:text-gray-400">Plan</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase whitespace-nowrap text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase whitespace-nowrap text-gray-500 dark:text-gray-400">Billing</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase whitespace-nowrap text-gray-500 dark:text-gray-400">Price</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase whitespace-nowrap text-gray-500 dark:text-gray-400">Period Start</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase whitespace-nowrap text-gray-500 dark:text-gray-400">Period End</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium uppercase whitespace-nowrap text-gray-500 dark:text-gray-400">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {subscriptions.map((sub: any) => (
                    <tr key={sub.id}>
                      <td className="px-3 sm:px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">{sub.plan?.name || 'N/A'}</td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">{getStatusBadge(sub)}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">{sub.billing_cycle}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">${sub.plan?.monthly_price || 'N/A'}/mo</td>
                      <td className="px-3 sm:px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">{formatDate(sub.current_period_start)}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">{formatDate(sub.current_period_end)}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">{formatDate(sub.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {total} record{total !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionHistoryModal;
