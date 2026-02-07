import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import {
  AdminUser,
  AdminPlan,
  ConfirmModalState,
  PermanentDeleteModalState,
  PermanentDeletePreview,
} from './user-management/types';
import UserFilters from './user-management/UserFilters';
import UsersTable from './user-management/UsersTable';
import UserDetailsModal from './user-management/UserDetailsModal';
import UserActionsModal from './user-management/UserActionsModal';
import ActionsDropdownMenu from './user-management/ActionsDropdownMenu';
import ConfirmModal from './user-management/ConfirmModal';
import PermanentDeleteModal from './user-management/PermanentDeleteModal';

export default function UserManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);
  const [showDropdownForUser, setShowDropdownForUser] = useState<string | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);

  // Pagination and filtering state
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [orderDir, setOrderDir] = useState<string>('desc');

  // Actions dropdown position
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [dropdownUser, setDropdownUser] = useState<AdminUser | null>(null);

  // User actions modal state
  const [actionFirstName, setActionFirstName] = useState<string>('');
  const [actionLastName, setActionLastName] = useState<string>('');
  const [actionPhone, setActionPhone] = useState<string>('');
  const [actionRole, setActionRole] = useState<string>('');
  const [actionIsVerified, setActionIsVerified] = useState<boolean>(false);
  const [actionPlanId, setActionPlanId] = useState<string>('');
  const [durationPreset, setDurationPreset] = useState<string>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showPlanSelectorModal, setShowPlanSelectorModal] = useState<boolean>(false);
  const [showDurationSelectorModal, setShowDurationSelectorModal] = useState<boolean>(false);
  const [showRoleSelectorModal, setShowRoleSelectorModal] = useState<boolean>(false);
  const [savingActions, setSavingActions] = useState<boolean>(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ open: false, title: '', message: '', action: null, variant: 'primary' });
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);

  // Permanent delete modal state
  const [permanentDeleteModal, setPermanentDeleteModal] = useState<PermanentDeleteModalState>({ open: false, user: null, preview: null, loading: false, step: 'preview' });
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, [page, perPage, search, roleFilter, activeFilter, verifiedFilter, orderBy, orderDir]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdownForUser) return;
    const handleClickOutside = () => {
      setShowDropdownForUser(null);
      setDropdownUser(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdownForUser]);

  const openActionsDropdown = (e: React.MouseEvent, user: AdminUser) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      right: window.innerWidth - rect.right,
    });
    setDropdownUser(user);
    setShowDropdownForUser(showDropdownForUser === user.id ? null : user.id);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(activeFilter === 'active' && { is_deleted: 'false' }),
        ...(activeFilter === 'deleted' && { is_deleted: 'true' }),
        ...(verifiedFilter && { email_verified: verifiedFilter }),
        order_by: orderBy,
        order_dir: orderDir,
      };

      const response = await adminAPI.getUsers(params) as Record<string, unknown>;
      setUsers((response.items as AdminUser[]) || []);
      setTotalPages((response.total_pages as number) || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await adminAPI.getPlans({ is_active: 'true' }) as Record<string, unknown>;
      setPlans((response.plans as AdminPlan[]) || (response.items as AdminPlan[]) || []);
    } catch (err: unknown) {
      console.error('Error fetching plans:', err);
    }
  };

  const getPlanName = (planId: string): string | null => {
    if (!planId) return null;
    const plan = plans.find((p: AdminPlan) => p.id === planId);
    return plan ? plan.name : planId;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openActionsModal = (user: AdminUser) => {
    setSelectedUser(user);
    setActionFirstName(user.first_name || '');
    setActionLastName(user.last_name || '');
    setActionPhone(user.phone || '');
    setActionRole(user.role || 'USER');
    setActionIsVerified(user.email_verified || false);
    setActionPlanId(user.current_plan_id || '');
    setDurationPreset('30days');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowActionsModal(true);
  };

  const handleCloseActionsModal = () => {
    setShowActionsModal(false);
    setSelectedUser(null);
    setActionFirstName('');
    setActionLastName('');
    setActionPhone('');
    setActionRole('');
    setActionIsVerified(false);
    setActionPlanId('');
    setDurationPreset('30days');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleSaveUserActions = async () => {
    if (!selectedUser) return;

    setSavingActions(true);
    try {
      // Build update data for profile, role, and verification
      const updateData: Record<string, string | boolean | null> = {};

      // Profile fields - only include if changed
      if (actionFirstName !== (selectedUser.first_name || '')) {
        updateData.first_name = actionFirstName;
      }
      if (actionLastName !== (selectedUser.last_name || '')) {
        updateData.last_name = actionLastName;
      }
      if (actionPhone !== (selectedUser.phone || '')) {
        updateData.phone = actionPhone;
      }

      // Role - only include if changed
      if (actionRole !== selectedUser.role) {
        updateData.role = actionRole.toLowerCase();
      }

      // Verification status - only include if changed
      const currentVerified = selectedUser.email_verified || false;
      if (actionIsVerified !== currentVerified) {
        updateData.email_verified = actionIsVerified;
      }

      // If plan changed, handle plan assignment
      const currentPlanId = selectedUser.current_plan_id || '';
      if (actionPlanId !== currentPlanId) {
        if (actionPlanId) {
          // Assign new plan using the assign-plan endpoint
          const options: { startDate?: string; endDate?: string } = {};

          if (durationPreset === 'custom') {
            if (customStartDate) {
              options.startDate = new Date(customStartDate).toISOString();
            }
            if (customEndDate) {
              options.endDate = new Date(customEndDate).toISOString();
            }
          } else if (durationPreset !== '30days') {
            const now = new Date();
            let endDate: Date | undefined;

            switch (durationPreset) {
              case '1year':
                endDate = new Date(now);
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
              case '6months':
                endDate = new Date(now);
                endDate.setMonth(endDate.getMonth() + 6);
                break;
              case '3months':
                endDate = new Date(now);
                endDate.setMonth(endDate.getMonth() + 3);
                break;
              case 'lifetime':
                endDate = new Date('2099-12-31T23:59:59Z');
                break;
              default:
                break;
            }

            if (endDate) {
              options.endDate = endDate.toISOString();
            }
          }

          await adminAPI.assignPlanToUser(selectedUser.id, actionPlanId, options);
        } else {
          // Remove plan by setting current_plan_id to null
          updateData.current_plan_id = null;
        }
      }

      // Update user profile/role/verification if any fields changed
      if (Object.keys(updateData).length > 0) {
        await adminAPI.updateUser(selectedUser.id, updateData);
      }

      handleCloseActionsModal();
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error updating user: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingActions(false);
    }
  };

  const handleResetApiUsage = async (userId: string) => {
    try {
      await adminAPI.resetUserApiUsage(userId);
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error resetting API usage: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleToggleVerification = async (userId: string, currentlyVerified: boolean) => {
    try {
      await adminAPI.updateUser(userId, { email_verified: !currentlyVerified });
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error updating verification: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string, atPeriodEnd: boolean = true) => {
    try {
      await adminAPI.cancelSubscription(subscriptionId, {
        cancelAtPeriodEnd: atPeriodEnd,
        reason: 'Canceled by admin'
      });
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error canceling subscription: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const hasStripeSubscription = (user: AdminUser): boolean => {
    return user.subscription_status !== null && user.subscription_status !== 'ADMIN';
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminAPI.deleteUser(userId);
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error deleting user: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await adminAPI.restoreUser(userId);
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error restoring user: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const openPermanentDeleteModal = async (user: AdminUser) => {
    setPermanentDeleteModal({ open: true, user, preview: null, loading: true, step: 'preview' });
    setDeleteConfirmText('');
    try {
      const preview = await adminAPI.permanentlyDeleteUser(user.id, { confirm: true, dryRun: true }) as PermanentDeletePreview;
      setPermanentDeleteModal(prev => ({ ...prev, preview, loading: false }));
    } catch (err: unknown) {
      alert(`Error fetching deletion preview: ${err instanceof Error ? err.message : String(err)}`);
      setPermanentDeleteModal({ open: false, user: null, preview: null, loading: false, step: 'preview' });
    }
  };

  const executePermanentDelete = async () => {
    if (deleteConfirmText !== 'DELETE' || !permanentDeleteModal.user) return;

    setPermanentDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await adminAPI.permanentlyDeleteUser(permanentDeleteModal.user.id, { confirm: true, dryRun: false });
      setPermanentDeleteModal({ open: false, user: null, preview: null, loading: false, step: 'preview' });
      setDeleteConfirmText('');
      fetchUsers();
    } catch (err: unknown) {
      alert(`Error permanently deleting user: ${err instanceof Error ? err.message : String(err)}`);
      setPermanentDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const closePermanentDeleteModal = () => {
    setPermanentDeleteModal({ open: false, user: null, preview: null, loading: false, step: 'preview' });
    setDeleteConfirmText('');
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          User Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage users, roles, and permissions
        </p>
      </div>

      {/* Filters */}
      <UserFilters
        darkMode={darkMode}
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        verifiedFilter={verifiedFilter}
        setVerifiedFilter={setVerifiedFilter}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
        orderDir={orderDir}
        setOrderDir={setOrderDir}
        onSearch={handleSearch}
      />

      {/* Users Table */}
      <UsersTable
        darkMode={darkMode}
        loading={loading}
        error={error}
        users={users}
        page={page}
        setPage={setPage}
        perPage={perPage}
        setPerPage={setPerPage}
        totalPages={totalPages}
        getPlanName={getPlanName}
        formatDate={formatDate}
        openActionsDropdown={openActionsDropdown}
      />

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
          getPlanName={getPlanName}
          formatDate={formatDate}
        />
      )}

      {/* User Actions Modal */}
      {showActionsModal && selectedUser && (
        <UserActionsModal
          user={selectedUser}
          plans={plans}
          actionFirstName={actionFirstName}
          setActionFirstName={setActionFirstName}
          actionLastName={actionLastName}
          setActionLastName={setActionLastName}
          actionPhone={actionPhone}
          setActionPhone={setActionPhone}
          actionRole={actionRole}
          actionIsVerified={actionIsVerified}
          setActionIsVerified={setActionIsVerified}
          actionPlanId={actionPlanId}
          durationPreset={durationPreset}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          showPlanSelectorModal={showPlanSelectorModal}
          setShowPlanSelectorModal={setShowPlanSelectorModal}
          showDurationSelectorModal={showDurationSelectorModal}
          setShowDurationSelectorModal={setShowDurationSelectorModal}
          showRoleSelectorModal={showRoleSelectorModal}
          setShowRoleSelectorModal={setShowRoleSelectorModal}
          setActionPlanId={setActionPlanId}
          setDurationPreset={setDurationPreset}
          setActionRole={setActionRole}
          savingActions={savingActions}
          onClose={handleCloseActionsModal}
          onSave={handleSaveUserActions}
        />
      )}

      {/* Actions Dropdown Menu - Fixed Position */}
      {showDropdownForUser && dropdownUser && (
        <ActionsDropdownMenu
          dropdownUser={dropdownUser}
          dropdownPosition={dropdownPosition}
          setSelectedUser={setSelectedUser}
          setShowUserModal={setShowUserModal}
          setShowDropdownForUser={setShowDropdownForUser}
          setDropdownUser={setDropdownUser}
          openActionsModal={openActionsModal}
          setConfirmModal={setConfirmModal}
          handleToggleVerification={handleToggleVerification}
          handleResetApiUsage={handleResetApiUsage}
          handleCancelSubscription={handleCancelSubscription}
          handleDeleteUser={handleDeleteUser}
          handleRestoreUser={handleRestoreUser}
          hasStripeSubscription={hasStripeSubscription}
          openPermanentDeleteModal={openPermanentDeleteModal}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <ConfirmModal
          confirmModal={confirmModal}
          confirmLoading={confirmLoading}
          setConfirmModal={setConfirmModal}
          setConfirmLoading={setConfirmLoading}
        />
      )}

      {/* Permanent Delete Modal */}
      {permanentDeleteModal.open && (
        <PermanentDeleteModal
          permanentDeleteModal={permanentDeleteModal}
          deleteConfirmText={deleteConfirmText}
          setDeleteConfirmText={setDeleteConfirmText}
          onClose={closePermanentDeleteModal}
          onExecute={executePermanentDelete}
        />
      )}
    </div>
  );
}
