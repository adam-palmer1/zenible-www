import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import InvoiceList from './InvoiceList';
import InvoiceFormModal from './InvoiceFormModal';
import NewSidebar from '../../sidebar/NewSidebar';

/**
 * Invoice Dashboard matching Figma design specifications
 * Structure:
 * - Top Bar (64px height, border-bottom): "Invoice" title + "New Invoice" button
 * - Scrollable Content: KPI cards, Status breakdown, Invoices table
 */
const InvoiceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getInvoice } = useInvoices();

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Handle URL-based modal opening
  useEffect(() => {
    const checkURLForModal = async () => {
      // Check if we're on /new route
      if (location.pathname.endsWith('/new')) {
        setSelectedInvoice(null);
        setShowFormModal(true);
        return;
      }

      // Check if we're on /:id/edit route
      const editMatch = location.pathname.match(/\/finance\/invoices\/([^/]+)\/edit$/);
      if (editMatch && editMatch[1]) {
        const invoiceId = editMatch[1];
        try {
          const invoice = await getInvoice(invoiceId);
          setSelectedInvoice(invoice);
          setShowFormModal(true);
        } catch (error) {
          console.error('Failed to load invoice for editing:', error);
          navigate('/finance/invoices');
        }
      }
    };

    checkURLForModal();
  }, [location.pathname, getInvoice, navigate]);

  // Handle modal close - navigate back to clean URL
  const handleCloseModal = () => {
    setShowFormModal(false);
    setSelectedInvoice(null);
    navigate('/finance/invoices', { replace: true });
  };

  // Handle modal success - refresh list and close modal
  const handleModalSuccess = () => {
    setShowFormModal(false);
    setSelectedInvoice(null);
    navigate('/finance/invoices', { replace: true });
    // InvoiceContext will automatically refresh the list
  };

  // Open modal for new invoice
  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    setShowFormModal(true);
    navigate('/finance/invoices/new', { replace: true });
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
            Invoice
          </h1>
          <button
            onClick={handleNewInvoice}
            className="inline-flex items-center gap-2 px-3 py-2.5 text-base font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Invoice
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <InvoiceList />
          </div>
        </div>
      </div>

      {/* Invoice Form Modal */}
      <InvoiceFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        invoice={selectedInvoice}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default InvoiceDashboard;
