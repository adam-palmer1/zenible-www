import React from 'react';
import { Eye, Pencil, ShieldCheck, ShieldX, RotateCcw, Ban, Trash2, RefreshCw, Skull, PlayCircle } from 'lucide-react';
import { AdminUser, ConfirmModalState } from './types';

interface ActionsDropdownMenuProps {
  dropdownUser: AdminUser;
  dropdownPosition: { top: number; right: number };
  setSelectedUser: (user: AdminUser) => void;
  setShowUserModal: (val: boolean) => void;
  setShowDropdownForUser: (val: string | null) => void;
  setDropdownUser: (val: AdminUser | null) => void;
  openActionsModal: (user: AdminUser) => void;
  setConfirmModal: (val: ConfirmModalState) => void;
  handleToggleVerification: (userId: string, currentlyVerified: boolean) => Promise<void>;
  handleResetApiUsage: (userId: string) => Promise<void>;
  handleCancelSubscription: (subscriptionId: string, atPeriodEnd: boolean) => Promise<void>;
  handleReactivateSubscription: (subscriptionId: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleRestoreUser: (userId: string) => Promise<void>;
  hasStripeSubscription: (user: AdminUser) => boolean;
  openPermanentDeleteModal: (user: AdminUser) => void;
}

const ActionsDropdownMenu: React.FC<ActionsDropdownMenuProps> = ({
  dropdownUser,
  dropdownPosition,
  setSelectedUser,
  setShowUserModal,
  setShowDropdownForUser,
  setDropdownUser,
  openActionsModal,
  setConfirmModal,
  handleToggleVerification,
  handleResetApiUsage,
  handleCancelSubscription,
  handleReactivateSubscription,
  handleDeleteUser,
  handleRestoreUser,
  hasStripeSubscription,
  openPermanentDeleteModal,
}) => {
  return (
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
        dropdownUser.cancel_at_period_end ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdownForUser(null);
              setDropdownUser(null);
              setConfirmModal({
                open: true,
                title: 'Re-activate Subscription',
                message: `Are you sure you want to re-activate the subscription for ${dropdownUser.email}? This will cancel the pending cancellation.`,
                action: () => handleReactivateSubscription(dropdownUser.active_subscription_id!),
                variant: 'primary'
              });
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <PlayCircle className="h-4 w-4" />
            Re-activate Subscription
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdownForUser(null);
              setDropdownUser(null);
              setConfirmModal({
                open: true,
                title: 'Cancel Subscription',
                message: `Are you sure you want to cancel the subscription for ${dropdownUser.email}? The subscription will remain active until the end of the current billing period.`,
                action: () => handleCancelSubscription(dropdownUser.active_subscription_id!, true),
                variant: 'danger'
              });
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Ban className="h-4 w-4" />
            Cancel Subscription
          </button>
        )
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
  );
};

export default ActionsDropdownMenu;
