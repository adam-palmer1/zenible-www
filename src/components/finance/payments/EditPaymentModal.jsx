import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Loader2, User, DollarSign, Calendar, FileText, Pencil, Receipt, Plus, Unlink, ChevronDown, Building2, Banknote, Wallet, CircleDollarSign } from 'lucide-react';
import { usePayments } from '../../../contexts/PaymentsContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';
import expensesAPI from '../../../services/api/finance/expenses';
import paymentsAPI from '../../../services/api/finance/payments';
import AssignExpenseModal from '../expenses/AssignExpenseModal';
import ConfirmationModal from '../../common/ConfirmationModal';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'check', label: 'Check', icon: FileText },
  { value: 'stripe', label: 'Stripe', icon: CreditCard },
  { value: 'paypal', label: 'PayPal', icon: Wallet },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'debit_card', label: 'Debit Card', icon: CreditCard },
  { value: 'other', label: 'Other', icon: CircleDollarSign },
];

const EditPaymentModal = ({ isOpen, onClose, payment: paymentProp, refreshKey }) => {
  const { updatePayment, refresh } = usePayments();
  const { showSuccess, showError } = useNotification();
  const methodDropdownRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [unlinkingExpenseId, setUnlinkingExpenseId] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [showAssignExpenseModal, setShowAssignExpenseModal] = useState(false);
  const [unlinkConfirmModal, setUnlinkConfirmModal] = useState({ isOpen: false, expenseId: null });
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    amount: '',
    currency: 'USD',
    payment_method: '',
    payment_date: '',
    reference_number: '',
    notes: '',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target)) {
        setMethodDropdownOpen(false);
      }
    };

    if (methodDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [methodDropdownOpen]);

  // Function to fetch payment details
  const fetchPaymentDetails = async (showLoading = true) => {
    if (!paymentProp?.id) return;

    try {
      if (showLoading) setLoadingDetails(true);
      const data = await paymentsAPI.get(paymentProp.id);
      setPayment(data);
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
      setMethodDropdownOpen(false);
    }
  }, [isOpen, paymentProp?.id]);

  // Refetch when refreshKey changes (after linking an expense)
  useEffect(() => {
    if (isOpen && paymentProp?.id && refreshKey > 0) {
      // Refetch without showing loading spinner
      fetchPaymentDetails(false);
    }
  }, [refreshKey]);

  // Populate form when payment changes
  useEffect(() => {
    if (payment && isOpen) {
      // Get customer name from contact object or direct field
      let customerName = '';
      if (payment.contact) {
        const { first_name, last_name, business_name } = payment.contact;
        if (first_name || last_name) {
          customerName = `${first_name || ''} ${last_name || ''}`.trim();
        } else {
          customerName = business_name || '';
        }
      } else {
        customerName = payment.customer_name || '';
      }

      // Get customer email from contact object or direct field
      const customerEmail = payment.contact?.email || payment.customer_email || '';

      // Get currency code from nested object or direct field
      const currencyCode = payment.currency?.code || payment.currency_code || 'USD';

      // Format payment date
      let paymentDate = '';
      if (payment.payment_date) {
        paymentDate = payment.payment_date.split('T')[0];
      } else if (payment.created_at) {
        paymentDate = payment.created_at.split('T')[0];
      }

      setFormData({
        customer_name: customerName,
        customer_email: customerEmail,
        amount: payment.amount || '',
        currency: currencyCode,
        payment_method: payment.payment_method || '',
        payment_date: paymentDate,
        reference_number: payment.reference_number || '',
        notes: payment.notes || '',
      });
    }
  }, [payment, isOpen]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);

      // Send null explicitly for empty fields to clear them on the backend
      const paymentData = {
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method || null,
        payment_date: formData.payment_date || null,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
      };

      await updatePayment(payment.id, paymentData);
      showSuccess('Payment updated successfully');
      refresh();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to update payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrencyCode = () => {
    return payment.currency?.code || payment.currency_code || formData.currency || 'USD';
  };

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === formData.payment_method);

  const feeExpenses = payment.fee_expenses || [];

  const handleUnlinkExpense = (expenseId) => {
    setUnlinkConfirmModal({ isOpen: true, expenseId });
  };

  const confirmUnlinkExpense = async () => {
    const expenseId = unlinkConfirmModal.expenseId;
    if (!expenseId) return;

    try {
      setUnlinkingExpenseId(expenseId);
      await expensesAPI.update(expenseId, { payment_id: null });
      showSuccess('Expense unlinked successfully');
      // Refetch payment details to get updated fee_expenses
      const updatedPayment = await paymentsAPI.get(payment.id);
      setPayment(updatedPayment);
      refresh();
    } catch (err) {
      showError(err.message || 'Failed to unlink expense');
    } finally {
      setUnlinkingExpenseId(null);
    }
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
              <Pencil className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Payment
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Customer Name and Email (Read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4" />
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer_name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Customer Email
              </label>
              <input
                type="email"
                value={formData.customer_email || '-'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            Customer cannot be changed. Delete and create a new payment if needed.
          </p>

          {/* Amount and Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DollarSign className="h-4 w-4" />
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency
              </label>
              {/* Currency - Styled disabled display */}
              <div className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-md cursor-not-allowed flex items-center justify-between">
                <span>{formData.currency}</span>
              </div>
            </div>
          </div>

          {/* Payment Date and Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4" />
                Payment Date
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {/* Payment Method - Styled Dropdown */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </label>
              <div className="relative" ref={methodDropdownRef}>
                <button
                  type="button"
                  onClick={() => !submitting && setMethodDropdownOpen(!methodDropdownOpen)}
                  disabled={submitting}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    {selectedMethod ? (
                      <>
                        <selectedMethod.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>{selectedMethod.label}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Select method</span>
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${methodDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {methodDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = formData.payment_method === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, payment_method: method.value }));
                            setMethodDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                            isSelected ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
                          <span className={`${isSelected ? 'font-medium text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                            {method.label}
                          </span>
                          {isSelected && (
                            <span className="ml-auto text-purple-600 dark:text-purple-400">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reference Number
            </label>
            <input
              type="text"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              placeholder="e.g., check number, transaction ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4" />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add notes about this payment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Linked Expenses Section */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Receipt className="h-4 w-4" />
                Linked Expenses
              </label>
              <button
                type="button"
                onClick={() => setShowAssignExpenseModal(true)}
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                <Plus className="h-3 w-3" />
                Assign Expenses
              </button>
            </div>

            {feeExpenses.length > 0 ? (
              <div className="space-y-2">
                {feeExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.expense_number || 'No number'}
                        </span>
                        {expense.vendor_name && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                            {expense.vendor_name}
                          </span>
                        )}
                      </div>
                      {expense.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {expense.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(expense.amount, getCurrencyCode())}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnlinkExpense(expense.id)}
                        disabled={unlinkingExpenseId === expense.id}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Unlink expense"
                      >
                        {unlinkingExpenseId === expense.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                No expenses linked to this payment
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
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
          fetchPaymentDetails(false);
          refresh();
        }}
      />

      <ConfirmationModal
        isOpen={unlinkConfirmModal.isOpen}
        onClose={() => setUnlinkConfirmModal({ isOpen: false, expenseId: null })}
        onConfirm={confirmUnlinkExpense}
        title="Unlink Expense"
        message="Remove this expense from the payment?"
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
};

export default EditPaymentModal;
