import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Loader2, ChevronDown, Building2, Banknote, FileText, CreditCard, Wallet, CircleDollarSign, Ticket, Search, Check } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { formatCurrency } from '../../../utils/currency';
import paymentsAPI from '../../../services/api/finance/payments';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import DatePickerCalendar from '../../shared/DatePickerCalendar';

interface PaymentMethod {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { value: 'credit_note', label: 'Credit Note', icon: Ticket },
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
  onSendReceipt?: (paymentData: { payment_amount: number; payment_date: string; payment_method: string; transaction_id?: string }) => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, invoice, onSuccess, onSendReceipt }) => {
  const { showSuccess, showError } = useNotification();
  useEscapeKey(onClose, isOpen);
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
  const [sendReceipt, setSendReceipt] = useState(true);

  // Credit note state
  const [availableCreditNotes, setAvailableCreditNotes] = useState<any[]>([]);
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState<string>('');
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(false);
  const [cnDropdownOpen, setCnDropdownOpen] = useState(false);
  const [cnSearchQuery, setCnSearchQuery] = useState('');
  const cnDropdownRef = useRef<HTMLDivElement>(null);
  const isCreditNote = formData.payment_method === 'credit_note';

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

  // Close credit note dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cnDropdownRef.current && !cnDropdownRef.current.contains(event.target as Node)) {
        setCnDropdownOpen(false);
      }
    };

    if (cnDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cnDropdownOpen]);

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === formData.payment_method) || PAYMENT_METHODS[1];

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
      setSelectedCreditNoteId('');
      setAvailableCreditNotes([]);
      setCnDropdownOpen(false);
      setCnSearchQuery('');
      setSendReceipt(true);
    }
  }, [isOpen, invoice]);

  // Load credit notes when method changes to credit_note
  useEffect(() => {
    if (isCreditNote && invoice?.contact_id) {
      loadAvailableCreditNotes();
    }
  }, [formData.payment_method]);

  const loadAvailableCreditNotes = async () => {
    setLoadingCreditNotes(true);
    try {
      const data = await creditNotesAPI.listByContact(invoice.contact_id) as any;
      const items = data?.items || [];
      // Filter: same currency, has remaining balance
      const invoiceCurrencyId = invoice.currency?.id;
      setAvailableCreditNotes(
        items.filter((cn: any) => {
          const cnCurrencyId = cn.currency?.id || cn.currency_id;
          return !invoiceCurrencyId || !cnCurrencyId || cnCurrencyId === invoiceCurrencyId;
        })
      );
    } catch (err: any) {
      console.error('Failed to load credit notes:', err);
      setAvailableCreditNotes([]);
    } finally {
      setLoadingCreditNotes(false);
    }
  };

  // Auto-fill amount when a credit note is selected
  const handleCreditNoteSelect = (cnId: string) => {
    setSelectedCreditNoteId(cnId);
    setCnDropdownOpen(false);
    setCnSearchQuery('');
    if (cnId) {
      const cn = availableCreditNotes.find(c => c.id === cnId);
      if (cn) {
        const remaining = parseFloat(cn.remaining_amount || cn.total || '0');
        const outstanding = parseFloat(invoice?.outstanding_balance || '0');
        const amount = Math.min(remaining, outstanding);
        setFormData(prev => ({ ...prev, amount: amount.toFixed(2) }));
      }
    }
  };

  // Filter credit notes by search query
  const filteredCreditNotes = cnSearchQuery
    ? availableCreditNotes.filter((cn: any) => {
        const query = cnSearchQuery.toLowerCase();
        const number = (cn.credit_note_number || '').toLowerCase();
        return number.includes(query);
      })
    : availableCreditNotes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    // Credit note path
    if (isCreditNote) {
      if (!selectedCreditNoteId) {
        showError('Please select a credit note');
        return;
      }

      try {
        setSubmitting(true);
        await creditNotesAPI.applyToInvoices(selectedCreditNoteId, [{
          invoice_id: invoice.id,
          amount: parseFloat(formData.amount),
          notes: formData.notes || undefined,
        }]);
        showSuccess('Credit note applied successfully');
        if (onSuccess) onSuccess({});
        onClose();
      } catch (error: any) {
        console.error('Error applying credit note:', error);
        showError(error.message || 'Failed to apply credit note');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Standard payment path
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
        currency_id: invoice.currency?.id || invoice.currency_id,
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

      if (sendReceipt && onSendReceipt) {
        onSendReceipt({
          payment_amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          transaction_id: formData.reference_number || undefined,
        });
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      showError(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCN = availableCreditNotes.find(cn => cn.id === selectedCreditNoteId);

  // Max amount for credit notes: can't exceed credit note balance or invoice outstanding
  const creditNoteMax = isCreditNote && selectedCN
    ? Math.min(
        parseFloat(selectedCN.remaining_amount || selectedCN.total || '0'),
        parseFloat(invoice?.outstanding_balance || '0')
      )
    : 0;

  const getBalanceHelper = () => {
    const amount = parseFloat(formData.amount) || 0;
    const outstanding = parseFloat(invoice?.outstanding_balance || 0);

    // Credit note: cannot overpay — cap at min(credit note balance, invoice outstanding)
    if (isCreditNote && selectedCN) {
      const cnRemaining = parseFloat(selectedCN.remaining_amount || selectedCN.total || '0');
      if (amount > cnRemaining) {
        return {
          text: `Exceeds credit note balance of ${formatCurrency(cnRemaining, invoice.currency?.code)}`,
          color: 'text-red-600 dark:text-red-400',
        };
      }
      if (amount > outstanding) {
        return {
          text: `Exceeds invoice outstanding balance of ${formatCurrency(outstanding, invoice.currency?.code)}`,
          color: 'text-red-600 dark:text-red-400',
        };
      }
    }

    if (amount < outstanding) {
      const remaining = outstanding - amount;
      return {
        text: `Partial payment - remaining balance: ${formatCurrency(remaining, invoice.currency?.code)}`,
        color: 'text-yellow-600 dark:text-yellow-400',
      };
    } else if (Math.abs(amount - outstanding) < 0.01) { // Account for floating point precision
      return {
        text: isCreditNote ? 'This will fully pay the invoice' : 'This will fully pay the invoice',
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
                      {isCreditNote ? 'Apply Credit Note' : 'Record Payment'}
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

                {/* Payment Method Dropdown - always shown */}
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

                {/* Credit Note specific fields */}
                {isCreditNote ? (
                  <>
                    {/* Credit Note Picker - Styled Dropdown */}
                    <div className="relative" ref={cnDropdownRef}>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Select Credit Note <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => !submitting && !loadingCreditNotes && setCnDropdownOpen(!cnDropdownOpen)}
                        disabled={submitting || loadingCreditNotes}
                        className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2 truncate">
                          {loadingCreditNotes ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                              <span className="text-gray-400">Loading...</span>
                            </>
                          ) : selectedCN ? (
                            <>
                              <Ticket className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span>#{selectedCN.credit_note_number}</span>
                              <span className="text-gray-400 text-xs ml-1">
                                ({formatCurrency(selectedCN.remaining_amount || selectedCN.total, selectedCN.currency?.code || invoice.currency?.code)} remaining)
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">Select a credit note...</span>
                          )}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${cnDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Credit Note Dropdown */}
                      {cnDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                          {/* Search */}
                          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <input
                                type="text"
                                placeholder="Search credit notes..."
                                value={cnSearchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCnSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Credit Note List */}
                          <div className="max-h-64 overflow-y-auto">
                            {availableCreditNotes.length === 0 ? (
                              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                No available credit notes for this contact
                              </div>
                            ) : filteredCreditNotes.length === 0 ? (
                              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                No credit notes found
                              </div>
                            ) : (
                              <div className="py-1">
                                {filteredCreditNotes.map((cn: any) => {
                                  const isSelected = cn.id === selectedCreditNoteId;
                                  const cnCurrency = cn.currency?.code || invoice.currency?.code;
                                  return (
                                    <button
                                      key={cn.id}
                                      type="button"
                                      onClick={() => handleCreditNoteSelect(cn.id)}
                                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                                        isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <span className={`${isSelected ? 'font-medium text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                                          #{cn.credit_note_number}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          Remaining: {formatCurrency(cn.remaining_amount || cn.total, cnCurrency)}
                                        </span>
                                      </div>
                                      {isSelected && (
                                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected Credit Note Info */}
                    {selectedCN && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                        <div className="flex justify-between text-blue-700 dark:text-blue-300 mb-1">
                          <span>Credit Note Total:</span>
                          <span className="font-medium">{formatCurrency(selectedCN.total, selectedCN.currency?.code || invoice.currency?.code)}</span>
                        </div>
                        <div className="flex justify-between text-blue-700 dark:text-blue-300">
                          <span>Available Balance:</span>
                          <span className="font-semibold">{formatCurrency(selectedCN.remaining_amount || selectedCN.total, selectedCN.currency?.code || invoice.currency?.code)}</span>
                        </div>
                      </div>
                    )}

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Amount to Apply <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedCN ? creditNoteMax.toFixed(2) : undefined}
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
                  </>
                ) : (
                  <>
                    {/* Standard payment fields */}
                    {/* Row 1: Payment Amount & Payment Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        />
                      </div>
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
                  </>
                )}

                {/* Notes - shown for both */}
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
                    placeholder={isCreditNote ? 'Additional notes...' : 'Additional payment details...'}
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {formData.notes.length}/500 characters
                  </p>
                </div>

                {/* Send Receipt Checkbox - only for non-credit-note payments */}
                {!isCreditNote && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendReceipt}
                      onChange={(e) => setSendReceipt(e.target.checked)}
                      disabled={submitting}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Send payment receipt to contact
                    </span>
                  </label>
                )}
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
                disabled={submitting || !formData.amount || parseFloat(formData.amount) <= 0 || (isCreditNote && !selectedCreditNoteId) || (isCreditNote && selectedCN && parseFloat(formData.amount) > creditNoteMax)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isCreditNote ? 'Applying...' : 'Recording...'}
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    {isCreditNote ? 'Apply Credit' : 'Record Payment'}
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
