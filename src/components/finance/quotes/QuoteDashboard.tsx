import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import QuoteList from './QuoteList';
import QuoteFormModal from './QuoteFormModal';
import NewSidebar from '../../sidebar/NewSidebar';
import quotesAPI from '../../../services/api/finance/quotes';

/**
 * Quote Dashboard matching Invoice Dashboard design specifications
 * Structure:
 * - Top Bar (64px height, border-bottom): "Quotes" title + "New Quote" button
 * - Scrollable Content: KPI cards, Status breakdown, Quotes table
 */
const QuoteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useQuotes() as any;

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Handle URL-based modal opening
  useEffect(() => {
    const checkURLForModal = async () => {
      // Check if we're on /new route
      if (location.pathname.endsWith('/new')) {
        setSelectedQuote(null);
        setShowFormModal(true);
        return;
      }

      // Check if we're on /:id/edit route
      const editMatch = location.pathname.match(/\/finance\/quotes\/([^/]+)\/edit$/);
      if (editMatch && editMatch[1]) {
        const quoteId = editMatch[1];
        try {
          const quote = await (quotesAPI as any).get(quoteId);
          setSelectedQuote(quote);
          setShowFormModal(true);
        } catch (error) {
          console.error('Failed to load quote for editing:', error);
          navigate('/finance/quotes');
        }
      }
    };

    checkURLForModal();
  }, [location.pathname, navigate]);

  // Handle modal close - navigate back to clean URL
  const handleCloseModal = () => {
    setShowFormModal(false);
    setSelectedQuote(null);
    navigate('/finance/quotes', { replace: true });
  };

  // Handle modal success - refresh list and close modal
  const handleModalSuccess = () => {
    setShowFormModal(false);
    setSelectedQuote(null);
    navigate('/finance/quotes', { replace: true });
    refresh();
  };

  // Open modal for new quote
  const handleNewQuote = () => {
    setSelectedQuote(null);
    setShowFormModal(true);
    navigate('/finance/quotes/new', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 280px)' }}
      >
        {/* Top Bar - Fixed at top, matches Figma specs */}
        <div className="bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between min-h-[64px]">
          <h1 className="text-2xl font-semibold text-[#09090b]">
            Quotes
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewQuote}
              className="inline-flex items-center gap-2 px-3 py-2.5 text-base font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Quote
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <QuoteList />
          </div>
        </div>
      </div>

      {/* Quote Form Modal */}
      <QuoteFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        quote={selectedQuote}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default QuoteDashboard;
