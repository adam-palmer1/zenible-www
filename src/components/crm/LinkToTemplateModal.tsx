import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, LinkIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/modal/Modal';
import { formatCurrency } from '../../utils/currencyUtils';
import { useNotification } from '../../contexts/NotificationContext';
import { useContacts } from '../../hooks/crm';
import { invoicesAPI } from '../../services/api/finance';

interface LinkToTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  contactId: string;
  onSuccess?: () => void;
}

const LinkToTemplateModal: React.FC<LinkToTemplateModalProps> = ({
  isOpen,
  onClose,
  service,
  contactId,
  onSuccess,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { linkServiceToTemplate } = useContacts({}, 0, { skipInitialFetch: true });

  const currencyCode = service?.currency?.code || 'USD';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      setSearchQuery('');
      setTemplates([]);
    }
  }, [isOpen]);

  // Search for recurring invoice templates (debounced)
  useEffect(() => {
    const searchTemplates = async () => {
      if (!isOpen || !contactId) return;

      try {
        setSearching(true);
        // Fetch recurring invoice templates for this contact
        // Backend requires: pricing_type=recurring + is_parent_only=true
        const params: Record<string, string> = {
          contact_ids: contactId,
          pricing_type: 'recurring',
          is_parent_only: 'true',
          per_page: '20',
        };
        // Only add search param if there's a query
        if (searchQuery && searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        const response = await invoicesAPI.list(params);
        setTemplates(response?.items || []);
      } catch (error) {
        console.error('Failed to search templates:', error);
      } finally {
        setSearching(false);
      }
    };

    // Debounce search by 300ms
    const debounceTimer = setTimeout(searchTemplates, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, contactId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate) {
      showError('Please select a template');
      return;
    }

    try {
      setLoading(true);
      await linkServiceToTemplate(contactId, service.id, selectedTemplate.id);
      showSuccess('Service linked to template successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showError(error.message || 'Failed to link service to template');
    } finally {
      setLoading(false);
    }
  };

  if (!service) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Link to Invoice Template"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                This will lock the service
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Once linked, this service cannot be edited. The service amount and status will be managed by the linked invoice template.
              </p>
            </div>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Service: {service.name}
          </h4>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Price: <span className="text-gray-900 dark:text-white font-medium">
                {formatCurrency(parseFloat(service.price) || 0, currencyCode)}
              </span>
            </span>
            {service.time_period && (
              <span className="text-gray-500 dark:text-gray-400">
                Period: <span className="text-gray-900 dark:text-white font-medium">
                  {service.time_period}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Template Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Invoice Template
          </label>
          {selectedTemplate ? (
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedTemplate.invoice_number || `Template #${selectedTemplate.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(parseFloat(selectedTemplate.total || 0), selectedTemplate.currency?.code)}
                    {' - '}
                    {selectedTemplate.recurring_frequency || 'Recurring'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="text-sm text-red-600 hover:text-red-700 dark:hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Search recurring templates..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zenible-primary"></div>
                </div>
              )}
              {templates.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {templates.map((template: any) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {template.invoice_number || `Template #${template.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(parseFloat(template.total || 0), template.currency?.code)}
                        {' - '}
                        {template.recurring_frequency || 'Recurring'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {!searching && templates.length === 0 && isOpen && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery.length >= 2
                    ? 'No recurring templates found for this contact'
                    : 'Start typing to search templates, or view all active recurring templates'
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkIcon className="h-4 w-4" />
            {loading ? 'Linking...' : 'Link Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LinkToTemplateModal;
