import React, { useMemo } from 'react';
import SalesPipeline from '../SalesPipelineNew';
import ContactsListView from '../ContactsListView';
import ClientsView from '../ClientsView';
import VendorsView from '../VendorsView';
import ServicesView from '../ServicesView';
import ProjectsTable from '../ProjectsTable';
import { ContactActionsProvider } from '../../../contexts/ContactActionsContext';
import contactsAPI from '../../../services/api/crm/contacts';

interface CRMTabContentProps {
  activeTab: string;
  contactsLoading: boolean;
  viewMode: string;
  filteredContacts: any[];
  allStatuses: any[];
  globalStatuses: any[];
  customStatuses: any[];
  selectedStatuses: string[];
  selectContact: (contact: any) => void;
  openContactModal: (...args: any[]) => void;
  updateContact: (contactId: string, data: any) => Promise<any>;
  refreshWithScrollPreservation: () => void;
  sortOrder: string;
  handleStatusUpdate: (...args: any[]) => void;
  services: any[];
  servicesLoading: boolean;
  openServiceModal: (...args: any[]) => void;
  deleteService: (id: string) => void;
  refreshKey: number;
  clientsFilters: any;
  vendorsFilters: any;
  projectsFilters: any;
  servicesFilters: any;
  columnOrder?: string[];
  handleColumnReorder: (order: string[]) => void;
}

/**
 * CRMTabContent - Routes to appropriate view based on active tab
 */
const CRMTabContent: React.FC<CRMTabContentProps> = ({
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
  vendorsFilters,
  projectsFilters,
  servicesFilters,
  columnOrder = [],
  handleColumnReorder,
}) => {
  // Apply column order to statuses
  const orderedStatuses = useMemo(() => {
    // First filter by selected statuses if any
    const filteredStatuses = selectedStatuses.length > 0
      ? allStatuses.filter((s: any) => selectedStatuses.includes(s.id))
      : allStatuses;

    // Then apply saved column order
    if (columnOrder.length === 0) return filteredStatuses;

    const orderMap = new Map(columnOrder.map((id, index) => [id, index]));
    return [...filteredStatuses].sort((a: any, b: any) => {
      const orderA = orderMap.get(a.id) ?? Infinity;
      const orderB = orderMap.get(b.id) ?? Infinity;
      return orderA - orderB;
    });
  }, [allStatuses, selectedStatuses, columnOrder]);

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
            onDelete={async (contact: any) => {
              await contactsAPI.delete(contact.id);
              refreshWithScrollPreservation();
            }}
            onUpdateStatus={async (contactId: string, updateData: any) => {
              return await updateContact(contactId, updateData);
            }}
            onRefreshContacts={refreshWithScrollPreservation}
          >
            <SalesPipeline
              contacts={filteredContacts}
              statuses={orderedStatuses}
              globalStatuses={globalStatuses}
              customStatuses={customStatuses}
              onAddContact={() => openContactModal()}
              onContactClick={selectContact}
              onUpdateContact={updateContact}
              sortOrder={sortOrder}
              onStatusUpdate={handleStatusUpdate}
              onRefresh={refreshWithScrollPreservation}
              onColumnReorder={handleColumnReorder}
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
        onDelete={async (contact: any) => {
          await contactsAPI.delete(contact.id);
          window.location.reload(); // Temporary - should use proper refresh
        }}
        onUpdateStatus={async (contactId: string, updateData: any) => {
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
    return (
      <VendorsView
        onVendorClick={selectContact}
        openContactModal={openContactModal}
        refreshKey={refreshKey}
        {...vendorsFilters}
      />
    );
  }

  if (activeTab === 'services') {
    return (
      <ServicesView
        services={services}
        servicesLoading={servicesLoading}
        onEditService={openServiceModal}
        onDeleteService={(service: any) => deleteService(service.id)}
        onClientClick={selectContact}
        refreshKey={refreshKey}
        {...servicesFilters}
      />
    );
  }

  if (activeTab === 'projects') {
    return (
      <div className="bg-white rounded-lg shadow h-full overflow-hidden">
        <ProjectsTable selectedStatuses={projectsFilters?.selectedStatuses || []} />
      </div>
    );
  }

  return null;
};

export default CRMTabContent;
