import React from 'react';
import { History, ArrowRightLeft, RefreshCw, Ban } from 'lucide-react';

interface SubscriptionActionsDropdownProps {
  subscription: {
    id: string;
    status: string;
    cancel_at_period_end: boolean;
    user_id: string;
  };
  position: { top: number; right: number };
  onViewHistory: () => void;
  onChangePlan: () => void;
  onReactivate: () => void;
  onCancel: () => void;
}

const SubscriptionActionsDropdown: React.FC<SubscriptionActionsDropdownProps> = ({
  subscription,
  position,
  onViewHistory,
  onChangePlan,
  onReactivate,
  onCancel,
}) => {
  const status = (subscription.status || '').toLowerCase();
  const isActive = status === 'active';
  const isCanceled = status === 'canceled' || status === 'cancelled';
  const hasPendingCancel = subscription.cancel_at_period_end;

  const showChangePlan = isActive && !hasPendingCancel;
  const showReactivate = isCanceled || hasPendingCancel;
  const showCancel = isActive && !hasPendingCancel;

  // Clamp right so dropdown stays within viewport on small screens
  const clampedRight = Math.max(8, Math.min(position.right, window.innerWidth - 216));

  return (
    <div
      className="fixed w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-[9999]"
      style={{ top: position.top, right: clampedRight }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewHistory();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <History className="h-4 w-4" />
        View History
      </button>

      {showChangePlan && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChangePlan();
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Change Plan
        </button>
      )}

      {showReactivate && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReactivate();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reactivate
          </button>
        </>
      )}

      {showCancel && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Ban className="h-4 w-4" />
            Cancel Subscription
          </button>
        </>
      )}
    </div>
  );
};

export default SubscriptionActionsDropdown;
