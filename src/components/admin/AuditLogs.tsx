import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import { LoadingSpinner } from '../shared';
import DatePickerCalendar from '../shared/DatePickerCalendar';

interface AdminOutletContext {
  darkMode: boolean;
}

interface AuditLog {
  id?: string;
  timestamp?: string;
  created_at?: string;
  user_email?: string;
  user_id?: string;
  action: string;
  resource?: string;
  ip_address?: string;
  changes?: unknown;
  details?: unknown;
}

interface AuditLogsResponse {
  audit_logs: AuditLog[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function AuditLogs() {
  const { darkMode } = useOutletContext<AdminOutletContext>();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    start_date: '',
    end_date: '',
    page: 1,
    per_page: 50
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters.page]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.action) params.action = filters.action;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      params.page = String(filters.page);
      params.per_page = String(filters.per_page);

      const response = await adminAPI.getAuditLogs(params) as AuditLogsResponse;
      setLogs(response.audit_logs || []);
      setPagination({
        total: response.total || 0,
        page: response.page || 1,
        total_pages: response.total_pages || 1,
        has_next: response.has_next || false,
        has_prev: response.has_prev || false
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchAuditLogs();
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  const getActionColor = (action: string): string => {
    if (action.includes('create')) return 'text-green-600';
    if (action.includes('update')) return 'text-blue-600';
    if (action.includes('delete')) return 'text-red-600';
    if (action.includes('login')) return 'text-purple-600';
    return darkMode ? 'text-zenible-dark-text' : 'text-gray-900';
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Audit Logs
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          System activity and security audit trail
        </p>
      </div>

      {/* Filters */}
      <div className="p-6">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="User ID"
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />
            <input
              type="text"
              placeholder="Action"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            />
            <DatePickerCalendar
              value={filters.start_date}
              onChange={(date) => setFilters({ ...filters, start_date: date })}
            />
            <DatePickerCalendar
              value={filters.end_date}
              onChange={(date) => setFilters({ ...filters, end_date: date })}
            />
            <button type="submit" className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <div className="px-6 pb-6">
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          {loading ? (
            <LoadingSpinner height="py-12" />
          ) : error ? (
            <div className="text-red-500 text-center py-12">Error: {error}</div>
          ) : logs.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              No audit logs found
            </div>
          ) : (
            <table className="w-full">
              <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Timestamp</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>User</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Action</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Resource</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>IP Address</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Details</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                {logs.map((log, index) => (
                  <tr key={log.id || index}>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {formatDate(log.timestamp || log.created_at || null)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {log.user_email || log.user_id || 'System'}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {log.resource || '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {log.ip_address || '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      {log.changes || log.details ? (
                        <details className="cursor-pointer">
                          <summary>View</summary>
                          <pre className="text-xs mt-1 max-w-md overflow-auto">
                            {JSON.stringify(log.changes || log.details, null, 2)}
                          </pre>
                        </details>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && !error && logs.length > 0 && pagination.total_pages > 1 && (
            <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Showing {((pagination.page - 1) * filters.per_page) + 1} to{' '}
                {Math.min(pagination.page * filters.per_page, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  disabled={!pagination.has_prev}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    pagination.has_prev
                      ? darkMode
                        ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border'
                        : 'border-neutral-200 text-gray-700 hover:bg-gray-50'
                      : 'border-neutral-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                <span className={`px-3 py-2 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  disabled={!pagination.has_next}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    pagination.has_next
                      ? darkMode
                        ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border'
                        : 'border-neutral-200 text-gray-700 hover:bg-gray-50'
                      : 'border-neutral-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}