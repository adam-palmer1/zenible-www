import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Send, Download, Copy, FileText, MoreVertical, Search } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { QUOTE_STATUS, QUOTE_STATUS_COLORS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import quotesAPI from '../../../services/api/finance/quotes';
import SendQuoteModal from './SendQuoteModal';
import ConvertToInvoiceModal from './ConvertToInvoiceModal';

const QuoteList = () => {
  const navigate = useNavigate();
  const {
    quotes,
    loading,
    filters,
    pagination,
    sortBy,
    sortOrder,
    updateFilters,
    updateSort,
    setPagination,
    deleteQuote,
    cloneQuote,
  } = useQuotes();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    updateSort(field, newOrder);
  };

  const handleSearch = (e) => {
    updateFilters({ search: e.target.value });
  };

  const handleStatusFilter = (status) => {
    updateFilters({ status: status || null });
  };

  const handleView = (quote) => {
    navigate(`/finance/quotes/${quote.id}`);
  };

  const handleEdit = (quote) => {
    navigate(`/finance/quotes/${quote.id}/edit`);
  };

  const handleSend = (quote) => {
    setSelectedQuote(quote);
    setShowSendModal(true);
    setActionMenuOpen(null);
  };

  const handleConvert = (quote) => {
    setSelectedQuote(quote);
    setShowConvertModal(true);
    setActionMenuOpen(null);
  };

  const handleDownloadPdf = async (quote) => {
    try {
      setDownloadingPdf(quote.id);
      const blob = await quotesAPI.downloadPDF(quote.id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess('Quote downloaded successfully');
    } catch (error) {
      console.error('Error downloading quote:', error);
      showError(error.message || 'Failed to download quote');
    } finally {
      setDownloadingPdf(null);
      setActionMenuOpen(null);
    }
  };

  const handleClone = async (quote) => {
    try {
      const cloned = await cloneQuote(quote.id);
      showSuccess('Quote cloned successfully');
      navigate(`/finance/quotes/${cloned.id}/edit`);
    } catch (error) {
      console.error('Error cloning quote:', error);
      showError(error.message || 'Failed to clone quote');
    } finally {
      setActionMenuOpen(null);
    }
  };

  const handleDelete = async (quote) => {
    const confirmed = await showConfirm(
      'Delete Quote',
      `Are you sure you want to delete quote ${quote.quote_number}? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await deleteQuote(quote.id);
        showSuccess('Quote deleted successfully');
      } catch (error) {
        console.error('Error deleting quote:', error);
        showError(error.message || 'Failed to delete quote');
      }
    }
    setActionMenuOpen(null);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="design-bg-primary rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 design-text-secondary" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={handleSearch}
              placeholder="Search quotes..."
              className="w-full pl-10 pr-3 py-2 design-input rounded-md"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 design-input rounded-md"
            >
              <option value="">All Statuses</option>
              <option value={QUOTE_STATUS.DRAFT}>Draft</option>
              <option value={QUOTE_STATUS.SENT}>Sent</option>
              <option value={QUOTE_STATUS.ACCEPTED}>Accepted</option>
              <option value={QUOTE_STATUS.REJECTED}>Rejected</option>
              <option value={QUOTE_STATUS.EXPIRED}>Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="design-bg-primary rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y design-divide">
            <thead className="design-bg-secondary">
              <tr>
                <th
                  onClick={() => handleSort('quote_number')}
                  className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider cursor-pointer hover:design-text-primary"
                >
                  Quote # <SortIcon field="quote_number" />
                </th>
                <th
                  onClick={() => handleSort('contact')}
                  className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider cursor-pointer hover:design-text-primary"
                >
                  Client <SortIcon field="contact" />
                </th>
                <th
                  onClick={() => handleSort('quote_date')}
                  className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider cursor-pointer hover:design-text-primary"
                >
                  Date <SortIcon field="quote_date" />
                </th>
                <th
                  onClick={() => handleSort('valid_until')}
                  className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider cursor-pointer hover:design-text-primary"
                >
                  Valid Until <SortIcon field="valid_until" />
                </th>
                <th
                  onClick={() => handleSort('total')}
                  className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider cursor-pointer hover:design-text-primary"
                >
                  Total <SortIcon field="total" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="design-bg-primary divide-y design-divide">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
                    <p className="mt-2 text-sm design-text-secondary">Loading quotes...</p>
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm design-text-secondary">No quotes found</p>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:design-bg-secondary transition-colors cursor-pointer"
                    onClick={() => handleView(quote)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium design-text-primary">
                        {quote.quote_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm design-text-primary">
                        {quote.contact ? `${quote.contact.first_name} ${quote.contact.last_name}` : 'N/A'}
                      </div>
                      {quote.contact?.business_name && (
                        <div className="text-xs design-text-secondary">
                          {quote.contact.business_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm design-text-primary">
                        {new Date(quote.issue_date || quote.quote_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm design-text-primary">
                        {quote.valid_until
                          ? new Date(quote.valid_until).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium design-text-primary">
                        {formatCurrency(quote.total, quote.currency?.code || quote.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${QUOTE_STATUS_COLORS[quote.status]}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleView(quote)}
                          className="design-text-secondary hover:design-text-primary"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(quote)}
                          className="design-text-secondary hover:design-text-primary"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === quote.id ? null : quote.id)}
                            className="design-text-secondary hover:design-text-primary"
                            title="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {actionMenuOpen === quote.id && (
                            <div className="absolute right-0 mt-2 w-56 design-bg-primary rounded-md shadow-lg z-10 border design-border">
                              <div className="py-1">
                                <button
                                  onClick={() => handleSend(quote)}
                                  className="flex items-center w-full px-4 py-2 text-sm design-text-primary hover:design-bg-secondary"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Quote
                                </button>
                                {quote.status === QUOTE_STATUS.ACCEPTED && (
                                  <button
                                    onClick={() => handleConvert(quote)}
                                    className="flex items-center w-full px-4 py-2 text-sm design-text-primary hover:design-bg-secondary"
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Convert to Invoice
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownloadPdf(quote)}
                                  disabled={downloadingPdf === quote.id}
                                  className="flex items-center w-full px-4 py-2 text-sm design-text-primary hover:design-bg-secondary disabled:opacity-50"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  {downloadingPdf === quote.id ? 'Downloading...' : 'Download PDF'}
                                </button>
                                <button
                                  onClick={() => handleClone(quote)}
                                  className="flex items-center w-full px-4 py-2 text-sm design-text-primary hover:design-bg-secondary"
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Clone Quote
                                </button>
                                <button
                                  onClick={() => handleDelete(quote)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:design-bg-secondary dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="design-bg-secondary px-6 py-4 flex items-center justify-between border-t design-border">
            <div className="text-sm design-text-secondary">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} quotes
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm design-text-primary design-bg-tertiary rounded-md hover:design-bg-quaternary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 text-sm design-text-primary design-bg-tertiary rounded-md hover:design-bg-quaternary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SendQuoteModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSelectedQuote(null);
        }}
        quote={selectedQuote}
      />

      <ConvertToInvoiceModal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setSelectedQuote(null);
        }}
        quote={selectedQuote}
      />
    </div>
  );
};

export default QuoteList;
