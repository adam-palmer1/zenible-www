import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, User, Mail, FileText, Clock, RotateCcw, Loader2, Receipt } from 'lucide-react';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS
} from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import { usePayments } from '../../../contexts/PaymentsContext';
import paymentsAPI from '../../../services/api/finance/payments';
import AssignExpenseModal from '../expenses/AssignExpenseModal';
import { AllocationSummaryBar, ProjectAllocationModal, ExpenseAllocationSummaryBar } from '../allocations';

const PaymentDetailModal = ({ isOpen, onClose, payment: paymentProp, refreshKey }) => {
  const { openRefundModal, refresh } = usePayments();
  const [payment, setPayment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAssignExpenseModal, setShowAssignExpenseModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [expenseRefreshKey, setExpenseRefreshKey] = useState(0);

  // Function to fetch payment details
  const fetchPaymentDetails = async (showLoading = true) => {
    if (!paymentProp?.id) return;

    try {
      if (showLoading) setLoadingDetails(true);
      // Fetch payment details and project allocations in parallel
      const [paymentData, allocationsData] = await Promise.all([
        paymentsAPI.get(paymentProp.id),
        paymentsAPI.getProjectAllocations(paymentProp.id).catch(() => ({ allocations: [] })),
      ]);
      // Merge allocations into payment object
      setPayment({
        ...paymentData,
        project_allocations: allocationsData.allocations || [],
      });
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setPayment(paymentProp);
    } finally {
      if (showLoading) setLoadingDetails(false);
    }
  };

  // Fetch full payment details when modal opens
  useEffect(() => {
    if (isOpen && paymentProp?.id) {
      fetchPaymentDetails(true);
    } else if (!isOpen) {
      setPayment(null);
    }
  }, [isOpen, paymentProp?.id]);

  // Refetch when refreshKey changes (after linking an expense)
  useEffect(() => {
    if (isOpen && paymentProp?.id && refreshKey > 0) {
      // Refetch without showing loading spinner
      fetchPaymentDetails(false);
    }
  }, [refreshKey]);

  if (!isOpen || !paymentProp) return null;

  // Show loading state while fetching details
  if (loadingDetails || !payment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl p-8 dark:bg-gray-800">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to get customer display name from contact object
  const getCustomerName = () => {
    if (payment.contact) {
      const { first_name, last_name, business_name } = payment.contact;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return business_name || '-';
    }
    return payment.customer_name || '-';
  };

  // Helper to get customer email from contact object
  const getCustomerEmail = () => {
    return payment.contact?.email || payment.customer_email || '-';
  };

  // Helper to get currency code
  const getCurrencyCode = () => {
    return payment.currency?.code || payment.currency_code || 'USD';
  };

  const canRefund = payment.status === 'completed' || payment.status === 'succeeded';

  const handleRefund = () => {
    onClose();
    openRefundModal(payment);
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
                Payment Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{payment.payment_number || payment.id?.toString().slice(-8)}
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
        <div className="p-4 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${PAYMENT_STATUS_COLORS[payment.status] || 'bg-gray-100 text-gray-700'}`}>
              {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
            </span>
            {payment.type && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {PAYMENT_TYPE_LABELS[payment.type] || payment.type}
              </span>
            )}
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(payment.amount, getCurrencyCode())}
            </div>
            {payment.refunded_amount && parseFloat(payment.refunded_amount) > 0 && (
              <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Refunded: {formatCurrency(payment.refunded_amount, getCurrencyCode())}
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customer */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4" />
                Customer
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {getCustomerName()}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getCustomerEmail()}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <CreditCard className="h-4 w-4" />
                Method
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method || '-'}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                Date
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(payment.payment_date || payment.created_at)}
              </div>
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FileText className="h-4 w-4" />
                Notes
              </div>
              <div className="text-sm text-gray-900 dark:text-white bg-gray-50 p-3 rounded-lg dark:bg-gray-900">
                {payment.notes}
              </div>
            </div>
          )}

          {/* Invoice Payments */}
          {payment.invoice_payments && payment.invoice_payments.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Applied to Invoice{payment.invoice_payments.length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="space-y-2">
                {payment.invoice_payments.map((invoicePayment, index) => (
                  <div
                    key={invoicePayment.id || index}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      {invoicePayment.invoice_number}
                    </span>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      {formatCurrency(invoicePayment.amount_applied, getCurrencyCode())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Details */}
          {(payment.stripe_payment_intent_id || payment.transaction_id) && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Transaction Details</h3>
              {payment.stripe_payment_intent_id && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Stripe Intent ID</span>
                  <span className="font-mono text-gray-900 dark:text-white text-xs">
                    {payment.stripe_payment_intent_id}
                  </span>
                </div>
              )}
              {payment.transaction_id && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                  <span className="font-mono text-gray-900 dark:text-white text-xs">
                    {payment.transaction_id}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Gateway Fee Info */}
          {(payment.gateway_fee_amount || payment.gateway_net_amount) && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Gateway Fees</h3>
              {payment.gateway_fee_amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Processing Fee</span>
                  <span className="text-red-600 dark:text-red-400">
                    -{formatCurrency(payment.gateway_fee_amount, getCurrencyCode())}
                  </span>
                </div>
              )}
              {payment.gateway_net_amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Net Amount</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(payment.gateway_net_amount, getCurrencyCode())}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Expense Allocations */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <ExpenseAllocationSummaryBar
              entityType="payment"
              entityId={payment?.id}
              totalAmount={parseFloat(payment.amount) || 0}
              currency={getCurrencyCode()}
              onManageClick={() => setShowAssignExpenseModal(true)}
              showManageButton={true}
              refreshKey={expenseRefreshKey}
            />
          </div>

          {/* Project Allocations */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <AllocationSummaryBar
              allocations={payment.project_allocations || []}
              totalAmount={parseFloat(payment.amount) || 0}
              currency={getCurrencyCode()}
              onManageClick={() => setShowProjectModal(true)}
              showManageButton={true}
            />
          </div>

          {/* Refund History */}
          {payment.refunds && payment.refunds.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Refund History</h3>
              <div className="space-y-2">
                {payment.refunds.map((refund, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-orange-50 p-2 rounded dark:bg-orange-900/20">
                    <div>
                      <span className="text-orange-700 dark:text-orange-400">
                        {formatCurrency(refund.amount, getCurrencyCode())}
                      </span>
                      {refund.reason && (
                        <span className="text-gray-500 ml-2">- {refund.reason}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(refund.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Close
          </button>
          {canRefund && (
            <button
              onClick={handleRefund}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Issue Refund
            </button>
          )}
        </div>
      </div>

      {/* Assign Expense Modal */}
      <AssignExpenseModal
        open={showAssignExpenseModal}
        onOpenChange={setShowAssignExpenseModal}
        entityType="payment"
        entityId={payment?.id}
        entityName={`Payment #${payment?.payment_number || payment?.id?.toString().slice(-8)}`}
        currency={getCurrencyCode()}
        onUpdate={() => {
          setExpenseRefreshKey((k) => k + 1);
          fetchPaymentDetails(false);
          refresh();
        }}
      />

      {/* Project Allocation Modal */}
      <ProjectAllocationModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
        entityType="payment"
        entityId={payment?.id}
        entityName={`Payment #${payment?.payment_number || payment?.id?.toString().slice(-8)}`}
        entityAmount={parseFloat(payment?.amount) || 0}
        currency={getCurrencyCode()}
        currentAllocations={payment?.project_allocations || []}
        onUpdate={() => {
          fetchPaymentDetails(false);
          refresh();
        }}
      />
    </div>
  );
};

export default PaymentDetailModal;
