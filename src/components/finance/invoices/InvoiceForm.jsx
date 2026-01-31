import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Loader2, ArrowLeft, ChevronDown, Settings } from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { INVOICE_STATUS, RECURRING_TYPE } from '../../../constants/finance';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import companiesAPI from '../../../services/api/crm/companies';
import contactsAPI from '../../../services/api/crm/contacts';
import invoicesAPI from '../../../services/api/finance/invoices';
import TaxModal from './TaxModal';
import DiscountModal from './DiscountModal';
import DepositModal from './DepositModal';
import { DocumentLineItems, DocumentTotals, LineItemTaxModal } from '../shared';
import ClientSelectModal from './ClientSelectModal';
import CurrencySelectModal from './CurrencySelectModal';
import SendInvoiceDialog from './SendInvoiceDialog';
import InvoiceSettingsModal from './InvoiceSettingsModal';
import UnbilledHoursModal from './UnbilledHoursModal';
import MarkHoursBilledModal from './MarkHoursBilledModal';
import FinanceLayout from '../layout/FinanceLayout';
import billableHoursAPI from '../../../services/api/crm/billableHours';
import projectsAPI from '../../../services/api/crm/projects';

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
  const [documentTaxes, setDocumentTaxes] = useState([]); // Array of { tax_name, tax_rate }
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [depositType, setDepositType] = useState(null);
  const [depositValue, setDepositValue] = useState(0);

  // Notes
  const [notes, setNotes] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [companyDefaultPaymentInstructions, setCompanyDefaultPaymentInstructions] = useState('');

  // Recurring settings
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState(RECURRING_TYPE.MONTHLY);
  const [recurringEndDate, setRecurringEndDate] = useState(null);
  const [recurringOccurrences, setRecurringOccurrences] = useState(null);
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

  // Unbilled hours
  const [hasCheckedUnbilledHours, setHasCheckedUnbilledHours] = useState(false);
  const [showUnbilledHoursModal, setShowUnbilledHoursModal] = useState(false);
  const [unbilledHoursData, setUnbilledHoursData] = useState(null);
  const [checkingUnbilledHours, setCheckingUnbilledHours] = useState(false);
  const [pendingBillableHourIds, setPendingBillableHourIds] = useState([]);
  const [pendingProjectAllocations, setPendingProjectAllocations] = useState([]); // Array of { project_id, percentage }
  const [showMarkBilledModal, setShowMarkBilledModal] = useState(false);
  const [markingAsBilled, setMarkingAsBilled] = useState(false);
  const [pendingInvoiceResult, setPendingInvoiceResult] = useState(null);
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

      // Document-level taxes (applied after discount)
      setDocumentTaxes(invoice.document_taxes || []);
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

      // Recurring settings
      setIsRecurring(invoice.is_recurring || invoice.pricing_type === 'recurring' || false);
      setRecurringType(invoice.recurring_type || RECURRING_TYPE.MONTHLY);
      setRecurringEndDate(invoice.recurring_end_date || null);
      setRecurringOccurrences(invoice.recurring_occurrences || invoice.recurring_number || null);
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
      setAttachPdfToEmail(invoice.attach_pdf_to_email !== undefined ? invoice.attach_pdf_to_email : true);
      setSendPaymentReceipt(invoice.send_payment_receipt !== undefined ? invoice.send_payment_receipt : true);
      setReceivePaymentNotifications(invoice.receive_payment_notifications !== undefined ? invoice.receive_payment_notifications : true);
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
  const totals = calculateInvoiceTotal(items, documentTaxes, discountType, discountValue);
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

  // Client selection handler - sets currency, taxes, notes and checks for unbilled hours on first selection (new invoices only)
  const handleClientSelect = async (clientId) => {
    setContactId(clientId);
    setShowClientModal(false);

    // Only process for NEW invoices
    if (!invoice && clientId) {
      // Fetch full contact details to get currency, taxes, and invoice notes (list endpoint may not include them)
      try {
        const fullContact = await contactsAPI.get(clientId);

        // Apply contact currency
        const contactCurrencyId =
          fullContact.preferred_currency_id ||
          fullContact.currency_id ||
          fullContact.default_currency_id ||
          fullContact.currency?.id;

        if (contactCurrencyId && currencies.length > 0) {
          const currencyExists = currencies.some(cc => cc.currency.id === contactCurrencyId);
          if (currencyExists) {
            setCurrency(contactCurrencyId);
          }
        }
        // If contact has no currency, company default is already set

        // Apply contact taxes to document taxes
        if (fullContact.contact_taxes && fullContact.contact_taxes.length > 0) {
          const contactTaxes = fullContact.contact_taxes
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map(tax => ({
              tax_name: tax.tax_name,
              tax_rate: parseFloat(tax.tax_rate) || 0
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
          });

          if (response && response.items && response.items.length > 0) {
            // Get unique project IDs from the billable hours
            const projectIds = [...new Set(
              response.items
                .map(item => item.project_id)
                .filter(Boolean)
            )];

            // Fetch project names for all unique project IDs
            const projectNames = {};
            if (projectIds.length > 0) {
              const projectPromises = projectIds.map(async (projectId) => {
                try {
                  const project = await projectsAPI.get(projectId);
                  return { id: projectId, name: project.name };
                } catch (err) {
                  console.warn(`Failed to fetch project ${projectId}:`, err);
                  return { id: projectId, name: null };
                }
              });
              const projects = await Promise.all(projectPromises);
              projects.forEach(p => {
                if (p.name) projectNames[p.id] = p.name;
              });
            }

            // Enrich items with project names
            const enrichedItems = response.items.map(item => ({
              ...item,
              project: item.project_id ? { name: projectNames[item.project_id] || 'Unnamed Project' } : null,
            }));

            setUnbilledHoursData({ ...response, items: enrichedItems });
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
  const handleAddUnbilledHours = (lineItems) => {
    // Extract billable hour IDs from line items for later marking as billed
    const allBillableHourIds = lineItems.flatMap((item) => item._billable_hour_ids || []);
    setPendingBillableHourIds(allBillableHourIds);

    // Calculate project allocations based on hours proportion
    const totalHours = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const projectAllocations = lineItems
      .filter((item) => item._project_id != null)
      .map((item) => ({
        project_id: item._project_id,
        percentage: totalHours > 0 ? Math.round((item.quantity / totalHours) * 100) : 0,
      }));

    // Ensure percentages sum to 100 (adjust the largest allocation for rounding errors)
    const totalPercentage = projectAllocations.reduce((sum, a) => sum + a.percentage, 0);
    if (projectAllocations.length > 0 && totalPercentage !== 100) {
      const diff = 100 - totalPercentage;
      const largestIdx = projectAllocations.reduce((maxIdx, curr, idx, arr) =>
        curr.percentage > arr[maxIdx].percentage ? idx : maxIdx, 0);
      projectAllocations[largestIdx].percentage += diff;
    }
    setPendingProjectAllocations(projectAllocations);

    // Set invoice currency to match unbilled hours currency
    const hoursCurrencyId = unbilledHoursData?.items?.[0]?.currency_id;
    if (hoursCurrencyId) {
      setCurrency(hoursCurrencyId);
    }

    // Add the new line items to existing items (strip internal tracking fields)
    const cleanedItems = lineItems.map((item) => {
      const cleanItem = { ...item };
      delete cleanItem._billable_hour_ids;
      delete cleanItem._project_id;
      return cleanItem;
    });
    setItems((prevItems) => [...prevItems, ...cleanedItems]);
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
      setSavedInvoice(result);
      setShowSendDialog(true);
    } else {
      if (onSuccess) {
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

      // Link invoice to project(s)
      if (pendingProjectAllocations.length > 0) {
        try {
          await invoicesAPI.updateAllocations(pendingInvoiceResult.id, pendingProjectAllocations);
        } catch (allocError) {
          console.error('Failed to link invoice to project:', allocError);
          // Don't fail the whole operation for allocation errors
        }
      }

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
          tax_rate: parseFloat(item.tax_rate || 0), // Always send 0 instead of null
          taxes: item.taxes || [], // Include item-level taxes
        })),
        // Always send document_taxes array (empty if none)
        document_taxes: documentTaxes || [],
        // Discount - always send numeric fields with 0 default instead of null
        discount_type: discountValue > 0 ? discountType : null,
        discount_percentage: discountType === 'percentage' && discountValue > 0 ? parseFloat(discountValue) : 0,
        discount_value: discountType === 'fixed' && discountValue > 0 ? parseFloat(discountValue) : null,
        // Deposit - always send numeric fields with 0 default instead of null
        deposit_type: depositValue > 0 ? depositType : null,
        deposit_percentage: depositType === 'percentage' && depositValue > 0 ? parseFloat(depositValue) : 0,
        deposit_value: depositType === 'fixed' && depositValue > 0 ? parseFloat(depositValue) : null,
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
        // Switch to edit mode so subsequent saves update instead of create
        setInvoice(result);
      }

      // Check if we have pending billable hours to mark as billed
      if (pendingBillableHourIds.length > 0 && result?.id) {
        // Store the result and dialog flag for after marking hours
        setPendingInvoiceResult(result);
        setPendingOpenSendDialog(openSendDialog);
        setShowMarkBilledModal(true);
        // Don't continue - the modal handlers will take over
        return;
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
                    const firstName = client.first_name?.trim() || '';
                    const lastName = client.last_name?.trim() || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    if (fullName && client.business_name) {
                      return `${fullName} (${client.business_name})`;
                    }
                    return fullName || client.business_name || 'Unnamed Client';
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
              onSelect={handleClientSelect}
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

      {/* Line Items */}
      <DocumentLineItems
        items={items}
        currencyCode={currencyCode}
        numberFormat={numberFormat}
        onAddItem={addLineItem}
        onUpdateItem={updateLineItem}
        onRemoveItem={removeLineItem}
        onOpenTaxModal={openLineItemTaxModal}
        calculateItemTotal={calculateItemTotal}
      />

      {/* Totals Section */}
      <DocumentTotals
        totals={totals}
        currencyCode={currencyCode}
        numberFormat={numberFormat}
        documentTaxes={documentTaxes}
        onEditTax={() => setShowTaxModal(true)}
        onRemoveTax={() => setDocumentTaxes([])}
        discountType={discountType}
        discountValue={discountValue}
        onEditDiscount={() => setShowDiscountModal(true)}
        onRemoveDiscount={() => setDiscountValue(0)}
        depositType={depositType}
        depositValue={depositValue}
        onEditDeposit={() => setShowDepositModal(true)}
        onRemoveDeposit={() => { setDepositValue(0); setDepositType(null); }}
      />

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
        onSave={(taxes) => setDocumentTaxes(taxes)}
        initialDocumentTaxes={documentTaxes}
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
          // Auto-enable partial payments when deposit is requested
          if (value > 0) {
            setAllowPartialPayments(true);
          }
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
        customEvery={customEvery}
        customPeriod={customPeriod}
        recurringEndDate={recurringEndDate}
        recurringOccurrences={recurringOccurrences}
        recurringStatus={recurringStatus}
        startDate={invoiceDate}
        pricingType={pricingType}
        recurringNumber={recurringNumber}
        allowStripePayments={allowStripePayments}
        allowPaypalPayments={allowPaypalPayments}
        allowPartialPayments={allowPartialPayments}
        automaticPaymentEnabled={automaticPaymentEnabled}
        automaticEmail={automaticEmail}
        attachPdfToEmail={attachPdfToEmail}
        sendPaymentReceipt={sendPaymentReceipt}
        receivePaymentNotifications={receivePaymentNotifications}
        invoiceStatus={invoice?.status || 'draft'}
        isEditing={isEditing && isRecurring}
        onChange={(updates) => {
          if ('isRecurring' in updates) {
            setIsRecurring(updates.isRecurring);
            setPricingType(updates.isRecurring ? 'recurring' : 'fixed');
          }
          if ('pricingType' in updates) {
            setPricingType(updates.pricingType);
            setIsRecurring(updates.pricingType === 'recurring');
          }
          if ('recurringType' in updates) setRecurringType(updates.recurringType);
          if ('customEvery' in updates) setCustomEvery(updates.customEvery);
          if ('customPeriod' in updates) setCustomPeriod(updates.customPeriod);
          if ('recurringEndDate' in updates) setRecurringEndDate(updates.recurringEndDate);
          if ('recurringOccurrences' in updates) setRecurringOccurrences(updates.recurringOccurrences);
          if ('recurringStatus' in updates) setRecurringStatus(updates.recurringStatus);
          if ('recurringNumber' in updates) setRecurringNumber(updates.recurringNumber);
          if ('allowStripePayments' in updates) setAllowStripePayments(updates.allowStripePayments);
          if ('allowPaypalPayments' in updates) setAllowPaypalPayments(updates.allowPaypalPayments);
          if ('allowPartialPayments' in updates) setAllowPartialPayments(updates.allowPartialPayments);
          if ('automaticPaymentEnabled' in updates) setAutomaticPaymentEnabled(updates.automaticPaymentEnabled);
          if ('automaticEmail' in updates) setAutomaticEmail(updates.automaticEmail);
          if ('attachPdfToEmail' in updates) setAttachPdfToEmail(updates.attachPdfToEmail);
          if ('sendPaymentReceipt' in updates) setSendPaymentReceipt(updates.sendPaymentReceipt);
          if ('receivePaymentNotifications' in updates) setReceivePaymentNotifications(updates.receivePaymentNotifications);
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

      {/* Unbilled Hours Modal */}
      <UnbilledHoursModal
        isOpen={showUnbilledHoursModal}
        onClose={() => {
          setShowUnbilledHoursModal(false);
          setUnbilledHoursData(null);
        }}
        onConfirm={handleAddUnbilledHours}
        data={unbilledHoursData}
        defaultCurrency={defaultCurrencyAssoc?.currency?.code}
        loading={checkingUnbilledHours}
      />

      {/* Mark Hours as Billed Modal */}
      <MarkHoursBilledModal
        isOpen={showMarkBilledModal}
        onClose={handleDeclineMarkBilled}
        onConfirm={handleMarkHoursAsBilled}
        hoursCount={pendingBillableHourIds.length}
        loading={markingAsBilled}
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
