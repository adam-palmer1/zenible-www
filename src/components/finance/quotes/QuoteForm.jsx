import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Plus, Trash2, Loader2, ArrowLeft, ChevronDown, Settings } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { QUOTE_STATUS } from '../../../constants/finance';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import { getCurrencySymbol } from '../../../utils/currencyUtils';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import quotesAPI from '../../../services/api/finance/quotes';
import TaxSelectModal from './TaxSelectModal';
import DiscountModal from '../invoices/DiscountModal';
import DepositModal from '../invoices/DepositModal';
import LineItemTaxModal from '../shared/LineItemTaxModal';
import ClientSelectModal from '../invoices/ClientSelectModal';
import CurrencySelectModal from '../invoices/CurrencySelectModal';
import SendQuoteModal from './SendQuoteModal';
import QuoteSettingsModal from './QuoteSettingsModal';
import FinanceLayout from '../layout/FinanceLayout';

const QuoteForm = ({ quote: quoteProp = null, onSuccess, isInModal = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createQuote, updateQuote } = useQuotes();
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
    return null;
  }, [getNumberFormat, numberFormats]);

  // Helper function to format numbers
  const formatNumber = (num) => {
    return applyNumberFormat(num, numberFormat);
  };

  // Refs for dropdown positioning
  const clientButtonRef = React.useRef(null);
  const currencyButtonRef = React.useRef(null);

  // State
  const [quote, setQuote] = useState(quoteProp);
  const [loading, setLoading] = useState(!!id && !quoteProp);

  // Currency hook
  const { companyCurrencies: currencies, defaultCurrency: defaultCurrencyAssoc, loading: currenciesLoading } = useCompanyCurrencies();

  const isEditing = !!quote || !!id;

  // Form fields
  const [contactId, setContactId] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [currency, setCurrency] = useState('');
  const [status, setStatus] = useState(QUOTE_STATUS.DRAFT);

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

  // Modals
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLineItemTaxModal, setShowLineItemTaxModal] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [savedQuote, setSavedQuote] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Saving
  const [saving, setSaving] = useState(false);

  // Determine save button text based on quote status
  const getSaveButtonText = () => {
    if (quote?.status && quote.status !== 'draft') {
      return 'Save';
    }
    return 'Save as Draft';
  };

  // Load quote when editing
  useEffect(() => {
    const loadQuote = async () => {
      if (id && !quoteProp) {
        try {
          setLoading(true);
          const data = await quotesAPI.get(id);
          setQuote(data);
        } catch (error) {
          console.error('Failed to load quote:', error);
          showError('Failed to load quote');
          navigate('/finance/quotes');
        } finally {
          setLoading(false);
        }
      }
    };
    loadQuote();
  }, [id, quoteProp]);

  // Initialize form fields from loaded quote
  useEffect(() => {
    if (quote) {
      setContactId(quote.contact_id || '');
      setQuoteNumber(quote.quote_number || '');
      setQuoteDate(
        quote.issue_date
          ? new Date(quote.issue_date).toISOString().split('T')[0]
          : quote.quote_date
          ? new Date(quote.quote_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setValidUntil(
        quote.valid_until ? new Date(quote.valid_until).toISOString().split('T')[0] : ''
      );
      setCurrency(quote.currency_id || '');
      setStatus(quote.status || QUOTE_STATUS.DRAFT);

      // Normalize items to have description field
      const quoteItems = quote.quote_items || quote.items || [];
      const normalizedItems = quoteItems.map(item => ({
        ...item,
        description: item.name || item.description || '',
        subtext: item.description || '',
        quantity: parseFloat(item.quantity || 0),
        price: parseFloat(item.unit_price || item.price || 0),
        amount: parseFloat(item.amount || 0) || (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || item.price || 0)),
        taxes: item.taxes || [],
        tax_amount: item.taxes?.reduce((sum, t) => sum + (parseFloat(t.tax_amount) || 0), 0) || 0,
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

      setTaxRate(parseFloat(quote.tax_rate || 0));
      setTaxLabel(quote.tax_label || 'Tax');
      setDiscountType(quote.discount_type || 'percentage');
      setDiscountValue(parseFloat(quote.discount_value || quote.discount_percentage || 0));

      // Infer deposit type from which field has a value if deposit_type is not set
      let inferredDepositType = quote.deposit_type || null;
      let inferredDepositValue = 0;
      if (quote.deposit_percentage && parseFloat(quote.deposit_percentage) > 0) {
        inferredDepositType = inferredDepositType || 'percentage';
        inferredDepositValue = parseFloat(quote.deposit_percentage);
      } else if (quote.deposit_value && parseFloat(quote.deposit_value) > 0) {
        inferredDepositType = inferredDepositType || 'fixed';
        inferredDepositValue = parseFloat(quote.deposit_value);
      }
      setDepositType(inferredDepositType);
      setDepositValue(inferredDepositValue);
      setNotes(quote.notes || '');
      setTerms(quote.terms || '');
    }
  }, [quote]);

  // Set default currency when currencies are loaded (for new quotes only)
  useEffect(() => {
    if (!quote && !currency && currencies.length > 0) {
      const defaultCurrencyId = defaultCurrencyAssoc?.currency?.id || currencies[0]?.currency?.id;
      if (defaultCurrencyId) {
        setCurrency(defaultCurrencyId);
      }
    }
  }, [quote, currency, currencies, defaultCurrencyAssoc]);

  // Set currency based on selected contact (contact currency takes priority over company default)
  useEffect(() => {
    if (!quote && contactId && allContacts.length > 0 && currencies.length > 0) {
      const selectedContact = allContacts.find(c => c.id === contactId);
      if (selectedContact) {
        const contactCurrencyId =
          selectedContact.preferred_currency_id ||
          selectedContact.currency_id ||
          selectedContact.default_currency_id ||
          selectedContact.currency?.id;

        if (contactCurrencyId) {
          const currencyExists = currencies.some(cc => cc.currency.id === contactCurrencyId);
          if (currencyExists) {
            setCurrency(contactCurrencyId);
          }
        }
      }
    }
  }, [contactId, allContacts, currencies, quote]);

  // Load next quote number
  useEffect(() => {
    const loadNextNumber = async () => {
      if (!quote && !id) {
        try {
          const data = await quotesAPI.getNextNumber();
          if (data?.next_number) {
            setQuoteNumber(data.next_number);
          }
        } catch (error) {
          console.error('Failed to load next quote number:', error);
        }
      }
    };
    loadNextNumber();
  }, [quote, id]);

  // Set default valid until (30 days from quote date)
  useEffect(() => {
    if (!quote && quoteDate && !validUntil) {
      const issueDate = new Date(quoteDate);
      const validDate = new Date(issueDate);
      validDate.setDate(validDate.getDate() + 30);
      setValidUntil(validDate.toISOString().split('T')[0]);
    }
  }, [quote, quoteDate, validUntil]);

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
    setShowSendModal(false);
    setSavedQuote(null);
    if (onSuccess) {
      onSuccess(savedQuote);
    } else {
      navigate('/finance/quotes');
    }
  };

  const handleSave = async (saveStatus = QUOTE_STATUS.DRAFT, openSendModal = false) => {
    // Validation
    if (!contactId) {
      showError('Please select a client');
      return;
    }
    if (!quoteDate) {
      showError('Please select a quote date');
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

      const quoteData = {
        contact_id: contactId,
        quote_number: quoteNumber || undefined,
        issue_date: quoteDate,
        valid_until: validUntil || undefined,
        currency_id: currency,
        status: saveStatus,
        quote_items: items.map(item => {
          const itemData = {
            ...(item.id && { id: item.id }),
            name: item.description || item.name,
            description: item.subtext || item.description,
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price),
            amount: parseFloat(item.amount),
          };

          // Include taxes array if present
          if (item.taxes && item.taxes.length > 0) {
            itemData.taxes = item.taxes.map((tax, index) => ({
              tax_name: tax.tax_name,
              tax_rate: parseFloat(tax.tax_rate),
              tax_amount: parseFloat(tax.tax_amount),
              display_order: tax.display_order ?? index
            }));
          }

          return itemData;
        }),
        tax_rate: parseFloat(taxRate) || 0,
        tax_label: taxLabel,
        discount_type: discountValue > 0 ? discountType : undefined,
        discount_value: discountValue > 0 ? parseFloat(discountValue) : undefined,
        deposit_type: depositValue > 0 ? depositType : undefined,
        deposit_value: depositValue > 0 ? parseFloat(depositValue) : undefined,
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

      // Only open send modal if explicitly requested (via Save & Send button)
      if (openSendModal) {
        setSavedQuote(result);
        setShowSendModal(true);
      } else {
        if (onSuccess) {
          onSuccess(result);
        } else {
          navigate('/finance/quotes');
        }
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      showError(error.message || 'Failed to save quote');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state when fetching quote data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="inline-block h-8 w-8 animate-spin text-purple-600 mb-2" />
          <p className="text-sm text-gray-600">Loading quote...</p>
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

        {/* Quote Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quote Number
          </label>
          <input
            type="text"
            value={quoteNumber}
            onChange={(e) => setQuoteNumber(e.target.value)}
            placeholder="QTE-0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Quote Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quote Date<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={quoteDate}
              onChange={(e) => setQuoteDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Valid Until */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valid Until
          </label>
          <div className="relative">
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={quoteDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            Notes (Internal)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal Note (Not Visible To Client)"
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
            placeholder="Write Quote Terms and Conditions"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Footer Buttons (only in modal mode) */}
      {isInModal && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Quote Settings
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(quote?.status && quote.status !== 'draft' ? quote.status : QUOTE_STATUS.DRAFT)}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
              {getSaveButtonText()}
            </button>
            <button
              onClick={() => handleSave(QUOTE_STATUS.SENT, true)}
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
      <TaxSelectModal
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

      {showSettingsModal && (
        <QuoteSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          quoteStatus={quote?.status || 'draft'}
        />
      )}

      {/* Send Quote Modal */}
      {showSendModal && savedQuote && (
        <SendQuoteModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          quote={savedQuote}
          contact={savedQuote && allContacts.find(c => c.id === savedQuote.contact_id)}
          onSuccess={handleSendSuccess}
        />
      )}
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
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Quote Settings
              </button>
              <button
                onClick={() => handleSave(quote?.status && quote.status !== 'draft' ? quote.status : QUOTE_STATUS.DRAFT)}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
                {getSaveButtonText()}
              </button>
              <button
                onClick={() => handleSave(QUOTE_STATUS.SENT, true)}
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

export default QuoteForm;
