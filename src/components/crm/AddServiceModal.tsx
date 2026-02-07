import React, { useState, useEffect } from 'react';
import Modal from '../ui/modal/Modal';
import ServiceForm from './forms/ServiceForm';
import { useCRM } from '../../contexts/CRMContext';
import { useServices, useCompanyCurrencies } from '../../hooks/crm';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: any;
}

/**
 * Modal for adding/editing services (REFACTORED - Phase 5)
 * Now uses React Hook Form with ServiceForm component
 */
const AddServiceModal: React.FC<AddServiceModalProps> = ({ isOpen, onClose, service = null }) => {
  const { refresh } = useCRM();
  const { createService, updateService } = useServices();
  const { companyCurrencies, defaultCurrency, loading: currenciesLoading, loadData: loadCurrencies } = useCompanyCurrencies();

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load currencies when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCurrencies();
    }
  }, [isOpen, loadCurrencies]);

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      setSubmitError(null);

      if (service) {
        await updateService(service.id, formData);
      } else {
        await createService(formData);
      }

      refresh();
      onClose();
    } catch (error: any) {
      console.error('Failed to save service:', error);
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title={service ? 'Edit Service' : 'Add New Service'}
      size="lg"
    >
      {currenciesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
        </div>
      ) : (
        <>
          <ServiceForm
            service={service}
            defaultCurrency={defaultCurrency}
            companyCurrencies={companyCurrencies}
            onSubmit={handleSubmit}
            loading={loading}
            submitError={submitError}
          />

          {/* Cancel Button */}
          <div className="flex items-center justify-start gap-3 -mt-2 pt-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default AddServiceModal;
