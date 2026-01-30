import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CRMLayout from './layout/CRMLayout';
import CRMTopBar from './layout/CRMTopBar';
import CRMHeader from './layout/CRMHeader';
import CRMFiltersBar from './filters/CRMFiltersBar';
import ClientsFiltersBar from './filters/ClientsFiltersBar';
import VendorsFiltersBar from './filters/VendorsFiltersBar';
import ProjectsFiltersBar from './filters/ProjectsFiltersBar';
import ServicesFiltersBar from './filters/ServicesFiltersBar';
import CRMTabContent from './layout/CRMTabContent';
import AddContactModal from './AddContactModal';
import AddServiceModal from './AddServiceModal';
import AddProjectModal from './AddProjectModal';
import ContactDetailsPanel from './ContactDetailsPanel';
import CRMSettingsModal from './CRMSettingsModal';
import { useCRM } from '../../contexts/CRMContext';
import { useContacts, useContactStatuses, useServices } from '../../hooks/crm';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useCRMFilters } from '../../hooks/crm/useCRMFilters';
import { useClientsFilters } from '../../hooks/crm/useClientsFilters';
import { useVendorsFilters } from '../../hooks/crm/useVendorsFilters';
import { useProjectsFilters } from '../../hooks/crm/useProjectsFilters';
import { useServicesFilters } from '../../hooks/crm/useServicesFilters';

/**
 * Main CRM Dashboard component (REFACTORED with new design)
 * Now uses two-tier header structure matching Figma design
 */
const CRMDashboard = () => {
  // URL-based tab navigation
  const { tab } = useParams();
  const navigate = useNavigate();

  // Validate tab value and determine active tab
  const validTabs = ['crm', 'clients', 'vendors', 'services', 'projects'];
  const activeTab = tab && validTabs.includes(tab) ? tab : 'crm';

  // Function to change tabs (updates URL)
  const setActiveTab = useCallback((newTab) => {
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
  const { globalStatuses, customStatuses, fetchStatuses } = useContactStatuses();
  const { services, loading: servicesLoading, deleteService } = useServices();

  // Combine statuses
  const allStatuses = [...globalStatuses, ...customStatuses];

  // CRM Filters Hook - Consolidates all filter logic
  const {
    selectedStatuses,
    showHidden,
    sortOrder,
    columnOrder,
    contactFilters,
    filteredContacts: statusFilteredContacts,
    activeFilterCount,
    handleStatusToggle,
    handleClearStatuses,
    handleShowHiddenToggle,
    handleSortOrderChange,
    handleColumnReorder,
    clearAllFilters,
  } = useCRMFilters([], filters);

  // Clients Filters Hook - Manages clients tab filter state
  const clientsFilters = useClientsFilters();

  // Vendors Filters Hook - Manages vendors tab filter state
  const vendorsFilters = useVendorsFilters();

  // Projects Filters Hook - Manages projects tab filter state
  const projectsFilters = useProjectsFilters();

  // Services Filters Hook - Manages services tab filter state
  const servicesFilters = useServicesFilters();

  // Load contacts with combined filters
  const { contacts, loading: contactsLoading, updateContact } = useContacts(contactFilters, refreshKey);

  // Apply status filters to loaded contacts
  // Only show contacts that have a CRM status (global or custom)
  const filteredContacts = contacts.filter((contact) => {
    const contactStatusId =
      contact.current_global_status_id || contact.current_custom_status_id;

    // Filter out contacts without any status
    if (!contactStatusId) {
      return false;
    }

    // Filter out hidden contacts unless showHidden is true
    if (!showHidden && contact.is_hidden) {
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
            )}

            {/* Clients tab filters */}
            {activeTab === 'clients' && (
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
                columnSelectorRef={clientsFilters.columnSelectorRef}
                fieldsLoading={clientsFilters.fieldsLoading}
              />
            )}

            {/* Vendors tab filters */}
            {activeTab === 'vendors' && (
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
                columnSelectorRef={vendorsFilters.columnSelectorRef}
              />
            )}

            {/* Projects tab filters */}
            {activeTab === 'projects' && (
              <ProjectsFiltersBar
                selectedStatuses={projectsFilters.selectedStatuses}
                onStatusToggle={projectsFilters.handleStatusToggle}
                onClearStatuses={projectsFilters.handleClearStatuses}
              />
            )}

            {/* Services tab filters */}
            {activeTab === 'services' && (
              <ServicesFiltersBar
                activeSubtab={servicesFilters.activeSubtab}
                onSubtabChange={servicesFilters.setActiveSubtab}
                searchQuery={servicesFilters.searchQuery}
                onSearchChange={servicesFilters.setSearchQuery}
                statusFilter={servicesFilters.statusFilter}
                onStatusFilterChange={servicesFilters.setStatusFilter}
                frequencyTypeFilter={servicesFilters.frequencyTypeFilter}
                onFrequencyTypeFilterChange={servicesFilters.setFrequencyTypeFilter}
                activeFilterCount={servicesFilters.activeFilterCount}
              />
            )}
          </CRMHeader>
        </>
      }
    >
      {/* Tab Content */}
      <CRMTabContent
        activeTab={activeTab}
        contactsLoading={contactsLoading}
        viewMode={viewMode}
        filteredContacts={filteredContacts}
        allStatuses={allStatuses}
        globalStatuses={globalStatuses}
        customStatuses={customStatuses}
        selectedStatuses={selectedStatuses}
        selectContact={selectContact}
        openContactModal={openContactModal}
        updateContact={updateContact}
        refreshWithScrollPreservation={refreshWithScrollPreservation}
        sortOrder={sortOrder}
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

      {/* Modals */}
      <AddContactModal
        isOpen={showContactModal}
        onClose={closeContactModal}
        contact={editingContact}
      />

      <AddServiceModal
        isOpen={showServiceModal}
        onClose={closeServiceModal}
        service={editingService}
      />

      <AddProjectModal
        isOpen={showProjectModal}
        onClose={closeProjectModal}
        project={editingProject}
      />

      {/* Contact Details Panel */}
      {selectedContact && (
        <ContactDetailsPanel contact={selectedContact} onClose={clearSelectedContact} />
      )}

      {/* CRM Settings Modal */}
      <CRMSettingsModal
        isOpen={showCRMSettings}
        onClose={() => setShowCRMSettings(false)}
        onSuccess={handleCRMSettingsChange}
      />
    </CRMLayout>
  );
};

export default CRMDashboard;
