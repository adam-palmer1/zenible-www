import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Loader2, ArrowLeft } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { QUOTE_STATUS } from '../../../constants/finance';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import currenciesAPI from '../../../services/api/crm/currencies';
import quotesAPI from '../../../services/api/finance/quotes';
import InvoiceLineItems from '../invoices/InvoiceLineItems';
import InvoiceTotals from '../invoices/InvoiceTotals';
import TaxModal from '../invoices/TaxModal';
import DiscountModal from '../invoices/DiscountModal';
import FinanceLayout from '../layout/FinanceLayout';

const QuoteForm = ({ quote: quoteProp = null, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createQuote, updateQuote } = useQuotes();
  const { contacts: allContacts, loading: contactsLoading } = useContacts({ is_client: true });
  const { showSuccess, showError } = useNotification();

  // Quote data (from prop or loaded)
  const [quote, setQuote] = useState(quoteProp);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const isEditing = !!quote || !!id;

  // Currencies
  const [currencies, setCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  // Basic fields
  const [contactId, setContactId] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState(QUOTE_STATUS.DRAFT);

  // Line items
  const [items, setItems] = useState([]);

  // Tax, discount
  const [taxRate, setTaxRate] = useState(0);
  const [taxLabel, setTaxLabel] = useState('Tax');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Notes and terms
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Modals
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Load quote data when editing by ID
  useEffect(() => {
    const loadQuote = async () => {
      if (id && !quoteProp) {
        try {
          setQuoteLoading(true);
          const data = await quotesAPI.get(id);
          setQuote(data);
        } catch (error) {
          console.error('Failed to load quote:', error);
          showError('Failed to load quote');
          navigate('/finance/quotes');
        } finally {
          setQuoteLoading(false);
        }
      }
    };

    loadQuote();
  }, [id, quoteProp, navigate, showError]);

  // Populate form fields when quote data is available
  useEffect(() => {
    if (quote) {
      setContactId(quote.contact_id || quote.contact?.id || '');
      setQuoteNumber(quote.quote_number || '');
      setQuoteDate(
        (quote.issue_date || quote.quote_date)
          ? new Date(quote.issue_date || quote.quote_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setValidUntil(
        quote.valid_until
          ? new Date(quote.valid_until).toISOString().split('T')[0]
          : ''
      );
      setCurrency(quote.currency_id || quote.currency?.id || quote.currency || 'USD');
      setStatus(quote.status || QUOTE_STATUS.DRAFT);

      // Handle items - map to internal format if needed
      const quoteItems = quote.quote_items || quote.items || [];
      setItems(quoteItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.unit_price || item.price,
        amount: item.amount,
      })));

      setTaxRate(quote.tax_rate || 0);
      setTaxLabel(quote.tax_label || 'Tax');
      setDiscountType(quote.discount_type || 'percentage');
      setDiscountValue(quote.discount_value || 0);
      setNotes(quote.notes || '');
      setTerms(quote.terms || '');
    }
  }, [quote]);

  // Load company-enabled currencies on mount
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await currenciesAPI.getCompanyCurrencies();
        setCurrencies(data || []);

        // Set default currency from company default or first one if not already set
        if (!currency && data && data.length > 0) {
          const defaultCurr = data.find(cc => cc.is_default);
          setCurrency(defaultCurr ? defaultCurr.currency.id : data[0].currency.id);
        }
      } catch (error) {
        console.error('Failed to load currencies:', error);
        showError('Failed to load currencies');
      } finally {
        setCurrenciesLoading(false);
      }
    };

    loadCurrencies();
  }, []);

  // Load next quote number for new quotes
  useEffect(() => {
    const loadNextNumber = async () => {
      // Only fetch next number if creating new quote (no id or quote prop)
      if (!id && !quoteProp) {
        try {
          const data = await quotesAPI.getNextNumber();
          if (data?.next_number) {
            setQuoteNumber(data.next_number);
          }
        } catch (error) {
          console.error('Failed to load next quote number:', error);
          showError('Failed to load next quote number');
        }
      }
    };

    loadNextNumber();
  }, [id, quoteProp, showError]);

  // Get currency code from UUID for display
  const getCurrencyCode = () => {
    if (!currency || !currencies.length) return 'USD';
    const currencyAssoc = currencies.find(cc => cc.currency.id === currency);
    return currencyAssoc?.currency?.code || 'USD';
  };
  const currencyCode = getCurrencyCode();

  // Calculate totals
  const totals = calculateInvoiceTotal(items, taxRate, discountType, discountValue);

  const handleSave = async (saveStatus = status) => {
    // Validation
    if (!contactId) {
      showError('Please select a client');
      return;
    }

    if (items.length === 0) {
      showError('Please add at least one line item');
      return;
    }

    if (!quoteDate) {
      showError('Please select a quote date');
      return;
    }

    try {
      setSaving(true);

      const quoteData = {
        contact_id: contactId, // Already a UUID string from the select
        quote_number: quoteNumber || undefined,
        issue_date: quoteDate, // API expects issue_date
        valid_until: validUntil || undefined,
        currency_id: currency, // Send currency_id (UUID)
        status: saveStatus,
        quote_items: items.map(item => ({ // API expects quote_items
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.price), // API expects unit_price
          amount: parseFloat(item.amount),
        })),
        tax_rate: parseFloat(taxRate) || 0,
        tax_label: taxLabel,
        discount_type: discountValue > 0 ? discountType : undefined,
        discount_value: discountValue > 0 ? parseFloat(discountValue) : undefined,
        notes: notes || undefined,
        terms: terms || undefined,
      };

      let result;
      if (quote?.id) {
        result = await updateQuote(quote.id, quoteData);
        showSuccess('Quote updated successfully');
      } else {
        result = await createQuote(quoteData);
        showSuccess('Quote created successfully');
      }

      if (onSuccess) {
        onSuccess(result);
      } else {
        navigate('/finance/quotes');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      showError(error.message || 'Failed to save quote');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess(null);
    } else {
      navigate('/finance/quotes');
    }
  };

  // Show loading state when loading quote for edit
  if (quoteLoading) {
    return (
      <FinanceLayout
        header={
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/finance/quotes')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to quotes"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loading Quote...</h1>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-zenible-primary mx-auto" />
            <p className="mt-2 text-sm design-text-secondary">Loading quote data...</p>
          </div>
        </div>
      </FinanceLayout>
    );
  }

  const formContent = (
    <div className="max-w-6xl mx-auto p-6">
      <div className="design-bg-primary rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b design-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold design-text-primary">
              {quote ? 'Edit Quote' : 'New Quote'}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary disabled:opacity-50"
              >
                <X className="h-4 w-4 inline mr-2" />
                Cancel
              </button>
              {status === QUOTE_STATUS.DRAFT && (
                <button
                  onClick={() => handleSave(QUOTE_STATUS.SENT)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
                  Save & Send
                </button>
              )}
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : <Save className="h-4 w-4 inline mr-2" />}
                {quote ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              {contactsLoading ? (
                <div className="px-3 py-2 design-input rounded-md design-text-secondary">
                  Loading clients...
                </div>
              ) : (
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full px-3 py-2 design-input rounded-md"
                  required
                >
                  <option value="">Select a client</option>
                  {allContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} {contact.business_name ? `(${contact.business_name})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quote Number */}
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Quote Number
              </label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full px-3 py-2 design-input rounded-md"
              />
            </div>

            {/* Quote Date */}
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Quote Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="w-full px-3 py-2 design-input rounded-md"
                required
              />
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={quoteDate}
                className="w-full px-3 py-2 design-input rounded-md"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Currency
              </label>
              {currenciesLoading ? (
                <div className="px-3 py-2 design-input rounded-md design-text-secondary">
                  Loading currencies...
                </div>
              ) : (
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 design-input rounded-md"
                >
                  {currencies.map((cc) => (
                    <option key={cc.currency.id} value={cc.currency.id}>
                      {cc.currency.code} - {cc.currency.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Status (only show when editing) */}
            {quote && (
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 design-input rounded-md"
                >
                  <option value={QUOTE_STATUS.DRAFT}>Draft</option>
                  <option value={QUOTE_STATUS.SENT}>Sent</option>
                  <option value={QUOTE_STATUS.ACCEPTED}>Accepted</option>
                  <option value={QUOTE_STATUS.REJECTED}>Rejected</option>
                  <option value={QUOTE_STATUS.EXPIRED}>Expired</option>
                </select>
              </div>
            )}
          </div>

          {/* Line Items */}
          <InvoiceLineItems
            items={items}
            onChange={setItems}
            currency={currencyCode}
            taxRate={taxRate}
            discountType={discountType}
            discountValue={discountValue}
          />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-96">
              <InvoiceTotals
                items={items}
                currency={currencyCode}
                taxRate={taxRate}
                taxLabel={taxLabel}
                discountType={discountType}
                discountValue={discountValue}
                onEditTax={() => setShowTaxModal(true)}
                onEditDiscount={() => setShowDiscountModal(true)}
              />
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Notes (Internal)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes (not visible to client)"
                rows={4}
                className="w-full px-3 py-2 design-input rounded-md resize-none"
              />
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Quote terms and conditions"
                rows={4}
                className="w-full px-3 py-2 design-input rounded-md resize-none"
              />
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );

  // Wrap in FinanceLayout with header
  return (
    <FinanceLayout
      header={
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/finance/quotes')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to quotes"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Quote' : 'New Quote'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isEditing ? 'Update quote details' : 'Create a new quote for your client'}
              </p>
            </div>
          </div>
        </div>
      }
    >
      {formContent}
    </FinanceLayout>
  );
};

export default QuoteForm;
