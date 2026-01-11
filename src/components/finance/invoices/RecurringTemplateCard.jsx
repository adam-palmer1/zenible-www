import React, { useState, useEffect } from 'react';
import { Repeat, Play, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import invoicesAPI from '../../../services/api/finance/invoices';
import { useNotification } from '../../../contexts/NotificationContext';

const RecurringTemplateCard = ({ invoice, onUpdate }) => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (invoice.pricing_type === 'recurring' || invoice.is_recurring) {
      loadChildren();
    }
  }, [invoice.id]);

  const loadChildren = async () => {
    try {
      setChildrenLoading(true);
      const data = await invoicesAPI.getRecurringChildren(invoice.id);
      setChildren(data.items || []);
    } catch (error) {
      console.error('Error loading recurring children:', error);
      // Don't show error to user, just log it
    } finally {
      setChildrenLoading(false);
    }
  };

  const handleGenerateNext = async () => {
    try {
      setGenerating(true);
      const newInvoice = await invoicesAPI.generateNext(invoice.id);
      showSuccess(`Generated invoice ${newInvoice.invoice_number}`);
      loadChildren();
      if (onUpdate) onUpdate();
    } catch (error) {
      showError(error.message || 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  // Check if this is a recurring template (new format or old format)
  const isRecurringTemplate = invoice.pricing_type === 'recurring' || invoice.is_recurring;

  if (!isRecurringTemplate) {
    return null;
  }

  // Get recurring status (new field or default to active if using old format)
  const recurringStatus = invoice.recurring_status || 'active';

  // Get recurring number (new field or default to -1 for infinite)
  const recurringNumber = invoice.recurring_number !== undefined ? invoice.recurring_number : -1;

  const totalGenerated = children.length;
  const limit = recurringNumber === -1 ? '∞' : recurringNumber;
  const canGenerate = recurringStatus === 'active'
    && (recurringNumber === -1 || totalGenerated < recurringNumber);

  // Format frequency display
  const getFrequencyDisplay = () => {
    if (invoice.recurring_type === 'custom' && invoice.custom_every && invoice.custom_period) {
      return `Every ${invoice.custom_every} ${invoice.custom_period}`;
    } else if (invoice.recurring_type) {
      return invoice.recurring_type.charAt(0).toUpperCase() + invoice.recurring_type.slice(1);
    } else if (invoice.recurring_every && invoice.recurring_period) {
      // Old format
      return `Every ${invoice.recurring_every} ${invoice.recurring_period}`;
    }
    return 'Recurring';
  };

  return (
    <div className="design-bg-secondary rounded-lg p-6 border design-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold design-text-primary">Recurring Template</h3>
            <p className="text-sm design-text-secondary">
              {getFrequencyDisplay()}
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          recurringStatus === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : recurringStatus === 'paused'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        }`}>
          {recurringStatus.charAt(0).toUpperCase() + recurringStatus.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm design-text-secondary">Generated Invoices</div>
          <div className="text-2xl font-bold design-text-primary">
            {childrenLoading ? (
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            ) : (
              <>{totalGenerated} / {limit}</>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm design-text-secondary">Status</div>
          <div className="text-sm font-medium design-text-primary">
            {canGenerate ? 'Ready to generate' : recurringStatus === 'paused' ? 'Paused' : 'Limit reached'}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleGenerateNext}
          disabled={!canGenerate || generating}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Generate Next Invoice
            </>
          )}
        </button>

        <button
          onClick={() => navigate(`/finance/invoices?parent_id=${invoice.id}`)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium design-text-primary design-bg-primary rounded-md hover:design-bg-tertiary border design-border transition-colors"
          disabled={childrenLoading}
        >
          <Eye className="h-4 w-4 mr-2" />
          View All ({totalGenerated})
        </button>
      </div>
    </div>
  );
};

export default RecurringTemplateCard;
