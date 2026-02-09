import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Loader2, ChevronDown, Building2, Banknote, FileText, CreditCard, Wallet, CircleDollarSign } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';
import paymentsAPI from '../../../services/api/finance/payments';
import DatePickerCalendar from '../../shared/DatePickerCalendar';

interface PaymentMethod {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'check', label: 'Check', icon: FileText },
  { value: 'stripe', label: 'Stripe', icon: CreditCard },
  { value: 'paypal', label: 'PayPal', icon: Wallet },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'debit_card', label: 'Debit Card', icon: CreditCard },
  { value: 'other', label: 'Other', icon: CircleDollarSign },
];

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess?: (payment: any) => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, invoice, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
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

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === formData.payment_method) || PAYMENT_METHODS[0];

  useEffect(() => {
    if (isOpen && invoice) {
      // Pre-fill amount with outstanding balance
      setFormData({
        amount: invoice.outstanding_balance?.toString() || '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
      });
    }
  }, [isOpen, invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    if (!formData.payment_date) {
      showError('Please select a payment date');
      return;
    }

    try {
      setSubmitting(true);

      const paymentData = {
        contact_id: invoice.contact_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        currency_id: invoice.currency_id || invoice.currency?.id,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        invoice_allocations: [
          {
            invoice_id: invoice.id,
            amount_applied: parseFloat(formData.amount),
          },
        ],
      };

      const payment = await paymentsAPI.create(paymentData) as { amount: number; [key: string]: unknown };

      showSuccess(`Payment of ${formatCurrency(payment.amount, invoice.currency?.code)} recorded successfully`);

      if (onSuccess) {
        onSuccess(payment);
      }

      onClose();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      showError(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getBalanceHelper = () => {
    const amount = parseFloat(formData.amount) || 0;
    const outstanding = parseFloat(invoice?.outstanding_balance || 0);

    if (amount < outstanding) {
      const remaining = outstanding - amount;
      return {
        text: `Partial payment - remaining balance: ${formatCurrency(remaining, invoice.currency?.code)}`,
        color: 'text-yellow-600 dark:text-yellow-400',
      };
    } else if (Math.abs(amount - outstanding) < 0.01) { // Account for floating point precision
      return {
        text: 'This will fully pay the invoice',
        color: 'text-green-600 dark:text-green-400',
      };
    } else {
      const overpayment = amount - outstanding;
      return {
        text: `Overpayment - ${formatCurrency(overpayment, invoice.currency?.code)} will become client credit`,
        color: 'text-blue-600 dark:text-blue-400',
      };
    }
  };

  if (!isOpen || !invoice) return null;

  const balanceHelper = getBalanceHelper();
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Record Payment
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Invoice #{invoice.invoice_number}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Invoice Summary */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">Invoice Total:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total, invoice.currency?.code)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Outstanding Balance:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.outstanding_balance, invoice.currency?.code)}
                    </span>
                  </div>
                </div>

                {/* Row 1: Payment Amount & Payment Date */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Payment Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: e.target.value })}
                      disabled={submitting}
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-md"
                      placeholder="0.00"
                      required
                    />
                    {formData.amount && parseFloat(formData.amount) > 0 && (
                      <p className={`text-xs mt-1 ${balanceHelper.color}`}>
                        {balanceHelper.text}
                      </p>
                    )}
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <DatePickerCalendar
                      value={formData.payment_date}
                      onChange={(date) => setFormData({ ...formData, payment_date: date })}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Payment Method & Reference Number */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Payment Method - Styled Dropdown */}
                  <div className="relative" ref={methodDropdownRef}>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => !submitting && setMethodDropdownOpen(!methodDropdownOpen)}
                      disabled={submitting}
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <selectedMethod.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>{selectedMethod.label}</span>
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
                                setFormData({ ...formData, payment_method: method.value });
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
                                <span className="ml-auto text-purple-600 dark:text-purple-400">&#10003;</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.reference_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, reference_number: e.target.value })}
                      maxLength={100}
                      disabled={submitting}
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-md"
                      placeholder="Transaction ID"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                    maxLength={500}
                    disabled={submitting}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-md resize-none"
                    placeholder="Additional payment details..."
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {formData.notes.length}/500 characters
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.amount || parseFloat(formData.amount) <= 0}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;
