import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Calendar, Loader2, ArrowLeft, ChevronDown, FileText, Link as LinkIcon } from 'lucide-react';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { CREDIT_NOTE_STATUS } from '../../../constants/finance';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import invoicesAPI from '../../../services/api/finance/invoices';
import DiscountModal from '../invoices/DiscountModal';
import { DocumentLineItems, DocumentTotals, LineItemTaxModal } from '../shared';
import ClientSelectModal from '../invoices/ClientSelectModal';
import CurrencySelectModal from '../invoices/CurrencySelectModal';
import SendCreditNoteModal from './SendCreditNoteModal';
import FinanceLayout from '../layout/FinanceLayout';
import TaxModal from '../invoices/TaxModal';

interface CreditNotePrefill {
  contact_id?: string;
  invoice_id?: string;
  currency_id?: string;
  reason?: string;
  reference?: string;
  items?: Array<{
    name?: string;
    description?: string;
    quantity?: number | string;
    price?: number | string;
    taxes?: unknown[];
  }>;
}

interface CreditNoteFormProps {
  creditNote?: any;
  onSuccess?: (result: any) => void;
  isInModal?: boolean;
}

const CreditNoteForm: React.FC<CreditNoteFormProps> = ({ creditNote: creditNoteProp = null, onSuccess, isInModal = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { contacts: allContacts, loading: contactsLoading } = useContacts({ is_client: true });
  const { showSuccess, showError } = useNotification();
  const { numberFormats } = useCRMReferenceData();
  const { getNumberFormat } = useCompanyAttributes();

  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find((f: any) => f.id === formatId);
    }
    return null;
  }, [getNumberFormat, numberFormats]);

  const clientButtonRef = React.useRef<HTMLButtonElement>(null);
  const currencyButtonRef = React.useRef<HTMLButtonElement>(null);

  const [creditNote, setCreditNote] = useState<any>(creditNoteProp);
  const [loading, setLoading] = useState(!!id && !creditNoteProp);

  const { companyCurrencies: currencies, defaultCurrency: defaultCurrencyAssoc, loading: currenciesLoading } = useCompanyCurrencies();

  const isEditing = !!creditNote || !!id;

  const [contactId, setContactId] = useState('');
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [documentTaxes, setDocumentTaxes] = useState<any[]>([]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLineItemTaxModal, setShowLineItemTaxModal] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState<number | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [savedCreditNote, setSavedCreditNote] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [invoiceLookup, setInvoiceLookup] = useState<Record<string, any>>({});
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [saving, setSaving] = useState(false);

  const getSaveButtonText = (): string => {
    if (creditNote?.status && creditNote.status !== 'draft') {
      return 'Save';
    }
    return 'Save as Draft';
  };

  useEffect(() => {
    const loadCreditNote = async () => {
      if (id && !creditNoteProp) {
        try {
          setLoading(true);
          const data = await creditNotesAPI.get(id);
          setCreditNote(data);
        } catch (error: any) {
          console.error('Failed to load credit note:', error);
          showError('Failed to load credit note');
          navigate('/finance/credit-notes');
        } finally {
          setLoading(false);
        }
      }
    };
    loadCreditNote();
  }, [id, creditNoteProp]);

  useEffect(() => {
    if (!creditNote && (location.state as { prefill?: CreditNotePrefill })?.prefill) {
      const prefill = (location.state as { prefill: CreditNotePrefill }).prefill;
      if (prefill.contact_id) setContactId(prefill.contact_id);
      if (prefill.invoice_id) setLinkedInvoiceId(prefill.invoice_id);
      if (prefill.currency_id) setCurrency(prefill.currency_id);
      if (prefill.reason) setReason(prefill.reason);
      if (prefill.reference) setReference(prefill.reference);
      if (prefill.items && prefill.items.length > 0) {
        const normalizedItems = prefill.items.map((item) => ({
          description: item.name || item.description || '',
          subtext: item.description || '',
          quantity: parseFloat(String(item.quantity || 1)),
          price: parseFloat(String(item.price || 0)),
          amount: parseFloat(String(item.quantity || 1)) * parseFloat(String(item.price || 0)),
          taxes: item.taxes || [],
          tax_amount: 0,
        }));
        setItems(normalizedItems);
      }
    }
  }, [location.state, creditNote]);

  useEffect(() => {
    if (creditNote) {
      setContactId(creditNote.contact_id || '');
      setCreditNoteNumber(creditNote.credit_note_number || '');
      setIssueDate(
        creditNote.issue_date
          ? new Date(creditNote.issue_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setCurrency(creditNote.currency_id || '');
      setReference(creditNote.reference || '');
      setReason(creditNote.reason || '');
      setLinkedInvoiceId(creditNote.invoice_id || '');
      setNotes(creditNote.notes || '');

      const creditNoteItems = creditNote.items || [];
      const normalizedItems = creditNoteItems.map((item: any) => ({
        ...item,
        description: item.name || item.description || '',
        subtext: item.description || '',
        quantity: parseFloat(item.quantity || 0),
        price: parseFloat(item.price || 0),
        amount: parseFloat(item.amount || 0) || (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)),
        taxes: item.taxes || [],
        tax_amount: item.taxes?.reduce((sum: number, t: any) => sum + (parseFloat(t.tax_amount) || 0), 0) || 0,
      }));
      setItems(normalizedItems);

      setDiscountType(creditNote.discount_percentage > 0 ? 'percentage' : 'fixed');
      setDiscountValue(parseFloat(creditNote.discount_percentage || creditNote.discount_amount || 0));
    }
  }, [creditNote]);

  useEffect(() => {
    if (!creditNote && !currency && currencies.length > 0) {
      const defaultCurrencyId = defaultCurrencyAssoc?.currency?.id || currencies[0]?.currency?.id;
      if (defaultCurrencyId) {
        setCurrency(defaultCurrencyId);
      }
    }
  }, [creditNote, currency, currencies, defaultCurrencyAssoc]);

  useEffect(() => {
    if (!creditNote && contactId && allContacts.length > 0 && currencies.length > 0) {
      const selectedContact = allContacts.find((c: any) => c.id === contactId);
      if (selectedContact) {
        const contactCurrencyId =
          selectedContact.preferred_currency_id ||
          selectedContact.currency_id ||
          (selectedContact as Record<string, unknown>).default_currency_id as string ||
          selectedContact.currency?.id;

        if (contactCurrencyId) {
          const currencyExists = currencies.some((cc: any) => cc.currency.id === contactCurrencyId);
          if (currencyExists) {
            setCurrency(contactCurrencyId);
          }
        }
      }
    }
  }, [contactId, allContacts, currencies, creditNote]);

  useEffect(() => {
    const loadNextNumber = async () => {
      if (!creditNote && !id) {
        try {
          const data = await creditNotesAPI.getNextNumber() as { next_number?: string };
          if (data?.next_number) {
            setCreditNoteNumber(data.next_number);
          }
        } catch (error: any) {
          console.error('Failed to load next credit note number:', error);
        }
      }
    };
    loadNextNumber();
  }, [creditNote, id]);

  useEffect(() => {
    const loadInvoice = async () => {
      if (linkedInvoiceId && !invoiceLookup[linkedInvoiceId]) {
        try {
          setLoadingInvoice(true);
          const invoice = await invoicesAPI.get(linkedInvoiceId);
          setInvoiceLookup((prev) => ({ ...prev, [linkedInvoiceId]: invoice }));
        } catch (error: any) {
          console.error('Failed to load linked invoice:', error);
        } finally {
          setLoadingInvoice(false);
        }
      }
    };
    loadInvoice();
  }, [linkedInvoiceId]);

  const totals = calculateInvoiceTotal(items, documentTaxes, discountType, discountValue);

  const getCurrencyCode = (): string => {
    if (!currency || !currencies.length) return 'USD';
    const currencyAssoc = currencies.find((cc: any) => cc.currency.id === currency);
    return currencyAssoc?.currency?.code || 'USD';
  };
  const currencyCode = getCurrencyCode();

  const addLineItem = () => {
    setItems([...items, { description: '', subtext: '', quantity: 1, price: 0, amount: 0, taxes: [], tax_amount: 0 }]);
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      newItems[index].amount = qty * price;

      if (newItems[index].taxes && newItems[index].taxes.length > 0) {
        const itemAmount = qty * price;
        newItems[index].taxes = newItems[index].taxes.map((tax: any, i: number) => ({
          ...tax,
          tax_amount: Math.round((itemAmount * tax.tax_rate / 100) * 100) / 100,
          display_order: i
        }));
        newItems[index].tax_amount = newItems[index].taxes.reduce((sum: number, t: any) => sum + t.tax_amount, 0);
      }
    }

    setItems(newItems);
  };

  const removeLineItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const openLineItemTaxModal = (index: number) => {
    setEditingLineItemIndex(index);
    setShowLineItemTaxModal(true);
  };

  const handleLineItemTaxSave = (taxes: any[]) => {
    if (editingLineItemIndex === null) return;

    const newItems = [...items];
    const item = newItems[editingLineItemIndex];

    newItems[editingLineItemIndex] = {
      ...item,
      taxes: taxes,
      tax_amount: taxes.reduce((sum: number, t: any) => sum + t.tax_amount, 0)
    };

    setItems(newItems);
    setShowLineItemTaxModal(false);
    setEditingLineItemIndex(null);
  };

  const calculateItemTotal = (item: any): number => {
    const amount = parseFloat(item.amount || 0);
    const taxAmount = item.taxes?.reduce((sum: number, t: any) => sum + (t.tax_amount || 0), 0) || 0;
    return amount + taxAmount;
  };

  const handleClientSelect = (clientId: string) => {
    setContactId(clientId);
    setShowClientModal(false);
  };

  const handleSendSuccess = () => {
    setShowSendModal(false);
    setSavedCreditNote(null);
    if (onSuccess) {
      onSuccess(savedCreditNote);
    } else {
      navigate('/finance/credit-notes');
    }
  };

  const handleSave = async (_saveStatus: string = CREDIT_NOTE_STATUS.DRAFT, openSendModal: boolean = false) => {
    if (!contactId) { showError('Please select a client'); return; }
    if (!issueDate) { showError('Please select an issue date'); return; }
    if (!currency) { showError('Please select a currency'); return; }
    if (items.length === 0) { showError('Please add at least one line item'); return; }
    const hasEmptyItems = items.some((item: any) => !item.description || item.description.trim() === '');
    if (hasEmptyItems) { showError('Please provide a description for all line items'); return; }

    try {
      setSaving(true);

      const creditNoteData: any = {
        contact_id: contactId,
        issue_date: issueDate,
        currency_id: currency,
        reference: reference || undefined,
        reason: reason || undefined,
        invoice_id: linkedInvoiceId || undefined,
        notes: notes || undefined,
        discount_percentage: discountType === 'percentage' && discountValue > 0 ? parseFloat(String(discountValue)) : undefined,
        discount_amount: discountType === 'fixed' && discountValue > 0 ? parseFloat(String(discountValue)) : undefined,
        items: items.map((item: any) => {
          const itemData: any = {
            ...(item.id && { id: item.id }),
            name: item.description || item.name,
            description: item.subtext || '',
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price),
          };

          if (item.taxes && item.taxes.length > 0) {
            itemData.tax_rate = parseFloat(item.taxes[0].tax_rate) || 0;
            itemData.tax_name = item.taxes[0].tax_name || '';
            itemData.taxes = item.taxes.map((tax: any) => ({
              tax_name: tax.tax_name,
              tax_rate: parseFloat(tax.tax_rate),
              tax_amount: parseFloat(tax.tax_amount),
            }));
          }

          return itemData;
        }),
      };

      let result;
      if (creditNote?.id) {
        result = await creditNotesAPI.update(creditNote.id, creditNoteData);
        showSuccess('Credit note updated successfully');
      } else {
        result = await creditNotesAPI.create(creditNoteData);
        showSuccess('Credit note created successfully');
      }

      if (openSendModal) {
        setSavedCreditNote(result);
        setShowSendModal(true);
      } else {
        if (onSuccess) {
          onSuccess(result);
        } else {
          navigate('/finance/credit-notes');
        }
      }
    } catch (error: any) {
      console.error('Error saving credit note:', error);
      showError(error.message || 'Failed to save credit note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="inline-block h-8 w-8 animate-spin text-purple-600 mb-2" />
          <p className="text-sm text-gray-600">Loading credit note...</p>
        </div>
      </div>
    );
  }

  const linkedInvoice = linkedInvoiceId ? invoiceLookup[linkedInvoiceId] : null;

  const formContent = (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    const client = allContacts.find((c: any) => c.id === contactId);
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
              triggerRef={clientButtonRef as React.RefObject<HTMLElement>}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Credit Note Number</label>
          <input type="text" value={creditNoteNumber} onChange={(e) => setCreditNoteNumber(e.target.value)} placeholder="CRN-0001" autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date<span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" required />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency<span className="text-red-500">*</span></label>
          <div className="relative">
            <button ref={currencyButtonRef} type="button" onClick={() => setShowCurrencyModal(true)} disabled={currenciesLoading} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center justify-between">
              <span className={currency ? 'text-gray-900' : 'text-gray-500'}>
                {currenciesLoading ? 'Loading currencies...' : currency ?
                  (() => { const cc = currencies.find((c: any) => c.currency.id === currency); if (!cc) return 'Select Currency'; return `${cc.currency.code} - ${cc.currency.name}`; })()
                  : 'Select Currency'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <CurrencySelectModal isOpen={showCurrencyModal} onClose={() => setShowCurrencyModal(false)} currencies={currencies} selectedCurrencyId={currency} onSelect={setCurrency} loading={currenciesLoading} triggerRef={currencyButtonRef as React.RefObject<HTMLElement>} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g., PO-12345" autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Linked Invoice (Optional)</label>
          <div className="relative">
            {linkedInvoiceId && linkedInvoice ? (
              <div className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{linkedInvoice.invoice_number}</span>
                </div>
                <button type="button" onClick={() => setLinkedInvoiceId('')} className="text-xs text-red-600 hover:text-red-700">Remove</button>
              </div>
            ) : linkedInvoiceId && loadingInvoice ? (
              <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Loading invoice...</span>
              </div>
            ) : (
              <input type="text" value={linkedInvoiceId} onChange={(e) => setLinkedInvoiceId(e.target.value)} placeholder="Invoice ID (optional)" autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Credit</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Product return - defective item" autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
      </div>

      <DocumentLineItems items={items} currencyCode={currencyCode} numberFormat={numberFormat} onAddItem={addLineItem} onUpdateItem={updateLineItem} onRemoveItem={removeLineItem} onOpenTaxModal={openLineItemTaxModal} calculateItemTotal={calculateItemTotal} />

      <DocumentTotals totals={totals} currencyCode={currencyCode} numberFormat={numberFormat} documentTaxes={documentTaxes} onEditTax={() => setShowTaxModal(true)} onRemoveTax={() => setDocumentTaxes([])} discountType={discountType} discountValue={discountValue} onEditDiscount={() => setShowDiscountModal(true)} onRemoveDiscount={() => setDiscountValue(0)} depositType={null} depositValue={0} onEditDeposit={() => {}} onRemoveDeposit={() => {}} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes (visible to client)" rows={4} autoComplete="off" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
      </div>

      {isInModal && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button onClick={() => handleSave(creditNote?.status && creditNote.status !== 'draft' ? creditNote.status : CREDIT_NOTE_STATUS.DRAFT)} disabled={saving} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
            {getSaveButtonText()}
          </button>
          <button onClick={() => handleSave(CREDIT_NOTE_STATUS.ISSUED, true)} disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
            Save & Send
          </button>
        </div>
      )}

      <TaxModal isOpen={showTaxModal} onClose={() => setShowTaxModal(false)} onSave={(taxes: any) => setDocumentTaxes(taxes)} initialDocumentTaxes={documentTaxes} />
      <DiscountModal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} onSave={(type: any, value: any) => { setDiscountType(type); setDiscountValue(value); }} initialDiscountType={discountType} initialDiscountValue={discountValue} subtotal={totals.subtotal} currency={currencyCode} />
      <LineItemTaxModal isOpen={showLineItemTaxModal} onClose={() => { setShowLineItemTaxModal(false); setEditingLineItemIndex(null); }} onSave={handleLineItemTaxSave} itemAmount={editingLineItemIndex !== null ? parseFloat(items[editingLineItemIndex]?.amount || 0) : 0} initialTaxes={editingLineItemIndex !== null ? (items[editingLineItemIndex]?.taxes || []) : []} currency={currencyCode} />

      {showSendModal && savedCreditNote && (
        <SendCreditNoteModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} creditNote={savedCreditNote} contact={savedCreditNote && allContacts.find((c: any) => c.id === savedCreditNote.contact_id)} onSuccess={handleSendSuccess} />
      )}
    </div>
  );

  if (isInModal) {
    return formContent;
  }

  return (
    <FinanceLayout
      header={
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/finance/credit-notes')} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Back to credit notes">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Credit Note' : 'New Credit Note'}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{isEditing ? 'Update credit note details' : 'Create a new credit note for your client'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleSave(creditNote?.status && creditNote.status !== 'draft' ? creditNote.status : CREDIT_NOTE_STATUS.DRAFT)} disabled={saving} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
                {getSaveButtonText()}
              </button>
              <button onClick={() => handleSave(CREDIT_NOTE_STATUS.ISSUED, true)} disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
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

export default CreditNoteForm;
