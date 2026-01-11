import React, { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import quotesAPI from '../../../services/api/finance/quotes';

const QuoteRevisionTracker = ({ quoteId }) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quoteId) {
      loadRevisions();
    }
  }, [quoteId]);

  const loadRevisions = async () => {
    try {
      setLoading(true);
      const data = await quotesAPI.getRevisions(quoteId);
      setRevisions(data || []);
    } catch (error) {
      console.error('Error loading revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="design-bg-primary rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-zenible-primary"></div>
          <p className="mt-2 text-sm design-text-secondary">Loading revisions...</p>
        </div>
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="design-bg-primary rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold design-text-primary mb-4">Revision History</h3>
        <p className="text-sm design-text-secondary">No revisions yet</p>
      </div>
    );
  }

  return (
    <div className="design-bg-primary rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold design-text-primary mb-4">Revision History</h3>
      <div className="space-y-4">
        {revisions.map((revision, index) => (
          <div key={revision.id || index} className="design-bg-secondary rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 design-text-secondary" />
                <span className="text-sm font-medium design-text-primary">
                  {revision.created_by_name || 'System'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm design-text-secondary">
                <Clock className="h-4 w-4" />
                {new Date(revision.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-sm design-text-secondary">
              {revision.notes || 'Revision created'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuoteRevisionTracker;
