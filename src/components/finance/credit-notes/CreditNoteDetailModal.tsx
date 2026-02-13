import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, User, Mail, DollarSign, Loader2, Send, Download, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  CREDIT_NOTE_STATUS_LABELS,
  CREDIT_NOTE_STATUS_COLORS,
} from '../../../constants/finance';
import type { CreditNoteStatus } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import { useNotification } from '../../../contexts/NotificationContext';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import { AllocationSummaryBar, ProjectAllocationModal } from '../allocations';
import SendCreditNoteModal from './SendCreditNoteModal';
import ApplyCreditNoteModal from './ApplyCreditNoteModal';
import { useModalState } from '../../../hooks/useModalState';

interface CreditNoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditNote: any;
  onUpdate?: () => void;
}

const CreditNoteDetailModal: React.FC<CreditNoteDetailModalProps> = ({ isOpen, onClose, creditNote: creditNoteProp, onUpdate }) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [creditNote, setCreditNote] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const sendModal = useModalState();
  useEscapeKey(onClose, isOpen);
  const [issuingOrVoiding, setIssuingOrVoiding] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Function to fetch credit note details
  const fetchCreditNoteDetails = async (showLoading: boolean = true) => {
    if (!creditNoteProp?.id) return;

    try {
      if (showLoading) setLoadingDetails(true);
      const data = await creditNotesAPI.get(creditNoteProp.id);
      setCreditNote(data);
    } catch (err: any) {
      console.error('Error fetching credit note details:', err);
      setCreditNote(creditNoteProp);
    } finally {
      if (showLoading) setLoadingDetails(false);
    }
  };

  // Fetch full credit note details when modal opens
  useEffect(() => {
    if (isOpen && creditNoteProp?.id) {
      fetchCreditNoteDetails(true);
    } else if (!isOpen) {
      setCreditNote(null);
    }
  }, [isOpen, creditNoteProp?.id]);

  if (!isOpen || !creditNoteProp) return null;

  // Show loading state while fetching details
  if (loadingDetails || !creditNote) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl p-8 dark:bg-gray-800">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper to get customer display name from contact object
  const getCustomerName = (): string => {
    if (creditNote.contact) {
      const { first_name, last_name, business_name } = creditNote.contact;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return business_name || '-';
    }
    return '-';
  };

  // Helper to get customer email from contact object
  const getCustomerEmail = (): string => {
    return creditNote.contact?.email || '-';
  };

  // Helper to get currency code
  const getCurrencyCode = (): string => {
    return creditNote.currency?.code || creditNote.currency_code || 'USD';
  };

  const handleIssue = async () => {
    if (creditNote.status !== 'draft') return;

    const confirmed = await showConfirm(
      'Issue Credit Note',
      `Are you sure you want to issue credit note ${creditNote.credit_note_number}? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        setIssuingOrVoiding(true);
        await creditNotesAPI.issue(creditNote.id);
        showSuccess('Credit note issued successfully');
        fetchCreditNoteDetails(false);
        if (onUpdate) onUpdate();
      } catch (err: any) {
        showError(err.message || 'Failed to issue credit note');
      } finally {
        setIssuingOrVoiding(false);
      }
    }
  };

  const handleVoid = async () => {
    const confirmed = await showConfirm(
      'Void Credit Note',
      `Are you sure you want to void credit note ${creditNote.credit_note_number}? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        setIssuingOrVoiding(true);
        await creditNotesAPI.void(creditNote.id);
        showSuccess('Credit note voided successfully');
        fetchCreditNoteDetails(false);
        if (onUpdate) onUpdate();
      } catch (err: any) {
        showError(err.message || 'Failed to void credit note');
      } finally {
        setIssuingOrVoiding(false);
      }
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      'Delete Credit Note',
      `Are you sure you want to delete credit note ${creditNote.credit_note_number}? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await creditNotesAPI.delete(creditNote.id);
        showSuccess('Credit note deleted successfully');
        onClose();
        if (onUpdate) onUpdate();
      } catch (err: any) {
        showError(err.message || 'Failed to delete credit note');
      }
    }
  };

  const handleEdit = () => {
    onClose();
    navigate(`/finance/credit-notes/${creditNote.id}/edit`);
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await creditNotesAPI.downloadPdf(creditNote.id, creditNote.credit_note_number);
      showSuccess('PDF downloaded successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendSuccess = () => {
    sendModal.close();
    fetchCreditNoteDetails(false);
    if (onUpdate) onUpdate();
  };

  const handleRemoveAllocation = async (allocationId: string) => {
    const confirmed = await showConfirm(
      'Remove Application',
      'Are you sure you want to remove this credit note application? The invoice balance will be restored.'
    );

    if (confirmed) {
      try {
        await creditNotesAPI.removeApplication(creditNote.id, allocationId);
        showSuccess('Application removed successfully');
        fetchCreditNoteDetails(false);
        if (onUpdate) onUpdate();
      } catch (err: any) {
        showError(err.message || 'Failed to remove application');
      }
    }
  };

  const handleApplySuccess = () => {
    setShowApplyModal(false);
    fetchCreditNoteDetails(false);
    if (onUpdate) onUpdate();
  };

  const canIssue = creditNote.status === 'draft';
  const canVoid = creditNote.status === 'issued';
  const canDelete = creditNote.status === 'draft';
  const canSend = creditNote.status === 'issued';
  const canApply = (creditNote.status === 'issued' || creditNote.status === 'applied') && parseFloat(creditNote.remaining_amount || '0') > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Credit Note Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{creditNote.credit_note_number || creditNote.id?.toString().slice(-8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${CREDIT_NOTE_STATUS_COLORS[creditNote.status as CreditNoteStatus] || 'bg-gray-100 text-gray-700'}`}>
              {CREDIT_NOTE_STATUS_LABELS[creditNote.status as CreditNoteStatus] || creditNote.status}
            </span>
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Amount</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(creditNote.total, getCurrencyCode())}
            </div>
            {creditNote.remaining_amount !== undefined && parseFloat(creditNote.remaining_amount) !== parseFloat(creditNote.total) && (
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Remaining: {formatCurrency(creditNote.remaining_amount, getCurrencyCode())}
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customer */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4" />
                Client
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {getCustomerName()}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getCustomerEmail()}
              </div>
            </div>

            {/* Issue Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                Issue Date
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(creditNote.issue_date)}
              </div>
            </div>

            {/* Reference Invoice */}
            {creditNote.invoice_id && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <FileText className="h-4 w-4" />
                  Reference Invoice
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  #{creditNote.invoice?.invoice_number || creditNote.invoice_id}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {creditNote.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FileText className="h-4 w-4" />
                Notes
              </div>
              <div className="text-sm text-gray-900 dark:text-white bg-gray-50 p-3 rounded-lg dark:bg-gray-900">
                {creditNote.notes}
              </div>
            </div>
          )}

          {/* Line Items Summary */}
          {creditNote.items && creditNote.items.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Line Items</h3>
              <div className="space-y-2">
                {creditNote.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded dark:bg-gray-900">
                    <div className="flex-1">
                      <span className="text-gray-900 dark:text-white">{item.description || 'Item'}</span>
                      <span className="text-gray-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount || (item.quantity * item.unit_price), getCurrencyCode())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applied to Invoices */}
          {creditNote.invoice_allocations?.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Applied to Invoices
              </h3>
              <div className="space-y-1">
                {creditNote.invoice_allocations.map((alloc: any) => (
                  <div key={alloc.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded dark:bg-gray-900">
                    <span className="text-gray-900 dark:text-white">
                      Invoice #{alloc.invoice_number || alloc.invoice?.invoice_number || alloc.invoice_id?.toString().slice(-8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(alloc.amount_applied, getCurrencyCode())}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllocation(alloc.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove application"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Allocations */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <AllocationSummaryBar
              allocations={creditNote.project_allocations || []}
              totalAmount={parseFloat(creditNote.total) || 0}
              currency={getCurrencyCode()}
              onManageClick={() => setShowProjectModal(true)}
              showManageButton={true}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Close
            </button>
            {creditNote.status === 'draft' && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            {canSend && (
              <button
                onClick={() => sendModal.open()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            )}
            {canApply && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                Apply
              </button>
            )}
            {canVoid && (
              <button
                onClick={handleVoid}
                disabled={issuingOrVoiding}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {issuingOrVoiding ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Void
              </button>
            )}
            {canIssue && (
              <button
                onClick={handleIssue}
                disabled={issuingOrVoiding}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {issuingOrVoiding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Issue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Project Allocation Modal */}
      <ProjectAllocationModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
        entityType="credit_note"
        entityId={creditNote?.id}
        entityName={`Credit Note #${creditNote?.credit_note_number || creditNote?.id?.toString().slice(-8)}`}
        entityAmount={parseFloat(creditNote?.total) || 0}
        currency={getCurrencyCode()}
        currentAllocations={creditNote?.project_allocations || []}
        onUpdate={() => {
          fetchCreditNoteDetails(false);
          if (onUpdate) onUpdate();
        }}
      />

      {/* Send Credit Note Modal */}
      {sendModal.isOpen && (
        <SendCreditNoteModal
          isOpen={sendModal.isOpen}
          onClose={sendModal.close}
          creditNote={creditNote}
          contact={creditNote?.contact}
          onSuccess={handleSendSuccess}
        />
      )}

      {/* Apply Credit Note Modal */}
      {showApplyModal && (
        <ApplyCreditNoteModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          creditNote={creditNote}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
};

export default CreditNoteDetailModal;
