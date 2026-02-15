import React, { useState, useEffect } from 'react';
import Modal from '../ui/modal/Modal';
import NotesSection from './NotesSection';
import UnifiedTimelineItem from './UnifiedTimelineItem';
import ServicesList from './ServicesList';
import ServiceAutocomplete from './ServiceAutocomplete';
import InlineServiceForm from './InlineServiceForm';
import ContactFinancialsTab from './ContactFinancialsTab';
import ContactFilesTab from './ContactFilesTab';
import ServiceDetailModal from './ServiceDetailModal';
import { useContactActivities } from '../../hooks/crm/useContactActivities';
import { useContacts } from '../../hooks/crm/useContacts';
import { useServices } from '../../hooks/crm/useServices';
import { useCompanyCurrencies } from '../../hooks/crm/useCompanyCurrencies';
import type { CompanyCurrency, Currency } from '../../hooks/crm/useCompanyCurrencies';
import { useCRM } from '../../contexts/CRMContext';
import { useModalState } from '../../hooks/useModalState';
import { getContactDisplayName } from '../../utils/crm/contactUtils';
import { LoadingSpinner } from '../shared';
import type { ContactResponse, ContactServiceResponse, ContactServiceUpdate, ContactActivityResponse, ProjectResponse } from '../../types';

/** Extended contact type that includes runtime-only fields not in the generated schema. */
interface ContactWithExtras extends ContactResponse {
  currency_code?: string | null;
  projects?: ProjectResponse[];
}

/** Contact data as used internally. Initially partial (from list view), then full (after fetching). */
type ContactData = Partial<ContactWithExtras> & { id: string };

interface ContactDetailsPanelProps {
  contact: ContactData | (Record<string, unknown> & { id: string });
  onClose: () => void;
}

