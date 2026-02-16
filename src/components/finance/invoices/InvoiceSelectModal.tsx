import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Check, FileText, X } from 'lucide-react';
import invoicesAPI from '../../../services/api/finance/invoices';

interface InvoiceSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoiceId: string;
  onSelect: (invoiceId: string, invoice: any | null) => void;
  contactId?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const InvoiceSelectModal: React.FC<InvoiceSelectModalProps> = ({
  isOpen,
  onClose,
  selectedInvoiceId,
  onSelect,
  contactId,
  triggerRef,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInvoices = useCallback(async (search: string) => {
    try {
      setLoading(true);
      const params: Record<string, string> = { per_page: '50' };
      if (search) params.search = search;
      if (contactId) params.contact_id = contactId;
      const data = await invoicesAPI.list(params);
      const items = data?.items || [];
      setInvoices(items);
    } catch (error) {
      console.error('Failed to search invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Fetch invoices when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchInvoices('');
    } else {
      setSearchQuery('');
      setInvoices([]);
    }
  }, [isOpen, fetchInvoices]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchInvoices(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, isOpen, fetchInvoices]);

  const handleSelect = (invoiceId: string, invoice: any | null) => {
    onSelect(invoiceId, invoice);
    setSearchQuery('');
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'sent':
      case 'viewed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'overdue':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatStatus = (status: string) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ maxWidth: '400px' }}
    >
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
          />
        </div>
      </div>

      {/* Invoice List */}
      <div className="max-h-64 overflow-y-auto">
        {/* None option */}
        <div className="py-1 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => handleSelect('', null)}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
              !selectedInvoiceId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
            }`}
          >
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <X className="h-3.5 w-3.5" />
              None
            </span>
            {!selectedInvoiceId && (
              <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            )}
          </button>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Searching invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No invoices found' : 'No invoices available'}
          </div>
        ) : (
          <div className="py-1">
            {invoices.map((invoice: any) => (
              <button
                key={invoice.id}
                onClick={() => handleSelect(invoice.id, invoice)}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                  invoice.id === selectedInvoiceId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {invoice.invoice_number || 'No number'}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {formatStatus(invoice.status)}
                      </span>
                    </div>
                    {invoice.contact?.business_name || invoice.contact?.first_name ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {invoice.contact.business_name || `${invoice.contact.first_name || ''} ${invoice.contact.last_name || ''}`.trim()}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {invoice.total != null && (
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {invoice.currency?.symbol || '$'}{parseFloat(invoice.total).toFixed(2)}
                    </span>
                  )}
                  {invoice.id === selectedInvoiceId && (
                    <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceSelectModal;
