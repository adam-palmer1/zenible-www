import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import { LoadingSpinner } from '../shared';
import Combobox from '../ui/combobox/Combobox';

interface AdminThread {
  id: string;
  thread_id?: string;
  openai_thread_id?: string;
  user_id?: string;
  assistant_id?: string;
  character_name?: string;
  ai_character_id?: string;
  status: string;
  last_run_status?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

interface OpenAIThreadDetails {
  assistant_id?: string;
  created_at?: number;
  metadata?: Record<string, unknown>;
}

interface ThreadMessage {
  id?: string;
  role: string;
  content?: Array<{ text?: { value?: string } }>;
  created_at?: number;
  file_ids?: string[];
}

interface CleanupResult {
  orphaned_count?: number;
  deleted_count?: number;
}

export default function ThreadManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showMessagesModal, setShowMessagesModal] = useState<boolean>(false);
  const [showCleanupModal, setShowCleanupModal] = useState<boolean>(false);
  const [selectedThread, setSelectedThread] = useState<AdminThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [openAIDetails, setOpenAIDetails] = useState<OpenAIThreadDetails | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  // Pagination and filtering
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [orderDir, setOrderDir] = useState<string>('desc');

  // Cleanup state
  const [cleanupResults, setCleanupResults] = useState<CleanupResult | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchThreads();
  }, [page, perPage, search, userId, status, orderBy, orderDir]);

  const fetchThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        ...(search && { search }),
        ...(userId && { user_id: userId }),
        ...(status && { status }),
        order_by: orderBy,
        order_dir: orderDir,
      };

      const response = await adminAPI.getThreads(params) as { threads?: AdminThread[]; items?: AdminThread[]; total?: number; total_pages?: number };
      setThreads(response.threads || response.items || []);
      // Calculate total pages from total and per_page
      const totalCount = response.total || 0;
      const calculatedPages = Math.ceil(totalCount / perPage);
      setTotalPages(response.total_pages || calculatedPages || 1);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (thread: AdminThread) => {
    setSelectedThread(thread);
    setShowDetailsModal(true);

    // Fetch OpenAI details
    try {
      const details = await adminAPI.getOpenAIThread(thread.id) as OpenAIThreadDetails;
      setOpenAIDetails(details);
    } catch (err: any) {
      console.error('Error fetching OpenAI thread details:', err);
      setOpenAIDetails(null);
    }
  };

  const handleViewMessages = async (thread: AdminThread) => {
    setSelectedThread(thread);
    setShowMessagesModal(true);
    setLoadingMessages(true);

    try {
      const messages = await adminAPI.getThreadMessages(thread.id, {
        limit: '100',
        order: 'asc',
      }) as { data?: ThreadMessage[] };
      setThreadMessages(messages.data || []);
    } catch (err: any) {
      console.error('Error fetching thread messages:', err);
      setThreadMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDeleteThread = async (threadId: string, deleteFromOpenAI: boolean = true) => {
    if (!confirm(`Are you sure you want to delete this thread? ${deleteFromOpenAI ? 'It will also be deleted from OpenAI.' : ''}`)) {
      return;
    }

    try {
      await adminAPI.deleteThread(threadId, deleteFromOpenAI);
      fetchThreads();
      if (showDetailsModal || showMessagesModal) {
        setShowDetailsModal(false);
        setShowMessagesModal(false);
      }
    } catch (err: any) {
      alert(`Error deleting thread: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (threadId: string, newStatus: string) => {
    try {
      await adminAPI.updateThreadStatus(threadId, newStatus);
      fetchThreads();
      if (selectedThread) {
        setSelectedThread({ ...selectedThread, status: newStatus });
      }
    } catch (err: any) {
      alert(`Error updating thread status: ${err.message}`);
    }
  };

  const handleCleanup = async (dryRun: boolean = true) => {
    setCleanupLoading(true);
    try {
      const result = await adminAPI.cleanupOrphanedThreads(dryRun) as CleanupResult;
      setCleanupResults(result);
      if (!dryRun && (result.deleted_count ?? 0) > 0) {
        fetchThreads();
      }
    } catch (err: any) {
      alert(`Error during cleanup: ${err.message}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string): string => {
    const badges: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
      DELETED: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getRunStatusBadge = (status: string): string => {
    const badges: Record<string, string> = {
      queued: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      requires_action: 'bg-orange-100 text-orange-800',
      cancelling: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Thread Management
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
              Manage AI conversation threads and messages
            </p>
          </div>
          <button
            onClick={() => setShowCleanupModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Cleanup Orphaned Threads
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <input
              type="text"
              placeholder="Search threads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <input
              type="text"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />

            <Combobox
              options={[
                { id: 'ACTIVE', label: 'Active' },
                { id: 'ARCHIVED', label: 'Archived' },
                { id: 'DELETED', label: 'Deleted' },
              ]}
              value={status}
              onChange={(value) => setStatus(value)}
              placeholder="All Status"
              allowClear
              className="w-36"
            />

            <Combobox
              options={[
                { id: 'created_at', label: 'Created Date' },
                { id: 'updated_at', label: 'Updated Date' },
                { id: 'last_message_at', label: 'Last Message' },
              ]}
              value={orderBy}
              onChange={(value) => setOrderBy(value || 'created_at')}
              allowClear={false}
              className="w-44"
            />

            <Combobox
              options={[
                { id: 'desc', label: 'Newest First' },
                { id: 'asc', label: 'Oldest First' },
              ]}
              value={orderDir}
              onChange={(value) => setOrderDir(value || 'desc')}
              allowClear={false}
              className="w-40"
            />

            <button
              onClick={() => { setPage(1); fetchThreads(); }}
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Threads Table */}
      <div className="px-6 pb-6">
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          {loading ? (
            <LoadingSpinner height="py-12" />
          ) : error ? (
            <div className="text-red-500 text-center py-12">Error: {error}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Thread ID
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        User
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Character
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Last Run
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
                    {threads.map((thread: AdminThread) => (
                      <tr key={thread.id}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {thread.thread_id ? thread.thread_id.substring(0, 12) : thread.id.substring(0, 8)}...
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {thread.user_id ? thread.user_id.substring(0, 8) : 'System'}...
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {thread.assistant_id || thread.character_name || thread.ai_character_id?.substring(0, 8) || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(thread.status)}`}>
                            {thread.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(thread.last_run_status || (thread.metadata?.analysis_type as string)) && (
                            <span className={`px-2 py-1 text-xs rounded-full ${getRunStatusBadge(thread.last_run_status || String(thread.metadata?.analysis_type))}`}>
                              {thread.last_run_status || String(thread.metadata?.analysis_type)}
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatDate(thread.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetails(thread)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleViewMessages(thread)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Messages
                            </button>
                            <button
                              onClick={() => handleDeleteThread(thread.id, true)}
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
                      Page {page} of {totalPages}
                    </span>
                    <Combobox
                      options={[
                        { id: '10', label: '10 per page' },
                        { id: '20', label: '20 per page' },
                        { id: '50', label: '50 per page' },
                        { id: '100', label: '100 per page' },
                      ]}
                      value={String(perPage)}
                      onChange={(value) => {
                        setPerPage(parseInt(value || '20'));
                        setPage(1);
                      }}
                      allowClear={false}
                      className="w-40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`px-3 py-1 text-sm rounded ${page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-zenible-primary text-white hover:bg-opacity-90'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`px-3 py-1 text-sm rounded ${page === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-zenible-primary text-white hover:bg-opacity-90'}`}
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

      {/* Thread Details Modal */}
      {showDetailsModal && selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b sticky top-0 ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Thread Details
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Database Information
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Thread ID</dt>
                      <dd className={`font-mono text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {selectedThread.id}
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>OpenAI Thread ID</dt>
                      <dd className={`font-mono text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {selectedThread.openai_thread_id || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>User ID</dt>
                      <dd className={`font-mono text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {selectedThread.user_id || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Status</dt>
                      <dd>
                        <Combobox
                          options={[
                            { id: 'ACTIVE', label: 'Active' },
                            { id: 'ARCHIVED', label: 'Archived' },
                            { id: 'DELETED', label: 'Deleted' },
                          ]}
                          value={selectedThread.status}
                          onChange={(value) => handleUpdateStatus(selectedThread.id, value)}
                          allowClear={false}
                          className="w-36"
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Created</dt>
                      <dd className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {formatDate(selectedThread.created_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Updated</dt>
                      <dd className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {formatDate(selectedThread.updated_at ?? '')}
                      </dd>
                    </div>
                  </dl>
                </div>

                {openAIDetails && (
                  <div>
                    <h4 className={`font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      OpenAI Information
                    </h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Assistant ID</dt>
                        <dd className={`font-mono text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {openAIDetails.assistant_id || 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Created At</dt>
                        <dd className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {openAIDetails.created_at ? new Date(openAIDetails.created_at * 1000).toLocaleString() : 'N/A'}
                        </dd>
                      </div>
                      {openAIDetails.metadata && Object.keys(openAIDetails.metadata).length > 0 && (
                        <div>
                          <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Metadata</dt>
                          <dd className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            <pre className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                              {JSON.stringify(openAIDetails.metadata, null, 2)}
                            </pre>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              {selectedThread.metadata && Object.keys(selectedThread.metadata).length > 0 && (
                <div className="mt-4">
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Thread Metadata
                  </h4>
                  <pre className={`text-xs p-3 rounded ${darkMode ? 'bg-zenible-dark-bg text-zenible-dark-text' : 'bg-gray-100 text-gray-900'}`}>
                    {JSON.stringify(selectedThread.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => handleDeleteThread(selectedThread.id, false)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Delete from DB Only
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteThread(selectedThread.id, true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete from DB & OpenAI
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Modal */}
      {showMessagesModal && selectedThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b sticky top-0 ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Thread Messages
              </h3>
            </div>
            <div className="p-6">
              {loadingMessages ? (
                <LoadingSpinner height="py-12" />
              ) : threadMessages.length === 0 ? (
                <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  No messages found
                </div>
              ) : (
                <div className="space-y-4">
                  {threadMessages.map((message: ThreadMessage, index: number) => (
                    <div
                      key={message.id || index}
                      className={`p-4 rounded-lg border ${
                        message.role === 'assistant'
                          ? darkMode
                            ? 'bg-blue-900/20 border-blue-800'
                            : 'bg-blue-50 border-blue-200'
                          : darkMode
                          ? 'bg-zenible-dark-bg border-zenible-dark-border'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {message.role === 'assistant' ? 'Assistant' : 'User'}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          {message.created_at ? new Date(message.created_at * 1000).toLocaleString() : ''}
                        </span>
                      </div>
                      <div className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                        {message.content?.[0]?.text?.value || JSON.stringify(message.content)}
                      </div>
                      {message.file_ids && message.file_ids.length > 0 && (
                        <div className="mt-2">
                          <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Files: {message.file_ids.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowMessagesModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Cleanup Orphaned Threads
              </h3>
            </div>
            <div className="p-6">
              <p className={`mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                This will find and optionally delete threads that are marked as DELETED in the database
                but may still exist in OpenAI.
              </p>

              {cleanupResults && (
                <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-100'}`}>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Cleanup Results
                  </h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Orphaned Threads Found:
                      </dt>
                      <dd className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {cleanupResults.orphaned_count || 0}
                      </dd>
                    </div>
                    {cleanupResults.deleted_count !== undefined && (
                      <div className="flex justify-between">
                        <dt className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Threads Deleted:
                        </dt>
                        <dd className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {cleanupResults.deleted_count}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleCleanup(true)}
                  disabled={cleanupLoading}
                  className={`px-4 py-2 rounded-lg ${cleanupLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {cleanupLoading ? 'Running...' : 'Dry Run'}
                </button>
                <button
                  onClick={() => handleCleanup(false)}
                  disabled={cleanupLoading}
                  className={`px-4 py-2 rounded-lg ${cleanupLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                >
                  {cleanupLoading ? 'Running...' : 'Execute Cleanup'}
                </button>
                <button
                  onClick={() => {
                    setShowCleanupModal(false);
                    setCleanupResults(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
