import React from 'react';
import {
  UserIcon,
  PencilIcon,
  CheckCircleIcon,
  PhoneIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  WrenchScrewdriverIcon,
  DocumentIcon,
  EyeIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon,
  KeyIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

interface UnifiedTimelineItemProps {
  activity: any;
  isLast?: boolean;
}

const UnifiedTimelineItem: React.FC<UnifiedTimelineItemProps> = ({ activity, isLast = false }) => {
  // Activity type configurations
  const getActivityConfig = (activityType: string) => {
    const configs: Record<string, { icon: any; color: string; borderColor: string; label: string }> = {
      // Contact activities
      contact_created: {
        icon: UserIcon,
        color: 'bg-green-100 text-green-600',
        borderColor: 'border-green-300',
        label: 'Contact Created',
      },
      contact_updated: {
        icon: PencilIcon,
        color: 'bg-blue-100 text-blue-600',
        borderColor: 'border-blue-300',
        label: 'Contact Updated',
      },
      CONTACT_UPDATED: {
        icon: PencilIcon,
        color: 'bg-blue-100 text-blue-600',
        borderColor: 'border-blue-300',
        label: 'Contact Updated',
      },
      contact_deleted: {
        icon: TrashIcon,
        color: 'bg-red-100 text-red-600',
        borderColor: 'border-red-300',
        label: 'Contact Deleted',
      },
      contact_restored: {
        icon: ArrowPathIcon,
        color: 'bg-green-100 text-green-600',
        borderColor: 'border-green-300',
        label: 'Contact Restored',
      },

      // Status changes
      status_changed: {
        icon: CheckCircleIcon,
        color: 'bg-purple-100 text-purple-600',
        borderColor: 'border-purple-300',
        label: 'Status Changed',
      },

      // Notes
      note_added: {
        icon: DocumentTextIcon,
        color: 'bg-indigo-100 text-indigo-600',
        borderColor: 'border-indigo-300',
        label: 'Note Added',
      },
      note_deleted: {
        icon: TrashIcon,
        color: 'bg-gray-100 text-gray-600',
        borderColor: 'border-gray-300',
        label: 'Note Deleted',
      },

      // Calls
      call_scheduled: {
        icon: PhoneIcon,
        color: 'bg-teal-100 text-teal-600',
        borderColor: 'border-teal-300',
        label: 'Call Scheduled',
      },
      call_updated: {
        icon: PhoneIcon,
        color: 'bg-teal-100 text-teal-600',
        borderColor: 'border-teal-300',
        label: 'Call Updated',
      },

      // Follow-ups
      follow_up_scheduled: {
        icon: CalendarIcon,
        color: 'bg-orange-100 text-orange-600',
        borderColor: 'border-orange-300',
        label: 'Follow-up Scheduled',
      },
      follow_up_updated: {
        icon: CalendarIcon,
        color: 'bg-orange-100 text-orange-600',
        borderColor: 'border-orange-300',
        label: 'Follow-up Updated',
      },

      // Invoices
      invoice_created: {
        icon: DocumentIcon,
        color: 'bg-blue-100 text-blue-600',
        borderColor: 'border-blue-300',
        label: 'Invoice Created',
      },
      invoice_sent: {
        icon: PaperAirplaneIcon,
        color: 'bg-blue-100 text-blue-600',
        borderColor: 'border-blue-300',
        label: 'Invoice Sent',
      },

      // Payments
      payment_received: {
        icon: CurrencyDollarIcon,
        color: 'bg-green-100 text-green-600',
        borderColor: 'border-green-300',
        label: 'Payment Received',
      },

      // Email
      email_sent: {
        icon: EnvelopeIcon,
        color: 'bg-blue-100 text-blue-600',
        borderColor: 'border-blue-300',
        label: 'Email Sent',
      },

      // Services
      service_assigned: {
        icon: WrenchScrewdriverIcon,
        color: 'bg-cyan-100 text-cyan-600',
        borderColor: 'border-cyan-300',
        label: 'Service Assigned',
      },
      service_unassigned: {
        icon: NoSymbolIcon,
        color: 'bg-gray-100 text-gray-600',
        borderColor: 'border-gray-300',
        label: 'Service Unassigned',
      },
      services_bulk_assigned: {
        icon: WrenchScrewdriverIcon,
        color: 'bg-cyan-100 text-cyan-600',
        borderColor: 'border-cyan-300',
        label: 'Services Bulk Assigned',
      },

      // Quotes
      quote_created: {
        icon: DocumentIcon,
        color: 'bg-violet-100 text-violet-600',
        borderColor: 'border-violet-300',
        label: 'Quote Created',
      },
      quote_sent: {
        icon: PaperAirplaneIcon,
        color: 'bg-violet-100 text-violet-600',
        borderColor: 'border-violet-300',
        label: 'Quote Sent',
      },
      quote_viewed: {
        icon: EyeIcon,
        color: 'bg-violet-100 text-violet-600',
        borderColor: 'border-violet-300',
        label: 'Quote Viewed',
      },
      quote_accepted: {
        icon: CheckCircleIcon,
        color: 'bg-green-100 text-green-600',
        borderColor: 'border-green-300',
        label: 'Quote Accepted',
      },
      quote_rejected: {
        icon: XCircleIcon,
        color: 'bg-red-100 text-red-600',
        borderColor: 'border-red-300',
        label: 'Quote Rejected',
      },
      quote_expired: {
        icon: ClockIcon,
        color: 'bg-yellow-100 text-yellow-600',
        borderColor: 'border-yellow-300',
        label: 'Quote Expired',
      },
      quote_converted: {
        icon: ArrowPathIcon,
        color: 'bg-green-100 text-green-600',
        borderColor: 'border-green-300',
        label: 'Quote Converted',
      },
      quote_updated: {
        icon: PencilIcon,
        color: 'bg-violet-100 text-violet-600',
        borderColor: 'border-violet-300',
        label: 'Quote Updated',
      },
      quote_deleted: {
        icon: TrashIcon,
        color: 'bg-gray-100 text-gray-600',
        borderColor: 'border-gray-300',
        label: 'Quote Deleted',
      },

      // Access control
      access_granted: {
        icon: KeyIcon,
        color: 'bg-green-100 text-green-600',
        borderColor: 'border-green-300',
        label: 'Access Granted',
      },
      access_revoked: {
        icon: NoSymbolIcon,
        color: 'bg-red-100 text-red-600',
        borderColor: 'border-red-300',
        label: 'Access Revoked',
      },
    };

    return configs[activityType] || {
      icon: DocumentTextIcon,
      color: 'bg-gray-100 text-gray-600',
      borderColor: 'border-gray-300',
      label: 'Activity',
    };
  };

  const config = getActivityConfig(activity.activity_type);
  const Icon = config.icon;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Parse metadata if it's a JSON string
  const getMetadata = () => {
    const metaField = activity.meta_data || activity.metadata;
    if (!metaField) return null;

    try {
      if (typeof metaField === 'string') {
        return JSON.parse(metaField);
      }
      return metaField;
    } catch (e) {
      return null;
    }
  };

  const metadata = getMetadata();

  // Render metadata based on activity type
  const renderMetadata = () => {
    if (!metadata) return null;

    switch (activity.activity_type) {
      case 'contact_updated':
      case 'CONTACT_UPDATED':
        return metadata.fields_updated && metadata.fields_updated.length > 0 && (
          <div className="mt-1 text-xs text-gray-600">
            <span className="font-medium">Updated:</span>{' '}
            {metadata.fields_updated.map((field: string, index: number) => (
              <span key={field}>
                {index > 0 && ', '}
                <span className="font-medium">{field.replace(/_/g, ' ')}</span>
              </span>
            ))}
          </div>
        );

      case 'status_changed':
        return (
          <div className="mt-1 text-xs text-gray-600">
            {metadata.old_status && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {metadata.old_status}
              </span>
            )}
            {metadata.old_status && metadata.new_status && (
              <span className="mx-2">&rarr;</span>
            )}
            {metadata.new_status && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                {metadata.new_status}
              </span>
            )}
          </div>
        );

      case 'service_assigned':
      case 'service_unassigned':
        return metadata.service_name && (
          <div className="mt-1 text-xs text-gray-600">
            Service: <span className="font-medium">{metadata.service_name}</span>
          </div>
        );

      case 'services_bulk_assigned':
        return metadata.services_count && (
          <div className="mt-1 text-xs text-gray-600">
            Assigned {metadata.services_count} service{metadata.services_count !== 1 ? 's' : ''}
          </div>
        );

      case 'payment_received':
        return (
          <div className="mt-1 text-xs text-gray-600">
            {metadata.amount && (
              <span className="font-medium text-green-600">
                {metadata.currency || '$'}{metadata.amount}
              </span>
            )}
            {metadata.invoice_number && (
              <span className="ml-2">
                Invoice #{metadata.invoice_number}
              </span>
            )}
          </div>
        );

      case 'call_scheduled':
      case 'call_updated':
        return (
          <div className="mt-1 text-xs text-gray-600">
            {metadata.call_date && (
              <div>
                {new Date(metadata.call_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {metadata.call_start_time && (
                  <span className="ml-2">{metadata.call_start_time}</span>
                )}
              </div>
            )}
            {metadata.call_title && (
              <div className="mt-0.5 font-medium">{metadata.call_title}</div>
            )}
          </div>
        );

      case 'follow_up_scheduled':
      case 'follow_up_updated':
        return metadata.follow_up_date && (
          <div className="mt-1 text-xs text-gray-600">
            {new Date(metadata.follow_up_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        );

      case 'invoice_created':
      case 'invoice_sent':
        return metadata.invoice_number && (
          <div className="mt-1 text-xs text-gray-600">
            Invoice #{metadata.invoice_number}
            {metadata.amount && (
              <span className="ml-2 font-medium">
                {metadata.currency || '$'}{metadata.amount}
              </span>
            )}
          </div>
        );

      case 'quote_created':
      case 'quote_sent':
      case 'quote_viewed':
      case 'quote_accepted':
      case 'quote_rejected':
      case 'quote_converted':
      case 'quote_updated':
        return metadata.quote_number && (
          <div className="mt-1 text-xs text-gray-600">
            Quote #{metadata.quote_number}
            {metadata.amount && (
              <span className="ml-2 font-medium">
                {metadata.currency || '$'}{metadata.amount}
              </span>
            )}
          </div>
        );

      case 'access_granted':
      case 'access_revoked':
        return metadata.user_email && (
          <div className="mt-1 text-xs text-gray-600">
            User: <span className="font-medium">{metadata.user_email}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex gap-3 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.color} flex items-center justify-center relative z-10`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              {activity.user_name && (
                <span className="text-xs text-gray-500">
                  by {activity.user_name}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-900 mt-1.5 break-words">{activity.description}</p>

            {/* Metadata */}
            {renderMetadata()}
          </div>

          {/* Timestamp */}
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-gray-500">{formatDate(activity.created_at)}</div>
            <div className="text-xs text-gray-400 mt-0.5">{formatTime(activity.created_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(UnifiedTimelineItem);
