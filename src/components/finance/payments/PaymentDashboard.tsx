import React, { useState } from 'react';
import { CreditCard, Settings } from 'lucide-react';
import { usePayments } from '../../../contexts/PaymentsContext';
import PaymentList from './PaymentList';
import PaymentDetailModal from './PaymentDetailModal';
import RefundModal from './RefundModal';
import CreatePaymentModal from './CreatePaymentModal';
import EditPaymentModal from './EditPaymentModal';
import PaymentMethodsManager from './PaymentMethodsManager';
import NewSidebar from '../../sidebar/NewSidebar';

const PaymentDashboard: React.FC = () => {
  const {
    showDetailModal,
    showRefundModal,
    showCreateModal,
    showEditModal,
    selectedPayment,
    closeDetailModal,
    closeRefundModal,
    closeCreateModal,
    closeEditModal,
  } = usePayments();

  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 280px)' }}
      >
        {/* Top Bar */}
        <div className="bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between min-h-[64px] dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-semibold text-[#09090b] dark:text-white">
              Payments
            </h1>
          </div>
          <button
            onClick={() => setShowPaymentMethods(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <Settings className="h-4 w-4" />
            Payment Methods
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <PaymentList />
          </div>
        </div>
      </div>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        payment={selectedPayment}
      />

      {/* Refund Modal */}
      <RefundModal
        isOpen={showRefundModal}
        onClose={closeRefundModal}
        payment={selectedPayment}
      />

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
      />

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        payment={selectedPayment}
      />

      {/* Payment Methods Manager */}
      <PaymentMethodsManager
        isOpen={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
      />
    </div>
  );
};

export default PaymentDashboard;
