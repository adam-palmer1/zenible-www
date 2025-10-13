import { useState } from 'react';
import coursesAPI from '../services/coursesAPI';

/**
 * Custom hook for managing course module-related state and operations
 * Handles modules list, CRUD operations, and modal states
 */
export const useModuleManagement = () => {
  // Module state
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Module modal states
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [selectedCourseForModules, setSelectedCourseForModules] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [showDeleteModuleModal, setShowDeleteModuleModal] = useState(false);
  const [deletingModule, setDeletingModule] = useState(null);

  // Module form state
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
    order_index: 0,
    is_published: false
  });

  const fetchCourseModules = async (courseId) => {
    setModulesLoading(true);
    try {
      const response = await coursesAPI.getCourseModules(courseId, { page: 1, per_page: 100 });
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      alert(`Error fetching modules: ${err.message}`);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleManageModules = (course) => {
    setSelectedCourseForModules(course);
    setShowModulesModal(true);
    fetchCourseModules(course.id);
  };

  const handleCreateModule = () => {
    setEditingModule(null);
    const nextOrderIndex = modules.length > 0 ? Math.max(...modules.map(m => m.order_index || 0)) + 1 : 1;
    setModuleForm({
      title: '',
      description: '',
      content: '',
      video_url: '',
      order_index: nextOrderIndex,
      is_published: false
    });
    setShowModuleModal(true);
  };

  const handleEditModule = (module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || '',
      content: module.content || '',
      video_url: module.video_url || '',
      order_index: module.order_index,
      is_published: module.status === 'published'
    });
    setShowModuleModal(true);
  };

  const handleSaveModule = async () => {
    if (!selectedCourseForModules) return;

    try {
      const data = {
        title: moduleForm.title,
        description: moduleForm.description,
        order_index: parseInt(moduleForm.order_index),
        status: moduleForm.is_published ? 'published' : 'draft'
      };

      if (moduleForm.content) {
        data.content = moduleForm.content;
      }

      if (moduleForm.video_url) {
        data.video_url = moduleForm.video_url;
      }

      if (editingModule) {
        await coursesAPI.updateModule(selectedCourseForModules.id, editingModule.id, data);
      } else {
        await coursesAPI.createModule(selectedCourseForModules.id, data);
      }

      setShowModuleModal(false);
      fetchCourseModules(selectedCourseForModules.id);
    } catch (err) {
      console.error('Error saving module:', err);
      alert(`Error saving module: ${err.message}`);
    }
  };

  const handleDeleteModule = async () => {
    if (!selectedCourseForModules || !deletingModule) return;

    try {
      await coursesAPI.deleteModule(selectedCourseForModules.id, deletingModule.id);
      setShowDeleteModuleModal(false);
      setDeletingModule(null);
      fetchCourseModules(selectedCourseForModules.id);
    } catch (err) {
      alert(`Error deleting module: ${err.message}`);
    }
  };

  return {
    // State
    modules,
    modulesLoading,
    showModulesModal,
    selectedCourseForModules,
    showModuleModal,
    editingModule,
    showDeleteModuleModal,
    deletingModule,
    moduleForm,

    // Setters
    setModules,
    setShowModulesModal,
    setSelectedCourseForModules,
    setShowModuleModal,
    setEditingModule,
    setShowDeleteModuleModal,
    setDeletingModule,
    setModuleForm,

    // Functions
    fetchCourseModules,
    handleManageModules,
    handleCreateModule,
    handleEditModule,
    handleSaveModule,
    handleDeleteModule
  };
};

export default useModuleManagement;
