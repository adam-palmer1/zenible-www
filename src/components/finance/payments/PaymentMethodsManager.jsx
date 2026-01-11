import React, { useState } from 'react';
import { X, CreditCard, Plus, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { usePayments } from '../../../contexts/PaymentsContext';
import { useNotification } from '../../../contexts/NotificationContext';

const PaymentMethodsManager = ({ isOpen, onClose }) => {
  const {
    paymentMethods,
    methodsLoading,
    fetchPaymentMethods,
    removePaymentMethod
  } = usePayments();
  const { showSuccess, showError } = useNotification();

  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const handleRemoveMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setDeletingId(methodId);
      await removePaymentMethod(methodId);
      showSuccess('Payment method removed successfully');
    } catch (err) {
      showError(err.message || 'Failed to remove payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const getCardIcon = (brand) => {
    const brandIcons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      default: '💳'
    };
    return brandIcons[brand?.toLowerCase()] || brandIcons.default;
  };

  const formatCardBrand = (brand) => {
    const brandNames = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
    };
    return brandNames[brand?.toLowerCase()] || brand || 'Card';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Methods
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your saved payment methods
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {methodsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-700">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No payment methods
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                You haven't added any payment methods yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getCardIcon(method.card?.brand || method.brand)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCardBrand(method.card?.brand || method.brand)}
                        </span>
                        {method.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        •••• •••• •••• {method.card?.last4 || method.last4 || '****'}
                      </div>
                      {(method.card?.exp_month || method.exp_month) && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Expires {method.card?.exp_month || method.exp_month}/{method.card?.exp_year || method.exp_year}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMethod(method.id)}
                    disabled={deletingId === method.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 dark:hover:bg-red-900/20"
                    title="Remove payment method"
                  >
                    {deletingId === method.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Adding Payment Methods</p>
                <p className="mt-1">
                  New payment methods can be added during checkout or through your account settings.
                  All payment information is securely processed by Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => fetchPaymentMethods()}
            disabled={methodsLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsManager;
