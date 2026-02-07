import React from 'react';
import { Loader2, MoreVertical } from 'lucide-react';
import { AdminUser } from './types';

interface UsersTableProps {
  darkMode: boolean;
  loading: boolean;
  error: string | null;
  users: AdminUser[];
  page: number;
  setPage: (val: number) => void;
  perPage: number;
  setPerPage: (val: number) => void;
  totalPages: number;
  getPlanName: (planId: string) => string | null;
  formatDate: (dateString: string) => string;
  openActionsDropdown: (e: React.MouseEvent, user: AdminUser) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  darkMode,
  loading,
  error,
  users,
  page,
  setPage,
  perPage,
  setPerPage,
  totalPages,
  getPlanName,
  formatDate,
  openActionsDropdown,
}) => {
  return (
    <div className="px-6 pb-6">
      <div className={`rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-12">Error: {error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>User</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Role</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Plan</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Subscription</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Active</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Verified</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Created</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                  {users.map((user: AdminUser) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || 'N/A'}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {getPlanName(user.current_plan_id ?? '') || <span className="text-gray-400">-</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.subscription_status ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.subscription_status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            user.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            user.subscription_status === 'past_due' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            user.subscription_status === 'canceled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            user.subscription_status === 'unpaid' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {user.subscription_status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.deleted_at
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {user.deleted_at ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.email_verified
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {user.email_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>{formatDate(user.created_at ?? '')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => openActionsDropdown(e, user)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
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
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Page {page} of {totalPages}</span>
                  <select
                    value={perPage}
                    onChange={(e) => { setPerPage(parseInt(e.target.value)); setPage(1); }}
                    className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  >
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className={`px-3 py-1 text-sm rounded ${page === 1 ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-700' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>Previous</button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={`px-3 py-1 text-sm rounded ${page === totalPages ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-700' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>Next</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsersTable;
