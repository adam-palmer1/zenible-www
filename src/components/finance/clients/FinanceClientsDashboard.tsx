import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import AppLayout from '../../layout/AppLayout';
import ClientsView from '../../crm/ClientsView';
import ConvertToClientModal from './ConvertToClientModal';
import { useModalState } from '../../../hooks/useModalState';

const FinanceClientsDashboard: React.FC = () => {
  const _navigate = useNavigate();
  const convertModal = useModalState();

  return (
    <AppLayout pageTitle="Clients">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold design-text-primary">Clients</h1>
              <p className="text-sm design-text-secondary mt-1">
                Manage your clients and their financial information
              </p>
            </div>
            <button
              onClick={() => convertModal.open()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Convert Contact to Client
            </button>
          </div>
        </div>

        {/* Clients View */}
        <div className="p-6">
          {/* ClientsView requires many props - cast to component type accepting partial props */}
          {React.createElement(ClientsView as React.ComponentType<{ onClientClick?: (client: unknown) => void }>, {
            onClientClick: (_client: unknown) => {
              // Navigate to contact details or open modal
            }
          })}
        </div>
      </div>

      {/* Convert to Client Modal */}
      {convertModal.isOpen && (
        <ConvertToClientModal
          isOpen={convertModal.isOpen}
          onClose={convertModal.close}
        />
      )}
    </AppLayout>
  );
};

export default FinanceClientsDashboard;
