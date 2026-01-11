import React from 'react';
import SalesPipeline from '../SalesPipeline';
import ContactsListView from '../ContactsListView';
import ClientsView from '../ClientsView';
import VendorsView from '../VendorsView';
import ServicesTable from '../ServicesTable';
import ProjectsTable from '../ProjectsTable';
import { ContactActionsProvider } from '../../../contexts/ContactActionsContext';
import contactsAPI from '../../../services/api/crm/contacts';

/**
 * CRMTabContent - Routes to appropriate view based on active tab
 *
 * @param {string} activeTab - Current active tab
 * @param {boolean} contactsLoading - Whether contacts are loading
 * @param {string} viewMode - Current view mode ('pipeline' | 'list')
 * @param {Array} filteredContacts - Filtered contacts array
 * @param {Array} allStatuses - All statuses (global + custom)
 * @param {Array} globalStatuses - Global statuses
 * @param {Array} customStatuses - Custom statuses
 * @param {Array} selectedStatuses - Selected status IDs for filtering
 * @param {Function} selectContact - Select contact for details panel
 * @param {Function} openContactModal - Open add/edit contact modal
 * @param {Function} updateContact - Update contact
 * @param {Function} refreshWithScrollPreservation - Refresh with scroll preservation
 * @param {string} sortOrder - Current sort order
 * @param {Function} handleStatusUpdate - Handle status update callback
 * @param {Array} services - Services array
 * @param {boolean} servicesLoading - Whether services are loading
 * @param {Function} openServiceModal - Open add/edit service modal
 * @param {Function} deleteService - Delete service
 * @param {number} refreshKey - Key for triggering refresh
 * @param {Object} clientsFilters - Clients tab filter state and handlers
 */
const CRMTabContent = ({
  activeTab,
  contactsLoading,
  viewMode,
  filteredContacts,
  allStatuses,
  globalStatuses,
  customStatuses,
  selectedStatuses,
  selectContact,
  openContactModal,
  updateContact,
  refreshWithScrollPreservation,
  sortOrder,
  handleStatusUpdate,
  services,
  servicesLoading,
  openServiceModal,
  deleteService,
  refreshKey,
  clientsFilters,
}) => {
  if (activeTab === 'crm') {
    if (contactsLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (viewMode === 'pipeline') {
      return (
        <div className="h-full">
          <ContactActionsProvider
            globalStatuses={globalStatuses}
            customStatuses={customStatuses}
            onEdit={openContactModal}
            onDelete={async (contact) => {
              await contactsAPI.delete(contact.id);
              refreshWithScrollPreservation();
            }}
            onUpdateStatus={async (contactId, updateData) => {
              return await updateContact(contactId, updateData);
            }}
            onRefreshContacts={refreshWithScrollPreservation}
          >
            <SalesPipeline
              contacts={filteredContacts}
              statuses={
                selectedStatuses.length > 0
                  ? allStatuses.filter((s) => selectedStatuses.includes(s.id))
                  : allStatuses
              }
              globalStatuses={globalStatuses}
              customStatuses={customStatuses}
              onAddContact={() => openContactModal()}
              onContactClick={selectContact}
              onUpdateContact={updateContact}
              sortOrder={sortOrder}
              onStatusUpdate={handleStatusUpdate}
              onRefresh={refreshWithScrollPreservation}
            />
          </ContactActionsProvider>
        </div>
      );
    }

    // List view
    return (
      <ContactsListView
        contacts={filteredContacts}
        statuses={allStatuses}
        onContactClick={selectContact}
        onEdit={openContactModal}
        onDelete={async (contact) => {
          await contactsAPI.delete(contact.id);
          window.location.reload(); // Temporary - should use proper refresh
        }}
        onUpdateStatus={async (contactId, updateData) => {
          return await updateContact(contactId, updateData);
        }}
      />
    );
  }

  if (activeTab === 'clients') {
    return (
      <ClientsView
        onClientClick={selectContact}
        openContactModal={openContactModal}
        refreshKey={refreshKey}
        {...clientsFilters}
      />
    );
  }

  if (activeTab === 'vendors') {
    return <VendorsView onVendorClick={selectContact} openContactModal={openContactModal} refreshKey={refreshKey} />;
  }

  if (activeTab === 'services') {
    return (
      <div className="bg-white rounded-lg shadow h-full overflow-hidden">
        <ServicesTable
          services={services}
          onEdit={openServiceModal}
          onDelete={(service) => {
            if (window.confirm('Are you sure you want to delete this service?')) {
              deleteService(service.id);
            }
          }}
          loading={servicesLoading}
        />
      </div>
    );
  }

  if (activeTab === 'projects') {
    return (
      <div className="bg-white rounded-lg shadow h-full overflow-hidden">
        <ProjectsTable />
      </div>
    );
  }

  return null;
};

export default CRMTabContent;
