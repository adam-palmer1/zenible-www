import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Plus, Trash2, Loader2, ArrowLeft, ChevronDown, Settings } from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { INVOICE_STATUS } from '../../../constants/finance';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import { getCurrencySymbol } from '../../../utils/currencyUtils';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import companiesAPI from '../../../services/api/crm/companies';
import invoicesAPI from '../../../services/api/finance/invoices';
import TaxModal from './TaxModal';
import DiscountModal from './DiscountModal';
import DepositModal from './DepositModal';
import LineItemTaxModal from '../shared/LineItemTaxModal';
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
  const { numberFormats } = useCRMReferenceData();
  const { getNumberFormat } = useCompanyAttributes();

  // Get number format from company settings
  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find(f => f.id === formatId);
    }
    return null; // Will use default US format
  }, [getNumberFormat, numberFormats]);

  // Helper function to format numbers
  const formatNumber = (num) => {
    return applyNumberFormat(num, numberFormat);
  };

  // Refs for dropdown positioning
  const clientButtonRef = React.useRef(null);
  const currencyButtonRef = React.useRef(null);

  // State
  const [invoice, setInvoice] = useState(invoiceProp);
  const [loading, setLoading] = useState(!!id && !invoiceProp);
  const [paymentTerms, setPaymentTerms] = useState(null);

  // Currency hook
  const { companyCurrencies: currencies, defaultCurrency: defaultCurrencyAssoc, loading: currenciesLoading } = useCompanyCurrencies();

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
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [companyDefaultPaymentInstructions, setCompanyDefaultPaymentInstructions] = useState('');

  // Recurring (Old format - keeping for backward compatibility)
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState(RECURRING_TYPE.MONTHLY);
  const [recurringEvery, setRecurringEvery] = useState(1);
  const [recurringPeriod, setRecurringPeriod] = useState('months');
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
  const [showLineItemTaxModal, setShowLineItemTaxModal] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Saving
  const [saving, setSaving] = useState(false);

  // Determine save button text based on invoice status
  const getSaveButtonText = () => {
    if (invoice?.status && invoice.status !== 'draft') {
      return 'Save';
    }
    return 'Save as Draft';
  };

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

      // Auto-resize textareas after a short delay to let DOM update
      setTimeout(() => {
        const textareas = document.querySelectorAll('.auto-grow-textarea');
        textareas.forEach(textarea => {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        });
      }, 50);

      setTaxRate(parseFloat(invoice.tax_rate || 0));
      setTaxLabel(invoice.tax_label || 'Tax');
      setDiscountType(invoice.discount_type || 'percentage');
      setDiscountValue(parseFloat(invoice.discount_value || invoice.discount_percentage || 0));

      // Infer deposit type from which field has a value if deposit_type is not set
      let inferredDepositType = invoice.deposit_type || null;
      let inferredDepositValue = 0;
      if (invoice.deposit_percentage && parseFloat(invoice.deposit_percentage) > 0) {
        inferredDepositType = inferredDepositType || 'percentage';
        inferredDepositValue = parseFloat(invoice.deposit_percentage);
      } else if (invoice.deposit_value && parseFloat(invoice.deposit_value) > 0) {
        inferredDepositType = inferredDepositType || 'fixed';
        inferredDepositValue = parseFloat(invoice.deposit_value);
      }
      setDepositType(inferredDepositType);
      setDepositValue(inferredDepositValue);
      setNotes(invoice.notes || '');
      setPaymentInstructions(invoice.payment_instructions || '');

      // Recurring (Old format - for backward compatibility)
      setIsRecurring(invoice.is_recurring || invoice.pricing_type === 'recurring' || false);
      setRecurringType(invoice.recurring_type || RECURRING_TYPE.MONTHLY);
      setRecurringEvery(invoice.recurring_every || invoice.custom_every || 1);
      setRecurringPeriod(invoice.recurring_period || invoice.custom_period || 'months');
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

  // Set default currency when currencies are loaded (for new invoices only)
  useEffect(() => {
    if (!invoice && !currency && currencies.length > 0) {
      const defaultCurrencyId = defaultCurrencyAssoc?.currency?.id || currencies[0]?.currency?.id;
      if (defaultCurrencyId) {
        setCurrency(defaultCurrencyId);
      }
    }
  }, [invoice, currency, currencies, defaultCurrencyAssoc]);

  // Set currency based on selected contact (contact currency takes priority over company default)
  useEffect(() => {
    if (!invoice && contactId && allContacts.length > 0 && currencies.length > 0) {
      const selectedContact = allContacts.find(c => c.id === contactId);
      if (selectedContact) {
        // Check all possible currency field names on the contact
        const contactCurrencyId =
          selectedContact.preferred_currency_id ||
          selectedContact.currency_id ||
          selectedContact.default_currency_id ||
          selectedContact.currency?.id;

        if (contactCurrencyId) {
          // Verify this currency is available in the company currencies
          const currencyExists = currencies.some(cc => cc.currency.id === contactCurrencyId);
          if (currencyExists) {
            setCurrency(contactCurrencyId);
          }
        }
        // If contact has no currency set, keep the company default (already set by loadCurrencies)
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

  // Load payment terms and company defaults
  useEffect(() => {
    const loadCompanyDefaults = async () => {
      try {
        const data = await companiesAPI.getCurrent();
        if (data?.default_invoice_payment_terms) {
          setPaymentTerms(data.default_invoice_payment_terms);
        }
        if (data?.default_payment_instructions) {
          setCompanyDefaultPaymentInstructions(data.default_payment_instructions);
        }
      } catch (error) {
        console.error('Failed to load company defaults:', error);
      }
    };
    loadCompanyDefaults();
  }, []);

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
    setItems([...items, { description: '', subtext: '', quantity: 1, price: 0, amount: 0, taxes: [], tax_amount: 0 }]);
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-calculate amount
    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      newItems[index].amount = qty * price;

      // Recalculate tax amounts if taxes exist
      if (newItems[index].taxes && newItems[index].taxes.length > 0) {
        const itemAmount = qty * price;
        newItems[index].taxes = newItems[index].taxes.map((tax, i) => ({
          ...tax,
          tax_amount: Math.round((itemAmount * tax.tax_rate / 100) * 100) / 100,
          display_order: i
        }));
        newItems[index].tax_amount = newItems[index].taxes.reduce((sum, t) => sum + t.tax_amount, 0);
      }
    }

    setItems(newItems);
  };

  const removeLineItem = (index) => {
    // Simply remove from array - backend uses replace-all strategy
    setItems(items.filter((_, i) => i !== index));
  };

  // Line item tax handlers
  const openLineItemTaxModal = (index) => {
    setEditingLineItemIndex(index);
    setShowLineItemTaxModal(true);
  };

  const handleLineItemTaxSave = (taxes) => {
    if (editingLineItemIndex === null) return;

    const newItems = [...items];
    const item = newItems[editingLineItemIndex];

    newItems[editingLineItemIndex] = {
      ...item,
      taxes: taxes,
      tax_amount: taxes.reduce((sum, t) => sum + t.tax_amount, 0)
    };

    setItems(newItems);
    setShowLineItemTaxModal(false);
    setEditingLineItemIndex(null);
  };

  // Calculate item total (amount + item taxes)
  const calculateItemTotal = (item) => {
    const amount = parseFloat(item.amount || 0);
    const taxAmount = item.taxes?.reduce((sum, t) => sum + (t.tax_amount || 0), 0) || 0;
    return amount + taxAmount;
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

  const handleSave = async (saveStatus = INVOICE_STATUS.DRAFT, openSendDialog = false) => {
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
          ...(item.id && { id: item.id }), // Include id for existing items to update them
          name: item.description || item.name,
          description: item.description || item.name,
          subtext: item.subtext || null,
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
        notes: notes || null,
        payment_instructions: paymentInstructions || companyDefaultPaymentInstructions || null,
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

      // Only open send dialog if explicitly requested (via Save & Send button)
      if (openSendDialog) {
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">
                    No items added yet. Click "+ Add Items" to get started.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <textarea
                          value={item.description}
                          onChange={(e) => {
                            updateLineItem(index, 'description', e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="Item description"
                          rows={1}
                          className="auto-grow-textarea w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none bg-transparent"
                          style={{ minHeight: '24px' }}
                        />
                        <textarea
                          value={item.subtext || ''}
                          onChange={(e) => {
                            updateLineItem(index, 'subtext', e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="Additional details (optional)"
                          maxLength={500}
                          rows={1}
                          className="auto-grow-textarea w-full px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none bg-transparent"
                          style={{ minHeight: '20px' }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateLineItem(index, 'price', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-purple-500 bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-purple-500 bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="pt-1">
                        <div className="text-sm font-medium text-gray-900">
                          {getCurrencySymbol(currencyCode)}{formatNumber(item.amount)}
                        </div>
                        <button
                          type="button"
                          onClick={() => openLineItemTaxModal(index)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {item.taxes && item.taxes.length > 0 ? 'Edit Tax' : '+ Tax'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="pt-1">
                        <div className="text-sm font-semibold text-gray-900">
                          {getCurrencySymbol(currencyCode)}{formatNumber(calculateItemTotal(item))}
                        </div>
                        {item.taxes && item.taxes.length > 0 && (
                          <div className="mt-0.5">
                            {item.taxes.map((tax, taxIndex) => (
                              <div key={taxIndex} className="text-xs text-gray-500">
                                {tax.tax_name}: {getCurrencySymbol(currencyCode)}{formatNumber(tax.tax_amount)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="pt-1">
                        <button
                          onClick={() => removeLineItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
          <span className="text-sm font-medium text-gray-900">{getCurrencySymbol(currencyCode)}{formatNumber(totals.subtotal)}</span>
        </div>

        {/* Discount */}
        {discountValue > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}:
              </span>
              <button
                onClick={() => setShowDiscountModal(true)}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Edit
              </button>
              <button
                onClick={() => setDiscountValue(0)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <span className="text-sm font-medium text-red-600">
              -{getCurrencySymbol(currencyCode)}{formatNumber(totals.discount || 0)}
            </span>
          </div>
        )}

        {/* Tax */}
        {taxRate > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {taxLabel} ({taxRate}%):
              </span>
              <button
                onClick={() => setShowTaxModal(true)}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Edit
              </button>
              <button
                onClick={() => setTaxRate(0)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {getCurrencySymbol(currencyCode)}{formatNumber(totals.tax || 0)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-3 px-4 bg-purple-100 rounded-lg">
          <span className="text-sm font-semibold text-gray-900">Total Amount:</span>
          <span className="text-lg font-bold text-gray-900">{getCurrencySymbol(currencyCode)}{formatNumber(totals.total)}</span>
        </div>

        {/* Deposit */}
        {depositValue > 0 && depositType && (
          <div className="flex items-center justify-between py-2 px-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700">
                Deposit Required {depositType === 'percentage' ? `(${depositValue}%)` : ''}:
              </span>
              <button
                onClick={() => setShowDepositModal(true)}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Edit
              </button>
              <button
                onClick={() => { setDepositValue(0); setDepositType(null); }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <span className="text-sm font-medium text-blue-700">
              {getCurrencySymbol(currencyCode)}{formatNumber(
                depositType === 'percentage'
                  ? (totals.total * depositValue / 100)
                  : depositValue
              )}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {taxRate === 0 && (
            <button
              onClick={() => setShowTaxModal(true)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              Add Tax
            </button>
          )}
          {discountValue === 0 && (
            <button
              onClick={() => setShowDiscountModal(true)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              Add Discount
            </button>
          )}
          {(!depositValue || depositValue === 0) && (
            <button
              onClick={() => setShowDepositModal(true)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              Add Deposit
            </button>
          )}
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Invoice Notes (Visible to Clients)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Instructions
          </label>
          <textarea
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            placeholder={companyDefaultPaymentInstructions || "Enter payment instructions"}
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
              onClick={() => handleSave(invoice?.status && invoice.status !== 'draft' ? invoice.status : INVOICE_STATUS.DRAFT)}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
              {getSaveButtonText()}
            </button>
            <button
              onClick={() => handleSave(INVOICE_STATUS.SENT, true)}
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

      <LineItemTaxModal
        isOpen={showLineItemTaxModal}
        onClose={() => {
          setShowLineItemTaxModal(false);
          setEditingLineItemIndex(null);
        }}
        onSave={handleLineItemTaxSave}
        itemAmount={editingLineItemIndex !== null ? parseFloat(items[editingLineItemIndex]?.amount || 0) : 0}
        initialTaxes={editingLineItemIndex !== null ? (items[editingLineItemIndex]?.taxes || []) : []}
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
        recurringStatus={recurringStatus}
        startDate={invoiceDate}
        pricingType={pricingType}
        recurringNumber={recurringNumber}
        customEvery={customEvery}
        customPeriod={customPeriod}
        allowStripePayments={allowStripePayments}
        allowPaypalPayments={allowPaypalPayments}
        allowPartialPayments={allowPartialPayments}
        automaticPaymentEnabled={automaticPaymentEnabled}
        automaticEmail={automaticEmail}
        invoiceStatus={invoice?.status || 'draft'}
        isEditing={isEditing && isRecurring}
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
                onClick={() => handleSave(invoice?.status && invoice.status !== 'draft' ? invoice.status : INVOICE_STATUS.DRAFT)}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
                {getSaveButtonText()}
              </button>
              <button
                onClick={() => handleSave(INVOICE_STATUS.SENT, true)}
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
