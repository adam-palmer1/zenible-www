import React from 'react';
import { X, User } from 'lucide-react';
import { AdminUser } from './types';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface UserDetailsModalProps {
  user: AdminUser;
  onClose: () => void;
  getPlanName: (planId: string) => string | null;
  formatDate: (dateString: string) => string;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, getPlanName, formatDate }) => {
  useEscapeKey(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-xl font-semibold text-purple-600 dark:text-purple-400">{user.first_name?.charAt(0) || user.email?.charAt(0) || '?'}</span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || 'N/A'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
              <p className="text-sm text-gray-900 dark:text-white font-mono break-all mt-1">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
              <p className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>{user.role}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <p className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.deleted_at ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>{user.deleted_at ? 'Deleted' : 'Active'}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</label>
              <p className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.email_verified ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{user.email_verified ? 'Verified' : 'Unverified'}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">{getPlanName(user.current_plan_id ?? '') || <span className="text-gray-400">None</span>}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDate(user.created_at ?? '')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDate(user.updated_at ?? '')}</p>
            </div>
            {user.deleted_at && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-red-500">Deleted At</label>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formatDate(user.deleted_at)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
