import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';

export default function PaymentTracking() {
  const { darkMode } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllPayments({ page, per_page: perPage });
      setPayments(response.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId) => {
    if (!confirm('Are you sure you want to refund this payment?')) return;
    try {
      await adminAPI.refundPayment(paymentId);
      fetchPayments();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '-';
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      succeeded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Payment Tracking
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Monitor and manage payment transactions
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
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Payment ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>User ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Amount</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Type</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className={`px-6 py-4 text-sm font-mono ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {payment.id.slice(0, 12)}...
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {payment.user_id.slice(0, 8)}...
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {payment.type}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {payment.status === 'succeeded' && (
                        <button onClick={() => handleRefund(payment.id)} className="text-purple-600 hover:text-purple-900 text-sm">
                          Refund
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