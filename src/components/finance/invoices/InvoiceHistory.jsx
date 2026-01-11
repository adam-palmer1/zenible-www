import React, { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import invoicesAPI from '../../../services/api/finance/invoices';

const InvoiceHistory = ({ invoiceId }) => {
  const [history, setHistory] = useState({ changes: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [invoiceId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoicesAPI.getHistory(invoiceId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Failed to load change history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-2 text-sm design-text-secondary">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="design-text-secondary">{error}</p>
        <button
          onClick={loadHistory}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (history.changes.length === 0) {
    return (
      <div className="text-center py-8 design-text-secondary">
        No changes recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.changes.map((change) => (
        <div key={change.id} className="flex gap-4 p-4 design-bg-secondary rounded-lg border design-border">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium design-text-primary">
                {change.changed_by_user?.name || 'System'}
              </span>
              <span className="design-text-secondary text-sm">
                changed{' '}
                <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                  {change.field_name}
                </code>
              </span>
            </div>

            <div className="text-sm design-text-secondary mb-1">
              {change.old_value && (
                <span className="line-through mr-2">{change.old_value}</span>
              )}
              {change.old_value && change.new_value && '→ '}
              {change.new_value && (
                <span className="font-medium design-text-primary">{change.new_value}</span>
              )}
              {!change.old_value && !change.new_value && (
                <span className="italic">No value change recorded</span>
              )}
            </div>

            {change.change_reason && (
              <div className="text-sm italic design-text-secondary mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                Reason: {change.change_reason}
              </div>
            )}

            <div className="flex items-center gap-1 text-xs design-text-secondary mt-2">
              <Clock className="h-3 w-3" />
              {new Date(change.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvoiceHistory;
