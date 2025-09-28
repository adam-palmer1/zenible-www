import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';

export default function SubscriptionManagement() {
  const { darkMode } = useOutletContext();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [page]);

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showCancelModal) {
        closeCancelModal();
      }
    };

    if (showCancelModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showCancelModal]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSubscriptions({ page, per_page: perPage });
      setSubscriptions(response.subscriptions || []);
      setTotalPages(response.pages || 1);
      setTotalSubscriptions(response.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (subscription) => {
    setSelectedSubscription(subscription);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedSubscription(null);
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    setCancelling(true);
    try {
      // Cancel at period end by default for better user experience
      await adminAPI.cancelSubscription(selectedSubscription.id, {
        cancelAtPeriodEnd: true,
        reason: 'Cancelled by admin',
        feedback: ''
      });
      await fetchSubscriptions();
      closeCancelModal();
    } catch (err) {
      setError(`Failed to cancel subscription: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '-';
  const formatCurrency = (amount) => `$${parseFloat(amount || 0).toFixed(2)}`;

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Subscription Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          View and manage user subscriptions
        </p>
      </div>

      <div className="p-6">
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-12">Error: {error}</div>
          ) : (
            <table className="w-full">
              <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>User</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Email</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Plan</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Billing</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Price</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Period End</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {sub.user_name || 'Unknown'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {sub.user_email || 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {sub.plan?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        sub.cancel_at_period_end ? 'bg-yellow-100 text-yellow-800' :
                        sub.status === 'active' ? 'bg-green-100 text-green-800' :
                        sub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sub.cancel_at_period_end ? 'Pending Cancel' : sub.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {sub.billing_cycle}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      ${sub.plan?.monthly_price || 'N/A'}/mo
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {formatDate(sub.current_period_end)}
                    </td>
                    <td className="px-6 py-4">
                      {sub.status === 'active' && !sub.cancel_at_period_end && (
                        <button onClick={() => openCancelModal(sub)} className="text-red-600 hover:text-red-900 text-sm">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, totalSubscriptions)} of {totalSubscriptions} subscriptions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-lg border ${
                  page === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-opacity-10 hover:bg-zenible-primary'
                } ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text' : 'border-gray-300 text-gray-700'}`}
              >
                Previous
              </button>
              <span className={`px-3 py-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-lg border ${
                  page === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-opacity-10 hover:bg-zenible-primary'
                } ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text' : 'border-gray-300 text-gray-700'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Cancel Subscription
              </h3>
              <button
                onClick={closeCancelModal}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-zenible-dark-text-secondary hover:bg-zenible-dark-bg hover:text-zenible-dark-text'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  <strong>Note:</strong> The subscription will be cancelled at the end of the current billing period. The user will retain access until then.
                </p>
              </div>

              <div className={`space-y-3 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                <div>
                  <span className="font-medium">User:</span>
                  <span className="ml-2">{selectedSubscription.user_name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{selectedSubscription.user_email || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Plan:</span>
                  <span className="ml-2">{selectedSubscription.plan?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Billing:</span>
                  <span className="ml-2">${selectedSubscription.plan?.monthly_price || 'N/A'}/mo ({selectedSubscription.billing_cycle})</span>
                </div>
                <div>
                  <span className="font-medium">Current Period Ends:</span>
                  <span className="ml-2">{formatDate(selectedSubscription.current_period_end)}</span>
                </div>
              </div>

              <p className={`mt-4 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                Are you sure you want to cancel this subscription? The user will continue to have access until the period ends.
              </p>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={closeCancelModal}
                disabled={cancelling}
                className={`px-4 py-2 border rounded-lg font-medium ${
                  darkMode
                    ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                  cancelling ? 'cursor-wait' : ''
                }`}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}