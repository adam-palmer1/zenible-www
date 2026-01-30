import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';

export default function UserManagement() {
  const { darkMode } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [plans, setPlans] = useState([]);

  // Pagination and filtering state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [orderBy, setOrderBy] = useState('created_at');

  // Assign plan state
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, [page, perPage, search, roleFilter, statusFilter, isActiveFilter, orderBy]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(isActiveFilter !== '' && { is_active: isActiveFilter === 'true' }),
        order_by: orderBy,
      };

      const response = await adminAPI.getUsers(params);
      setUsers(response.items || []);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await adminAPI.getPlans({ is_active: true });
      setPlans(response.items || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlanId) return;

    try {
      await adminAPI.assignPlanToUser(selectedUser.id, selectedPlanId, billingCycle);
      setShowAssignPlanModal(false);
      fetchUsers();
    } catch (err) {
      alert(`Error assigning plan: ${err.message}`);
    }
  };

  const handleVerifyEmail = async (userId) => {
    try {
      await adminAPI.verifyUserEmail(userId);
      fetchUsers();
    } catch (err) {
      alert(`Error verifying email: ${err.message}`);
    }
  };

  const handleResetApiUsage = async (userId) => {
    try {
      await adminAPI.resetUserApiUsage(userId);
      fetchUsers();
    } catch (err) {
      alert(`Error resetting API usage: ${err.message}`);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getUserStatusBadge = (user) => {
    let status = user.status || 'unknown';
    let badgeClass = '';

    switch (status) {
      case 'subscriber':
        badgeClass = 'bg-green-100 text-green-800';
        break;
      case 'verified':
        badgeClass = 'bg-blue-100 text-blue-800';
        break;
      case 'unverified':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        break;
      case 'anonymous':
        badgeClass = 'bg-gray-100 text-gray-800';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badgeClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div
        className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}
      >
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          User Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage users, roles, and permissions
        </p>
      </div>

      {/* Filters */}
      <div className="p-6">
        <div
          className={`p-4 rounded-xl border ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border'
              : 'bg-white border-neutral-200'
          }`}
        >
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <input
              type="text"
              placeholder="Search by email or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-neutral-200'
              }`}
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <option value="">All Status</option>
              <option value="anonymous">Anonymous</option>
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
              <option value="subscriber">Subscriber</option>
            </select>

            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <option value="">All Users</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <option value="created_at">Created Date</option>
              <option value="-created_at">Created Date (Desc)</option>
              <option value="email">Email</option>
              <option value="full_name">Name</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="px-6 pb-6">
        <div
          className={`rounded-xl border overflow-hidden ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border'
              : 'bg-white border-neutral-200'
          }`}
        >
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
                  <thead
                    className={`border-b ${
                      darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
                    }`}
                  >
                    <tr>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                        }`}
                      >
                        User
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                        }`}
                      >
                        Role
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                        }`}
                      >
                        Status
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                        }`}
                      >
                        Verified
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                        }`}
                      >
                        Created
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                        }`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'
                    }`}
                  >
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div
                              className={`text-sm font-medium ${
                                darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                              }`}
                            >
                              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || 'N/A'}
                            </div>
                            <div
                              className={`text-sm ${
                                darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                              }`}
                            >
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className={`px-2 py-1 text-sm rounded border ${
                              darkMode
                                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                                : 'bg-white border-neutral-200'
                            }`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getUserStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm ${
                              user.is_verified || user.email_verified
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {user.is_verified || user.email_verified ? '✓ Verified' : '✗ Unverified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm ${
                              darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                            }`}
                          >
                            {formatDate(user.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            {!user.is_verified && !user.email_verified && (
                              <button
                                onClick={() => handleVerifyEmail(user.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Verify
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowAssignPlanModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Assign Plan
                            </button>
                            <button
                              onClick={() => handleResetApiUsage(user.id)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Reset Usage
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className={`px-6 py-3 border-t ${
                  darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}
                    >
                      Page {page} of {totalPages}
                    </span>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(parseInt(e.target.value));
                        setPage(1);
                      }}
                      className={`px-2 py-1 text-sm rounded border ${
                        darkMode
                          ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                          : 'bg-white border-neutral-200'
                      }`}
                    >
                      <option value="10">10 per page</option>
                      <option value="25">25 per page</option>
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-2xl mx-4 rounded-xl ${
              darkMode ? 'bg-zenible-dark-card' : 'bg-white'
            }`}
          >
            <div
              className={`px-6 py-4 border-b ${
                darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}
              >
                User Details
              </h3>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    ID
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedUser.id}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Email
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedUser.email}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Name
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedUser.first_name && selectedUser.last_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : selectedUser.first_name || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Role
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedUser.role}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Status
                  </dt>
                  <dd className={`mt-1`}>{getUserStatusBadge(selectedUser)}</dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Active
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedUser.is_active ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Email Verified
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedUser.email_verified || selectedUser.is_verified ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Current Plan ID
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedUser.current_plan_id || 'None'}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Created At
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {formatDate(selectedUser.created_at)}
                  </dd>
                </div>
                <div>
                  <dt
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}
                  >
                    Updated At
                  </dt>
                  <dd className={`mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {formatDate(selectedUser.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>
            <div
              className={`px-6 py-4 border-t ${
                darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
              }`}
            >
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {showAssignPlanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md mx-4 rounded-xl ${
              darkMode ? 'bg-zenible-dark-card' : 'bg-white'
            }`}
          >
            <div
              className={`px-6 py-4 border-b ${
                darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}
              >
                Assign Plan to {selectedUser.email}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}
                  >
                    Select Plan
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <option value="">Choose a plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.monthly_price}/mo
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}
                  >
                    Billing Cycle
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
            </div>
            <div
              className={`px-6 py-4 border-t flex gap-2 ${
                darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
              }`}
            >
              <button
                onClick={handleAssignPlan}
                disabled={!selectedPlanId}
                className={`px-4 py-2 rounded-lg ${
                  selectedPlanId
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Assign Plan
              </button>
              <button
                onClick={() => setShowAssignPlanModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}