import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCardIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { usePayments } from '../../../contexts/PaymentsContext';
import { formatCurrency } from '../../../utils/currency';
import { LoadingSpinner } from '../../shared';

interface RecentPaymentsWidgetProps {
  settings?: Record<string, any>;
  isHovered?: boolean;
}

/**
 * Recent Payments Widget for Dashboard
 * Shows the most recent payments received
 */
const RecentPaymentsWidget = ({ settings = {}, isHovered = false }: RecentPaymentsWidgetProps) => {
  const navigate = useNavigate();
  const { payments, loading, initialized, fetchPayments } = usePayments();
  const limit = settings.limit || 5;

  useEffect(() => {
    if (!initialized) {
      fetchPayments();
    }
  }, [initialized, fetchPayments]);

  // Get recent payments
  const recentPayments = payments.slice(0, limit);

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleViewAll = () => navigate('/finance/payments');
  const handlePaymentClick = (id: string) => navigate(`/finance/payments?payment=${id}`);

  if (loading && !initialized) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  return (
    <div className="flex flex-col h-full">
      {recentPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <CreditCardIcon className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No payments received yet</p>
          <button
            onClick={handleViewAll}
            className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
          >
            Record a payment
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <div
              className="h-full overflow-y-auto space-y-2"
              style={{
                width: isHovered ? '100%' : 'calc(100% + 17px)',
                paddingRight: isHovered ? '0' : '17px',
                transition: 'width 0.2s ease, padding-right 0.2s ease'
              }}
            >
            {recentPayments.map((payment: any) => (
              <button
                key={payment.id}
                onClick={() => handlePaymentClick(payment.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.contact?.business_name ||
                       (payment.contact?.first_name && payment.contact?.last_name
                         ? `${payment.contact.first_name} ${payment.contact.last_name}`.trim()
                         : payment.contact?.first_name || 'Unknown client')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.payment_number} &bull; {formatDate(payment.payment_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-medium text-green-600">
                      +{formatCurrency(parseFloat(payment.amount) || 0, payment.currency?.code || 'USD')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
            >
              View all payments
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentPaymentsWidget;
