import React, { useMemo, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import ServicesTable from './ServicesTable';
import ContactServicesTable from './ContactServicesTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { useContactServices } from '../../hooks/crm/useContactServices';

/**
 * ServicesView Component
 *
 * Displays services with two subtabs:
 * 1. Default Services - Global service catalog (assignable to clients)
 * 2. Client Services - Services assigned to clients
 */
const ServicesView = ({
  // Default Services data and handlers
  services,
  servicesLoading,
  onEditService,
  onDeleteService,
  // Filter state from useServicesFilters
  activeSubtab,
  searchQuery,
  statusFilter,
  frequencyTypeFilter,
  // Client click handler
  onClientClick,
  // Refresh key
  refreshKey = 0,
}) => {
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // Fetch contact services for Client Services subtab
  const {
    filteredServices: filteredContactServices,
    loading: contactServicesLoading,
  } = useContactServices(
    {
      searchQuery: activeSubtab === 'client' ? searchQuery : '',
      status: statusFilter,
      frequencyType: frequencyTypeFilter,
    },
    refreshKey
  );

  // Filter default services by search query
  const filteredDefaultServices = useMemo(() => {
    if (!searchQuery || activeSubtab !== 'default') return services;

    const query = searchQuery.toLowerCase();
    return services.filter(
      (service) =>
        service.name?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query)
    );
  }, [services, searchQuery, activeSubtab]);

  // Handle delete request (show confirmation modal)
  const handleDeleteRequest = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  // Handle confirmed delete
  const handleConfirmDelete = () => {
    if (serviceToDelete && onDeleteService) {
      onDeleteService(serviceToDelete);
    }
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
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
            loading={contactServicesLoading}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Service?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to delete "{serviceToDelete?.name}"?
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
    </>
  );
};

export default ServicesView;
