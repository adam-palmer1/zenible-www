import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import adminAPI from '../../services/adminAPI';

interface Platform {
  id: string;
  system_id: string;
  name: string;
  description: string;
  icon_svg: string;
  is_active: boolean;
  is_configured?: boolean;
  character_count?: number;
  display_order: number;
  metadata?: Record<string, unknown>;
}

interface PlatformFormData {
  system_id: string;
  name: string;
  description: string;
  icon_svg: string;
  is_active: boolean;
  display_order: number | string;
  metadata: Record<string, unknown>;
}

interface PlatformsResponse {
  platforms: Platform[];
  total_pages: number;
}

// Icon components as inline SVGs
interface IconProps {
  size?: number;
  className?: string;
}

const XIcon = ({ size = 24, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = ({ size = 20, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ size = 18, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ size = 18, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SearchIcon = ({ size = 20, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronUpIcon = ({ size = 16, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = ({ size = 16, className = '' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface PlatformManagementProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export default function PlatformManagement({ isOpen, onClose, darkMode }: PlatformManagementProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState<PlatformFormData>({
    system_id: '',
    name: '',
    description: '',
    icon_svg: '',
    is_active: true,
    display_order: 0,
    metadata: {},
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
    }
  }, [isOpen, page, searchQuery]);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllPlatforms({
        page: String(page),
        per_page: '10',
        ...(searchQuery && { search: searchQuery }),
      }) as PlatformsResponse;
      setPlatforms(response.platforms || []);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate
    const errors: Record<string, string> = {};
    if (!formData.system_id.trim()) {
      errors.system_id = 'System ID is required';
    } else if (!/^[a-z0-9_-]+$/.test(formData.system_id)) {
      errors.system_id = 'System ID must be lowercase alphanumeric with hyphens/underscores';
    }
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.icon_svg.trim()) {
      errors.icon_svg = 'Icon SVG is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        display_order: parseInt(String(formData.display_order)) || 0,
      };

      if (editingPlatform) {
        await adminAPI.updatePlatform(editingPlatform.id, dataToSubmit);
      } else {
        await adminAPI.createPlatform(dataToSubmit);
      }

      // Reset form
      setIsFormOpen(false);
      setEditingPlatform(null);
      setFormData({
        system_id: '',
        name: '',
        description: '',
        icon_svg: '',
        is_active: true,
        display_order: 0,
        metadata: {},
      });

      // Refresh list
      fetchPlatforms();
    } catch (error: any) {
      console.error('Failed to save platform:', error);
      setFormErrors({ submit: error.message || 'Failed to save platform' });
    }
  };

  const handleEdit = (platform: Platform) => {
    setEditingPlatform(platform);
    setFormData({
      system_id: platform.system_id,
      name: platform.name,
      description: platform.description,
      icon_svg: platform.icon_svg,
      is_active: platform.is_active,
      display_order: platform.display_order,
      metadata: platform.metadata || {},
    });
    setIsFormOpen(true);
    setFormErrors({});
  };

  const handleDelete = async (platformId: string) => {
    try {
      await adminAPI.deletePlatform(platformId);
      setDeleteConfirm(null);
      fetchPlatforms();
    } catch (error: any) {
      console.error('Failed to delete platform:', error);
      alert(error.message || 'Failed to delete platform');
    }
  };

  const handleMoveUp = async (platform: Platform, index: number) => {
    if (index === 0) return;
    const prevPlatform = platforms[index - 1];

    try {
      // Swap display orders
      await adminAPI.updatePlatform(platform.id, {
        ...platform,
        display_order: prevPlatform.display_order
      });
      await adminAPI.updatePlatform(prevPlatform.id, {
        ...prevPlatform,
        display_order: platform.display_order
      });
      fetchPlatforms();
    } catch (error) {
      console.error('Failed to reorder platforms:', error);
    }
  };

  const handleMoveDown = async (platform: Platform, index: number) => {
    if (index === platforms.length - 1) return;
    const nextPlatform = platforms[index + 1];

    try {
      // Swap display orders
      await adminAPI.updatePlatform(platform.id, {
        ...platform,
        display_order: nextPlatform.display_order
      });
      await adminAPI.updatePlatform(nextPlatform.id, {
        ...nextPlatform,
        display_order: platform.display_order
      });
      fetchPlatforms();
    } catch (error) {
      console.error('Failed to reorder platforms:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${
        darkMode ? 'bg-[#1a1a1a]' : 'bg-white'
      } rounded-lg shadow-xl w-full max-w-[95vw] md:max-w-6xl max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-[#333333]' : 'border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Platform Management</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-10 ${
              darkMode ? 'hover:bg-white' : 'hover:bg-black'
            }`}
          >
            <XIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Search and Actions Bar */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <SearchIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} size={20} />
                <input
                  type="text"
                  placeholder="Search platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-[#2a2a2a] border-[#444444] text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(true);
                  setEditingPlatform(null);
                  setFormData({
                    system_id: '',
                    name: '',
                    description: '',
                    icon_svg: '',
                    is_active: true,
                    display_order: 0,
                    metadata: {},
                  });
                  setFormErrors({});
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon size={20} />
                Add Platform
              </button>
            </div>
          </div>

          {/* Platform Form */}
          {isFormOpen && (
            <div className={`mx-6 mb-6 p-4 rounded-lg border ${
              darkMode ? 'bg-[#2a2a2a] border-[#444444]' : 'bg-gray-50 border-gray-200'
            }`}>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      System ID *
                    </label>
                    <input
                      type="text"
                      value={formData.system_id}
                      onChange={(e) => setFormData({ ...formData, system_id: e.target.value })}
                      disabled={!!editingPlatform}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        formErrors.system_id ? 'border-red-500' : ''
                      } ${
                        darkMode
                          ? 'bg-[#1a1a1a] border-[#444444] text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } ${editingPlatform ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g., upwork, linkedin"
                    />
                    {formErrors.system_id && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.system_id}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        formErrors.name ? 'border-red-500' : ''
                      } ${
                        darkMode
                          ? 'bg-[#1a1a1a] border-[#444444] text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="e.g., Upwork, LinkedIn"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Description *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        formErrors.description ? 'border-red-500' : ''
                      } ${
                        darkMode
                          ? 'bg-[#1a1a1a] border-[#444444] text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="e.g., Global freelancing platform"
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Icon SVG *
                    </label>
                    <div className="flex gap-4">
                      <textarea
                        value={formData.icon_svg}
                        onChange={(e) => setFormData({ ...formData, icon_svg: e.target.value })}
                        rows={4}
                        className={`flex-1 px-3 py-2 rounded-lg border font-mono text-sm ${
                          formErrors.icon_svg ? 'border-red-500' : ''
                        } ${
                          darkMode
                            ? 'bg-[#1a1a1a] border-[#444444] text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>'
                      />
                      {formData.icon_svg && (
                        <div className={`w-16 h-16 p-2 rounded-lg border ${
                          darkMode ? 'bg-[#1a1a1a] border-[#444444]' : 'bg-white border-gray-300'
                        }`}>
                          <div
                            className="w-full h-full"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.icon_svg) }}
                          />
                        </div>
                      )}
                    </div>
                    {formErrors.icon_svg && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.icon_svg}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-[#1a1a1a] border-[#444444] text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className={`flex items-center cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      Active
                    </label>
                  </div>
                </div>

                {formErrors.submit && (
                  <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {formErrors.submit}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingPlatform ? 'Update' : 'Create'} Platform
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingPlatform(null);
                      setFormErrors({});
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Platforms List */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading platforms...
              </div>
            ) : platforms.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No platforms found
              </div>
            ) : (
              <div className="space-y-3">
                {platforms.map((platform: Platform, index: number) => (
                  <div
                    key={platform.id}
                    className={`p-4 rounded-lg border ${
                      darkMode ? 'bg-[#2a2a2a] border-[#444444]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveUp(platform, index)}
                            disabled={index === 0}
                            className={`p-1 rounded ${
                              index === 0
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <ChevronUpIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveDown(platform, index)}
                            disabled={index === platforms.length - 1}
                            className={`p-1 rounded ${
                              index === platforms.length - 1
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <ChevronDownIcon size={16} />
                          </button>
                        </div>

                        <div
                          className="w-10 h-10"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(platform.icon_svg) }}
                        />

                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className={`font-semibold ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {platform.name}
                            </h3>
                            <code className={`text-xs px-2 py-1 rounded ${
                              darkMode ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {platform.system_id}
                            </code>
                            {!platform.is_active && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                Inactive
                              </span>
                            )}
                            {platform.is_configured && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                {platform.character_count} characters
                              </span>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {platform.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(platform)}
                          className={`p-2 rounded-lg hover:bg-opacity-10 ${
                            darkMode ? 'hover:bg-white' : 'hover:bg-black'
                          }`}
                        >
                          <EditIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={18} />
                        </button>
                        {deleteConfirm === platform.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(platform.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className={`px-3 py-1 text-sm rounded ${
                                darkMode
                                  ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(platform.id)}
                            className={`p-2 rounded-lg hover:bg-opacity-10 ${
                              darkMode ? 'hover:bg-white' : 'hover:bg-black'
                            }`}
                          >
                            <TrashIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${
                    page === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : darkMode
                        ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded ${
                    page === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : darkMode
                        ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
