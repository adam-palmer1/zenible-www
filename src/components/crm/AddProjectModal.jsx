import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/modal/Modal';
import { useCRM } from '../../contexts/CRMContext';
import { useProjects, useCompanyCurrencies } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_HEX_COLORS
} from '../../constants/crm';
import contactsAPI from '../../services/api/crm/contacts';
import ContactSelectorModal from '../calendar/ContactSelectorModal';
import ServiceSelectorModal from './ServiceSelectorModal';
import StatusSelectorModal from './StatusSelectorModal';

/**
 * Modal for adding/editing projects
 */
const AddProjectModal = ({ isOpen, onClose, project = null }) => {
  const { refresh } = useCRM();
  const { createProject, updateProject, refresh: refreshProjects } = useProjects();
  const { showSuccess, showError } = useNotification();
  const { companyCurrencies } = useCompanyCurrencies();

  // Client selector state
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const contactButtonRef = useRef(null);

  // Status selector state
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Service selector state
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_id: '',
    status: PROJECT_STATUS.PLANNING,
    start_date: '',
    end_date: '',
    notes: '',
    default_hourly_rate: '',
    default_currency_id: '',
  });
  const [clientServices, setClientServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [fullProject, setFullProject] = useState(null);

  // Load full project details when editing
  useEffect(() => {
    const loadProjectDetails = async () => {
      if (project && project.id) {
        try {
          setLoadingProject(true);
          const projectsAPI = (await import('../../services/api/crm/projects')).default;
          const fullProjectData = await projectsAPI.get(project.id);
          setFullProject(fullProjectData);
        } catch (error) {
          console.error('Failed to load project details:', error);
          showError('Failed to load project details');
        } finally {
          setLoadingProject(false);
        }
      } else {
        setFullProject(null);
      }
    };

    loadProjectDetails();
  }, [project, showError]);

  // Initialize form data when full project details are loaded
  useEffect(() => {
    const projectData = fullProject || project;

    if (projectData) {
      setFormData({
        name: projectData.name || '',
        description: projectData.description || '',
        contact_id: projectData.contact_id || '',
        status: projectData.status || PROJECT_STATUS.PLANNING,
        start_date: projectData.start_date || '',
        end_date: projectData.end_date || '',
        notes: projectData.notes || '',
        default_hourly_rate: projectData.default_hourly_rate || '',
        default_currency_id: projectData.default_currency_id || '',
      });

      // Set selected contact for display
      if (projectData.contact) {
        setSelectedContact(projectData.contact);
      }

      // Set selected services if editing (from full project data)
      if (projectData.service_assignments && Array.isArray(projectData.service_assignments)) {
        const serviceIds = projectData.service_assignments.map(sa => sa.contact_service_id);
        setSelectedServices(serviceIds);
      }

      // Load client services if contact is set
      if (projectData.contact_id) {
        loadClientServices(projectData.contact_id);
      }
    } else {
      // Set default dates for new projects
      const today = new Date();
      const startDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days from today

      setFormData({
        name: '',
        description: '',
        contact_id: '',
        status: PROJECT_STATUS.PLANNING,
        start_date: startDate,
        end_date: endDate,
        notes: '',
        default_hourly_rate: '',
        default_currency_id: '',
      });
      setSelectedContact(null);
      setSelectedServices([]);
      setClientServices([]);
    }
  }, [fullProject, project]);

  // Load client's services when contact is selected
  const loadClientServices = async (contactId) => {
    if (!contactId) {
      setClientServices([]);
      return;
    }

    try {
      setLoadingServices(true);
      const contact = await contactsAPI.get(contactId);
      setClientServices(contact.services || []);
    } catch (error) {
      console.error('Failed to load client services:', error);
      showError('Failed to load client services');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setFormData(prev => ({
      ...prev,
      contact_id: contact?.id || null,
      // Default currency from contact if not already set
      default_currency_id: prev.default_currency_id || contact?.currency_id || '',
    }));

    // Load client services when contact is selected
    if (contact?.id) {
      loadClientServices(contact.id);
    } else {
      setClientServices([]);
      setSelectedServices([]);
    }
  };

  const handleStatusSelect = (status) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleServiceSelectionApply = (serviceIds) => {
    setSelectedServices(serviceIds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date';
    }
    // Validate that start/end dates are both specified or both empty
    if ((formData.start_date && !formData.end_date) || (!formData.start_date && formData.end_date)) {
      newErrors.end_date = 'Both start date and end date must be specified, or leave both empty';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Build payload with properly converted billing defaults
      const payload = {
        ...formData,
        default_hourly_rate: formData.default_hourly_rate ? parseFloat(formData.default_hourly_rate) : null,
        default_currency_id: formData.default_currency_id || null,
      };

      // Create or update project
      let savedProject;
      if (project) {
        savedProject = await updateProject(project.id, payload);
      } else {
        savedProject = await createProject(payload);
      }

      // Assign services if any selected
      if (selectedServices.length > 0 && savedProject) {
        const projectsAPI = (await import('../../services/api/crm/projects')).default;
        for (const serviceId of selectedServices) {
          try {
            await projectsAPI.assignService(savedProject.id, {
              contact_service_id: serviceId,
            });
          } catch (error) {
            console.error(`Failed to assign service ${serviceId}:`, error);
          }
        }
      }

      // Refresh projects list AFTER service assignments to show correct count
      await refreshProjects();

      showSuccess(project ? 'Project updated successfully' : 'Project created successfully');
      refresh();
      onClose();
    } catch (error) {
      console.error('Failed to save project:', error);
      setErrors({ general: error.message });
      showError('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={isOpen}
        onOpenChange={onClose}
        title={project ? 'Edit Project' : 'Add New Project'}
        size="2xl"
      >
        {loadingProject ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading project details...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            {/* Client */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client
              </label>
              <button
                ref={contactButtonRef}
                type="button"
                onClick={() => setShowContactSelector(true)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:border-zenible-primary focus:ring-2 focus:ring-zenible-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700"
              >
                {selectedContact ? (
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {`${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim() || 'No Name'}
                    </div>
                    {selectedContact.business_name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {selectedContact.business_name}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">Select a client...</span>
                )}
              </button>

              {/* Contact Selector Dropdown */}
              <ContactSelectorModal
                isOpen={showContactSelector}
                onClose={() => setShowContactSelector(false)}
                onSelect={handleContactSelect}
                selectedContactId={formData.contact_id}
                anchorRef={contactButtonRef}
                filterParams={{ is_client: true }}
              />

              {errors.contact_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact_id}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <button
                type="button"
                onClick={() => setShowStatusModal(true)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:border-zenible-primary focus:ring-2 focus:ring-zenible-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700"
              >
                <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_COLORS[formData.status]}`}>
                  {PROJECT_STATUS_LABELS[formData.status]}
                </span>
              </button>
            </div>

            {/* Start Date & End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                {errors.end_date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end_date}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Billing Defaults */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Billing Defaults (Optional)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Default Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Hourly Rate
                  </label>
                  <input
                    type="number"
                    name="default_hourly_rate"
                    step="0.01"
                    min="0"
                    value={formData.default_hourly_rate}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Default Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    name="default_currency_id"
                    value={formData.default_currency_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Use contact/company default</option>
                    {companyCurrencies.map(c => (
                      <option key={c.currency_id} value={c.currency_id}>
                        {c.currency?.code || 'Unknown'} - {c.currency?.name || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                If not set, billable hours will use contact or company defaults
              </p>
            </div>

            {/* Service Assignment Section */}
            {formData.contact_id && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Assigned Services
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowServiceSelector(true)}
                    disabled={loadingServices}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-zenible-primary border border-zenible-primary rounded-lg hover:bg-zenible-primary hover:text-white transition-colors disabled:opacity-50"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Select Services
                  </button>
                </div>

                {loadingServices ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zenible-primary"></div>
                  </div>
                ) : selectedServices.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    No services selected. Click "Select Services" to add services to this project.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clientServices
                      .filter((s) => selectedServices.includes(s.id))
                      .map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {service.name || 'Unknown Service'}
                            </div>
                            {service.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {service.description}
                              </div>
                            )}
                          </div>
                          {service.price && (
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-3">
                              {service.currency?.code || ''} {service.price}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            {/* Footer Buttons */}
            {!loadingProject && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Service Selector Modal */}
      <ServiceSelectorModal
        isOpen={showServiceSelector}
        onClose={() => setShowServiceSelector(false)}
        onApply={handleServiceSelectionApply}
        availableServices={clientServices}
        selectedServiceIds={selectedServices}
        loading={loadingServices}
      />

      {/* Status Selector Modal */}
      <StatusSelectorModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onSelect={handleStatusSelect}
        selectedStatus={formData.status}
      />
    </>
  );
};

export default AddProjectModal;
