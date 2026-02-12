import React, { useMemo } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import ServicesTable from './ServicesTable';
import ContactServicesTable from './ContactServicesTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { useContactServices } from '../../hooks/crm/useContactServices';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import contactsAPI from '../../services/api/crm/contacts';

interface ServicesViewProps {
  // Default Services data and handlers
  services: any[];
  servicesLoading: boolean;
  onEditService?: (service: any) => void;
  onDeleteService?: (service: any) => void;
  // Filter state from useServicesFilters
  activeSubtab: string;
  searchQuery: string;
  statusFilters: string[];
  frequencyTypeFilters: string[];
  showHiddenClients?: boolean;
  showHiddenContacts?: boolean;
  showLostContacts?: boolean;
  // Client click handler
  onClientClick?: (client: any) => void;
  // Refresh key
  refreshKey?: number;
}

/**
 * ServicesView Component
 *
 * Displays services with two subtabs:
 * 1. Default Services - Global service catalog (assignable to clients)
 * 2. Client Services - Services assigned to clients
 */
const ServicesView: React.FC<ServicesViewProps> = ({
  // Default Services data and handlers
  services,
  servicesLoading,
  onEditService,
  onDeleteService,
  // Filter state from useServicesFilters
  activeSubtab,
  searchQuery,
  statusFilters,
  frequencyTypeFilters,
  showHiddenClients,
  showHiddenContacts,
  showLostContacts,
  // Client click handler
  onClientClick,
  // Refresh key
  refreshKey = 0,
}) => {
  // Delete confirmation modal state (for default services)
  const deleteConfirm = useDeleteConfirmation<any>();

  // Delete confirmation modal state (for contact services)
  const contactServiceDeleteConfirm = useDeleteConfirmation<any>();

  // Fetch contact services for Client Services subtab
  const {
    filteredServices: filteredContactServices,
    loading: contactServicesLoading,
    refresh: refreshContactServices,
  } = useContactServices(
    {
      searchQuery: activeSubtab === 'client' ? searchQuery : '',
      statusFilters,
      frequencyTypeFilters,
      showHiddenClients,
      showHiddenContacts,
      showLostContacts,
    },
    refreshKey
  );

  // Filter default services by search query (name, description)
  const filteredDefaultServices = useMemo(() => {
    if (!searchQuery || activeSubtab !== 'default') return services;

    const query = searchQuery.toLowerCase();
    return services.filter(
      (service: any) =>
        service.name?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query)
    );
  }, [services, searchQuery, activeSubtab]);

  // Handle delete request (show confirmation modal)
  const handleDeleteRequest = (service: any) => {
    deleteConfirm.requestDelete(service);
  };

  // Handle confirmed delete
  const handleConfirmDelete = () => {
    if (deleteConfirm.item && onDeleteService) {
      onDeleteService(deleteConfirm.item);
    }
    deleteConfirm.cancelDelete();
  };

  // Handle contact service edit (open contact details panel)
  const handleEditContactService = (service: any) => {
    if (onClientClick && service.contact_id) {
      onClientClick({ id: service.contact_id });
    }
  };

  // Handle contact service delete request (show confirmation modal)
  const handleDeleteContactServiceRequest = (service: any) => {
    contactServiceDeleteConfirm.requestDelete(service);
  };

  // Handle confirmed contact service delete
  const handleConfirmContactServiceDelete = async () => {
    const service = contactServiceDeleteConfirm.item;
    if (service) {
      try {
        await contactsAPI.unassignService(service.contact_id, service.id);
        refreshContactServices();
      } catch (error) {
        console.error('Failed to remove contact service:', error);
      }
    }
    contactServiceDeleteConfirm.cancelDelete();
  };

  return (
    <>
      {activeSubtab === 'default' ? (
        <div className="bg-white rounded-lg shadow h-full overflow-hidden">
          <ServicesTable
            services={filteredDefaultServices}
            onEdit={onEditService}
            onDelete={handleDeleteRequest}
            loading={servicesLoading}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow h-full overflow-hidden">
          <ContactServicesTable
            services={filteredContactServices}
            onClientClick={onClientClick}
            onEdit={handleEditContactService}
            onDelete={handleDeleteContactServiceRequest}
            loading={contactServicesLoading}
          />
        </div>
      )}

      {/* Delete Confirmation Modal (Default Services) */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.cancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Service?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to delete "{deleteConfirm.item?.name}"?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Warning: This action cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        icon={TrashIcon}
        iconColor="text-red-600"
      />

      {/* Delete Confirmation Modal (Contact Services) */}
      <ConfirmationModal
        isOpen={contactServiceDeleteConfirm.isOpen}
        onClose={contactServiceDeleteConfirm.cancelDelete}
        onConfirm={handleConfirmContactServiceDelete}
        title="Remove Service?"
        message={
          <p>
            Are you sure you want to remove "{contactServiceDeleteConfirm.item?.name}" from {contactServiceDeleteConfirm.item?.contact_name}?
          </p>
        }
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="red"
        icon={TrashIcon}
        iconColor="text-red-600"
      />
    </>
  );
};

export default ServicesView;
