import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Loader2, User, DollarSign, Calendar, FileText, ChevronDown, Check, Search } from 'lucide-react';
import { usePayments } from '../../../contexts/PaymentsContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { PAYMENT_METHOD, PAYMENT_METHOD_LABELS } from '../../../constants/finance';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import ContactSelectorModal from '../../calendar/ContactSelectorModal';
import paymentsAPI from '../../../services/api/finance/payments';

/**
 * Currency Select Dropdown for CreatePaymentModal
 */
const CurrencyDropdown = ({ isOpen, onClose, currencies, selectedCurrencyId, onSelect, loading, triggerRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const filteredCurrencies = currencies.filter(cc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return cc.currency.code.toLowerCase().includes(query) ||
           cc.currency.name.toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef?.current && !triggerRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
            autoComplete="off"
          />
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">Loading...</div>
        ) : filteredCurrencies.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">No currencies found</div>
        ) : (
          filteredCurrencies.map((cc) => (
            <button
              key={cc.currency.id}
              onClick={() => { onSelect(cc.currency.id); setSearchQuery(''); onClose(); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                cc.currency.id === selectedCurrencyId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}
            >
              <span className="text-gray-900 dark:text-white">{cc.currency.code} - {cc.currency.name}</span>
              {cc.currency.id === selectedCurrencyId && <Check className="h-4 w-4 text-purple-600" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Payment Method Select Dropdown
 */
const PaymentMethodDropdown = ({ isOpen, onClose, selectedMethod, onSelect, triggerRef }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef?.current && !triggerRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="max-h-48 overflow-y-auto py-1">
        {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { onSelect(key); onClose(); }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
              key === selectedMethod ? 'bg-purple-50 dark:bg-purple-900/20' : ''
            }`}
          >
            <span className="text-gray-900 dark:text-white">{label}</span>
            {key === selectedMethod && <Check className="h-4 w-4 text-purple-600" />}
          </button>
        ))}
      </div>
    </div>
  );
};

const CreatePaymentModal = ({ isOpen, onClose }) => {
  const { createPayment, refresh } = usePayments();
  const { showSuccess, showError } = useNotification();
  const { companyCurrencies, defaultCurrency, loading: currenciesLoading } = useCompanyCurrencies();

  const [submitting, setSubmitting] = useState(false);
  const [nextNumber, setNextNumber] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);
  const contactButtonRef = useRef(null);
  const currencyButtonRef = useRef(null);
  const paymentMethodButtonRef = useRef(null);

  const [formData, setFormData] = useState({
    contact_id: null,
    amount: '',
    currency_id: null,
    payment_method: PAYMENT_METHOD.BANK_TRANSFER,
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });

  // Fetch next payment number when modal opens
  useEffect(() => {
    if (isOpen) {
      paymentsAPI.getNextNumber()
        .then(data => {
          setNextNumber(data.next_number || '');
        })
        .catch(err => {
          console.error('Error fetching next payment number:', err);
        });
    }
  }, [isOpen]);

  // Set default currency when currencies load
  useEffect(() => {
    if (defaultCurrency && !formData.currency_id) {
      setFormData(prev => ({ ...prev, currency_id: defaultCurrency.currency.id }));
    }
  }, [defaultCurrency, formData.currency_id]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        contact_id: null,
        amount: '',
        currency_id: defaultCurrency?.currency?.id || null,
        payment_method: PAYMENT_METHOD.BANK_TRANSFER,
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: '',
      });
      setSelectedContact(null);
    }
  }, [isOpen, defaultCurrency]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setFormData(prev => ({ ...prev, contact_id: contact?.id || null }));
  };

  const getContactDisplayName = () => {
    if (!selectedContact) return 'Select Contact';
    const fullName = `${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim();
    if (fullName) return fullName;
    if (selectedContact.business_name) return selectedContact.business_name;
    if (selectedContact.email) return selectedContact.email;
    return 'No Name';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    if (!formData.contact_id) {
      showError('Please select a contact');
      return;
    }

    if (!formData.currency_id) {
      showError('Please select a currency');
      return;
    }

    try {
      setSubmitting(true);

      const paymentData = {
        contact_id: formData.contact_id,
        amount: parseFloat(formData.amount),
        currency_id: formData.currency_id,
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
      };

      // Add optional fields if they have values
      if (formData.reference_number) {
        paymentData.reference_number = formData.reference_number;
      }
      if (formData.notes) {
        paymentData.notes = formData.notes;
      }

      await createPayment(paymentData);
      showSuccess('Payment recorded successfully');
      refresh();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
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
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Record Payment
              </h2>
              {nextNumber && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  #{nextNumber}
                </p>
              )}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4" autoComplete="off">
          {/* Contact Selection */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="h-4 w-4" />
              Contact <span className="text-red-500">*</span>
            </label>
            <button
              ref={contactButtonRef}
              type="button"
              onClick={() => setShowContactSelector(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-left hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:border-purple-400"
            >
              <span className={selectedContact ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                {getContactDisplayName()}
              </span>
            </button>

            {/* Contact Selector Dropdown */}
            <ContactSelectorModal
              isOpen={showContactSelector}
              onClose={() => setShowContactSelector(false)}
              onSelect={handleContactSelect}
              selectedContactId={formData.contact_id}
              anchorRef={contactButtonRef}
            />
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DollarSign className="h-4 w-4" />
                Amount <span className="text-red-500">*</span>
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
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="relative space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency <span className="text-red-500">*</span>
              </label>
              <button
                ref={currencyButtonRef}
                type="button"
                onClick={() => setShowCurrencyDropdown(true)}
                disabled={currenciesLoading}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-md hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 flex items-center justify-between"
              >
                <span className={formData.currency_id ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                  {formData.currency_id
                    ? companyCurrencies.find(cc => cc.currency.id === formData.currency_id)?.currency.code || 'Select'
                    : 'Select'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <CurrencyDropdown
                isOpen={showCurrencyDropdown}
                onClose={() => setShowCurrencyDropdown(false)}
                currencies={companyCurrencies}
                selectedCurrencyId={formData.currency_id}
                onSelect={(id) => setFormData(prev => ({ ...prev, currency_id: id }))}
                loading={currenciesLoading}
                triggerRef={currencyButtonRef}
              />
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
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="relative space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </label>
              <button
                ref={paymentMethodButtonRef}
                type="button"
                onClick={() => setShowPaymentMethodDropdown(true)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-md hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between"
              >
                <span className="text-gray-900 dark:text-white">
                  {PAYMENT_METHOD_LABELS[formData.payment_method] || 'Select'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <PaymentMethodDropdown
                isOpen={showPaymentMethodDropdown}
                onClose={() => setShowPaymentMethodDropdown(false)}
                selectedMethod={formData.payment_method}
                onSelect={(method) => setFormData(prev => ({ ...prev, payment_method: method }))}
                triggerRef={paymentMethodButtonRef}
              />
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reference Number (optional)
            </label>
            <input
              type="text"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              placeholder="e.g., check number, transaction ID"
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4" />
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add notes about this payment..."
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
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
                Recording...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Record Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePaymentModal;
