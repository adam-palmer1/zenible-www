import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';

export default function ConversationManagement() {
  const { darkMode } = useOutletContext();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationDetails, setConversationDetails] = useState(null);
  const [conversationStats, setConversationStats] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [characterFilter, setCharacterFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minMessages, setMinMessages] = useState('');
  const [maxMessages, setMaxMessages] = useState('');
  const [orderBy, setOrderBy] = useState('created_at');
  const [orderDir, setOrderDir] = useState('desc');

  // Export state
  const [exportFormat, setExportFormat] = useState('json');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [page, perPage, search, userFilter, characterFilter, startDate, endDate, minMessages, maxMessages, orderBy, orderDir]);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(userFilter && { user_id: userFilter }),
        ...(characterFilter && { character_id: characterFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(minMessages && { min_messages: minMessages }),
        ...(maxMessages && { max_messages: maxMessages }),
        order_by: orderBy,
        order_dir: orderDir,
      };

      const response = await adminAPI.getConversations(params);
      setConversations(response.conversations || response.items || []);
      setTotalPages(response.total_pages || Math.ceil((response.total || 0) / perPage) || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (conversation) => {
    setSelectedConversation(conversation);
    setShowDetailsModal(true);
    setLoadingDetails(true);

    try {
      const details = await adminAPI.getConversation(conversation.id);
      setConversationDetails(details);
    } catch (err) {
      console.error('Error fetching conversation details:', err);
      setConversationDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewStats = async () => {
    setShowStatsModal(true);
    setLoadingStats(true);

    try {
      const params = {
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      };
      const stats = await adminAPI.getConversationStats(params);
      setConversationStats(stats);
    } catch (err) {
      console.error('Error fetching conversation stats:', err);
      setConversationStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleExport = async () => {
    if (!selectedConversation) return;

    setExportLoading(true);
    try {
      await adminAPI.exportConversation(selectedConversation.id, exportFormat);
      setShowExportModal(false);
      setSelectedConversation(null);
    } catch (err) {
      console.error('Error exporting conversation:', err);
      alert(`Failed to export conversation: ${err.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessage = (message) => {
    if (!message) return '';
    if (typeof message === 'string') return message;
    if (message.content) {
      if (Array.isArray(message.content)) {
        return message.content.map(c => c.text || '').join(' ');
      }
      return message.content;
    }
    return JSON.stringify(message);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
            Conversation Management
          </h1>

          <button
            onClick={handleViewStats}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
          >
            View Statistics
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-bg' : 'border-neutral-200 bg-gray-50'}`}>
        <div className="space-y-4">
          {/* First Row */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <input
              type="text"
              placeholder="User ID/Email"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <input
              type="text"
              placeholder="Character ID"
              value={characterFilter}
              onChange={(e) => setCharacterFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <button
              onClick={() => { setPage(1); fetchConversations(); }}
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
            >
              Search
            </button>
          </div>

          {/* Second Row */}
          <div className="flex items-center gap-3">
            <input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <input
              type="number"
              placeholder="Min Messages"
              value={minMessages}
              onChange={(e) => setMinMessages(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <input
              type="number"
              placeholder="Max Messages"
              value={maxMessages}
              onChange={(e) => setMaxMessages(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              <option value="created_at">Created Date</option>
              <option value="updated_at">Updated Date</option>
              <option value="message_count">Message Count</option>
            </select>

            <select
              value={orderDir}
              onChange={(e) => setOrderDir(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className={`rounded-xl border overflow-hidden mt-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
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
                        Conversation ID
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        User
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Character
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Title
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Messages
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
                    {conversations.map((conversation) => (
                      <tr key={conversation.id}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {conversation.id.substring(0, 8)}...
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          <div>
                            <div className="font-medium">{conversation.user_email || 'Unknown'}</div>
                            <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                              {conversation.user_name || ''}
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {conversation.character_name || 'Unknown'}
                        </td>
                        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          <div className="max-w-xs truncate">
                            {conversation.title || 'Untitled Conversation'}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {conversation.message_count || 0}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatDate(conversation.created_at)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium`}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(conversation)}
                              className="text-zenible-primary hover:text-zenible-primary/80"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setSelectedConversation(conversation);
                                setShowExportModal(true);
                              }}
                              className="text-green-600 hover:text-green-500"
                            >
                              Export
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`px-6 py-3 flex items-center justify-between border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`px-3 py-1 rounded ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'} ${darkMode ? 'text-zenible-dark-text' : ''}`}
                    >
                      Previous
                    </button>
                    <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`px-3 py-1 rounded ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'} ${darkMode ? 'text-zenible-dark-text' : ''}`}
                    >
                      Next
                    </button>
                  </div>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(parseInt(e.target.value));
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conversation Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Conversation Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedConversation(null);
                  setConversationDetails(null);
                }}
                className={`p-2 hover:bg-gray-100 rounded-lg ${darkMode ? 'hover:bg-zenible-dark-bg text-zenible-dark-text' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : conversationDetails ? (
                <div className="space-y-6">
                  {/* Conversation Info */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                    <h3 className={`font-semibold mb-3 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      Conversation Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>ID:</span>
                        <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {conversationDetails.id}
                        </span>
                      </div>
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>User:</span>
                        <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {conversationDetails.user_email} ({conversationDetails.user_name})
                        </span>
                      </div>
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Character:</span>
                        <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {conversationDetails.character_name}
                        </span>
                      </div>
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Created:</span>
                        <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatDate(conversationDetails.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div>
                    <h3 className={`font-semibold mb-3 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      Messages ({conversationDetails.messages?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {conversationDetails.messages?.map((message, index) => (
                        <div
                          key={message.id || index}
                          className={`p-4 rounded-lg ${
                            message.role === 'user'
                              ? darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
                              : darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                          } border`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {message.role === 'user' ? 'User' : conversationDetails.character_name || 'Assistant'}
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                          <div className={`whitespace-pre-wrap ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                            {formatMessage(message)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-red-500">
                  Failed to load conversation details
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-xl overflow-hidden ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Export Conversation
              </h2>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedConversation(null);
                }}
                className={`p-2 hover:bg-gray-100 rounded-lg ${darkMode ? 'hover:bg-zenible-dark-bg text-zenible-dark-text' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="txt">Text</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setSelectedConversation(null);
                  }}
                  className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg' : 'border-neutral-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-3xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Conversation Statistics
              </h2>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setConversationStats(null);
                }}
                className={`p-2 hover:bg-gray-100 rounded-lg ${darkMode ? 'hover:bg-zenible-dark-bg text-zenible-dark-text' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : conversationStats ? (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Total Conversations
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {conversationStats.total_conversations || 0}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Active Users
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {conversationStats.active_users || 0}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Avg Messages per Conversation
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {conversationStats.avg_messages_per_conversation?.toFixed(1) || 0}
                      </div>
                    </div>
                  </div>

                  {/* Popular Characters */}
                  {conversationStats.popular_characters && (
                    <div>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        Most Popular AI Characters
                      </h3>
                      <div className={`rounded-lg overflow-hidden border ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                        <table className="w-full">
                          <thead className={`${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                            <tr>
                              <th className={`px-4 py-2 text-left text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                                Character
                              </th>
                              <th className={`px-4 py-2 text-right text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                                Conversations
                              </th>
                              <th className={`px-4 py-2 text-right text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                                Messages
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                            {conversationStats.popular_characters.map((char, index) => (
                              <tr key={index}>
                                <td className={`px-4 py-2 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                  {char.name}
                                </td>
                                <td className={`px-4 py-2 text-sm text-right ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                  {char.conversation_count}
                                </td>
                                <td className={`px-4 py-2 text-sm text-right ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                  {char.total_messages}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Usage Trends */}
                  {conversationStats.usage_trends && (
                    <div>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        Recent Usage Trends
                      </h3>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>
                              Conversations Today:
                            </span>
                            <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                              {conversationStats.usage_trends.today || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>
                              Conversations This Week:
                            </span>
                            <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                              {conversationStats.usage_trends.this_week || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>
                              Conversations This Month:
                            </span>
                            <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                              {conversationStats.usage_trends.this_month || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-red-500">
                  Failed to load statistics
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}