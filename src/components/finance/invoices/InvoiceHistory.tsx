import React, { useState, useEffect } from 'react';
import { User, Edit2, LucideIcon } from 'lucide-react';
import invoicesAPI from '../../../services/api/finance/invoices';

interface InvoiceHistoryProps {
  invoiceId: string | number;
}

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ invoiceId }) => {
  const [history, setHistory] = useState<any>({ changes: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [invoiceId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await (invoicesAPI as any).getHistory(invoiceId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Failed to load change history');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get relative time (e.g., "1d ago")
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Determine if this is a creation event
  const isCreationEvent = (change: any) => {
    return change.field_name === 'created' ||
           change.field_name === 'invoice_created' ||
           (change.field_name === 'status' && !change.old_value && change.new_value === 'draft');
  };

  // Get badge style based on event type
  const getBadgeStyle = (change: any) => {
    if (isCreationEvent(change)) {
      return 'bg-[#dff2fe] text-[#09090b]';
    }
    return 'bg-[#f4f4f5] text-[#09090b]';
  };

  // Get icon style based on event type
  const getIconStyle = (change: any): { bg: string; icon: LucideIcon; color: string } => {
    if (isCreationEvent(change)) {
      return {
        bg: 'bg-[#dff2fe]',
        icon: Edit2,
        color: 'text-[#00A6F4]'
      };
    }
    return {
      bg: 'bg-[#fafafa] dark:bg-gray-700',
      icon: User,
      color: 'text-[#71717a]'
    };
  };

  // Get display label for field name
  const getFieldLabel = (change: any) => {
    if (isCreationEvent(change)) {
      return 'Invoice created';
    }
    return change.field_name?.replace(/_/g, '_') || 'Change';
  };

  // Get display value for change
  const getChangeDisplay = (change: any) => {
    if (isCreationEvent(change)) {
      return change.new_value || change.change_reason || '';
    }

    if (change.old_value && change.new_value) {
      return `${change.old_value}\u2192 ${change.new_value}`;
    } else if (change.new_value) {
      return change.new_value;
    } else if (change.old_value) {
      return `${change.old_value} (removed)`;
    }
    return change.change_reason || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-[14px] text-[#71717a]">Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-[14px] text-[#71717a] mb-3">{error}</p>
        <button
          onClick={loadHistory}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (history.changes.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-[14px] text-[#71717a]">No changes recorded yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {history.changes.map((change: any, index: number) => {
        const isLast = index === history.changes.length - 1;
        const iconStyle = getIconStyle(change);
        const IconComponent = iconStyle.icon;

        return (
          <div key={change.id} className="flex gap-4">
            {/* Timeline column */}
            <div className="flex flex-col items-center w-8 shrink-0">
              {/* Icon circle */}
              <div className={`w-8 h-8 rounded-full ${iconStyle.bg} flex items-center justify-center`}>
                <IconComponent className={`h-[14px] w-[14px] ${iconStyle.color}`} />
              </div>
              {/* Vertical line (except for last item) */}
              {!isLast && (
                <div className="w-px flex-1 bg-[#e5e5e5] dark:bg-gray-700 min-h-[16px]" />
              )}
            </div>

            {/* Content column */}
            <div className={`flex-1 flex gap-4 ${!isLast ? 'pb-4' : ''}`}>
              {/* Change details */}
              <div className="flex-1 flex flex-col gap-[2px]">
                {/* Badge */}
                <span className={`inline-flex items-center justify-center px-1 py-[3px] h-5 rounded-[6px] text-[10px] font-normal leading-[14px] w-fit ${getBadgeStyle(change)}`}>
                  {getFieldLabel(change)}
                </span>
                {/* Value */}
                <p className="text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white truncate">
                  {getChangeDisplay(change)}
                </p>
              </div>

              {/* Date/Time */}
              <div className="flex flex-col items-end justify-center text-[10px] font-normal leading-[14px] text-[#71717a] text-center whitespace-nowrap shrink-0">
                <span>{formatDate(change.created_at)}</span>
                <span>{formatTime(change.created_at)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InvoiceHistory;
