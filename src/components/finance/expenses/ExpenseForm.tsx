import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Loader2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useProjects } from '../../../hooks/crm/useProjects';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';
import { PAYMENT_METHOD } from '../../../constants/finance';
import companiesAPI from '../../../services/api/crm/companies';
import contactsAPI from '../../../services/api/crm/contacts';
import expensesAPI from '../../../services/api/finance/expenses';
import FinanceLayout from '../layout/FinanceLayout';
const FinanceLayoutAny = FinanceLayout as any;
import RecurringExpenseSettings from './RecurringExpenseSettings';
import ReceiptUpload from './ReceiptUpload';
import Combobox from '../../ui/combobox/Combobox';

const getContactDisplayName = (contact: any): string => {
  if (!contact) return '';
  if (contact.business_name) return contact.business_name;
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || contact.email || 'Unnamed';
};

interface ExpenseFormProps {
  expense?: any;
  onSuccess?: (result: any) => void;
  isInModal?: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense = null, onSuccess, isInModal = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!expense || !!id;
  const { createExpense, updateExpense, categories, uploadAttachment, createCategory, refreshCategories } = useExpenses() as any;
  const { contacts: vendors, createContact: createVendorContact } = useContacts({ is_vendor: true }) as any;
  const { contacts: clients } = useContacts({ is_client: true }) as any;
  const { projects, createProject } = useProjects() as any;
  const { showSuccess, showError } = useNotification() as any;
  const { numberFormats } = useCRMReferenceData() as any;
  const { getNumberFormat } = useCompanyAttributes() as any;

  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find((f: any) => f.id === formatId);
    }
    return null;
  }, [getNumberFormat, numberFormats]);

  const formatAmount = (value: any) => {
    return applyNumberFormat(parseFloat(value || 0), numberFormat);
  };

  const { companyCurrencies: currencies, defaultCurrency: defaultCurrencyAssoc, loading: currenciesLoading } = useCompanyCurrencies() as any;
  const [company, setCompany] = useState<any>(null);

  const [expenseNumber, setExpenseNumber] = useState(expense?.expense_number || '');
  const [amount, setAmount] = useState(expense?.amount || '');
  const [currency, setCurrency] = useState(expense?.currency_id || '');
  const [currencyManuallyChanged, setCurrencyManuallyChanged] = useState(false);
  const [taxManuallyChanged, setTaxManuallyChanged] = useState(false);
  const [categoryManuallyChanged, setCategoryManuallyChanged] = useState(false);
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState(expense?.status || 'paid');
  const [categoryId, setCategoryId] = useState(expense?.expense_category_id || expense?.category_id || '');
  const [vendorId, setVendorId] = useState(expense?.vendor_id || '');
  const [contactId, setContactId] = useState(expense?.contact_id || '');
  const [projectId, setProjectId] = useState(expense?.project_id || '');
  const [description, setDescription] = useState(expense?.description || '');
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method || '');
  const [reference, setReference] = useState(expense?.reference || '');
  const [notes, setNotes] = useState(expense?.notes || '');
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingVendor, setCreatingVendor] = useState(false);

  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [loadingClientProjects, setLoadingClientProjects] = useState(false);

  const [includeTax, setIncludeTax] = useState(expense?.tax_rate != null && expense?.tax_rate > 0);
  const [taxRate, setTaxRate] = useState(expense?.tax_rate || '');
  const [taxName, setTaxName] = useState(expense?.tax_name || '');
  const [taxIncluded, setTaxIncluded] = useState(expense?.tax_included || false);
  const [taxAmount, setTaxAmount] = useState(expense?.tax_amount || '');

  const [receipt, setReceipt] = useState<any>(
    expense?.receipt_url
      ? {
          receipt_url: expense.receipt_url,
          attachment_filename: expense.attachment_filename,
          attachment_size: expense.attachment_size,
          attachment_type: expense.attachment_type,
        }
      : null
  );
  const [pendingReceipt, setPendingReceipt] = useState<any>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isRecurring, setIsRecurring] = useState(
    expense?.pricing_type === 'recurring' && expense?.recurring_type ? true : false
  );
  const [recurringType, setRecurringType] = useState(expense?.recurring_type || 'monthly');
  const [customEvery, setCustomEvery] = useState(expense?.custom_every || 1);
  const [customPeriod, setCustomPeriod] = useState(expense?.custom_period || 'months');
  const [recurringNumber, setRecurringNumber] = useState(expense?.recurring_number ?? -1);
  const [recurringStatus, setRecurringStatus] = useState(expense?.recurring_status || 'active');

  const categoryOptions = useMemo(() => {
    return (categories || []).map((cat: any) => ({
      id: cat.id,
      label: cat.full_name || cat.name,
    }));
  }, [categories]);

  const vendorOptions = useMemo(() => {
    return (vendors || []).map((vendor: any) => ({
      id: vendor.id,
      label: getContactDisplayName(vendor),
      defaultCurrencyId: vendor.default_currency_id,
      contactTaxes: vendor.contact_taxes || [],
    }));
  }, [vendors]);

  const clientOptions = useMemo(() => {
    return (clients || []).map((client: any) => ({
      id: client.id,
      label: getContactDisplayName(client),
    }));
  }, [clients]);

  const projectOptions = useMemo(() => {
    const projectsList = contactId ? clientProjects : projects;
    return (projectsList || []).map((project: any) => ({
      id: project.id,
      label: project.name,
      status: project.status,
    }));
  }, [projects, clientProjects, contactId]);

  const selectedClientName = useMemo(() => {
    if (!contactId) return null;
    const selectedClient = clients.find((c: any) => c.id === contactId);
    return selectedClient ? getContactDisplayName(selectedClient) : null;
  }, [contactId, clients]);

  const currencyOptions = useMemo(() => {
    return (currencies || []).map((cc: any) => ({
      id: cc.currency.id,
      label: `${cc.currency.code} - ${cc.currency.name}`,
      symbol: cc.currency.symbol,
    }));
  }, [currencies]);

  const paymentMethodOptions = useMemo(() => [
    { id: (PAYMENT_METHOD as any).CREDIT_CARD, label: 'Credit Card' },
    { id: (PAYMENT_METHOD as any).BANK_TRANSFER, label: 'Bank Transfer' },
    { id: (PAYMENT_METHOD as any).CASH, label: 'Cash' },
    { id: (PAYMENT_METHOD as any).CHECK, label: 'Check' },
  ], []);

  const statusOptions = useMemo(() => [
    { id: 'paid', label: 'Paid' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ], []);

  const handleCreateCategory = async (name: string) => {
    try {
      setCreatingCategory(true);
      const newCategory = await createCategory({ name });
      refreshCategories();
      showSuccess(`Category "${name}" created`);
      return newCategory;
    } catch (error: any) {
      showError(error.message || 'Failed to create category');
      throw error;
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateProject = async (name: string) => {
    try {
      setCreatingProject(true);
      const projectData: any = {
        name,
        start_date: new Date().toISOString().split('T')[0],
      };
      if (contactId) {
        projectData.contact_id = contactId;
      }
      const newProject = await createProject(projectData);
      if (contactId) {
        const projectsData = await (contactsAPI as any).getProjects(contactId);
        setClientProjects(projectsData || []);
      }
      showSuccess(`Project "${name}" created${contactId && selectedClientName ? ` for ${selectedClientName}` : ''}`);
      return newProject;
    } catch (error: any) {
      showError(error.message || 'Failed to create project');
      throw error;
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateVendor = async (name: string) => {
    try {
      setCreatingVendor(true);
      const vendorData = {
        business_name: name,
        is_vendor: true,
      };
      const newVendor = await createVendorContact(vendorData);
      showSuccess(`Vendor "${name}" created`);
      return newVendor;
    } catch (error: any) {
      showError(error.message || 'Failed to create vendor');
      throw error;
    } finally {
      setCreatingVendor(false);
    }
  };

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const companyData = await (companiesAPI as any).getCurrent();
        setCompany(companyData);
      } catch (error) {
        console.error('Failed to load company data:', error);
        showError('Failed to load form data');
      }
    };

    loadCompanyData();
  }, []);

  useEffect(() => {
    if (currencies.length > 0 && !expense?.currency_id && !currency) {
      const selectedCurrency = defaultCurrencyAssoc?.currency?.id || currencies[0]?.currency?.id;
      if (selectedCurrency) {
        setCurrency(selectedCurrency);
      }
    }
  }, [currencies, defaultCurrencyAssoc, expense?.currency_id, currency]);

  useEffect(() => {
    const loadNextNumber = async () => {
      if (!expense) {
        try {
          const data = await (expensesAPI as any).getNextNumber();
          if (data?.next_number) {
            setExpenseNumber(data.next_number);
          }
        } catch (error) {
          console.error('Failed to load next expense number:', error);
        }
      }
    };

    loadNextNumber();
  }, [expense]);

  useEffect(() => {
    const loadClientProjects = async () => {
      if (contactId) {
        try {
          setLoadingClientProjects(true);
          const projectsData = await (contactsAPI as any).getProjects(contactId);
          setClientProjects(projectsData || []);
          if (projectId && projectsData && !projectsData.some((p: any) => p.id === projectId)) {
            setProjectId('');
          }
        } catch (error) {
          console.error('Failed to load client projects:', error);
          setClientProjects([]);
        } finally {
          setLoadingClientProjects(false);
        }
      } else {
        setClientProjects([]);
      }
    };

    loadClientProjects();
  }, [contactId]);

  const handleVendorChange = useCallback(async (newVendorId: string) => {
    setVendorId(newVendorId);

    if (newVendorId) {
      try {
        const selectedVendor = await (contactsAPI as any).get(newVendorId);

        if (!currencyManuallyChanged && selectedVendor?.preferred_currency_id) {
          const vendorCurrency = currencies.find((c: any) => c.currency.id === selectedVendor.preferred_currency_id);
          if (vendorCurrency) {
            setCurrency(selectedVendor.preferred_currency_id);
          }
        }

        if (!taxManuallyChanged) {
          if (selectedVendor?.contact_taxes && selectedVendor.contact_taxes.length > 0) {
            const sortedTaxes = [...selectedVendor.contact_taxes].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            const primaryTax = sortedTaxes[0];
            if (primaryTax) {
              setIncludeTax(true);
              setTaxRate(primaryTax.tax_rate);
              setTaxName(primaryTax.tax_name);
            }
          } else if (selectedVendor?.tax_rate != null) {
            setIncludeTax(true);
            setTaxRate(selectedVendor.tax_rate);
            setTaxName(selectedVendor.tax_name || 'Tax');
          }
        }

        if (!categoryManuallyChanged && selectedVendor?.default_expense_category_id) {
          setCategoryId(selectedVendor.default_expense_category_id);
        }
      } catch (error) {
        console.error('Failed to fetch vendor details:', error);
      }
    }
  }, [currencyManuallyChanged, taxManuallyChanged, categoryManuallyChanged, currencies]);

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
    setCurrencyManuallyChanged(true);
  }, []);

  const handleTaxToggle = useCallback((enabled: boolean) => {
    setIncludeTax(enabled);
    setTaxManuallyChanged(true);
    if (enabled && company) {
      setTaxRate(company.default_tax_rate || 0);
      setTaxName(company.default_tax_name || 'Tax');
    } else if (!enabled) {
      setTaxRate('');
      setTaxName('');
    }
  }, [company]);

  const handleTaxRateChange = useCallback((value: string) => {
    setTaxRate(value);
    setTaxManuallyChanged(true);
  }, []);

  const handleTaxNameChange = useCallback((value: string) => {
    setTaxName(value);
    setTaxManuallyChanged(true);
  }, []);

  const handleCategoryChange = useCallback((newCategoryId: string) => {
    setCategoryId(newCategoryId);
    setCategoryManuallyChanged(true);
  }, []);

  const calculateTaxAmount = useCallback(() => {
    if (!amount || !taxRate) return 0;
    const amountNum = parseFloat(amount);
    const taxRateNum = parseFloat(taxRate);

    if (taxIncluded) {
      return amountNum - (amountNum / (1 + taxRateNum / 100));
    } else {
      return (amountNum * taxRateNum) / 100;
    }
  }, [amount, taxRate, taxIncluded]);

  const calculateTotalWithTax = useCallback(() => {
    if (taxIncluded) {
      return parseFloat(amount || 0);
    }
    return parseFloat(amount || 0) + calculateTaxAmount();
  }, [amount, taxIncluded, calculateTaxAmount]);

  useEffect(() => {
    if (includeTax && taxRate && amount) {
      const calculatedTax = calculateTaxAmount();
      setTaxAmount(calculatedTax.toFixed(2));
    } else {
      setTaxAmount('');
    }
  }, [amount, taxRate, taxIncluded, includeTax, calculateTaxAmount]);

  const handleReceiptUpload = useCallback(async (receiptData: any) => {
    if (!expense?.id) {
      setPendingReceipt(receiptData);
      setReceipt({
        receipt_url: receiptData.file_data,
        attachment_filename: receiptData.file_name,
        attachment_size: receiptData.file_size,
        attachment_type: receiptData.file_type,
      });
      return;
    }

    try {
      const result = await (expensesAPI as any).uploadReceipt(expense.id, receiptData);
      setReceipt({
        receipt_url: result.receipt_url,
        attachment_filename: result.attachment_filename,
        attachment_size: result.attachment_size,
        attachment_type: result.attachment_type,
      });
      showSuccess('Receipt uploaded successfully');
    } catch (error) {
      console.error('Receipt upload failed:', error);
      throw error;
    }
  }, [expense?.id, showSuccess]);

  const handleReceiptDelete = useCallback(async () => {
    if (!expense?.id) {
      setPendingReceipt(null);
      setReceipt(null);
      return;
    }

    try {
      await (expensesAPI as any).deleteReceipt(expense.id);
      setReceipt(null);
      showSuccess('Receipt deleted');
    } catch (error) {
      console.error('Receipt delete failed:', error);
      throw error;
    }
  }, [expense?.id, showSuccess]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!expenseDate) {
      showError('Please select an expense date');
      return;
    }

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

      const expenseData: any = {
        expense_number: expenseNumber || undefined,
        amount: parseFloat(amount),
        currency_id: currency,
        expense_date: expenseDate,
        status: status,
        expense_category_id: categoryId || undefined,
        vendor_id: vendorId || undefined,
        contact_id: contactId || undefined,
        project_id: projectId || undefined,
        description: description || undefined,
        payment_method: paymentMethod || undefined,
        reference_number: reference || undefined,
        notes: notes || undefined,
        tax_rate: includeTax && taxRate ? parseFloat(taxRate) : 0,
        tax_amount: includeTax && taxAmount ? parseFloat(taxAmount) : 0,
        tax_name: includeTax && taxName ? taxName : null,
        tax_included: includeTax ? taxIncluded : false,
        pricing_type: isRecurring ? 'recurring' : undefined,
        recurring_type: isRecurring ? recurringType.toLowerCase() : undefined,
        custom_every: isRecurring && recurringType === 'custom' ? customEvery : undefined,
        custom_period: isRecurring && recurringType === 'custom' ? customPeriod.toLowerCase() : undefined,
        recurring_number: isRecurring ? recurringNumber : undefined,
        recurring_status: isRecurring && expense?.id ? recurringStatus : 'active',
        ...(pendingReceipt && !expense?.id && {
          receipt_file_name: pendingReceipt.file_name,
          receipt_file_size: pendingReceipt.file_size,
          receipt_file_type: pendingReceipt.file_type,
          receipt_file_data: pendingReceipt.file_data,
        }),
      };

      let result;
      if (expense?.id) {
        result = await updateExpense(expense.id, expenseData);
        showSuccess('Expense updated successfully');
      } else {
        result = await createExpense(expenseData);
        showSuccess('Expense created successfully');
      }

      if (onSuccess) {
        onSuccess(result);
      } else {
        navigate('/finance/expenses');
      }
    } catch (error: any) {
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

  const selectedCurrencySymbol = useMemo(() => {
    const curr = currencies.find((c: any) => c.currency.id === currency);
    return curr?.currency?.symbol || '$';
  }, [currency, currencies]);

  const formContent = (
    <div className="max-w-4xl mx-auto p-6">
      <div className="design-bg-primary rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b design-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold design-text-primary">
              {expense ? 'Edit Expense' : 'New Expense'}
            </h2>
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={saving} className="px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary disabled:opacity-50">
                <X className="h-4 w-4 inline mr-2" />
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : <Save className="h-4 w-4 inline mr-2" />}
                {saving ? 'Saving...' : expense ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpenseDate(e.target.value)}
                autoComplete="off"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 design-text-secondary">
                  {selectedCurrencySymbol}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  autoComplete="off"
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">
                Status
              </label>
              <Combobox
                options={statusOptions}
                value={status}
                onChange={setStatus}
                placeholder="Select status"
                allowClear={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Vendor</label>
              <Combobox
                options={vendorOptions}
                value={vendorId}
                onChange={handleVendorChange}
                placeholder="Select vendor"
                searchPlaceholder="Search vendors..."
                emptyMessage="No vendors found"
                onCreate={handleCreateVendor}
                createLabel="Add new vendor"
                creating={creatingVendor}
              />
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Currency</label>
              {currenciesLoading ? (
                <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md design-text-secondary">
                  Loading currencies...
                </div>
              ) : (
                <Combobox
                  options={currencyOptions}
                  value={currency}
                  onChange={handleCurrencyChange}
                  placeholder="Select currency"
                  searchPlaceholder="Search currencies..."
                  emptyMessage="No currencies found"
                  allowClear={false}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Category</label>
              <Combobox
                options={categoryOptions}
                value={categoryId}
                onChange={handleCategoryChange}
                placeholder="Select category"
                searchPlaceholder="Search categories..."
                emptyMessage="No categories found"
                onCreate={handleCreateCategory}
                createLabel="Create new category"
                creating={creatingCategory}
              />
            </div>

            <div>
              <label className="block text-sm font-medium design-text-primary mb-2">Tax</label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTax}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaxToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                  <span className="text-sm design-text-secondary">
                    {includeTax ? 'Add tax' : 'No tax'}
                  </span>
                </div>

                {includeTax && (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={taxName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaxNameChange(e.target.value)}
                        placeholder="Tax name"
                        autoComplete="off"
                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <div className="relative w-24">
                        <input
                          type="number"
                          value={taxRate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaxRateChange(e.target.value)}
                          placeholder="Rate"
                          step="0.01"
                          min="0"
                          max="100"
                          autoComplete="off"
                          className="w-full px-3 py-2 pr-7 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm design-text-secondary">%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="taxIncluded"
                        checked={taxIncluded}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxIncluded(e.target.checked)}
                        className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <label htmlFor="taxIncluded" className="text-sm design-text-secondary">
                        Tax is already included in amount
                      </label>
                    </div>
                  </>
                )}

                {includeTax && amount && taxRate && (
                  <div className="text-sm design-text-secondary p-2 design-bg-secondary rounded">
                    {taxIncluded ? (
                      <>
                        Net: {selectedCurrencySymbol}{formatAmount(parseFloat(amount) - parseFloat(taxAmount || 0))} &bull; Tax: {selectedCurrencySymbol}{formatAmount(taxAmount)} &bull; Gross: {selectedCurrencySymbol}{formatAmount(amount)}
                      </>
                    ) : (
                      <>
                        Net: {selectedCurrencySymbol}{formatAmount(amount)} &bull; Tax: {selectedCurrencySymbol}{formatAmount(taxAmount)} &bull; Total: {selectedCurrencySymbol}{formatAmount(calculateTotalWithTax())}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium design-text-primary mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              autoComplete="off"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <ReceiptUpload
            expenseId={expense?.id}
            receipt={receipt}
            onUpload={handleReceiptUpload}
            onDelete={handleReceiptDelete}
            disabled={saving}
          />

          <div className="border-t design-border pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium design-text-secondary hover:design-text-primary transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Advanced Options
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium design-text-primary mb-2">
                      Expense Number
                    </label>
                    <input
                      type="text"
                      value={expenseNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpenseNumber(e.target.value)}
                      autoComplete="off"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                </div>

                <div>
                  <label className="block text-sm font-medium design-text-primary mb-2">Project</label>
                  {loadingClientProjects ? (
                    <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md design-text-secondary flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading projects...
                    </div>
                  ) : (
                    <Combobox
                      options={projectOptions}
                      value={projectId}
                      onChange={setProjectId}
                      placeholder={contactId ? `Select ${selectedClientName}'s project` : "Select project (optional)"}
                      searchPlaceholder="Search projects..."
                      emptyMessage={contactId ? `No projects for ${selectedClientName}` : "No projects found"}
                      onCreate={handleCreateProject}
                      createLabel={contactId && selectedClientName ? `Add new project (${selectedClientName})` : "Add new project"}
                      creating={creatingProject}
                    />
                  )}
                  <p className="text-xs design-text-secondary mt-1">
                    {contactId ? `Showing projects for ${selectedClientName}` : 'Link this expense to a project for tracking'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium design-text-primary mb-2">Payment Method</label>
                    <Combobox
                      options={paymentMethodOptions}
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      placeholder="Select method"
                      searchPlaceholder="Search methods..."
                      emptyMessage="No methods found"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium design-text-primary mb-2">Reference Number</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
                      placeholder="Receipt/invoice number"
                      autoComplete="off"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium design-text-primary mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    placeholder="Additional notes"
                    rows={3}
                    autoComplete="off"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                <RecurringExpenseSettings
                  isRecurring={isRecurring}
                  recurringType={recurringType}
                  customEvery={customEvery}
                  customPeriod={customPeriod}
                  recurringNumber={recurringNumber}
                  recurringStatus={recurringStatus}
                  startDate={expenseDate}
                  isEditMode={!!expense?.id}
                  onChange={(updates: any) => {
                    if ('isRecurring' in updates) setIsRecurring(updates.isRecurring);
                    if ('recurringType' in updates) setRecurringType(updates.recurringType);
                    if ('customEvery' in updates) setCustomEvery(updates.customEvery);
                    if ('customPeriod' in updates) setCustomPeriod(updates.customPeriod);
                    if ('recurringNumber' in updates) setRecurringNumber(updates.recurringNumber);
                    if ('recurringStatus' in updates) setRecurringStatus(updates.recurringStatus);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isInModal) {
    return formContent;
  }

  return (
    <FinanceLayoutAny
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
    </FinanceLayoutAny>
  );
};

export default ExpenseForm;
