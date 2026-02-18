import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoices } from '../../../../contexts/InvoiceContext';
import { useContacts } from '../../../../hooks/crm/useContacts';
import { useNotification } from '../../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../../hooks/crm/useCompanyAttributes';
import { INVOICE_STATUS, RECURRING_TYPE } from '../../../../constants/finance';
import { calculateInvoiceTotal } from '../../../../utils/invoiceCalculations';
import { useCompanyCurrencies } from '../../../../hooks/crm/useCompanyCurrencies';
import companiesAPI from '../../../../services/api/crm/companies';
import contactsAPI from '../../../../services/api/crm/contacts';
import invoicesAPI from '../../../../services/api/finance/invoices';
import billableHoursAPI from '../../../../services/api/crm/billableHours';
import type { InvoiceItemResponse, NumberFormatResponse, CompanyResponse } from '../../../../types';
import type { CompanyCurrency } from '../../../../hooks/crm/useCompanyCurrencies';
import type { InvoiceStatus } from '../../../../constants/finance';
import type {
  InvoiceFormData,
  FormLineItem,
  FormItemTax,
  FormDocumentTax,
  ProjectAllocation,
  ContactTax,
  BillableHoursListResponse,
  BillableHourEntry,
} from './types';

export function useInvoiceFormState(invoiceProp: InvoiceFormData | null = null, onSuccess?: (result: InvoiceFormData) => void) {
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
      return numberFormats.find((f) => f.id === formatId) ?? null;
    }
    return null; // Will use default US format
  }, [getNumberFormat, numberFormats]);

  // Refs for dropdown positioning
  const clientButtonRef = React.useRef<HTMLButtonElement>(null);
  const currencyButtonRef = React.useRef<HTMLButtonElement>(null);

  // State
  const [invoice, setInvoice] = useState<InvoiceFormData | null>(invoiceProp ?? null);
  const [loading, setLoading] = useState(!!id && !invoiceProp);
  const [paymentTerms, setPaymentTerms] = useState<number | null>(null);

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
  const [items, setItems] = useState<FormLineItem[]>([]);

  // Totals
  const [documentTaxes, setDocumentTaxes] = useState<FormDocumentTax[]>([]); // Array of { tax_name, tax_rate }
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [depositType, setDepositType] = useState<string | null>(null);
  const [depositValue, setDepositValue] = useState<number>(0);

  // Notes
  const [notes, setNotes] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [companyDefaultPaymentInstructions, setCompanyDefaultPaymentInstructions] = useState('');

  // Recurring settings
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<string>(RECURRING_TYPE.MONTHLY);
  const [recurringEndDate, setRecurringEndDate] = useState<string | null>(null);
  const [recurringOccurrences, setRecurringOccurrences] = useState<number | null>(null);
  const [pricingType, setPricingType] = useState('fixed'); // 'fixed' | 'recurring'
  const [recurringStatus, setRecurringStatus] = useState('active'); // 'active' | 'paused' | 'cancelled'
  const [recurringNumber, setRecurringNumber] = useState(-1); // -1 = infinite
  const [customEvery, setCustomEvery] = useState(1); // API field for custom frequency
  const [customPeriod, setCustomPeriod] = useState('months'); // API field: 'days' | 'weeks' | 'months' | 'years'

  // Payment Options
  const [allowStripePayments, setAllowStripePayments] = useState(false);
  const [allowPaypalPayments, setAllowPaypalPayments] = useState(false);
  const [allowPartialPayments, setAllowPartialPayments] = useState(false);
  const [automaticPaymentEnabled, setAutomaticPaymentEnabled] = useState(false);
  const [automaticEmail, setAutomaticEmail] = useState(true);
  const [attachPdfToEmail, setAttachPdfToEmail] = useState(true);
  const [sendPaymentReceipt, setSendPaymentReceipt] = useState(true);
  const [receivePaymentNotifications, setReceivePaymentNotifications] = useState(true);

  // Reminder override settings
  const [overrideReminderSettings, setOverrideReminderSettings] = useState(false);
  const [invoiceRemindersEnabled, setInvoiceRemindersEnabled] = useState<boolean | null>(null);
  const [invoiceReminderFrequencyDays, setInvoiceReminderFrequencyDays] = useState<number | null>(null);
  const [maxInvoiceReminders, setMaxInvoiceReminders] = useState<number | null>(null);
  const [remindersStopped, setRemindersStopped] = useState(false);
  // Read-only reminder status (from loaded invoice)
  const [reminderCount, setReminderCount] = useState(0);
  const [lastReminderSentAt, setLastReminderSentAt] = useState<string | null>(null);
  const [nextReminderDueAt, setNextReminderDueAt] = useState<string | null>(null);

  // Change tracking
  const [changeReason, setChangeReason] = useState('');

  // Modals
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLineItemTaxModal, setShowLineItemTaxModal] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState<number | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<InvoiceFormData | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Unbilled hours
  const [hasCheckedUnbilledHours, setHasCheckedUnbilledHours] = useState(false);
  const [showUnbilledHoursModal, setShowUnbilledHoursModal] = useState(false);
  const [unbilledHoursData, setUnbilledHoursData] = useState<BillableHoursListResponse | null>(null);
  const [checkingUnbilledHours, setCheckingUnbilledHours] = useState(false);
  const [pendingBillableHourIds, setPendingBillableHourIds] = useState<string[]>([]);
  const [pendingProjectAllocations, setPendingProjectAllocations] = useState<ProjectAllocation[]>([]); // Array of { project_id, percentage }
  const [showMarkBilledModal, setShowMarkBilledModal] = useState(false);
  const [markingAsBilled, setMarkingAsBilled] = useState(false);
  const [pendingInvoiceResult, setPendingInvoiceResult] = useState<InvoiceFormData | null>(null);
  const [pendingOpenSendDialog, setPendingOpenSendDialog] = useState(false);

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
          const data = await invoicesAPI.get(id) as InvoiceFormData;
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

  // Reset payment options to defaults when creating a new invoice (no invoice loaded).
  // This prevents stale state from a previously-edited invoice persisting if the
  // component is reused without remounting (e.g. Radix Dialog keeping children mounted).
  useEffect(() => {
    if (!invoiceProp && !id) {
      setAllowStripePayments(false);
      setAllowPaypalPayments(false);
      setAllowPartialPayments(false);
      setAutomaticPaymentEnabled(false);
      setAutomaticEmail(true);
      setAttachPdfToEmail(true);
      setSendPaymentReceipt(true);
      setReceivePaymentNotifications(true);
    }
  }, [invoiceProp, id]);

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
      const rawItems = invoice.invoice_items || [];
      const normalizedItems: FormLineItem[] = rawItems.map((item: InvoiceItemResponse) => ({
        id: item.id,
        description: item.description || item.name || '',
        name: item.name,
        subtext: item.subtext,
        quantity: parseFloat(item.quantity || '0'),
        price: parseFloat(item.price || '0'),
        amount: parseFloat(item.amount || '0'),
        tax_rate: parseFloat(item.tax_rate || '0'),
        tax_amount: parseFloat(item.tax_amount || '0'),
        taxes: item.taxes?.map(t => ({
          ...t,
          tax_rate: parseFloat(String(t.tax_rate)),
          tax_amount: parseFloat(String(t.tax_amount)),
        })),
        _contact_service_id: (item as Record<string, unknown>).contact_service_id as string | undefined,
      }));
      setItems(normalizedItems);

      // Auto-resize textareas after a short delay to let DOM update
      setTimeout(() => {
        const textareas = document.querySelectorAll('.auto-grow-textarea');
        textareas.forEach((textarea) => {
          const el = textarea as HTMLTextAreaElement;
          el.style.height = 'auto';
          el.style.height = el.scrollHeight + 'px';
        });
      }, 50);

      // Document-level taxes (applied after discount)
      setDocumentTaxes((invoice.document_taxes || []).map(t => ({
        tax_name: t.tax_name,
        tax_rate: parseFloat(String(t.tax_rate)),
        id: t.id,
      })));
      setDiscountType(invoice.discount_type || 'percentage');
      setDiscountValue(parseFloat(invoice.discount_value || invoice.discount_percentage || '0'));

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

      // Recurring settings
      setIsRecurring(invoice.is_recurring || invoice.pricing_type === 'recurring' || false);
      setRecurringType(invoice.recurring_type || RECURRING_TYPE.MONTHLY);
      setRecurringEndDate(invoice.recurring_end_date || null);
      setRecurringOccurrences(invoice.recurring_occurrences || invoice.recurring_number || null);
      setPricingType(invoice.pricing_type || (invoice.is_recurring ? 'recurring' : 'fixed'));
      setRecurringStatus(invoice.recurring_status || 'active');
      setRecurringNumber(invoice.recurring_number !== undefined && invoice.recurring_number !== null ? invoice.recurring_number : -1);
      setCustomEvery(invoice.custom_every || 1);
      setCustomPeriod(invoice.custom_period || 'months');

      // Payment Options
      setAllowStripePayments(invoice.allow_stripe_payments || false);
      setAllowPaypalPayments(invoice.allow_paypal_payments || false);
      setAllowPartialPayments(invoice.allow_partial_payments || false);
      setAutomaticPaymentEnabled(invoice.automatic_payment_enabled || false);
      setAutomaticEmail(invoice.automatic_email !== undefined ? invoice.automatic_email : true);
      setAttachPdfToEmail(invoice.attach_pdf_to_email !== undefined ? invoice.attach_pdf_to_email : true);
      setSendPaymentReceipt(invoice.send_payment_receipt !== undefined ? invoice.send_payment_receipt : true);
      setReceivePaymentNotifications(invoice.receive_payment_notifications !== undefined ? invoice.receive_payment_notifications : true);

      // Reminder override settings
      const hasOverrides = invoice.invoice_reminders_enabled !== null ||
        invoice.invoice_reminder_frequency_days !== null ||
        invoice.max_invoice_reminders !== null;
      setOverrideReminderSettings(hasOverrides);
      setInvoiceRemindersEnabled(invoice.invoice_reminders_enabled ?? null);
      setInvoiceReminderFrequencyDays(invoice.invoice_reminder_frequency_days ?? null);
      setMaxInvoiceReminders(invoice.max_invoice_reminders ?? null);
      setRemindersStopped(invoice.reminders_stopped || false);
      // Read-only status
      setReminderCount(invoice.reminder_count || 0);
      setLastReminderSentAt(invoice.last_reminder_sent_at || null);
      setNextReminderDueAt(invoice.next_reminder_due_at || null);
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
      const selectedContact = allContacts.find((c) => c.id === contactId);
      if (selectedContact) {
        // Check all possible currency field names on the contact
        const contactCurrencyId: string | undefined =
          selectedContact.preferred_currency_id ||
          selectedContact.currency_id ||
          selectedContact.currency?.id;

        if (contactCurrencyId) {
          // Verify this currency is available in the company currencies
          const currencyExists = currencies.some((cc: CompanyCurrency) => cc.currency.id === contactCurrencyId);
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
        const data = await companiesAPI.getCurrent<CompanyResponse>();
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
  const totals = calculateInvoiceTotal(items, documentTaxes, discountType, discountValue);
  const getCurrencyCode = () => {
    if (!currency || !currencies.length) return 'USD';
    const currencyAssoc = currencies.find((cc: CompanyCurrency) => cc.currency.id === currency);
    return currencyAssoc?.currency?.code || 'USD';
  };
  const currencyCode = getCurrencyCode();

  // Line item handlers
  const addLineItem = () => {
    setItems([...items, { description: '', subtext: '', quantity: 1, price: 0, amount: 0, taxes: [], tax_amount: 0 }]);
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-calculate amount
    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(String(newItems[index].quantity)) || 0;
      const price = parseFloat(String(newItems[index].price)) || 0;
      newItems[index].amount = qty * price;

      // Recalculate tax amounts if taxes exist
      if (newItems[index].taxes && newItems[index].taxes.length > 0) {
        const itemAmount = qty * price;
        newItems[index].taxes = newItems[index].taxes.map((tax: FormItemTax, i: number) => ({
          ...tax,
          tax_amount: Math.round((itemAmount * tax.tax_rate / 100) * 100) / 100,
          display_order: i
        }));
        newItems[index].tax_amount = newItems[index].taxes.reduce((sum: number, t: FormItemTax) => sum + t.tax_amount, 0);
      }
    }

    setItems(newItems);
  };

  const removeLineItem = (index: number) => {
    // Simply remove from array - backend uses replace-all strategy
    setItems(items.filter((_: FormLineItem, i: number) => i !== index));
  };

  // Line item tax handlers
  const openLineItemTaxModal = (index: number) => {
    setEditingLineItemIndex(index);
    setShowLineItemTaxModal(true);
  };

  const handleLineItemTaxSave = (taxes: FormItemTax[]) => {
    if (editingLineItemIndex === null) return;

    const newItems = [...items];
    const item = newItems[editingLineItemIndex];

    newItems[editingLineItemIndex] = {
      ...item,
      taxes: taxes,
      tax_amount: taxes.reduce((sum: number, t: FormItemTax) => sum + t.tax_amount, 0)
    };

    setItems(newItems);
    setShowLineItemTaxModal(false);
    setEditingLineItemIndex(null);
  };

  // Calculate item total (amount + item taxes)
  const calculateItemTotal = (item: FormLineItem) => {
    const amount = parseFloat(String(item.amount || 0));
    const taxAmount = item.taxes?.reduce((sum: number, t: FormItemTax) => sum + (t.tax_amount || 0), 0) || 0;
    return amount + taxAmount;
  };

  // Client selection handler - sets currency, taxes, notes and checks for unbilled hours on first selection (new invoices only)
  const handleClientSelect = async (clientId: string) => {
    setContactId(clientId);
    setShowClientModal(false);

    // Only process for NEW invoices
    if (!invoice && clientId) {
      // Fetch full contact details to get currency, taxes, and invoice notes (list endpoint may not include them)
      try {
        const fullContact = await contactsAPI.get(clientId);

        // Apply contact currency
        const contactCurrencyId: string | undefined =
          fullContact.preferred_currency_id ||
          fullContact.currency_id ||
          fullContact.currency?.id;

        if (contactCurrencyId && currencies.length > 0) {
          const currencyExists = currencies.some((cc: CompanyCurrency) => cc.currency.id === contactCurrencyId);
          if (currencyExists) {
            setCurrency(contactCurrencyId);
          }
        }
        // If contact has no currency, company default is already set

        // Apply contact taxes to document taxes
        if (fullContact.contact_taxes && fullContact.contact_taxes.length > 0) {
          const contactTaxes = fullContact.contact_taxes
            .sort((a: ContactTax, b: ContactTax) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((tax: ContactTax) => ({
              tax_name: tax.tax_name,
              tax_rate: parseFloat(String(tax.tax_rate)) || 0
            }));
          setDocumentTaxes(contactTaxes);
        }

        // Apply contact invoice notes to notes field
        if (fullContact.invoice_notes) {
          setNotes(fullContact.invoice_notes);
        }
      } catch (error) {
        console.error('Failed to fetch contact details:', error);
      }

      // Check for unbilled hours only on first selection
      if (!hasCheckedUnbilledHours) {
        setHasCheckedUnbilledHours(true);

        try {
          setCheckingUnbilledHours(true);
          const response = await billableHoursAPI.getByContact(clientId, {
            uninvoiced_only: true,
            is_billable: true,
          }) as BillableHoursListResponse;

          if (response && response.items && response.items.length > 0) {
            setUnbilledHoursData(response);
            setShowUnbilledHoursModal(true);
          }
        } catch (error) {
          // Silently fail if API doesn't exist or errors - not critical
          console.error('Failed to check unbilled hours:', error);
        } finally {
          setCheckingUnbilledHours(false);
        }
      }
    }
  };

  // Handler for adding unbilled hours as line items
  const handleAddUnbilledHours = (lineItems: FormLineItem[]) => {
    // Extract billable hour IDs from line items for later marking as billed
    const allBillableHourIds = lineItems.flatMap((item: FormLineItem) => item._billable_hour_ids || []);
    setPendingBillableHourIds(allBillableHourIds);

    // Aggregate hours per project (multiple service groups may share the same project)
    const projectHoursMap: Record<string, number> = {};
    let totalHours = 0;
    lineItems.forEach((item: FormLineItem) => {
      if (item._project_id) {
        projectHoursMap[item._project_id] = (projectHoursMap[item._project_id] || 0) + (item.quantity || 0);
      }
      totalHours += item.quantity || 0;
    });

    const projectAllocations: ProjectAllocation[] = Object.entries(projectHoursMap).map(
      ([projectId, hours]) => ({
        project_id: projectId,
        percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
      })
    );

    // Ensure percentages sum to 100 (adjust the largest allocation for rounding errors)
    const totalPercentage = projectAllocations.reduce((sum: number, a: ProjectAllocation) => sum + a.percentage, 0);
    if (projectAllocations.length > 0 && totalPercentage !== 100) {
      const diff = 100 - totalPercentage;
      const largestIdx = projectAllocations.reduce((maxIdx: number, curr: ProjectAllocation, idx: number, arr: ProjectAllocation[]) =>
        curr.percentage > arr[maxIdx].percentage ? idx : maxIdx, 0);
      projectAllocations[largestIdx].percentage += diff;
    }
    setPendingProjectAllocations(projectAllocations);

    // Set invoice currency to match unbilled hours currency
    const hoursCurrencyId = unbilledHoursData?.items?.[0]?.currency_id;
    if (hoursCurrencyId) {
      setCurrency(hoursCurrencyId);
    }

    // Add the new line items to existing items (strip internal tracking fields, keep _contact_service_id)
    const cleanedItems = lineItems.map((item: FormLineItem) => {
      const cleanItem = { ...item };
      delete cleanItem._billable_hour_ids;
      delete cleanItem._project_id;
      return cleanItem;
    });
    setItems((prevItems: FormLineItem[]) => [...prevItems, ...cleanedItems]);
    setShowUnbilledHoursModal(false);
    setUnbilledHoursData(null);
  };

  // Continue after mark as billed modal (either confirmed or declined)
  const continueAfterMarkBilled = () => {
    const result = pendingInvoiceResult;
    const openSendDialog = pendingOpenSendDialog;

    // Clear the pending state
    setPendingInvoiceResult(null);
    setPendingOpenSendDialog(false);
    setPendingBillableHourIds([]);
    setPendingProjectAllocations([]);
    setSaving(false);

    // Continue with normal flow
    if (openSendDialog) {
      setSavedInvoice(result!);
      setShowSendDialog(true);
    } else {
      if (onSuccess && result) {
        onSuccess(result);
      } else {
        navigate('/finance/invoices');
      }
    }
  };

  // Handler for marking hours as billed
  const handleMarkHoursAsBilled = async () => {
    if (!pendingInvoiceResult?.id || !pendingBillableHourIds.length) {
      continueAfterMarkBilled();
      return;
    }

    try {
      setMarkingAsBilled(true);

      // Mark billable hours as billed
      await billableHoursAPI.bulkUpdateByContact(
        contactId,
        pendingBillableHourIds,
        pendingInvoiceResult.id
      );

      // Note: Project allocations are already saved during invoice creation
      // so we don't need to save them again here

      showSuccess('Hours marked as billed');
    } catch (error) {
      console.error('Failed to mark hours as billed:', error);
      showError('Failed to mark hours as billed, but invoice was saved');
    } finally {
      setMarkingAsBilled(false);
      setShowMarkBilledModal(false);
      continueAfterMarkBilled();
    }
  };

  // Handler for declining to mark hours as billed
  const handleDeclineMarkBilled = () => {
    setShowMarkBilledModal(false);
    continueAfterMarkBilled();
  };

  // Save handler
  const handleSendSuccess = () => {
    const currentSavedInvoice = savedInvoice;
    setShowSendDialog(false);
    setSavedInvoice(null);
    if (onSuccess && currentSavedInvoice) {
      onSuccess(currentSavedInvoice);
    } else {
      navigate('/finance/invoices');
    }
  };

  const handleSave = async (saveStatus: InvoiceStatus = INVOICE_STATUS.DRAFT, openSendDialog = false) => {
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
        invoice_items: items.map((item: FormLineItem) => ({
          ...(item.id && { id: item.id }), // Include id for existing items to update them
          name: item.description || item.name,
          description: item.description || item.name,
          subtext: item.subtext || null,
          quantity: Number(item.quantity),
          price: Number(item.price),
          amount: Number(item.amount),
          tax_rate: Number(item.tax_rate || 0), // Always send 0 instead of null
          taxes: item.taxes || [], // Include item-level taxes
          contact_service_id: item._contact_service_id || null,
        })),
        // Always send document_taxes array (empty if none)
        document_taxes: documentTaxes || [],
        // Discount - always send numeric fields with 0 default instead of null
        discount_type: discountValue > 0 ? discountType : null,
        discount_percentage: discountType === 'percentage' && discountValue > 0 ? discountValue : 0,
        discount_value: discountType === 'fixed' && discountValue > 0 ? discountValue : null,
        // Deposit - always send numeric fields with 0 default instead of null
        deposit_type: depositValue > 0 ? depositType : null,
        deposit_percentage: depositType === 'percentage' && depositValue > 0 ? depositValue : 0,
        deposit_value: depositType === 'fixed' && depositValue > 0 ? depositValue : null,
        notes: notes || null,
        payment_instructions: paymentInstructions || companyDefaultPaymentInstructions || null,
        // Recurring settings
        is_recurring: isRecurring,
        pricing_type: pricingType,
        recurring_type: isRecurring ? recurringType : undefined,
        recurring_status: pricingType === 'recurring' ? recurringStatus : undefined,
        recurring_number: pricingType === 'recurring' ? recurringNumber : undefined,
        recurring_end_date: isRecurring && recurringEndDate ? recurringEndDate : undefined,
        recurring_occurrences: isRecurring && recurringOccurrences ? recurringOccurrences : undefined,
        custom_every: pricingType === 'recurring' && recurringType === RECURRING_TYPE.CUSTOM ? customEvery : undefined,
        custom_period: pricingType === 'recurring' && recurringType === RECURRING_TYPE.CUSTOM ? customPeriod : undefined,
        // Boolean fields - always send true/false instead of null
        allow_stripe_payments: Boolean(allowStripePayments),
        allow_paypal_payments: Boolean(allowPaypalPayments),
        allow_partial_payments: Boolean(allowPartialPayments),
        automatic_payment_enabled: Boolean(automaticPaymentEnabled),
        automatic_email: automaticEmail !== false, // Default true
        attach_pdf_to_email: attachPdfToEmail !== false, // Default true
        send_payment_receipt: sendPaymentReceipt !== false, // Default true
        receive_payment_notifications: receivePaymentNotifications !== false, // Default true
        // Reminder override settings - only include if overriding
        invoice_reminders_enabled: overrideReminderSettings ? invoiceRemindersEnabled : null,
        invoice_reminder_frequency_days: overrideReminderSettings ? invoiceReminderFrequencyDays : null,
        max_invoice_reminders: overrideReminderSettings ? maxInvoiceReminders : null,
        reminders_stopped: remindersStopped,
      };

      let result: InvoiceFormData | null = null;
      if (invoice?.id) {
        result = await updateInvoice(invoice.id, invoiceData, changeReason) as InvoiceFormData;
        showSuccess('Invoice updated successfully');
        // Clear change reason after successful update
        setChangeReason('');
      } else {
        result = await createInvoice(invoiceData) as InvoiceFormData;
        showSuccess('Invoice created successfully');
        // Switch to edit mode so subsequent saves update instead of create
        setInvoice(result);
      }

      // Save project allocations immediately after invoice creation (links invoice to project)
      // This ensures the invoice is linked even if user declines marking hours as billed
      if (pendingProjectAllocations.length > 0 && result?.id) {
        try {
          await invoicesAPI.updateAllocations(result.id, pendingProjectAllocations);
        } catch (allocError) {
          console.error('Failed to link invoice to project:', allocError);
          // Don't fail the whole operation for allocation errors
        }
      }

      // Check if we have pending billable hours to mark as billed
      if (pendingBillableHourIds.length > 0 && result?.id) {
        // Store the result and dialog flag for after marking hours
        setPendingInvoiceResult(result!);
        setPendingOpenSendDialog(openSendDialog);
        setShowMarkBilledModal(true);
        // Don't continue - the modal handlers will take over
        return;
      }

      // Only open send dialog if explicitly requested (via Save & Send button)
      if (openSendDialog) {
        setSavedInvoice(result!);
        setShowSendDialog(true);
      } else {
        if (onSuccess && result) {
          onSuccess(result);
        } else {
          navigate('/finance/invoices');
        }
      }
    } catch (error: unknown) {
      console.error('Error saving invoice:', error);
      showError((error as Error).message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return {
    // Navigation
    navigate,

    // Refs
    clientButtonRef,
    currencyButtonRef,

    // Loading states
    loading,
    saving,
    contactsLoading,
    currenciesLoading,
    checkingUnbilledHours,
    markingAsBilled,

    // Core data
    invoice,
    isEditing,
    allContacts,
    currencies,
    defaultCurrencyAssoc,
    numberFormat,
    totals,
    currencyCode,
    id,

    // Form fields
    contactId,
    invoiceNumber,
    setInvoiceNumber,
    invoiceDate,
    setInvoiceDate,
    dueDate,
    setDueDate,
    currency,
    setCurrency,

    // Line items
    items,
    addLineItem,
    updateLineItem,
    removeLineItem,
    openLineItemTaxModal,
    calculateItemTotal,

    // Taxes / Discounts / Deposits
    documentTaxes,
    setDocumentTaxes,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    depositType,
    setDepositType,
    depositValue,
    setDepositValue,

    // Notes
    notes,
    setNotes,
    paymentInstructions,
    setPaymentInstructions,
    companyDefaultPaymentInstructions,

    // Change tracking
    changeReason,
    setChangeReason,

    // Recurring settings
    isRecurring,
    setIsRecurring,
    recurringType,
    setRecurringType,
    recurringEndDate,
    setRecurringEndDate,
    recurringOccurrences,
    setRecurringOccurrences,
    pricingType,
    setPricingType,
    recurringStatus,
    setRecurringStatus,
    recurringNumber,
    setRecurringNumber,
    customEvery,
    setCustomEvery,
    customPeriod,
    setCustomPeriod,

    // Payment options
    allowStripePayments,
    setAllowStripePayments,
    allowPaypalPayments,
    setAllowPaypalPayments,
    allowPartialPayments,
    setAllowPartialPayments,
    automaticPaymentEnabled,
    setAutomaticPaymentEnabled,
    automaticEmail,
    setAutomaticEmail,
    attachPdfToEmail,
    setAttachPdfToEmail,
    sendPaymentReceipt,
    setSendPaymentReceipt,
    receivePaymentNotifications,
    setReceivePaymentNotifications,

    // Reminder settings
    overrideReminderSettings,
    setOverrideReminderSettings,
    invoiceRemindersEnabled,
    setInvoiceRemindersEnabled,
    invoiceReminderFrequencyDays,
    setInvoiceReminderFrequencyDays,
    maxInvoiceReminders,
    setMaxInvoiceReminders,
    remindersStopped,
    setRemindersStopped,
    reminderCount,
    lastReminderSentAt,
    nextReminderDueAt,

    // Modals
    showTaxModal,
    setShowTaxModal,
    showDiscountModal,
    setShowDiscountModal,
    showLineItemTaxModal,
    setShowLineItemTaxModal,
    editingLineItemIndex,
    setEditingLineItemIndex,
    showDepositModal,
    setShowDepositModal,
    showSendDialog,
    setShowSendDialog,
    savedInvoice,
    showClientModal,
    setShowClientModal,
    showCurrencyModal,
    setShowCurrencyModal,
    showSettingsModal,
    setShowSettingsModal,

    // Unbilled hours
    showUnbilledHoursModal,
    setShowUnbilledHoursModal,
    unbilledHoursData,
    setUnbilledHoursData,
    pendingBillableHourIds,
    showMarkBilledModal,

    // Handlers
    getSaveButtonText,
    handleClientSelect,
    handleAddUnbilledHours,
    handleLineItemTaxSave,
    handleMarkHoursAsBilled,
    handleDeclineMarkBilled,
    handleSendSuccess,
    handleSave,
  };
}
