import React from 'react';
import { Link } from 'react-router-dom';

interface CRMHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children?: React.ReactNode;
  hasCRMAccess?: boolean;
  servicesSubtab?: string;
  onServicesSubtabChange?: (subtab: string) => void;
}

/**
 * CRMHeader - Page header with tabs
 */
const CRMHeader: React.FC<CRMHeaderProps> = ({
  activeTab,
  setActiveTab: _setActiveTab,
  children,
  hasCRMAccess = true,
  servicesSubtab,
  onServicesSubtabChange,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 lg:px-6 lg:py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Tabs */}
        {activeTab === 'services' ? (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
            <button
              onClick={() => onServicesSubtabChange?.('default')}
              className={`px-4 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                servicesSubtab === 'default'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Default Services
            </button>
            <button
              onClick={() => onServicesSubtabChange?.('client')}
              className={`px-4 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                servicesSubtab === 'client'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Client Services
            </button>
          </div>
        ) : (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
            <Link
              to="/crm"
              className={`px-4 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'crm'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Contacts
            </Link>
            <Link
              to="/crm/clients"
              className={`px-4 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Clients
            </Link>
            <Link
              to="/crm/vendors"
              className={`px-4 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'vendors'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vendors
            </Link>
          </div>
        )}

        {/* Right: Filters */}
        {children}
      </div>
    </div>
  );
};

export default CRMHeader;
