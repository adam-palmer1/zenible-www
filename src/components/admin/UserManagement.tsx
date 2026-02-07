import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { X, Check, Search, Calendar, Clock, User, CreditCard, Loader2, Shield, Phone, Mail, Settings, MoreVertical, RotateCcw, Eye, Pencil, ShieldCheck, ShieldX, ChevronDown, Filter, SortAsc, Ban, Trash2, RefreshCw, AlertTriangle, Skull } from 'lucide-react';
import adminAPI from '../../services/adminAPI';

interface FilterOption {
  id: string;
  label: string;
  description?: string;
}

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (id: string) => void;
  title?: string;
}

interface PlanSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: any[];
  selectedPlanId: string;
  onSelect: (id: string) => void;
}

interface DurationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDuration: string;
  onSelect: (id: string) => void;
}

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: string;
  onSelect: (id: string) => void;
}

interface ConfirmModalState {
  open: boolean;
  title: string;
  message: string;
  action: (() => Promise<void>) | null;
  variant: string;
}

interface PermanentDeleteModalState {
  open: boolean;
  user: any;
  preview: any;
  loading: boolean;
  step: string;
}

const DURATION_OPTIONS: FilterOption[] = [
  { id: '30days', label: '30 Days', description: 'Default duration' },
  { id: '3months', label: '3 Months', description: 'Expires in 3 months' },
  { id: '6months', label: '6 Months', description: 'Expires in 6 months' },
  { id: '1year', label: '1 Year', description: 'Expires in 1 year' },
  { id: 'lifetime', label: 'Lifetime', description: 'Valid until 2099' },
  { id: 'custom', label: 'Custom Dates', description: 'Set specific dates' },
];

const ROLE_OPTIONS: FilterOption[] = [
  { id: 'USER', label: 'User', description: 'Standard user access' },
  { id: 'ADMIN', label: 'Admin', description: 'Full administrative access' },
];

const ROLE_FILTER_OPTIONS: FilterOption[] = [
  { id: '', label: 'All Roles' },
  { id: 'ADMIN', label: 'Admin' },
  { id: 'USER', label: 'User' },
];

const ACTIVE_FILTER_OPTIONS: FilterOption[] = [
  { id: '', label: 'All Users' },
  { id: 'active', label: 'Active' },
  { id: 'deleted', label: 'Deleted' },
];

const VERIFIED_FILTER_OPTIONS: FilterOption[] = [
  { id: '', label: 'All' },
  { id: 'true', label: 'Verified' },
  { id: 'false', label: 'Unverified' },
];

const ORDER_BY_OPTIONS: FilterOption[] = [
  { id: 'created_at', label: 'Created Date' },
  { id: 'updated_at', label: 'Updated Date' },
  { id: 'email', label: 'Email' },
  { id: 'first_name', label: 'Name' },
];

const ORDER_DIR_OPTIONS: FilterOption[] = [
  { id: 'desc', label: 'Descending' },
  { id: 'asc', label: 'Ascending' },
];

/**
 * Generic Filter Dropdown - Positioned relative to trigger button
 */
const FilterDropdown: React.FC<FilterDropdownProps> = ({ isOpen, onClose, options, selectedValue, onSelect, title }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = () => onClose();
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          {title}
        </div>
      )}
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => { onSelect(option.id); onClose(); }}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
            option.id === selectedValue ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          <span>{option.label}</span>
          {option.id === selectedValue && <Check className="h-4 w-4 text-purple-600" />}
        </button>
      ))}
    </div>
  );
};

/**
 * Plan Selection Modal - Full screen centered modal
 */
