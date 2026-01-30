import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { usePreferences } from './PreferencesContext';

export const CRMContext = createContext(null);

export const CRMProvider = ({ children }) => {
  const { getPreference, initialized: preferencesInitialized } = usePreferences();

  // UI State
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline'); // pipeline, list, table
  const [showContactModal, setShowContactModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [initialContactStatus, setInitialContactStatus] = useState(null);
  const [initialContactType, setInitialContactType] = useState(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    global_status_id: null,
    custom_status_id: null,
    is_client: null,
    is_vendor: null,
    is_active: true,
  });

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Load view mode and filters from preferences on mount
  useEffect(() => {
    if (preferencesInitialized && !preferencesLoaded) {
      // Load view mode preference
      const savedViewMode = getPreference('crm_view_mode', 'pipeline');
      setViewMode(savedViewMode);

      // Load filter preferences
      const savedSearch = getPreference('crm_search', '');
      const savedIsClient = getPreference('crm_filter_is_client', null);
      const savedIsVendor = getPreference('crm_filter_is_vendor', null);
      const savedIsActive = getPreference('crm_filter_is_active', true);

      setFilters({
        search: savedSearch,
        global_status_id: null,
        custom_status_id: null,
        is_client: savedIsClient,
        is_vendor: savedIsVendor,
        is_active: savedIsActive,
      });

      setPreferencesLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesInitialized, preferencesLoaded]);

  // Methods
  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const openContactModal = useCallback((contact = null, statusId = null, contactType = null) => {
    setEditingContact(contact);
    setInitialContactStatus(statusId);
    setInitialContactType(contactType);
    setShowContactModal(true);
  }, []);

  const closeContactModal = useCallback(() => {
    setShowContactModal(false);
    setEditingContact(null);
    setInitialContactStatus(null);
    setInitialContactType(null);
  }, []);

  const openServiceModal = useCallback((service = null) => {
    setEditingService(service);
    setShowServiceModal(true);
  }, []);

  const closeServiceModal = useCallback(() => {
    setShowServiceModal(false);
    setEditingService(null);
  }, []);

  const openProjectModal = useCallback((project = null) => {
    setEditingProject(project);
    setShowProjectModal(true);
  }, []);

  const closeProjectModal = useCallback(() => {
    setShowProjectModal(false);
    setEditingProject(null);
  }, []);

  const openImportModal = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const closeImportModal = useCallback(() => {
    setShowImportModal(false);
  }, []);

  const selectContact = useCallback((contact) => {
    setSelectedContact(contact);
  }, []);

  const clearSelectedContact = useCallback(() => {
    setSelectedContact(null);
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      global_status_id: null,
      custom_status_id: null,
      is_client: null,
      is_vendor: null,
      is_active: true,
    });
  }, []);

  // Memoized value
  const value = useMemo(
    () => ({
      // State
      selectedContact,
      viewMode,
      showContactModal,
      showServiceModal,
      showProjectModal,
      showImportModal,
      editingContact,
      editingService,
      editingProject,
      initialContactStatus,
      initialContactType,
      filters,
      refreshKey,

      // Methods
      refresh,
      selectContact,
      clearSelectedContact,
      setViewMode,
      openContactModal,
      closeContactModal,
      openServiceModal,
      closeServiceModal,
      openProjectModal,
      closeProjectModal,
      openImportModal,
      closeImportModal,
      updateFilters,
      clearFilters,
    }),
    [
      selectedContact,
      viewMode,
      showContactModal,
      showServiceModal,
      showProjectModal,
      showImportModal,
      editingContact,
      editingService,
      editingProject,
      initialContactStatus,
      initialContactType,
      filters,
      refreshKey,
      refresh,
      selectContact,
      clearSelectedContact,
      openContactModal,
      closeContactModal,
      openServiceModal,
      closeServiceModal,
      openProjectModal,
      closeProjectModal,
      openImportModal,
      closeImportModal,
      updateFilters,
      clearFilters,
    ]
  );

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

// Custom hook to use CRM context
export const useCRM = () => {
  const context = React.useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
