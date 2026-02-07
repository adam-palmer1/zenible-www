import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInvoices, type Invoice } from '../../../contexts/InvoiceContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { getCurrencySymbol } from '../../../utils/currency';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';
import { useInvoiceStats } from '../../../hooks/finance/useInvoiceStats';
import SendInvoiceDialog from './SendInvoiceDialog';
import SendReminderDialog from './SendReminderDialog';

const SendInvoiceDialogComponent = SendInvoiceDialog;
const SendReminderDialogComponent = SendReminderDialog;
import ConfirmationModal from '../../shared/ConfirmationModal';
import invoicesAPI from '../../../services/api/finance/invoices';
import InvoiceKPICards from './InvoiceKPICards';
import InvoiceListFilters from './InvoiceListFilters';
import InvoiceListTable from './InvoiceListTable';

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { invoices, loading, deleteInvoice, updateFilters, cloneInvoice, filters } = useInvoices();

  // Derive filterStatus from context filters for UI display
  const filterStatus = filters.overdue_only ? 'overdue'
    : (filters.outstanding_only ? 'outstanding'
    : (filters.status || 'all'));

  // URL-based filters
  const parentInvoiceId = searchParams.get('parent_id');
  const urlStatus = searchParams.get('status');
  const { showSuccess, showError } = useNotification();
  const { contacts: allClients, loading: clientsLoading } = useContacts({ is_client: true });
  const { numberFormats } = useCRMReferenceData();
  const { getNumberFormat } = useCompanyAttributes();
  const stats = useInvoiceStats();

  // Number format from company settings
  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find((f: any) => f.id === formatId);
    }
    return null;
  }, [getNumberFormat, numberFormats]);

  // Helper to format numbers using company settings
  const formatNumber = (num: number) => {
    return applyNumberFormat(num, numberFormat);
  };

  // Date filter presets
  const DATE_PRESETS = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'this_quarter', label: 'This Quarter' },
    { key: 'this_year', label: 'This Year' },
    { key: 'custom', label: 'Custom Range' },
  ];

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<any[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [dateType, setDateType] = useState('issue'); // 'issue' or 'due'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<any>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState<any>(null);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [invoiceForReminder, setInvoiceForReminder] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null); // 'bulk' or invoice object
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [parentTemplateInfo, setParentTemplateInfo] = useState<any>(null);

  // Track previous parentInvoiceId to detect changes from value -> null
  const prevParentIdRef = useRef(parentInvoiceId);

  // Apply parent_id filter from URL params
  useEffect(() => {
    const prevParentId = prevParentIdRef.current;
    prevParentIdRef.current = parentInvoiceId;

    if (parentInvoiceId) {
      updateFilters({ parent_invoice_id: parentInvoiceId });
      // Load parent template info for display
      invoicesAPI.get(parentInvoiceId).then(setParentTemplateInfo).catch((err: unknown) => { console.error('Failed to load parent template:', err); });
    } else if (prevParentId && !parentInvoiceId) {
      // Only clear if there was a previous parent filter and now it's null
      updateFilters({ parent_invoice_id: null });
      setParentTemplateInfo(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentInvoiceId]);

  // Apply status filter from URL params (supports comma-separated values and special filters)
  useEffect(() => {
    if (urlStatus) {
      // Handle special filter types
      if (urlStatus === 'outstanding') {
        updateFilters({ outstanding_only: true, overdue_only: null, status: null });
      } else if (urlStatus === 'overdue') {
        updateFilters({ overdue_only: true, outstanding_only: null, status: null });
      } else {
        updateFilters({ status: urlStatus, outstanding_only: null, overdue_only: null });
      }
      // Clear the URL param after applying so it doesn't persist on navigation
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('status');
      setSearchParams(newParams, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

  // Clear parent filter
  const clearParentFilter = useCallback(() => {
    setSearchParams({});
    setParentTemplateInfo(null);
  }, [setSearchParams]);

  // Calculate date range from preset
  const getDateRangeFromPreset = (preset: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    switch (preset) {
      case 'today': {
        return { from: formatDate(today), to: formatDate(today) };
      }
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { from: formatDate(startOfWeek), to: formatDate(endOfWeek) };
      }
      case 'this_month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: formatDate(startOfMonth), to: formatDate(endOfMonth) };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return { from: formatDate(startOfLastMonth), to: formatDate(endOfLastMonth) };
      }
      case 'this_quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        return { from: formatDate(startOfQuarter), to: formatDate(endOfQuarter) };
      }
      case 'this_year': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        return { from: formatDate(startOfYear), to: formatDate(endOfYear) };
      }
      default:
        return { from: null, to: null };
    }
  };

  // Handle date type change (issue vs due) - doesn't close dropdown
  const handleDateTypeChange = (type: string) => {
    setDateType(type);

    // If there's an active date filter, re-apply it with the new type
    if (datePreset !== 'all') {
      let dateFrom: string | null = null;
      let dateTo: string | null = null;

      if (datePreset === 'custom') {
        dateFrom = customDateFrom || null;
        dateTo = customDateTo || null;
      } else {
        const range = getDateRangeFromPreset(datePreset);
        dateFrom = range.from;
        dateTo = range.to;
      }

      if (type === 'issue') {
        updateFilters({
          issue_date_from: dateFrom,
          issue_date_to: dateTo,
          due_date_from: null,
          due_date_to: null,
        });
      } else {
        updateFilters({
          issue_date_from: null,
          issue_date_to: null,
          due_date_from: dateFrom,
          due_date_to: dateTo,
        });
      }
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (preset: string, closeDropdown = true) => {
    setDatePreset(preset);

    let dateFrom: string | null = null;
    let dateTo: string | null = null;

    if (preset === 'custom') {
      dateFrom = customDateFrom || null;
      dateTo = customDateTo || null;
    } else if (preset !== 'all') {
      const range = getDateRangeFromPreset(preset);
      dateFrom = range.from;
      dateTo = range.to;
    }

    // Update the context filters based on date type
    if (dateType === 'issue') {
      updateFilters({
        issue_date_from: dateFrom,
        issue_date_to: dateTo,
        due_date_from: null,
        due_date_to: null,
      });
    } else {
      updateFilters({
        issue_date_from: null,
        issue_date_to: null,
        due_date_from: dateFrom,
        due_date_to: dateTo,
      });
    }

    if (closeDropdown && preset !== 'custom') {
      setShowDateDropdown(false);
    }
  };

  // Handle custom date change
  const handleCustomDateChange = (from: string, to: string) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);

    if (from && to) {
      setDatePreset('custom');

      // Update the context filters based on date type
      if (dateType === 'issue') {
        updateFilters({
          issue_date_from: from,
          issue_date_to: to,
          due_date_from: null,
          due_date_to: null,
        });
      } else {
        updateFilters({
          issue_date_from: null,
          issue_date_to: null,
          due_date_from: from,
          due_date_to: to,
        });
      }
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDatePreset('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    updateFilters({
      issue_date_from: null,
      issue_date_to: null,
      due_date_from: null,
      due_date_to: null,
    });
    setShowDateDropdown(false);
  };

  // Handle client filter toggle
  const handleClientToggle = useCallback((clientId: any) => {
    // If an array is passed (select all), handle it differently
    if (Array.isArray(clientId)) {
      setSelectedClientIds(clientId);
      return;
    }
    setSelectedClientIds(prev => {
      const newSelection = prev.includes(clientId)
        ? prev.filter((id: any) => id !== clientId)
        : [...prev, clientId];
      return newSelection;
    });
  }, []);

  // Clear client selection in dropdown (local only, no backend update)
  const handleClearClientSelection = useCallback(() => {
    setSelectedClientIds([]);
    setClientSearchQuery('');
  }, []);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return allClients;
    const query = clientSearchQuery.toLowerCase();
    return allClients.filter((client: any) =>
      client.first_name?.toLowerCase().includes(query) ||
      client.last_name?.toLowerCase().includes(query) ||
      client.business_name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }, [allClients, clientSearchQuery]);

  // Get client display name
  const getClientDisplayName = (client: any) => {
    if (!client) return 'Unknown';
    if (client.business_name) return client.business_name;
    const name = `${client.first_name || ''} ${client.last_name || ''}`.trim();
    return name || client.email || 'Unknown';
  };

  // Get current date filter label
  const getDateFilterLabel = () => {
    if (datePreset === 'all') return 'All Time';
    if (datePreset === 'custom' && customDateFrom && customDateTo) {
      return `${customDateFrom} - ${customDateTo}`;
    }
    const preset = DATE_PRESETS.find(p => p.key === datePreset);
    return preset ? preset.label : 'All Time';
  };

  // Search is now server-side — update filters when searchQuery changes (debounced)
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      updateFilters({ search: searchQuery || '' });
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply recurring filter (client-side — no server-side equivalent)
  const filteredInvoices = useMemo(() => {
    if (!showRecurringOnly) return invoices;
    return invoices.filter((inv: any) => inv.pricing_type === 'recurring' || inv.is_recurring);
  }, [invoices, showRecurringOnly]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters.status, filters.outstanding_only, filters.overdue_only, datePreset, customDateFrom, customDateTo, selectedClientIds, showRecurringOnly]);

  // Use server-side pagination, fallback to client-side for recurring filter
  const totalPages = showRecurringOnly
    ? Math.ceil(filteredInvoices.length / itemsPerPage)
    : Math.ceil((invoices.length > 0 ? invoices.length : 1) / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    if (showRecurringOnly) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
    }
    // Server handles pagination; invoices already represents the current page
    return filteredInvoices;
  }, [filteredInvoices, currentPage, itemsPerPage, showRecurringOnly]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Selection handlers
  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedInvoices.map((inv: any) => inv.id));
    } else {
      setSelectedIds([]);
    }
  }, [paginatedInvoices]);

  const handleSelectOne = useCallback((invoiceId: any) => {
    setSelectedIds(prev =>
      prev.includes(invoiceId)
        ? prev.filter((id: any) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  }, []);

  // Bulk actions
  const handleBulkDeleteClick = useCallback(() => {
    setDeleteTarget('bulk');
    setShowDeleteConfirm(true);
  }, []);

  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      await Promise.all(selectedIds.map((id: any) => deleteInvoice(id)));
      showSuccess(`${selectedIds.length} invoice(s) deleted successfully`);
      setSelectedIds([]);
    } catch (_error) {
      showError('Failed to delete invoices');
    }
  }, [selectedIds, deleteInvoice, showSuccess, showError]);

  const handleBulkDownload = useCallback(async () => {
    if (selectedIds.length === 0) return;

    setIsDownloading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const invoiceId of selectedIds) {
        try {
          const invoice = invoices.find((inv: any) => inv.id === invoiceId);
          const blob = await invoicesAPI.downloadPDF(invoiceId);

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${invoice?.invoice_number || invoiceId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          successCount++;
        } catch (err) {
          console.error(`Failed to download invoice ${invoiceId}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`Downloaded ${successCount} invoice(s) successfully`);
      }
      if (failCount > 0) {
        showError(`Failed to download ${failCount} invoice(s)`);
      }

      setSelectedIds([]);
    } catch (_error) {
      showError('Failed to download invoices');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedIds, invoices, showSuccess, showError]);

  // Individual actions
  const handleEdit = useCallback((invoice: any) => {
    navigate(`/finance/invoices/${invoice.id}/edit`);
    setOpenActionMenuId(null);
  }, [navigate]);

  const handleView = useCallback((invoice: any) => {
    navigate(`/finance/invoices/${invoice.id}`);
    setOpenActionMenuId(null);
  }, [navigate]);

  const handleDeleteClick = useCallback((invoice: any) => {
    setDeleteTarget(invoice);
    setShowDeleteConfirm(true);
    setOpenActionMenuId(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === 'bulk') {
      await handleBulkDeleteConfirm();
    } else if (deleteTarget) {
      try {
        await deleteInvoice(deleteTarget.id);
        showSuccess('Invoice deleted successfully');
      } catch (_error) {
        showError('Failed to delete invoice');
      }
    }
    setDeleteTarget(null);
  }, [deleteTarget, handleBulkDeleteConfirm, deleteInvoice, showSuccess, showError]);

  const handleSend = useCallback((invoice: any) => {
    setInvoiceToSend(invoice);
    setShowSendDialog(true);
    setOpenActionMenuId(null);
  }, []);

  const handleSendReminder = useCallback((invoice: any) => {
    setInvoiceForReminder(invoice);
    setShowReminderDialog(true);
    setOpenActionMenuId(null);
  }, []);

  // Check if invoice can receive a reminder (status: sent, viewed, or partially_paid)
  const canSendReminder = (invoice: any) => {
    return ['sent', 'viewed', 'partially_paid'].includes(invoice?.status);
  };

  const handleSendSuccess = useCallback(() => {
    setShowSendDialog(false);
    setInvoiceToSend(null);
  }, []);

  const handleDownloadPDF = useCallback(async (invoice: any) => {
    setOpenActionMenuId(null);

    try {
      const blob = await invoicesAPI.downloadPDF(invoice.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`Downloaded invoice ${invoice.invoice_number}`);
    } catch (_error) {
      showError('Failed to download PDF');
    }
  }, [showSuccess, showError]);

  const handleClone = useCallback(async (invoice: any) => {
    setOpenActionMenuId(null);

    try {
      // Use context method to clone - this also adds to state immediately
      const clonedInvoice = await cloneInvoice(invoice.id) as Invoice;
      showSuccess(`Invoice cloned successfully. New invoice: ${clonedInvoice.invoice_number}`);
      // Navigate to edit the cloned invoice
      navigate(`/finance/invoices/${clonedInvoice.id}/edit`);
    } catch (error: any) {
      console.error('Failed to clone invoice:', error);
      showError(error.message || 'Failed to clone invoice');
    }
  }, [cloneInvoice, showSuccess, showError, navigate]);

  // Format converted total value for display
  const formatConvertedValue = (converted: any) => {
    if (!converted) return `${getCurrencySymbol('USD')}${formatNumber(0)}`;
    const symbol = converted.currency_symbol || getCurrencySymbol(converted.currency_code || 'USD');
    return `${symbol}${formatNumber(parseFloat(converted.total || 0))}`;
  };

  // Format currency breakdown for subtitle (e.g., "£123.23 + $456.78")
  // Shows breakdown when: multiple currencies OR converted currency differs from original
  const formatCurrencyBreakdown = (byCurrencyArray: any[], convertedCurrency: any) => {
    if (!byCurrencyArray || byCurrencyArray.length === 0) return undefined;

    // Always show breakdown if converted currency is different from original currencies
    const hasConvertedDifference = convertedCurrency &&
      byCurrencyArray.length > 0 &&
      byCurrencyArray.some((item: any) => item.currency_code !== convertedCurrency.currency_code);

    // Show breakdown if multiple currencies OR if converted currency differs
    if (byCurrencyArray.length <= 1 && !hasConvertedDifference) return undefined;

    return byCurrencyArray
      .map((item: any) => `${item.currency_symbol}${formatNumber(parseFloat(item.total || 0))}`)
      .join(' + ');
  };

  // Fallback to single currency display if no converted value
  const getSingleCurrencyDisplay = (byCurrencyArray: any[]) => {
    if (!byCurrencyArray || byCurrencyArray.length === 0) {
      return `${getCurrencySymbol('USD')}${formatNumber(0)}`;
    }
    const item = byCurrencyArray[0];
    return `${item.currency_symbol}${formatNumber(parseFloat(item.total || 0))}`;
  };

  // Apply client filter callback for the Done button
  const handleApplyClientFilter = useCallback(() => {
    setShowClientDropdown(false);
    setClientSearchQuery('');
    updateFilters({
      contact_ids: selectedClientIds.length > 0 ? selectedClientIds.join(',') : null
    });
  }, [selectedClientIds, updateFilters]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <InvoiceKPICards
        loading={loading}
        stats={stats}
        formatConvertedValue={formatConvertedValue}
        getSingleCurrencyDisplay={getSingleCurrencyDisplay}
        formatCurrencyBreakdown={formatCurrencyBreakdown}
      />

      {/* Invoices Section */}
      <div>
        <InvoiceListFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showDateDropdown={showDateDropdown}
          onToggleDateDropdown={() => setShowDateDropdown(!showDateDropdown)}
          onCloseDateDropdown={() => setShowDateDropdown(false)}
          datePreset={datePreset}
          dateType={dateType}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          onDateTypeChange={handleDateTypeChange}
          onDateFilterChange={handleDateFilterChange}
          onCustomDateChange={handleCustomDateChange}
          onClearDateFilter={clearDateFilter}
          getDateFilterLabel={getDateFilterLabel}
          DATE_PRESETS={DATE_PRESETS}
          showClientDropdown={showClientDropdown}
          onToggleClientDropdown={() => setShowClientDropdown(!showClientDropdown)}
          onCloseClientDropdown={() => setShowClientDropdown(false)}
          selectedClientIds={selectedClientIds}
          clientSearchQuery={clientSearchQuery}
          onClientSearchChange={setClientSearchQuery}
          filteredClients={filteredClients}
          allClients={allClients}
          clientsLoading={clientsLoading}
          onClientToggle={handleClientToggle}
          onClearClientSelection={handleClearClientSelection}
          onApplyClientFilter={handleApplyClientFilter}
          getClientDisplayName={getClientDisplayName}
          filterStatus={filterStatus}
          showFilterDropdown={showFilterDropdown}
          onToggleFilterDropdown={() => setShowFilterDropdown(!showFilterDropdown)}
          onCloseFilterDropdown={() => setShowFilterDropdown(false)}
          updateFilters={updateFilters}
          showRecurringOnly={showRecurringOnly}
          onSetShowRecurringOnly={setShowRecurringOnly}
          parentInvoiceId={parentInvoiceId}
          parentTemplateInfo={parentTemplateInfo}
          onClearParentFilter={clearParentFilter}
          selectedIds={selectedIds}
          isDownloading={isDownloading}
          onBulkDownload={handleBulkDownload}
          onBulkDeleteClick={handleBulkDeleteClick}
          onClearSelection={() => setSelectedIds([])}
        />

        {/* Table */}
        <InvoiceListTable
          loading={loading}
          paginatedInvoices={paginatedInvoices}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onView={handleView}
          onEdit={handleEdit}
          onSend={handleSend}
          onSendReminder={handleSendReminder}
          canSendReminder={canSendReminder}
          onDownloadPDF={handleDownloadPDF}
          onClone={handleClone}
          onDeleteClick={handleDeleteClick}
          openActionMenuId={openActionMenuId}
          onSetOpenActionMenuId={setOpenActionMenuId}
          formatNumber={formatNumber}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          filteredInvoicesLength={filteredInvoices.length}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Send Invoice Dialog */}
      <SendInvoiceDialogComponent
        isOpen={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        invoice={invoiceToSend}
        contact={invoiceToSend?.contact}
        onSuccess={handleSendSuccess}
      />

      {/* Send Reminder Dialog */}
      <SendReminderDialogComponent
        isOpen={showReminderDialog}
        onClose={() => setShowReminderDialog(false)}
        invoice={invoiceForReminder}
        contact={invoiceForReminder?.contact}
        onSuccess={() => {
          setShowReminderDialog(false);
          showSuccess('Reminder sent successfully');
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget === 'bulk'
          ? `Delete ${selectedIds.length} Invoice${selectedIds.length !== 1 ? 's' : ''}?`
          : 'Delete Invoice?'
        }
        message={deleteTarget === 'bulk'
          ? `Are you sure you want to delete ${selectedIds.length} selected invoice${selectedIds.length !== 1 ? 's' : ''}? This action cannot be undone.`
          : `Are you sure you want to delete invoice ${deleteTarget?.invoice_number || ''}? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default InvoiceList;
