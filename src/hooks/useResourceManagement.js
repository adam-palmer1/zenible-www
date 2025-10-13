import { useState } from 'react';
import coursesAPI from '../services/coursesAPI';

/**
 * Custom hook for managing course module resource-related state and operations
 * Handles resources list, CRUD operations, and modal states
 */
export const useResourceManagement = () => {
  // Resource state
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Resource modal states
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [selectedCourseForResources, setSelectedCourseForResources] = useState(null);
  const [selectedModuleForResources, setSelectedModuleForResources] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [showDeleteResourceModal, setShowDeleteResourceModal] = useState(false);
  const [deletingResource, setDeletingResource] = useState(null);

  // Resource form state
  const [resourceForm, setResourceForm] = useState({
    title: '',
    resource_type: 'video',
    description: '',
    content_url: '',
    content_text: '',
    duration_minutes: '',
    order_index: 0,
    is_required: true,
    is_active: true,
    resource_metadata: ''
  });

  // Resource types
  const resourceTypes = ['video', 'pdf', 'rich_text', 'link'];

  const fetchModuleResources = async (courseId, moduleId) => {
    setResourcesLoading(true);
    try {
      const response = await coursesAPI.getModuleResources(courseId, moduleId, { page: 1, per_page: 100 });
      setResources(response.resources || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      alert(`Error fetching resources: ${err.message}`);
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleManageResources = (course, module) => {
    setSelectedCourseForResources(course);
    setSelectedModuleForResources(module);
    setShowResourcesModal(true);
    fetchModuleResources(course.id, module.id);
  };

  const handleCreateResource = () => {
    setEditingResource(null);
    const nextOrderIndex = resources.length > 0 ? Math.max(...resources.map(r => r.order_index || 0)) + 1 : 1;
    setResourceForm({
      title: '',
      resource_type: 'video',
      description: '',
      content_url: '',
      content_text: '',
      duration_minutes: '',
      order_index: nextOrderIndex,
      is_required: true,
      is_active: true,
      resource_metadata: ''
    });
    setShowResourceModal(true);
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setResourceForm({
      title: resource.title,
      resource_type: resource.resource_type || 'video',
      description: resource.description || '',
      content_url: resource.content_url || '',
      content_text: resource.content_text || '',
      duration_minutes: resource.duration_minutes || '',
      order_index: resource.order_index,
      is_required: resource.is_required !== undefined ? resource.is_required : true,
      is_active: resource.is_active !== undefined ? resource.is_active : (resource.status === 'published'),
      resource_metadata: resource.resource_metadata || ''
    });
    setShowResourceModal(true);
  };

  const handleSaveResource = async () => {
    if (!selectedCourseForResources || !selectedModuleForResources) return;

    try {
      const data = {
        title: resourceForm.title,
        resource_type: resourceForm.resource_type,
        description: resourceForm.description,
        order_index: parseInt(resourceForm.order_index),
        is_required: resourceForm.is_required,
        is_active: resourceForm.is_active,
        status: resourceForm.is_active ? 'published' : 'draft',
        module_id: selectedModuleForResources.id
      };

      // Add content based on resource type
      if (resourceForm.resource_type === 'rich_text' && resourceForm.content_text) {
        data.content_text = resourceForm.content_text;
      } else if (resourceForm.content_url) {
        data.content_url = resourceForm.content_url;
      }

      if (resourceForm.duration_minutes) {
        data.duration_minutes = parseInt(resourceForm.duration_minutes);
      }

      if (resourceForm.resource_metadata) {
        try {
          data.resource_metadata = JSON.parse(resourceForm.resource_metadata);
        } catch (e) {
          console.warn('Invalid JSON for resource_metadata, saving as string');
          data.resource_metadata = { raw: resourceForm.resource_metadata };
        }
      }

      if (editingResource) {
        await coursesAPI.updateResource(selectedCourseForResources.id, selectedModuleForResources.id, editingResource.id, data);
      } else {
        await coursesAPI.createResource(selectedCourseForResources.id, selectedModuleForResources.id, data);
      }

      setShowResourceModal(false);
      fetchModuleResources(selectedCourseForResources.id, selectedModuleForResources.id);
    } catch (err) {
      console.error('Error saving resource:', err);
      alert(`Error saving resource: ${err.message}`);
    }
  };

  const handleDeleteResource = async () => {
    if (!selectedCourseForResources || !selectedModuleForResources || !deletingResource) return;

    try {
      await coursesAPI.deleteResource(selectedCourseForResources.id, selectedModuleForResources.id, deletingResource.id);
      setShowDeleteResourceModal(false);
      setDeletingResource(null);
      fetchModuleResources(selectedCourseForResources.id, selectedModuleForResources.id);
    } catch (err) {
      alert(`Error deleting resource: ${err.message}`);
    }
  };

  return {
    // State
    resources,
    resourcesLoading,
    showResourcesModal,
    selectedCourseForResources,
    selectedModuleForResources,
    showResourceModal,
    editingResource,
    showDeleteResourceModal,
    deletingResource,
    resourceForm,
    resourceTypes,

    // Setters
    setResources,
    setShowResourcesModal,
    setSelectedCourseForResources,
    setSelectedModuleForResources,
    setShowResourceModal,
    setEditingResource,
    setShowDeleteResourceModal,
    setDeletingResource,
    setResourceForm,

    // Functions
    fetchModuleResources,
    handleManageResources,
    handleCreateResource,
    handleEditResource,
    handleSaveResource,
    handleDeleteResource
  };
};

export default useResourceManagement;
