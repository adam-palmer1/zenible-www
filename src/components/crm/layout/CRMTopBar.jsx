import React from 'react';
import {
  PlusIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

/**
 * CRMTopBar - Top section with title, view toggle, and primary actions
 *
 * @param {string} viewMode - Current view mode ('pipeline' | 'list')
 * @param {Function} setViewMode - Function to change view mode
 * @param {Function} openContactModal - Opens add/edit contact modal
 * @param {Function} openServiceModal - Opens add/edit service modal
 * @param {Function} openProjectModal - Opens add/edit project modal
 * @param {Function} setShowCRMSettings - Opens CRM settings modal
 * @param {Function} updatePreference - Updates user preference
 * @param {string} activeTab - Current active tab
 */
const CRMTopBar = ({
  viewMode,
  setViewMode,
  openContactModal,
  openServiceModal,
  openProjectModal,
  setShowCRMSettings,
  updatePreference,
  activeTab = 'crm',
}) => {
  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    try {
      await updatePreference('crm_view_mode', mode, 'crm');
    } catch (error) {
      console.error('Failed to save view mode preference:', error);
    }
  };

  // Get button text and action based on active tab
  const getAddButtonConfig = () => {
    switch (activeTab) {
      case 'clients':
        return { text: 'Add Client', action: () => openContactModal(null, null, 'client') };
      case 'vendors':
        return { text: 'Add Vendor', action: () => openContactModal(null, null, 'vendor') };
      case 'services':
        return { text: 'Add Service', action: () => openServiceModal() };
      case 'projects':
        return { text: 'Add Project', action: () => openProjectModal() };
      default: // 'crm'
        return { text: 'Add Contact', action: () => openContactModal(null, null, null) };
    }
  };

  const addButtonConfig = getAddButtonConfig();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between h-[42px]">
        {/* Left: Title */}
        <h1 className="text-2xl font-bold text-gray-900">CRM</h1>

        {/* Right: View Toggle + Actions */}
        <div className="flex items-center gap-3 h-full">
          {/* View Mode Toggle - Only on CRM tab */}
          {activeTab === 'crm' && (
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => handleViewModeChange('pipeline')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'pipeline'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Pipeline view"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List view"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Add Button (changes based on active tab) */}
          <button
            onClick={addButtonConfig.action}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            <span>{addButtonConfig.text}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowCRMSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="CRM Settings"
          >
            <Cog6ToothIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMTopBar;
