import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Plus, Trash2, Loader2, ArrowLeft, ChevronDown, Settings } from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { INVOICE_STATUS } from '../../../constants/finance';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import { getCurrencySymbol } from '../../../utils/currencyUtils';
import currenciesAPI from '../../../services/api/crm/currencies';
import companiesAPI from '../../../services/api/crm/companies';
import invoicesAPI from '../../../services/api/finance/invoices';
import paymentIntegrationsAPI from '../../../services/api/finance/paymentIntegrations';
import TaxModal from './TaxModal';
import DiscountModal from './DiscountModal';
import DepositModal from './DepositModal';
import ClientSelectModal from './ClientSelectModal';
import CurrencySelectModal from './CurrencySelectModal';
import SendInvoiceDialog from './SendInvoiceDialog';
import InvoiceSettingsModal from './InvoiceSettingsModal';
import FinanceLayout from '../layout/FinanceLayout';
import { RECURRING_TYPE } from '../../../constants/finance';

const InvoiceForm = ({ invoice: invoiceProp = null, onSuccess, isInModal = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createInvoice, updateInvoice } = useInvoices();
  const { contacts: allContacts, loading: contactsLoading } = useContacts({ is_client: true });
  const { showSuccess, showError } = useNotification();

  // Refs for dropdown positioning
  const clientButtonRef = React.useRef(null);
  const currencyButtonRef = React.useRef(null);

  // State
  const [invoice, setInvoice] = useState(invoiceProp);
  const [loading, setLoading] = useState(!!id && !invoiceProp);
  const [currencies, setCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState(null);

  const isEditing = !!invoice || !!id;

  // Form fields
  const [contactId, setContactId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('');

  // Line items
  const [items, setItems] = useState([]);

  // Totals
  const [taxRate, setTaxRate] = useState(0);
  const [taxLabel, setTaxLabel] = useState('Tax');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [depositType, setDepositType] = useState(null);
  const [depositValue, setDepositValue] = useState(0);

  // Notes
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Recurring (Old format - keeping for backward compatibility)
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState(RECURRING_TYPE.MONTHLY);
  const [recurringEvery, setRecurringEvery] = useState(1);
  const [recurringPeriod, setRecurringPeriod] = useState('Months');
  const [recurringEndDate, setRecurringEndDate] = useState(null);
  const [recurringOccurrences, setRecurringOccurrences] = useState(null);

  // Recurring (New format)
  const [pricingType, setPricingType] = useState('fixed'); // 'fixed' | 'recurring'
  const [recurringStatus, setRecurringStatus] = useState('active'); // 'active' | 'paused' | 'cancelled'
  const [recurringNumber, setRecurringNumber] = useState(-1); // -1 = infinite
  const [customEvery, setCustomEvery] = useState(1);
  const [customPeriod, setCustomPeriod] = useState('months'); // 'weeks' | 'months' | 'years'

  // Payment Options
  const [allowStripePayments, setAllowStripePayments] = useState(false);
  const [allowPaypalPayments, setAllowPaypalPayments] = useState(false);
  const [allowPartialPayments, setAllowPartialPayments] = useState(false);
  const [automaticPaymentEnabled, setAutomaticPaymentEnabled] = useState(false);
  const [automaticEmail, setAutomaticEmail] = useState(true);

  // Change tracking
  const [changeReason, setChangeReason] = useState('');

  // Modals
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Saving
  const [saving, setSaving] = useState(false);

  // Load invoice when editing
  useEffect(() => {
    const loadInvoice = async () => {
      if (id && !invoiceProp) {
        try {
          setLoading(true);
          const data = await invoicesAPI.get(id);
          setInvoice(data);
        } catch (error) {
          console.error('Failed to load invoice:', error);
          showError('Failed to load invoice');
          navigate('/finance/invoices');
        } finally {
          setLoading(false);
        }
      }
    };
    loadInvoice();
  }, [id, invoiceProp]);

  // Initialize form fields from loaded invoice
  useEffect(() => {
    if (invoice) {
      setContactId(invoice.contact_id || '');
      setInvoiceNumber(invoice.invoice_number || '');
      setInvoiceDate(
        invoice.issue_date
          ? new Date(invoice.issue_date).toISOString().split('T')[0]
          : invoice.invoice_date
          ? new Date(invoice.invoice_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setDueDate(
        invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : ''
      );
      setCurrency(invoice.currency_id || '');
      // Normalize items to have description field
      const normalizedItems = (invoice.invoice_items || invoice.items || []).map(item => ({
        ...item,
        description: item.description || item.name || '',
        quantity: parseFloat(item.quantity || 0),
        price: parseFloat(item.price || 0),
        amount: parseFloat(item.amount || 0),
      }));
      setItems(normalizedItems);
      setTaxRate(parseFloat(invoice.tax_rate || 0));
      setTaxLabel(invoice.tax_label || 'Tax');
      setDiscountType(invoice.discount_type || 'percentage');
      setDiscountValue(parseFloat(invoice.discount_value || invoice.discount_percentage || 0));
      setDepositType(invoice.deposit_type || null);
      setDepositValue(parseFloat(invoice.deposit_value || invoice.deposit_percentage || 0));
      setNotes(invoice.notes || '');
      setTerms(invoice.terms || '');

      // Recurring (Old format - for backward compatibility)
      setIsRecurring(invoice.is_recurring || invoice.pricing_type === 'recurring' || false);
      setRecurringType(invoice.recurring_type || RECURRING_TYPE.MONTHLY);
      setRecurringEvery(invoice.recurring_every || invoice.custom_every || 1);
      setRecurringPeriod(invoice.recurring_period || invoice.custom_period || 'Months');
      setRecurringEndDate(invoice.recurring_end_date || null);
      setRecurringOccurrences(invoice.recurring_occurrences || invoice.recurring_number || null);

      // Recurring (New format)
      setPricingType(invoice.pricing_type || (invoice.is_recurring ? 'recurring' : 'fixed'));
      setRecurringStatus(invoice.recurring_status || 'active');
      setRecurringNumber(invoice.recurring_number !== undefined ? invoice.recurring_number : -1);
      setCustomEvery(invoice.custom_every || 1);
      setCustomPeriod(invoice.custom_period || 'months');

      // Payment Options
      setAllowStripePayments(invoice.allow_stripe_payments || false);
      setAllowPaypalPayments(invoice.allow_paypal_payments || false);
      setAllowPartialPayments(invoice.allow_partial_payments || false);
      setAutomaticPaymentEnabled(invoice.automatic_payment_enabled || false);
      setAutomaticEmail(invoice.automatic_email !== undefined ? invoice.automatic_email : true);
    }
  }, [invoice]);

  // Load currencies
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await currenciesAPI.getCompanyCurrencies();
        setCurrencies(data || []);
        // Only set default currency on initial load for new invoices
        if (!invoice && !currency && data && data.length > 0) {
          const defaultCurrency = data.find(cc => cc.is_default);
          setCurrency(defaultCurrency?.currency?.id || data[0]?.currency?.id);
        }
      } catch (error) {
        console.error('Failed to load currencies:', error);
        showError('Failed to load currencies');
      } finally {
        setCurrenciesLoading(false);
      }
    };
    loadCurrencies();
  }, [invoice]);

  // Set currency based on selected contact
  useEffect(() => {
    if (!invoice && contactId && allContacts.length > 0 && currencies.length > 0) {
      const selectedContact = allContacts.find(c => c.id === contactId);
      if (selectedContact) {
        // Try preferred_currency_id first, then currency_id, then keep current default
        const contactCurrencyId = selectedContact.preferred_currency_id || selectedContact.currency_id;
        if (contactCurrencyId) {
          // Verify this currency is available in the company currencies
          const currencyExists = currencies.some(cc => cc.currency.id === contactCurrencyId);
          if (currencyExists) {
            setCurrency(contactCurrencyId);
          }
        }
      }
    }
  }, [contactId, allContacts, currencies, invoice]);

  // Load next invoice number
  useEffect(() => {
    const loadNextNumber = async () => {
      if (!invoice) {
        try {
          const data = await invoicesAPI.getNextNumber();
          if (data?.next_number) {
            setInvoiceNumber(data.next_number);
          }
        } catch (error) {
          console.error('Failed to load next invoice number:', error);
        }
      }
    };
    loadNextNumber();
  }, [invoice]);

  // Load payment terms and calculate due date
  useEffect(() => {
    const loadPaymentTerms = async () => {
      try {
        const data = await companiesAPI.getCurrent();
        if (data?.default_invoice_payment_terms) {
          setPaymentTerms(data.default_invoice_payment_terms);
        }
      } catch (error) {
        console.error('Failed to load payment terms:', error);
      }
    };
    loadPaymentTerms();
  }, []);

  // Load payment integration status and set defaults for new invoices
  useEffect(() => {
    const loadIntegrationStatus = async () => {
      // Only for new invoices, not editing existing ones
      if (invoice) return;

      try {
        const [stripeStatus, paypalStatus] = await Promise.all([
          paymentIntegrationsAPI.getStripeConnectStatus().catch(() => null),
          paymentIntegrationsAPI.getPayPalStatus().catch(() => null),
        ]);

        // Auto-enable Stripe payments if connected and charges enabled
        const isStripeConnected = stripeStatus?.status === 'enabled' && stripeStatus?.charges_enabled;
        if (isStripeConnected) {
          setAllowStripePayments(true);
        }

        // Auto-enable PayPal payments if connected
        const isPayPalConnected = paypalStatus?.is_connected;
        if (isPayPalConnected) {
          setAllowPaypalPayments(true);
        }
      } catch (error) {
        // Silently fail - user can still manually enable payment options
        console.error('Failed to load integration status:', error);
      }
    };

    loadIntegrationStatus();
  }, [invoice]);

  useEffect(() => {
    if (!invoice && paymentTerms && invoiceDate) {
      const issueDate = new Date(invoiceDate);
      const dueDateObj = new Date(issueDate);
      dueDateObj.setDate(dueDateObj.getDate() + paymentTerms);
      const formattedDueDate = dueDateObj.toISOString().split('T')[0];
      setDueDate(formattedDueDate);
    }
  }, [paymentTerms, invoice, invoiceDate]);

  // Calculate totals
  const totals = calculateInvoiceTotal(items, taxRate, discountType, discountValue);
  const getCurrencyCode = () => {
    if (!currency || !currencies.length) return 'USD';
    const currencyAssoc = currencies.find(cc => cc.currency.id === currency);
    return currencyAssoc?.currency?.code || 'USD';
  };
  const currencyCode = getCurrencyCode();

  // Line item handlers
  const addLineItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0, amount: 0 }]);
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-calculate amount
    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      newItems[index].amount = qty * price;
    }

    setItems(newItems);
  };

  const removeLineItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Save handler
  const handleSendSuccess = () => {
    setShowSendDialog(false);
    setSavedInvoice(null);
    if (onSuccess) {
      onSuccess(savedInvoice);
    } else {
      navigate('/finance/invoices');
    }
  };

  const handleSave = async (saveStatus = INVOICE_STATUS.DRAFT) => {
    // Validation
    if (!contactId) {
      showError('Please select a client');
      return;
    }
    if (!invoiceDate) {
      showError('Please select an invoice date');
      return;
    }
    if (!dueDate) {
      showError('Please select a due date');
      return;
    }
    if (!currency) {
      showError('Please select a currency');
      return;
    }
    if (items.length === 0) {
      showError('Please add at least one line item');
      return;
    }

    try {
      setSaving(true);

      const invoiceData = {
        contact_id: contactId,
        invoice_number: invoiceNumber || undefined,
        issue_date: invoiceDate, // API expects issue_date
        due_date: dueDate,
        currency_id: currency,
        status: saveStatus,
        invoice_items: items.map(item => ({
          name: item.description || item.name,
          description: item.description || item.name,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          amount: parseFloat(item.amount),
        })),
        tax_rate: parseFloat(taxRate) || 0,
        tax_label: taxLabel,
        discount_type: discountValue > 0 ? discountType : undefined,
        discount_value: discountValue > 0 ? parseFloat(discountValue) : undefined,
        deposit_type: depositValue > 0 ? depositType : undefined,
        deposit_value: depositValue > 0 ? parseFloat(depositValue) : undefined,
        notes: notes || undefined,
        terms: terms || undefined,
        // Old recurring format (keeping for backward compatibility)
        is_recurring: isRecurring,
        recurring_type: isRecurring ? recurringType : undefined,
        recurring_every: isRecurring && recurringType === RECURRING_TYPE.CUSTOM ? recurringEvery : undefined,
        recurring_period: isRecurring && recurringType === RECURRING_TYPE.CUSTOM ? recurringPeriod : undefined,
        recurring_end_date: isRecurring && recurringEndDate ? recurringEndDate : undefined,
        recurring_occurrences: isRecurring && recurringOccurrences ? recurringOccurrences : undefined,
        // New recurring format
        pricing_type: pricingType,
        recurring_status: pricingType === 'recurring' ? recurringStatus : undefined,
        recurring_number: pricingType === 'recurring' ? recurringNumber : undefined,
        custom_every: pricingType === 'recurring' && recurringType === RECURRING_TYPE.CUSTOM ? customEvery : undefined,
        custom_period: pricingType === 'recurring' && recurringType === RECURRING_TYPE.CUSTOM ? customPeriod : undefined,
        allow_stripe_payments: allowStripePayments,
        allow_paypal_payments: allowPaypalPayments,
        allow_partial_payments: allowPartialPayments,
        automatic_payment_enabled: automaticPaymentEnabled,
        automatic_email: automaticEmail,
      };

      let result;
      if (invoice?.id) {
        result = await updateInvoice(invoice.id, invoiceData, changeReason);
        showSuccess('Invoice updated successfully');
        // Clear change reason after successful update
        setChangeReason('');
      } else {
        result = await createInvoice(invoiceData);
        showSuccess('Invoice created successfully');
      }

      // If saving with SENT status, open send dialog
      if (saveStatus === INVOICE_STATUS.SENT) {
        setSavedInvoice(result);
        setShowSendDialog(true);
      } else {
        if (onSuccess) {
          onSuccess(result);
        } else {
          navigate('/finance/invoices');
        }
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      showError(error.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state when fetching invoice data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="inline-block h-8 w-8 animate-spin text-purple-600 mb-2" />
          <p className="text-sm text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const formContent = (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              ref={clientButtonRef}
              type="button"
              onClick={() => setShowClientModal(true)}
              disabled={contactsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center justify-between"
            >
              <span className={contactId ? 'text-gray-900' : 'text-gray-500'}>
                {contactsLoading ? 'Loading clients...' : contactId ?
                  (() => {
                    const client = allContacts.find(c => c.id === contactId);
                    if (!client) return 'Select a Client';
                    return `${client.first_name} ${client.last_name}${client.business_name ? ` (${client.business_name})` : ''}`;
                  })()
                  : 'Select a Client'
                }
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <ClientSelectModal
              isOpen={showClientModal}
              onClose={() => setShowClientModal(false)}
              clients={allContacts}
              selectedClientId={contactId}
              onSelect={setContactId}
              loading={contactsLoading}
              triggerRef={clientButtonRef}
            />
          </div>
        </div>

        {/* Invoice Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Invoice Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Date<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Currency */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency<span className="text-red-500">*</span>
          </label>
          <div className="relative md:max-w-xs">
            <button
              ref={currencyButtonRef}
              type="button"
              onClick={() => setShowCurrencyModal(true)}
              disabled={currenciesLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center justify-between"
            >
              <span className={currency ? 'text-gray-900' : 'text-gray-500'}>
                {currenciesLoading ? 'Loading currencies...' : currency ?
                  (() => {
                    const cc = currencies.find(c => c.currency.id === currency);
                    if (!cc) return 'Select Currency';
                    return `${cc.currency.code} - ${cc.currency.name}`;
                  })()
                  : 'Select Currency'
                }
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <CurrencySelectModal
              isOpen={showCurrencyModal}
              onClose={() => setShowCurrencyModal(false)}
              currencies={currencies}
              selectedCurrencyId={currency}
              onSelect={setCurrency}
              loading={currenciesLoading}
              triggerRef={currencyButtonRef}
            />
          </div>
        </div>
      </div>

      {/* Lists of Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Lists of Items</h3>
          <button
            onClick={addLineItem}
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            <Plus className="h-4 w-4" />
            Add Items
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Amount</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                    No items added yet. Click "+ Add Items" to get started.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateLineItem(index, 'price', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {getCurrencySymbol(currencyCode)}{item.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeLineItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-600">Sub Total:</span>
          <span className="text-sm font-medium text-gray-900">{getCurrencySymbol(currencyCode)}{totals.subtotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-purple-100 rounded-lg">
          <span className="text-sm font-semibold text-gray-900">Total Amount:</span>
          <span className="text-lg font-bold text-gray-900">{getCurrencySymbol(currencyCode)}{totals.total.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setShowTaxModal(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Add Tax
          </button>
          <button
            onClick={() => setShowDiscountModal(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Add Discount
          </button>
          <button
            onClick={() => setShowDepositModal(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Add Deposit
          </button>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Internal)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal Note(Note Visible To Client)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Terms & Conditions
          </label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Write Payment Terms and Condition"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Change Reason - Only show when editing existing invoice */}
      {(invoice?.id || id) && (
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium design-text-primary mb-2">
            Reason for Change (Optional)
          </label>
          <textarea
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Briefly explain why you're making this change..."
            rows={2}
            className="w-full px-3 py-2 design-input rounded-md text-sm"
          />
          <p className="text-xs design-text-secondary mt-1">
            This will be recorded in the audit trail to track changes made to this invoice
          </p>
        </div>
      )}

      {/* Footer Buttons (only in modal mode) */}
      {isInModal && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Invoice Settings
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(INVOICE_STATUS.DRAFT)}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
              Save to Draft
            </button>
            <button
              onClick={() => handleSave(INVOICE_STATUS.SENT)}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
              Save & Send
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaxModal
        isOpen={showTaxModal}
        onClose={() => setShowTaxModal(false)}
        onSave={(rate, label) => {
          setTaxRate(rate);
          setTaxLabel(label);
        }}
        initialTaxRate={taxRate}
        initialTaxLabel={taxLabel}
      />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSave={(type, value) => {
          setDiscountType(type);
          setDiscountValue(value);
        }}
        initialDiscountType={discountType}
        initialDiscountValue={discountValue}
        subtotal={totals.subtotal}
        currency={currencyCode}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSave={(type, value) => {
          setDepositType(type);
          setDepositValue(value);
        }}
        initialDepositType={depositType}
        initialDepositValue={depositValue}
        total={totals.total}
        currency={currencyCode}
      />

      <InvoiceSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isRecurring={isRecurring}
        recurringType={recurringType}
        recurringEvery={recurringEvery}
        recurringPeriod={recurringPeriod}
        recurringEndDate={recurringEndDate}
        recurringOccurrences={recurringOccurrences}
        startDate={invoiceDate}
        pricingType={pricingType}
        recurringStatus={recurringStatus}
        recurringNumber={recurringNumber}
        customEvery={customEvery}
        customPeriod={customPeriod}
        allowStripePayments={allowStripePayments}
        allowPaypalPayments={allowPaypalPayments}
        allowPartialPayments={allowPartialPayments}
        automaticPaymentEnabled={automaticPaymentEnabled}
        automaticEmail={automaticEmail}
        onChange={(updates) => {
          // Old format (for backward compatibility)
          if ('isRecurring' in updates) {
            setIsRecurring(updates.isRecurring);
            // Sync with new format
            setPricingType(updates.isRecurring ? 'recurring' : 'fixed');
          }
          if ('recurringType' in updates) setRecurringType(updates.recurringType);
          if ('recurringEvery' in updates) setRecurringEvery(updates.recurringEvery);
          if ('recurringPeriod' in updates) setRecurringPeriod(updates.recurringPeriod);
          if ('recurringEndDate' in updates) setRecurringEndDate(updates.recurringEndDate);
          if ('recurringOccurrences' in updates) setRecurringOccurrences(updates.recurringOccurrences);
          // New format
          if ('pricingType' in updates) {
            setPricingType(updates.pricingType);
            // Sync with old format
            setIsRecurring(updates.pricingType === 'recurring');
          }
          if ('recurringStatus' in updates) setRecurringStatus(updates.recurringStatus);
          if ('recurringNumber' in updates) setRecurringNumber(updates.recurringNumber);
          if ('customEvery' in updates) setCustomEvery(updates.customEvery);
          if ('customPeriod' in updates) setCustomPeriod(updates.customPeriod);
          // Payment options
          if ('allowStripePayments' in updates) setAllowStripePayments(updates.allowStripePayments);
          if ('allowPaypalPayments' in updates) setAllowPaypalPayments(updates.allowPaypalPayments);
          if ('allowPartialPayments' in updates) setAllowPartialPayments(updates.allowPartialPayments);
          if ('automaticPaymentEnabled' in updates) setAutomaticPaymentEnabled(updates.automaticPaymentEnabled);
          if ('automaticEmail' in updates) setAutomaticEmail(updates.automaticEmail);
        }}
      />

      {/* Send Invoice Dialog */}
      <SendInvoiceDialog
        isOpen={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        invoice={savedInvoice}
        contact={savedInvoice && allContacts.find(c => c.id === savedInvoice.contact_id)}
        onSuccess={handleSendSuccess}
      />
    </div>
  );

  // If in modal, return form content directly
  if (isInModal) {
    return formContent;
  }

  // Otherwise, wrap in FinanceLayout with header and action buttons
  return (
    <FinanceLayout
      header={
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/finance/invoices')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to invoices"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Invoice' : 'New Invoice'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {isEditing ? 'Update invoice details' : 'Create a new invoice for your client'}
                </p>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Invoice Settings
              </button>
              <button
                onClick={() => handleSave(INVOICE_STATUS.DRAFT)}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
                Save to Draft
              </button>
              <button
                onClick={() => handleSave(INVOICE_STATUS.SENT)}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
                Save & Send
              </button>
            </div>
          </div>
        </div>
      }
    >
      {formContent}
    </FinanceLayout>
  );
};

export default InvoiceForm;