const ContactDetailsPanel: React.FC<ContactDetailsPanelProps> = ({ contact: initialContact, onClose }) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [contact, setContact] = useState<ContactData>(initialContact as ContactData);
  const [, setLoadingContact] = useState(false);
  const [selectedService, setSelectedService] = useState<ContactServiceResponse | null>(null);
  const serviceDetailModal = useModalState();
  const { refresh } = useCRM();
  const { activities, loading, error, fetchActivities, loadMore, pagination } = useContactActivities(contact?.id);
  const { createContactService, assignService, updateContactService, unassignService, getContact } = useContacts({}, 0, { skipInitialFetch: true });
  const { fetchServices } = useServices();
  const { companyCurrencies, defaultCurrency, loadData: loadCurrencies } = useCompanyCurrencies();

  // Extract currency objects from company currencies for backward compatibility
  const currencies = companyCurrencies.map((cc: CompanyCurrency) => cc.currency);

  // Resolve contact's default currency code
  // Priority: contact.currency?.code > contact.currency_code > lookup by currency_id > company default
  const getContactDefaultCurrency = () => {
    // If contact has a nested currency object with code
    if (contact?.currency?.code) {
      return contact.currency.code;
    }
    // If contact has a currency_code field directly
    if (contact?.currency_code) {
      return contact.currency_code;
    }
    // If contact has currency_id, look it up in currencies
    if (contact?.currency_id && currencies.length > 0) {
      const contactCurrency = currencies.find((c: Currency) => c.id === contact.currency_id);
      if (contactCurrency?.code) {
        return contactCurrency.code;
      }
    }
    // Fall back to company default currency
    if (defaultCurrency?.currency?.code) {
      return defaultCurrency.currency.code;
    }
    return null;
  };

  // Load currencies when panel opens
  useEffect(() => {
    if (initialContact?.id) {
      loadCurrencies();
    }
  }, [initialContact?.id, loadCurrencies]);

  // Fetch full contact details when panel opens or contact ID changes
  useEffect(() => {
    const loadFullContact = async () => {
      if (initialContact?.id) {
        setLoadingContact(true);
        try {
          const fullContact = await getContact(initialContact.id) as ContactWithExtras;
          setContact(fullContact);
        } catch (err) {
          console.error('Failed to load full contact details:', err);
          setContact(initialContact);
        } finally {
          setLoadingContact(false);
        }
      }
    };
    loadFullContact();
  }, [initialContact?.id, getContact]);

  // Fetch activities when contact changes or timeline tab is opened
  useEffect(() => {
    if (contact?.id && activeTab === 'timeline') {
      fetchActivities();
    }
  }, [contact?.id, activeTab, fetchActivities]);

  // Fetch all services when services tab is opened
  useEffect(() => {
    if (activeTab === 'services') {
      fetchServices();
    }
  }, [activeTab, fetchServices]);

  // Handle service assignment (creates contact-specific service or assigns global service)
  const handleAssignService = async (service: Record<string, unknown>) => {
    try {
      if (service.id) {
        // Existing service from catalog - assign it
        await assignService(contact.id, service.id as string);
      } else {
        // New service - create it directly for this contact (not global)
        await createContactService(contact.id, service as unknown as Parameters<typeof createContactService>[1]);
      }

      // Fetch full contact to get properly serialized services
      // (The POST endpoint returns a raw ORM object without the computed services property)
      const fullContact = await getContact(contact.id) as ContactWithExtras;
      setContact(fullContact);

      // Refresh CRM list to show updated service count/value on contact cards
      refresh();
    } catch (err) {
      console.error('Failed to assign service:', err);
    }
  };

  // Handle service removal
  const handleRemoveService = async (service: ContactServiceResponse) => {
    try {
      await unassignService(contact.id, service.id);
      // Update local contact by removing the service
      setContact((prev: ContactData) => ({
        ...prev,
        services: (prev.services || []).filter((s: ContactServiceResponse) => s.id !== service.id),
      }));

      // Refresh CRM list to show updated service count/value on contact cards
      refresh();
    } catch (err) {
      console.error('Failed to remove service:', err);
    }
  };

  // Handle service update (uses contact-scoped endpoint)
  const handleUpdateService = async (serviceId: string, serviceData: ContactServiceUpdate) => {
    try {
      const updatedService = await updateContactService(contact.id, serviceId, serviceData);

      // Fetch full contact to get complete service data (including currency, status labels, etc.)
      // This ensures ServicesList and other components have all the data they need
      const fullContact = await getContact(contact.id) as ContactWithExtras;
      setContact(fullContact);

      // Refresh CRM list to show updated service values on contact cards
      refresh();

      return updatedService;
    } catch (err) {
      console.error('Failed to update service:', err);
      throw err;
    }
  };

  // Handle opening service detail modal
  const handleServiceClick = (service: ContactServiceResponse) => {
    setSelectedService(service);
    serviceDetailModal.open();
  };

  // Handle refreshing contact after service attribution/invoice changes
  const handleServiceUpdate = async () => {
    try {
      const updatedContact = await getContact(contact.id) as ContactResponse;
      setContact(updatedContact);
      // Also update selected service with fresh data
      if (selectedService) {
        const updatedService = updatedContact.services?.find((s: ContactServiceResponse) => s.id === selectedService.id);
        if (updatedService) {
          setSelectedService(updatedService);
        }
      }
      refresh();
    } catch (err) {
      console.error('Failed to refresh contact:', err);
    }
  };

  if (!contact) return null;

  return (
    <Modal
      open={!!contact}
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
      title="Contact Details"
      size="2xl"
      className="max-h-[90vh]"
    >
      <div className="space-y-4">
        {/* Contact Info */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 text-lg">
            {getContactDisplayName(contact, 'Unnamed Contact')}
          </h3>
          {contact.email && <p className="text-sm text-gray-600 mt-1">{contact.email}</p>}
          {contact.phone && <p className="text-sm text-gray-600 mt-0.5">{`${contact.country_code || ''} ${contact.phone}`.trim()}</p>}
          {contact.business_name && (contact.first_name || contact.last_name) && (
            <p className="text-sm text-gray-500 mt-1">{contact.business_name}</p>
          )}
        </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'text-zenible-primary border-b-2 border-zenible-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'services'
                  ? 'text-zenible-primary border-b-2 border-zenible-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Services
              {contact.services && contact.services.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                  {contact.services.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'text-zenible-primary border-b-2 border-zenible-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
              {activities.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                  {pagination.total}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'financials'
                  ? 'text-zenible-primary border-b-2 border-zenible-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Financials
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'files'
                  ? 'text-zenible-primary border-b-2 border-zenible-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Files
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {activeTab === 'notes' ? (
              <NotesSection contactId={contact.id} />
            ) : activeTab === 'services' ? (
              /* Services Tab */
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Contact Services</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add services directly to this contact. You can select existing services or create new ones inline.
                  </p>
                </div>

                <InlineServiceForm
                  services={contact.services || []}
                  currencies={currencies || []}
                  defaultCurrency={getContactDefaultCurrency()}
                  onAdd={handleAssignService}
                  onUpdate={handleUpdateService}
                  onRemove={handleRemoveService}
                />

                {contact.services && contact.services.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <ServicesList
                      services={contact.services}
                      onDelete={handleRemoveService}
                      onServiceClick={handleServiceClick}
                    />
                  </div>
                )}
              </div>
            ) : activeTab === 'timeline' ? (
              /* Timeline Tab */
              <>
                {loading && activities.length === 0 ? (
                  <LoadingSpinner size="h-8 w-8" height="py-8" />
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 text-sm mb-2">Failed to load timeline</p>
                    <button
                      onClick={() => fetchActivities()}
                      className="text-zenible-primary hover:text-purple-600 text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No timeline activities yet</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Activities will appear here as you interact with this contact
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Timeline Header */}
                    {pagination.total > 0 && (
                      <div className="mb-4 pb-3 border-b border-gray-200">
                        <p className="text-xs text-gray-500">
                          Showing {activities.length} of {pagination.total} activities
                        </p>
                      </div>
                    )}

                    {/* Timeline Items */}
                    {activities.map((activity: ContactActivityResponse, index: number) => (
                      <UnifiedTimelineItem
                        key={activity.id}
                        activity={activity}
                        isLast={index === activities.length - 1 && pagination.page >= pagination.total_pages}
                      />
                    ))}

                    {/* Load More Button */}
                    {pagination.page < pagination.total_pages && (
                      <div className="pt-4 text-center">
                        <button
                          onClick={loadMore}
                          disabled={loading}
                          className="px-4 py-2 text-sm text-zenible-primary hover:text-purple-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              Loading...
                            </span>
                          ) : (
                            'Load More'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : activeTab === 'financials' ? (
              /* Financials Tab */
              <ContactFinancialsTab contactId={contact.id} />
            ) : activeTab === 'files' ? (
              /* Files Tab */
              <ContactFilesTab contactId={contact.id} projects={contact.projects || []} />
            ) : null}
          </div>
      </div>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        isOpen={serviceDetailModal.isOpen}
        onClose={() => {
          serviceDetailModal.close();
          setSelectedService(null);
        }}
        service={selectedService}
        contactId={contact.id}
        onServiceUpdate={handleServiceUpdate}
      />
    </Modal>
  );
};

export default ContactDetailsPanel;
