import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Upload, Loader2, ArrowLeft } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { PAYMENT_METHOD } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import currenciesAPI from '../../../services/api/crm/currencies';
import expensesAPI from '../../../services/api/finance/expenses';
import uploadAPI from '../../../services/uploadAPI';
import currencyConversionAPI from '../../../services/api/crm/currencyConversion';
import FinanceLayout from '../layout/FinanceLayout';
import RecurringExpenseSettings from './RecurringExpenseSettings';
import Combobox from '../../ui/combobox/Combobox';

/**
 * Helper to get display name for a contact (vendor or client)
 */
const getContactDisplayName = (contact) => {
  if (!contact) return '';
  if (contact.business_name) return contact.business_name;
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || contact.email || 'Unnamed';
};

const ExpenseForm = ({ expense = null, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!expense || !!id;
  const { createExpense, updateExpense, categories, uploadAttachment, createCategory, refreshCategories } = useExpenses();
  const { contacts: vendors } = useContacts({ is_vendor: true });
  const { contacts: clients } = useContacts({ is_client: true });
  const { showSuccess, showError } = useNotification();

  // Currencies
  const [currencies, setCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  const [expenseNumber, setExpenseNumber] = useState(expense?.expense_number || '');
  const [amount, setAmount] = useState(expense?.amount || '');
  const [currency, setCurrency] = useState(expense?.currency || 'USD');
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [categoryId, setCategoryId] = useState(expense?.category_id || '');
  const [vendorId, setVendorId] = useState(expense?.vendor_id || '');
  const [contactId, setContactId] = useState(expense?.contact_id || '');
  const [description, setDescription] = useState(expense?.description || '');
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method || '');
  const [reference, setReference] = useState(expense?.reference || '');
  const [notes, setNotes] = useState(expense?.notes || '');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Recurring expense fields
  const [isRecurring, setIsRecurring] = useState(
    expense?.pricing_type === 'fixed' && expense?.recurring_type ? true : false
  );
  const [recurringType, setRecurringType] = useState(expense?.recurring_type || 'monthly');
  const [customEvery, setCustomEvery] = useState(expense?.custom_every || 1);
  const [customPeriod, setCustomPeriod] = useState(expense?.custom_period || 'months');
  const [recurringNumber, setRecurringNumber] = useState(expense?.recurring_number ?? -1);
  const [recurringStatus, setRecurringStatus] = useState(expense?.recurring_status || 'active');

  // Enhanced fields: Exchange rate and base amount
  const [exchangeRate, setExchangeRate] = useState(expense?.exchange_rate || 1);
  const [baseCurrency, setBaseCurrency] = useState('');
  const [fetchingRate, setFetchingRate] = useState(false);

  // Transform categories for Combobox
  const categoryOptions = useMemo(() => {
    return (categories || []).map(cat => ({
      id: cat.id,
      label: cat.full_name || cat.name,
    }));
  }, [categories]);

  // Transform vendors for Combobox
  const vendorOptions = useMemo(() => {
    return (vendors || []).map(vendor => ({
      id: vendor.id,
      label: getContactDisplayName(vendor),
    }));
  }, [vendors]);

  // Transform clients for Combobox
  const clientOptions = useMemo(() => {
    return (clients || []).map(client => ({
      id: client.id,
      label: getContactDisplayName(client),
    }));
  }, [clients]);

  // Get base currency code for formatting
  const baseCurrencyCode = useMemo(() => {
    if (!baseCurrency || !currencies.length) return 'USD';
    const baseCurrencyObj = currencies.find(c => c.currency.id === baseCurrency);
    return baseCurrencyObj?.currency?.code || 'USD';
  }, [baseCurrency, currencies]);

  // Handler for creating a new category from the dropdown
  const handleCreateCategory = async (name) => {
    try {
      setCreatingCategory(true);
      const newCategory = await createCategory({ name });
      refreshCategories();
      showSuccess(`Category "${name}" created`);
      return newCategory;
    } catch (error) {
      showError(error.message || 'Failed to create category');
      throw error;
    } finally {
      setCreatingCategory(false);
    }
  };

  // Load company-enabled currencies on mount
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await currenciesAPI.getCompanyCurrencies();
        setCurrencies(data || []);

        // Set default currency from company default or first one if not already set
        if (!currency && data && data.length > 0) {
          const defaultCurr = data.find(cc => cc.is_default);
          const selectedCurrency = defaultCurr ? defaultCurr.currency.id : data[0].currency.id;
          setCurrency(selectedCurrency);

          // Set base currency for exchange rate calculations
          if (defaultCurr) {
            setBaseCurrency(defaultCurr.currency.id);
          }
        } else if (data && data.length > 0) {
          // If currency already set, find base currency
          const defaultCurr = data.find(cc => cc.is_default);
          if (defaultCurr) {
            setBaseCurrency(defaultCurr.currency.id);
          }
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

  // Load next expense number for new expenses
  useEffect(() => {
    const loadNextNumber = async () => {
      // Only fetch next number if creating new expense (no expense prop)
      if (!expense) {
        try {
          const data = await expensesAPI.getNextNumber();
          if (data?.next_number) {
            setExpenseNumber(data.next_number);
          }
        } catch (error) {
          console.error('Failed to load next expense number:', error);
          showError('Failed to load next expense number');
        }
      }
    };

    loadNextNumber();
  }, [expense]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const fetchExchangeRate = async (fromCurrency, toCurrency) => {
    if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
      setExchangeRate(1);
      return;
    }

    try {
      setFetchingRate(true);
      const response = await currencyConversionAPI.convert(1, fromCurrency, toCurrency);
      if (response && response.converted_amount) {
        setExchangeRate(response.converted_amount);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      showError('Failed to fetch exchange rate. Please enter manually.');
    } finally {
      setFetchingRate(false);
    }
  };

  const calculateBaseAmount = () => {
    if (!amount || !exchangeRate) return 0;
    return parseFloat(amount) * parseFloat(exchangeRate);
  };

  // Auto-fetch exchange rate when currency changes
  useEffect(() => {
    if (currency && baseCurrency && currency !== baseCurrency && currencies.length > 0) {
      // Get currency codes from IDs
      const selectedCurrency = currencies.find(c => c.currency.id === currency);
      const baseCurrencyObj = currencies.find(c => c.currency.id === baseCurrency);

      if (selectedCurrency && baseCurrencyObj) {
        fetchExchangeRate(selectedCurrency.currency.code, baseCurrencyObj.currency.code);
      }
    } else if (currency === baseCurrency) {
      setExchangeRate(1);
    }
  }, [currency, baseCurrency, currencies]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!expenseDate) {
      showError('Please select an expense date');
      return;
    }

    // Validate recurring settings
    if (isRecurring) {
      if (recurringType === 'custom') {
        if (!customEvery || customEvery < 1) {
          showError('Please specify a valid custom recurrence interval');
          return;
        }
        if (!customPeriod) {
          showError('Please select a custom recurrence period');
          return;
        }
      }
      if (recurringNumber !== -1 && recurringNumber < 1) {
        showError('Number of occurrences must be at least 1 or -1 for infinite');
        return;
      }
    }

    try {
      setSaving(true);

      const expenseData = {
        expense_number: expenseNumber || undefined,
        amount: parseFloat(amount),
        currency_id: currency, // Send currency_id (UUID)
        expense_date: expenseDate,
        category_id: categoryId || undefined, // Already a UUID string
        vendor_id: vendorId || undefined, // Already a UUID string (contact ID)
        contact_id: contactId || undefined, // Client/customer association
        description: description || undefined,
        payment_method: paymentMethod || undefined,
        reference_number: reference || undefined,
        notes: notes || undefined,
        // Enhanced fields
        exchange_rate: currency !== baseCurrency ? parseFloat(exchangeRate) : undefined,
        // Recurring fields (backend expects lowercase)
        pricing_type: isRecurring ? 'fixed' : undefined,
        recurring_type: isRecurring ? recurringType.toLowerCase() : undefined,
        custom_every: isRecurring && recurringType === 'custom' ? customEvery : undefined,
        custom_period: isRecurring && recurringType === 'custom' ? customPeriod.toLowerCase() : undefined,
        recurring_number: isRecurring ? recurringNumber : undefined,
        recurring_status: isRecurring && expense?.id ? recurringStatus : 'active',
      };

      let result;
      if (expense?.id) {
        result = await updateExpense(expense.id, expenseData);
        showSuccess('Expense updated successfully');
      } else {
        result = await createExpense(expenseData);
        showSuccess('Expense created successfully');
      }

      // Upload attachment if provided
      if (attachment && result.id) {
        try {
          setUploading(true);
          await uploadAttachment(result.id, attachment);
          showSuccess('Attachment uploaded successfully');
        } catch (err) {
          showError('Expense saved but attachment upload failed');
        } finally {
          setUploading(false);
        }
      }

      if (onSuccess) {
        onSuccess(result);
      } else {
        navigate('/finance/expenses');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      showError(error.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess(null);
    } else {
      navigate('/finance/expenses');
    }
  };

  const formContent = (
    <div className="max-w-4xl mx-auto p-6">
      <div className="design-bg-primary rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b design-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold design-text-primary">
              {expense ? 'Edit Expense' : 'New Expense'}
            </h2>
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={saving || uploading} className="px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary disabled:opacity-50">
                <X className="h-4 w-4 inline mr-2" />
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || uploading} className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90 disabled:opacity-50">
                {saving || uploading ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : <Save className="h-4 w-4 inline mr-2" />}
                {saving ? 'Saving...' : uploading ? 'Uploading...' : expense ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Expense Number
              </label>
              <input
                type="text"
                value={expenseNumber}
                onChange={(e) => setExpenseNumber(e.target.value)}
                className="w-full px-3 py-2 design-input rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" className="w-full px-3 py-2 design-input rounded-md" required />
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Currency</label>
              {currenciesLoading ? (
                <div className="px-3 py-2 design-input rounded-md design-text-secondary">
                  Loading currencies...
                </div>
              ) : (
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 design-input rounded-md">
                  {currencies.map((cc) => (
                    <option key={cc.currency.id} value={cc.currency.id}>
                      {cc.currency.code} - {cc.currency.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {currency !== baseCurrency && baseCurrency && (
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Exchange Rate
                  <button
                    type="button"
                    onClick={() => {
                      const selectedCurrency = currencies.find(c => c.currency.id === currency);
                      const baseCurrencyObj = currencies.find(c => c.currency.id === baseCurrency);
                      if (selectedCurrency && baseCurrencyObj) {
                        fetchExchangeRate(selectedCurrency.currency.code, baseCurrencyObj.currency.code);
                      }
                    }}
                    disabled={fetchingRate}
                    className="ml-2 text-xs text-purple-600 hover:underline disabled:opacity-50 dark:text-purple-400"
                  >
                    {fetchingRate ? 'Fetching...' : 'Refresh Rate'}
                  </button>
                </label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                  step="0.0001"
                  min="0"
                  className="w-full px-3 py-2 design-input rounded-md"
                />
                <p className="text-xs design-text-secondary mt-1">
                  Rate to convert to base currency
                </p>
              </div>
            )}

            {currency !== baseCurrency && baseCurrency && amount && exchangeRate && (
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Amount in Base Currency
                </label>
                <div className="w-full px-3 py-2 design-input rounded-md bg-gray-50 dark:bg-gray-900 design-text-primary">
                  {formatCurrency(calculateBaseAmount(), baseCurrencyCode)}
                </div>
                <p className="text-xs design-text-secondary mt-1">
                  Automatically calculated based on exchange rate
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full px-3 py-2 design-input rounded-md" required />
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Category</label>
              <Combobox
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select category"
                searchPlaceholder="Search categories..."
                emptyMessage="No categories found"
                onCreate={handleCreateCategory}
                createLabel="Create new category"
                creating={creatingCategory}
              />
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Vendor</label>
              <Combobox
                options={vendorOptions}
                value={vendorId}
                onChange={setVendorId}
                placeholder="Select vendor"
                searchPlaceholder="Search vendors..."
                emptyMessage="No vendors found"
              />
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Client/Customer</label>
              <Combobox
                options={clientOptions}
                value={contactId}
                onChange={setContactId}
                placeholder="Select client (optional)"
                searchPlaceholder="Search clients..."
                emptyMessage="No clients found"
              />
              <p className="text-xs design-text-secondary mt-1">
                Associate this expense with a specific client
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 design-input rounded-md">
                <option value="">Select method</option>
                <option value={PAYMENT_METHOD.CREDIT_CARD}>Credit Card</option>
                <option value={PAYMENT_METHOD.BANK_TRANSFER}>Bank Transfer</option>
                <option value={PAYMENT_METHOD.CASH}>Cash</option>
                <option value={PAYMENT_METHOD.CHECK}>Check</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium design-text-primary mb-2">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this expense for?" className="w-full px-3 py-2 design-input rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium design-text-primary mb-2">Reference Number</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Receipt/invoice number" className="w-full px-3 py-2 design-input rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium design-text-primary mb-2">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" rows={3} className="w-full px-3 py-2 design-input rounded-md resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium design-text-primary mb-2">Attachment (Receipt)</label>
            <div className="flex items-center gap-3">
              <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="flex-1 px-3 py-2 design-input rounded-md" />
              {attachment && (
                <div className="flex items-center gap-2 text-sm design-text-secondary">
                  <Upload className="h-4 w-4" />
                  {attachment.name}
                </div>
              )}
            </div>
          </div>

          {/* Recurring Expense Settings */}
          <RecurringExpenseSettings
            isRecurring={isRecurring}
            recurringType={recurringType}
            recurringEvery={customEvery}
            recurringPeriod={customPeriod}
            recurringNumber={recurringNumber}
            recurringStatus={recurringStatus}
            startDate={expenseDate}
            isEditMode={!!expense?.id}
            onChange={(updates) => {
              if ('isRecurring' in updates) setIsRecurring(updates.isRecurring);
              if ('recurringType' in updates) setRecurringType(updates.recurringType);
              if ('recurringEvery' in updates) setCustomEvery(updates.recurringEvery);
              if ('recurringPeriod' in updates) setCustomPeriod(updates.recurringPeriod);
              if ('recurringNumber' in updates) setRecurringNumber(updates.recurringNumber);
              if ('recurringStatus' in updates) setRecurringStatus(updates.recurringStatus);
            }}
          />
        </div>
      </div>
    </div>
  );

  // Wrap in FinanceLayout with header
  return (
    <FinanceLayout
      header={
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/finance/expenses')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to expenses"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Expense' : 'New Expense'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isEditing ? 'Update expense details' : 'Record a new expense'}
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

export default ExpenseForm;
