import React, { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import CRMLayout from './layout/CRMLayout';
import CRMTopBar from './layout/CRMTopBar';
import CRMHeader from './layout/CRMHeader';
import CRMTabContent from './layout/CRMTabContent';
import { useCRM } from '../../contexts/CRMContext';
import { useContacts, useContactStatuses, useServices } from '../../hooks/crm';
import contactsAPI from '../../services/api/crm/contacts';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useCRMFilters } from '../../hooks/crm/useCRMFilters';
import { useClientsFilters } from '../../hooks/crm/useClientsFilters';
import { useVendorsFilters } from '../../hooks/crm/useVendorsFilters';
import { useProjectsFilters } from '../../hooks/crm/useProjectsFilters';
import { useServicesFilters } from '../../hooks/crm/useServicesFilters';

// Lazy-load filter bars (conditionally rendered per active tab)
const CRMFiltersBar = React.lazy(() => import('./filters/CRMFiltersBar'));
const ClientsFiltersBar = React.lazy(() => import('./filters/ClientsFiltersBar'));
const VendorsFiltersBar = React.lazy(() => import('./filters/VendorsFiltersBar'));
const ProjectsFiltersBar = React.lazy(() => import('./filters/ProjectsFiltersBar'));
const ServicesFiltersBar = React.lazy(() => import('./filters/ServicesFiltersBar'));

// Lazy-load modals and panels (only rendered when opened)
const AddContactModal = React.lazy(() => import('./AddContactModal'));
const AddServiceModal = React.lazy(() => import('./AddServiceModal'));
const AddProjectModal = React.lazy(() => import('./AddProjectModal'));
const ContactDetailsPanel = React.lazy(() => import('./ContactDetailsPanel'));
const CRMSettingsModal = React.lazy(() => import('./CRMSettingsModal'));

