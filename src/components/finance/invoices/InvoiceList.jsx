import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreVertical,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  Trash2,
  Send,
  Download,
  Repeat
} from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '../../../constants/finance';
import { formatCurrency, getCurrencySymbol } from '../../../utils/currency';
import { useInvoiceStats } from '../../../hooks/finance/useInvoiceStats';
import KPICard from '../shared/KPICard';
import SendInvoiceDialog from './SendInvoiceDialog';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { invoices, loading, deleteInvoice } = useInvoices();
  const { showSuccess, showError } = useNotification();
  const stats = useInvoiceStats();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter and search invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.contact?.business_name?.toLowerCase().includes(query) ||
        inv.contact?.first_name?.toLowerCase().includes(query) ||
        inv.contact?.last_name?.toLowerCase().includes(query) ||
        inv.contact?.email?.toLowerCase().includes(query) ||
        inv.total?.toString().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(inv => inv.status === filterStatus);
    }

    return result;
  }, [invoices, searchQuery, filterStatus]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedInvoices.map(inv => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (invoiceId) => {
    setSelectedIds(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} invoice(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedIds.map(id => deleteInvoice(id)));
      showSuccess(`${selectedIds.length} invoice(s) deleted successfully`);
      setSelectedIds([]);
    } catch (error) {
      showError('Failed to delete invoices');
    }
  };

  const handleBulkSend = async () => {
    showSuccess(`Sending ${selectedIds.length} invoice(s)...`);
    setSelectedIds([]);
  };

  const handleBulkDownload = async () => {
    showSuccess(`Downloading ${selectedIds.length} invoice(s)...`);
    setSelectedIds([]);
  };

  // Individual actions
  const handleEdit = (invoice) => {
    navigate(`/finance/invoices/${invoice.id}/edit`);
    setOpenActionMenuId(null);
  };

  const handleView = (invoice) => {
    navigate(`/finance/invoices/${invoice.id}`);
    setOpenActionMenuId(null);
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      await deleteInvoice(invoice.id);
      showSuccess('Invoice deleted successfully');
    } catch (error) {
      showError('Failed to delete invoice');
    }
    setOpenActionMenuId(null);
  };

  const handleSend = (invoice) => {
    setInvoiceToSend(invoice);
    setShowSendDialog(true);
    setOpenActionMenuId(null);
  };

  const handleSendSuccess = () => {
    setShowSendDialog(false);
    setInvoiceToSend(null);
  };

  const handleDownloadPDF = (invoice) => {
    showSuccess(`Downloading invoice ${invoice.invoice_number}...`);
    setOpenActionMenuId(null);
  };

  const handleClone = (invoice) => {
    showSuccess(`Cloning invoice ${invoice.invoice_number}...`);
    setOpenActionMenuId(null);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${INVOICE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
        {INVOICE_STATUS_LABELS[status] || status}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format multi-currency amounts
  const formatMultiCurrency = (byCurrency) => {
    const currencies = Object.keys(byCurrency);
    if (currencies.length === 0) return formatCurrency(0, 'USD');
    if (currencies.length === 1) {
      return formatCurrency(byCurrency[currencies[0]], currencies[0]);
    }
    // Multiple currencies - show breakdown
    return currencies
      .map(code => formatCurrency(byCurrency[code], code))
      .join(' + ');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Invoices"
          value={stats.total}
          icon={FileText}
          iconColor="blue"
        />
        <KPICard
          title="Total Revenue"
          value={formatMultiCurrency(stats.revenueByCurrency)}
          icon={DollarSign}
          iconColor="green"
        />
        <KPICard
          title="Outstanding"
          value={formatMultiCurrency(stats.outstandingByCurrency)}
          icon={Clock}
          iconColor="yellow"
        />
        <KPICard
          title="Over Due"
          value={stats.overdueCount}
          icon={AlertCircle}
          iconColor="red"
        />
      </div>

      {/* Invoices Section */}
      <div>
        {/* Section Header with Search and Filter */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#09090b]">Invoices</h2>
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => { setFilterStatus('all'); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-50`}
                    >
                      All Invoices
                    </button>
                    <button
                      onClick={() => { setFilterStatus(INVOICE_STATUS.DRAFT); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === INVOICE_STATUS.DRAFT ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-50`}
                    >
                      Draft
                    </button>
                    <button
                      onClick={() => { setFilterStatus(INVOICE_STATUS.SENT); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === INVOICE_STATUS.SENT ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-50`}
                    >
                      Sent
                    </button>
                    <button
                      onClick={() => { setFilterStatus(INVOICE_STATUS.PAID); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === INVOICE_STATUS.PAID ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-50`}
                    >
                      Paid
                    </button>
                    <button
                      onClick={() => { setFilterStatus(INVOICE_STATUS.OVERDUE); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === INVOICE_STATUS.OVERDUE ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-50`}
                    >
                      Overdue
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} invoice{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkSend}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
              <button
                onClick={handleBulkDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-500">
                      Loading invoices...
                    </td>
                  </tr>
                ) : paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((invoice) => {
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleView(invoice)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(invoice.id)}
                            onChange={() => handleSelectOne(invoice.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          #{invoice.invoice_number || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {invoice.contact?.business_name ||
                           (invoice.contact?.first_name && invoice.contact?.last_name
                             ? `${invoice.contact.first_name} ${invoice.contact.last_name}`
                             : '-')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(invoice.issue_date || invoice.invoice_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {invoice.currency?.symbol || getCurrencySymbol(invoice.currency?.code)}{typeof invoice.total === 'number' ? invoice.total.toFixed(2) : parseFloat(invoice.total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            <StatusBadge status={invoice.status} />

                            {/* Recurring template badge */}
                            {(invoice.pricing_type === 'recurring' || invoice.is_recurring) && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 inline-flex items-center gap-1">
                                <Repeat className="h-3 w-3" />
                                Template
                              </span>
                            )}

                            {/* Generated invoice badge */}
                            {invoice.generated_from_template && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Gen #{invoice.recurrence_sequence_number || 'N/A'}
                              </span>
                            )}

                            {/* Outstanding balance badge */}
                            {invoice.outstanding_balance && parseFloat(invoice.outstanding_balance) !== 0 && (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                parseFloat(invoice.outstanding_balance) > 0
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {parseFloat(invoice.outstanding_balance) > 0
                                  ? `${formatCurrency(invoice.outstanding_balance, invoice.currency?.code)} Due`
                                  : `${formatCurrency(Math.abs(parseFloat(invoice.outstanding_balance)), invoice.currency?.code)} Credit`
                                }
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm relative" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              onClick={() => setOpenActionMenuId(openActionMenuId === invoice.id ? null : invoice.id)}
                              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </button>
                            {openActionMenuId === invoice.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setOpenActionMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleView(invoice)}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => handleEdit(invoice)}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleSend(invoice)}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      Send
                                    </button>
                                    <button
                                      onClick={() => handleDownloadPDF(invoice)}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      Download PDF
                                    </button>
                                    <button
                                      onClick={() => handleClone(invoice)}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      Clone
                                    </button>
                                    <button
                                      onClick={() => handleDelete(invoice)}
                                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loading && paginatedInvoices.length > 0 && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                {/* Mobile pagination */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredInvoices.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredInvoices.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span
                            key={page}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    {/* Next button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Invoice Dialog */}
      <SendInvoiceDialog
        isOpen={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        invoice={invoiceToSend}
        contact={invoiceToSend?.contact}
        onSuccess={handleSendSuccess}
      />
    </div>
  );
};

export default InvoiceList;
