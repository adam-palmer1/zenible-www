import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import eventsAPI from '../../services/eventsAPI';
import ImageCropperModal from '../shared/ImageCropperModal';

export default function HostsManagement() {
  const { darkMode } = useOutletContext();

  // Main state
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Modal states
  const [showHostModal, setShowHostModal] = useState(false);
  const [editingHost, setEditingHost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingHost, setDeletingHost] = useState(null);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [uploadingHost, setUploadingHost] = useState(null);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [deletingImageHost, setDeletingImageHost] = useState(null);
  const [showHostEventsModal, setShowHostEventsModal] = useState(false);
  const [selectedHost, setSelectedHost] = useState(null);
  const [hostEvents, setHostEvents] = useState([]);
  const [hostEventsLoading, setHostEventsLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('hosts'); // hosts, analytics

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Form state
  const [hostForm, setHostForm] = useState({
    name: '',
    byline: '',
    image_url: '',
    is_active: true
  });

  // Image upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Image cropper state
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState('');
  const [setCroppedImageBlob] = useState(null);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchHosts();
  }, [page, perPage, search, activeFilter]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchHosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(activeFilter !== '' && { is_active: activeFilter === 'true' })
      };

      const response = await eventsAPI.getAdminHosts(params);
      setHosts(response.hosts || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching hosts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await eventsAPI.getHostAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchHostEvents = async (hostId) => {
    setHostEventsLoading(true);
    try {
      const response = await eventsAPI.getHostEvents(hostId, { page: 1, per_page: 100 });
      setHostEvents(response.events || []);
    } catch (err) {
      console.error('Error fetching host events:', err);
      alert(`Error fetching host events: ${err.message}`);
    } finally {
      setHostEventsLoading(false);
    }
  };

  const handleCreateHost = () => {
    setEditingHost(null);
    setHostForm({
      name: '',
      byline: '',
      image_url: '',
      is_active: true
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setShowHostModal(true);
  };

  const handleEditHost = (host) => {
    setEditingHost(host);
    setHostForm({
      name: host.name,
      byline: host.byline,
      image_url: host.image_url || '',
      is_active: host.is_active
    });
    setSelectedFile(null);
    setPreviewUrl(host.image_url || '');
    setShowHostModal(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageForCrop(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob) => {
    setCroppedImageBlob(croppedBlob);
    setSelectedFile(croppedBlob);
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(croppedUrl);
    setShowCropModal(false);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setRawImageForCrop('');
  };

  const handleSaveHost = async () => {
    try {
      const data = {
        name: hostForm.name,
        byline: hostForm.byline,
        ...(hostForm.image_url && { image_url: hostForm.image_url }),
        is_active: hostForm.is_active
      };

      let savedHost;
      if (editingHost) {
        savedHost = await eventsAPI.updateHost(editingHost.id, data);
      } else {
        savedHost = await eventsAPI.createHost(data);
      }

      // If there's a file selected, upload it
      if (selectedFile && savedHost?.id) {
        try {
          await eventsAPI.uploadHostImage(savedHost.id, selectedFile);
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr);
          alert(`Host saved but image upload failed: ${uploadErr.message}`);
        }
      }

      setShowHostModal(false);
      fetchHosts();
    } catch (err) {
      alert(`Error saving host: ${err.message}`);
    }
  };

  const handleDeleteHost = async () => {
    if (!deletingHost) return;

    try {
      await eventsAPI.deleteHost(deletingHost.id);
      setShowDeleteModal(false);
      setDeletingHost(null);
      fetchHosts();
    } catch (err) {
      alert(`Error deleting host: ${err.message}`);
    }
  };

  const handleToggleActive = async (host) => {
    try {
      await eventsAPI.updateHost(host.id, { is_active: !host.is_active });
      fetchHosts();
    } catch (err) {
      alert(`Error updating host: ${err.message}`);
    }
  };

  const handleUploadImage = (host) => {
    setUploadingHost(host);
    setSelectedFile(null);
    setCroppedImageBlob(null);
    setPreviewUrl(host.image_url || '');
    setShowImageUploadModal(true);
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !uploadingHost) return;

    setUploadLoading(true);
    try {
      await eventsAPI.uploadHostImage(uploadingHost.id, selectedFile);
      setShowImageUploadModal(false);
      setUploadingHost(null);
      setSelectedFile(null);
      setPreviewUrl('');
      fetchHosts();
    } catch (err) {
      alert(`Error uploading image: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteImage = (host) => {
    setDeletingImageHost(host);
    setShowDeleteImageModal(true);
  };

  const handleConfirmDeleteImage = async () => {
    if (!deletingImageHost) return;

    try {
      await eventsAPI.deleteHostImage(deletingImageHost.id);
      setShowDeleteImageModal(false);
      setDeletingImageHost(null);
      fetchHosts();
    } catch (err) {
      alert(`Error deleting image: ${err.message}`);
    }
  };

  const handleViewHostEvents = (host) => {
    setSelectedHost(host);
    setShowHostEventsModal(true);
    fetchHostEvents(host.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return eventsAPI.formatLocalDate(dateString);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return eventsAPI.formatLocalDateTime(dateString);
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Hosts Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage event hosts and their information
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <div className="px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('hosts')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'hosts'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Hosts List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Hosts List Tab */}
      {activeTab === 'hosts' && (
        <>
          {/* Filters and Actions */}
          <div className="p-6">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search in name and byline..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />

                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateHost}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                >
                  Create Host
                </button>
              </div>
            </div>
          </div>

          {/* Hosts Table */}
          <div className="px-6 pb-6">
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-12">Error: {error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Image
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Name
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Byline
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Status
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Created
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                        {hosts.map(host => (
                          <tr key={host.id}>
                            <td className="px-6 py-4">
                              {host.image_url ? (
                                <img
                                  src={host.image_url}
                                  alt={host.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-600 text-sm font-semibold">
                                    {host.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleViewHostEvents(host)}
                                className={`text-sm font-medium hover:underline ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}
                              >
                                {host.name}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {host.byline}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleActive(host)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  host.is_active ? 'bg-zenible-primary' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    host.is_active ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                                {formatDate(host.created_at)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditHost(host)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleUploadImage(host)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Upload Image
                                </button>
                                {host.image_url && (
                                  <button
                                    onClick={() => handleDeleteImage(host)}
                                    className="text-orange-600 hover:text-orange-900"
                                  >
                                    Delete Image
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setDeletingHost(host);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className={`px-6 py-3 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Page {page} of {totalPages} ({total} total)
                        </span>
                        <select
                          value={perPage}
                          onChange={(e) => {
                            setPerPage(parseInt(e.target.value));
                            setPage(1);
                          }}
                          className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                        >
                          <option value="10">10 per page</option>
                          <option value="20">20 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className={`px-3 py-1 text-sm rounded ${
                            page === 1
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-zenible-primary text-white hover:bg-opacity-90'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className={`px-3 py-1 text-sm rounded ${
                            page === totalPages
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-zenible-primary text-white hover:bg-opacity-90'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="p-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Hosts</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.total_hosts || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Active Hosts</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.active_hosts || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Hosts with Events</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.hosts_with_events || 0}
                  </div>
                </div>
              </div>

              {analytics.host_statistics && analytics.host_statistics.length > 0 && (
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className="p-4 border-b">
                    <h3 className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                      Host Statistics
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Host Name
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Event Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                        {analytics.host_statistics.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4">
                              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.host_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.event_count || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              No analytics data available
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Host Modal */}
      {showHostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {editingHost ? 'Edit Host' : 'Create Host'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={hostForm.name}
                  onChange={(e) => setHostForm({ ...hostForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Host name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Byline *
                </label>
                <input
                  type="text"
                  value={hostForm.byline}
                  onChange={(e) => setHostForm({ ...hostForm, byline: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  placeholder="Host byline or description"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />
                {previewUrl && (
                  <div className="mt-2">
                    <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                  </div>
                )}
                <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Upload an image or save host first and use "Upload Image" action later
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_host"
                  checked={hostForm.is_active}
                  onChange={(e) => setHostForm({ ...hostForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active_host" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Active
                </label>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleSaveHost}
                disabled={!hostForm.name || !hostForm.byline}
                className={`px-4 py-2 rounded-lg ${
                  hostForm.name && hostForm.byline
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingHost ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowHostModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete this host?
              </p>
              <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                "{deletingHost.name}"
              </p>
              <p className={`mt-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Note: You cannot delete a host that is assigned to events.
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleDeleteHost}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingHost(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUploadModal && uploadingHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Upload Image for {uploadingHost.name}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Select Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Max file size: 10MB. Formats: JPEG, PNG, GIF, WebP
                </p>
              </div>

              {previewUrl && (
                <div className="flex justify-center">
                  <img src={previewUrl} alt="Preview" className="w-32 h-32 rounded-full object-cover" />
                </div>
              )}
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleImageUpload}
                disabled={!selectedFile || uploadLoading}
                className={`px-4 py-2 rounded-lg ${
                  selectedFile && !uploadLoading
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {uploadLoading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => {
                  setShowImageUploadModal(false);
                  setUploadingHost(null);
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                disabled={uploadLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Confirmation Modal */}
      {showDeleteImageModal && deletingImageHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete Image
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete the image for this host?
              </p>
              <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                "{deletingImageHost.name}"
              </p>
              {deletingImageHost.image_url && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={deletingImageHost.image_url}
                    alt={deletingImageHost.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
              )}
              <p className={`mt-4 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                This action cannot be undone. The host's profile will show the default placeholder.
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleConfirmDeleteImage}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Image
              </button>
              <button
                onClick={() => {
                  setShowDeleteImageModal(false);
                  setDeletingImageHost(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showCropModal && rawImageForCrop && (
        <ImageCropperModal
          imageUrl={rawImageForCrop}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
          darkMode={darkMode}
          cropShape="round"
          aspectRatio={1}
        />
      )}

      {/* Host Events Modal */}
      {showHostEventsModal && selectedHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Events for: {selectedHost.name}
              </h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {hostEventsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : hostEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Title
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Start Date
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Duration
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                      {hostEvents.map((event, idx) => (
                        <tr key={idx}>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {event.title}
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {formatDateTime(event.start_datetime)}
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {event.duration_minutes} min
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {event.is_active ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  No events for this host
                </div>
              )}
            </div>
            <div className={`px-6 py-4 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={() => {
                  setShowHostEventsModal(false);
                  setSelectedHost(null);
                  setHostEvents([]);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
