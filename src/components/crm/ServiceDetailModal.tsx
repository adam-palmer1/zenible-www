import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, LinkIcon, DocumentPlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/modal/Modal';
import { formatCurrency } from '../../utils/currencyUtils';
import { SERVICE_STATUS_LABELS, SERVICE_STATUS_COLORS } from '../../constants/crm';
import { useContacts } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import AttributionsList from './AttributionsList';
import InvoiceLinksList from './InvoiceLinksList';
import AddAttributionModal from './AddAttributionModal';
import AddInvoiceLinkModal from './AddInvoiceLinkModal';
import CreateInvoiceFromServiceModal from './CreateInvoiceFromServiceModal';
import LinkToTemplateModal from './LinkToTemplateModal';
import CreateRecurringTemplateModal from './CreateRecurringTemplateModal';
import ConfirmationModal from '../common/ConfirmationModal';

interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  contactId: string;
  onServiceUpdate?: () => void;
}

/**
 * Modal showing full service details with attributions and invoice links
 */
const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  isOpen,
  onClose,
  service,
  contactId,
  onServiceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [attributions, setAttributions] = useState<any[]>([]);
  const [invoiceLinks, setInvoiceLinks] = useState<any[]>([]);
  const [loadingAttributions, setLoadingAttributions] = useState(false);
  const [loadingInvoiceLinks, setLoadingInvoiceLinks] = useState(false);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [showInvoiceLinkModal, setShowInvoiceLinkModal] = useState(false);
  // New modal states
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showLinkTemplateModal, setShowLinkTemplateModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const { showError, showSuccess } = useNotification() as any;

  const {
    listAttributions,
    createAttribution,
    deleteAttribution,
    listInvoiceLinks,
    createInvoiceLink,
    deleteInvoiceLink,
    unlinkServiceFromTemplate,
  } = useContacts({}, 0, { skipInitialFetch: true }) as any;

  // Load attributions when tab is selected
  useEffect(() => {
    if (isOpen && service && contactId && activeTab === 'attributions') {
      loadAttributions();
    }
  }, [isOpen, service, contactId, activeTab]);

  // Load invoice links when tab is selected
  useEffect(() => {
    if (isOpen && service && contactId && activeTab === 'invoices') {
      loadInvoiceLinks();
    }
  }, [isOpen, service, contactId, activeTab]);

  const loadAttributions = async () => {
    try {
      setLoadingAttributions(true);
      const data = await listAttributions(contactId, service.id);
      setAttributions(data || []);
    } catch (error) {
      console.error('Failed to load attributions:', error);
    } finally {
      setLoadingAttributions(false);
    }
  };

  const loadInvoiceLinks = async () => {
    try {
      setLoadingInvoiceLinks(true);
      const data = await listInvoiceLinks(contactId, service.id);
      setInvoiceLinks(data || []);
    } catch (error) {
      console.error('Failed to load invoice links:', error);
    } finally {
      setLoadingInvoiceLinks(false);
    }
  };

  const handleCreateAttribution = async (data: any) => {
    await createAttribution(contactId, service.id, data);
    await loadAttributions();
    onServiceUpdate?.();
  };

  const handleDeleteAttribution = async (attributionId: string) => {
    await deleteAttribution(contactId, service.id, attributionId);
    await loadAttributions();
    onServiceUpdate?.();
  };

  const handleCreateInvoiceLink = async (data: any) => {
    await createInvoiceLink(contactId, service.id, data);
    await loadInvoiceLinks();
    onServiceUpdate?.();
  };

  const handleDeleteInvoiceLink = async (invoiceLinkId: string) => {
    await deleteInvoiceLink(contactId, service.id, invoiceLinkId);
    await loadInvoiceLinks();
    onServiceUpdate?.();
  };

  // Handle unlink service from template
  const handleUnlink = async () => {
    try {
      setUnlinking(true);
      await unlinkServiceFromTemplate(contactId, service.id);
      showSuccess('Service unlinked from template');
      setShowUnlinkConfirm(false);
      onServiceUpdate?.();
    } catch (error: any) {
      showError(error.message || 'Failed to unlink service');
    } finally {
      setUnlinking(false);
    }
  };

  // Handle successful actions from modals
  const handleActionSuccess = () => {
    loadInvoiceLinks();
    onServiceUpdate?.();
  };

  if (!service) return null;

  // Calculate progress
  const price = parseFloat(service.price) || 0;
  const totalAttributed = parseFloat(service.total_attributed) || 0;
  const totalInvoiced = parseFloat(service.total_invoiced) || 0;
  const amountRemaining = parseFloat(service.amount_remaining) ?? price;
  const hasProgress = totalAttributed > 0 || totalInvoiced > 0;
  const invoicedPercent = price > 0 ? (totalInvoiced / price) * 100 : 0;
  const attributedPercent = price > 0 ? (totalAttributed / price) * 100 : 0;

  // Check service type and locked state
  const isRecurring = service.frequency_type === 'recurring';
  const isLocked = service.is_locked;
  const linkedTemplate = service.linked_invoice_template;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attributions', label: 'Attributions' },
    { id: 'invoices', label: 'Invoice Links' },
  ];

  return (
    <>
      <Modal
        open={isOpen}
        onOpenChange={onClose}
        title={service.name}
        size="2xl"
      >
        <div className="space-y-6">
          {/* Header with status badge */}
          <div className="flex items-center gap-3 flex-wrap">
            {service.status && (
              <span className={`text-sm px-3 py-1 rounded-full ${(SERVICE_STATUS_COLORS as any)[service.status] || 'bg-gray-100 text-gray-800'}`}>
                {(SERVICE_STATUS_LABELS as any)[service.status] || service.status}
              </span>
            )}
            {isRecurring && (
              <span className="text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full">
                {service.time_period}
              </span>
            )}
            {isLocked && (
              <span className="text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full flex items-center gap-1">
                <LinkIcon className="h-3 w-3" />
                Linked
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-zenible-primary text-zenible-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              {service.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h4>
                  <p className="text-gray-900 dark:text-white">{service.description}</p>
                </div>
              )}

              {/* Value Breakdown */}
              {price > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Value Breakdown</h4>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full flex">
                        {invoicedPercent > 0 && (
                          <div
                            className="bg-green-500 h-full"
                            style={{ width: `${Math.min(invoicedPercent, 100)}%` }}
                          />
                        )}
                        {attributedPercent > 0 && (
                          <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${Math.min(attributedPercent, 100 - invoicedPercent)}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>{Math.round(invoicedPercent + attributedPercent)}% allocated</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Value</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(price, service.currency?.code)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        Invoiced
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatCurrency(totalInvoiced, service.currency?.code)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        Attributed
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatCurrency(totalAttributed, service.currency?.code)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-900 dark:text-white">Remaining</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(amountRemaining, service.currency?.code)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Linked Template Info */}
              {isLocked && linkedTemplate && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Linked to Invoice Template
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          {linkedTemplate.invoice_number || `Template #${linkedTemplate.id?.slice(0, 8)}`}
                        </p>
                        {linkedTemplate.recurring_frequency && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                            {linkedTemplate.recurring_frequency} - {linkedTemplate.recurring_status || 'Active'}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUnlinkConfirm(true)}
                      className="text-sm text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100 underline"
                    >
                      Unlink
                    </button>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
                    This service is managed by the linked template. To edit the service, unlink it first.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attributions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Partial Attributions
                </h4>
                <button
                  onClick={() => setShowAttributionModal(true)}
                  disabled={amountRemaining <= 0}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-zenible-primary border border-zenible-primary rounded-lg hover:bg-zenible-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Attribution
                </button>
              </div>
              <AttributionsList
                attributions={attributions}
                loading={loadingAttributions}
                onDelete={handleDeleteAttribution}
                currencyCode={service.currency?.code}
              />
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {/* Header and Actions - Different for one-off vs recurring */}
              {!isRecurring ? (
                // One-off Service Actions
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Invoice Links
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateInvoiceModal(true)}
                      disabled={amountRemaining <= 0}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DocumentPlusIcon className="h-4 w-4 mr-1" />
                      Create Invoice
                    </button>
                    <button
                      onClick={() => setShowInvoiceLinkModal(true)}
                      disabled={amountRemaining <= 0}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-zenible-primary border border-zenible-primary rounded-lg hover:bg-zenible-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Link Existing
                    </button>
                  </div>
                </div>
              ) : isLocked ? (
                // Locked Recurring Service
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Invoice Links
                  </h4>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <LinkIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Managed by linked template</span>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Invoices are automatically generated by the linked recurring invoice template.
                    </p>
                  </div>
                </div>
              ) : (
                // Recurring Service (not locked) Actions
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Recurring Invoice Setup
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateTemplateModal(true)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                      Create Template
                    </button>
                    <button
                      onClick={() => setShowLinkTemplateModal(true)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-zenible-primary border border-zenible-primary rounded-lg hover:bg-zenible-primary hover:text-white transition-colors"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Link to Template
                    </button>
                  </div>
                </div>
              )}

              {/* Invoice Links List - Show for all types */}
              <InvoiceLinksList
                invoiceLinks={invoiceLinks}
                loading={loadingInvoiceLinks}
                onDelete={!isLocked ? handleDeleteInvoiceLink : undefined}
                currencyCode={service.currency?.code}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Add Attribution Modal */}
      <AddAttributionModal
        isOpen={showAttributionModal}
        onClose={() => setShowAttributionModal(false)}
        onSubmit={handleCreateAttribution}
        amountRemaining={amountRemaining}
        currencyCode={service.currency?.code}
      />

      {/* Add Invoice Link Modal */}
      <AddInvoiceLinkModal
        isOpen={showInvoiceLinkModal}
        onClose={() => setShowInvoiceLinkModal(false)}
        onSubmit={handleCreateInvoiceLink}
        amountRemaining={amountRemaining}
        currencyCode={service.currency?.code}
        contactId={contactId}
      />

      {/* Create Invoice from Service Modal (One-off) */}
      <CreateInvoiceFromServiceModal
        isOpen={showCreateInvoiceModal}
        onClose={() => setShowCreateInvoiceModal(false)}
        service={service}
        contactId={contactId}
        onSuccess={handleActionSuccess}
      />

      {/* Link to Template Modal (Recurring) */}
      <LinkToTemplateModal
        isOpen={showLinkTemplateModal}
        onClose={() => setShowLinkTemplateModal(false)}
        service={service}
        contactId={contactId}
        onSuccess={handleActionSuccess}
      />

      {/* Create Recurring Template Modal */}
      <CreateRecurringTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        service={service}
        contactId={contactId}
        onSuccess={handleActionSuccess}
      />

      {/* Unlink Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUnlinkConfirm}
        onClose={() => setShowUnlinkConfirm(false)}
        onConfirm={handleUnlink}
        title="Unlink Service from Template?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to unlink this service from the invoice template?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The service will become editable again, but will no longer be synchronized with the template.
            </p>
          </div>
        }
        confirmText={unlinking ? 'Unlinking...' : 'Unlink'}
        cancelText="Cancel"
        confirmColor="purple"
        icon={LinkIcon}
        iconColor="text-purple-600"
      />
    </>
  );
};

export default ServiceDetailModal;
