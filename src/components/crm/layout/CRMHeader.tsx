import React from 'react';
import { Link } from 'react-router-dom';

interface CRMHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children?: React.ReactNode;
}

/**
 * CRMHeader - Page header with tabs
 */
const CRMHeader: React.FC<CRMHeaderProps> = ({
  activeTab,
  setActiveTab: _setActiveTab,
  children,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 lg:px-6 lg:py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          <Link
            to="/crm"
            className={`px-4 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'crm'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            CRM
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
          <Link
            to="/crm/services"
            className={`px-4 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'services'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Services
          </Link>
          <Link
            to="/crm/projects"
            className={`px-4 py-3 lg:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Projects
          </Link>
        </div>

        {/* Right: Filters */}
        {children}
      </div>
    </div>
  );
};

export default CRMHeader;
