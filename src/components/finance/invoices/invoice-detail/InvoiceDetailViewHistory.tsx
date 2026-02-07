import React from 'react';
import { Loader2, Eye, ChevronDown, ChevronUp, Monitor, Smartphone } from 'lucide-react';
import type { InvoiceViewHistoryResponse, InvoiceViewResponse } from '../../../../types';

interface InvoiceDetailViewHistoryProps {
  viewHistory: InvoiceViewHistoryResponse | null;
  loadingViewHistory: boolean;
  viewHistoryExpanded: boolean;
  onToggleExpanded: () => void;
}

const InvoiceDetailViewHistory: React.FC<InvoiceDetailViewHistoryProps> = ({
  viewHistory,
  loadingViewHistory,
  viewHistoryExpanded,
  onToggleExpanded,
}) => {
  return (
    <div className="w-full max-w-[840px] bg-white dark:bg-gray-800 border-2 border-[#e5e5e5] dark:border-gray-700 rounded-[12px] overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={onToggleExpanded}
        className="w-full border-b border-[#e5e5e5] dark:border-gray-700 p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-[#71717a]" />
          <h3 className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
            View History
          </h3>
          {viewHistory && (
            <span className="text-sm text-[#71717a]">
              ({viewHistory.total} view{viewHistory.total !== 1 ? 's' : ''}, {viewHistory.unique_ip_count} unique)
            </span>
          )}
        </div>
        {viewHistoryExpanded ? (
          <ChevronUp className="h-5 w-5 text-[#71717a]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#71717a]" />
        )}
      </button>

      {/* Content - Collapsible */}
      {viewHistoryExpanded && (
        <div className="p-4">
          {loadingViewHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : viewHistory && viewHistory.views?.length > 0 ? (
            <div className="space-y-3">
              {viewHistory.views.map((view: InvoiceViewResponse) => {
                // Parse user agent to determine device type
                const ua = view.user_agent || '';
                const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
                const DeviceIcon = isMobile ? Smartphone : Monitor;

                // Extract browser info
                let browser = 'Unknown Browser';
                if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
                else if (ua.includes('Chrome')) browser = 'Chrome';
                else if (ua.includes('Firefox')) browser = 'Firefox';
                else if (ua.includes('Edge')) browser = 'Edge';

                return (
                  <div
                    key={view.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <DeviceIcon className="h-5 w-5 text-[#71717a] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#09090b] dark:text-white">
                          {new Date(view.viewed_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[#71717a] dark:text-gray-300">
                          {browser}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[#71717a]">
                        <p>IP: {view.ip_address}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#71717a] text-center py-4">
              No views recorded yet
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailViewHistory;
