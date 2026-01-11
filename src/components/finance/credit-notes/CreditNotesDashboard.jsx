import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, CheckCircle, XCircle } from 'lucide-react';
import { CREDIT_NOTE_STATUS, CREDIT_NOTE_STATUS_COLORS, CREDIT_NOTE_STATUS_LABELS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import { useNotification } from '../../../contexts/NotificationContext';
import NewSidebar from '../../sidebar/NewSidebar';

const CreditNotesDashboard = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();

  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadCreditNotes();
    loadStats();
  }, []);

  const loadCreditNotes = async () => {
    try {
      setLoading(true);
      const response = await creditNotesAPI.list({
        page: 1,
        per_page: 20,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      setCreditNotes(response.items || []);
    } catch (error) {
      console.error('Error loading credit notes:', error);
      showError('Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await creditNotesAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading credit note stats:', error);
    }
  };

  const handleCreateNew = () => {
    navigate('/finance/credit-notes/new');
  };

  const handleViewCreditNote = (creditNoteId) => {
    navigate(`/finance/credit-notes/${creditNoteId}`);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header */}
          <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold design-text-primary">Credit Notes</h1>
            <p className="design-text-secondary mt-1">Manage customer credit notes and refunds</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            New Credit Note
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="design-bg-primary rounded-lg p-6 border design-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm design-text-secondary">Total Credits</p>
                <p className="text-2xl font-bold design-text-primary mt-1">
                  {formatCurrency(stats.total_credits || 0, 'USD')}
                </p>
              </div>
              <FileText className="h-8 w-8 text-zenible-primary" />
            </div>
          </div>

          <div className="design-bg-primary rounded-lg p-6 border design-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm design-text-secondary">Applied</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(stats.applied_credits || 0, 'USD')}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="design-bg-primary rounded-lg p-6 border design-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm design-text-secondary">Remaining</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(stats.remaining_credits || 0, 'USD')}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="design-bg-primary rounded-lg p-6 border design-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm design-text-secondary">Draft</p>
                <p className="text-2xl font-bold design-text-primary mt-1">
                  {stats.draft_count || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 design-text-secondary" />
            </div>
          </div>
        </div>
      )}

      {/* Credit Notes Table */}
      <div className="design-bg-primary rounded-lg shadow-sm border design-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y design-border">
            <thead className="design-bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Credit Note #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y design-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
                    <p className="mt-2 text-sm design-text-secondary">Loading credit notes...</p>
                  </td>
                </tr>
              ) : creditNotes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 design-text-secondary mx-auto mb-4" />
                    <p className="text-lg font-medium design-text-primary">No credit notes yet</p>
                    <p className="text-sm design-text-secondary mt-1">Create your first credit note to get started</p>
                    <button
                      onClick={handleCreateNew}
                      className="mt-4 px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90"
                    >
                      <Plus className="h-4 w-4 inline mr-2" />
                      New Credit Note
                    </button>
                  </td>
                </tr>
              ) : (
                creditNotes.map((creditNote) => (
                  <tr
                    key={creditNote.id}
                    onClick={() => handleViewCreditNote(creditNote.id)}
                    className="hover:design-bg-tertiary cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium design-text-primary">
                        {creditNote.credit_note_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm design-text-primary">
                        {creditNote.contact ? `${creditNote.contact.first_name} ${creditNote.contact.last_name}` : 'N/A'}
                      </div>
                      {creditNote.contact?.business_name && (
                        <div className="text-xs design-text-secondary">
                          {creditNote.contact.business_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm design-text-primary">
                        {new Date(creditNote.issue_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium design-text-primary">
                        {formatCurrency(creditNote.total, creditNote.currency?.code || 'USD')}
                      </div>
                      {creditNote.remaining_amount > 0 && (
                        <div className="text-xs design-text-secondary">
                          {formatCurrency(creditNote.remaining_amount, creditNote.currency?.code || 'USD')} remaining
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${CREDIT_NOTE_STATUS_COLORS[creditNote.status]}`}>
                        {CREDIT_NOTE_STATUS_LABELS[creditNote.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default CreditNotesDashboard;
