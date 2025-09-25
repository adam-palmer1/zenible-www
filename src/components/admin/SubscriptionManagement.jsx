import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';

export default function SubscriptionManagement() {
  const { darkMode } = useOutletContext();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  useEffect(() => {
    fetchSubscriptions();
  }, [page]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSubscriptions({ page, per_page: perPage });
      setSubscriptions(response.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await adminAPI.cancelSubscription(subscriptionId);
      fetchSubscriptions();
    } catch (err) {
      alert(`Error: ${err.message}`);
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
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>User ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Plan ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Billing Cycle</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>API Usage</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Period End</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{sub.id.slice(0, 8)}...</td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{sub.user_id.slice(0, 8)}...</td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{sub.plan_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' :
                        sub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{sub.status}</span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{sub.billing_cycle}</td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{sub.api_calls_used || 0}</td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{formatDate(sub.current_period_end)}</td>
                    <td className="px-6 py-4">
                      {sub.status === 'active' && (
                        <button onClick={() => handleCancelSubscription(sub.id)} className="text-red-600 hover:text-red-900 text-sm">
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
      </div>
    </div>
  );
}