const PlanSelectorModal: React.FC<PlanSelectorModalProps> = ({ isOpen, onClose, plans, selectedPlanId, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlans = [{ id: '', name: 'No Plan', monthly_price: 0 }, ...plans].filter((plan: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return plan.name.toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
        </div>

        {/* Plan List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPlans.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No plans found</div>
          ) : (
            <div className="py-2">
              {filteredPlans.map((plan: any) => (
                <button
                  key={plan.id || 'none'}
                  onClick={() => { onSelect(plan.id); onClose(); }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                    plan.id === selectedPlanId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{plan.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {plan.id ? `$${plan.monthly_price}/month` : 'Remove current plan'}
                    </div>
                  </div>
                  {plan.id === selectedPlanId && <Check className="h-5 w-5 text-purple-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Duration Selection Modal - Full screen centered modal
 */
const DurationSelectorModal: React.FC<DurationSelectorModalProps> = ({ isOpen, onClose, selectedDuration, onSelect }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Duration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Duration List */}
        <div className="py-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => { onSelect(option.id); onClose(); }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                option.id === selectedDuration ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}
            >
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
              </div>
              {option.id === selectedDuration && <Check className="h-5 w-5 text-purple-600" />}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Role Selection Modal - Full screen centered modal
 */
const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({ isOpen, onClose, selectedRole, onSelect }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Role
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Role List */}
        <div className="py-2">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => { onSelect(option.id); onClose(); }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                option.id === selectedRole ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
              </div>
              {option.id === selectedRole && <Check className="h-5 w-5 text-blue-600" />}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UserManagement() {
  const { darkMode } = useOutletContext() as any;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);
  const [showDropdownForUser, setShowDropdownForUser] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

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

  // Filter dropdown state
  const [showRoleFilterDropdown, setShowRoleFilterDropdown] = useState<boolean>(false);
  const [showActiveFilterDropdown, setShowActiveFilterDropdown] = useState<boolean>(false);
  const [showVerifiedFilterDropdown, setShowVerifiedFilterDropdown] = useState<boolean>(false);
  const [showOrderByDropdown, setShowOrderByDropdown] = useState<boolean>(false);
  const [showOrderDirDropdown, setShowOrderDirDropdown] = useState<boolean>(false);

  // Actions dropdown position
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [dropdownUser, setDropdownUser] = useState<any>(null);

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

  const openActionsDropdown = (e: React.MouseEvent, user: any) => {
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
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(activeFilter === 'active' && { is_deleted: false }),
        ...(activeFilter === 'deleted' && { is_deleted: true }),
        ...(verifiedFilter && { email_verified: verifiedFilter === 'true' }),
        order_by: orderBy,
        order_dir: orderDir,
      };

      const response = await (adminAPI as any).getUsers(params);
      setUsers(response.users || response.items || []);
      setTotalPages(response.total_pages || 1);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await (adminAPI as any).getPlans({ is_active: true });
      setPlans(response.plans || response.items || []);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
    }
  };

  const getPlanName = (planId: string): string | null => {
    if (!planId) return null;
    const plan = plans.find((p: any) => p.id === planId);
    return plan ? plan.name : planId;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openActionsModal = (user: any) => {
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
      const updateData: any = {};

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
          const options: any = {};

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

          await (adminAPI as any).assignPlanToUser(selectedUser.id, actionPlanId, options);
        } else {
          // Remove plan by setting current_plan_id to null
          updateData.current_plan_id = null;
        }
      }

      // Update user profile/role/verification if any fields changed
      if (Object.keys(updateData).length > 0) {
        await (adminAPI as any).updateUser(selectedUser.id, updateData);
      }

      handleCloseActionsModal();
      fetchUsers();
    } catch (err: any) {
      alert(`Error updating user: ${err.message}`);
    } finally {
      setSavingActions(false);
    }
  };

  const handleResetApiUsage = async (userId: string) => {
    try {
      await (adminAPI as any).resetUserApiUsage(userId);
      fetchUsers();
    } catch (err: any) {
      alert(`Error resetting API usage: ${err.message}`);
    }
  };

  const handleToggleVerification = async (userId: string, currentlyVerified: boolean) => {
    try {
      await (adminAPI as any).updateUser(userId, { email_verified: !currentlyVerified });
      fetchUsers();
    } catch (err: any) {
      alert(`Error updating verification: ${err.message}`);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string, atPeriodEnd: boolean = true) => {
    try {
      await (adminAPI as any).cancelSubscription(subscriptionId, {
        cancelAtPeriodEnd: atPeriodEnd,
        reason: 'Canceled by admin'
      });
      fetchUsers();
    } catch (err: any) {
      alert(`Error canceling subscription: ${err.message}`);
    }
  };

  const hasStripeSubscription = (user: any): boolean => {
    return user.subscription_status !== null && user.subscription_status !== 'ADMIN';
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await (adminAPI as any).deleteUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await (adminAPI as any).restoreUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert(`Error restoring user: ${err.message}`);
    }
  };

  const openPermanentDeleteModal = async (user: any) => {
    setPermanentDeleteModal({ open: true, user, preview: null, loading: true, step: 'preview' });
    setDeleteConfirmText('');
    try {
      const preview = await (adminAPI as any).permanentlyDeleteUser(user.id, { confirm: true, dryRun: true });
      setPermanentDeleteModal(prev => ({ ...prev, preview, loading: false }));
    } catch (err: any) {
      alert(`Error fetching deletion preview: ${err.message}`);
      setPermanentDeleteModal({ open: false, user: null, preview: null, loading: false, step: 'preview' });
    }
  };

  const executePermanentDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setPermanentDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await (adminAPI as any).permanentlyDeleteUser(permanentDeleteModal.user.id, { confirm: true, dryRun: false });
      setPermanentDeleteModal({ open: false, user: null, preview: null, loading: false, step: 'preview' });
      setDeleteConfirmText('');
      fetchUsers();
    } catch (err: any) {
      alert(`Error permanently deleting user: ${err.message}`);
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

  const selectedPlan = plans.find((p: any) => p.id === actionPlanId);
  const selectedDurationOption = DURATION_OPTIONS.find(opt => opt.id === durationPreset);
  const selectedRoleOption = ROLE_OPTIONS.find(opt => opt.id === actionRole);

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
      <div className="p-6">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoleFilterDropdown(!showRoleFilterDropdown);
                  setShowActiveFilterDropdown(false);
                  setShowVerifiedFilterDropdown(false);
                  setShowOrderByDropdown(false);
                  setShowOrderDirDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors ${roleFilter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
              >
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{ROLE_FILTER_OPTIONS.find(o => o.id === roleFilter)?.label || 'All Roles'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showRoleFilterDropdown}
                onClose={() => setShowRoleFilterDropdown(false)}
                options={ROLE_FILTER_OPTIONS}
                selectedValue={roleFilter}
                onSelect={setRoleFilter}
                title="Role"
              />
            </div>

            {/* Active Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActiveFilterDropdown(!showActiveFilterDropdown);
                  setShowRoleFilterDropdown(false);
                  setShowVerifiedFilterDropdown(false);
                  setShowOrderByDropdown(false);
                  setShowOrderDirDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors ${activeFilter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
              >
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{ACTIVE_FILTER_OPTIONS.find(o => o.id === activeFilter)?.label || 'All Users'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showActiveFilterDropdown}
                onClose={() => setShowActiveFilterDropdown(false)}
                options={ACTIVE_FILTER_OPTIONS}
                selectedValue={activeFilter}
                onSelect={setActiveFilter}
                title="Status"
              />
            </div>

            {/* Verified Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVerifiedFilterDropdown(!showVerifiedFilterDropdown);
                  setShowRoleFilterDropdown(false);
                  setShowActiveFilterDropdown(false);
                  setShowOrderByDropdown(false);
                  setShowOrderDirDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors ${verifiedFilter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
              >
                <ShieldCheck className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{VERIFIED_FILTER_OPTIONS.find(o => o.id === verifiedFilter)?.label || 'All'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showVerifiedFilterDropdown}
                onClose={() => setShowVerifiedFilterDropdown(false)}
                options={VERIFIED_FILTER_OPTIONS}
                selectedValue={verifiedFilter}
                onSelect={setVerifiedFilter}
                title="Verified"
              />
            </div>

            {/* Order By */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOrderByDropdown(!showOrderByDropdown);
                  setShowRoleFilterDropdown(false);
                  setShowActiveFilterDropdown(false);
                  setShowVerifiedFilterDropdown(false);
                  setShowOrderDirDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors`}
              >
                <SortAsc className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{ORDER_BY_OPTIONS.find(o => o.id === orderBy)?.label || 'Sort'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showOrderByDropdown}
                onClose={() => setShowOrderByDropdown(false)}
                options={ORDER_BY_OPTIONS}
                selectedValue={orderBy}
                onSelect={setOrderBy}
                title="Sort By"
              />
            </div>

            {/* Order Direction */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOrderDirDropdown(!showOrderDirDropdown);
                  setShowRoleFilterDropdown(false);
                  setShowActiveFilterDropdown(false);
                  setShowVerifiedFilterDropdown(false);
                  setShowOrderByDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors`}
              >
                <span className="text-sm">{ORDER_DIR_OPTIONS.find(o => o.id === orderDir)?.label || 'Desc'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showOrderDirDropdown}
                onClose={() => setShowOrderDirDropdown(false)}
                options={ORDER_DIR_OPTIONS}
                selectedValue={orderDir}
                onSelect={setOrderDir}
                title="Direction"
              />
            </div>

            {/* Search Button */}
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
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
                    {users.map((user: any) => (
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
                            {getPlanName(user.current_plan_id) || <span className="text-gray-400">-</span>}
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
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>{formatDate(user.created_at)}</span>
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUserModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h2>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-xl font-semibold text-purple-600 dark:text-purple-400">{selectedUser.first_name?.charAt(0) || selectedUser.email?.charAt(0) || '?'}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedUser.first_name && selectedUser.last_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : selectedUser.first_name || 'N/A'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono break-all mt-1">{selectedUser.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedUser.role === 'ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>{selectedUser.role}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedUser.deleted_at ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>{selectedUser.deleted_at ? 'Deleted' : 'Active'}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedUser.email_verified ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{selectedUser.email_verified ? 'Verified' : 'Unverified'}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{getPlanName(selectedUser.current_plan_id) || <span className="text-gray-400">None</span>}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDate(selectedUser.updated_at)}</p>
                </div>
                {selectedUser.deleted_at && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-red-500">Deleted At</label>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formatDate(selectedUser.deleted_at)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowUserModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* User Actions Modal */}
      {showActionsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseActionsModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Actions</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={handleCloseActionsModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                    <input
                      type="text"
                      value={actionFirstName}
                      onChange={(e) => setActionFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                    <input
                      type="text"
                      value={actionLastName}
                      onChange={(e) => setActionLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={actionPhone}
                    onChange={(e) => setActionPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Role & Verification Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role & Verification
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User Role</label>
                  <button
                    type="button"
                    onClick={() => setShowRoleSelectorModal(true)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-lg hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  >
                    <span className="text-gray-900 dark:text-white">{selectedRoleOption?.label || 'Select role...'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email Verified</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {actionIsVerified ? 'User email is verified' : 'User email is not verified'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActionIsVerified(!actionIsVerified)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      actionIsVerified ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        actionIsVerified ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Plan Assignment Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription Plan
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                  <button
                    type="button"
                    onClick={() => setShowPlanSelectorModal(true)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-lg hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  >
                    <span className={selectedPlan ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      {selectedPlan ? `${selectedPlan.name} - $${selectedPlan.monthly_price}/mo` : (actionPlanId === '' && selectedUser.current_plan_id ? 'Remove plan' : 'No plan assigned')}
                    </span>
                  </button>
                </div>

                {/* Only show duration if a plan is selected and it's different from current */}
                {actionPlanId && actionPlanId !== selectedUser.current_plan_id && (
                  <>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Clock className="h-4 w-4" />
                        Duration
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDurationSelectorModal(true)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-lg hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      >
                        <span className="text-gray-900 dark:text-white">{selectedDurationOption?.label || 'Select duration...'}</span>
                      </button>
                    </div>

                    {/* Custom Date Fields */}
                    {durationPreset === 'custom' && (
                      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4" />
                            Start Date
                          </label>
                          <input
                            type="datetime-local"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">Leave empty to start immediately</p>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4" />
                            End Date
                          </label>
                          <input
                            type="datetime-local"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">Leave empty for default 30 days</p>
                        </div>
                      </div>
                    )}

                    {/* Duration Info */}
                    {durationPreset !== 'custom' && durationPreset !== '30days' && (
                      <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {durationPreset === 'lifetime'
                            ? 'Subscription will be valid until December 31, 2099'
                            : `Subscription will end ${durationPreset === '3months' ? '3 months' : durationPreset === '6months' ? '6 months' : '1 year'} from now`
                          }
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCloseActionsModal}
                disabled={savingActions}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserActions}
                disabled={savingActions}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingActions ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selector Modal */}
      <PlanSelectorModal
        isOpen={showPlanSelectorModal}
        onClose={() => setShowPlanSelectorModal(false)}
        plans={plans}
        selectedPlanId={actionPlanId}
        onSelect={setActionPlanId}
      />

      {/* Duration Selector Modal */}
      <DurationSelectorModal
        isOpen={showDurationSelectorModal}
        onClose={() => setShowDurationSelectorModal(false)}
        selectedDuration={durationPreset}
        onSelect={setDurationPreset}
      />

      {/* Role Selector Modal */}
      <RoleSelectorModal
        isOpen={showRoleSelectorModal}
        onClose={() => setShowRoleSelectorModal(false)}
        selectedRole={actionRole}
        onSelect={setActionRole}
      />

      {/* Actions Dropdown Menu - Fixed Position */}
      {showDropdownForUser && dropdownUser && (
        <div
          className="fixed w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-[9999]"
          style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(dropdownUser);
              setShowUserModal(true);
              setShowDropdownForUser(null);
              setDropdownUser(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openActionsModal(dropdownUser);
              setShowDropdownForUser(null);
              setDropdownUser(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit User
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          {dropdownUser.email_verified ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdownForUser(null);
                setDropdownUser(null);
                setConfirmModal({
                  open: true,
                  title: 'Unverify User',
                  message: `Are you sure you want to unverify ${dropdownUser.email}? They will need to verify their email again.`,
                  action: () => handleToggleVerification(dropdownUser.id, true),
                  variant: 'danger'
                });
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <ShieldX className="h-4 w-4" />
              Unverify User
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdownForUser(null);
                setDropdownUser(null);
                setConfirmModal({
                  open: true,
                  title: 'Verify User',
                  message: `Are you sure you want to verify ${dropdownUser.email}?`,
                  action: () => handleToggleVerification(dropdownUser.id, false),
                  variant: 'primary'
                });
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              Verify User
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdownForUser(null);
              setDropdownUser(null);
              setConfirmModal({
                open: true,
                title: 'Reset API Usage',
                message: `Are you sure you want to reset API usage for ${dropdownUser.email}?`,
                action: () => handleResetApiUsage(dropdownUser.id),
                variant: 'warning'
              });
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset API Usage
          </button>
          {hasStripeSubscription(dropdownUser) && dropdownUser.active_subscription_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdownForUser(null);
                setDropdownUser(null);
                setConfirmModal({
                  open: true,
                  title: 'Cancel Subscription',
                  message: `Are you sure you want to cancel the subscription for ${dropdownUser.email}? The subscription will remain active until the end of the current billing period.`,
                  action: () => handleCancelSubscription(dropdownUser.active_subscription_id, true),
                  variant: 'danger'
                });
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Ban className="h-4 w-4" />
              Cancel Subscription
            </button>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          {dropdownUser.deleted_at ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdownForUser(null);
                setDropdownUser(null);
                setConfirmModal({
                  open: true,
                  title: 'Restore User',
                  message: `Are you sure you want to restore ${dropdownUser.email}? This will reactivate their account.`,
                  action: () => handleRestoreUser(dropdownUser.id),
                  variant: 'primary'
                });
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Restore User
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdownForUser(null);
                setDropdownUser(null);
                setConfirmModal({
                  open: true,
                  title: 'Delete User',
                  message: `Are you sure you want to delete ${dropdownUser.email}? This will soft-delete the user account. You can restore it later.`,
                  action: () => handleDeleteUser(dropdownUser.id),
                  variant: 'danger'
                });
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete User
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdownForUser(null);
              setDropdownUser(null);
              openPermanentDeleteModal(dropdownUser);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Skull className="h-4 w-4" />
            Permanently Delete
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !confirmLoading && setConfirmModal({ ...confirmModal, open: false })} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                disabled={confirmLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setConfirmLoading(true);
                  try {
                    await confirmModal.action?.();
                  } finally {
                    setConfirmLoading(false);
                    setConfirmModal({ ...confirmModal, open: false });
                  }
                }}
                disabled={confirmLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  confirmModal.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmModal.variant === 'warning'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {confirmLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {permanentDeleteModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !permanentDeleteModal.loading && closePermanentDeleteModal()} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Permanent Deletion</h2>
                  <p className="text-sm text-red-700 dark:text-red-300">This action is IRREVERSIBLE</p>
                </div>
              </div>
              <button
                onClick={closePermanentDeleteModal}
                disabled={permanentDeleteModal.loading}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {permanentDeleteModal.loading && !permanentDeleteModal.preview ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading deletion preview...</span>
                </div>
              ) : permanentDeleteModal.preview ? (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">User to be deleted:</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{permanentDeleteModal.preview.user_email}</p>
                  </div>

                  {/* Company Warning */}
                  {permanentDeleteModal.preview.company_name && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">This user owns a company!</p>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            Company "<span className="font-medium">{permanentDeleteModal.preview.company_name}</span>" will also be permanently deleted.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data to be deleted */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Data to be deleted:</p>

                    {/* User Records */}
                    {permanentDeleteModal.preview.records_deleted?.user && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User Records</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {permanentDeleteModal.preview.records_deleted.user.subscriptions > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.user.subscriptions} subscription(s)
                            </div>
                          )}
                          {permanentDeleteModal.preview.records_deleted.user.payments > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.user.payments} payment(s)
                            </div>
                          )}
                          {permanentDeleteModal.preview.records_deleted.user.conversations > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.user.conversations} conversation(s)
                            </div>
                          )}
                          {permanentDeleteModal.preview.records_deleted.user.documents > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.user.documents} document(s)
                            </div>
                          )}
                          {permanentDeleteModal.preview.records_deleted.user.permissions > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.user.permissions} permission(s)
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Company Records */}
                    {permanentDeleteModal.preview.records_deleted?.company && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">Company Records</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {permanentDeleteModal.preview.records_deleted.company.contacts > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.company.contacts} contact(s)
                            </div>
                          )}
                          {permanentDeleteModal.preview.records_deleted.company.invoices > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.company.invoices} invoice(s)
                            </div>
                          )}
                          {permanentDeleteModal.preview.records_deleted.company.expenses > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.company.expenses} expense(s)
                            </div>
                          )}
                          {permanentDeleteModal.preview.records_deleted.company.quotes > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.company.quotes} quote(s)
                            </div>
                          )}
                          {permanentDeleteModal.preview.records_deleted.company.projects > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              {permanentDeleteModal.preview.records_deleted.company.projects} project(s)
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* External services */}
                    {(permanentDeleteModal.preview.stripe_subscriptions_cancelled > 0 ||
                      permanentDeleteModal.preview.stripe_customer_deleted ||
                      permanentDeleteModal.preview.stripe_connect_disconnected ||
                      permanentDeleteModal.preview.s3_files_deleted > 0 ||
                      permanentDeleteModal.preview.google_calendar_revoked ||
                      permanentDeleteModal.preview.zoom_revoked) && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">External Services</p>
                        <div className="flex flex-wrap gap-2">
                          {permanentDeleteModal.preview.stripe_subscriptions_cancelled > 0 && (
                            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                              {permanentDeleteModal.preview.stripe_subscriptions_cancelled} Stripe subscription(s)
                            </span>
                          )}
                          {permanentDeleteModal.preview.stripe_customer_deleted && (
                            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Stripe customer</span>
                          )}
                          {permanentDeleteModal.preview.stripe_connect_disconnected && (
                            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Stripe Connect</span>
                          )}
                          {permanentDeleteModal.preview.s3_files_deleted > 0 && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {permanentDeleteModal.preview.s3_files_deleted} S3 file(s)
                            </span>
                          )}
                          {permanentDeleteModal.preview.google_calendar_revoked && (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Google Calendar</span>
                          )}
                          {permanentDeleteModal.preview.zoom_revoked && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Zoom</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Input */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                      placeholder="DELETE"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
                      disabled={permanentDeleteModal.loading}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closePermanentDeleteModal}
                disabled={permanentDeleteModal.loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executePermanentDelete}
                disabled={permanentDeleteModal.loading || deleteConfirmText !== 'DELETE'}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {permanentDeleteModal.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Skull className="h-4 w-4" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
