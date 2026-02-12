import React, { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { usePayments } from '../../../contexts/PaymentsContext';
import PaymentList from './PaymentList';
import PaymentDetailModal from './PaymentDetailModal';
import RefundModal from './RefundModal';
import CreatePaymentModal from './CreatePaymentModal';
import EditPaymentModal from './EditPaymentModal';
import PaymentMethodsManager from './PaymentMethodsManager';
import AppLayout from '../../layout/AppLayout';

const PaymentDashboard: React.FC = () => {
  const {
    showDetailModal,
    showRefundModal,
    showCreateModal,
    showEditModal,
    selectedPayment,
    closeDetailModal,
    closeRefundModal,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
  } = usePayments();

  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  return (
    <AppLayout pageTitle="Payments">
      {/* Top Bar - Fixed at top, matches Invoice design */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between min-h-[64px]">
        <h1 className="text-xl md:text-2xl font-semibold text-[#09090b]">
          Payments
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPaymentMethods(true)}
            className="inline-flex items-center gap-2 px-3 py-2.5 text-base font-medium text-[#09090b] bg-white border border-[#e5e5e5] rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-5 w-5" />
            Payment Methods
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3 py-2.5 text-base font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors"
          >
            <Plus className="h-5 w-5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <PaymentList />
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
    </AppLayout>
  );
};

export default PaymentDashboard;
