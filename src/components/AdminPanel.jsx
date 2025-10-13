import { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminAPI';
import { useAuth } from '../contexts/AuthContext';
import UserEditModal from './UserEditModal';
import AIToolsManager from './admin/AIToolsManager';

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newPlan, setNewPlan] = useState({
    name: '',
    display_name: '',
    description: '',
    price_cents: 0,
    max_collections: 5,
    max_tokens: 1000000,
    max_api_calls: 10000,
    features: {
      advanced_analytics: false,
      priority_support: false,
      api_access: true
    }
  });

  const USERS_PER_PAGE = 20;

  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === 'users') {
      loadUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(currentPage * USERS_PER_PAGE, USERS_PER_PAGE);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await adminAPI.updateUser(userId, updates);
      loadUsers();
      setEditingUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await adminAPI.deleteUser(userId);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditUser = (userItem) => {
    setSelectedUser(userItem);
    setShowUserModal(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    loadUsers();
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createPlan(newPlan);
      setCreatingPlan(false);
      setNewPlan({
        name: '',
        display_name: '',
        description: '',
        price_cents: 0,
        max_collections: 5,
        max_tokens: 1000000,
        max_api_calls: 10000,
        features: {
          advanced_analytics: false,
          priority_support: false,
          api_access: true
        }
      });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-4">
          <h2 className="text-2xl font-semibold text-gray-800">Admin Panel</h2>
          <p className="text-gray-600 mt-1">Manage users and subscription plans</p>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setActiveTab('ai-tools')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ai-tools'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI Tools
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-4 flex justify-between">
              <h3 className="text-lg font-semibold">Manage Users</h3>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors"
              >
                + Create New User
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userItem.email}</div>
                            <div className="text-sm text-gray-500">
                              {userItem.email_verified ? (
                                <span className="text-green-600">✓ Verified</span>
                              ) : (
                                <span className="text-yellow-600">⚠ Unverified</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === userItem.id ? (
                            <select
                              value={userItem.role}
                              onChange={(e) => handleUpdateUser(userItem.id, { role: e.target.value })}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="USER">User</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userItem.role === 'ADMIN' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userItem.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === userItem.id ? (
                            <select
                              value={userItem.is_active}
                              onChange={(e) => handleUpdateUser(userItem.id, { is_active: e.target.value === 'true' })}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userItem.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {userItem.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{userItem.subscription_plan || 'None'}</div>
                          <div className="text-sm text-gray-500">{userItem.subscription_status || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {editingUser === userItem.id ? (
                              <button
                                onClick={() => setEditingUser(null)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Save
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditUser(userItem)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                  className="text-red-600 hover:text-red-900"
                                  disabled={userItem.id === user.id}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {totalUsers > USERS_PER_PAGE && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={(currentPage + 1) * USERS_PER_PAGE >= totalUsers}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">{currentPage * USERS_PER_PAGE + 1}</span>
                          {' '}to{' '}
                          <span className="font-medium">
                            {Math.min((currentPage + 1) * USERS_PER_PAGE, totalUsers)}
                          </span>
                          {' '}of{' '}
                          <span className="font-medium">{totalUsers}</span>
                          {' '}results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={(currentPage + 1) * USERS_PER_PAGE >= totalUsers}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setCreatingPlan(true)}
                className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors"
              >
                Create New Plan
              </button>
            </div>

            {creatingPlan && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Create New Plan</h3>
                <form onSubmit={handleCreatePlan} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plan Name (internal)
                      </label>
                      <input
                        type="text"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        placeholder="e.g., pro_monthly"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={newPlan.display_name}
                        onChange={(e) => setNewPlan({...newPlan, display_name: e.target.value})}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        placeholder="e.g., Professional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                      required
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      placeholder="Plan description..."
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (cents)
                      </label>
                      <input
                        type="number"
                        value={newPlan.price_cents}
                        onChange={(e) => setNewPlan({...newPlan, price_cents: parseInt(e.target.value)})}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Collections
                      </label>
                      <input
                        type="number"
                        value={newPlan.max_collections}
                        onChange={(e) => setNewPlan({...newPlan, max_collections: parseInt(e.target.value)})}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        value={newPlan.max_tokens}
                        onChange={(e) => setNewPlan({...newPlan, max_tokens: parseInt(e.target.value)})}
                        required
                        min="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max API Calls
                      </label>
                      <input
                        type="number"
                        value={newPlan.max_api_calls}
                        onChange={(e) => setNewPlan({...newPlan, max_api_calls: parseInt(e.target.value)})}
                        required
                        min="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Features
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPlan.features.api_access}
                          onChange={(e) => setNewPlan({
                            ...newPlan,
                            features: {...newPlan.features, api_access: e.target.checked}
                          })}
                          className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">API Access</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPlan.features.advanced_analytics}
                          onChange={(e) => setNewPlan({
                            ...newPlan,
                            features: {...newPlan.features, advanced_analytics: e.target.checked}
                          })}
                          className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Advanced Analytics</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPlan.features.priority_support}
                          onChange={(e) => setNewPlan({
                            ...newPlan,
                            features: {...newPlan.features, priority_support: e.target.checked}
                          })}
                          className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Priority Support</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setCreatingPlan(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors"
                    >
                      Create Plan
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-800">
                Plan management UI is ready. Connect to your backend to display existing plans.
              </p>
            </div>
          </div>
        )}

        {/* AI Tools Tab */}
        {activeTab === 'ai-tools' && (
          <AIToolsManager />
        )}
      </div>

      {showUserModal && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}