const CRMDashboard: React.FC = () => {
  // URL-based tab navigation
  const { tab } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Validate tab value and determine active tab
  const validTabs = ['crm', 'clients', 'vendors', 'services', 'projects'];
  const activeTab = tab && validTabs.includes(tab) ? tab : 'crm';

  // Function to change tabs (updates URL)
  const setActiveTab = useCallback((newTab: string) => {
    if (newTab === 'crm') {
      navigate('/crm', { replace: false });
    } else {
      navigate(`/crm/${newTab}`, { replace: false });
    }
  }, [navigate]);

  // Redirect to default if invalid tab
  useEffect(() => {
    if (tab && !validTabs.includes(tab)) {
      navigate('/crm', { replace: true });
    }
  }, [tab, navigate]);

  const [showCRMSettings, setShowCRMSettings] = useState(false);

  // Scroll position ref for scroll preservation
  const savedScrollPosition = useRef(0);

  // CRM Context
  const {
    viewMode,
    setViewMode,
    showContactModal,
    showServiceModal,
    showProjectModal,
    editingContact,
    editingService,
    editingProject,
    selectedContact,
    openContactModal,
    closeContactModal,
    openServiceModal,
    closeServiceModal,
    openProjectModal,
    closeProjectModal,
    selectContact,
    clearSelectedContact,
    filters,
    updateFilters,
    refreshKey,
    refresh,
  } = useCRM();

  // Preferences
  const { updatePreference } = usePreferences();

  // Data hooks
  const { globalStatuses, customStatuses, statusRoles, fetchStatuses } = useContactStatuses();
  const { services, loading: servicesLoading, deleteService } = useServices({}, refreshKey);

  // Combine statuses
  const allStatuses = [...(globalStatuses || []), ...(customStatuses || [])];

  // CRM Filters Hook - Consolidates all filter logic
  const {
    selectedStatuses,
    showHidden,
    sortOrder,
    columnOrder,
    filtersLoaded,
    contactFilters,
    filteredContacts: _statusFilteredContacts,
    activeFilterCount,
    handleStatusToggle,
    handleClearStatuses,
    handleShowHiddenToggle,
    handleSortOrderChange,
    handleColumnReorder,
    clearAllFilters,
  } = useCRMFilters([], filters as unknown as Record<string, unknown>, allStatuses.map(s => s.id));

  // Clients Filters Hook - Manages clients tab filter state
  const clientsFilters = useClientsFilters();

  // Vendors Filters Hook - Manages vendors tab filter state
  const vendorsFilters = useVendorsFilters();

  // Projects Filters Hook - Manages projects tab filter state
  const projectsFilters = useProjectsFilters();

  // Services Filters Hook - Manages services tab filter state
  const servicesFilters = useServicesFilters();

  // Load contacts with combined filters
  const { contacts, loading: contactsLoading, updateContact, deleteContact } = useContacts(contactFilters, refreshKey, { skipInitialFetch: !filtersLoaded });

  // Apply remaining client-side status filters (hidden filtering is now server-side)
  const filteredContacts = (contacts || []).filter((contact: any) => {
    const contactStatusId =
      contact.current_global_status_id || contact.current_custom_status_id;

    // Filter out contacts without any status
    if (!contactStatusId) {
      return false;
    }

    // If specific statuses are selected, filter by those
    if (selectedStatuses.length > 0) {
      return selectedStatuses.includes(contactStatusId);
    }

    // Otherwise, show all contacts that have a status
    return true;
  });

  // Scroll-preserving refresh wrapper
  const refreshWithScrollPreservation = useCallback(() => {
    savedScrollPosition.current = 0; // Will be set by layout component
    refresh();
  }, [refresh]);

  // Handle status update (refresh statuses after inline column rename)
  const handleStatusUpdate = useCallback(async () => {
    try {
      await fetchStatuses(true);
    } catch (error) {
      console.error('Failed to refresh statuses:', error);
    }
  }, [fetchStatuses]);

  // Handle CRM settings change (refresh both statuses and contacts)
  const handleCRMSettingsChange = useCallback(async () => {
    try {
      await fetchStatuses(true);
      refresh();
    } catch (error) {
      console.error('Failed to refresh CRM data:', error);
    }
  }, [fetchStatuses, refresh]);

  // Handle contact query parameter - open contact details panel
  useEffect(() => {
    const contactId = searchParams.get('contact');
    if (contactId && !selectedContact) {
      const loadContact = async () => {
        try {
          const contact = await contactsAPI.get(contactId);
          if (contact) {
            selectContact(contact);
          }
        } catch (error) {
          console.error('Failed to load contact:', error);
        }
        // Clear the query param after loading
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('contact');
        setSearchParams(newParams, { replace: true });
      };
      loadContact();
    }
  }, [searchParams, setSearchParams, selectContact, selectedContact]);

  return (
    <CRMLayout
      refreshKey={refreshKey}
      savedScrollPosition={savedScrollPosition}
      header={
        <>
          {/* Top Bar - Always visible */}
          <CRMTopBar
            viewMode={viewMode}
            setViewMode={setViewMode}
            openContactModal={openContactModal}
            openServiceModal={openServiceModal}
            openProjectModal={openProjectModal}
            setShowCRMSettings={setShowCRMSettings}
            updatePreference={updatePreference}
            activeTab={activeTab}
          />

          {/* Page Header with Tabs */}
          <CRMHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          >
            {/* CRM tab filters */}
            {activeTab === 'crm' && (
              <Suspense fallback={null}>
                <CRMFiltersBar
                  filters={filters}
                  updateFilters={updateFilters}
                  allStatuses={allStatuses}
                  selectedStatuses={selectedStatuses}
                  handleStatusToggle={handleStatusToggle}
                  handleClearStatuses={handleClearStatuses}
                  showHidden={showHidden}
                  handleShowHiddenToggle={handleShowHiddenToggle}
                  sortOrder={sortOrder}
                  handleSortOrderChange={handleSortOrderChange}
                  activeFilterCount={activeFilterCount}
                  clearAllFilters={clearAllFilters}
                  inline={true}
                />
              </Suspense>
            )}

            {/* Clients tab filters */}
            {activeTab === 'clients' && (
              <Suspense fallback={null}>
                <ClientsFiltersBar
                  searchQuery={clientsFilters.searchQuery}
                  onSearchChange={clientsFilters.setSearchQuery}
                  showHidden={clientsFilters.showHiddenClients}
                  onShowHiddenToggle={clientsFilters.handleShowHiddenToggle}
                  showPreferredCurrency={clientsFilters.showPreferredCurrency}
                  onPreferredCurrencyToggle={clientsFilters.handlePreferredCurrencyToggle}
                  visibleColumns={clientsFilters.visibleColumns}
                  availableColumns={clientsFilters.availableColumns}
                  columnsByCategory={clientsFilters.columnsByCategory}
                  onToggleColumn={clientsFilters.toggleColumnVisibility}
                  showColumnSelector={clientsFilters.showColumnSelector}
                  setShowColumnSelector={clientsFilters.setShowColumnSelector}
                  columnSelectorRef={clientsFilters.columnSelectorRef as React.RefObject<HTMLDivElement>}
                  fieldsLoading={clientsFilters.fieldsLoading}
                />
              </Suspense>
            )}

            {/* Vendors tab filters */}
            {activeTab === 'vendors' && (
              <Suspense fallback={null}>
                <VendorsFiltersBar
                  searchQuery={vendorsFilters.searchQuery}
                  onSearchChange={vendorsFilters.setSearchQuery}
                  showHidden={vendorsFilters.showHiddenVendors}
                  onShowHiddenToggle={vendorsFilters.handleShowHiddenToggle}
                  showPreferredCurrency={vendorsFilters.showPreferredCurrency}
                  onPreferredCurrencyToggle={vendorsFilters.handlePreferredCurrencyToggle}
                  visibleColumns={vendorsFilters.visibleColumns}
                  availableColumns={vendorsFilters.availableColumns}
                  onToggleColumn={vendorsFilters.toggleColumnVisibility}
                  showColumnSelector={vendorsFilters.showColumnSelector}
                  setShowColumnSelector={vendorsFilters.setShowColumnSelector}
                  columnSelectorRef={vendorsFilters.columnSelectorRef as React.RefObject<HTMLDivElement>}
                />
              </Suspense>
            )}

            {/* Projects tab filters */}
            {activeTab === 'projects' && (
              <Suspense fallback={null}>
                <ProjectsFiltersBar
                  selectedStatuses={projectsFilters.selectedStatuses}
                  onStatusToggle={projectsFilters.handleStatusToggle}
                  onClearStatuses={projectsFilters.handleClearStatuses}
                  searchQuery={projectsFilters.searchQuery}
                  onSearchChange={projectsFilters.setSearchQuery}
                  showHiddenContacts={projectsFilters.showHiddenContacts}
                  onShowHiddenContactsToggle={() => projectsFilters.setShowHiddenContacts(!projectsFilters.showHiddenContacts)}
                  showLostContacts={projectsFilters.showLostContacts}
                  onShowLostContactsToggle={() => projectsFilters.setShowLostContacts(!projectsFilters.showLostContacts)}
                  activeFilterCount={projectsFilters.activeFilterCount}
                />
              </Suspense>
            )}

            {/* Services tab filters */}
            {activeTab === 'services' && (
              <Suspense fallback={null}>
                <ServicesFiltersBar
                  activeSubtab={servicesFilters.activeSubtab}
                  onSubtabChange={servicesFilters.setActiveSubtab}
                  searchQuery={servicesFilters.searchQuery}
                  onSearchChange={servicesFilters.setSearchQuery}
                  statusFilters={servicesFilters.statusFilters}
                  onStatusToggle={servicesFilters.toggleStatusFilter}
                  onClearStatuses={servicesFilters.clearStatusFilters}
                  frequencyTypeFilters={servicesFilters.frequencyTypeFilters}
                  onFrequencyTypeToggle={servicesFilters.toggleFrequencyTypeFilter}
                  onClearFrequencyTypes={servicesFilters.clearFrequencyTypeFilters}
                  showHiddenContacts={servicesFilters.showHiddenContacts}
                  onShowHiddenContactsToggle={() => servicesFilters.setShowHiddenContacts(!servicesFilters.showHiddenContacts)}
                  showLostContacts={servicesFilters.showLostContacts}
                  onShowLostContactsToggle={() => servicesFilters.setShowLostContacts(!servicesFilters.showLostContacts)}
                  activeFilterCount={servicesFilters.activeFilterCount}
                />
              </Suspense>
            )}
          </CRMHeader>
        </>
      }
    >
      {/* Tab Content */}
      <CRMTabContent
        activeTab={activeTab}
        contactsLoading={contactsLoading || !filtersLoaded}
        viewMode={viewMode}
        filteredContacts={filteredContacts}
        allStatuses={allStatuses}
        globalStatuses={globalStatuses}
        customStatuses={customStatuses}
        statusRoles={statusRoles}
        selectedStatuses={selectedStatuses}
        selectContact={selectContact}
        openContactModal={openContactModal}
        updateContact={updateContact}
        deleteContact={deleteContact}
        refreshWithScrollPreservation={refreshWithScrollPreservation}
        sortOrder={sortOrder ?? ''}
        handleStatusUpdate={handleStatusUpdate}
        services={services}
        servicesLoading={servicesLoading}
        openServiceModal={openServiceModal}
        deleteService={deleteService}
        refreshKey={refreshKey}
        clientsFilters={clientsFilters}
        vendorsFilters={vendorsFilters}
        projectsFilters={projectsFilters}
        servicesFilters={servicesFilters}
        columnOrder={columnOrder}
        handleColumnReorder={handleColumnReorder}
      />

      {/* Modals - lazy-loaded, only rendered when open */}
      {showContactModal && (
        <Suspense fallback={null}>
          <AddContactModal
            isOpen={showContactModal}
            onClose={closeContactModal}
            contact={editingContact}
          />
        </Suspense>
      )}

      {showServiceModal && (
        <Suspense fallback={null}>
          <AddServiceModal
            isOpen={showServiceModal}
            onClose={closeServiceModal}
            service={editingService as any}
          />
        </Suspense>
      )}

      {showProjectModal && (
        <Suspense fallback={null}>
          <AddProjectModal
            isOpen={showProjectModal}
            onClose={closeProjectModal}
            project={editingProject}
          />
        </Suspense>
      )}

      {/* Contact Details Panel */}
      {!!selectedContact && (
        <Suspense fallback={null}>
          <ContactDetailsPanel contact={selectedContact as Record<string, unknown> & { id: string }} onClose={clearSelectedContact} />
        </Suspense>
      )}

      {/* CRM Settings Modal */}
      {showCRMSettings && (
        <Suspense fallback={null}>
          <CRMSettingsModal
            isOpen={showCRMSettings}
            onClose={() => setShowCRMSettings(false)}
            onSuccess={handleCRMSettingsChange}
          />
        </Suspense>
      )}
    </CRMLayout>
  );
};

export default CRMDashboard;
