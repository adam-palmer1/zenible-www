import React, { Suspense, useMemo } from 'react';
import { ContactActionsProvider } from '../../../contexts/ContactActionsContext';
import contactsAPI from '../../../services/api/crm/contacts';

// Lazy-load tab views - only one is rendered at a time
const SalesPipeline = React.lazy(() => import('../SalesPipelineNew'));
const ContactsListView = React.lazy(() => import('../ContactsListView'));
const ClientsView = React.lazy(() => import('../ClientsView'));
const VendorsView = React.lazy(() => import('../VendorsView'));
const ServicesView = React.lazy(() => import('../ServicesView'));
const ProjectsTable = React.lazy(() => import('../ProjectsTable'));

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

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
            <Suspense fallback={<TabLoadingFallback />}>
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
            </Suspense>
          </ContactActionsProvider>
        </div>
      );
    }

    // List view
    return (
      <Suspense fallback={<TabLoadingFallback />}>
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
      </Suspense>
    );
  }

  if (activeTab === 'clients') {
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <ClientsView
          onClientClick={selectContact}
          openContactModal={openContactModal}
          refreshKey={refreshKey}
          {...clientsFilters}
        />
      </Suspense>
    );
  }

  if (activeTab === 'vendors') {
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <VendorsView
          onVendorClick={selectContact}
          openContactModal={openContactModal}
          refreshKey={refreshKey}
          {...vendorsFilters}
        />
      </Suspense>
    );
  }

  if (activeTab === 'services') {
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <ServicesView
          services={services}
          servicesLoading={servicesLoading}
          onEditService={openServiceModal}
          onDeleteService={(service: any) => deleteService(service.id)}
          onClientClick={selectContact}
          refreshKey={refreshKey}
          {...servicesFilters}
        />
      </Suspense>
    );
  }

  if (activeTab === 'projects') {
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <div className="bg-white rounded-lg shadow h-full overflow-hidden">
          <ProjectsTable selectedStatuses={projectsFilters?.selectedStatuses || []} />
        </div>
      </Suspense>
    );
  }

  return null;
};

export default CRMTabContent;
