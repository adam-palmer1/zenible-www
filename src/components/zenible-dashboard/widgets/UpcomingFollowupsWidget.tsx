import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, ArrowRightIcon, EllipsisVerticalIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../shared';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';
import Dropdown from '../../ui/dropdown/Dropdown';
import ConfirmationModal from '../../common/ConfirmationModal';
import contactsAPI from '../../../services/api/crm/contacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/query-keys';

interface FollowupContact {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  follow_up_reminder_at?: string | null;
}

interface UpcomingFollowupsWidgetProps {
  settings?: Record<string, any>;
  isHovered?: boolean;
}

const getDisplayName = (contact: FollowupContact): string => {
  if (contact.first_name || contact.last_name) {
    return [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  }
  return contact.business_name || contact.email || 'Unknown';
};

const formatReminderDate = (dateString: string): string => {
  if (!dateString) return 'General reminder';
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const reminderDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (reminderDay.getTime() === today.getTime()) return `Today at ${timeStr}`;
  if (reminderDay.getTime() === tomorrow.getTime()) return `Tomorrow at ${timeStr}`;
  if (reminderDay < today) {
    return `Overdue - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const UpcomingFollowupsWidget = ({ settings = {}, isHovered = false }: UpcomingFollowupsWidgetProps) => {
  const navigate = useNavigate();
  const { data: followups, isLoading: loading } = useDashboardWidget('upcomingFollowups');
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<{ contact: FollowupContact; action: 'completed' | 'dismissed' } | null>(null);

  const followupList: FollowupContact[] = followups || [];

  const handleAction = async () => {
    if (!confirmAction) return;
    const { contact, action } = confirmAction;

    try {
      await contactsAPI.update(contact.id, {
        follow_up_reminder_at: null,
        follow_up_reminder_action: action,
      });

      const displayName = getDisplayName(contact);
      showSuccess(
        action === 'completed'
          ? `Follow-up completed for ${displayName}`
          : `Follow-up reminder dismissed for ${displayName}`,
        { duration: 3000 }
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
    } catch (error) {
      showError('Failed to update follow-up reminder. Please try again.');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleViewAll = () => navigate('/crm');
  const handleContactClick = (id: string) => navigate(`/crm?contact=${id}`);

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  return (
    <div className="flex flex-col h-full">
      {followupList.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <BellIcon className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No follow-up reminders</p>
          <button
            onClick={handleViewAll}
            className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
          >
            Go to CRM
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <div
              className="h-full overflow-y-auto space-y-2"
              style={{
                width: isHovered ? '100%' : 'calc(100% + 17px)',
                paddingRight: isHovered ? '0' : '17px',
                transition: 'width 0.2s ease, padding-right 0.2s ease'
              }}
            >
              {followupList.map((contact: FollowupContact) => {
                const isOverdue = contact.follow_up_reminder_at && new Date(contact.follow_up_reminder_at) < new Date();

                return (
                  <div
                    key={contact.id}
                    className={`w-full text-left p-3 rounded-lg border transition-all group ${
                      isOverdue
                        ? 'border-red-200 bg-red-50/50 hover:border-red-400'
                        : 'border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => handleContactClick(contact.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getDisplayName(contact)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <BellIcon className={`w-3 h-3 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {contact.follow_up_reminder_at
                              ? formatReminderDate(contact.follow_up_reminder_at)
                              : 'General reminder'}
                          </span>
                        </div>
                      </button>

                      <Dropdown
                        trigger={
                          <button
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Reminder actions"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                        }
                        align="end"
                        side="bottom"
                      >
                        <Dropdown.Item
                          onSelect={(e: Event) => {
                            e.stopPropagation();
                            setConfirmAction({ contact, action: 'completed' });
                          }}
                        >
                          Mark Complete
                        </Dropdown.Item>
                        <Dropdown.Item
                          onSelect={(e: Event) => {
                            e.stopPropagation();
                            setConfirmAction({ contact, action: 'dismissed' });
                          }}
                        >
                          Dismiss
                        </Dropdown.Item>
                      </Dropdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
            >
              View CRM
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Mark Complete Confirmation */}
      <ConfirmationModal
        isOpen={confirmAction?.action === 'completed'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title="Mark Follow-Up Complete?"
        message={`Mark the follow-up reminder for ${confirmAction ? getDisplayName(confirmAction.contact) : ''} as complete? This will be logged in the contact's activity history.`}
        confirmText="Mark Complete"
        confirmColor="purple"
        icon={CheckCircleIcon}
        iconColor="text-green-600"
      />

      {/* Dismiss Confirmation */}
      <ConfirmationModal
        isOpen={confirmAction?.action === 'dismissed'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        title="Dismiss Follow-Up Reminder?"
        message={`Dismiss the follow-up reminder for ${confirmAction ? getDisplayName(confirmAction.contact) : ''}? This will be logged in the contact's activity history.`}
        confirmText="Dismiss"
        confirmColor="orange"
        icon={XMarkIcon}
        iconColor="text-orange-600"
      />
    </div>
  );
};

export default UpcomingFollowupsWidget;
