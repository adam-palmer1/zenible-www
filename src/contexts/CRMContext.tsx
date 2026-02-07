import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { usePreferences } from './PreferencesContext';

interface CRMFilters {
  search: string;
  global_status_id: string | null;
  custom_status_id: string | null;
  is_client: boolean | null;
  is_vendor: boolean | null;
  is_active: boolean;
}

interface CRMContextValue {
  selectedContact: unknown;
  viewMode: string;
  showContactModal: boolean;
  showServiceModal: boolean;
  showProjectModal: boolean;
  showImportModal: boolean;
  editingContact: unknown;
  editingService: unknown;
  editingProject: unknown;
  initialContactStatus: string | null;
  initialContactType: string | null;
  filters: CRMFilters;
  refreshKey: number;
  refresh: () => void;
  selectContact: (contact: unknown) => void;
  clearSelectedContact: () => void;
  setViewMode: React.Dispatch<React.SetStateAction<string>>;
  openContactModal: (contact?: unknown, statusId?: string | null, contactType?: string | null) => void;
  closeContactModal: () => void;
  openServiceModal: (service?: unknown) => void;
  closeServiceModal: () => void;
  openProjectModal: (project?: unknown) => void;
  closeProjectModal: () => void;
  openImportModal: () => void;
  closeImportModal: () => void;
  updateFilters: (newFilters: Partial<CRMFilters>) => void;
  clearFilters: () => void;
}

export const CRMContext = createContext<CRMContextValue | null>(null);

export const CRMProvider = ({ children }: { children: React.ReactNode }) => {
  const { getPreference, initialized: preferencesInitialized } = usePreferences();

  // UI State
  const [selectedContact, setSelectedContact] = useState<unknown>(null);
  const [viewMode, setViewMode] = useState<string>('pipeline'); // pipeline, list, table
  const [showContactModal, setShowContactModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingContact, setEditingContact] = useState<unknown>(null);
  const [editingService, setEditingService] = useState<unknown>(null);
  const [editingProject, setEditingProject] = useState<unknown>(null);
  const [initialContactStatus, setInitialContactStatus] = useState<string | null>(null);
  const [initialContactType, setInitialContactType] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Filters
  const [filters, setFilters] = useState<CRMFilters>({
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
      setViewMode(savedViewMode as string);

      // Load filter preferences
      const savedSearch = getPreference('crm_search', '');
      const savedIsClient = getPreference('crm_filter_is_client', null);
      const savedIsVendor = getPreference('crm_filter_is_vendor', null);
      const savedIsActive = getPreference('crm_filter_is_active', true);

      setFilters({
        search: savedSearch as string,
        global_status_id: null,
        custom_status_id: null,
        is_client: savedIsClient as boolean | null,
        is_vendor: savedIsVendor as boolean | null,
        is_active: savedIsActive as boolean,
      });

      setPreferencesLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesInitialized, preferencesLoaded]);

  // Methods
  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const openContactModal = useCallback((contact: unknown = null, statusId: string | null = null, contactType: string | null = null) => {
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

  const openServiceModal = useCallback((service: unknown = null) => {
    setEditingService(service);
    setShowServiceModal(true);
  }, []);

  const closeServiceModal = useCallback(() => {
    setShowServiceModal(false);
    setEditingService(null);
  }, []);

  const openProjectModal = useCallback((project: unknown = null) => {
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

  const selectContact = useCallback((contact: unknown) => {
    setSelectedContact(contact);
  }, []);

  const clearSelectedContact = useCallback(() => {
    setSelectedContact(null);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<CRMFilters>) => {
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
    (): CRMContextValue => ({
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
